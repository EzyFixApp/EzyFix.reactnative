/**
 * Customer Authentication HOC
 * Wraps customer screens with authentication validation
 * Optimized: Cache first check to avoid loading flash
 */

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useCustomerAuth } from '../../hooks/useCustomerAuth';
import AuthErrorModal from '../../components/AuthErrorModal';

interface WithCustomerAuthOptions {
  /**
   * Whether to redirect to home page when authentication fails
   * @default true
   */
  redirectOnError?: boolean;

  /**
   * Number of seconds before auto-closing the error modal and redirecting
   * @default 3
   */
  autoCloseSeconds?: number;
}

/**
 * HOC to protect customer screens with authentication
 * 
 * @example
 * ```tsx
 * function CustomerDashboard() {
 *   return <View>...</View>;
 * }
 * 
 * export default withCustomerAuth(CustomerDashboard, {
 *   redirectOnError: true,
 *   autoCloseSeconds: 3
 * });
 * ```
 */
export default function withCustomerAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithCustomerAuthOptions = {}
) {
  const {
    redirectOnError = true,
    autoCloseSeconds = 3,
  } = options;

  return function CustomerAuthWrapper(props: P) {
    const router = useRouter();
    const { isAuthorized, isLoading, error } = useCustomerAuth();
    const hasCheckedOnce = useRef(false);

    // Mark that we've done first check
    useEffect(() => {
      if (!isLoading) {
        hasCheckedOnce.current = true;
      }
    }, [isLoading]);

    // Handle error modal close + redirect
    const handleErrorClose = () => {
      if (redirectOnError) {
        router.replace('/');
      }
    };

    // Handle login button press
    const handleLoginPress = () => {
      router.replace('/customer/login');
    };

    // Only show loading on first mount (before first check completes)
    // After first check, render immediately to avoid flash
    const shouldShowLoading = isLoading && !hasCheckedOnce.current;

    // Render the component if authorized OR we've already done first check
    // This prevents loading flash on navigation
    if (isAuthorized || hasCheckedOnce.current) {
      return (
        <>
          <Component {...props} />
          
          {/* Show error modal if there's an authentication error */}
          {error && (
            <AuthErrorModal
              visible={!!error}
              errorType={error}
              onClose={handleErrorClose}
              onLoginPress={handleLoginPress}
              autoCloseSeconds={autoCloseSeconds}
            />
          )}
        </>
      );
    }

    // Only show loading on very first mount
    if (shouldShowLoading) {
      // We don't render anything here - the cache will make this instant after first auth
      return null;
    }

    // Fallback (should rarely reach here)
    return null;
  };
}
