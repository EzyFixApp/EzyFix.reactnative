import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
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
  status: 'searching' | 'quoted' | 'accepted' | 'scheduled' | 'en-route' | 'arrived' | 'in-progress' | 'price-review';
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
  const { user } = useAuth();

  // Auto-refresh interval (30 seconds)
  const REFRESH_INTERVAL = 5000;

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
    loadActiveOrders();
    
    // Set up auto-refresh interval for real-time updates
    const interval = setInterval(() => {
      loadActiveOrders(true); // Silent refresh - don't show loading spinner
    }, REFRESH_INTERVAL);

    // Cleanup interval on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
        stopSpinning(); // Stop animation on unmount
      }
    };
  }, []);

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
      if (!silent) {
        setLoading(true);
      }
      
      // Get service requests for both customers and technicians
      // getUserServiceRequests() handles both cases:
      // - For customers: filters by CustomerId
      // - For technicians: gets requests where they submitted offers
      const serviceRequests = await serviceRequestService.getUserServiceRequests();
      
      // Convert service requests to active orders format with data from all 3 APIs
      const orders: ActiveOrder[] = await Promise.all(
        serviceRequests.map(async (request) => {
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
          
          // 1. Get service details from servicesService API
          try {
            const service = await servicesService.getServiceById(request.serviceId);
            serviceName = service.serviceName || service.description || 'Dịch vụ';
            
            // Truncate if too long
            if (serviceName.length > 30) {
              serviceName = serviceName.substring(0, 30) + '...';
            }
          } catch (error) {
            // Fallback to truncated description if service API fails
            if (request.serviceDescription) {
              serviceName = request.serviceDescription.length > 30 
                ? request.serviceDescription.substring(0, 30) + '...' 
                : request.serviceDescription;
            }
          }
          
          // 2. Get offer details from serviceDeliveryOffersService API
          try {
            const allOffers = await serviceDeliveryOffersService.getAllOffers(request.requestID);
            
            if (allOffers && allOffers.length > 0) {
              // Find ACCEPTED offer first, otherwise take the most recent one
              let relevantOffer = allOffers.find(
                (offer: any) => offer.status?.toUpperCase() === 'ACCEPTED'
              );
              
              if (!relevantOffer) {
                relevantOffer = allOffers[allOffers.length - 1];
              }
              
              // Get technician name from offer
              if (relevantOffer.technicianId) {
                try {
                  // Fetch full offer details to get technician info
                  const fullOfferDetails = await serviceDeliveryOffersService.getOfferById(relevantOffer.offerId);
                  
                  if (fullOfferDetails.technician?.technicianName) {
                    technicianName = fullOfferDetails.technician.technicianName;
                  }
                } catch (offerError) {
                  if (__DEV__) console.warn('⚠️ [ActiveOrders] Could not fetch full offer details');
                }
              }
              
              // Get final price if available
              if (relevantOffer.finalCost && relevantOffer.finalCost > 0) {
                finalPrice = new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(relevantOffer.finalCost);
              }
            }
          } catch (error) {
            if (__DEV__) console.warn('⚠️ [ActiveOrders] Could not fetch offers');
          }
          
          // 3. Get appointment details from appointmentsService API (highest priority)
          try {
            const appointments = await appointmentsService.getAppointmentsByServiceRequest(request.requestID);
            
            if (appointments.length > 0) {
              // Take the most recent appointment
              const appointment = appointments[appointments.length - 1];
              
              // Override status with appointment status (highest priority)
              actualStatus = appointment.status;
              
              if (__DEV__) console.log('✅ [ActiveOrders] Appointment status:', {
                requestId: request.requestID,
                status: actualStatus
              });
            }
          } catch (error) {
            if (__DEV__) console.warn('⚠️ [ActiveOrders] Could not fetch appointments');
          }
          
          // Map the final status (using appointment status if available)
          const mappedStatus = mapApiStatus(actualStatus);
          
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
            appointmentStatus: actualStatus,
            finalPrice,
          };
        })
      );
      
      // Filter to show only active orders
      // For technicians: show orders with ACCEPTED offers and active appointments
      // For customers: exclude completed/cancelled orders
      let activeOnly: ActiveOrder[];
      
      if (user?.userType === 'technician') {
        // For technician: only show orders where they have ACCEPTED offers
        // and the appointment is in active state (not completed/cancelled)
        activeOnly = orders.filter(order => {
          const appointmentStatus = order.appointmentStatus?.toLowerCase() || '';
          const isActiveAppointment = !['completed', 'cancelled', 'repaired', 'dispute'].includes(appointmentStatus);
          
          // Show orders that are scheduled, en-route, arrived, or in-progress
          const isActiveStatus = [
            'scheduled', 
            'en-route', 
            'arrived', 
            'in-progress',
            'price-review'
          ].includes(order.status);
          
          return isActiveAppointment && isActiveStatus;
        });
      } else {
        // For customer: exclude completed/cancelled orders
        activeOnly = orders.filter(order => 
          order.status !== 'in-progress' || // Keep in-progress as it might be active
          !['completed', 'cancelled', 'repaired'].includes(order.appointmentStatus?.toLowerCase() || '')
        );
      }
      
      setActiveOrders(activeOnly);
    } catch (error: any) {
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
      if (!silent) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <View style={styles.titleContainer}>
            <LinearGradient
              colors={['#609CEF', '#7B68EE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.titleIconContainer}
            >
            <Ionicons name="flash" size={16} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.sectionTitle}>
            {user?.userType === 'technician' ? 'Đơn đang thực hiện' : 'Đơn đang xử lý'}
          </Text>
          <View style={styles.countBadge}>
              <Text style={styles.countText}>0</Text>
            </View>
            <View style={styles.refreshButton}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons name="refresh" size={14} color="#609CEF" />
              </Animated.View>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="refresh-circle" size={32} color="#609CEF" />
          </Animated.View>
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
      case 'in-progress':
        return 'build-outline';
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
        <View style={styles.titleContainer}>
          <LinearGradient
            colors={['#609CEF', '#7B68EE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.titleIconContainer}
          >
            <Ionicons name="flash" size={16} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.sectionTitle}>
            {user?.userType === 'technician' ? 'Đơn đang thực hiện' : 'Đơn đang xử lý'}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{activeOrders.length}</Text>
          </View>
          <TouchableOpacity
            onPress={refreshOrders}
            style={styles.refreshButton}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={14} color="#609CEF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Horizontal Scrollable Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
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
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC']}
              style={styles.cardGradient}
            >
              {/* Status indicator at top */}
              <LinearGradient
                colors={['#609CEF', '#609CEF80']}
                style={styles.statusIndicator}
              />
              
              <View style={styles.cardContent}>
                {/* Header with service name and status */}
                <View style={styles.cardHeader}>
                  <View style={styles.serviceNameRow}>
                    <Text style={styles.serviceName} numberOfLines={2}>{order.serviceName}</Text>
                    <View style={styles.statusBadge}>
                      <Ionicons 
                        name={getStatusIcon(order.status)} 
                        size={12} 
                        color="#FFFFFF" 
                      />
                    </View>
                  </View>
                </View>

                {/* Current step with better spacing */}
                <View style={styles.stepContainer}>
                  <View style={styles.stepRow}>
                    <Ionicons name="radio-button-on" size={8} color="#609CEF" />
                    <Text style={styles.stepText}>{order.currentStep}</Text>
                  </View>
                </View>

                {/* Show customer/technician name based on user type */}
                {user?.userType === 'technician' && order.customerName && (
                  <View style={styles.personInfoContainer}>
                    <Ionicons name="person-outline" size={12} color="#6B7280" />
                    <Text style={styles.personInfoText}>{order.customerName}</Text>
                  </View>
                )}
                {user?.userType === 'customer' && order.technicianName && (
                  <View style={styles.personInfoContainer}>
                    <Ionicons name="construct-outline" size={12} color="#6B7280" />
                    <Text style={styles.personInfoText}>Thợ: {order.technicianName}</Text>
                  </View>
                )}

                {/* Date and time info */}
                <View style={styles.dateTimeContainer}>
                  {order.requestedDate && (
                    <View style={styles.dateTimeRow}>
                      <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                      <Text style={styles.dateTimeText}>
                        {new Date(order.requestedDate).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                  )}
                  {order.expectedStartTime && (
                    <View style={styles.dateTimeRow}>
                      <Ionicons name="time-outline" size={12} color="#6B7280" />
                      <Text style={styles.dateTimeText}>
                        {new Date(order.expectedStartTime).toLocaleTimeString('vi-VN', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action button */}
                <TouchableOpacity 
                  style={styles.actionButton}
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
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionButtonText}>
                    Xem chi tiết
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color="#609CEF" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
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
  refreshButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  loadingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  orderCard: {
    width: 280,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardGradient: {
    padding: 16,
    position: 'relative',
  },
  statusIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  cardContent: {
    marginTop: 4,
  },
  cardHeader: {
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  technicianRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  technicianText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  stepContainer: {
    marginBottom: 12,
  },
  stepText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  trackButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trackButtonSmallText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#609CEF',
  },
  // New styles for improved layout
  serviceNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  statusBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#609CEF',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  personInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  personInfoText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  dateTimeContainer: {
    gap: 6,
    marginBottom: 16,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#609CEF',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#609CEF',
  },
});
