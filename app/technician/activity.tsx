/**
 * Technician Activity Screen - Redirect to Dashboard with Activity Tab
 * This screen now redirects to the main dashboard which handles tab switching
 * to provide a unified tab-based experience without screen transitions
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';

function TechnicianActivity() {
  useEffect(() => {
    // Redirect to dashboard with activity tab
    router.replace('/technician/dashboard?tab=activity');
  }, []);

  // Show loading while redirecting
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#609CEF" />
    </View>
  );
}

export default withTechnicianAuth(TechnicianActivity, {
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
