import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface DashboardContentProps {
  currentTime: Date;
  formatTime: () => string;
  formatDate: () => string;
}

export default function DashboardContent({ currentTime, formatTime, formatDate }: DashboardContentProps) {
  const handleNewOrderPress = () => {
    router.push('/technician/orders');
  };

  const handleTrackOrderPress = () => {
    router.push({
      pathname: '/technician/order-tracking',
      params: { orderId: 'ORD-001' }
    });
  };

  const handleQuickActionPress = (action: string) => {
    switch (action) {
      case 'Đơn hàng':
        router.push('/technician/orders');
        break;
      case 'Thông tin':
        console.log('Thông tin pressed');
        break;
      case 'Cài đặt':
        console.log('Cài đặt pressed');
        break;
      case 'Thống kê':
        console.log('Thống kê pressed');
        break;
      default:
        console.log(`${action} pressed`);
    }
  };

  return (
    <ScrollView 
      style={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* Greeting Section */}
      <View style={styles.greetingSection}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.greetingTitle}>Chào bạn!</Text>
          <Text style={styles.greetingSubtitle}>Thợ Minh Tuấn</Text>
          <Text style={styles.motivationText}>Hôm nay là ngày tốt để giúp đỡ khách hàng!</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Đang sẵn sàng</Text>
        </View>
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.quickActionSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flash-outline" size={20} color="#609CEF" />
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        </View>
        
        <View style={styles.quickActionButtons}>
          <TouchableOpacity style={styles.newOrderButton} onPress={handleNewOrderPress}>
            <LinearGradient
              colors={['#10B981', '#10B981', '#10B981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.newOrderGradient}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.newOrderText}>Đơn hàng mới</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.trackOrderButton} onPress={handleTrackOrderPress}>
            <LinearGradient
              colors={['#609CEF', '#609CEF', '#609CEF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.trackOrderGradient}
            >
              <Ionicons name="location-outline" size={20} color="#FFFFFF" />
              <Text style={styles.trackOrderText}>Theo dõi đơn hàng</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  greetingSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeContainer: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  quickActionSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  quickActionButtons: {
    gap: 12,
  },
  newOrderButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  newOrderGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  newOrderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  trackOrderButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#609CEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  trackOrderGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  trackOrderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
