import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { serviceRequestService } from '../lib/api/serviceRequests';
import { servicesService } from '../lib/api/services';
import { useFocusEffect } from '@react-navigation/native';

interface ActiveOrder {
  id: string;
  serviceName: string;
  status: 'searching' | 'quoted' | 'accepted' | 'in-progress';
  technicianName?: string;
  estimatedTime?: string;
  currentStep?: string;
  requestedDate?: string;
  expectedStartTime?: string;
}

export default function ActiveOrdersSection() {
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to map API status to local status
  const getStatusFromApiStatus = (apiStatus: string): ActiveOrder['status'] => {
    switch (apiStatus?.toUpperCase()) {
      case 'PENDING':
        return 'searching';
      case 'QUOTED':
        return 'quoted';
      case 'ACCEPTED':
        return 'accepted';
      case 'IN_PROGRESS':
      case 'INPROGRESS':
        return 'in-progress';
      default:
        return 'searching';
    }
  };

  // Helper function to get current step description
  const getStepFromStatus = (apiStatus: string): string => {
    switch (apiStatus?.toUpperCase()) {
      case 'PENDING':
        return 'Đang tìm thợ phù hợp';
      case 'QUOTED':
        return 'Đang chờ xác nhận báo giá';
      case 'ACCEPTED':
        return 'Đã xác nhận, chuẩn bị thực hiện';
      case 'IN_PROGRESS':
      case 'INPROGRESS':
        return 'Đang thực hiện dịch vụ';
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
  }, []);

  const loadActiveOrders = async () => {
    try {
      setLoading(true);
      
      // Get service requests using the endpoint with customer access support
      const serviceRequests = await serviceRequestService.getUserServiceRequests();
      
      if (__DEV__) {
        console.log('Service requests loaded:', serviceRequests.length, 'items');
      }
      
      // Convert service requests to active orders format with service names
      const orders: ActiveOrder[] = await Promise.all(
        serviceRequests.map(async (request) => {
          let serviceName = 'Dịch vụ'; // Default fallback
          
          try {
            // Try to get service details from API
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
            if (__DEV__) {
              console.warn(`Failed to get service name for ${request.serviceId}:`, error);
            }
          }
          
          return {
            id: request.id,
            serviceName,
            status: getStatusFromApiStatus(request.status),
            currentStep: getStepFromStatus(request.status),
            requestedDate: request.requestedDate,
            expectedStartTime: request.expectedStartTime,
          };
        })
      );
      
      setActiveOrders(orders);
    } catch (error: any) {
      if (__DEV__) console.error('Error loading active orders:', error);
      
      // Handle 403 Forbidden - might be permission issue or API not ready
      if (error.status_code === 403) {
        console.warn('Access denied to service requests - using fallback to hide section');
      }
      
      // For now, set empty array to hide the section when API has issues
      // TODO: Remove this when API is properly configured
      setActiveOrders([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Đơn đang xử lý</Text>
        </View>
        <View style={styles.orderCard}>
          <Text style={styles.stepText}>Đang tải...</Text>
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
          <Text style={styles.sectionTitle}>Đơn đang xử lý</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{activeOrders.length}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push('./booking-history' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>Xem tất cả</Text>
        </TouchableOpacity>
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
              router.push({
                pathname: './order-tracking',
                params: { orderId: order.id }
              } as any);
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
                    router.push({
                      pathname: './order-tracking',
                      params: { orderId: order.id }
                    } as any);
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
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#609CEF',
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
