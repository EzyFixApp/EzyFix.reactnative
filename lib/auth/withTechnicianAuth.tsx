/**
 * Higher-Order Component for Technician Authentication
 * Wraps components to protect them with role-based access control
 * Optimized: No loading screen on subsequent visits
 * CRITICAL FIX: Added HooksErrorBoundary to prevent logout hooks errors
 */

import React, { useEffect, useState, useRef, Component as ReactComponent } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTechnicianAuth } from '../../hooks/useTechnicianAuth';
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
        console.warn('[TechnicianHooksErrorBoundary] Caught hooks error during logout:', error.message);
      }
      return { hasError: true };
    }
    // Re-throw other errors
    throw error;
  }

  componentDidCatch(error: any, errorInfo: any) {
    if (__DEV__) {
      console.warn('[TechnicianHooksErrorBoundary] Error caught:', error, errorInfo);
    }
    
    // Increment error count
    this.setState(prev => ({ errorCount: prev.errorCount + 1 }));
    
    // If too many errors, force redirect
    if (this.state.errorCount > 2) {
      if (__DEV__) {
        console.error('[TechnicianHooksErrorBoundary] Too many hooks errors, forcing redirect...');
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
          console.log('[TechnicianHooksErrorBoundary] Auto-recovering from hooks error...');
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

interface WithTechnicianAuthOptions {
  redirectOnError?: boolean;
  autoCloseSeconds?: number;
  customLoadingComponent?: React.ReactNode;
}

/**
 * HOC to protect components with technician authentication
 * 
 * @example
 * function Dashboard() { ... }
 * export default withTechnicianAuth(Dashboard);
 * 
 * @example with options
 * export default withTechnicianAuth(Dashboard, {
 *   redirectOnError: true,
 *   autoCloseSeconds: 5
 * });
 */
export function withTechnicianAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithTechnicianAuthOptions = {}
) {
  const {
    redirectOnError = true,
    autoCloseSeconds = 3,
    customLoadingComponent,
  } = options;

  // Return a proper React component
  function TechnicianProtectedComponent(props: P) {
    // All hooks must be called unconditionally at the top
    const { isAuthorized, isLoading, error } = useTechnicianAuth();
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [hasRedirected, setHasRedirected] = useState(false);
    const hasCheckedOnce = useRef(false);
    const isMountedRef = useRef(true);

    // Track component mount state
    useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    // Mark as checked after first validation
    useEffect(() => {
      if (!isLoading && isMountedRef.current) {
        hasCheckedOnce.current = true;
      }
    }, [isLoading]);

    // Show error modal when error occurs
    useEffect(() => {
      if (error && !hasRedirected && isMountedRef.current) {
        setShowErrorModal(true);
      }
    }, [error, hasRedirected]);

    // OPTIMIZATION: Skip loading screen after first check
    // Only show loading on very first mount, then render instantly
    const shouldShowLoading = isLoading && !hasCheckedOnce.current;

    // Handle login redirect
    const handleLoginPress = async () => {
      if (!isMountedRef.current) return;
      
      setShowErrorModal(false);
      setHasRedirected(true);
      
      // Small delay for smooth transition
      setTimeout(() => {
        if (isMountedRef.current) {
          // For role mismatch, redirect to home page
          if (error === 'ROLE_MISMATCH') {
            router.replace('/');
          } else {
            router.replace('/technician/login');
          }
        }
      }, 100);
    };

    // Handle modal close
    const handleClose = () => {
      if (!isMountedRef.current) return;
      
      setShowErrorModal(false);
      if (!redirectOnError) {
        // If not auto-redirecting, go back
        router.back();
      } else if (error === 'ROLE_MISMATCH') {
        // For role mismatch, redirect to home page
        setHasRedirected(true);
        setTimeout(() => {
          if (isMountedRef.current) {
            router.replace('/');
          }
        }, 100);
      }
    };

    // Handle forced error redirect
    const handleErrorBoundaryError = () => {
      if (isMountedRef.current) {
        router.replace('/technician/login');
      }
    };

    // CRITICAL: Always return same JSX structure, never use conditional returns
    // This prevents "Rendered fewer hooks than expected" error
    // ALWAYS render component, just show modal overlay on error
    return (
      <HooksErrorBoundary onError={handleErrorBoundaryError}>
        {/* CRITICAL: ALWAYS render component to prevent hooks mismatch */}
        {/* Never conditionally mount/unmount - let ErrorBoundary catch errors */}
        <Component {...props} />
        
        {/* Show error modal overlay when authentication fails */}
        {/* ✅ CRITICAL: Don't show modal during manual logout */}
        {error && showErrorModal && !getIsManualLogoutInProgress() && (
          <>
            <View style={[StyleSheet.absoluteFillObject, styles.errorOverlay]}>
              <View style={styles.blurOverlay} />
            </View>
            
            <AuthErrorModal
              visible={showErrorModal}
              errorType={error}
              onClose={redirectOnError ? undefined : handleClose}
              onLoginPress={handleLoginPress}
              autoCloseSeconds={redirectOnError ? autoCloseSeconds : 0}
            />
          </>
        )}
      </HooksErrorBoundary>
    );
  }

  // Set display name for debugging
  TechnicianProtectedComponent.displayName = `withTechnicianAuth(${Component.displayName || Component.name || 'Component'})`;

  return TechnicianProtectedComponent;
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  errorOverlay: {
    zIndex: 1000,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});
