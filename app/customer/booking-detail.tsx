import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import CustomerHeader from '../../components/CustomerHeader';
import { serviceRequestService } from '../../lib/api/serviceRequests';
import { servicesService } from '../../lib/api/services';
import { ServiceRequestResponse } from '../../types/api';
import { useAuth } from '../../store/authStore';
import withCustomerAuth from '../../lib/auth/withCustomerAuth';
import AuthModal from '../../components/AuthModal';

interface BookingDetail {
  id: string;
  serviceName: string;
  servicePrice: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  status: 'searching' | 'quoted' | 'accepted' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  requestedDate?: string;
  expectedStartTime?: string;
  serviceDescription?: string;
  technicianName?: string;
  quotePrice?: string;
  notes?: string;
}

function BookingDetail() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Auto-refresh interval (30 seconds)
  const REFRESH_INTERVAL = 30000;

  // Check authentication when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (!isAuthenticated) {
        setShowAuthModal(true);
      }
    }, [isAuthenticated])
  );

  // Map API status to UI status
  const mapApiStatus = (apiStatus: string): BookingDetail['status'] => {
    switch (apiStatus?.toUpperCase()) {
      case 'PENDING':
      case 'WAITING':
        return 'searching';
      case 'QUOTED':
        return 'quoted';
      case 'QUOTE_ACCEPTED':
      case 'ACCEPTED':
        return 'accepted';
      case 'IN_PROGRESS':
      case 'INPROGRESS':
        return 'in-progress';
      case 'COMPLETED':
        return 'completed';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'searching';
    }
  };

  // Load booking details from API
  const loadBookingDetail = async (silent = false) => {
    if (!orderId) {
      Alert.alert('Lỗi', 'Không tìm thấy ID đơn hàng');
      router.back();
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
      }
      
      if (__DEV__) {
        console.log('Loading booking detail for orderId:', orderId);
      }
      
      // Get service request details
      const serviceRequest = await serviceRequestService.getServiceRequestById(orderId);
      
      if (__DEV__) {
        console.log('Service request loaded:', serviceRequest);
      }
      
      let serviceName = 'Dịch vụ';
      let servicePrice = 'Đang cập nhật';
      
      try {
        // Get service details for name and price
        const service = await servicesService.getServiceById(serviceRequest.serviceId);
        serviceName = service.serviceName || service.description || 'Dịch vụ';
        
        // Format price if available
        if (service.basePrice) {
          const price = service.basePrice;
          if (price > 0) {
            servicePrice = new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(price);
          }
        }
        
        // Truncate service name if too long
        if (serviceName.length > 50) {
          serviceName = serviceName.substring(0, 50) + '...';
        }
      } catch (error) {
        // Fallback to description
        serviceName = serviceRequest.serviceDescription || 'Dịch vụ';
        if (serviceName.length > 50) {
          serviceName = serviceName.substring(0, 50) + '...';
        }
        if (__DEV__) {
          console.warn(`Failed to get service details for ${serviceRequest.serviceId}:`, error);
        }
      }
      
      // Transform API data to BookingDetail format
      const transformedBooking: BookingDetail = {
        id: serviceRequest.requestID,
        serviceName: serviceName,
        servicePrice: servicePrice,
        customerName: serviceRequest.fullName || user?.fullName || 'Chưa cập nhật', 
        phoneNumber: serviceRequest.phoneNumber || user?.phoneNumber || 'Chưa cập nhật',
        address: serviceRequest.requestAddress || serviceRequest.addressNote || 'Địa chỉ chưa cập nhật',
        status: mapApiStatus(serviceRequest.status),
        createdAt: serviceRequest.createdDate || serviceRequest.requestedDate,
        requestedDate: serviceRequest.requestedDate,
        expectedStartTime: serviceRequest.expectedStartTime,
        serviceDescription: serviceRequest.serviceDescription,
        notes: serviceRequest.serviceDescription,
        // TODO: Add these when technician and quote APIs are available
        technicianName: undefined,
        quotePrice: undefined,
      };
      
      setBooking(transformedBooking);
      
    } catch (error: any) {
      if (__DEV__) console.error('Error loading booking detail:', error);
      
      // Handle common errors
      if (error.status_code === 404) {
        Alert.alert(
          'Không tìm thấy',
          'Không tìm thấy chi tiết đơn hàng này.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else if (error.status_code === 403) {
        Alert.alert(
          'Lỗi truy cập',
          'Không có quyền truy cập chi tiết đơn hàng này.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else if (error.status_code === 401) {
        setShowAuthModal(true);
      } else {
        if (!silent) {
          Alert.alert(
            'Lỗi',
            'Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.',
            [
              { text: 'Thử lại', onPress: () => loadBookingDetail() },
              { text: 'Quay lại', onPress: () => router.back() }
            ]
          );
        }
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadBookingDetail();
    
    // Set up auto-refresh interval for real-time updates
    const interval = setInterval(() => {
      if (__DEV__) {
        console.log('BookingDetail: Auto-refreshing booking detail...');
      }
      loadBookingDetail(true); // Silent refresh
    }, REFRESH_INTERVAL);

    // Cleanup interval on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
        if (__DEV__) {
          console.log('BookingDetail: Cleared refresh interval');
        }
      }
    };
  }, [orderId]);

  // Manual refresh function
  const refreshBookingDetail = async () => {
    if (__DEV__) {
      console.log('BookingDetail: Manual refresh triggered');
    }
    await loadBookingDetail();
  };

  const getStatusInfo = (status: BookingDetail['status']) => {
    switch (status) {
      case 'searching':
        return {
          text: 'Đang tìm thợ',
          color: '#609CEF',
          backgroundColor: '#E5F0FF',
          icon: 'search-outline',
        };
      case 'quoted':
        return {
          text: 'Có báo giá',
          color: '#4F8BE8',
          backgroundColor: '#E5F0FF',
          icon: 'document-text-outline',
        };
      case 'accepted':
        return {
          text: 'Đã xác nhận',
          color: '#609CEF',
          backgroundColor: '#E5F0FF',
          icon: 'checkmark-circle-outline',
        };
      case 'in-progress':
        return {
          text: 'Đang thực hiện',
          color: '#4F8BE8',
          backgroundColor: '#E5F0FF',
          icon: 'build-outline',
        };
      case 'completed':
        return {
          text: 'Hoàn thành',
          color: '#10B981',
          backgroundColor: '#D1FAE5',
          icon: 'checkmark-done-outline',
        };
      case 'cancelled':
        return {
          text: 'Đã hủy',
          color: '#EF4444',
          backgroundColor: '#FEE2E2',
          icon: 'close-circle-outline',
        };
      default:
        return {
          text: 'Đang xử lý',
          color: '#609CEF',
          backgroundColor: '#E5F0FF',
          icon: 'time-outline',
        };
    }
  };

  const handleAcceptQuote = async () => {
    if (!booking) return;
    
    setLoadingAction(true);
    try {
      // TODO: Implement accept quote API when available
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Thành công', 'Đã chấp nhận báo giá!');
      router.back();
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRejectQuote = () => {
    if (!booking) return;
    
    Alert.alert(
      'Từ chối báo giá',
      'Bạn có chắc chắn muốn từ chối báo giá này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Từ chối', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement reject quote API when available
            Alert.alert('Đã từ chối', 'Báo giá đã được từ chối!');
            router.back();
          }
        }
      ]
    );
  };

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#609CEF" translucent={false} />
        <Stack.Screen options={{ headerShown: false }} />
        
        <View style={styles.safeAreaContainer}>
          <View style={styles.customHeaderWrapper}>
            <LinearGradient
              colors={['#609CEF', '#3B82F6']}
              style={styles.customHeaderGradient}
            >
              <View style={styles.customHeaderContent}>
                <TouchableOpacity 
                  onPress={() => router.back()}
                  style={styles.customBackButton}
                >
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                
                <View style={styles.customHeaderTitleContainer}>
                  <Text style={styles.customHeaderTitle}>Chi tiết đặt lịch</Text>
                  <Text style={styles.customHeaderSubtitle}>Đang tải...</Text>
                </View>

                <TouchableOpacity style={styles.customShareButton}>
                  <Ionicons name="share-outline" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Đang tải chi tiết đơn hàng...</Text>
          </View>
        </View>
      </View>
    );
  }

  // Show error state if booking is null
  if (!booking) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#609CEF" translucent={false} />
        <Stack.Screen options={{ headerShown: false }} />
        
        <View style={styles.safeAreaContainer}>
          <View style={styles.customHeaderWrapper}>
            <LinearGradient
              colors={['#609CEF', '#3B82F6']}
              style={styles.customHeaderGradient}
            >
              <View style={styles.customHeaderContent}>
                <TouchableOpacity 
                  onPress={() => router.back()}
                  style={styles.customBackButton}
                >
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                
                <View style={styles.customHeaderTitleContainer}>
                  <Text style={styles.customHeaderTitle}>Chi tiết đặt lịch</Text>
                  <Text style={styles.customHeaderSubtitle}>Lỗi tải dữ liệu</Text>
                </View>

                <TouchableOpacity style={styles.customShareButton}>
                  <Ionicons name="share-outline" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Không thể tải chi tiết đơn hàng</Text>
          </View>
        </View>
      </View>
    );
  }

  const statusInfo = getStatusInfo(booking.status);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#609CEF" translucent={false} />
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Safe area với padding cho status bar */}
      <View style={styles.safeAreaContainer}>
        {/* Header giống BookingHistory */}
        <View style={styles.customHeaderWrapper}>
        <LinearGradient
          colors={['#609CEF', '#3B82F6']}
          style={styles.customHeaderGradient}
        >
          <View style={styles.customHeaderContent}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.customBackButton}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.customHeaderTitleContainer}>
              <Text style={styles.customHeaderTitle}>Chi tiết đặt lịch</Text>
              <Text style={styles.customHeaderSubtitle}>Mã đơn #{booking.id.padStart(6, '0')}</Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={refreshBookingDetail}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={20} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.customShareButton}>
                <Ionicons name="share-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.section}>
          <View style={[styles.statusCard, { backgroundColor: statusInfo.backgroundColor }]}>
            <View style={styles.statusIconContainer}>
              <Ionicons name={statusInfo.icon as any} size={32} color={statusInfo.color} />
            </View>
            <Text style={[styles.statusTitle, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
            <Text style={styles.statusDescription}>
              {(() => {
                switch (booking.status) {
                  case 'searching':
                    return 'Hệ thống đang tìm kiếm thợ phù hợp cho yêu cầu của bạn';
                  case 'quoted':
                    return 'Thợ đã gửi báo giá, vui lòng xem xét và xác nhận';
                  case 'accepted':
                    return 'Đã xác nhận báo giá, thợ sẽ liên hệ để thực hiện';
                  case 'in-progress':
                    return 'Thợ đang thực hiện dịch vụ tại địa điểm của bạn';
                  case 'completed':
                    return 'Dịch vụ đã hoàn thành, cảm ơn bạn đã sử dụng EzyFix';
                  case 'cancelled':
                    return 'Đơn hàng đã bị hủy';
                  default:
                    return 'Hệ thống đang xử lý yêu cầu của bạn';
                }
              })()}
            </Text>
          </View>
        </View>

        {/* Service Info */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="construct-outline" size={20} color="#609CEF" />
              <Text style={styles.cardTitle}>Thông tin dịch vụ</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dịch vụ:</Text>
                <Text style={styles.infoValue}>{booking.serviceName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Giá dịch vụ:</Text>
                <Text style={styles.infoValue}>{booking.servicePrice}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ngày tạo:</Text>
                <Text style={styles.infoValue}>
                  {new Date(booking.createdAt).toLocaleString('vi-VN')}
                </Text>
              </View>
              {booking.requestedDate && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ngày yêu cầu:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(booking.requestedDate).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
              )}
              {booking.expectedStartTime && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Giờ bắt đầu:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(booking.expectedStartTime).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              )}
              {booking.serviceDescription && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Mô tả:</Text>
                  <Text style={styles.infoValue}>{booking.serviceDescription}</Text>
                </View>
              )}
              {booking.quotePrice && (
                <View style={styles.priceRow}>
                  <Text style={styles.infoLabel}>Báo giá:</Text>
                  <Text style={styles.priceValue}>{booking.quotePrice}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={20} color="#609CEF" />
              <Text style={styles.cardTitle}>Thông tin khách hàng</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Họ tên:</Text>
                <Text style={styles.infoValue}>{booking.customerName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Số điện thoại:</Text>
                <Text style={styles.infoValue}>{booking.phoneNumber}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Địa chỉ:</Text>
                <Text style={styles.infoValue}>{booking.address}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Technician Info */}
        {booking.technicianName && (
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="hammer-outline" size={20} color="#609CEF" />
                <Text style={styles.cardTitle}>Thông tin thợ</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tên thợ:</Text>
                  <Text style={styles.infoValue}>{booking.technicianName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Đánh giá:</Text>
                  <View style={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons 
                        key={star} 
                        name="star" 
                        size={16} 
                        color="#F59E0B" 
                      />
                    ))}
                    <Text style={styles.ratingText}>(4.8)</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Action Buttons */}
      {booking.status === 'quoted' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={handleRejectQuote}
            disabled={loadingAction}
          >
            <Text style={styles.rejectButtonText}>Từ chối</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAcceptQuote}
            disabled={loadingAction}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.acceptGradient}
            >
              <Text style={styles.acceptButtonText}>
                {loadingAction ? 'Đang xử lý...' : 'Chấp nhận báo giá'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
      
      {booking.status === 'completed' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={() => {
              // TODO: Navigate to review screen
              Alert.alert('Thông báo', 'Chức năng đánh giá sẽ có sớm!');
            }}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.reviewGradient}
            >
              <Text style={styles.reviewButtonText}>Đánh giá dịch vụ</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
      
      {(booking.status === 'cancelled' || booking.status === 'searching') && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.backToHomeButton}
            onPress={() => router.push('/customer/(tabs)/dashboard' as any)}
          >
            <Text style={styles.backToHomeButtonText}>Về trang chủ</Text>
          </TouchableOpacity>
        </View>
      )}
      </View>
      
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
    backgroundColor: '#609CEF',
  },
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  customHeaderWrapper: {
    backgroundColor: 'transparent',
  },
  customHeaderGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 8,
    paddingBottom: 8,
  },
  customHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    minHeight: 80,
  },
  customBackButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  customHeaderTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    height: 44, // Same height as buttons
  },
  customHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  customHeaderSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  customShareButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  statusCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
  cardContent: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  priceValue: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: '700',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  ratingText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 4,
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  acceptButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  reviewButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  reviewGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  reviewButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  backToHomeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  backToHomeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  bottomSpacing: {
    height: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default withCustomerAuth(BookingDetail, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});