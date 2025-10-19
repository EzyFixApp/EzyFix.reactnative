/**
 * Authentication Store using Zustand
 * Manages authentication state throughout the app
 */

import { create } from 'zustand';
import { authService } from '../lib/api/auth';
import { logger } from '../lib/logger';
import type { 
  AuthState, 
  UserData, 
  LoginRequest,
  UserType 
} from '../types/api';

interface AuthActions {
  // Auth actions
  login: (credentials: LoginRequest, userType: UserType) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokenAction: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  
  // State management
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setUser: (user: UserData | null) => void;
  
  // User type management
  setUserType: (userType: UserType) => Promise<void>;
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

    } catch (error: any) {
      // Don't log expected authentication failures  
      if (error.status_code !== 401) {
        logger.error('Unexpected login error:', error);
      }
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
      throw error;
    }
  },

  logout: async () => {
    const { setLoading, setError } = get();
    
    try {
      setLoading(true);
      setError(null);

      await authService.logout();

      // Reset store state
      set({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: null
      });

    } catch (error: any) {
      logger.error('Logout failed:', error);
      // Even if logout fails, reset local state
      set({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        error: error.message || 'Logout failed'
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
      logger.error('Token refresh failed:', error);
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
        const userData = await authService.getUserData();
        const accessToken = await authService.getAccessToken();

        set({
          isAuthenticated: true,
          user: userData,
          accessToken,
          isLoading: false,
          error: null
        });
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
      logger.error('Auth status check failed:', error);
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
      logger.error('Failed to set user type:', error);
      set({ error: error.message || 'Failed to set user type' });
      throw error;
    }
  }
}));

// Selectors for easier access to specific state
export const useAuth = () => {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    error 
  } = useAuthStore();
  
  return {
    isAuthenticated,
    isLoading,
    user,
    error
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