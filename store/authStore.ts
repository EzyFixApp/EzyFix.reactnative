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
import { backgroundOrderMonitor } from '../lib/services/backgroundOrderMonitor';
import type { 
  AuthState, 
  UserData, 
  LoginRequest,
  UserType 
} from '../types/api';

// Synchronous flag outside Zustand to prevent race conditions
let isManualLogoutInProgress = false;

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

type AuthStore = AuthState & AuthActions & {
  isHandlingSessionExpired: boolean; // Internal flag to prevent duplicate calls
  isManualLogout: boolean; // Track if user manually clicked logout
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  isLoading: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  error: null,
  isHandlingSessionExpired: false, // Initialize flag
  isManualLogout: false, // Initialize manual logout flag

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
    
    // ✅ CRITICAL: Reset manual logout flag when starting new login
    // This prevents "No access" modal from previous logout session
    if (isManualLogoutInProgress) {
      if (__DEV__) logger.info('🔄 Resetting manual logout flag before login');
      isManualLogoutInProgress = false;
    }
    
    // ✅ CRITICAL: Clear ALL auth caches before login
    // This prevents role mismatch when switching between customer/technician
    clearCustomerAuthCache();
    clearTechnicianAuthCache();
    if (__DEV__) logger.info('🧹 Cleared all auth caches before login');
    
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
    const { setLoading, setError, isHandlingSessionExpired } = get();
    
    // ✅ CRITICAL: Set SYNCHRONOUS flag FIRST before any state changes
    // This prevents _layout.tsx from redirecting during logout
    isManualLogoutInProgress = true;
    if (__DEV__) logger.info('🔴 Manual logout started - synchronous flag set');
    
    // If already handling session expired, don't process logout again
    if (isHandlingSessionExpired) {
      logger.info('⏭️ Session expired in progress, skipping logout...');
      isManualLogoutInProgress = false; // Reset flag
      return;
    }
    
    try {
      // Set loading but DON'T clear isAuthenticated yet (prevents _layout redirect)
      setLoading(true);
      setError(null); // Clear any existing errors

      // Stop background order monitoring
      await backgroundOrderMonitor.stopMonitoring();

      // Call logout API (will call DELETE refresh token and clear tokenManager)
      await authService.logout();

      // Clear auth caches to prevent role mismatch warnings
      clearCustomerAuthCache();
      clearTechnicianAuthCache();

      // ✅ ONLY NOW clear isAuthenticated (after all cleanup is done)
      // At this point, sync flag is still true, so _layout won't redirect
      set({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
        isHandlingSessionExpired: false,
        isManualLogout: false
      });

      if (!silent) {
        logger.info('✅ Logout successful');
      }
      
      // ✅ Reset synchronous flag AFTER state is cleared
      // Keep it true during navigation to prevent conflicts
      // Reduced to 100ms for faster recovery
      setTimeout(() => {
        isManualLogoutInProgress = false;
        if (__DEV__) logger.info('✅ Manual logout completed - synchronous flag reset');
      }, 100); // 100ms is enough for navigation to start

    } catch (error: any) {
      logger.error('❌ Logout error:', error);
      
      // Even if logout fails, clear caches and reset local state
      clearCustomerAuthCache();
      clearTechnicianAuthCache();
      
      // Also stop background monitoring on error
      await backgroundOrderMonitor.stopMonitoring();
      
      set({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null,
        isHandlingSessionExpired: false,
        isManualLogout: false
      });
      
      // Reset synchronous flag on error too (with delay)
      setTimeout(() => {
        isManualLogoutInProgress = false;
        if (__DEV__) logger.info('⚠️ Manual logout error - synchronous flag reset');
      }, 100); // 100ms is enough
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
    
    // ✅ Reset manual logout flag when checking auth status
    // User is actively using the app, not in logout process
    if (isManualLogoutInProgress) {
      if (__DEV__) logger.info('🔄 Resetting manual logout flag during auth check');
      isManualLogoutInProgress = false;
    }
    
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
   * Prevents duplicate execution using a flag
   */
  handleSessionExpired: () => {
    const currentState = get();
    
    if (__DEV__) {
      logger.info(`🔍 [handleSessionExpired] Called - isManualLogout (sync): ${isManualLogoutInProgress}, isManualLogout (store): ${currentState.isManualLogout}, isHandlingSessionExpired: ${currentState.isHandlingSessionExpired}`);
    }
    
    // Check SYNCHRONOUS flag first (most reliable)
    if (isManualLogoutInProgress) {
      logger.info('⏭️ Manual logout in progress (sync flag), skipping session expired alert');
      return;
    }
    
    // If user is manually logging out, don't show session expired error
    if (currentState.isManualLogout) {
      logger.info('⏭️ Manual logout in progress (store flag), skipping session expired alert');
      return;
    }
    
    // Prevent multiple simultaneous session expired handlers
    if (currentState.isHandlingSessionExpired) {
      logger.info('⏭️ Session expired handler already running, skipping...');
      return;
    }
    
    logger.warn('🔒 Session expired - forcing logout');
    
    // Set flag immediately to prevent duplicate calls
    set({ isHandlingSessionExpired: true });
    
    // Stop background order monitoring
    backgroundOrderMonitor.stopMonitoring().catch(err => {
      logger.error('Error stopping background monitor:', err);
    });
    
    // Clear tokenManager cache
    tokenManager.clearTokens().catch(err => {
      logger.error('Error clearing tokens:', err);
    });
    
    // Reset store state immediately with error message
    set({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false, // IMPORTANT: Ensure loading is false to prevent UI freeze
      error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
      isHandlingSessionExpired: true // Keep flag set
    });
    
    // Auto-clear error and reset flag after 6 seconds
    setTimeout(() => {
      const state = useAuthStore.getState();
      if (!state.isAuthenticated && state.error?.includes('hết hạn')) {
        set({ error: null, isHandlingSessionExpired: false });
      } else {
        set({ isHandlingSessionExpired: false });
      }
    }, 6000);
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

/**
 * Export function to check if manual logout is in progress
 * This checks the SYNCHRONOUS flag (not Zustand state)
 * to avoid race conditions
 */
export const getIsManualLogoutInProgress = () => isManualLogoutInProgress;