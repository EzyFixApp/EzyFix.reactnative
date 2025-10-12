import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import TechnicianHeader from '../../components/TechnicianHeader';
import BottomNavigation from '../../components/BottomNavigation';

interface OrderItem {
  id: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  address: string;
  description: string;
  images?: string[];
  status: 'pending' | 'accepted' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  priceRange: string;
  priority: 'normal' | 'urgent' | 'emergency';
  distance: string;
  estimatedTime: string;
  appointmentDate: string;
  appointmentTime: string;
}

// Mock data - Available orders (pending)
const availableOrders: OrderItem[] = [
  {
    id: '1',
    serviceName: 'Sửa điều hòa',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0901234567',
    address: '123 Lê Lợi, Q1, TP.HCM',
    description: 'Điều hòa không làm lạnh, có tiếng kêu lạ khi vận hành',
    images: [
      'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'
    ],
    status: 'pending',
    createdAt: '2025-10-13T14:30:00Z',
    priceRange: '200,000đ - 500,000đ',
    priority: 'urgent',
    distance: '2.5km',
    estimatedTime: '45 phút',
    appointmentDate: '15/10/2025',
    appointmentTime: '14:00'
  },
  {
    id: '2',
    serviceName: 'Sửa ống nước',
    customerName: 'Trần Thị B',
    customerPhone: '0912345678',
    address: '456 Nguyễn Huệ, Q1, TP.HCM',
    description: 'Ống nước bị rò rỉ dưới bồn rửa bát',
    images: [
      'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&h=300&fit=crop'
    ],
    status: 'pending',
    createdAt: '2025-10-13T15:00:00Z',
    priceRange: '150,000đ - 300,000đ',
    priority: 'normal',
    distance: '1.8km',
    estimatedTime: '30 phút',
    appointmentDate: '14/10/2025',
    appointmentTime: '09:30'
  }
];

// Mock data - Accepted orders
const acceptedOrders: OrderItem[] = [
  {
    id: '3',
    serviceName: 'Sửa tủ lạnh',
    customerName: 'Lê Văn C',
    customerPhone: '0923456789',
    address: '789 Lý Tự Trọng, Q1, TP.HCM',
    description: 'Tủ lạnh không đông đá, ngăn mát vẫn hoạt động bình thường',
    images: [
      'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=300&fit=crop'
    ],
    status: 'accepted',
    createdAt: '2025-10-13T10:00:00Z',
    priceRange: '300,000đ - 600,000đ',
    priority: 'normal',
    distance: '3.2km',
    estimatedTime: '1 giờ',
    appointmentDate: '14/10/2025',
    appointmentTime: '16:00'
  }
];

export default function TechnicianOrders() {
  const [activeTab, setActiveTab] = useState('orders');
  const [selectedTab, setSelectedTab] = useState<'available' | 'accepted'>('available');
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));

  const animateTabChange = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Helper function to mask phone number
  const maskPhoneNumber = (phone: string) => {
    if (phone.length < 4) return phone;
    return phone.substring(0, 3) + '*'.repeat(phone.length - 6) + phone.substring(phone.length - 3);
  };

  // Helper function to hide specific address, show only district/city
  const hideSpecificAddress = (fullAddress: string) => {
    // Extract district and city from address like "123 Lê Lợi, Q1, TP.HCM"
    const parts = fullAddress.split(', ');
    if (parts.length >= 2) {
      // Return only district and city parts
      return parts.slice(-2).join(', ');
    }
    return 'Khu vực TP.HCM'; // Fallback
  };

  useEffect(() => {
    animateTabChange();
  }, [selectedTab]);

  const handleTabPress = (tabId: string) => {
    if (tabId === 'home') {
      router.push('./dashboard' as any);
    } else {
      setActiveTab(tabId);
    }
  };

  const handleCenterButtonPress = () => {
    router.push('./dashboard' as any);
  };



  const handleAcceptOrder = (orderId: string) => {
    // Navigate to quote selection screen
    router.push({
      pathname: './quote-selection',
      params: { orderId }
    } as any);
  };

  const handleViewOrder = (orderId: string, status: OrderItem['status']) => {
    if (status === 'accepted' || status === 'in-progress' || status === 'completed') {
      // Navigate to technician order tracking for accepted orders
      router.push({
        pathname: './technician-order-tracking',
        params: { orderId }
      } as any);
    } else {
      // Navigate to order details for pending orders
      router.push({
        pathname: './order-details',
        params: { 
          orderId,
          canAccept: 'false'
        }
      } as any);
    }
  };

  const renderOrderCard = (order: OrderItem) => {
    const isAccepted = order.status === 'accepted';

    return (
      <TouchableOpacity
        key={order.id}
        style={[styles.orderCard, isAccepted && styles.acceptedOrderCard]}
        onPress={() => handleViewOrder(order.id, order.status)}
        activeOpacity={0.7}
      >

        {/* Order header */}
        <View style={styles.orderHeader}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{order.serviceName}</Text>
            {isAccepted && (
              <Text style={styles.customerName}>{order.customerName}</Text>
            )}
          </View>
          <View style={styles.distanceContainer}>
            <Ionicons name="location-outline" size={16} color="#609CEF" />
            <Text style={styles.distanceText}>{order.distance}</Text>
          </View>
        </View>

        {/* Order content */}
        <View style={styles.orderContent}>
          {isAccepted && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>{maskPhoneNumber(order.customerPhone)}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              {isAccepted ? order.address : hideSpecificAddress(order.address)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={16} color="#6B7280" />
            <Text style={styles.descriptionText}>{order.description}</Text>
          </View>
          {order.images && order.images.length > 0 && (
            <View style={styles.infoRow}>
              <Ionicons name="images-outline" size={16} color="#609CEF" />
              <Text style={styles.imageCountText}>{order.images.length} ảnh đính kèm</Text>
            </View>
          )}
        </View>

        {/* Price and time info */}
        <View style={styles.orderMeta}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Giá dự kiến:</Text>
            <Text style={styles.priceText}>{order.priceRange}</Text>
          </View>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.timeText}>{order.estimatedTime}</Text>
          </View>
        </View>

        {/* Enhanced Appointment Time Display */}
        <View style={styles.appointmentBanner}>
          <View style={styles.appointmentIcon}>
            <Ionicons name="calendar" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.appointmentInfo}>
            <Text style={styles.appointmentLabel}>Lịch hẹn</Text>
            <View style={styles.appointmentDateTime}>
              <Text style={styles.appointmentDate}>{order.appointmentDate}</Text>
              <View style={styles.appointmentTimeBadge}>
                <Text style={styles.appointmentTime}>{order.appointmentTime}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action button - Moved to bottom */}
        <View style={styles.orderActions}>
          {!isAccepted ? (
            <>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleAcceptOrder(order.id);
                }}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.acceptGradient}
                >
                <Ionicons name="calculator-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.acceptButtonText}>Gửi báo giá</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.tapHint}>Nhấn vào thẻ để xem chi tiết</Text>
            </>
          ) : (
            <View style={styles.acceptedStatus}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.acceptedText}>Đã nhận • Nhấn để theo dõi</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const currentOrders = selectedTab === 'available' ? availableOrders : acceptedOrders;
  
  // Debug log
  console.log('Current tab:', selectedTab);
  console.log('Available orders:', availableOrders.length);
  console.log('Accepted orders:', acceptedOrders.length);
  console.log('Current orders:', currentOrders.length);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#609CEF" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <TechnicianHeader
        title="Đơn hàng"
        onAvatarPress={() => router.push('./profile' as any)}
        notificationCount={5}
      />

      {/* Tab selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'available' && styles.activeTab]}
          onPress={() => {
            console.log('Switching to available tab');
            setSelectedTab('available');
          }}
        >
          <Text style={[styles.tabText, selectedTab === 'available' && styles.activeTabText]}>
            Có thể nhận ({availableOrders.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'accepted' && styles.activeTab]}
          onPress={() => {
            console.log('Switching to accepted tab');
            setSelectedTab('accepted');
          }}
        >
          <Text style={[styles.tabText, selectedTab === 'accepted' && styles.activeTabText]}>
            Đã nhận ({acceptedOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders list */}
      <View style={styles.ordersContainer}>
        <Animated.View style={[
          styles.animatedContent,
          {
            opacity: fadeAnim,
          }
        ]}>
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.ordersList}>
            {currentOrders.length > 0 ? (
              currentOrders.map(renderOrderCard)
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <LinearGradient
                    colors={['#F3F4F6', '#E5E7EB']}
                    style={styles.emptyIconGradient}
                  >
                    <Ionicons 
                      name={selectedTab === 'available' ? 'document-outline' : 'checkmark-done-outline'} 
                      size={48} 
                      color="#9CA3AF" 
                    />
                  </LinearGradient>
                </View>
                <Text style={styles.emptyTitle}>
                  {selectedTab === 'available' 
                    ? 'Chưa có đơn hàng mới'
                    : 'Chưa có đơn đã nhận'
                  }
                </Text>
                <Text style={styles.emptySubtitle}>
                  {selectedTab === 'available'
                    ? 'Các đơn hàng mới sẽ xuất hiện ở đây'
                    : 'Đơn hàng đã nhận sẽ hiển thị ở đây'
                  }
                </Text>
              </View>
            )}
          </View>

            <View style={styles.bottomSpacing} />
          </ScrollView>
        </Animated.View>
      </View>

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
    backgroundColor: '#F8FAFC',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#609CEF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  ordersContainer: {
    flex: 1,
    marginTop: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  ordersList: {
    paddingHorizontal: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#609CEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  acceptedOrderCard: {
    borderLeftColor: '#10B981',
    backgroundColor: '#FEFFFE',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 156, 239, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#609CEF',
    marginLeft: 4,
  },
  orderContent: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  orderActions: {
    marginTop: 12,
    marginBottom: 4,
  },
  acceptButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  acceptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  acceptedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  acceptedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 6,
  },
  orderTime: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 30,
  },
  animatedContent: {
    flex: 1,
  },
  tapHint: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  imageCountText: {
    fontSize: 14,
    color: '#609CEF',
    fontWeight: '600',
    marginLeft: 8,
  },
  // Balanced Appointment Styles for Orders List
  appointmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    marginTop: 16,
    marginBottom: 4,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#609CEF',
  },
  appointmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#609CEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  appointmentDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  appointmentDate: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  appointmentTimeBadge: {
    backgroundColor: '#609CEF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  appointmentTime: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Urgent Priority Styles
  appointmentBannerUrgent: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  appointmentIconUrgent: {
    backgroundColor: '#EF4444',
  },
  appointmentLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  appointmentTimeBadgeUrgent: {
    backgroundColor: '#EF4444',
  },
});