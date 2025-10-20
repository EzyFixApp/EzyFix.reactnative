import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import CustomerHeader from './CustomerHeader';
import HeroBanner from './HeroBanner';
import ServiceCategories from './ServiceCategories';
import { PromotionSection } from './PromotionSection';
import BottomNavigation from './BottomNavigation';
import ActiveOrdersSection from './ActiveOrdersSection';
import { useAuth } from '../store/authStore';
import AuthModal from '../components/AuthModal';

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Check authentication when component mounts and when focus returns
  useFocusEffect(
    React.useCallback(() => {
      if (!isAuthenticated) {
        setShowAuthModal(true);
      }
    }, [isAuthenticated])
  );

  // Sample hero image - using a placeholder for now
  // You can replace this with the actual service technician image
  const heroImagePlaceholder = {
    uri: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=200&fit=crop&crop=center'
  };

  const handleAvatarPress = () => {
    router.navigate('../customer/profile' as any);
  };

  const handleNotificationPress = () => {
    console.log('Notification pressed - show notifications');
    router.push('../customer/notifications' as any);
  };

  const handleLocationPress = () => {
    console.log('Location pressed - show location picker');
  };

  const handleSearchPress = () => {
    console.log('Search pressed - navigate to search');
  };

  const handleCategoryPress = (categoryId: string) => {
    console.log('Category pressed:', categoryId);
    // Navigate to category services
  };

  const handleViewAllServices = () => {
    console.log('View all services pressed');
    router.push('../customer/all-services' as any);
  };

  const handleViewAllPromotions = () => {
    console.log('View all promotions pressed');
  };

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'activity') {
      router.push('../customer/booking-history' as any);
    } else if (tabId === 'home') {
      // Already on home page
    }
  };

  const handleCenterButtonPress = () => {
    console.log('Logo pressed - show main menu or home');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <CustomerHeader
        title="Trang chủ"
        onAvatarPress={handleAvatarPress}
        onNotificationPress={handleNotificationPress}
        notificationCount={3}
      />

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Banner */}
        <HeroBanner
          imageSource={heroImagePlaceholder}
          location="133 Hai Ba Trung, Phuong Tan..."
          rating={4.8}
          isFree={true}
          onLocationPress={handleLocationPress}
          onSearchPress={handleSearchPress}
        />

        {/* Active Orders Section - Shows current orders being processed */}
        <ActiveOrdersSection />

        {/* Service Categories */}
        <ServiceCategories
          onCategoryPress={handleCategoryPress}
          onViewAllPress={handleViewAllServices}
        />

        {/* Promotions Section */}
        <PromotionSection
          onViewAllPress={handleViewAllPromotions}
        />

        {/* Bottom Spacing for Navigation */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabPress={handleTabPress}
        onLogoPress={handleCenterButtonPress}
        theme="light"
      />
      
      {/* Auth Modal */}
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // Light theme default
  },
  scrollContainer: {
    flex: 1,
  },
  bottomSpacing: {
    height: 120, // Extra space for new bottom navigation design
  },
});