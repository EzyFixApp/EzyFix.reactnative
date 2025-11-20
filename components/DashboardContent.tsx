/**
 * Dashboard Content Fragment
 * Extracted dashboard content without header/footer
 * Used in tab-based container
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import HeroBanner from './HeroBanner';
import ServiceCategories from './ServiceCategories';
import PromotionVouchersSection from './PromotionVouchersSection';
import ActiveOrdersSection from './ActiveOrdersSection';

interface DashboardContentProps {
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function DashboardContent({ onRefresh, refreshing = false }: DashboardContentProps) {
  // Sample hero image
  const heroImagePlaceholder = {
    uri: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=200&fit=crop&crop=center'
  };

  const handleLocationPress = () => {
    console.log('Location pressed - show location picker');
  };

  const handleSearchPress = () => {
    router.push('../customer/all-services' as any);
  };

  const handleCategoryPress = (categoryId: string) => {
    console.log('Category pressed:', categoryId);
    router.navigate({
      pathname: '../customer/all-services' as any,
      params: { categoryId }
    });
  };

  const handleSeeAllServices = () => {
    router.navigate('../customer/all-services' as any);
  };

  const handlePromotionPress = (promotionId: string) => {
    console.log('Promotion pressed:', promotionId);
    router.navigate({
      pathname: '../customer/promotions' as any,
      params: { promotionId }
    });
  };

  const handleSeeAllPromotions = () => {
    router.navigate('../customer/promotions' as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#609CEF']}
              tintColor="#609CEF"
            />
          ) : undefined
        }
      >
        {/* Hero Banner */}
        <HeroBanner
          location="TP. Hồ Chí Minh"
          rating={4.8}
          imageSource={heroImagePlaceholder}
          onLocationPress={handleLocationPress}
          onSearchPress={handleSearchPress}
        />

        {/* Active Orders Section */}
        <ActiveOrdersSection />

        {/* Service Categories */}
        <ServiceCategories
          onCategoryPress={handleCategoryPress}
          onViewAllPress={handleSeeAllServices}
        />

        {/* Promotion Section */}
        <PromotionVouchersSection />

        {/* Bottom spacing for better UX */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  bottomSpacing: {
    height: 40,
  },
});
