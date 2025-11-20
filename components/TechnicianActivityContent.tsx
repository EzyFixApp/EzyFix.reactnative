/**
 * Technician Activity Content Component
 * Shows list of all service requests assigned to the technician
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { serviceRequestService } from '../lib/api/serviceRequests';
import { servicesService } from '../lib/api/services';
import { serviceDeliveryOffersService } from '../lib/api/serviceDeliveryOffers';
import { appointmentsService } from '../lib/api/appointments';
import { useAuth } from '../store/authStore';

interface ServiceRequest {
  requestID: string;
  serviceDescription: string;
  serviceName: string; // Fetched from servicesService
  fullName: string | null;
  phoneNumber: string | null;
  requestAddress: string | null;
  requestedDate: string;
  status: string; // Real-time status from appointments
  offerId?: string; // Required for navigation
}

export default function TechnicianActivityContent() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isAuthenticated } = useAuth();
  const isMountedRef = React.useRef(true); // Track if component is mounted

  const loadRequests = useCallback(async () => {
    try {
      // Don't load if not authenticated or component unmounted
      if (!isAuthenticated || !isMountedRef.current) {
        if (__DEV__) console.log('⏭️ [TechnicianActivity] User not authenticated or unmounted, skipping load');
        setRequests([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      if (__DEV__) console.log('📥 [TechnicianActivity] Loading service requests...');
      
      const response = await serviceRequestService.getUserServiceRequests();
      
      // Check again after async call
      if (!isMountedRef.current || !isAuthenticated) {
        if (__DEV__) console.log('⏭️ [TechnicianActivity] Component unmounted during load, aborting');
        return;
      }
      
      if (__DEV__) {
        console.log(`✅ [TechnicianActivity] Loaded ${response.length} requests`);
      }
      
      // Sort by date (newest first)
      const sorted = response.sort((a, b) => 
        new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime()
      );
      
      // Fetch complete data for each request (service name, offer, appointment)
      const mapped: ServiceRequest[] = await Promise.all(
        sorted.map(async (r) => {
          let serviceName = r.serviceDescription || 'Dịch vụ';
          let actualStatus = r.status;
          let offerId: string | undefined = undefined;
          
          // 1. Fetch service name
          try {
            if (r.serviceId) {
              const service = await servicesService.getServiceById(r.serviceId);
              serviceName = service.serviceName || service.description || r.serviceDescription;
            }
          } catch (error) {
            if (__DEV__) console.warn('Could not fetch service name for:', r.requestID);
          }
          
          // 2. Fetch offer to get offerId
          try {
            const offers = await serviceDeliveryOffersService.getAllOffers(r.requestID);
            if (offers && offers.length > 0) {
              const acceptedOffer = offers.find(offer => offer.status === 'ACCEPTED');
              offerId = acceptedOffer?.offerId || offers[offers.length - 1]?.offerId;
            }
          } catch (error) {
            if (__DEV__) console.warn('Could not fetch offer for:', r.requestID);
          }
          
          // 3. Fetch appointment for real-time status
          try {
            const appointments = await appointmentsService.getAppointmentsByServiceRequest(r.requestID);
            if (appointments && appointments.length > 0) {
              const latestAppointment = appointments[appointments.length - 1];
              actualStatus = latestAppointment.status; // Use appointment status
            }
          } catch (error) {
            if (__DEV__) console.warn('Could not fetch appointments for:', r.requestID);
          }
          
          // 4. HIGHEST PRIORITY: Check if serviceRequest is COMPLETED (payment done)
          // Override appointment status if serviceRequest shows COMPLETED
          if (r.status === 'COMPLETED') {
            actualStatus = 'COMPLETED';
            if (__DEV__) console.log('✅ [TechnicianActivity] Request COMPLETED (payment done):', r.requestID);
          }
          
          return {
            requestID: r.requestID,
            serviceDescription: r.serviceDescription,
            serviceName: serviceName,
            fullName: r.fullName,
            phoneNumber: r.phoneNumber,
            requestAddress: r.requestAddress,
            requestedDate: r.requestedDate,
            status: actualStatus,
            offerId: offerId,
          };
        })
      );
      
      // Final check before updating state
      if (!isMountedRef.current || !isAuthenticated) {
        if (__DEV__) console.log('⏭️ [TechnicianActivity] Component unmounted before setting state, aborting');
        return;
      }
      
      if (__DEV__) console.log(`📊 [TechnicianActivity] Setting ${mapped.length} requests to state`);
      
      setRequests(mapped);
    } catch (error: any) {
      // Don't update state if component unmounted
      if (!isMountedRef.current) {
        return;
      }
      
      // Silently handle auth errors during logout
      if (error?.status_code === 401) {
        if (__DEV__) console.log('⏭️ [TechnicianActivity] Session expired, skipping error handling');
        return;
      }
      
      if (__DEV__) console.error('❌ Load requests error:', error);
      // Don't show error to user, just keep empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      isMountedRef.current = true; // Mark as mounted
      loadRequests();
    } else {
      // Clear data when not authenticated
      isMountedRef.current = false; // Mark as unmounted
      setRequests([]);
      setLoading(false);
    }
    
    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
    };
  }, [loadRequests, isAuthenticated]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRequests();
  }, [loadRequests]);

  const getStatusColor = (status: string) => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'PENDING': return '#609CEF';
      case 'QUOTED': return '#F59E0B';
      case 'ACCEPTED': 
      case 'QUOTEACCEPTED':
      case 'QUOTE_ACCEPTED': return '#10B981';
      case 'SCHEDULED':
      case 'EN_ROUTE': return '#3B82F6';
      case 'ARRIVED': return '#8B5CF6';
      case 'CHECKING': return '#EC4899';
      case 'REPAIRING': return '#F97316';
      case 'PRICE_REVIEW': return '#F59E0B';
      case 'REPAIRED':
      case 'COMPLETED': return '#10B981';
      case 'CANCELLED': return '#EF4444';
      default: return '#609CEF';
    }
  };

  const getStatusIcon = (status: string) => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'PENDING': return 'time-outline';
      case 'QUOTED': return 'document-text-outline';
      case 'ACCEPTED':
      case 'QUOTEACCEPTED':
      case 'QUOTE_ACCEPTED': return 'checkmark-done-outline';
      case 'SCHEDULED': return 'calendar-outline';
      case 'EN_ROUTE': return 'car-outline';
      case 'ARRIVED': return 'location-outline';
      case 'CHECKING': return 'search-outline';
      case 'REPAIRING': return 'construct-outline';
      case 'PRICE_REVIEW': return 'cash-outline';
      case 'REPAIRED':
      case 'COMPLETED': return 'checkmark-circle';
      case 'CANCELLED': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const getStatusText = (status: string): string => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'PENDING': return 'Chờ xử lý';
      case 'QUOTED': return 'Đã báo giá';
      case 'ACCEPTED': 
      case 'QUOTEACCEPTED':
      case 'QUOTE_ACCEPTED': return 'Đã chấp nhận';
      case 'SCHEDULED': return 'Đã lên lịch';
      case 'EN_ROUTE': return 'Đang di chuyển';
      case 'ARRIVED': return 'Đã đến nơi';
      case 'CHECKING': return 'Đang kiểm tra';
      case 'REPAIRING': return 'Đang sửa chữa';
      case 'PRICE_REVIEW': return 'Chờ xác nhận giá';
      case 'REPAIRED': return 'Đã sửa xong';
      case 'COMPLETED': return 'Hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const handleRequestPress = (request: ServiceRequest) => {
    if (__DEV__) {
      console.log('🔍 [TechnicianActivity] Navigating to tracking:', {
        serviceRequestId: request.requestID,
        offerId: request.offerId || 'undefined',
        status: request.status
      });
    }
    
    const upperStatus = request.status.toUpperCase();
    
    // For PENDING/QUOTED status - navigate to quote selection to submit or view quote
    if (upperStatus === 'PENDING' || upperStatus === 'QUOTED') {
      router.push({
        pathname: '/technician/quote-selection',
        params: { orderId: request.requestID }
      });
      return;
    }
    
    // For all accepted/in-progress statuses - navigate to order tracking
    // Check if offerId exists, if not try to navigate anyway (tracking page will fetch it)
    router.push({
      pathname: '/technician/technician-order-tracking',
      params: { 
        serviceRequestId: request.requestID,
        ...(request.offerId && { offerId: request.offerId })
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#609CEF" />
        <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
      </View>
    );
  }

  if (requests.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.emptyContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="briefcase-outline" size={80} color="#CBD5E1" />
          </View>
          <Text style={styles.emptyTitle}>Chưa có đơn hàng nào</Text>
          <Text style={styles.emptySubtitle}>
            Các đơn hàng được giao cho bạn sẽ hiển thị ở đây
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={20} color="#609CEF" />
            <Text style={styles.refreshButtonText}>Làm mới</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <LinearGradient
          colors={['#609CEF', '#3B82F6']}
          style={styles.statsGradient}
        >
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{requests.length}</Text>
            <Text style={styles.statLabel}>Tổng đơn</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {requests.filter(r => {
                const status = r.status.toUpperCase();
                return ['SCHEDULED', 'EN_ROUTE', 'ARRIVED', 'CHECKING', 'REPAIRING', 'PRICE_REVIEW'].includes(status);
              }).length}
            </Text>
            <Text style={styles.statLabel}>Đang thực hiện</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {requests.filter(r => {
                const status = r.status.toUpperCase();
                return ['COMPLETED', 'REPAIRED'].includes(status);
              }).length}
            </Text>
            <Text style={styles.statLabel}>Hoàn thành</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Requests List */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Ionicons name="list" size={22} color="#1F2937" />
          <Text style={styles.listTitle}>Danh sách đơn hàng</Text>
        </View>

        {requests.map((request) => (
          <TouchableOpacity
            key={request.requestID}
            style={styles.requestCard}
            onPress={() => handleRequestPress(request)}
            activeOpacity={0.7}
          >
            <View style={styles.requestHeader}>
              <View style={styles.requestTitleRow}>
                <Ionicons name="construct" size={18} color="#609CEF" />
                <Text style={styles.requestTitle} numberOfLines={1}>
                  {request.serviceName}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${getStatusColor(request.status)}20` }
                ]}
              >
                <Ionicons
                  name={getStatusIcon(request.status) as any}
                  size={14}
                  color={getStatusColor(request.status)}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(request.status) }
                  ]}
                >
                  {getStatusText(request.status)}
                </Text>
              </View>
            </View>

            <View style={styles.requestDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={16} color="#64748B" />
                <Text style={styles.detailText}>{request.fullName || 'Không có tên'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={16} color="#64748B" />
                <Text style={styles.detailText} numberOfLines={2}>
                  {request.requestAddress || 'Không có địa chỉ'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={16} color="#64748B" />
                <Text style={styles.detailText}>
                  {formatDate(request.requestedDate)}
                </Text>
              </View>
            </View>

            <View style={styles.requestFooter}>
              <Text style={styles.viewDetailText}>Xem chi tiết</Text>
              <Ionicons name="chevron-forward" size={18} color="#609CEF" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 24,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#609CEF',
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#609CEF',
  },
  statsContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#609CEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  statsGradient: {
    flexDirection: 'row',
    padding: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 12,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  requestTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  requestDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  requestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 4,
  },
  viewDetailText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#609CEF',
  },
  bottomSpacing: {
    height: 20,
  },
});
