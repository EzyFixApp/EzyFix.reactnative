import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { serviceRequestService } from '../lib/api/serviceRequests';
import { servicesService } from '../lib/api/services';
import { serviceDeliveryOffersService } from '../lib/api/serviceDeliveryOffers';
import { appointmentsService } from '../lib/api/appointments';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../store/authStore';

interface ActiveOrder {
  id: string;
  serviceName: string;
  status: 'searching' | 'quoted' | 'accepted' | 'scheduled' | 'en-route' | 'arrived' | 'in-progress' | 'price-review' | 'payment';
  technicianName?: string;
  customerName?: string; // For technician view - show customer name
  customerPhone?: string; // For technician view - show customer contact
  estimatedTime?: string;
  currentStep?: string;
  requestedDate?: string;
  expectedStartTime?: string;
  requestAddress?: string;  // Full address text from backend
  appointmentStatus?: string; // Raw appointment status
  finalPrice?: string; // For price-review status
}

export default function ActiveOrdersSection() {
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user, isAuthenticated } = useAuth();
  const isMountedRef = React.useRef(true); // Track if component is mounted
  const isLoadingRef = React.useRef(false); // Prevent concurrent requests

  // Auto-refresh interval (30 seconds) - increased from 5s to reduce load
  const REFRESH_INTERVAL = 30000;

  // Animation for loading spinner
  const spinValue = new Animated.Value(0);

  // Start spinning animation
  const startSpinning = () => {
    spinValue.setValue(0);
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 800, // Tăng tốc độ để dễ thấy
        useNativeDriver: true,
      })
    ).start();
  };

  // Stop spinning animation
  const stopSpinning = () => {
    spinValue.stopAnimation();
    spinValue.setValue(0);
  };

  // Convert spin value to rotation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Helper function to map API status to local status (sync with order-tracking.tsx)
  const mapApiStatus = (apiStatus: string): ActiveOrder['status'] => {
    const normalizedStatus = apiStatus?.toUpperCase() || '';
    
    switch (normalizedStatus) {
      // ServiceRequest statuses
      case 'PENDING':
      case 'WAITING':
        return 'searching';
      case 'QUOTED':
        return 'quoted';
      case 'QUOTEACCEPTED':
      case 'QUOTE_ACCEPTED':
        return 'accepted';
      
      // Appointments statuses (priority - most specific)
      case 'SCHEDULED':
        return 'scheduled';
      case 'EN_ROUTE':
        return 'en-route';
      case 'ARRIVED':
        return 'arrived';
      case 'CHECKING':
      case 'REPAIRING':
        return 'in-progress';
      case 'PRICE_REVIEW':
        return 'price-review';
      case 'REPAIRED':
      case 'PAYMENT':
      case 'AWAITING_PAYMENT':
        return 'payment';
      
      // ServiceDeliveryOffers statuses
      case 'ACCEPTED':
        return 'accepted';
      case 'CHECKING_AWAIT':
        return 'in-progress';
      
      default:
        return 'searching';
    }
  };

  // Helper function to get current step description
  const getStepFromStatus = (status: ActiveOrder['status']): string => {
    switch (status) {
      case 'searching':
        return 'Đang tìm thợ phù hợp';
      case 'quoted':
        return 'Đang chờ xác nhận báo giá';
      case 'accepted':
        return 'Đã xác nhận, chuẩn bị thực hiện';
      case 'scheduled':
        return 'Thợ đã xác nhận lịch hẹn';
      case 'en-route':
        return 'Thợ đang trên đường đến';
      case 'arrived':
        return 'Thợ đã đến địa điểm';
      case 'in-progress':
        return 'Đang thực hiện dịch vụ';
      case 'price-review':
        return 'Chờ xác nhận giá cuối cùng';
      case 'payment':
        return 'Đã sửa xong, chờ thanh toán';
      default:
        return 'Đang tìm thợ phù hợp';
    }
  };

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadActiveOrders();
    }, [])
  );

  useEffect(() => {
    // Don't start loading if user is not authenticated
    if (!isAuthenticated || !user) {
      if (__DEV__) console.log('⏭️ [ActiveOrders] User not authenticated, skipping initial load');
      setActiveOrders([]);
      setLoading(false);
      isMountedRef.current = false; // Mark as unmounted
      return; // Early return prevents setting up interval
      return; // Early return prevents setting up interval
    }
    
    isMountedRef.current = true; // Mark as mounted
    loadActiveOrders();
    
    // Set up auto-refresh interval for real-time updates
    const interval = setInterval(() => {
      // Check if user is still authenticated before refreshing
      if (isAuthenticated && user && isMountedRef.current) {
        loadActiveOrders(true); // Silent refresh - don't show loading spinner
      }
    }, REFRESH_INTERVAL);

    // Cleanup interval on unmount OR when user becomes null
    return () => {
      isMountedRef.current = false; // Mark as unmounted
      if (interval) {
        clearInterval(interval);
        stopSpinning(); // Stop animation on unmount
      }
    };
  }, [user, isAuthenticated]); // Re-run when user or auth status changes

  // Start animation when loading starts
  useEffect(() => {
    if (loading) {
      startSpinning();
    } else {
      stopSpinning();
    }
  }, [loading]);

  // Add manual refresh function for pull-to-refresh or button
  const refreshOrders = async () => {
    await loadActiveOrders();
  };

  const loadActiveOrders = async (silent = false) => {
    try {
      // Debounce: prevent concurrent requests
      if (isLoadingRef.current) {
        if (__DEV__) console.log('⏭️ [ActiveOrders] Request already in progress, skipping');
        return;
      }
      
      // Don't load if user is not authenticated or component unmounted
      if (!isAuthenticated || !user || !isMountedRef.current) {
        if (__DEV__) console.log('⏭️ [ActiveOrders] User not authenticated or unmounted, skipping load');
        setActiveOrders([]);
        setLoading(false);
        return;
      }
      
      isLoadingRef.current = true; // Mark as loading
      
      if (!silent) {
        setLoading(true);
      }
      
      // Get service requests for both customers and technicians
      // getUserServiceRequests() handles both cases:
      // - For customers: filters by CustomerId
      // - For technicians: gets requests where they submitted offers
      const serviceRequests = await serviceRequestService.getUserServiceRequests();
      
      // Check again after async call
      if (!isMountedRef.current || !isAuthenticated) {
        if (__DEV__) console.log('⏭️ [ActiveOrders] Component unmounted during load, aborting');
        return;
      }
      
      // OPTIMIZATION: Pre-fetch all unique services
      const uniqueServiceIds = [...new Set(serviceRequests.map(req => req.serviceId))];
      const servicesMap = new Map<string, any>();
      
      if (__DEV__) console.log(`🔍 [ActiveOrders] Pre-fetching ${uniqueServiceIds.length} unique services`);
      
      await Promise.allSettled(
        uniqueServiceIds.map(async (serviceId) => {
          try {
            const service = await servicesService.getServiceById(serviceId);
            servicesMap.set(serviceId, service);
          } catch (error) {
            // Skip failed services
          }
        })
      );
      
      if (__DEV__) console.log(`✅ [ActiveOrders] Cached ${servicesMap.size} services`);
      
      // Convert service requests to active orders format with data from all 3 APIs
      const ordersWithNull: (ActiveOrder | null)[] = await Promise.all(
        serviceRequests.map(async (request) => {
          // Early exit check - stop processing if unmounted/logged out
          if (!isMountedRef.current || !isAuthenticated) {
            return null; // Return null to filter out later
          }
          
          let serviceName = 'Dịch vụ'; // Default fallback
          let technicianName: string | undefined;
          let customerName: string | undefined;
          let customerPhone: string | undefined;
          let actualStatus = request.status; // Will be overridden by appointment status if available
          let finalPrice: string | undefined;
          
          // For technician: get customer info from request
          if (user?.userType === 'technician') {
            customerName = request.fullName || 'Khách hàng';
            customerPhone = request.phoneNumber || undefined;
          }
          
          // OPTIMIZATION: Use cached service from map
          const cachedService = servicesMap.get(request.serviceId);
          if (cachedService) {
            serviceName = cachedService.serviceName || cachedService.description || 'Dịch vụ';
            if (serviceName.length > 30) {
              serviceName = serviceName.substring(0, 30) + '...';
            }
          } else if (request.serviceDescription) {
            serviceName = request.serviceDescription.length > 30 
              ? request.serviceDescription.substring(0, 30) + '...' 
              : request.serviceDescription;
          }
          
          // OPTIMIZATION: Parallel fetch offers and appointments
          if (!isMountedRef.current || !isAuthenticated) {
            return null;
          }
          
          const [offersResult, appointmentsResult] = await Promise.allSettled([
            serviceDeliveryOffersService.getAllOffers(request.requestID),
            appointmentsService.getAppointmentsByServiceRequest(request.requestID)
          ]);
          
          // Check again after async calls
          if (!isMountedRef.current || !isAuthenticated) {
            return null;
          }
          
          // Process offers
          if (offersResult.status === 'fulfilled') {
            const allOffers = offersResult.value;
            
            if (allOffers && allOffers.length > 0) {
              // Find ACCEPTED offer first, otherwise take the most recent one
              let relevantOffer = allOffers.find(
                (offer: any) => offer.status?.toUpperCase() === 'ACCEPTED'
              );
              
              if (!relevantOffer) {
                relevantOffer = allOffers[allOffers.length - 1];
              }
              
              // OPTIMIZATION: Use technician name from offer if available (no extra API call needed)
              if (relevantOffer.technician?.technicianName) {
                technicianName = relevantOffer.technician.technicianName;
              }
              
              // Get final price if available
              if (relevantOffer.finalCost && relevantOffer.finalCost > 0) {
                finalPrice = new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(relevantOffer.finalCost);
              }
            }
          }
          
          // Process appointments (already fetched in parallel)
          if (appointmentsResult.status === 'fulfilled') {
            const appointments = appointmentsResult.value;
            
            if (appointments.length > 0) {
              // Take the most recent appointment
              const appointment = appointments[appointments.length - 1];
              
              // Override status with appointment status (highest priority)
              actualStatus = appointment.status;
            }
          }
          
          // IMPORTANT: ServiceRequest status takes priority over Appointment status
          // If ServiceRequest is COMPLETED/CANCELLED, use that regardless of Appointment status
          let finalStatus = actualStatus;
          const serviceRequestStatus = request.status.toUpperCase();
          
          if (serviceRequestStatus === 'COMPLETED' || serviceRequestStatus === 'CANCELLED') {
            finalStatus = request.status; // Use ServiceRequest status (higher priority)
            if (__DEV__) {
              console.log(`⚠️ [ActiveOrders] ServiceRequest ${request.requestID} is ${serviceRequestStatus}, overriding Appointment status`);
            }
          }
          
          // Map the final status (ServiceRequest takes priority over Appointment)
          const mappedStatus = mapApiStatus(finalStatus);
          
          return {
            id: request.requestID,
            serviceName,
            status: mappedStatus,
            currentStep: getStepFromStatus(mappedStatus),
            requestedDate: request.requestedDate,
            expectedStartTime: request.expectedStartTime,
            requestAddress: request.requestAddress || undefined,
            technicianName,
            customerName,
            customerPhone,
            appointmentStatus: finalStatus, // Store final status (ServiceRequest takes priority)
            finalPrice,
          };
        })
      );
      
      // ✅ Filter out null values (from early exits during unmount/logout)
      const validOrders = ordersWithNull.filter((order): order is ActiveOrder => order !== null);
      
      // Filter to show only active orders
      // Exclude COMPLETED/CANCELLED ServiceRequests for both customers and technicians
      // These orders should not appear in "Active Orders" section
      let activeOnly: ActiveOrder[];
      
      if (user?.userType === 'technician') {
        // For technician: only show orders where they have ACCEPTED offers
        // and the appointment is in active state (not completed/cancelled/dispute)
        activeOnly = validOrders.filter((order: ActiveOrder) => {
          const appointmentStatus = order.appointmentStatus?.toLowerCase() || '';
          
          // Exclude completed/cancelled/dispute status (from ServiceRequest or Appointment)
          const isActiveAppointment = !['completed', 'cancelled', 'dispute'].includes(appointmentStatus);
          
          // Show orders that are scheduled, en-route, arrived, in-progress, price-review, or payment (repaired)
          const isActiveStatus = [
            'scheduled', 
            'en-route', 
            'arrived', 
            'in-progress',
            'price-review',
            'payment'
          ].includes(order.status);
          
          return isActiveAppointment && isActiveStatus;
        });
      } else {
        // For customer: exclude completed/cancelled/dispute orders
        // Since finalStatus now prioritizes ServiceRequest status, 
        // COMPLETED ServiceRequests will have appointmentStatus='completed'
        activeOnly = validOrders.filter((order: ActiveOrder) => {
          const appointmentStatus = order.appointmentStatus?.toLowerCase() || '';
          
          // Exclude completed/cancelled/dispute (these come from ServiceRequest when it's done)
          const isActive = !['completed', 'cancelled', 'dispute'].includes(appointmentStatus);
          
          return isActive;
        });
      }
      
      // Final check before updating state
      if (!isMountedRef.current || !isAuthenticated) {
        if (__DEV__) console.log('⏭️ [ActiveOrders] Component unmounted before setting state, aborting');
        return;
      }
      
      setActiveOrders(activeOnly);
    } catch (error: any) {
      // Don't update state if component unmounted
      if (!isMountedRef.current) {
        return;
      }
      
      // Silently handle session expired errors (401) - user is being logged out
      if (error.status_code === 401) {
        if (__DEV__) console.log('⏭️ [ActiveOrders] Session expired, clearing orders');
        setActiveOrders([]);
        return;
      }
      
      // Silently handle timeout errors (408) - don't spam console
      if (error.status_code === 408) {
        // Timeout is expected when API is slow, don't log
        setActiveOrders([]);
        return;
      }
      
      // Silent handling for expected errors (403, 404) - these are OK when API is not ready
      if (error.status_code === 403 || error.status_code === 404) {
        // Expected errors when API is not ready
      } else {
        // Only log unexpected errors in development
        if (__DEV__) console.error('Error loading active orders:', error);
      }
      
      // Set empty array to hide the section when API has issues or no orders
      setActiveOrders([]);
    } finally {
      isLoadingRef.current = false; // Always reset loading flag
      if (!silent) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {user?.userType === 'technician' ? 'Đơn đang thực hiện' : 'Đơn đang xử lý'}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>...</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <View style={styles.skeletonCard}>
            <View style={styles.skeletonHeader} />
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonLineShort} />
          </View>
        </View>
      </View>
    );
  }

  if (activeOrders.length === 0) {
    return null; // Don't show section if no active orders
  }

  const getStatusIcon = (status: ActiveOrder['status']) => {
    switch (status) {
      case 'searching':
        return 'search-outline';
      case 'quoted':
        return 'document-text-outline';
      case 'accepted':
        return 'checkmark-circle-outline';
      case 'scheduled':
        return 'calendar-outline';
      case 'en-route':
        return 'car-outline';
      case 'arrived':
        return 'location-outline';
      case 'in-progress':
        return 'build-outline';
      case 'price-review':
        return 'cash-outline';
      case 'payment':
        return 'card-outline';
      default:
        return 'time-outline';
    }
  };

  const getStatusColor = (status: ActiveOrder['status']) => {
    // Use primary app color for all status
    return '#609CEF';
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {user?.userType === 'technician' ? 'Đơn đang thực hiện' : 'Đơn đang xử lý'}
        </Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{activeOrders.length}</Text>
        </View>
      </View>

      {/* Paginated Scrollable Cards */}
      <ScrollView
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={Dimensions.get('window').width - 32}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContainer}
        onScroll={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x;
          const cardWidth = Dimensions.get('window').width - 32 + 16; // card width + gap
          const index = Math.round(offsetX / cardWidth);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      >
        {activeOrders.map((order, index) => (
          <TouchableOpacity
            key={order.id || index}
            style={styles.orderCard}
            onPress={() => {
              // Navigate to appropriate tracking screen based on user type
              if (user?.userType === 'technician') {
                router.push({
                  pathname: '/technician/technician-order-tracking',
                  params: { orderId: order.id }
                } as any);
              } else {
                router.push({
                  pathname: './order-tracking',
                  params: { orderId: order.id }
                } as any);
              }
            }}
            activeOpacity={0.95}
          >
            {/* Card Gradient Background */}
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC']}
              style={styles.cardGradient}
            >
              {/* Status Badge */}
              <View style={styles.statusBadgeContainer}>
                <View style={styles.statusBadge}>
                  <Ionicons name="time-outline" size={12} color="#FFFFFF" />
                  <Text style={styles.statusBadgeText}>Đang xử lý</Text>
                </View>
              </View>

              {/* Service Info */}
              <View style={styles.serviceSection}>
                <View style={styles.serviceIconBox}>
                  <Ionicons name="construct" size={24} color="#609CEF" />
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName} numberOfLines={2}>{order.serviceName}</Text>
                  <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText} numberOfLines={1}>{order.currentStep}</Text>
                  </View>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Date and Time */}
              {(order.requestedDate || order.expectedStartTime) && (
                <View style={styles.dateTimeSection}>
                  {order.requestedDate && (
                    <View style={styles.dateTimeItem}>
                      <View style={styles.dateTimeIconBox}>
                        <Ionicons name="calendar-outline" size={16} color="#609CEF" />
                      </View>
                      <View>
                        <Text style={styles.dateTimeLabel}>Ngày hẹn</Text>
                        <Text style={styles.dateTimeValue}>
                          {new Date(order.requestedDate).toLocaleDateString('vi-VN', { 
                            day: '2-digit', 
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                    </View>
                  )}
                  {order.expectedStartTime && (
                    <View style={styles.dateTimeItem}>
                      <View style={styles.dateTimeIconBox}>
                        <Ionicons name="time-outline" size={16} color="#609CEF" />
                      </View>
                      <View>
                        <Text style={styles.dateTimeLabel}>Giờ</Text>
                        <Text style={styles.dateTimeValue}>
                          {new Date(order.expectedStartTime).toLocaleTimeString('vi-VN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Action Button */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  if (user?.userType === 'technician') {
                    router.push({
                      pathname: '/technician/technician-order-tracking',
                      params: { orderId: order.id }
                    } as any);
                  } else {
                    router.push({
                      pathname: './order-tracking',
                      params: { orderId: order.id }
                    } as any);
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={styles.actionButtonGradient}>
                  <Text style={styles.actionButtonText}>Xem chi tiết</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      {activeOrders.length > 1 && (
        <View style={styles.paginationContainer}>
          {activeOrders.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentIndex && styles.paginationDotActive
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginRight: 8,
  },
  countBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  loadingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  skeletonCard: {
    width: width - 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  skeletonHeader: {
    width: '60%',
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  skeletonLine: {
    width: '100%',
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },
  skeletonLineShort: {
    width: '70%',
    height: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  orderCard: {
    width: width - 32,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardGradient: {
    padding: 20,
  },
  statusBadgeContainer: {
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    backgroundColor: '#609CEF',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  serviceSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  serviceIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 22,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  dateTimeSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  dateTimeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  dateTimeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateTimeLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  dateTimeValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
    backgroundColor: '#609CEF',
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#609CEF',
  },
});
