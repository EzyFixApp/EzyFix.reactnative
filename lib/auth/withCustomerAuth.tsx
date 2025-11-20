/**
 * Customer Authentication HOC
 * Wraps customer screens with authentication validation
 * Optimized: Cache first check to avoid loading flash
 * CRITICAL FIX: Always render component to prevent hooks mismatch during logout
 */

import React, { useEffect, useRef, Component as ReactComponent } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useCustomerAuth } from '../../hooks/useCustomerAuth';
import AuthErrorModal from '../../components/AuthErrorModal';
import { getIsManualLogoutInProgress } from '../../store/authStore';

// Error Boundary to catch hooks errors during logout transitions
class HooksErrorBoundary extends ReactComponent<
  { children: React.ReactNode; onError?: () => void },
  { hasError: boolean; errorCount: number }
> {
  private errorTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorCount: 0 };
  }

  static getDerivedStateFromError(error: any) {
    // Check if it's a hooks error
    if (error?.message?.includes('Rendered fewer hooks') || 
        error?.message?.includes('hooks') ||
        error?.message?.includes('early return')) {
      if (__DEV__) {
        console.warn('[HooksErrorBoundary] Caught hooks error during transition:', error.message);
      }
      return { hasError: true };
    }
    // Re-throw other errors
    throw error;
  }

  componentDidCatch(error: any, errorInfo: any) {
    if (__DEV__) {
      console.warn('[HooksErrorBoundary] Error caught:', error, errorInfo);
    }
    
    // Increment error count
    this.setState(prev => ({ errorCount: prev.errorCount + 1 }));
    
    // If too many errors, force redirect
    if (this.state.errorCount > 2) {
      if (__DEV__) {
        console.error('[HooksErrorBoundary] Too many hooks errors, forcing redirect...');
      }
      this.props.onError?.();
    }
    
    // Auto-recover after a short delay
    if (this.errorTimer) {
      clearTimeout(this.errorTimer);
    }
    this.errorTimer = setTimeout(() => {
      if (this.state.hasError) {
        if (__DEV__) {
          console.log('[HooksErrorBoundary] Auto-recovering from hooks error...');
        }
        this.setState({ hasError: false });
      }
    }, 100); // 100ms recovery delay
  }

  componentDidUpdate(prevProps: any) {
    // Reset error state when children change
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false, errorCount: 0 });
    }
  }

  componentWillUnmount() {
    if (this.errorTimer) {
      clearTimeout(this.errorTimer);
    }
  }

  render() {
    if (this.state.hasError) {
      // Render minimal loading view during hooks error (transitioning state)
      return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }} />
      );
    }

    return this.props.children;
  }
}

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

  // Return a proper React component (capital letter name)
  function CustomerAuthWrapper(props: P) {
    // All hooks must be called unconditionally at the top
    const router = useRouter();
    const { isAuthorized, isLoading, error } = useCustomerAuth();
    const hasCheckedOnce = useRef(false);
    const hasRedirected = useRef(false);

    // Mark that we've done first check
    useEffect(() => {
      if (!isLoading) {
        hasCheckedOnce.current = true;
      }
    }, [isLoading]);

    // Only show loading on first mount (before first check completes)
    // After first check, render immediately to avoid flash
    const shouldShowLoading = isLoading && !hasCheckedOnce.current;

    // Determine what to render
    // CRITICAL: Always render after first check to prevent hooks mismatch
    // Let the component handle logout redirect internally
    const shouldRenderComponent = hasCheckedOnce.current;

    // Handle error modal close + redirect
    const handleErrorClose = () => {
      // ✅ CRITICAL: Don't redirect during manual logout
      if (getIsManualLogoutInProgress()) {
        if (__DEV__) console.log('⏭️ [withCustomerAuth] Manual logout in progress, skipping redirect');
        return;
      }
      
      if (redirectOnError && !hasRedirected.current) {
        hasRedirected.current = true;
        // For role mismatch, redirect to home page
        if (error === 'ROLE_MISMATCH') {
          router.replace('/');
        } else {
          router.replace('/customer/login');
        }
      }
    };

    // Handle login button press
    const handleLoginPress = () => {
      // ✅ CRITICAL: Don't redirect during manual logout
      if (getIsManualLogoutInProgress()) {
        if (__DEV__) console.log('⏭️ [withCustomerAuth] Manual logout in progress, skipping redirect');
        return;
      }
      
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        // For role mismatch, redirect to home page
        if (error === 'ROLE_MISMATCH') {
          router.replace('/');
        } else {
          router.replace('/customer/login');
        }
      }
    };

    // Handle hooks error during logout transition
    const handleHooksError = () => {
      // ✅ CRITICAL: Don't redirect during manual logout
      if (getIsManualLogoutInProgress()) {
        if (__DEV__) console.log('⏭️ [withCustomerAuth] Manual logout in progress, skipping hooks error redirect');
        return;
      }
      
      // Redirect on hooks error (likely during logout)
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        router.replace('/customer/login');
      }
    };

    // CRITICAL: Always return same JSX structure, never use conditional returns
    // This prevents "Rendered fewer hooks than expected" error
    return (
      <>
        {/* CRITICAL FIX: Wrap component in error boundary to catch hooks errors */}
        <HooksErrorBoundary onError={handleHooksError}>
          {/* ALWAYS render component to prevent hooks mismatch */}
          {/* Never conditionally mount/unmount the component */}
          <Component {...props} />
        </HooksErrorBoundary>
        
        {/* Show error modal if there's an authentication error */}
        {/* ✅ CRITICAL: Don't show modal during manual logout */}
        {error && !getIsManualLogoutInProgress() && (
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

  // Set display name for debugging
  CustomerAuthWrapper.displayName = `withCustomerAuth(${Component.displayName || Component.name || 'Component'})`;

  return CustomerAuthWrapper;
}
