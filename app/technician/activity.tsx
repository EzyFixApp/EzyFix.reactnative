import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import BottomNavigation from '../../components/BottomNavigation';
import TechnicianHeader from '../../components/TechnicianHeader';
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';

interface OrderItem {
  id: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  address: string;
  description: string;
  status: 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  priceRange: string;
  actualPrice?: string;
  distance: string;
  estimatedTime: string;
  appointmentDate: string;
  appointmentTime: string;
  rating?: number;
  customerReview?: string;
  paymentMethod?: 'prepaid' | 'cash' | 'card';
}

// Mock data - Current active order (only 1)
const activeOrder: OrderItem | null = {
  id: 'ORD-2024-001',
  serviceName: 'Sửa chập điện toàn bộ nhà',
  customerName: 'Nguyễn Văn Minh',
  customerPhone: '0901234567',
  address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
  description: 'Chập điện trong nhà, cần kiểm tra và sửa chữa toàn bộ hệ thống',
  status: 'in-progress',
  createdAt: '2025-10-13T08:00:00Z',
  priceRange: '500,000đ - 800,000đ',
  distance: '2.5km',
  estimatedTime: '2-3 giờ',
  appointmentDate: '13/10/2025',
  appointmentTime: '14:30',
  paymentMethod: 'cash'
};

// Mock data - Order history
const orderHistory: OrderItem[] = [
  {
    id: 'ORD-2024-002',
    serviceName: 'Thay công tắc và ổ cắm điện',
    customerName: 'Trần Thị Hoa',
    customerPhone: '0912345678',
    address: '456 Đường Nguyễn Huệ, Quận 3, TP.HCM',
    description: 'Thay 5 công tắc và 3 ổ cắm điện bị hỏng',
    status: 'completed',
    createdAt: '2025-10-12T09:00:00Z',
    completedAt: '2025-10-12T11:30:00Z',
    priceRange: '200,000đ - 350,000đ',
    actualPrice: '280,000đ',
    distance: '1.8km',
    estimatedTime: '1.5 giờ',
    appointmentDate: '12/10/2025',
    appointmentTime: '09:30',
    rating: 5,
    customerReview: 'Thợ làm việc nhanh và chuyên nghiệp. Rất hài lòng.',
    paymentMethod: 'cash'
  },
  {
    id: 'ORD-2024-003',
    serviceName: 'Sửa rò rỉ nước máy bơm',
    customerName: 'Lê Văn Đức',
    customerPhone: '0923456789',
    address: '789 Đường Võ Văn Tần, Quận 10, TP.HCM',
    description: 'Máy bơm nước bị rò rỉ, cần thay thế ống dẫn',
    status: 'completed',
    createdAt: '2025-10-11T14:00:00Z',
    completedAt: '2025-10-11T16:45:00Z',
    priceRange: '300,000đ - 500,000đ',
    actualPrice: '420,000đ',
    distance: '3.2km',
    estimatedTime: '2 giờ',
    appointmentDate: '11/10/2025',
    appointmentTime: '15:00',
    rating: 4,
    customerReview: 'Sửa tốt, giá hợp lý.',
    paymentMethod: 'prepaid'
  },
  {
    id: 'ORD-2024-004',
    serviceName: 'Lắp đặt hệ thống điện mới',
    customerName: 'Phạm Thị Lan',
    customerPhone: '0934567890',
    address: '321 Đường Hai Bà Trưng, Quận 1, TP.HCM',
    description: 'Lắp đặt hệ thống điện cho căn hộ mới',
    status: 'cancelled',
    createdAt: '2025-10-10T10:00:00Z',
    priceRange: '1,000,000đ - 1,500,000đ',
    distance: '4.5km',
    estimatedTime: '3-4 giờ',
    appointmentDate: '10/10/2025',
    appointmentTime: '13:00',
    paymentMethod: 'prepaid'
  },
  {
    id: 'ORD-2024-005',
    serviceName: 'Thông tắc đường ống nước',
    customerName: 'Hoàng Văn Nam',
    customerPhone: '0945678901',
    address: '654 Đường Cách Mạng Tháng 8, Quận Tân Bình, TP.HCM',
    description: 'Đường ống nước bị tắc nghẽn nghiêm trọng',
    status: 'completed',
    createdAt: '2025-10-09T16:30:00Z',
    completedAt: '2025-10-09T18:00:00Z',
    priceRange: '150,000đ - 250,000đ',
    actualPrice: '200,000đ',
    distance: '5.1km',
    estimatedTime: '1 giờ',
    appointmentDate: '09/10/2025',
    appointmentTime: '17:00',
    rating: 5,
    customerReview: 'Thông tắc nhanh chóng, hiệu quả.',
    paymentMethod: 'cash'
  }
];

// Helper functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatMoney = (amount: string) => {
  return amount.replace(/đ/g, 'đ');
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'in-progress':
      return '#609CEF';
    case 'completed':
      return '#10B981';
    case 'cancelled':
      return '#EF4444';
    default:
      return '#6B7280';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'in-progress':
      return 'Đang thực hiện';
    case 'completed':
      return 'Đã hoàn thành';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return 'Không xác định';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'in-progress':
      return 'build-outline';
    case 'completed':
      return 'checkmark-circle-outline';
    case 'cancelled':
      return 'close-circle-outline';
    default:
      return 'help-circle-outline';
  }
};

function ActiveOrderCard({ order }: { order: OrderItem }) {
  return (
    <View style={styles.activeOrderCard}>
      <LinearGradient
        colors={['#609CEF', '#4F8EF7']}
        style={styles.activeOrderGradient}
      >
        <View style={styles.activeOrderHeader}>
          <View style={styles.activeOrderStatus}>
            <Ionicons name={getStatusIcon(order.status)} size={20} color="white" />
            <Text style={styles.activeOrderStatusText}>{getStatusText(order.status)}</Text>
          </View>
          <Text style={styles.activeOrderId}>#{order.id.split('-').pop()}</Text>
        </View>

        <Text style={styles.activeOrderTitle}>{order.serviceName}</Text>
        
        <View style={styles.activeOrderCustomer}>
          <Ionicons name="person-outline" size={16} color="rgba(255,255,255,0.8)" />
          <Text style={styles.activeOrderCustomerName}>{order.customerName}</Text>
        </View>

        <View style={styles.activeOrderLocation}>
          <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.8)" />
          <Text style={styles.activeOrderAddress} numberOfLines={2}>{order.address}</Text>
        </View>

        <View style={styles.activeOrderInfo}>
          <View style={styles.activeOrderInfoItem}>
            <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.activeOrderInfoText}>{order.appointmentTime}</Text>
          </View>
          <View style={styles.activeOrderInfoItem}>
            <Ionicons name="cash-outline" size={16} color="rgba(255,255,255,0.8)" />
            <Text style={styles.activeOrderInfoText}>{formatMoney(order.priceRange)}</Text>
          </View>
        </View>

        <View style={styles.activeOrderActions}>
          <TouchableOpacity 
            style={styles.activeOrderCallButton}
            onPress={() => console.log(`Calling ${order.customerPhone}`)}
          >
            <Ionicons name="call" size={16} color="#609CEF" />
            <Text style={styles.activeOrderCallText}>Gọi</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.activeOrderTrackButton}
            onPress={() => router.push('./technician-order-tracking')}
          >
            <Ionicons name="navigate" size={16} color="white" />
            <Text style={styles.activeOrderTrackText}>Theo dõi</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

function HistoryOrderCard({ order }: { order: OrderItem }) {
  const handlePress = () => {
    router.push({
      pathname: '/technician/order-history-detail',
      params: { orderId: order.id }
    });
  };

  return (
    <TouchableOpacity style={styles.historyOrderCard} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.historyOrderHeader}>
        <View style={styles.historyOrderLeft}>
          <Text style={styles.historyOrderTitle}>{order.serviceName}</Text>
          <Text style={styles.historyOrderCustomer}>{order.customerName}</Text>
        </View>
        <View style={styles.historyOrderRight}>
          <View style={[styles.historyOrderStatus, { backgroundColor: getStatusColor(order.status) }]}>
            <Ionicons name={getStatusIcon(order.status)} size={12} color="white" />
            <Text style={styles.historyOrderStatusText}>{getStatusText(order.status)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.historyOrderDetails}>
        <View style={styles.historyOrderDetailItem}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.historyOrderDetailText}>
            {formatDate(order.completedAt || order.createdAt)} - {order.appointmentTime}
          </Text>
        </View>
        
        <View style={styles.historyOrderDetailItem}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.historyOrderDetailText} numberOfLines={1}>{order.address}</Text>
        </View>

        {order.actualPrice && (
          <View style={styles.historyOrderDetailItem}>
            <Ionicons name="cash-outline" size={14} color="#6B7280" />
            <Text style={styles.historyOrderDetailText}>{formatMoney(order.actualPrice)}</Text>
          </View>
        )}

        {order.rating && (
          <View style={styles.historyOrderRating}>
            <View style={styles.historyOrderStars}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name="star"
                  size={12}
                  color={i < order.rating! ? "#F59E0B" : "#E5E7EB"}
                />
              ))}
            </View>
            <Text style={styles.historyOrderRatingText}>({order.rating}/5)</Text>
          </View>
        )}
      </View>

      {order.customerReview && (
        <View style={styles.historyOrderReview}>
          <Text style={styles.historyOrderReviewText} numberOfLines={2}>
            "{order.customerReview}"
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function TechnicianActivity() {
  console.log('Activity component rendering...');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Reset and start entrance animation
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    
    // Professional smooth entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleTabPress = (tabId: string) => {
    if (tabId === 'home') {
      router.replace('/technician/dashboard');
    }
    // If tabId is 'activity', we're already on this page, so do nothing
  };

  const handleCenterButtonPress = () => {
    console.log('Logo pressed');
  };

  const handleSearchPress = () => {
    router.push('./orders');
  };

  const handleNotificationPress = () => {
    console.log('Notification pressed');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#609CEF" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header - Giống hệt Dashboard */}
      <TechnicianHeader
        title="Hoạt động"
        onSearchPress={handleSearchPress}
        onAvatarPress={handleNotificationPress}
        notificationCount={2}
      />

      {/* Scrollable Content */}
      <Animated.ScrollView 
        style={[styles.scrollContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Current Active Order */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="build-outline" size={22} color="#609CEF" />
            <Text style={styles.sectionTitle}>Đơn đang thực hiện</Text>
          </View>

          {activeOrder ? (
            <ActiveOrderCard order={activeOrder} />
          ) : (
            <View style={styles.noActiveOrderContainer}>
              <Ionicons name="clipboard-outline" size={48} color="#9CA3AF" />
              <Text style={styles.noActiveOrderTitle}>Không có đơn nào đang thực hiện</Text>
              <Text style={styles.noActiveOrderSubtitle}>
                Tất cả đơn hàng của bạn đã hoàn thành hoặc bạn chưa nhận đơn nào
              </Text>
              <TouchableOpacity 
                style={styles.browseOrdersButton}
                onPress={() => router.push('./orders')}
              >
                <Text style={styles.browseOrdersText}>Xem đơn hàng mới</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Order History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={22} color="#609CEF" />
            <Text style={styles.sectionTitle}>Lịch sử đơn hàng</Text>
            <View style={styles.historyCount}>
              <Text style={styles.historyCountText}>{orderHistory.length}</Text>
            </View>
          </View>

          <View style={styles.historyList}>
            {orderHistory.map((order, index) => (
              <HistoryOrderCard key={order.id} order={order} />
            ))}
          </View>

          {orderHistory.length === 0 && (
            <View style={styles.noHistoryContainer}>
              <Ionicons name="document-outline" size={48} color="#9CA3AF" />
              <Text style={styles.noHistoryTitle}>Chưa có lịch sử đơn hàng</Text>
              <Text style={styles.noHistorySubtitle}>
                Lịch sử các đơn hàng đã hoàn thành sẽ hiển thị ở đây
              </Text>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab="activity"
        onTabPress={handleTabPress}
        onLogoPress={handleCenterButtonPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  historyCount: {
    backgroundColor: 'rgba(96, 156, 239, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#609CEF',
  },

  // Active Order Styles
  activeOrderCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activeOrderGradient: {
    padding: 20,
  },
  activeOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeOrderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  activeOrderStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  activeOrderId: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  activeOrderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 12,
  },
  activeOrderCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  activeOrderCustomerName: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  activeOrderLocation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 16,
  },
  activeOrderAddress: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
    lineHeight: 20,
  },
  activeOrderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  activeOrderInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeOrderInfoText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  activeOrderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  activeOrderCallButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  activeOrderCallText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#609CEF',
  },
  activeOrderTrackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  activeOrderTrackText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },

  // No Active Order Styles
  noActiveOrderContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  noActiveOrderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  noActiveOrderSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  browseOrdersButton: {
    backgroundColor: '#609CEF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseOrdersText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },

  // History Order Styles
  historyList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  historyOrderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  historyOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  historyOrderLeft: {
    flex: 1,
    marginRight: 12,
  },
  historyOrderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  historyOrderCustomer: {
    fontSize: 14,
    color: '#6B7280',
  },
  historyOrderRight: {
    alignItems: 'flex-end',
  },
  historyOrderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  historyOrderStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  historyOrderDetails: {
    gap: 8,
  },
  historyOrderDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyOrderDetailText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },
  historyOrderRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyOrderStars: {
    flexDirection: 'row',
    gap: 2,
  },
  historyOrderRatingText: {
    fontSize: 12,
    color: '#6B7280',
  },
  historyOrderReview: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  historyOrderReviewText: {
    fontSize: 13,
    color: '#4B5563',
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // No History Styles
  noHistoryContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  noHistoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  noHistorySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

// Export protected component
export default withTechnicianAuth(TechnicianActivity, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});