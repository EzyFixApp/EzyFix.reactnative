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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { serviceRequestService } from '../../lib/api/serviceRequests';
import { servicesService } from '../../lib/api/services';
import { serviceDeliveryOffersService } from '../../lib/api/serviceDeliveryOffers';
import { techniciansService } from '../../lib/api/technicians';
import { useAuth } from '../../store/authStore';
import withCustomerAuth from '../../lib/auth/withCustomerAuth';
import AuthModal from '../../components/AuthModal';

interface OrderDetail {
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
  estimatedPrice?: string; // Giá dự kiến
  finalPrice?: string;      // Giá chốt
  notes?: string;
}

function CustomerOrderTracking() {
  // Get orderId from route params
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Auto-refresh interval (30 seconds)
  const REFRESH_INTERVAL = 30000;

  // Animation for loading spinner
  const spinValue = new Animated.Value(0);

  // Check authentication when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (!isAuthenticated) {
        setShowAuthModal(true);
      }
    }, [isAuthenticated])
  );

  // Animation functions
  const startSpinning = () => {
    spinValue.setValue(0);
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopSpinning = () => {
    spinValue.stopAnimation();
    spinValue.setValue(0);
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Map API status to UI status
  // ServiceRequest: Pending, Quoted, QuoteAccepted, Completed, Cancelled, QuoteRejected
  // ServiceDeliveryOffers: PENDING, ACCEPTED, CHECKING_AWAIT, REJECTED, EXPIRED
  // Appointments: SCHEDULED, EN_ROUTE, ARRIVED, CHECKING, REPAIRING, REPAIRED, ABSENT, CANCELLED, DISPUTE
  const mapApiStatus = (apiStatus: string): OrderDetail['status'] => {
    switch (apiStatus?.toUpperCase()) {
      // ServiceRequest statuses
      case 'PENDING':
      case 'WAITING':
        return 'searching';
      case 'QUOTED':
        return 'quoted';
      case 'QUOTEACCEPTED':
      case 'QUOTE_ACCEPTED':
        return 'accepted';
      case 'QUOTEREJECTED':
      case 'QUOTE_REJECTED':
        return 'cancelled';
      
      // ServiceDeliveryOffers statuses
      case 'ACCEPTED':
        return 'accepted';
      case 'CHECKING_AWAIT':
        return 'in-progress';
      case 'REJECTED':
      case 'EXPIRED':
        return 'cancelled';
      
      // Appointments statuses
      case 'SCHEDULED':
        return 'accepted';
      case 'EN_ROUTE':
      case 'ARRIVED':
        return 'in-progress';
      case 'CHECKING':
      case 'REPAIRING':
        return 'in-progress';
      case 'REPAIRED':
        return 'completed';
      case 'ABSENT':
      case 'DISPUTE':
        return 'cancelled';
      
      // Common statuses
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

  // Load order details from API
  const loadOrderDetail = async (silent = false) => {
    if (!orderId) {
      Alert.alert('Lỗi', 'Không tìm thấy ID đơn hàng');
      router.back();
      return;
    }

    try {
      if (!silent) {
        setLoading(true);
      }
      
      // Get service request details
      const serviceRequest = await serviceRequestService.getServiceRequestById(orderId);
      
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
      }
      
      // Get quote information if available
      let quotePrice: string | undefined;
      let estimatedPrice: string | undefined;
      let finalPrice: string | undefined;
      let technicianName: string | undefined;
      
      try {
        if (__DEV__) console.log('📦 [OrderTracking] Request status:', serviceRequest.status, 'Request ID:', serviceRequest.requestID);
        
        // Get ALL offers for this request (not just PENDING)
        const allOffers = await serviceDeliveryOffersService.getAllOffers(serviceRequest.requestID);
        
        if (__DEV__) console.log('📦 [OrderTracking] Total offers found:', allOffers?.length || 0);
        
        if (allOffers && allOffers.length > 0) {
          // Find ACCEPTED offer first, otherwise take the most recent one
          let relevantOffer = allOffers.find(
            (offer: any) => offer.status?.toUpperCase() === 'ACCEPTED'
          );
          
          if (!relevantOffer) {
            relevantOffer = allOffers[0]; // Take first (usually most recent)
          }
          
          if (__DEV__) console.log('📦 [OrderTracking] Using offer:', {
            offerId: relevantOffer.offerId,
            status: relevantOffer.status,
            estimatedCost: relevantOffer.estimatedCost,
            finalCost: relevantOffer.finalCost,
            technicianId: relevantOffer.technicianId,
            hasTechnicianObject: !!relevantOffer.technician,
            technicianFirstName: relevantOffer.technician?.user?.firstName || relevantOffer.technician?.firstName,
            technicianLastName: relevantOffer.technician?.user?.lastName || relevantOffer.technician?.lastName,
          });
          
          // Format estimated price
          if (relevantOffer.estimatedCost && relevantOffer.estimatedCost > 0) {
            estimatedPrice = new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(relevantOffer.estimatedCost);
          }
          
          // Format final price
          if (relevantOffer.finalCost && relevantOffer.finalCost > 0) {
            finalPrice = new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(relevantOffer.finalCost);
          }
          
          // For backward compatibility, set quotePrice to finalCost or estimatedCost
          const quoteCost = relevantOffer.finalCost || relevantOffer.estimatedCost;
          if (quoteCost && quoteCost > 0) {
            quotePrice = new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(quoteCost);
            
            if (__DEV__) console.log('✅ [OrderTracking] Quote price:', quotePrice, '(finalCost:', relevantOffer.finalCost, 'estimatedCost:', relevantOffer.estimatedCost, ')');
          } else {
            if (__DEV__) console.log('⚠️ [OrderTracking] No valid cost in offer');
          }
          
          // Get technician info if available
          if (relevantOffer.technicianId) {
            if (__DEV__) console.log('✅ [OrderTracking] Technician ID found:', relevantOffer.technicianId);
            
            // Check if technician details are already in the offer response
            if (relevantOffer.technician?.user) {
              const firstName = relevantOffer.technician.user.firstName || '';
              const lastName = relevantOffer.technician.user.lastName || '';
              technicianName = `${lastName} ${firstName}`.trim();
              
              if (__DEV__) console.log('✅ [OrderTracking] Technician name from offer:', technicianName);
            } 
            // Try alternate path
            else if (relevantOffer.technician?.firstName || relevantOffer.technician?.lastName) {
              const firstName = relevantOffer.technician.firstName || '';
              const lastName = relevantOffer.technician.lastName || '';
              technicianName = `${lastName} ${firstName}`.trim();
              
              if (__DEV__) console.log('✅ [OrderTracking] Technician name from technician object:', technicianName);
            }
            // Try to fetch from API as last resort
            else {
              try {
                technicianName = await techniciansService.getTechnicianName(relevantOffer.technicianId);
                if (__DEV__) console.log('✅ [OrderTracking] Technician name from API:', technicianName);
              } catch (error: any) {
                // If API returns 404 or any error, show a friendly fallback
                if (__DEV__) console.log('⚠️ [OrderTracking] Could not fetch technician name, using fallback');
                
                // Show "Thợ #ID" format as fallback
                const shortId = relevantOffer.technicianId.substring(0, 8);
                technicianName = `Thợ #${shortId}`;
              }
            }
          }
        } else {
          if (__DEV__) console.log('⚠️ [OrderTracking] No offers found for request');
        }
      } catch (error) {
        console.error('❌ [OrderTracking] Error fetching quote details:', error);
      }
      
      // Transform API data to OrderDetail format
      const transformedOrder: OrderDetail = {
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
        technicianName: technicianName,
        quotePrice: quotePrice,
        estimatedPrice: estimatedPrice,
        finalPrice: finalPrice,
      };
      
      setOrder(transformedOrder);
      
    } catch (error: any) {
      console.error('Error loading order detail:', error);
      
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
              { text: 'Thử lại', onPress: () => loadOrderDetail() },
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
    loadOrderDetail();
    
    // Set up auto-refresh interval for real-time updates
    const interval = setInterval(() => {
      loadOrderDetail(true); // Silent refresh
    }, REFRESH_INTERVAL);

    // Cleanup interval on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
        stopSpinning();
      }
    };
  }, [orderId]);

  // Start animation when loading starts
  useEffect(() => {
    if (loading) {
      startSpinning();
    } else {
      stopSpinning();
    }
  }, [loading]);

  // Manual refresh function
  const refreshOrderDetail = async () => {
    await loadOrderDetail();
  };

  const handleBack = () => {
    router.back();
  };

  // Get status info for UI display
  const getStatusInfo = (status: OrderDetail['status']) => {
    switch (status) {
      case 'searching':
        return {
          text: 'Đang tìm thợ',
          color: '#F59E0B',
          backgroundColor: '#FEF3C7',
          icon: 'search-outline',
          step: 1,
          totalSteps: 5,
        };
      case 'quoted':
        return {
          text: 'Có báo giá',
          color: '#3B82F6',
          backgroundColor: '#DBEAFE',
          icon: 'document-text-outline',
          step: 2,
          totalSteps: 5,
        };
      case 'accepted':
        return {
          text: 'Đã xác nhận',
          color: '#8B5CF6',
          backgroundColor: '#EDE9FE',
          icon: 'checkmark-circle-outline',
          step: 3,
          totalSteps: 5,
        };
      case 'in-progress':
        return {
          text: 'Đang thực hiện',
          color: '#F59E0B',
          backgroundColor: '#FEF3C7',
          icon: 'build-outline',
          step: 4,
          totalSteps: 5,
        };
      case 'completed':
        return {
          text: 'Hoàn thành',
          color: '#10B981',
          backgroundColor: '#D1FAE5',
          icon: 'checkmark-done-outline',
          step: 5,
          totalSteps: 5,
        };
      case 'cancelled':
        return {
          text: 'Đã hủy',
          color: '#EF4444',
          backgroundColor: '#FEE2E2',
          icon: 'close-circle-outline',
          step: 0,
          totalSteps: 5,
        };
      default:
        return {
          text: 'Đang xử lý',
          color: '#6B7280',
          backgroundColor: '#F3F4F6',
          icon: 'time-outline',
          step: 1,
          totalSteps: 5,
        };
    }
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
                  onPress={handleBack}
                  style={styles.customBackButton}
                >
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                
                <View style={styles.customHeaderTitleContainer}>
                  <Text style={styles.customHeaderTitle}>Theo dõi đơn hàng</Text>
                  <Text style={styles.customHeaderSubtitle}>Đang tải...</Text>
                </View>

                <View style={styles.refreshButton}>
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Ionicons name="refresh" size={20} color="white" />
                  </Animated.View>
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.loadingContainer}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="refresh-circle" size={32} color="#609CEF" />
            </Animated.View>
          </View>
        </View>
      </View>
    );
  }

  // Show error state if order is null
  if (!order) {
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
                  onPress={handleBack}
                  style={styles.customBackButton}
                >
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                
                <View style={styles.customHeaderTitleContainer}>
                  <Text style={styles.customHeaderTitle}>Theo dõi đơn hàng</Text>
                  <Text style={styles.customHeaderSubtitle}>Lỗi tải dữ liệu</Text>
                </View>

                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={refreshOrderDetail}
                  activeOpacity={0.7}
                >
                  <Ionicons name="refresh" size={20} color="white" />
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

  const statusInfo = getStatusInfo(order.status);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#609CEF" translucent={false} />
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.safeAreaContainer}>
        {/* Header */}
        <View style={styles.customHeaderWrapper}>
          <LinearGradient
            colors={['#609CEF', '#3B82F6']}
            style={styles.customHeaderGradient}
          >
            <View style={styles.customHeaderContent}>
              <TouchableOpacity 
                onPress={handleBack}
                style={styles.customBackButton}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              
              <View style={styles.customHeaderTitleContainer}>
                <Text style={styles.customHeaderTitle}>Theo dõi đơn hàng</Text>
                <Text style={styles.customHeaderSubtitle}>Mã đơn #{order.id.padStart(6, '0')}</Text>
              </View>

              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={refreshOrderDetail}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Status Progress */}
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
                  const apiStatus = order.status;
                  // Check original API status for more specific messages
                  const originalStatus = order.status; // You can pass this from API if needed
                  
                  switch (order.status) {
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
                      return 'Đơn hàng đã bị hủy hoặc từ chối';
                    default:
                      return 'Hệ thống đang xử lý yêu cầu của bạn';
                  }
                })()}
              </Text>
              
              {/* Progress indicator */}
              {order.status !== 'cancelled' && (
                <View style={styles.progressContainer}>
                  <Text style={styles.progressText}>
                    Bước {statusInfo.step}/{statusInfo.totalSteps}
                  </Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${(statusInfo.step / statusInfo.totalSteps) * 100}%`,
                          backgroundColor: statusInfo.color 
                        }
                      ]} 
                    />
                  </View>
                </View>
              )}
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
                  <Text style={styles.infoValue}>{order.serviceName}</Text>
                </View>
                
                {/* Price information with beautiful design */}
                {(order.estimatedPrice || order.finalPrice) ? (
                  <View style={styles.priceSection}>
                    {/* Estimated Price */}
                    {order.estimatedPrice && (
                      <View style={styles.priceCard}>
                        <View style={styles.priceHeader}>
                          <View style={styles.priceIconContainer}>
                            <Ionicons name="calculator-outline" size={18} color="#3B82F6" />
                          </View>
                          <View style={styles.priceLabelContainer}>
                            <Text style={styles.priceLabel}>Giá dự kiến</Text>
                            <Text style={styles.priceDescription}>Ước tính ban đầu</Text>
                          </View>
                        </View>
                        <Text style={styles.estimatedPriceValue}>{order.estimatedPrice}</Text>
                      </View>
                    )}
                    
                    {/* Final Price */}
                    {order.finalPrice && (
                      <View style={[styles.priceCard, styles.finalPriceCard]}>
                        <View style={styles.priceHeader}>
                          <View style={[styles.priceIconContainer, { backgroundColor: '#D1FAE5' }]}>
                            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                          </View>
                          <View style={styles.priceLabelContainer}>
                            <Text style={[styles.priceLabel, { color: '#10B981' }]}>Giá chốt</Text>
                            <Text style={styles.priceDescription}>Giá thực tế thanh toán</Text>
                          </View>
                        </View>
                        <View style={styles.finalPriceContainer}>
                          <Text style={styles.finalPriceValue}>{order.finalPrice}</Text>
                          <View style={styles.finalPriceBadge}>
                            <Text style={styles.finalPriceBadgeText}>CHÍNH THỨC</Text>
                          </View>
                        </View>
                      </View>
                    )}
                    
                    {/* Info note */}
                    <View style={styles.priceNote}>
                      <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                      <Text style={styles.priceNoteText}>
                        {order.finalPrice 
                          ? 'Giá chốt là giá cuối cùng bạn cần thanh toán sau khi thợ kiểm tra thực tế'
                          : 'Giá dự kiến có thể thay đổi sau khi thợ kiểm tra thực tế tại địa điểm'
                        }
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Giá dịch vụ:</Text>
                    <Text style={styles.infoValue}>{order.servicePrice}</Text>
                  </View>
                )}
                
                <View style={styles.infoDivider} />
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ngày tạo:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(order.createdAt).toLocaleString('vi-VN')}
                  </Text>
                </View>
                {order.requestedDate && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Ngày yêu cầu:</Text>
                    <Text style={styles.infoValue}>
                      {new Date(order.requestedDate).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                )}
                {order.expectedStartTime && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Giờ bắt đầu:</Text>
                    <Text style={styles.infoValue}>
                      {new Date(order.expectedStartTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                )}
                {order.serviceDescription && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Mô tả:</Text>
                    <Text style={styles.infoValue}>{order.serviceDescription}</Text>
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
                  <Text style={styles.infoValue}>{order.customerName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Số điện thoại:</Text>
                  <Text style={styles.infoValue}>{order.phoneNumber}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Địa chỉ:</Text>
                  <Text style={styles.infoValue}>{order.address}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Technician Info */}
          {order.technicianName && (
            <View style={styles.section}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="hammer-outline" size={20} color="#609CEF" />
                  <Text style={styles.cardTitle}>Thông tin thợ</Text>
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tên thợ:</Text>
                    <Text style={styles.infoValue}>{order.technicianName}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Trạng thái:</Text>
                    <Text style={[styles.infoValue, { color: '#8B5CF6' }]}>
                      {(() => {
                        switch (order.status) {
                          case 'accepted':
                            return 'Đã xác nhận, sẽ liên hệ sớm';
                          case 'in-progress':
                            return 'Đang thực hiện dịch vụ';
                          case 'completed':
                            return 'Đã hoàn thành';
                          default:
                            return 'Đã được phân công';
                        }
                      })()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
          
          {/* Note section when quote accepted but no technician yet */}
          {!order.technicianName && order.status === 'accepted' && (
            <View style={styles.section}>
              <View style={[styles.card, { backgroundColor: '#EDE9FE' }]}>
                <View style={styles.cardContent}>
                  <View style={{ alignItems: 'center' }}>
                    <Ionicons name="time-outline" size={32} color="#8B5CF6" />
                    <Text style={[styles.statusTitle, { color: '#8B5CF6', marginTop: 12, marginBottom: 8 }]}>
                      Đang chuẩn bị
                    </Text>
                    <Text style={[styles.statusDescription, { textAlign: 'center' }]}>
                      Thợ đang chuẩn bị và sẽ liên hệ với bạn sớm để xác nhận lịch hẹn
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
      
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </View>
  );
}

// StyleSheet for order tracking
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeAreaContainer: {
    flex: 1,
  },
  customHeaderWrapper: {
    zIndex: 1000,
  },
  customHeaderGradient: {
    paddingTop: Platform.OS === 'ios' ? 54 : 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  customHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customBackButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  customHeaderTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  customHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  customHeaderSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  refreshButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
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
  progressContainer: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
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
  bottomSpacing: {
    height: 100,
  },
  // Price section styles
  priceSection: {
    marginVertical: 12,
  },
  priceCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  finalPriceCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 2,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  priceLabelContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 2,
  },
  priceDescription: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  estimatedPriceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'right',
  },
  finalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  finalPriceValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#10B981',
    flex: 1,
    textAlign: 'right',
  },
  finalPriceBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  finalPriceBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  priceNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  priceNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginLeft: 8,
    fontWeight: '500',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
});

export default withCustomerAuth(CustomerOrderTracking);
