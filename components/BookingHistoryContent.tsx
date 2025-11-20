/**
 * Booking History Content Fragment
 * Extracted booking history content without header/footer
 * Used in tab-based container
 * 
 * Features:
 * - Two-tab layout: Active Orders (Đang tiếp nhận) & History (Lịch sử)
 * - Order filtering by status
 * - Beautiful card design with status badges
 * - Pull-to-refresh functionality
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
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { serviceRequestService } from '../lib/api/serviceRequests';
import { servicesService } from '../lib/api/services';
import { addressService } from '../lib/api/addresses';
import { serviceDeliveryOffersService } from '../lib/api/serviceDeliveryOffers';
import { appointmentsService } from '../lib/api/appointments';
import { mediaService } from '../lib/api/media';
import { ServiceRequestResponse } from '../types/api';
import { useAuth } from '../store/authStore';
import QuoteNotificationModal from './QuoteNotificationModal';
import { useNotifications } from '../hooks/useNotifications';
import ReviewModal from './ReviewModal';
import { reviewService, ReviewResponse } from '../lib/api/reviews';

interface BookingItem {
  id: string;
  serviceName: string;
  servicePrice: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  status: 'searching' | 'quoted' | 'accepted' | 'in-progress' | 'price-review' | 'payment' | 'completed' | 'cancelled';
  createdAt: string;
  technicianName?: string;
  quotePrice?: string;
  notes?: string;
  addressNote?: string;
  requestedDate?: string;
  expectedStartTime?: string;
  technicianNotes?: string;
  // Media arrays
  issueMedia?: string[];
  initialMedia?: string[];
  finalMedia?: string[];
  // Quote notification fields
  pendingQuote?: {
    offerID: string;
    estimatedCost?: number;
    finalCost?: number;
    notes?: string;
    technician?: {
      technicianId: string;
      technicianName: string;
      technicianAvatar?: string;
      technicianRating?: number;
    };
  };
  // Store actual API status for accurate filtering
  actualServiceRequestStatus?: string; // ServiceRequest status from API
  actualAppointmentStatus?: string; // Appointment status from API
  // Payment information (for REPAIRED status)
  appointmentId?: string;
  finalPrice?: number;
  paidAmount?: number; // Actual paid amount (after voucher discount)
  // Review information
  existingReview?: ReviewResponse | null;
}

type TabType = 'active' | 'history';

// Check if order is active based on ACTUAL API statuses
// Only move to history when:
// - ServiceRequest status = "Completed" 
// - OR Appointment status = "COMPLETED", "CANCELLED", "DISPUTE"
const isActiveOrder = (booking: BookingItem): boolean => {
  const serviceRequestStatus = booking.actualServiceRequestStatus?.toUpperCase() || '';
  const appointmentStatus = booking.actualAppointmentStatus?.toUpperCase() || '';
  
  // Check ServiceRequest status first
  if (serviceRequestStatus === 'COMPLETED' || serviceRequestStatus === 'CANCELLED') {
    return false; // Move to history
  }
  
  // Check Appointment status
  if (appointmentStatus === 'COMPLETED' || 
      appointmentStatus === 'CANCELLED' || 
      appointmentStatus === 'DISPUTE') {
    return false; // Move to history
  }
  
  // All other statuses (including REPAIRED/payment) are active
  return true;
};

interface BookingHistoryContentProps {
  onRefresh?: () => void;
  refreshing?: boolean;
  initialTab?: TabType; // Allow parent to specify which tab to start on
}

export default function BookingHistoryContent({ onRefresh, refreshing: externalRefreshing, initialTab = 'active' }: BookingHistoryContentProps) {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [lastCheckedQuotes, setLastCheckedQuotes] = useState<Set<string>>(new Set());
  
  // Auto-refresh interval (5 seconds for near real-time)
  const REFRESH_INTERVAL = 30000;
  
  // Quote notification modal state
  const [quoteModalVisible, setQuoteModalVisible] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<{
    offerID: string;
    serviceName: string;
    technicianName: string;
    technicianId?: string;
    technicianAvatar?: string;
    technicianRating?: number;
    estimatedCost?: number;
    finalCost?: number;
    notes?: string;
    serviceRequestId: string;
  } | null>(null);
  
  // Review modal state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<{
    appointmentId: string;
    providerId: string;
    technicianName: string;
    serviceName: string;
    existingReview?: ReviewResponse | null;
  } | null>(null);
  
  const { isAuthenticated, user } = useAuth();
  const { notifyNewQuote } = useNotifications();
  const isMountedRef = React.useRef(true); // Track if component is mounted

  // Map API status to UI status
  const mapApiStatus = (apiStatus: string): BookingItem['status'] => {
    switch (apiStatus.toLowerCase()) {
      case 'pending':
      case 'waiting':
        return 'searching';
      case 'quoted':
        return 'quoted';
      case 'quote_accepted':
      case 'accepted':
      case 'scheduled':
        return 'accepted';
      case 'in_progress':
      case 'in-progress':
      case 'en_route':
      case 'arrived':
      case 'checking':
      case 'repairing':
        return 'in-progress';
      case 'price_review':
        return 'price-review';
      case 'repaired':
        return 'payment'; // REPAIRED = Chờ thanh toán
      case 'completed':
        return 'completed';
      case 'cancelled':
      case 'dispute':
        return 'cancelled';
      default:
        return 'searching';
    }
  };

  // Load bookings from API
  const loadBookings = async (showRefresh = false, silent = false) => {
    try {
      // Don't load if not authenticated or component unmounted
      if (!isAuthenticated || !isMountedRef.current) {
        if (__DEV__) console.log('⏭️ [BookingHistory] Not authenticated or unmounted, skipping load');
        return;
      }
      
      // Only show loading indicators if not silent refresh
      if (!silent) {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
      }
      
      // OPTIMIZATION: Fetch all reviews ONCE before processing bookings
      let allReviews: ReviewResponse[] = [];
      try {
        allReviews = await reviewService.getMyReviews();
        if (__DEV__) console.log(`📋 [BookingHistory] Pre-fetched ${allReviews.length} reviews for caching`);
      } catch (error) {
        if (__DEV__) console.warn('⚠️ [BookingHistory] Could not pre-fetch reviews:', error);
      }
      
      // Create review lookup map for O(1) access
      const reviewsByAppointmentId = new Map<string, ReviewResponse>();
      allReviews.forEach(review => {
        if (review.appointmentId) {
          reviewsByAppointmentId.set(review.appointmentId, review);
        }
      });
      
      // Get service requests
      const serviceRequests = await serviceRequestService.getUserServiceRequests();
      
      // Check again after async call
      if (!isMountedRef.current || !isAuthenticated) {
        if (__DEV__) console.log('⏭️ [BookingHistory] Component unmounted during load, aborting');
        return;
      }
      
      // OPTIMIZATION: Pre-fetch all unique services to avoid N calls
      const uniqueServiceIds = [...new Set(serviceRequests.map(req => req.serviceId))];
      const servicesMap = new Map<string, any>();
      
      if (__DEV__) console.log(`🔍 [BookingHistory] Pre-fetching ${uniqueServiceIds.length} unique services`);
      
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
      
      if (__DEV__) console.log(`✅ [BookingHistory] Cached ${servicesMap.size} services`);
      
      // Transform API data to BookingItem format
      const transformedBookings: BookingItem[] = await Promise.all(
        serviceRequests.map(async (request) => {
          
          let serviceName = 'Dịch vụ';
          let addressText = 'Địa chỉ chưa cập nhật';

          // OPTIMIZATION: Use cached service from map
          const cachedService = servicesMap.get(request.serviceId);
          if (cachedService) {
            serviceName = cachedService.serviceName || cachedService.description || 'Dịch vụ';
          } else {
            serviceName = request.serviceDescription || 'Dịch vụ';
          }

          // Use requestAddress from API response (already contains full address text)
          // No need to fetch addressID separately
          addressText = request.requestAddress || request.addressNote || 'Địa chỉ chưa cập nhật';
          
          // Check for pending quotes and actual appointment status
          let pendingQuote = undefined;
          let quotePrice = undefined;
          let actualStatus = request.status; // Will be overridden by appointment status if available
          let technicianNotes: string | undefined = undefined;
          let issueMedia: string[] = [];
          let initialMedia: string[] = [];
          let finalMedia: string[] = [];
          let appointmentId: string | undefined = undefined;
          let finalPrice: number | undefined = undefined;
          let paidAmount: number | undefined = undefined; // Actual payment amount (after voucher)
          let existingReview: ReviewResponse | null = null;
          
          try {
            // OPTIMIZATION: Parallel fetch offers and appointments
            const [allOffers, appointments] = await Promise.all([
              serviceDeliveryOffersService.getAllOffers(request.requestID),
              appointmentsService.getAppointmentsByServiceRequest(request.requestID)
            ]);
            
            if (__DEV__) console.log(`📋 [BookingHistory] Fetched ${allOffers.length} offers and ${appointments.length} appointments for ${request.requestID}`);
            
            // Find accepted offer
            const acceptedOffers = allOffers.filter(offer => 
              offer.status.toLowerCase() === 'accepted' || 
              offer.status.toLowerCase() === 'quote_accepted'
            );
            
            if (acceptedOffers.length > 0) {
              const offer = acceptedOffers[0];
              
              // Capture technician notes from offer
              technicianNotes = offer.notes;
              
              // Process appointments (already fetched in parallel above)
              try {
                // Take the most recent appointment (last in array)
                if (appointments.length > 0) {
                  const appointment = appointments[appointments.length - 1];
                  actualStatus = appointment.status; // Override with appointment status (includes PRICE_REVIEW)
                  appointmentId = appointment.id; // Store appointment ID for payment navigation
                  // Store price from offer for payment (finalCost or estimatedCost)
                  finalPrice = offer.finalCost || offer.estimatedCost;
                  
                  // Get paymentAmount from appointment (for COMPLETED/REPAIRED status)
                  // REPAIRED means technician finished work, COMPLETED means customer paid
                  if (appointment.paymentAmount && (actualStatus?.toUpperCase() === 'COMPLETED' || actualStatus?.toUpperCase() === 'REPAIRED')) {
                    paidAmount = appointment.paymentAmount;
                    if (__DEV__) console.log(`💳 [BookingHistory] Payment amount from appointment ${appointmentId}:`, paidAmount, 'status:', actualStatus);
                  }
                  
                  // OPTIMIZATION: Use cached review from pre-fetched map
                  if (appointmentId && reviewsByAppointmentId.has(appointmentId)) {
                    existingReview = reviewsByAppointmentId.get(appointmentId) || null;
                    if (__DEV__) console.log(`⭐ [BookingHistory] Found cached review for appointment ${appointmentId}`);
                  }
                  
                  if (__DEV__) console.log(`✅ [BookingHistory] Appointment status for ${request.requestID}:`, {
                    appointmentId: appointment.id,
                    status: actualStatus,
                    finalPrice: finalPrice,
                    paymentAmount: appointment.paymentAmount
                  });
                  
                  // Fetch media for this appointment
                  try {
                    const mediaData = await mediaService.getMediaByRequest(request.requestID, appointment.id);
                    
                    // Filter by MediaType
                    const issueMediaUrls = mediaData
                      .filter(m => m.mediaType === 'ISSUE')
                      .map(m => m.fileURL);
                    
                    const initialMediaUrls = mediaData
                      .filter(m => m.mediaType === 'INITIAL')
                      .map(m => m.fileURL);
                    
                    const finalMediaUrls = mediaData
                      .filter(m => m.mediaType === 'FINAL')
                      .map(m => m.fileURL);
                    
                    // Store media URLs in booking item
                    issueMedia = issueMediaUrls;
                    initialMedia = initialMediaUrls;
                    finalMedia = finalMediaUrls;
                    
                    if (__DEV__) {
                      console.log(`📷 [BookingHistory] Media for ${request.requestID}:`, {
                        issue: issueMediaUrls.length,
                        initial: initialMediaUrls.length,
                        final: finalMediaUrls.length
                      });
                    }
                  } catch (mediaError) {
                    if (__DEV__) console.warn(`⚠️ [BookingHistory] Could not fetch media for ${request.requestID}:`, mediaError);
                  }
                  
                  // Review already fetched from cache above (reviewsByAppointmentId map)
                } else {
                  if (__DEV__) console.log(`⚠️ [BookingHistory] No appointments found for ${request.requestID}`);
                }
              } catch (error) {
                if (__DEV__) console.warn(`⚠️ [BookingHistory] Could not fetch appointments for ${request.requestID}:`, error);
              }
              
              // Set price display based on actual status
              if (actualStatus.toUpperCase() === 'PRICE_REVIEW') {
                // In PRICE_REVIEW: Show "Đang chờ bạn xác nhận"
                quotePrice = 'Đang chờ bạn xác nhận';
              } else {
                // Other statuses: Show actual price
                const price = offer.finalCost || offer.estimatedCost || 0;
                const isEstimated = !offer.finalCost && !!offer.estimatedCost;
                
                quotePrice = new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(price) + (isEstimated ? ' (Dự kiến)' : ' (Đã chốt)');
              }
              
              if (__DEV__) {
                console.log(`💰 [BookingHistory] Accepted quote for ${request.requestID}:`, {
                  offerID: offer.offerId,
                  actualStatus,
                  price: quotePrice
                });
              }
            } else {
              // No accepted offers - check for PENDING offers in allOffers (already fetched)
              const pendingOffers = allOffers.filter(offer => 
                offer.status.toLowerCase() === 'pending'
              );
              
              if (__DEV__) {
                console.log(`📋 [BookingHistory] Request ${request.requestID} - Status: ${request.status}, Pending Offers: ${pendingOffers.length}`);
              }
              
              if (pendingOffers.length > 0) {
                // Take the first pending offer (most recent)
                const offer = pendingOffers[0];
                
                // OPTIMIZATION: Fetch full offer details only if needed (for technician info)
                // Most offers already have basic data, only fetch if missing technician
                let technicianInfo = undefined;
                
                if (offer.offerId) {
                  try {
                    const fullOfferDetails = await serviceDeliveryOffersService.getOfferById(offer.offerId);
                    technicianInfo = fullOfferDetails.technician ? {
                      technicianId: fullOfferDetails.technician.technicianId,
                      technicianName: fullOfferDetails.technician.technicianName || 'Thợ',
                      technicianAvatar: fullOfferDetails.technician.technicianAvatar,
                      technicianRating: fullOfferDetails.technician.technicianRating,
                    } : undefined;
                  } catch (error) {
                    if (__DEV__) console.warn(`⚠️ [BookingHistory] Could not fetch full offer details:`, error);
                  }
                }
                
                pendingQuote = {
                  offerID: offer.offerId, // Backend uses lowercase 'offerId'
                  estimatedCost: offer.estimatedCost,
                  finalCost: offer.finalCost,
                  notes: offer.notes,
                  technician: technicianInfo,
                };
                
                if (__DEV__) {
                  console.log(`💰 [BookingHistory] Found quote for ${request.requestID}:`, {
                    offerID: offer.offerId,
                    estimatedCost: offer.estimatedCost,
                    finalCost: offer.finalCost,
                    technician: technicianInfo?.technicianName,
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
                    technicianName: pendingQuote?.technician?.technicianName || 'Thợ sửa chữa',
                    amount,
                    isEstimated: !!offer.estimatedCost,
                    notes: offer.notes,
                  });

                  // Mark this quote as checked
                  setLastCheckedQuotes(prev => new Set(prev).add(offer.offerId));
                }
              }
            }
          } catch (error) {
            if (__DEV__) console.warn(`[BookingHistory] Could not fetch quotes for ${request.requestID}:`, error);
          }

          // IMPORTANT: ServiceRequest status takes priority over Appointment status
          // If ServiceRequest is COMPLETED/CANCELLED, use that regardless of Appointment status
          let finalStatus = actualStatus;
          const serviceRequestStatus = request.status.toUpperCase();
          
          if (serviceRequestStatus === 'COMPLETED' || serviceRequestStatus === 'CANCELLED') {
            finalStatus = request.status; // Use ServiceRequest status (higher priority)
            if (__DEV__) {
              console.log(`⚠️ [BookingHistory] ServiceRequest ${request.requestID} is ${serviceRequestStatus}, overriding Appointment status`);
            }
          }

          // Review already fetched from cache (no need to call API again)
          // existingReview was set from reviewsByAppointmentId map above

          const mappedStatus = mapApiStatus(finalStatus);
          
          if (__DEV__) {
            console.log(`📦 [BookingHistory] Booking ${request.requestID}: ServiceRequest Status="${request.status}", Appointment Status="${actualStatus}", Final Status="${finalStatus}" → UI Status="${mappedStatus}", Has Quote: ${!!pendingQuote}, Quote Price: ${quotePrice || 'N/A'}`, existingReview ? '✅ Has Review' : '❌ No Review');
          }
          
          return {
            id: request.requestID || `booking-${Date.now()}-${Math.random()}`,
            serviceName,
            servicePrice: quotePrice || 'Đang cập nhật', // Use quotePrice if available
            customerName: request.fullName || user?.firstName || '',
            phoneNumber: request.phoneNumber || user?.email || '',
            address: addressText,
            status: mappedStatus,
            createdAt: request.createdDate || new Date().toISOString(),
            notes: request.serviceDescription,
            addressNote: request.addressNote || undefined,
            requestedDate: request.requestedDate,
            expectedStartTime: request.expectedStartTime,
            technicianNotes: technicianNotes,
            issueMedia: issueMedia,
            initialMedia: initialMedia,
            finalMedia: finalMedia,
            pendingQuote,
            // Store actual API statuses for accurate filtering
            actualServiceRequestStatus: request.status,
            actualAppointmentStatus: finalStatus, // Use final status (ServiceRequest takes priority)
            // Payment info for REPAIRED status
            appointmentId: appointmentId,
            finalPrice: finalPrice,
            paidAmount: paidAmount, // Actual paid amount (after voucher)
            // Review info
            existingReview: existingReview,
          };
        })
      );
      
      // Final check before updating state
      if (!isMountedRef.current || !isAuthenticated) {
        if (__DEV__) console.log('⏭️ [BookingHistory] Component unmounted before setting state, aborting');
        return;
      }
      
      setBookings(transformedBookings);
      
    } catch (error: any) {
      // Don't update state if component unmounted
      if (!isMountedRef.current) {
        return;
      }
      
      // Silently handle auth errors during logout
      if (error.status_code === 401) {
        if (__DEV__) console.log('⏭️ [BookingHistory] Session expired, skipping error handling');
        return;
      }
      
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
        isMountedRef.current = true; // Mark as mounted
        loadBookings(); // Initial load with loading indicator
        
        // Set up auto-refresh interval for real-time updates (silent background refresh)
        const interval = setInterval(() => {
          if (isAuthenticated && isMountedRef.current) {
            loadBookings(false, true); // Silent refresh: no loading indicators
          }
        }, REFRESH_INTERVAL);

        // Cleanup interval when unfocused
        return () => {
          isMountedRef.current = false; // Mark as unmounted
          if (interval) {
            clearInterval(interval);
          }
        };
      } else {
        isMountedRef.current = false; // Mark as unmounted if not authenticated
      }
    }, [isAuthenticated])
  );

  // Handle refresh (user initiated pull-to-refresh)
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
    loadBookings(true, false); // Show refresh indicator when user manually pulls
  };

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter((booking) => {
    if (activeTab === 'active') {
      return isActiveOrder(booking);
    } else {
      return !isActiveOrder(booking);
    }
  });

  // Get status info (color, text, icon) - Using primary brand color with variations
  const getStatusInfo = (status: BookingItem['status']) => {
    switch (status) {
      case 'searching':
        return {
          text: 'Đang tìm thợ',
          color: '#609CEF',
          backgroundColor: '#E5F0FF',
          icon: 'search' as const,
        };
      case 'quoted':
        return {
          text: 'Có báo giá',
          color: '#4F8BE8',
          backgroundColor: '#E5F0FF',
          icon: 'document-text' as const,
        };
      case 'accepted':
        return {
          text: 'Đã chấp nhận',
          color: '#609CEF',
          backgroundColor: '#E5F0FF',
          icon: 'checkmark-circle' as const,
        };
      case 'in-progress':
        return {
          text: 'Đang thực hiện',
          color: '#4F8BE8',
          backgroundColor: '#E5F0FF',
          icon: 'construct' as const,
        };
      case 'price-review':
        return {
          text: 'Chờ xác nhận giá',
          color: '#8B5CF6',
          backgroundColor: '#F3E8FF',
          icon: 'cash' as const,
        };
      case 'payment':
        return {
          text: 'Chờ thanh toán',
          color: '#F59E0B',
          backgroundColor: '#FEF3C7',
          icon: 'card' as const,
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
          color: '#609CEF',
          backgroundColor: '#E5F0FF',
          icon: 'time' as const,
        };
    }
  };

  // Render booking card
  const renderBookingCard = (booking: BookingItem) => {
    const statusInfo = getStatusInfo(booking.status);
    const isActive = isActiveOrder(booking);
    
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
            <Text style={styles.priceLabel}>
              {/* Show "Đã thanh toán" when paidAmount is available (orders with voucher discount) */}
              {booking.paidAmount ? 'Đã thanh toán:' : 'Giá dịch vụ:'}
            </Text>
            <Text style={styles.priceText}>
              {/* Show paidAmount if available (orders with voucher discount), otherwise show quotePrice or servicePrice */}
              {booking.paidAmount
                ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(booking.paidAmount)
                : (booking.quotePrice || booking.servicePrice)}
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
                  technicianName: booking.pendingQuote!.technician?.technicianName || booking.technicianName || 'Thợ',
                  technicianId: booking.pendingQuote!.technician?.technicianId,
                  technicianAvatar: booking.pendingQuote!.technician?.technicianAvatar,
                  technicianRating: booking.pendingQuote!.technician?.technicianRating,
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
          ) : booking.status === 'payment' && booking.appointmentId && booking.finalPrice ? (
            // Show "Thanh toán" button for REPAIRED status
            <TouchableOpacity
              style={styles.trackButton}
              onPress={(e) => {
                e.stopPropagation();
                router.push({
                  pathname: './payment-summary',
                  params: {
                    appointmentId: booking.appointmentId!,
                    serviceName: booking.serviceName,
                    technicianName: booking.technicianName || 'Thợ sửa chữa',
                    address: booking.address,
                    finalPrice: booking.finalPrice!.toString(),
                  },
                } as any);
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.trackGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="card" size={16} color="#FFFFFF" />
                <Text style={styles.trackButtonText}>Thanh toán</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : isActive ? (
            // Show "Theo dõi" button for other active statuses
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
          ) : booking.status === 'completed' && booking.appointmentId ? (
            // Show "Xem đánh giá" or "Đánh giá thợ" button based on review status
            <TouchableOpacity
              style={styles.trackButton}
              onPress={async (e) => {
                e.stopPropagation();
                
                // Fetch technician ID from appointment
                try {
                  const appointment = await appointmentsService.getAppointment(booking.appointmentId!);
                  if (appointment.technicianId) {
                    setSelectedBookingForReview({
                      appointmentId: booking.appointmentId!,
                      providerId: appointment.technicianId,
                      technicianName: booking.technicianName || 'Thợ sửa chữa',
                      serviceName: booking.serviceName,
                      existingReview: booking.existingReview,
                    });
                    setReviewModalVisible(true);
                  } else {
                    Alert.alert('Lỗi', 'Không thể lấy thông tin thợ sửa chữa');
                  }
                } catch (error) {
                  console.error('Error fetching technician ID:', error);
                  Alert.alert('Lỗi', 'Không thể mở form đánh giá. Vui lòng thử lại.');
                }
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={booking.existingReview ? ['#64748B', '#475569'] : ['#FFB800', '#FFA000']}
                style={styles.trackGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons 
                  name={booking.existingReview ? "eye" : "star"} 
                  size={16} 
                  color="#FFFFFF" 
                />
                <Text style={styles.trackButtonText}>
                  {booking.existingReview ? 'Xem đánh giá' : 'Đánh giá thợ'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.viewDetailsButton} 
              activeOpacity={0.7}
              onPress={(e) => {
                e.stopPropagation();
                router.push({
                  pathname: './order-tracking',
                  params: { orderId: booking.id },
                } as any);
              }}
            >
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
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'active' && styles.activeTabText,
            ]}
          >
            Đang tiếp nhận
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'history' && styles.activeTabText,
            ]}
          >
            Lịch sử
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#609CEF" />
            <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
          </View>
        ) : filteredBookings.length > 0 ? (
          <View style={styles.bookingsList}>
            {filteredBookings.map((booking) => renderBookingCard(booking))}
          </View>
        ) : (
          renderEmptyState()
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {/* Quote Notification Modal */}
      {selectedQuote && (
        <QuoteNotificationModal
          visible={quoteModalVisible}
          quote={selectedQuote}
          onClose={() => {
          setQuoteModalVisible(false);
          setSelectedQuote(null);
        }}
        onAccepted={async () => {
          if (selectedQuote) {
            try {
              await serviceDeliveryOffersService.acceptQuote(selectedQuote.offerID);
              setQuoteModalVisible(false);
              setSelectedQuote(null);
              // Reload bookings to reflect changes
              loadBookings(true);
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể chấp nhận báo giá');
            }
          }
        }}
        onRejected={async () => {
          if (selectedQuote) {
            try {
              await serviceDeliveryOffersService.rejectQuote(selectedQuote.offerID);
              setQuoteModalVisible(false);
              setSelectedQuote(null);
              // Reload bookings to reflect changes
              loadBookings(true);
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể từ chối báo giá');
            }
          }
        }}
        />
      )}

      {/* Review Modal */}
      {selectedBookingForReview && (
        <ReviewModal
          visible={reviewModalVisible}
          onClose={() => {
            setReviewModalVisible(false);
            setSelectedBookingForReview(null);
          }}
          onReviewSubmit={() => {
            setReviewModalVisible(false);
            setSelectedBookingForReview(null);
            // Reload bookings to reflect changes
            loadBookings(true);
            Alert.alert('Thành công', 'Cảm ơn bạn đã đánh giá!');
          }}
          appointmentId={selectedBookingForReview.appointmentId}
          providerId={selectedBookingForReview.providerId}
          technicianName={selectedBookingForReview.technicianName}
          serviceName={selectedBookingForReview.serviceName}
          existingReview={selectedBookingForReview.existingReview}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  quoteButton: {
    borderRadius: 10,
    overflow: 'hidden',
    alignSelf: 'flex-start',
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
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  quoteButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  newBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#EF4444',
    letterSpacing: 0.5,
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
  createIcon: {
    marginRight: 6,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
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

  bottomSpacing: {
    height: 40,
  },
});
