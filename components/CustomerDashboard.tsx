import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import CustomerHeader from './CustomerHeader';
import HeroBanner from './HeroBanner';
import ServiceCategories from './ServiceCategories';
import { PromotionSection } from './PromotionSection';
import BottomNavigation from './BottomNavigation';

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState('home');

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
  };

  const handleViewAllPromotions = () => {
    console.log('View all promotions pressed');
  };

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    console.log('Tab pressed:', tabId);
  };

  const handleCenterButtonPress = () => {
    console.log('Logo pressed - show main menu or home');
  };

  return (
    <SafeAreaView style={styles.container}>
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
    </SafeAreaView>
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