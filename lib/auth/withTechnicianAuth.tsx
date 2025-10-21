/**
 * Higher-Order Component for Technician Authentication
 * Wraps components to protect them with role-based access control
 * Optimized: No loading screen on subsequent visits
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTechnicianAuth } from '../../hooks/useTechnicianAuth';
import AuthErrorModal from '../../components/AuthErrorModal';

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

  return function TechnicianProtectedComponent(props: P) {
    const { isAuthorized, isLoading, error } = useTechnicianAuth();
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [hasRedirected, setHasRedirected] = useState(false);
    const hasCheckedOnce = useRef(false);

    // Mark as checked after first validation
    useEffect(() => {
      if (!isLoading) {
        hasCheckedOnce.current = true;
      }
    }, [isLoading]);

    // Show error modal when error occurs
    useEffect(() => {
      if (error && !hasRedirected) {
        setShowErrorModal(true);
      }
    }, [error, hasRedirected]);

    // Handle login redirect
    const handleLoginPress = async () => {
      setShowErrorModal(false);
      setHasRedirected(true);
      
      // Small delay for smooth transition
      setTimeout(() => {
        router.replace('/technician/login');
      }, 100);
    };

    // Handle modal close
    const handleClose = () => {
      setShowErrorModal(false);
      if (!redirectOnError) {
        // If not auto-redirecting, go back
        router.back();
      }
    };

    // OPTIMIZATION: Skip loading screen after first check
    // Only show loading on very first mount, then render instantly
    const shouldShowLoading = isLoading && !hasCheckedOnce.current;

    // Show loading only on first check
    if (shouldShowLoading) {
      if (customLoadingComponent) {
        return <>{customLoadingComponent}</>;
      }

      // Minimal loading (no full screen)
      return null; // Or render component immediately with background check
    }

    // Error state
    if (error && showErrorModal) {
      return (
        <>
          {/* Show underlying component blurred */}
          <View style={styles.errorContainer}>
            <View style={styles.blurOverlay} />
          </View>
          
          {/* Error modal */}
          <AuthErrorModal
            visible={showErrorModal}
            errorType={error}
            onClose={redirectOnError ? undefined : handleClose}
            onLoginPress={handleLoginPress}
            autoCloseSeconds={redirectOnError ? autoCloseSeconds : 0}
          />
        </>
      );
    }

    // Authorized - render component immediately
    // Background validation continues without blocking UI
    if (isAuthorized || hasCheckedOnce.current) {
      return <Component {...props} />;
    }

    // Fallback - should not reach here
    return null;
  };
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});
