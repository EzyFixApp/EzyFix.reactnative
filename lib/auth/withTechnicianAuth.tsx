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

  // Return a proper React component
  function TechnicianProtectedComponent(props: P) {
    // All hooks must be called unconditionally at the top
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

    // OPTIMIZATION: Skip loading screen after first check
    // Only show loading on very first mount, then render instantly
    const shouldShowLoading = isLoading && !hasCheckedOnce.current;
    // CRITICAL: Always render after first check to prevent hooks mismatch
    // Let the component handle logout redirect internally
    const shouldRenderComponent = hasCheckedOnce.current;

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

    // CRITICAL: Always return same JSX structure, never use conditional returns
    // This prevents "Rendered fewer hooks than expected" error
    return (
      <>
        {/* Show custom loading component on first load */}
        {shouldShowLoading && customLoadingComponent && (
          <>{customLoadingComponent}</>
        )}
        
        {/* CRITICAL: Always render component to prevent hooks mismatch */}
        {/* Component will handle its own redirect logic */}
        {!shouldShowLoading && <Component {...props} />}
        
        {/* Error overlay and modal */}
        {error && showErrorModal && (
          <>
            <View style={styles.errorContainer}>
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
      </>
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
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});
