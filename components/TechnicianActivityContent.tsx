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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { serviceRequestService } from '../lib/api/serviceRequests';

interface ServiceRequest {
  requestID: string;
  serviceDescription: string;
  fullName: string | null;
  phoneNumber: string | null;
  requestAddress: string | null;
  requestedDate: string;
  status: string; // Status from API is string like "PENDING", "ACCEPTED", etc.
}

export default function TechnicianActivityContent() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      if (__DEV__) console.log('📥 [TechnicianActivity] Loading service requests...');
      
      const response = await serviceRequestService.getUserServiceRequests();
      
      if (__DEV__) {
        console.log(`✅ [TechnicianActivity] Loaded ${response.length} requests`);
        if (response.length > 0) {
          console.log('📋 First request sample:', {
            id: response[0].requestID,
            description: response[0].serviceDescription,
            status: response[0].status
          });
        }
      }
      
      // Sort by date (newest first)
      const sorted = response.sort((a, b) => 
        new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime()
      );
      
      // Map to our interface
      const mapped: ServiceRequest[] = sorted.map(r => ({
        requestID: r.requestID,
        serviceDescription: r.serviceDescription,
        fullName: r.fullName,
        phoneNumber: r.phoneNumber,
        requestAddress: r.requestAddress,
        requestedDate: r.requestedDate,
        status: r.status,
      }));
      
      if (__DEV__) console.log(`📊 [TechnicianActivity] Setting ${mapped.length} requests to state`);
      
      setRequests(mapped);
    } catch (error: any) {
      if (__DEV__) console.error('❌ Load requests error:', error);
      // Don't show error to user, just keep empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRequests();
  }, [loadRequests]);

  const getStatusColor = (status: string) => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'PENDING': return '#F59E0B';
      case 'ACCEPTED': return '#609CEF';
      case 'QUOTED': return '#8B5CF6';
      case 'QUOTE_ACCEPTED': return '#10B981';
      case 'IN_PROGRESS': return '#3B82F6';
      case 'COMPLETED': return '#10B981';
      case 'CANCELLED': return '#EF4444';
      default: return '#94A3B8';
    }
  };

  const getStatusIcon = (status: string) => {
    const upperStatus = status.toUpperCase();
    switch (upperStatus) {
      case 'PENDING': return 'time-outline';
      case 'ACCEPTED': return 'checkmark-circle-outline';
      case 'QUOTED': return 'document-text-outline';
      case 'QUOTE_ACCEPTED': return 'checkmark-done-outline';
      case 'IN_PROGRESS': return 'construct-outline';
      case 'COMPLETED': return 'checkmark-circle';
      case 'CANCELLED': return 'close-circle-outline';
      default: return 'help-circle-outline';
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
    const upperStatus = request.status.toUpperCase();
    // Navigate to order detail/tracking based on status
    if (upperStatus === 'ACCEPTED' || upperStatus === 'QUOTED') {
      // ACCEPTED or QUOTED - can submit quote or view quote
      router.push({
        pathname: '/technician/quote-selection',
        params: { orderId: request.requestID }
      });
    } else {
      // Other statuses - view order tracking
      router.push({
        pathname: '/technician/order-tracking',
        params: { orderId: request.requestID }
      });
    }
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
              {requests.filter(r => r.status.toUpperCase() === 'IN_PROGRESS').length}
            </Text>
            <Text style={styles.statLabel}>Đang thực hiện</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {requests.filter(r => r.status.toUpperCase() === 'COMPLETED').length}
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
                  {request.serviceDescription}
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
                  {request.status}
                </Text>
              </View>
            </View>

            <View style={styles.requestDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={16} color="#64748B" />
                <Text style={styles.detailText}>{request.fullName || 'Không có tên'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={16} color="#64748B" />
                <Text style={styles.detailText}>{request.phoneNumber || 'Không có SĐT'}</Text>
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
