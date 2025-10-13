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
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';

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
  paymentMethod?: 'prepaid' | 'cash' | 'card';
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
    appointmentTime: '14:00',
    paymentMethod: 'prepaid'
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
    appointmentTime: '09:30',
    paymentMethod: 'cash'
  },
  {
    id: '3',
    serviceName: 'Lắp đặt hệ thống điện',
    customerName: 'Phạm Văn C',
    customerPhone: '0933445566',
    address: '789 Lê Văn Sỹ, Quận 3, TP.HCM',
    description: 'Lắp đặt hệ thống điện cho căn hộ mới',
    status: 'pending',
    createdAt: '2025-10-13T16:30:00Z',
    priceRange: '800,000đ - 1,200,000đ',
    priority: 'normal',
    distance: '4.2km',
    estimatedTime: '2 giờ',
    appointmentDate: '16/10/2025',
    appointmentTime: '19:00',
    paymentMethod: 'prepaid'
  },
  {
    id: '4',
    serviceName: 'Sửa máy bơm nước',
    customerName: 'Nguyễn Thị D',
    customerPhone: '0944556677',
    address: '321 Cách Mạng Tháng 8, Quận Tân Bình, TP.HCM',
    description: 'Máy bơm nước không hoạt động, cần kiểm tra và sửa chữa',
    status: 'pending',
    createdAt: '2025-10-13T17:15:00Z',
    priceRange: '300,000đ - 600,000đ',
    priority: 'urgent',
    distance: '6.5km',
    estimatedTime: '1.5 giờ',
    appointmentDate: '14/10/2025',
    appointmentTime: '07:30',
    paymentMethod: 'cash'
  },
  {
    id: '5',
    serviceName: 'Thay bóng đèn LED',
    customerName: 'Hoàng Văn E',
    customerPhone: '0955667788',
    address: '654 Võ Văn Tần, Quận 10, TP.HCM',
    description: 'Thay toàn bộ bóng đèn cũ sang LED cho văn phòng',
    status: 'pending',
    createdAt: '2025-10-13T18:00:00Z',
    priceRange: '400,000đ - 700,000đ',
    priority: 'normal',
    distance: '3.8km',
    estimatedTime: '1 giờ',
    appointmentDate: '15/10/2025',
    appointmentTime: '16:30',
    paymentMethod: 'prepaid'
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
    appointmentTime: '16:00',
    paymentMethod: 'cash'
  }
];

export default function TechnicianOrders() {
  const [selectedTab, setSelectedTab] = useState<'available' | 'accepted'>('available');
  const [fadeAnim] = useState(new Animated.Value(1));
  
  // Search and filter states
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    maxDistance: '', // '1km', '3km', '5km', '10km'
    serviceType: '', // 'điện', 'nước', 'điều hòa'
    priceRange: '', // 'under300k', '300k-500k', 'over500k'
    timeSlot: '', // 'morning', 'afternoon', 'evening'
    district: '' // 'q1', 'q3', 'q10', 'tanbinh'
  });

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

  // Filter and search functions
  const filterOrders = (orders: OrderItem[]) => {
    let filteredOrders = [...orders];

    // Text search
    if (searchText.trim()) {
      filteredOrders = filteredOrders.filter(order =>
        order.serviceName.toLowerCase().includes(searchText.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
        order.address.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Distance filter
    if (filters.maxDistance) {
      const maxKm = parseFloat(filters.maxDistance.replace('km', ''));
      filteredOrders = filteredOrders.filter(order => {
        const orderKm = parseFloat(order.distance.replace('km', ''));
        return orderKm <= maxKm;
      });
    }

    // Time slot filter
    if (filters.timeSlot) {
      filteredOrders = filteredOrders.filter(order => {
        const time = order.appointmentTime;
        const hour = parseInt(time.split(':')[0]);
        switch (filters.timeSlot) {
          case 'morning':
            return hour >= 6 && hour < 12;
          case 'afternoon':
            return hour >= 12 && hour < 18;
          case 'evening':
            return hour >= 18 && hour < 22;
          default:
            return true;
        }
      });
    }

    // District filter
    if (filters.district) {
      filteredOrders = filteredOrders.filter(order =>
        order.address.toLowerCase().includes(filters.district.toLowerCase())
      );
    }



    // Service type filter
    if (filters.serviceType) {
      filteredOrders = filteredOrders.filter(order =>
        order.serviceName.toLowerCase().includes(filters.serviceType.toLowerCase())
      );
    }

    // Price range filter
    if (filters.priceRange) {
      filteredOrders = filteredOrders.filter(order => {
        const priceText = order.priceRange.toLowerCase();
        switch (filters.priceRange) {
          case 'under300k':
            return priceText.includes('150,000') || priceText.includes('200,000');
          case '300k-500k':
            return priceText.includes('300,000') || priceText.includes('500,000');
          case 'over500k':
            return priceText.includes('600,000') || priceText.includes('800,000');
          default:
            return true;
        }
      });
    }

    return filteredOrders;
  };

  const clearFilters = () => {
    setFilters({
      maxDistance: '',
      serviceType: '',
      priceRange: '',
      timeSlot: '',
      district: ''
    });
    setSearchText('');
  };

  const hasActiveFilters = () => {
    return searchText.trim() || 
           filters.maxDistance || 
           filters.serviceType || 
           filters.priceRange ||
           filters.timeSlot ||
           filters.district;
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

  const baseOrders = selectedTab === 'available' ? availableOrders : acceptedOrders;
  const currentOrders = filterOrders(baseOrders);
  
  // Debug log
  console.log('Current tab:', selectedTab);
  console.log('Available orders:', availableOrders.length);
  console.log('Accepted orders:', acceptedOrders.length);
  console.log('Current orders:', currentOrders.length);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#609CEF" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header with Back Button */}
      <LinearGradient
        colors={['#609CEF', '#4F8EF7']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={26} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Đơn hàng</Text>
        
        {/* Empty view for centering title */}
        <View style={styles.headerRight} />
      </LinearGradient>

      {/* Search and Filter Section */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm theo dịch vụ, khách hàng, địa chỉ..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#9CA3AF"
            />
            {searchText ? (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>
          
          <TouchableOpacity 
            style={[styles.filterButton, showFilters && styles.filterButtonActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options-outline" size={20} color={showFilters ? "#609CEF" : "#6B7280"} />
            {hasActiveFilters() && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>

        {/* Filter Options */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
              {/* Distance Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Khoảng cách</Text>
                <View style={styles.filterOptions}>
                  {['1km', '3km', '5km', '10km'].map(distance => (
                    <TouchableOpacity
                      key={distance}
                      style={[styles.filterChip, filters.maxDistance === distance && styles.filterChipActive]}
                      onPress={() => setFilters({...filters, maxDistance: filters.maxDistance === distance ? '' : distance})}
                    >
                      <Text style={[styles.filterChipText, filters.maxDistance === distance && styles.filterChipTextActive]}>
                        ≤ {distance}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Time Slot Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Khung giờ</Text>
                <View style={styles.filterOptions}>
                  {[
                    { key: 'morning', label: 'Sáng (6-12h)' },
                    { key: 'afternoon', label: 'Chiều (12-18h)' },
                    { key: 'evening', label: 'Tối (18-22h)' }
                  ].map(timeSlot => (
                    <TouchableOpacity
                      key={timeSlot.key}
                      style={[styles.filterChip, filters.timeSlot === timeSlot.key && styles.filterChipActive]}
                      onPress={() => setFilters({...filters, timeSlot: filters.timeSlot === timeSlot.key ? '' : timeSlot.key})}
                    >
                      <Text style={[styles.filterChipText, filters.timeSlot === timeSlot.key && styles.filterChipTextActive]}>
                        {timeSlot.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* District Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Khu vực</Text>
                <View style={styles.filterOptions}>
                  {[
                    { key: 'Q1', label: 'Quận 1' },
                    { key: 'Q3', label: 'Quận 3' },
                    { key: 'Q10', label: 'Quận 10' },
                    { key: 'Tân Bình', label: 'Tân Bình' },
                    { key: 'Bình Thạnh', label: 'Bình Thạnh' }
                  ].map(district => (
                    <TouchableOpacity
                      key={district.key}
                      style={[styles.filterChip, filters.district === district.key && styles.filterChipActive]}
                      onPress={() => setFilters({...filters, district: filters.district === district.key ? '' : district.key})}
                    >
                      <Text style={[styles.filterChipText, filters.district === district.key && styles.filterChipTextActive]}>
                        {district.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Service Type Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Loại dịch vụ</Text>
                <View style={styles.filterOptions}>
                  {[
                    { key: 'điều hòa', label: 'Điều hòa' },
                    { key: 'điện', label: 'Điện' },
                    { key: 'nước', label: 'Nước' },
                    { key: 'tủ lạnh', label: 'Tủ lạnh' }
                  ].map(service => (
                    <TouchableOpacity
                      key={service.key}
                      style={[styles.filterChip, filters.serviceType === service.key && styles.filterChipActive]}
                      onPress={() => setFilters({...filters, serviceType: filters.serviceType === service.key ? '' : service.key})}
                    >
                      <Text style={[styles.filterChipText, filters.serviceType === service.key && styles.filterChipTextActive]}>
                        {service.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Clear Filters */}
            {hasActiveFilters() && (
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                <Ionicons name="refresh-outline" size={16} color="#EF4444" />
                <Text style={styles.clearFiltersText}>Xóa bộ lọc</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

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
            Có thể nhận ({selectedTab === 'available' ? currentOrders.length : filterOrders(availableOrders).length})
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
            Đã nhận ({selectedTab === 'accepted' ? currentOrders.length : filterOrders(acceptedOrders).length})
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
            {/* Filter Results Info */}
            {hasActiveFilters() && currentOrders.length > 0 && (
              <View style={styles.filterResultsInfo}>
                <Ionicons name="funnel-outline" size={16} color="#609CEF" />
                <Text style={styles.filterResultsText}>
                  Tìm thấy {currentOrders.length} đơn phù hợp
                </Text>
              </View>
            )}

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
                  {hasActiveFilters() 
                    ? 'Không tìm thấy đơn phù hợp'
                    : selectedTab === 'available' 
                      ? 'Chưa có đơn hàng mới'
                      : 'Chưa có đơn đã nhận'
                  }
                </Text>
                <Text style={styles.emptySubtitle}>
                  {hasActiveFilters()
                    ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                    : selectedTab === 'available'
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    minHeight: Platform.OS === 'ios' ? 100 : 80,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  headerRight: {
    width: 44,
  },
  
  // Search and Filter Styles
  searchFilterContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(96, 156, 239, 0.1)',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  filtersContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  filtersScroll: {
    flexGrow: 0,
  },
  filterGroup: {
    marginRight: 24,
    minWidth: 120,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  filterOptions: {
    flexDirection: 'column',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: 'rgba(96, 156, 239, 0.1)',
    borderColor: '#609CEF',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  filterChipTextActive: {
    color: '#609CEF',
    fontWeight: '600',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingVertical: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  filterResultsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(96, 156, 239, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  filterResultsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#609CEF',
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