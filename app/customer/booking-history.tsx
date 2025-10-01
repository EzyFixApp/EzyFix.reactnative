import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Animated,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import CustomerHeader from '../../components/CustomerHeader';
import BottomNavigation from '../../components/BottomNavigation';

interface BookingItem {
  id: string;
  serviceName: string;
  servicePrice: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  status: 'searching' | 'quoted' | 'accepted' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  technicianName?: string;
  quotePrice?: string;
  notes?: string;
}

const mockBookings: BookingItem[] = [
  {
    id: '1',
    serviceName: 'Sửa điều hòa',
    servicePrice: '200,000đ - 500,000đ',
    customerName: 'Nguyễn Văn A',
    phoneNumber: '0901234567',
    address: '123 Lê Lợi, Q1, TP.HCM',
    status: 'quoted',
    createdAt: '2025-09-29T10:30:00Z',
    technicianName: 'Thợ Minh',
    quotePrice: '350,000đ',
    notes: 'Thay gas và vệ sinh máy'
  },
  {
    id: '2',
    serviceName: 'Sửa ống nước',
    servicePrice: '150,000đ - 300,000đ',
    customerName: 'Trần Thị B',
    phoneNumber: '0912345678',
    address: '456 Nguyễn Huệ, Q1, TP.HCM',
    status: 'searching',
    createdAt: '2025-09-29T14:15:00Z',
  },
  {
    id: '3',
    serviceName: 'Sửa tủ lạnh',
    servicePrice: '300,000đ - 600,000đ',
    customerName: 'Lê Văn C',
    phoneNumber: '0923456789',
    address: '789 Lý Tự Trọng, Q1, TP.HCM',
    status: 'completed',
    createdAt: '2025-09-28T09:00:00Z',
    technicianName: 'Thợ An',
    quotePrice: '450,000đ',
  }
];

export default function BookingHistory() {
  const [activeTab, setActiveTab] = useState('activity');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'searching' | 'quoted' | 'completed'>('all');
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(30);
  const scaleAnim = new Animated.Value(0.95);

  useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleTabPress = (tabId: string) => {
    if (tabId === 'home') {
      // Exit animation before navigation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        router.push('./dashboard' as any);
      });
    } else {
      setActiveTab(tabId);
    }
  };

  const handleCenterButtonPress = () => {
    // Exit animation before navigation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push('./dashboard' as any);
    });
  };

  const getStatusInfo = (status: BookingItem['status']) => {
    switch (status) {
      case 'searching':
        return {
          text: 'Đang tìm thợ',
          color: '#F59E0B',
          backgroundColor: '#FEF3C7',
          borderColor: '#F59E0B',
        };
      case 'quoted':
        return {
          text: 'Có báo giá',
          color: '#3B82F6',
          backgroundColor: '#DBEAFE',
          borderColor: '#3B82F6',
        };
      case 'completed':
        return {
          text: 'Hoàn thành',
          color: '#10B981',
          backgroundColor: '#D1FAE5',
          borderColor: '#10B981',
        };
      default:
        return {
          text: 'Đang xử lý',
          color: '#6B7280',
          backgroundColor: '#F3F4F6',
          borderColor: '#6B7280',
        };
    }
  };

  const getFilteredBookings = () => {
    if (selectedFilter === 'all') return mockBookings;
    return mockBookings.filter(booking => booking.status === selectedFilter);
  };

  const handleFilterPress = (filter: 'all' | 'searching' | 'quoted' | 'completed') => {
    if (filter !== selectedFilter) {
      setSelectedFilter(filter);
      // Smooth filter animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const renderBookingCard = (booking: BookingItem) => {
    const statusInfo = getStatusInfo(booking.status);
    
    return (
      <TouchableOpacity
        key={booking.id}
        style={styles.bookingCard}
        onPress={() => router.push({
          pathname: './booking-detail',
          params: { bookingId: booking.id }
        } as any)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{booking.serviceName}</Text>
            <Text style={styles.serviceDate}>
              {new Date(booking.createdAt).toLocaleDateString('vi-VN')} • {new Date(booking.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: statusInfo.backgroundColor }
          ]}>
            <Text style={[
              styles.statusText,
              { color: statusInfo.color }
            ]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.addressText}>{booking.address}</Text>
          </View>
          
          {booking.technicianName && (
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={16} color="#6B7280" />
              <Text style={styles.technicianText}>Thợ: {booking.technicianName}</Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Giá dịch vụ:</Text>
            <Text style={styles.priceText}>
              {booking.quotePrice || booking.servicePrice}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.viewDetails}>Xem chi tiết</Text>
          <Ionicons name="chevron-forward" size={16} color="#609CEF" />
        </View>
      </TouchableOpacity>
    );
  };

  const filteredBookings = getFilteredBookings();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#609CEF" />
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header giống CustomerDashboard */}
      <CustomerHeader
        title="Hoạt động"
        onAvatarPress={() => router.push('./profile' as any)}
        onNotificationPress={() => router.push('./notifications' as any)}
        notificationCount={3}
      />

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'all' && styles.filterButtonActive
            ]}
            onPress={() => handleFilterPress('all')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === 'all' && styles.filterButtonTextActive
            ]}>Tất cả</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'searching' && styles.filterButtonActive
            ]}
            onPress={() => handleFilterPress('searching')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === 'searching' && styles.filterButtonTextActive
            ]}>Đang tìm thợ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'quoted' && styles.filterButtonActive
            ]}
            onPress={() => handleFilterPress('quoted')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === 'quoted' && styles.filterButtonTextActive
            ]}>Có báo giá</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilter === 'completed' && styles.filterButtonActive
            ]}
            onPress={() => handleFilterPress('completed')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilter === 'completed' && styles.filterButtonTextActive
            ]}>Hoàn thành</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content Section với Animation mượt */}
      <Animated.View style={[
        styles.contentSection, 
        { 
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }
      ]}>
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
          scrollEventThrottle={16}
        >
          {/* Modern Content Header */}
          <View style={styles.simpleHeader}>
            <Text style={styles.simpleTitle}>Danh sách yêu cầu</Text>
          </View>

          <View style={styles.bookingsList}>
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking, index) => (
                <Animated.View
                  key={booking.id}
                  style={[
                    {
                      opacity: fadeAnim,
                      transform: [
                        {
                          translateY: Animated.add(
                            slideAnim,
                            new Animated.Value(index * 5)
                          )
                        }
                      ],
                    },
                  ]}
                >
                  {renderBookingCard(booking)}
                </Animated.View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <LinearGradient
                    colors={['#F3F4F6', '#E5E7EB']}
                    style={styles.emptyIconGradient}
                  >
                    <Ionicons name="document-outline" size={48} color="#9CA3AF" />
                  </LinearGradient>
                </View>
                <Text style={styles.emptyTitle}>
                  {selectedFilter === 'all' ? 'Chưa có lịch sử đặt' :
                   `Không có dịch vụ ${selectedFilter === 'searching' ? 'đang tìm thợ' :
                   selectedFilter === 'quoted' ? 'có báo giá' : 'đã hoàn thành'}`}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {selectedFilter === 'all'
                    ? 'Các yêu cầu dịch vụ của bạn sẽ hiển thị ở đây'
                    : 'Thử chọn bộ lọc khác để xem các dịch vụ'
                  }
                </Text>
                {selectedFilter === 'all' && (
                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => router.push('./all-services' as any)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#609CEF', '#4F8BE8']}
                      style={styles.createGradient}
                    >
                      <Ionicons name="add" size={20} color="white" style={styles.createIcon} />
                      <Text style={styles.createButtonText}>Đặt dịch vụ ngay</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </Animated.View>

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

  // Stats Section - giống HeroBanner
  statsSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: '48%',
    height: 100,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardActive: {
    transform: [{ scale: 1.02 }],
    shadowOpacity: 0.15,
    elevation: 4,
  },
  statCardGradient: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statIcon: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Content Section
  contentSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  scrollContainer: {
    flex: 1,
  },
  contentHeader: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  contentCount: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  // Booking Cards
  bookingsList: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
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
    color: '#1E293B',
    marginBottom: 4,
  },
  serviceDate: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 90,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 8,
    flex: 1,
  },
  technicianText: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 4,
  },
  viewDetails: {
    fontSize: 14,
    fontWeight: '600',
    color: '#609CEF',
  },

  // Empty State
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
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#609CEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  createGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  createIcon: {
    marginRight: 6,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.3,
  },

  bottomSpacing: {
    height: 30, // Enough space for bottom navigation
  },

  // Filter Section Styles
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#609CEF',
    borderColor: '#609CEF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },

  // New Content Header Styles
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(96, 156, 239, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  contentSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    lineHeight: 16,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  countBadge: {
    backgroundColor: 'rgba(96, 156, 239, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 60,
  },
  countNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#609CEF',
    lineHeight: 22,
  },
  countLabel: {
    fontSize: 10,
    color: '#609CEF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  
  // Simple Header Styles
  simpleHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  simpleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
});