/**
 * Booking History Screen - Redirect to Dashboard with Activity Tab
 * This screen now redirects to the main dashboard with the activity tab active
 * to provide a unified tab-based experience without screen transitions
 * 
 * CRITICAL FIX: Redirect using router.replace() synchronously to avoid hooks mismatch
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import withCustomerAuth from '../../lib/auth/withCustomerAuth';

function BookingHistory() {
  // CRITICAL FIX: Redirect immediately in render, not in useEffect
  // This prevents hooks mismatch error during logout transitions
  // Using setTimeout to ensure navigation happens after render cycle
  if (typeof window !== 'undefined') {
    // Use queueMicrotask for immediate-next-tick execution (faster than setTimeout)
    queueMicrotask(() => {
      try {
        router.replace('/customer/dashboard');
      } catch (error) {
        // Silently handle navigation errors
      }
    });
  }

  // Show loading while redirecting
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#609CEF" />
    </View>
  );
}

export default withCustomerAuth(BookingHistory, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});
