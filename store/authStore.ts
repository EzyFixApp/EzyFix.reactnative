/**
 * Authentication Store using Zustand
 * Manages authentication state throughout the app
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../lib/api/auth';
import { apiService } from '../lib/api/base';
import { tokenManager } from '../lib/api/tokenManager';
import { logger } from '../lib/logger';
import { STORAGE_KEYS } from '../lib/api/config';
import { clearCustomerAuthCache } from '../hooks/useCustomerAuth';
import { clearTechnicianAuthCache } from '../hooks/useTechnicianAuth';
import type { 
  AuthState, 
  UserData, 
  LoginRequest,
  UserType 
} from '../types/api';

interface AuthActions {
  // Auth actions
  login: (credentials: LoginRequest, userType: UserType) => Promise<void>;
  logout: (silent?: boolean) => Promise<void>;
  refreshTokenAction: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  
  // State management
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setUser: (user: UserData | null) => void;
  
  // User type management
  setUserType: (userType: UserType) => Promise<void>;
  
  // Session management
  handleSessionExpired: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  isLoading: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  error: null,

  // Actions
  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  setUser: (user: UserData | null) => {
    set({ user });
  },

  login: async (credentials: LoginRequest, userType: UserType) => {
    const { setLoading, setError } = get();
    
    try {
      setLoading(true);
      setError(null);

      // Perform login with userType
      const loginResponse = await authService.loginWithUserType(credentials, userType);

      // Update tokenManager with new access token
      await tokenManager.updateAccessToken(loginResponse.accessToken);

      // Get user data
      const userData = await authService.getUserData();
      const accessToken = await authService.getAccessToken();

      // Update store state
      set({
        isAuthenticated: true,
        user: userData,
        accessToken,
        refreshToken: loginResponse.refreshToken,
        isLoading: false,
        error: null
      });

      logger.info('✅ Login successful - token cached');

    } catch (error: any) {
      logger.error('❌ Login failed:', error);
      set({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null // Don't set error message to prevent auto-alert
      });
      
      // Re-throw error for component to handle
      throw error;
    }
  },

  logout: async (silent = false) => {
    const { setLoading, setError } = get();
    
    try {
      setLoading(true);
      setError(null);

      // Call logout API (will call DELETE refresh token and clear tokenManager)
      await authService.logout();

      // Clear auth caches to prevent role mismatch warnings
      clearCustomerAuthCache();
      clearTechnicianAuthCache();

      // Reset store state
      set({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null
      });

      if (!silent) {
        logger.info('✅ Logout successful');
      }

    } catch (error: any) {
      logger.error('❌ Logout error:', error);
      
      // Even if logout fails, clear caches and reset local state WITHOUT setting error
      // (logout errors are not critical - user just wants to log out)
      clearCustomerAuthCache();
      clearTechnicianAuthCache();
      
      set({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null // Don't show error for logout failures
      });
    }
  },

  refreshTokenAction: async () => {
    const { setLoading, setError } = get();
    
    try {
      setLoading(true);
      
      const newAccessToken = await authService.refreshToken();
      
      set({
        accessToken: newAccessToken,
        isLoading: false,
        error: null
      });

    } catch (error: any) {
      if (__DEV__) console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      await get().logout();
      throw error;
    }
  },

  checkAuthStatus: async () => {
    const { setLoading } = get();
    
    try {
      setLoading(true);

      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        // Load token into tokenManager for expiry checking
        await tokenManager.loadAccessToken();
        
        const userData = await authService.getUserData();
        const accessToken = await authService.getAccessToken();
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

        set({
          isAuthenticated: true,
          user: userData,
          accessToken,
          refreshToken,
          isLoading: false,
          error: null
        });
        
        logger.info('✅ Auth status checked - token loaded into manager');
      } else {
        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
          isLoading: false,
          error: null
        });
      }

    } catch (error: any) {
      if (__DEV__) console.error('Auth status check failed:', error);
      set({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: error.message || 'Failed to check auth status'
      });
    }
  },

  setUserType: async (userType: UserType) => {
    try {
      await authService.setUserType(userType);
      
      // Update user data in store
      const userData = await authService.getUserData();
      set({ user: userData });
      
    } catch (error: any) {
      if (__DEV__) console.error('Failed to set user type:', error);
      set({ error: error.message || 'Failed to set user type' });
      throw error;
    }
  },

  /**
   * Handle session expired - called when API returns 401
   * or when refresh token fails
   */
  handleSessionExpired: () => {
    logger.warn('🔒 Session expired - forcing logout');
    
    // Clear tokenManager cache
    tokenManager.clearTokens().catch(err => {
      logger.error('Error clearing tokens:', err);
    });
    
    // Reset store state immediately
    set({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    });
  }
}));

// Setup session expired handler on module load
apiService.setOnSessionExpired(() => {
  const store = useAuthStore.getState();
  store.handleSessionExpired();
});

// Selectors for easier access to specific state
export const useAuth = () => {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    error,
    logout 
  } = useAuthStore();
  
  return {
    isAuthenticated,
    isLoading,
    user,
    error,
    logout
  };
};

export const useAuthActions = () => {
  const { 
    login, 
    logout, 
    refreshTokenAction, 
    checkAuthStatus, 
    setUserType,
    clearError 
  } = useAuthStore();
  
  return {
    login,
    logout,
    refreshToken: refreshTokenAction,
    checkAuthStatus,
    setUserType,
    clearError
  };
};