import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from '../../components/BottomNavigation';
import CustomerHeader from '../../components/CustomerHeader';

const { width } = Dimensions.get('window');

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
    phoneNumber: '0987654321',
    address: '456 Nguyễn Huệ, Q1, TP.HCM',
    status: 'searching',
    createdAt: '2025-09-29T14:15:00Z',
  },
  {
    id: '3',
    serviceName: 'Sửa tủ lạnh',
    servicePrice: '300,000đ - 800,000đ',
    customerName: 'Lê Văn C',
    phoneNumber: '0912345678',
    address: '789 Đống Đa, Ba Đình, Hà Nội',
    status: 'completed',
    createdAt: '2025-09-27T09:00:00Z',
    technicianName: 'Thợ Hùng',
    quotePrice: '450,000đ',
  },
];

const getStatusInfo = (status: BookingItem['status']) => {
  switch (status) {
    case 'searching':
      return {
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        text: 'Đang tìm thợ',
        icon: 'search-outline' as const,
      };
    case 'quoted':
      return {
        color: '#3B82F6',
        bgColor: '#DBEAFE',
        text: 'Có báo giá',
        icon: 'document-text-outline' as const,
      };
    case 'accepted':
      return {
        color: '#10B981',
        bgColor: '#D1FAE5',
        text: 'Đã xác nhận',
        icon: 'checkmark-circle-outline' as const,
      };
    case 'in-progress':
      return {
        color: '#8B5CF6',
        bgColor: '#EDE9FE',
        text: 'Đang thực hiện',
        icon: 'time-outline' as const,
      };
    case 'completed':
      return {
        color: '#059669',
        bgColor: '#A7F3D0',
        text: 'Hoàn thành',
        icon: 'checkmark-done-outline' as const,
      };
    case 'cancelled':
      return {
        color: '#EF4444',
        bgColor: '#FEE2E2',
        text: 'Đã hủy',
        icon: 'close-circle-outline' as const,
      };
    default:
      return {
        color: '#6B7280',
        bgColor: '#F3F4F6',
        text: 'Không xác định',
        icon: 'help-circle-outline' as const,
      };
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function BookingHistory() {
  const [bookings, setBookings] = useState<BookingItem[]>(mockBookings);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('activity');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'searching' | 'quoted' | 'completed'>('all');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Page enter animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleBookingPress = (booking: BookingItem) => {
    router.push({
      pathname: './booking-detail' as any,
      params: {
        bookingId: booking.id,
        serviceName: booking.serviceName,
        status: booking.status,
        technicianName: booking.technicianName || '',
        quotePrice: booking.quotePrice || '',
      },
    });
  };

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'home') {
      router.push('./dashboard' as any);
    } else if (tabId === 'activity') {
      // Already on activity page
    }
  };

  const handleCenterButtonPress = () => {
    router.push('./dashboard' as any);
  };

  const handleAvatarPress = () => {
    router.push('./profile' as any);
  };

  const handleNotificationPress = () => {
    router.push('./notifications' as any);
  };

  const handleFilterPress = (filter: typeof selectedFilter) => {
    setSelectedFilter(filter);
    // Add filter animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getFilteredBookings = () => {
    if (selectedFilter === 'all') return bookings;
    return bookings.filter(booking => booking.status === selectedFilter);
  };

  const getFilterStats = () => {
    return {
      all: bookings.length,
      searching: bookings.filter(b => b.status === 'searching').length,
      quoted: bookings.filter(b => b.status === 'quoted').length,
      completed: bookings.filter(b => b.status === 'completed').length,
    };
  };

  const renderBookingItem = React.useCallback((booking: BookingItem) => {
    const statusInfo = getStatusInfo(booking.status);
    
    return (
      <TouchableOpacity
        key={booking.id}
        style={styles.bookingCard}
        onPress={() => handleBookingPress(booking)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{booking.serviceName}</Text>
            <Text style={styles.servicePrice}>{booking.servicePrice}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
            <Ionicons name={statusInfo.icon} size={12} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color="#64748B" />
            <Text style={styles.infoText}>{booking.customerName}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#64748B" />
            <Text style={styles.infoText} numberOfLines={1}>{booking.address}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#64748B" />
            <Text style={styles.infoText}>{formatDate(booking.createdAt)}</Text>
          </View>

          {booking.technicianName && (
            <View style={styles.infoRow}>
              <Ionicons name="build-outline" size={16} color="#64748B" />
              <Text style={styles.infoText}>Thợ: {booking.technicianName}</Text>
            </View>
          )}

          {booking.quotePrice && (
            <View style={styles.infoRow}>
              <Ionicons name="cash-outline" size={16} color="#609CEF" />
              <Text style={[styles.infoText, styles.priceText]}>{booking.quotePrice}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.viewDetails}>Xem chi tiết</Text>
          <Ionicons name="chevron-forward" size={16} color="#609CEF" />
        </View>
      </TouchableOpacity>
    );
  }, []);

  const filteredBookings = getFilteredBookings();
  const filterStats = getFilterStats();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header với animation */}
      <Animated.View
        style={[
          styles.headerContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <CustomerHeader
          title="Hoạt động"
          onAvatarPress={handleAvatarPress}
          onNotificationPress={handleNotificationPress}
          notificationCount={2}
        />
      </Animated.View>

      {/* Stats Cards với animation */}
      <Animated.View
        style={[
          styles.statsContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.statCard,
              selectedFilter === 'all' && styles.statCardActive,
            ]}
            onPress={() => handleFilterPress('all')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedFilter === 'all' ? ['#609CEF', '#4F8BE8'] : ['#F8FAFC', '#F8FAFC']}
              style={styles.statCardGradient}
            >
              <Ionicons
                name="apps-outline"
                size={20}
                color={selectedFilter === 'all' ? 'white' : '#64748B'}
              />
              <Text style={[
                styles.statNumber,
                { color: selectedFilter === 'all' ? 'white' : '#1F2937' }
              ]}>
                {filterStats.all}
              </Text>
              <Text style={[
                styles.statLabel,
                { color: selectedFilter === 'all' ? 'rgba(255,255,255,0.9)' : '#64748B' }
              ]}>
                Tất cả
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              selectedFilter === 'searching' && styles.statCardActive,
            ]}
            onPress={() => handleFilterPress('searching')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedFilter === 'searching' ? ['#F59E0B', '#D97706'] : ['#FEF3C7', '#FEF3C7']}
              style={styles.statCardGradient}
            >
              <Ionicons
                name="search-outline"
                size={20}
                color={selectedFilter === 'searching' ? 'white' : '#92400E'}
              />
              <Text style={[
                styles.statNumber,
                { color: selectedFilter === 'searching' ? 'white' : '#92400E' }
              ]}>
                {filterStats.searching}
              </Text>
              <Text style={[
                styles.statLabel,
                { color: selectedFilter === 'searching' ? 'rgba(255,255,255,0.9)' : '#92400E' }
              ]}>
                Đang tìm
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              selectedFilter === 'quoted' && styles.statCardActive,
            ]}
            onPress={() => handleFilterPress('quoted')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedFilter === 'quoted' ? ['#3B82F6', '#2563EB'] : ['#DBEAFE', '#DBEAFE']}
              style={styles.statCardGradient}
            >
              <Ionicons
                name="document-text-outline"
                size={20}
                color={selectedFilter === 'quoted' ? 'white' : '#1D4ED8'}
              />
              <Text style={[
                styles.statNumber,
                { color: selectedFilter === 'quoted' ? 'white' : '#1D4ED8' }
              ]}>
                {filterStats.quoted}
              </Text>
              <Text style={[
                styles.statLabel,
                { color: selectedFilter === 'quoted' ? 'rgba(255,255,255,0.9)' : '#1D4ED8' }
              ]}>
                Có báo giá
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard,
              selectedFilter === 'completed' && styles.statCardActive,
            ]}
            onPress={() => handleFilterPress('completed')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedFilter === 'completed' ? ['#10B981', '#059669'] : ['#D1FAE5', '#D1FAE5']}
              style={styles.statCardGradient}
            >
              <Ionicons
                name="checkmark-done-outline"
                size={20}
                color={selectedFilter === 'completed' ? 'white' : '#047857'}
              />
              <Text style={[
                styles.statNumber,
                { color: selectedFilter === 'completed' ? 'white' : '#047857' }
              ]}>
                {filterStats.completed}
              </Text>
              <Text style={[
                styles.statLabel,
                { color: selectedFilter === 'completed' ? 'rgba(255,255,255,0.9)' : '#047857' }
              ]}>
                Hoàn thành
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      {/* Content với animation */}
      <Animated.View
        style={[
          styles.contentWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >

          {/* Filter Info */}
          <View style={styles.filterInfo}>
            <Text style={styles.filterTitle}>
              {selectedFilter === 'all' ? 'Tất cả yêu cầu' : 
               selectedFilter === 'searching' ? 'Đang tìm thợ' :
               selectedFilter === 'quoted' ? 'Có báo giá' : 'Đã hoàn thành'}
            </Text>
            <Text style={styles.filterCount}>
              {filteredBookings.length} dịch vụ
            </Text>
          </View>

          {/* Bookings List */}
          <View style={styles.bookingsList}>
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking, index) => (
                <Animated.View
                  key={booking.id}
                  style={[
                    styles.bookingItemWrapper,
                    {
                      opacity: fadeAnim,
                      transform: [
                        { 
                          translateY: Animated.add(
                            slideAnim,
                            new Animated.Value(index * 10)
                          )
                        },
                        { scale: scaleAnim }
                      ],
                    },
                  ]}
                >
                  {renderBookingItem(booking)}
                </Animated.View>
              ))
            ) : (
              <Animated.View
                style={[
                  styles.emptyState,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                  },
                ]}
              >
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
              </Animated.View>
            )}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </Animated.View>

      {/* Bottom Navigation với animation */}
      <Animated.View
        style={[
          styles.bottomNavWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: Animated.multiply(slideAnim, -1) }],
          },
        ]}
      >
        <BottomNavigation
          activeTab={activeTab}
          onTabPress={handleTabPress}
          onLogoPress={handleCenterButtonPress}
          theme="light"
        />
      </Animated.View>
    </SafeAreaView>
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
  backButton: {
    marginLeft: -8,
  },
  headerContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerGradient: {
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  contentSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  bookingsList: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 14,
    color: '#609CEF',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  priceText: {
    fontWeight: '600',
    color: '#609CEF',
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  createGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  bottomSpacing: {
    height: 140, // Extra space for bottom navigation
  },

  // Stats Section Styles
  statsSection: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 16,
  },
  statsScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    width: 120,
    height: 90,
    borderRadius: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardActive: {
    transform: [{ scale: 1.05 }],
    shadowOpacity: 0.15,
    elevation: 6,
  },
  statCardGradient: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Filter Info Styles
  filterInfo: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  filterCount: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  // Booking Item Wrapper for Animation
  bookingItemWrapper: {
    marginBottom: 12,
  },

  // Empty State Enhanced
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
  createIcon: {
    marginRight: 6,
  },

  // Bottom Navigation Wrapper
  bottomNavWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },

  // Content Container for Animation
  contentContainer: {
    flex: 1,
  },
  
  // Missing Styles
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});