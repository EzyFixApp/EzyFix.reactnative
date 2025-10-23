/**
 * Booking History Screen - Comprehensive Order Management
 * Features:
 * - Two-tab layout: Active Orders (Đang tiếp nhận) & History (Lịch sử)
 * - Real-time order tracking for active orders
 * - Beautiful UI matching dashboard design
 * - Pull-to-refresh functionality
 * - Empty states for better UX
 * - Order filtering and status badges
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import withCustomerAuth from '../../lib/auth/withCustomerAuth';
import { serviceRequestService } from '../../lib/api/serviceRequests';
import { servicesService } from '../../lib/api/services';
import { useAuth } from '../../store/authStore';
import QuoteNotificationModal from '../../components/QuoteNotificationModal';
import { serviceDeliveryOffersService } from '../../lib/api/serviceDeliveryOffers';
import { useNotifications } from '../../hooks/useNotifications';

// Types
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
  // Quote notification fields
  pendingQuote?: {
    offerID: string;
    estimatedCost?: number;
    finalCost?: number;
    notes?: string;
  };
}

type TabType = 'active' | 'history';

function BookingHistory() {
  const { isAuthenticated, user } = useAuth();
  const { notifyNewQuote } = useNotifications();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastCheckedQuotes, setLastCheckedQuotes] = useState<Set<string>>(new Set());
  
  // Quote notification modal state
  const [quoteModalVisible, setQuoteModalVisible] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<{
    offerID: string;
    serviceName: string;
    technicianName: string;
    estimatedCost?: number;
    finalCost?: number;
    notes?: string;
    serviceRequestId: string;
  } | null>(null);

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

  // Check if order is active (not completed or cancelled)
  const isActiveOrder = (status: BookingItem['status']): boolean => {
    return status !== 'completed' && status !== 'cancelled';
  };

  // Load bookings from API
  const loadBookings = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const serviceRequests = await serviceRequestService.getUserServiceRequests();

      const transformedBookings: BookingItem[] = await Promise.all(
        serviceRequests.map(async (request) => {
          let serviceName = 'Dịch vụ';

          try {
            const service = await servicesService.getServiceById(request.serviceId);
            serviceName = service.serviceName || service.description || 'Dịch vụ';
          } catch (error) {
            serviceName = request.serviceDescription || 'Dịch vụ';
          }

          const addressText = request.requestAddress || request.addressNote || 'Địa chỉ chưa cập nhật';

          // Check for pending quotes
          let pendingQuote = undefined;
          try {
            const pendingOffers = await serviceDeliveryOffersService.getPendingOffers(request.requestID);
            
            if (__DEV__) {
              console.log(`📋 Request ${request.requestID} - Status: ${request.status}, Pending Offers: ${pendingOffers.length}`);
            }
            
            if (pendingOffers.length > 0) {
              // Take the first pending offer (most recent)
              const offer = pendingOffers[0];
              pendingQuote = {
                offerID: offer.offerId,  // Backend uses lowercase 'offerId'
                estimatedCost: offer.estimatedCost,
                finalCost: offer.finalCost,
                notes: offer.notes,
              };
              
              if (__DEV__) {
                console.log(`💰 Found quote for ${request.requestID}:`, {
                  offerID: offer.offerId,
                  estimatedCost: offer.estimatedCost,
                  finalCost: offer.finalCost
                });
              }

              // Send notification if this is a NEW quote (not checked before)
              if (!lastCheckedQuotes.has(offer.offerId)) {
                const amount = offer.estimatedCost || offer.finalCost || 0;
                await notifyNewQuote({
                  type: 'new_quote',
                  quoteId: offer.offerId,
                  serviceRequestId: request.requestID,
                  serviceName,
                  technicianName: offer.technicianId, // TODO: Get technician name
                  amount,
                  isEstimated: !!offer.estimatedCost,
                  notes: offer.notes,
                });

                // Mark this quote as checked
                setLastCheckedQuotes(prev => new Set(prev).add(offer.offerId));
              }
            }
          } catch (error) {
            if (__DEV__) console.warn(`Could not fetch pending quotes for ${request.requestID}`);
          }

          const mappedStatus = mapApiStatus(request.status);
          
          if (__DEV__) {
            console.log(`📦 Booking ${request.requestID}: API Status="${request.status}" → UI Status="${mappedStatus}", Has Quote: ${!!pendingQuote}`);
          }

          return {
            id: request.requestID || `booking-${Date.now()}-${Math.random()}`,
            serviceName,
            servicePrice: 'Đang cập nhật',
            customerName: request.fullName || user?.firstName || '',
            phoneNumber: request.phoneNumber || user?.email || '',
            address: addressText,
            status: mappedStatus,
            createdAt: request.createdDate || new Date().toISOString(),
            notes: request.serviceDescription,
            addressNote: request.addressNote || undefined,
            requestedDate: request.requestedDate,
            expectedStartTime: request.expectedStartTime,
            pendingQuote,
          };
        })
      );

      setBookings(transformedBookings);
    } catch (error: any) {
      if (__DEV__) console.error('❌ Error loading bookings:', error);
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data when component mounts or is focused
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadBookings();
      }
    }, [isAuthenticated])
  );

  // Handle refresh
  const handleRefresh = () => {
    loadBookings(true);
  };

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === 'active') {
      return isActiveOrder(booking.status);
    } else {
      return !isActiveOrder(booking.status);
    }
  });

  // Get status info (color, text, etc.)
  const getStatusInfo = (status: BookingItem['status']) => {
    switch (status) {
      case 'searching':
        return {
          text: 'Đang tìm thợ',
          color: '#F59E0B',
          backgroundColor: '#FEF3C7',
          icon: 'search' as const,
        };
      case 'quoted':
        return {
          text: 'Có báo giá',
          color: '#3B82F6',
          backgroundColor: '#DBEAFE',
          icon: 'document-text' as const,
        };
      case 'accepted':
        return {
          text: 'Đã chấp nhận',
          color: '#8B5CF6',
          backgroundColor: '#EDE9FE',
          icon: 'checkmark-circle' as const,
        };
      case 'in-progress':
        return {
          text: 'Đang thực hiện',
          color: '#06B6D4',
          backgroundColor: '#CFFAFE',
          icon: 'construct' as const,
        };
      case 'completed':
        return {
          text: 'Hoàn thành',
          color: '#10B981',
          backgroundColor: '#D1FAE5',
          icon: 'checkmark-done-circle' as const,
        };
      case 'cancelled':
        return {
          text: 'Đã hủy',
          color: '#EF4444',
          backgroundColor: '#FEE2E2',
          icon: 'close-circle' as const,
        };
      default:
        return {
          text: 'Đang xử lý',
          color: '#6B7280',
          backgroundColor: '#F3F4F6',
          icon: 'time' as const,
        };
    }
  };

  // Render booking card
  const renderBookingCard = (booking: BookingItem) => {
    const statusInfo = getStatusInfo(booking.status);
    const isActive = isActiveOrder(booking.status);

    return (
      <TouchableOpacity
        key={booking.id}
        style={[
          styles.bookingCard,
          { borderLeftColor: statusInfo.color },
        ]}
        onPress={() =>
          router.push({
            pathname: './order-tracking',
            params: { orderId: booking.id },
          } as any)
        }
        activeOpacity={0.7}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName} numberOfLines={1}>
              {booking.serviceName}
            </Text>
            <Text style={styles.serviceDate}>
              {new Date(booking.createdAt).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}{' '}
              •{' '}
              {new Date(booking.createdAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusInfo.backgroundColor },
            ]}
          >
            <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          {/* Address */}
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#64748B" />
            <Text style={styles.infoText} numberOfLines={2}>
              {booking.address}
            </Text>
          </View>

          {/* Customer Info */}
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color="#64748B" />
            <Text style={styles.infoText}>
              {booking.customerName} • {booking.phoneNumber}
            </Text>
          </View>

          {/* Scheduled Time */}
          {booking.requestedDate && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#64748B" />
              <Text style={styles.infoText}>
                Lịch hẹn:{' '}
                {new Date(booking.requestedDate).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
                {booking.expectedStartTime &&
                  ` - ${new Date(booking.expectedStartTime).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`}
              </Text>
            </View>
          )}

          {/* Notes */}
          {booking.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesText} numberOfLines={2}>
                {booking.notes}
              </Text>
            </View>
          )}
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Giá dịch vụ:</Text>
            <Text style={styles.priceText}>
              {booking.quotePrice || booking.servicePrice}
            </Text>
          </View>

          {/* Show "Xem báo giá" button if status is 'quoted' and has pendingQuote */}
          {booking.status === 'quoted' && booking.pendingQuote ? (
            <TouchableOpacity
              style={styles.quoteButton}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedQuote({
                  offerID: booking.pendingQuote!.offerID,
                  serviceName: booking.serviceName,
                  technicianName: booking.technicianName || 'Thợ',
                  estimatedCost: booking.pendingQuote!.estimatedCost,
                  finalCost: booking.pendingQuote!.finalCost,
                  notes: booking.pendingQuote!.notes,
                  serviceRequestId: booking.id,
                });
                setQuoteModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.quoteGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="receipt" size={16} color="#FFFFFF" />
                <Text style={styles.quoteButtonText}>Xem báo giá</Text>
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>MỚI</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ) : isActive ? (
            <TouchableOpacity
              style={styles.trackButton}
              onPress={(e) => {
                e.stopPropagation();
                router.push({
                  pathname: './order-tracking',
                  params: { orderId: booking.id },
                } as any);
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#609CEF', '#4F8BE8']}
                style={styles.trackGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="location" size={16} color="#FFFFFF" />
                <Text style={styles.trackButtonText}>Theo dõi</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.viewDetailsButton} activeOpacity={0.7}>
              <Text style={styles.viewDetailsText}>Chi tiết</Text>
              <Ionicons name="chevron-forward" size={16} color="#609CEF" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    const isActiveTab = activeTab === 'active';

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconContainer}>
          <LinearGradient
            colors={['#F3F4F6', '#E5E7EB']}
            style={styles.emptyIconGradient}
          >
            <Ionicons
              name={isActiveTab ? 'clipboard-outline' : 'time-outline'}
              size={48}
              color="#9CA3AF"
            />
          </LinearGradient>
        </View>
        <Text style={styles.emptyTitle}>
          {isActiveTab ? 'Chưa có đơn hàng đang thực hiện' : 'Chưa có lịch sử đơn hàng'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {isActiveTab
            ? 'Các đơn hàng đang được xử lý sẽ hiển thị ở đây'
            : 'Lịch sử các đơn hàng đã hoàn thành hoặc hủy sẽ hiển thị ở đây'}
        </Text>
        {isActiveTab && (
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('./all-services' as any)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#609CEF', '#4F8BE8']}
              style={styles.createGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.createButtonText}>Đặt dịch vụ ngay</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quản lý đơn hàng</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={24} color="#609CEF" />
          </TouchableOpacity>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.activeTab]}
            onPress={() => setActiveTab('active')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="hourglass-outline"
              size={20}
              color={activeTab === 'active' ? '#609CEF' : '#64748B'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'active' && styles.activeTabText,
              ]}
            >
              Đang tiếp nhận
            </Text>
            {bookings.filter((b) => isActiveOrder(b.status)).length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {bookings.filter((b) => isActiveOrder(b.status)).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="time-outline"
              size={20}
              color={activeTab === 'history' ? '#609CEF' : '#64748B'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'history' && styles.activeTabText,
              ]}
            >
              Lịch sử
            </Text>
            {bookings.filter((b) => !isActiveOrder(b.status)).length > 0 && (
              <View style={[styles.badge, styles.historyBadge]}>
                <Text style={styles.badgeText}>
                  {bookings.filter((b) => !isActiveOrder(b.status)).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#609CEF" />
            <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#609CEF']}
                tintColor="#609CEF"
              />
            }
          >
            {filteredBookings.length > 0 ? (
              <View style={styles.bookingsList}>
                {filteredBookings.map((booking) => renderBookingCard(booking))}
              </View>
            ) : (
              renderEmptyState()
            )}

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        )}
      </View>

      {/* Quote Notification Modal */}
      {selectedQuote && (
        <QuoteNotificationModal
          visible={quoteModalVisible}
          onClose={() => {
            setQuoteModalVisible(false);
            setSelectedQuote(null);
          }}
          quote={selectedQuote}
          onAccepted={() => {
            // Reload bookings after accepting quote
            loadBookings(true);
          }}
          onRejected={() => {
            // Reload bookings after rejecting quote
            loadBookings(true);
          }}
        />
      )}
    </SafeAreaView>
  );
}

export default withCustomerAuth(BookingHistory, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tab Container
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#EFF6FF',
    borderColor: '#609CEF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#609CEF',
  },
  badge: {
    backgroundColor: '#609CEF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyBadge: {
    backgroundColor: '#64748B',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  // Bookings List
  bookingsList: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  // Card Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
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
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
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
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Card Body
  cardBody: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  notesContainer: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#CBD5E1',
  },
  notesText: {
    fontSize: 13,
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  trackButton: {
    borderRadius: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#609CEF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  quoteButton: {
    borderRadius: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  quoteGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  quoteButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  newBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  trackGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  trackButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#609CEF',
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#609CEF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  createGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  bottomSpacing: {
    height: 40,
  },
});
