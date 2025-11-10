/**
 * Customer Dashboard Container with Tab-Based Navigation
 * Features:
 * - Tab switching between Dashboard and Activity (Booking History)
 * - Fixed header and footer
 * - Ultra-fast tab switching with pre-rendered content (< 200ms)
 * - State preservation across tabs
 * - Optimized performance with minimal re-renders
 */

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { router, Stack } from 'expo-router';
import { useAuth } from '../../store/authStore';
import withCustomerAuth from '../../lib/auth/withCustomerAuth';
import CustomerHeader from '../../components/CustomerHeader';
import BottomNavigation from '../../components/BottomNavigation';
import DashboardContent from '../../components/DashboardContent';
import BookingHistoryContent from '../../components/BookingHistoryContent';

type TabType = 'dashboard' | 'activity';

function CustomerDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  // Separate opacity animations for each tab (parallel rendering)
  const dashboardOpacity = useRef(new Animated.Value(1)).current;
  const activityOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Check authentication first
    if (!isAuthenticated) {
      router.replace('/customer/login');
      return;
    }

    // Check if user has verified their email
    // isVerify: false means user never verified their email after registration
    if (user?.isVerify === false && user?.email) {
      router.replace(`/customer/verify?email=${encodeURIComponent(user.email)}`);
      return;
    }
  }, [isAuthenticated, user?.isVerify, user?.email]);

  // Handle bottom navigation tab press with FAST parallel animation
  const handleBottomNavPress = useCallback((tabId: string) => {
    const newTab: TabType = tabId === 'home' ? 'dashboard' : 'activity';
    
    // Don't animate if already on this tab
    if (newTab === activeTab) return;

    // Update state immediately for instant response
    setActiveTab(newTab);

    // Parallel fade animation (both tabs animate at the same time)
    if (newTab === 'dashboard') {
      // Show dashboard, hide activity
      Animated.parallel([
        Animated.timing(dashboardOpacity, {
          toValue: 1,
          duration: 100, // Faster: 100ms instead of 150ms
          useNativeDriver: true,
        }),
        Animated.timing(activityOpacity, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Show activity, hide dashboard
      Animated.parallel([
        Animated.timing(dashboardOpacity, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(activityOpacity, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeTab, dashboardOpacity, activityOpacity]);

  // Handle avatar/profile press
  const handleAvatarPress = useCallback(() => {
    router.push('/customer/profile');
  }, []);

  // Handle notification press
  const handleNotificationPress = useCallback(() => {
    router.push('/customer/notifications');
  }, []);

  // Memoize header title to prevent unnecessary re-renders
  const headerTitle = useMemo(() => 
    activeTab === 'dashboard' ? 'Trang chủ' : 'Hoạt động',
    [activeTab]
  );

  // Memoize bottom nav active tab
  const bottomNavActiveTab = useMemo(() => 
    activeTab === 'dashboard' ? 'home' : 'activity',
    [activeTab]
  );

  // Show loading while checking authentication and verification
  // ✅ FIXED: Render conditionally instead of early return to avoid hooks mismatch
  if (!isAuthenticated || user?.isVerify === false) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Disable swipe back gesture to prevent returning to login */}
      <Stack.Screen 
        options={{ 
          headerShown: false,
          gestureEnabled: false, // Critical: Prevent swipe back to login screen
        }} 
      />

      {/* Fixed Header */}
      <CustomerHeader 
        title={headerTitle}
        onAvatarPress={handleAvatarPress}
        onNotificationPress={handleNotificationPress}
        notificationCount={0}
      />

      {/* Pre-rendered Content with Parallel Animations */}
      <View style={styles.contentContainer}>
        {/* Dashboard Content - Always rendered, controlled by opacity */}
        <Animated.View 
          style={[
            styles.tabContent,
            { 
              opacity: dashboardOpacity,
              zIndex: activeTab === 'dashboard' ? 1 : 0,
            }
          ]}
          pointerEvents={activeTab === 'dashboard' ? 'auto' : 'none'}
        >
          <DashboardContent />
        </Animated.View>

        {/* Activity Content - Always rendered, controlled by opacity */}
        <Animated.View 
          style={[
            styles.tabContent,
            { 
              opacity: activityOpacity,
              zIndex: activeTab === 'activity' ? 1 : 0,
            }
          ]}
          pointerEvents={activeTab === 'activity' ? 'auto' : 'none'}
        >
          <BookingHistoryContent />
        </Animated.View>
      </View>

      {/* Fixed Footer with Tab Navigation */}
      <BottomNavigation 
        activeTab={bottomNavActiveTab}
        onTabPress={handleBottomNavPress}
      />
    </View>
  );
}

export default withCustomerAuth(CustomerDashboardPage, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  tabContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});