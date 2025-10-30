/**
 * Technician Authentication Hook
 * Validates technician role and token expiration
 * Optimized: Cache result, instant validation on subsequent calls
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth, useAuthActions } from '../store/authStore';
import { isTokenExpired, getRoleFromToken, validateTokenRole } from '../lib/auth/tokenUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../lib/api/config';
import type { AuthErrorType } from '../components/AuthErrorModal';

interface UseTechnicianAuthReturn {
  isAuthorized: boolean;
  isLoading: boolean;
  error: AuthErrorType | null;
  checkAuth: () => Promise<void>;
}

// Global cache for auth state (shared across all screens)
let cachedAuthResult: {
  isAuthorized: boolean;
  error: AuthErrorType | null;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5000; // Cache for 5 seconds

export function useTechnicianAuth(): UseTechnicianAuthReturn {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { logout } = useAuthActions();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthErrorType | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  const checkIntervalRef = useRef<number | null>(null);
  const hasInitialCheck = useRef(false);

  const checkAuth = useCallback(async () => {
    try {
      // OPTIMIZATION: Use cached result if still valid
      const now = Date.now();
      if (cachedAuthResult && (now - cachedAuthResult.timestamp) < CACHE_DURATION) {
        if (__DEV__) {
          console.log('✅ Using cached auth result (fast path)');
        }
        setIsAuthorized(cachedAuthResult.isAuthorized);
        setError(cachedAuthResult.error);
        setIsLoading(false);
        return;
      }

      // Only show loading on first check
      if (!hasInitialCheck.current) {
        setIsLoading(true);
      }
      
      setError(null);

      // Check 1: User must be authenticated
      if (!isAuthenticated || !user) {
        setError('UNAUTHORIZED');
        setIsAuthorized(false);
        
        // Cache error result
        cachedAuthResult = {
          isAuthorized: false,
          error: 'UNAUTHORIZED',
          timestamp: Date.now(),
        };
        return;
      }

      // Check 2: Token must be valid
      let token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) {
        setError('UNAUTHORIZED');
        setIsAuthorized(false);
        
        // Cache error result
        cachedAuthResult = {
          isAuthorized: false,
          error: 'UNAUTHORIZED',
          timestamp: Date.now(),
        };
        return;
      }

      // Check 3: Token must not be expired - Try to refresh if expired
      if (isTokenExpired(token, 5)) {
        if (__DEV__) {
          console.log('[useTechnicianAuth] Token expired - attempting refresh...');
        }
        
        try {
          // Try to get a valid token via token manager (auto-refresh)
          const { tokenManager } = await import('../lib/api/tokenManager');
          const newToken = await tokenManager.getValidAccessToken();
          
          if (!newToken) {
            // Refresh failed - logout
            setError('TOKEN_EXPIRED');
            setIsAuthorized(false);
            await logout();
            
            cachedAuthResult = {
              isAuthorized: false,
              error: 'TOKEN_EXPIRED',
              timestamp: Date.now(),
            };
            return;
          }
          
          // Refresh successful - continue with new token
          if (__DEV__) {
            console.log('[useTechnicianAuth] Token refresh successful, continuing...');
          }
          // Update token variable to use the new one
          token = newToken;
        } catch (refreshError) {
          // Refresh failed - logout
          if (__DEV__) {
            console.error('[useTechnicianAuth] Token refresh failed:', refreshError);
          }
          setError('TOKEN_EXPIRED');
          setIsAuthorized(false);
          await logout();
          
          cachedAuthResult = {
            isAuthorized: false,
            error: 'TOKEN_EXPIRED',
            timestamp: Date.now(),
          };
          return;
        }
      }

      // Check 4: CRITICAL - Validate role from JWT token (not from store)
      // This prevents role manipulation via AsyncStorage
      const roleFromToken = getRoleFromToken(token);
      
      if (!roleFromToken) {
        setError('UNAUTHORIZED');
        setIsAuthorized(false);
        
        // Auto-logout on invalid token
        await logout();
        
        // Cache error result
        cachedAuthResult = {
          isAuthorized: false,
          error: 'UNAUTHORIZED',
          timestamp: Date.now(),
        };
        return;
      }

      // Check if role from JWT matches technician role
      if (roleFromToken !== 'technician') {
        setError('ROLE_MISMATCH');
        setIsAuthorized(false);
        
        // Cache error result WITHOUT auto-logout
        // Let the component handle the error (e.g., show "not authorized" message)
        // DON'T auto-logout because user might be on homepage with customer role
        cachedAuthResult = {
          isAuthorized: false,
          error: 'ROLE_MISMATCH',
          timestamp: Date.now(),
        };
        
        if (__DEV__) {
          console.warn(`[useTechnicianAuth] Role mismatch: Expected 'technician', got '${roleFromToken}'`);
        }
        return;
      }

      // Additional check: User data should also match (defense in depth)
      if (user.userType !== 'technician') {
        setError('ROLE_MISMATCH');
        setIsAuthorized(false);
        
        // Cache error result WITHOUT auto-logout
        cachedAuthResult = {
          isAuthorized: false,
          error: 'ROLE_MISMATCH',
          timestamp: Date.now(),
        };
        
        if (__DEV__) {
          console.warn(`[useTechnicianAuth] User data role mismatch: Expected 'technician', got '${user.userType}'`);
        }
        return;
      }

      // All checks passed
      setIsAuthorized(true);
      setError(null);
      
      // Cache successful result
      cachedAuthResult = {
        isAuthorized: true,
        error: null,
        timestamp: Date.now(),
      };
      
    } catch (err) {
      if (__DEV__) {
        console.error('Error checking technician auth:', err);
      }
      setError('SESSION_INVALID');
      setIsAuthorized(false);
      
      // Cache error result
      cachedAuthResult = {
        isAuthorized: false,
        error: 'SESSION_INVALID',
        timestamp: Date.now(),
      };
    } finally {
      setIsLoading(false);
      hasInitialCheck.current = true;
    }
  }, [isAuthenticated, user, logout]);

  // Initial check on mount
  useEffect(() => {
    // Use cached result for instant validation
    if (cachedAuthResult && (Date.now() - cachedAuthResult.timestamp) < CACHE_DURATION) {
      setIsAuthorized(cachedAuthResult.isAuthorized);
      setError(cachedAuthResult.error);
      setIsLoading(false);
      hasInitialCheck.current = true;
    } else {
      checkAuth();
    }
  }, [isAuthenticated, user, checkAuth]);

  // Periodic token validation (every 60 seconds)
  useEffect(() => {
    // Clear any existing interval
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }

    // Only start interval if authorized
    if (isAuthorized) {
      checkIntervalRef.current = setInterval(() => {
        if (__DEV__) {
          console.log('🔍 Periodic auth check for technician...');
        }
        checkAuth();
      }, 60 * 1000) as unknown as number; // Check every 60 seconds
    }

    // Cleanup
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [isAuthorized, checkAuth]);

  return {
    isAuthorized,
    isLoading: isLoading || authLoading,
    error,
    checkAuth,
  };
}
