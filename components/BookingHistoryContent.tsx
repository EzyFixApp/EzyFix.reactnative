/**
 * Booking History Content Fragment
 * Extracted booking history content without header/footer
 * Used in tab-based container
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { serviceRequestService } from '../lib/api/serviceRequests';
import { servicesService } from '../lib/api/services';
import { addressService } from '../lib/api/addresses';
import { ServiceRequestResponse } from '../types/api';
import { useAuth } from '../store/authStore';

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
  addressNote?: string;
  requestedDate?: string;
  expectedStartTime?: string;
}

// Check if booking is trackable (active order)
const isTrackableStatus = (status: BookingItem['status']): boolean => {
  return status !== 'completed' && status !== 'cancelled';
};

interface BookingHistoryContentProps {
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function BookingHistoryContent({ onRefresh, refreshing: externalRefreshing }: BookingHistoryContentProps) {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const { isAuthenticated } = useAuth();

  // Map API status to UI status
  const mapApiStatus = (apiStatus: string): BookingItem['status'] => {
    switch (apiStatus.toLowerCase()) {
      case 'pending':
      case 'waiting':
        return 'searching';
      case 'quoted':
        return 'quoted';
      case 'accepted':
        return 'accepted';
      case 'in_progress':
      case 'in-progress':
        return 'in-progress';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'searching';
    }
  };

  // Load bookings from API
  const loadBookings = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Get service requests
      const serviceRequests = await serviceRequestService.getUserServiceRequests();
      
      // Transform API data to BookingItem format
      const transformedBookings: BookingItem[] = await Promise.all(
        serviceRequests.map(async (request) => {
          
          let serviceName = 'Dịch vụ';
          let addressText = 'Địa chỉ chưa cập nhật';

          try {
            // Get service details for name
            const service = await servicesService.getServiceById(request.serviceId);
            serviceName = service.serviceName || service.description || 'Dịch vụ';
          } catch (error) {
            serviceName = request.serviceDescription || 'Dịch vụ';
          }

          // Get address details from addressID
          if (request.addressID) {
            try {
              const addressResponse = await addressService.getAddressById(request.addressID);
              const address = addressResponse as any;
              addressText = address.street || 'Địa chỉ chưa cập nhật';
            } catch (error) {
              addressText = request.addressNote || 'Địa chỉ chưa cập nhật';
            }
          } else {
            addressText = request.addressNote || 'Địa chỉ chưa cập nhật';
          }
          
          const transformedItem = {
            id: request.id || `booking-${Date.now()}-${Math.random()}`,
            serviceName: serviceName,
            servicePrice: 'Đang cập nhật',
            customerName: '',
            phoneNumber: '',
            address: addressText,
            status: mapApiStatus(request.status),
            createdAt: request.createdAt || new Date().toISOString(),
            notes: request.serviceDescription,
            addressNote: request.addressNote,
            requestedDate: request.requestedDate,
            expectedStartTime: request.expectedStartTime,
          };
          
          return transformedItem;
        })
      );
      
      setBookings(transformedBookings);
      
    } catch (error: any) {
      if (__DEV__) console.error('Error loading bookings:', error);
      
      // Handle common errors
      if (error.status_code === 403) {
        Alert.alert(
          'Lỗi truy cập',
          'Không có quyền truy cập lịch sử đặt lịch. Vui lòng đăng nhập lại.',
          [{ text: 'OK', onPress: () => router.push('./login' as any) }]
        );
      } else {
        Alert.alert(
          'Lỗi',
          'Không thể tải lịch sử đặt lịch. Vui lòng thử lại sau.',
          [{ text: 'OK' }]
        );
      }
      
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data when component mounts or is focused
  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) {
        loadBookings();
      }
    }, [isAuthenticated])
  );

  // Handle refresh
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    loadBookings(true);
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

  const renderBookingCard = (booking: BookingItem) => {
    const statusInfo = getStatusInfo(booking.status);
    
    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => router.push({
          pathname: './order-tracking',
          params: { orderId: booking.id }
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
          {isTrackableStatus(booking.status) ? (
            <TouchableOpacity
              style={styles.trackButton}
              onPress={(e) => {
                e.stopPropagation();
                router.push({
                  pathname: './order-tracking',
                  params: { orderId: booking.id }
                } as any);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="location" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.trackButtonText}>Theo dõi đơn</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={styles.viewDetails}>Xem đơn hàng</Text>
              <Ionicons name="chevron-forward" size={16} color="#609CEF" />
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={externalRefreshing || refreshing}
            onRefresh={handleRefresh}
            colors={['#609CEF']}
            tintColor="#609CEF"
          />
        }
      >
        {/* Simple Header */}
        <View style={styles.simpleHeader}>
          <Text style={styles.simpleTitle}>Danh sách yêu cầu</Text>
        </View>

        <View style={styles.bookingsList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Đang tải lịch sử đặt lịch...</Text>
            </View>
          ) : bookings.length > 0 ? (
            bookings.map((booking: BookingItem, index: number) => (
              <View key={booking.id || `booking-${index}`}>
                {renderBookingCard(booking)}
              </View>
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
                Chưa có lịch sử đặt lịch
              </Text>
              <Text style={styles.emptySubtitle}>
                Các yêu cầu dịch vụ của bạn sẽ hiển thị ở đây
              </Text>
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
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
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
  scrollContainer: {
    flex: 1,
  },

  // Simple Header Styles
  simpleHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  simpleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },

  // Booking Cards
  bookingsList: {
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    paddingBottom: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
  trackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#609CEF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    shadowColor: '#609CEF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
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

  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },

  bottomSpacing: {
    height: 40,
  },
});
