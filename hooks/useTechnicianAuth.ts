/**
 * Technician Authentication Hook
 * Validates technician role and token expiration
 * Optimized: Cache result, instant validation on subsequent calls
 */

import { useEffect, useState, useRef } from 'react';
import { useAuth, useAuthActions } from '../store/authStore';
import { isTokenExpired } from '../lib/auth/tokenUtils';
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

  const checkAuth = async () => {
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
        return;
      }

      // Check 2: User must be technician
      if (user.userType !== 'technician') {
        setError('ROLE_MISMATCH');
        setIsAuthorized(false);
        return;
      }

      // Check 3: Token must be valid
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) {
        setError('UNAUTHORIZED');
        setIsAuthorized(false);
        return;
      }

      // Check 4: Token must not be expired
      if (isTokenExpired(token, 5)) {
        setError('TOKEN_EXPIRED');
        setIsAuthorized(false);
        
        // Auto-logout expired session
        await logout();
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
  };

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
  }, [isAuthenticated, user]);

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
  }, [isAuthorized]);

  return {
    isAuthorized,
    isLoading: isLoading || authLoading,
    error,
    checkAuth,
  };
}
