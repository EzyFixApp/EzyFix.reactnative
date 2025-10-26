import React, { useState, useEffect, useRef } from 'react';
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
  Image,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { serviceRequestService } from '../../lib/api/serviceRequests';
import { servicesService } from '../../lib/api/services';
import { serviceDeliveryOffersService } from '../../lib/api/serviceDeliveryOffers';
import { techniciansService } from '../../lib/api/technicians';
import { appointmentsService, AppointmentStatus } from '../../lib/api/appointments';
import { mediaService } from '../../lib/api/media';
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
  status: 'searching' | 'quoted' | 'accepted' | 'scheduled' | 'en-route' | 'arrived' | 'in-progress' | 'price-review' | 'payment' | 'completed' | 'cancelled';
  createdAt: string;
  requestedDate?: string;
  expectedStartTime?: string;
  serviceDescription?: string;
  technicianName?: string;
  quotePrice?: string;
  estimatedPrice?: string; // Giá dự kiến
  finalPrice?: string;      // Giá chốt
  notes?: string;           // Service description or technician notes
  technicianNotes?: string; // Technician notes from offer
  appointmentId?: string;   // For PRICE_REVIEW actions
  appointmentStatus?: string; // Raw appointment status for timeline
}

function CustomerOrderTracking() {
  // Get orderId from route params
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false); // Timeline visibility
  
  // Media states
  const [issueMedia, setIssueMedia] = useState<string[]>([]); // ISSUE type (customer uploaded)
  const [initialMedia, setInitialMedia] = useState<string[]>([]); // INITIAL type (technician at CHECKING)
  const [finalMedia, setFinalMedia] = useState<string[]>([]); // FINAL type (technician at REPAIRED)

  // Refs for auto-scroll
  const scrollViewRef = useRef<ScrollView>(null);
  const paymentSectionRef = useRef<View>(null);

  // Auto-refresh interval (5 seconds for near real-time)
  const REFRESH_INTERVAL = 5000;

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

  // Auto-scroll to payment section
  const scrollToPaymentSection = () => {
    if (paymentSectionRef.current && scrollViewRef.current) {
      paymentSectionRef.current.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, y - 40), // Offset 40px để cân đối hiển thị
            animated: true,
          });
        },
        () => {
          console.log('Failed to measure payment section layout');
        }
      );
    }
  };

  // Map API status to UI status (đồng nhất với technician)
  // ServiceRequest: Pending, Quoted, QuoteAccepted, Completed, Cancelled, QuoteRejected
  // ServiceDeliveryOffers: PENDING, ACCEPTED, CHECKING_AWAIT, REJECTED, EXPIRED
  // Appointments: SCHEDULED, EN_ROUTE, ARRIVED, CHECKING, PRICE_REVIEW, REPAIRING, REPAIRED, ABSENT, CANCELLED, DISPUTE
  const mapApiStatus = (apiStatus: string): OrderDetail['status'] => {
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
        return 'in-progress';
      case 'PRICE_REVIEW':
        return 'price-review';
      case 'REPAIRING':
        return 'in-progress';
      case 'REPAIRED':
        return 'payment'; // Đã sửa xong → chờ thanh toán
      case 'PAYMENT':
      case 'AWAITING_PAYMENT':
        return 'payment';
      
      // ServiceDeliveryOffers statuses
      case 'ACCEPTED':
        return 'accepted';
      case 'CHECKING_AWAIT':
        return 'in-progress';
      
      // Negative statuses
      case 'CANCELLED':
      case 'ABSENT':
      case 'DISPUTE':
      case 'REJECTED':
      case 'EXPIRED':
      case 'QUOTEREJECTED':
      case 'QUOTE_REJECTED':
        return 'cancelled';
      
      // Completed statuses
      case 'COMPLETED':
        return 'completed';
      
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
      let appointmentId: string | undefined;
      let actualStatus = serviceRequest.status; // Will be overridden by appointment status if available
      let technicianNotes: string | undefined; // Technician notes from offer
      
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
            appointmentId: relevantOffer.appointmentId,
            hasTechnicianObject: !!relevantOffer.technician,
            technicianFirstName: relevantOffer.technician?.user?.firstName || relevantOffer.technician?.firstName,
            technicianLastName: relevantOffer.technician?.user?.lastName || relevantOffer.technician?.lastName,
          });
          
          // IMPORTANT: Fetch full offer details to get technician info
          // The getAllOffers() response doesn't include technician details, 
          // but getOfferById() does include technician name, avatar, rating
          try {
            if (__DEV__) console.log('🔍 [OrderTracking] Fetching full offer details:', relevantOffer.offerId);
            
            const fullOfferDetails = await serviceDeliveryOffersService.getOfferById(relevantOffer.offerId);
            
            if (fullOfferDetails.technician) {
              // Update relevantOffer with full technician details
              relevantOffer.technician = fullOfferDetails.technician;
              
              if (__DEV__) console.log('✅ [OrderTracking] Got technician from getOfferById:', {
                technicianName: fullOfferDetails.technician.technicianName,
                technicianRating: fullOfferDetails.technician.technicianRating,
                technicianAvatar: fullOfferDetails.technician.technicianAvatar,
              });
            }
          } catch (offerError) {
            if (__DEV__) console.warn('⚠️ [OrderTracking] Could not fetch full offer details:', offerError);
          }
          
          // Query appointments by serviceRequestId (backend doesn't return appointmentId in offer)
          try {
            if (__DEV__) console.log('🔍 [OrderTracking] Querying appointments for serviceRequestId:', serviceRequest.requestID);
            
            const appointments = await appointmentsService.getAppointmentsByServiceRequest(serviceRequest.requestID);
            
            if (__DEV__) console.log('📋 [OrderTracking] Found appointments:', appointments.length);
            
            // Take the most recent appointment (last in array)
            if (appointments.length > 0) {
              const appointment = appointments[appointments.length - 1];
              appointmentId = appointment.id;
              actualStatus = appointment.status; // Override with appointment status
              
              if (__DEV__) console.log('✅ [OrderTracking] Appointment status:', {
                appointmentId,
                status: actualStatus
              });
              
              // Fetch media for this appointment
              try {
                if (__DEV__) console.log('📸 [OrderTracking] Fetching media for request:', serviceRequest.requestID);
                
                const mediaData = await mediaService.getMediaByRequest(
                  serviceRequest.requestID,
                  appointmentId
                );
                
                if (__DEV__) console.log('✅ [OrderTracking] Media fetched:', mediaData.length);
                
                // Filter ISSUE type media (customer uploaded images)
                const issueMediaUrls = mediaData
                  .filter(m => m.mediaType === 'ISSUE')
                  .map(m => m.fileURL);
                
                if (issueMediaUrls.length > 0) {
                  setIssueMedia(issueMediaUrls);
                  if (__DEV__) console.log('✅ [OrderTracking] Loaded ISSUE photos:', issueMediaUrls.length);
                }
                
                // Filter INITIAL type media (technician photos at CHECKING)
                const initialMediaUrls = mediaData
                  .filter(m => m.mediaType === 'INITIAL')
                  .map(m => m.fileURL);
                
                if (initialMediaUrls.length > 0) {
                  setInitialMedia(initialMediaUrls);
                  if (__DEV__) console.log('✅ [OrderTracking] Loaded INITIAL photos:', initialMediaUrls.length);
                }
                
                // Filter FINAL type media (technician photos at REPAIRED)
                const finalMediaUrls = mediaData
                  .filter(m => m.mediaType === 'FINAL')
                  .map(m => m.fileURL);
                
                if (finalMediaUrls.length > 0) {
                  setFinalMedia(finalMediaUrls);
                  if (__DEV__) console.log('✅ [OrderTracking] Loaded FINAL photos:', finalMediaUrls.length);
                }
              } catch (mediaError) {
                if (__DEV__) console.warn('⚠️ [OrderTracking] Could not fetch media:', mediaError);
              }
            } else {
              if (__DEV__) console.log('⚠️ [OrderTracking] No appointments found for service request');
            }
          } catch (error) {
            if (__DEV__) console.warn('⚠️ [OrderTracking] Could not fetch appointments:', error);
          }
          
          // Get offer notes (technician notes about the job)
          technicianNotes = relevantOffer.notes;
          
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
            
            // Priority 1: Check if technician info is in offer response (NEW API structure)
            if (relevantOffer.technician?.technicianName) {
              technicianName = relevantOffer.technician.technicianName;
              if (__DEV__) console.log('✅ [OrderTracking] Technician name from offer.technician.technicianName:', technicianName);
            }
            // Priority 2: Check if technician details are in offer response (old structure with user object)
            else if (relevantOffer.technician?.user?.firstName || relevantOffer.technician?.user?.lastName) {
              const firstName = relevantOffer.technician.user.firstName || '';
              const lastName = relevantOffer.technician.user.lastName || '';
              technicianName = `${lastName} ${firstName}`.trim();
              
              if (__DEV__) console.log('✅ [OrderTracking] Technician name from offer.technician.user:', technicianName);
            } 
            // Priority 3: Try top-level firstName/lastName in technician object
            else if (relevantOffer.technician?.firstName || relevantOffer.technician?.lastName) {
              const firstName = relevantOffer.technician.firstName || '';
              const lastName = relevantOffer.technician.lastName || '';
              technicianName = `${lastName} ${firstName}`.trim();
              
              if (__DEV__) console.log('✅ [OrderTracking] Technician name from technician firstName/lastName:', technicianName);
            }
            // Priority 4: Default fallback - use generic name with short ID
            else {
              if (__DEV__) console.log('⚠️ [OrderTracking] No technician name in offer, using fallback');
              const shortId = relevantOffer.technicianId.substring(0, 8);
              technicianName = `Thợ #${shortId}`;
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
        status: mapApiStatus(actualStatus), // Use actualStatus (from appointment if available)
        createdAt: serviceRequest.createdDate || serviceRequest.requestedDate,
        requestedDate: serviceRequest.requestedDate,
        expectedStartTime: serviceRequest.expectedStartTime,
        serviceDescription: serviceRequest.serviceDescription,
        notes: serviceRequest.serviceDescription,
        technicianNotes: technicianNotes,
        technicianName: technicianName,
        quotePrice: quotePrice,
        estimatedPrice: estimatedPrice,
        finalPrice: finalPrice,
        appointmentId: appointmentId, // Store for PRICE_REVIEW actions
        appointmentStatus: actualStatus, // Store raw appointment status for timeline
      };
      
      if (__DEV__) {
        console.log('📦 [OrderTracking] Transformed order:', {
          id: transformedOrder.id,
          status: transformedOrder.status,
          appointmentStatus: transformedOrder.appointmentStatus,
          appointmentId: transformedOrder.appointmentId,
          finalPrice: transformedOrder.finalPrice
        });
      }
      
      setOrder(transformedOrder);
      
      // Auto-scroll to payment section if status is PRICE_REVIEW
      if (transformedOrder.status === 'price-review' && !silent) {
        setTimeout(() => {
          scrollToPaymentSection();
        }, 500); // Delay to ensure render is complete
      }
      
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

  // Timeline functions
  const getTimelineData = () => {
    // Map appointment status to timeline status for accurate display
    let currentStatus = order?.status || 'searching';
    const appointmentStatus = order?.appointmentStatus?.toUpperCase();
    
    // Override with appointment-specific statuses if available
    if (appointmentStatus === 'SCHEDULED') currentStatus = 'scheduled';
    if (appointmentStatus === 'EN_ROUTE') currentStatus = 'en-route';
    if (appointmentStatus === 'ARRIVED') currentStatus = 'arrived';
    if (appointmentStatus === 'CHECKING' || appointmentStatus === 'REPAIRING') currentStatus = 'in-progress';
    if (appointmentStatus === 'PRICE_REVIEW') currentStatus = 'price-review';
    if (appointmentStatus === 'REPAIRED') currentStatus = 'payment';
    if (appointmentStatus === 'COMPLETED') currentStatus = 'completed';
    
    // Map status to timeline index (now 10 steps total)
    const statusMap: { [key: string]: number } = {
      'searching': 1,
      'quoted': 2,
      'accepted': 3,
      'scheduled': 4,
      'en-route': 5,
      'arrived': 6,
      'in-progress': 7,
      'price-review': 8,
      'payment': 9,
      'completed': 10,
      'cancelled': 0
    };
    
    const currentIndex = statusMap[currentStatus] || 0;
    const hasPriceReview = order?.finalPrice && order?.estimatedPrice;
    
    const timeline = [
      { 
        status: 'searching',
        title: 'Tìm kiếm thợ', 
        description: 'Hệ thống tìm thợ phù hợp',
        completed: currentIndex >= 1, 
        icon: 'search' 
      },
      { 
        status: 'quoted',
        title: 'Nhận báo giá', 
        description: 'Thợ đã gửi báo giá',
        completed: currentIndex >= 2, 
        icon: 'document-text' 
      },
      { 
        status: 'accepted',
        title: 'Đã xác nhận', 
        description: 'Đã chấp nhận báo giá',
        completed: currentIndex >= 3, 
        icon: 'checkmark-circle' 
      },
      { 
        status: 'scheduled',
        title: 'Thợ xác nhận', 
        description: 'Thợ đã xác nhận lịch hẹn',
        completed: currentIndex >= 4, 
        icon: 'calendar' 
      },
      { 
        status: 'en-route',
        title: 'Thợ đang đến', 
        description: 'Đang trên đường tới',
        completed: currentIndex >= 5, 
        icon: 'car' 
      },
      { 
        status: 'arrived',
        title: 'Thợ đã đến', 
        description: 'Đã có mặt tại địa điểm',
        completed: currentIndex >= 6, 
        icon: 'location' 
      },
      { 
        status: 'in-progress',
        title: 'Đang sửa chữa', 
        description: 'Đang kiểm tra và sửa chữa',
        completed: currentIndex >= 7, 
        icon: 'construct' 
      },
    ];
    
    if (hasPriceReview) {
      timeline.push({ 
        status: 'price-review',
        title: 'Xác nhận giá chốt', 
        description: 'Xác nhận giá cuối cùng',
        completed: currentIndex >= 8, 
        icon: 'cash' 
      });
    }
    
    timeline.push({ 
      status: 'payment',
      title: 'Chờ thanh toán', 
      description: 'Thanh toán dịch vụ',
      completed: currentIndex >= 9, 
      icon: 'card' 
    });
    
    timeline.push({ 
      status: 'completed',
      title: 'Hoàn thành', 
      description: 'Dịch vụ đã hoàn tất',
      completed: currentIndex >= 10, 
      icon: 'checkmark-done' 
    });
    
    return timeline;
  };

  const handleShowTimeline = () => {
    setShowTimeline(!showTimeline);
  };

  // Handle Accept Final Price (PRICE_REVIEW → REPAIRING)
  const handleAcceptFinalPrice = async () => {
    if (!order?.appointmentId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin lịch hẹn');
      return;
    }

    // Validate current status from UI
    if (order.status !== 'price-review') {
      Alert.alert(
        'Không thể thực hiện',
        'Trạng thái đơn hàng đã thay đổi. Vui lòng tải lại trang.',
        [{ text: 'Tải lại', onPress: () => loadOrderDetail() }]
      );
      return;
    }

    Alert.alert(
      'Xác nhận giá cuối cùng',
      `Bạn xác nhận chấp nhận giá cuối cùng: ${order.finalPrice}?\n\nThợ sẽ bắt đầu sửa chữa sau khi bạn xác nhận.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              setLoading(true);
              
              console.log('🔄 [OrderTracking] Accepting final price for appointment:', order.appointmentId);
              console.log('� [OrderTracking] Current order status:', order.status);
              console.log('📊 [OrderTracking] Current appointment status:', order.appointmentStatus);
              
              // Call PATCH /api/v1/appointments/{id} to update status to REPAIRING
              await appointmentsService.updateAppointmentStatus(
                order.appointmentId!,
                {
                  status: AppointmentStatus.REPAIRING,
                  timestamp: new Date().toISOString()
                }
              );

              console.log('✅ [OrderTracking] Successfully updated to REPAIRING');

              Alert.alert(
                'Thành công',
                'Đã xác nhận giá cuối cùng. Thợ sẽ bắt đầu sửa chữa.',
                [{ text: 'OK', onPress: () => loadOrderDetail() }]
              );
            } catch (error: any) {
              console.error('❌ [OrderTracking] Error accepting final price:', error);
              
              // Handle specific error messages
              const errorMessage = error?.data?.exceptionMessage || error?.message || 'Không thể xác nhận giá. Vui lòng thử lại.';
              
              if (errorMessage.includes('APPOINTMENT_INVALID_TRANSITION') || errorMessage.includes('price review is not required')) {
                Alert.alert(
                  'Trạng thái đã thay đổi',
                  'Đơn hàng không còn ở trạng thái chờ xác nhận giá nữa. Vui lòng tải lại trang.',
                  [{ text: 'Tải lại', onPress: () => loadOrderDetail() }]
                );
              } else {
                Alert.alert('Lỗi', errorMessage);
              }
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Handle Reject Final Price (PRICE_REVIEW → DISPUTE with reason)
  const handleRejectFinalPrice = () => {
    if (!order?.appointmentId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin lịch hẹn');
      return;
    }

    // Validate current status from UI
    if (order.status !== 'price-review') {
      Alert.alert(
        'Không thể thực hiện',
        'Trạng thái đơn hàng đã thay đổi. Vui lòng tải lại trang.',
        [{ text: 'Tải lại', onPress: () => loadOrderDetail() }]
      );
      return;
    }

    const rejectionReasons = [
      { label: 'Giá quá cao, không chấp nhận được', value: 'price_too_high' },
      { label: 'Thợ thái độ không tốt', value: 'bad_attitude' },
      { label: 'Không tin tưởng vào chất lượng', value: 'quality_concern' },
      { label: 'Lý do khác (tự nhập)', value: 'other' },
    ];

    // Show dialog with rejection reasons
    Alert.alert(
      'Từ chối báo giá',
      'Vui lòng chọn lý do từ chối:',
      [
        { text: 'Hủy', style: 'cancel' },
        ...rejectionReasons.map(reason => ({
          text: reason.label,
          onPress: async () => {
            if (reason.value === 'other') {
              // Let user input custom reason
              Alert.prompt(
                'Lý do từ chối',
                'Nhập lý do từ chối của bạn:',
                [
                  { text: 'Hủy', style: 'cancel' },
                  {
                    text: 'Gửi',
                    onPress: async (customReason?: string) => {
                      if (customReason && customReason.trim()) {
                        await submitRejection(`Lý do khác: ${customReason.trim()}`);
                      } else {
                        Alert.alert('Lỗi', 'Vui lòng nhập lý do từ chối');
                      }
                    }
                  }
                ],
                'plain-text'
              );
            } else {
              await submitRejection(reason.label);
            }
          }
        }))
      ]
    );
  };

  // Submit rejection to backend
  const submitRejection = async (reason: string) => {
    if (!order?.appointmentId) return;

    try {
      setLoading(true);
      
      console.log('🔄 [OrderTracking] Rejecting final price for appointment:', order.appointmentId);
      console.log('� [OrderTracking] Current order status:', order.status);
      console.log('📊 [OrderTracking] Current appointment status:', order.appointmentStatus);
      console.log('📝 [OrderTracking] Rejection reason:', reason);
      
      // Call PATCH /api/v1/appointments/{id} to update status to DISPUTE with notes
      await appointmentsService.updateAppointmentStatus(
        order.appointmentId,
        {
          status: AppointmentStatus.DISPUTE,
          note: `Khách hàng từ chối báo giá: ${reason}`,
          timestamp: new Date().toISOString()
        }
      );

      console.log('✅ [OrderTracking] Successfully updated to DISPUTE');

      Alert.alert(
        'Đã gửi',
        'Đã từ chối báo giá. Yêu cầu của bạn sẽ được xem xét lại.',
        [{ text: 'OK', onPress: () => loadOrderDetail() }]
      );
    } catch (error: any) {
      console.error('❌ [OrderTracking] Error rejecting final price:', error);
      
      // Handle specific error messages
      const errorMessage = error?.data?.exceptionMessage || error?.message || 'Không thể gửi từ chối. Vui lòng thử lại.';
      
      if (errorMessage.includes('APPOINTMENT_INVALID_TRANSITION') || errorMessage.includes('price review is not required')) {
        Alert.alert(
          'Trạng thái đã thay đổi',
          'Đơn hàng không còn ở trạng thái chờ xác nhận giá nữa. Vui lòng tải lại trang.',
          [{ text: 'Tải lại', onPress: () => loadOrderDetail() }]
        );
      } else {
        Alert.alert('Lỗi', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get status info for UI display
  const getStatusInfo = (status: OrderDetail['status']) => {
    // Check if REPAIRING status came after PRICE_REVIEW
    // If order has finalPrice and estimatedPrice, it means it went through PRICE_REVIEW
    const hasPriceReview = order?.finalPrice && order?.estimatedPrice;
    const appointmentStatus = order?.appointmentStatus?.toUpperCase();
    
    switch (status) {
      case 'searching':
        return {
          text: 'Đang tìm thợ',
          color: '#609CEF',
          backgroundColor: '#E5F0FF',
          icon: 'search-outline',
          step: 1,
          totalSteps: 10,
        };
      case 'quoted':
        return {
          text: 'Có báo giá',
          color: '#4F8BE8',
          backgroundColor: '#E5F0FF',
          icon: 'document-text-outline',
          step: 2,
          totalSteps: 10,
        };
      case 'accepted':
        return {
          text: 'Đã xác nhận',
          color: '#609CEF',
          backgroundColor: '#E5F0FF',
          icon: 'checkmark-circle-outline',
          step: 3,
          totalSteps: 10,
        };
      case 'scheduled':
        return {
          text: 'Thợ đã xác nhận',
          color: '#4F8BE8',
          backgroundColor: '#E5F0FF',
          icon: 'calendar-outline',
          step: 4,
          totalSteps: 10,
        };
      case 'en-route':
        return {
          text: 'Thợ đang đến',
          color: '#609CEF',
          backgroundColor: '#E5F0FF',
          icon: 'car-outline',
          step: 5,
          totalSteps: 10,
        };
      case 'arrived':
        return {
          text: 'Thợ đã đến',
          color: '#4F8BE8',
          backgroundColor: '#E5F0FF',
          icon: 'location-outline',
          step: 6,
          totalSteps: 10,
        };
      case 'in-progress':
        // If appointmentStatus is REPAIRING and has finalPrice, it came from PRICE_REVIEW (step 8)
        // Otherwise, it's normal CHECKING/REPAIRING flow (step 7)
        const stepNumber = (appointmentStatus === 'REPAIRING' && hasPriceReview) ? 8 : 7;
        return {
          text: 'Đang sửa chữa',
          color: '#609CEF',
          backgroundColor: '#E5F0FF',
          icon: 'construct-outline',
          step: stepNumber,
          totalSteps: 10,
        };
      case 'price-review':
        return {
          text: 'Chờ xác nhận giá',
          color: '#4F8BE8',
          backgroundColor: '#E5F0FF',
          icon: 'cash-outline',
          step: 8,
          totalSteps: 10,
        };
      case 'payment':
        return {
          text: 'Chờ thanh toán',
          color: '#F59E0B',
          backgroundColor: '#FEF3C7',
          icon: 'card-outline',
          step: 9,
          totalSteps: 10,
        };
      case 'completed':
        return {
          text: 'Hoàn thành',
          color: '#10B981',
          backgroundColor: '#D1FAE5',
          icon: 'checkmark-done-outline',
          step: 10,
          totalSteps: 10,
        };
      case 'cancelled':
        return {
          text: 'Đã hủy',
          color: '#EF4444',
          backgroundColor: '#FEE2E2',
          icon: 'close-circle-outline',
          step: 0,
          totalSteps: 10,
        };
      default:
        return {
          text: 'Đang xử lý',
          color: '#609CEF',
          backgroundColor: '#E5F0FF',
          icon: 'time-outline',
          step: 1,
          totalSteps: 10,
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

        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
        >
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
              
              {/* Timeline Toggle Button */}
              <TouchableOpacity 
                style={styles.timelineToggle}
                onPress={handleShowTimeline}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={showTimeline ? 'chevron-up-outline' : 'chevron-down-outline'} 
                  size={20} 
                  color="#3B82F6" 
                />
                <Text style={styles.timelineToggleText}>
                  {showTimeline ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Timeline Detail - Card Style Design */}
          {showTimeline && (
            <View style={styles.section}>
              <View style={styles.timelineCard}>
                <View style={styles.timelineCardHeader}>
                  <View style={styles.timelineCardHeaderLeft}>
                    <Ionicons name="list-outline" size={20} color="#3B82F6" />
                    <Text style={styles.timelineCardTitle}>Chi tiết tiến trình</Text>
                  </View>
                  <View style={styles.timelineCardBadge}>
                    <Text style={styles.timelineCardBadgeText}>
                      {getTimelineData().filter(item => item.completed).length}/{getTimelineData().length}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.timelineCardContent}>
                  {getTimelineData().map((item, index) => {
                    const isCurrentStep = order?.status === item.status;
                    const isCompleted = item.completed;
                    const isLast = index === getTimelineData().length - 1;
                    
                    return (
                      <View key={index} style={styles.timelineStepContainer}>
                        {/* Icon Column */}
                        <View style={styles.timelineStepIconColumn}>
                          <View style={[
                            styles.timelineStepIcon,
                            isCompleted && styles.timelineStepIconCompleted,
                            isCurrentStep && !isCompleted && styles.timelineStepIconCurrent,
                          ]}>
                            <Ionicons 
                              name={isCompleted ? "checkmark" : item.icon as any} 
                              size={18} 
                              color={
                                isCompleted ? "#FFFFFF" : 
                                isCurrentStep ? "#3B82F6" : 
                                "#9CA3AF"
                              } 
                            />
                          </View>
                          {!isLast && (
                            <View style={[
                              styles.timelineStepLine,
                              isCompleted && styles.timelineStepLineCompleted
                            ]} />
                          )}
                        </View>
                        
                        {/* Content Column */}
                        <View style={[
                          styles.timelineStepContent,
                          isCurrentStep && styles.timelineStepContentCurrent
                        ]}>
                          <View style={styles.timelineStepHeader}>
                            <Text style={[
                              styles.timelineStepTitle,
                              isCompleted && styles.timelineStepTitleCompleted,
                              isCurrentStep && !isCompleted && styles.timelineStepTitleCurrent,
                            ]}>
                              {item.title}
                            </Text>
                            {isCurrentStep && !isCompleted && (
                              <View style={styles.timelineStepCurrentBadge}>
                                <Text style={styles.timelineStepCurrentBadgeText}>Hiện tại</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[
                            styles.timelineStepDescription,
                            isCompleted && styles.timelineStepDescriptionCompleted,
                          ]}>
                            {item.description}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* Service Info */}
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="construct-outline" size={20} color="#609CEF" />
                <Text style={styles.cardTitle}>Thông tin dịch vụ</Text>
              </View>
              <View style={styles.cardContent}>
                {/* Order ID with Copy Button */}
                <View style={styles.orderIdSection}>
                  <View style={styles.orderIdLeft}>
                    <View style={styles.orderIdIconContainer}>
                      <Ionicons name="receipt-outline" size={18} color="#3B82F6" />
                    </View>
                    <View style={styles.orderIdTextContainer}>
                      <Text style={styles.orderIdLabel}>Mã đơn</Text>
                      <Text style={styles.orderIdValue}>
                        {orderId.split('-')[0]}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.orderIdCopyButton}
                    onPress={() => {
                      const shortOrderId = orderId.split('-')[0];
                      Clipboard.setString(shortOrderId);
                      Alert.alert('Đã sao chép', `Mã đơn ${shortOrderId} đã được sao chép`);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="copy-outline" size={16} color="white" />
                  </TouchableOpacity>
                </View>
                
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
                      <View 
                        ref={paymentSectionRef}
                        style={[styles.priceCard, styles.finalPriceCard]}
                      >
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

                    {/* Technician Notes - Show when finalPrice exists */}
                    {order.finalPrice && order.technicianNotes && (
                      <View style={styles.technicianNotesSection}>
                        <View style={styles.notesHeader}>
                          <Ionicons name="clipboard-outline" size={20} color="#609CEF" />
                          <Text style={styles.notesHeaderText}>Ghi chú từ thợ</Text>
                        </View>
                        <View style={styles.notesContent}>
                          <Text style={styles.notesText}>{order.technicianNotes}</Text>
                        </View>
                      </View>
                    )}

                    {/* Inspection Photos - Show INITIAL photos when finalPrice exists */}
                    {order.finalPrice && initialMedia.length > 0 && (
                      <View style={styles.photosSection}>
                        <View style={styles.photosHeader}>
                          <Ionicons name="images-outline" size={20} color="#4F8BE8" />
                          <Text style={styles.photosHeaderText}>
                            Ảnh kiểm tra thực tế ({initialMedia.length})
                          </Text>
                        </View>
                        <ScrollView 
                          horizontal 
                          showsHorizontalScrollIndicator={false}
                          style={styles.photosScroll}
                        >
                          {initialMedia.map((url, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.photoContainer}
                              activeOpacity={0.7}
                            >
                              <Image
                                source={{ uri: url }}
                                style={styles.photoImage}
                                resizeMode="cover"
                              />
                              <View style={styles.photoOverlay}>
                                <Ionicons name="expand-outline" size={20} color="white" />
                              </View>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                        <Text style={styles.photosDescription}>
                          Ảnh chụp tại hiện trường sau khi thợ kiểm tra
                        </Text>
                      </View>
                    )}

                    {/* PRICE_REVIEW Action Buttons - Show when status is price-review */}
                    {order.status === 'price-review' && order.finalPrice && (
                      <View style={styles.priceReviewActions}>
                        <Text style={styles.priceReviewTitle}>
                          Thợ đã gửi giá cuối cùng. Bạn có chấp nhận không?
                        </Text>
                        <View style={styles.priceReviewButtons}>
                          <TouchableOpacity
                            style={styles.rejectButton}
                            onPress={handleRejectFinalPrice}
                            activeOpacity={0.8}
                          >
                            <LinearGradient
                              colors={['#EF4444', '#DC2626']}
                              style={styles.actionButtonGradient}
                            >
                              <Ionicons name="close-circle-outline" size={20} color="white" />
                              <Text style={styles.actionButtonText}>Từ chối</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.acceptButton}
                            onPress={handleAcceptFinalPrice}
                            activeOpacity={0.8}
                          >
                            <LinearGradient
                              colors={['#10B981', '#059669']}
                              style={styles.actionButtonGradient}
                            >
                              <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                              <Text style={styles.actionButtonText}>Chấp nhận</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.priceReviewNote}>
                          * Sau khi chấp nhận, thợ sẽ bắt đầu sửa chữa ngay
                        </Text>
                      </View>
                    )}
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
                {order.expectedStartTime && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Ngày yêu cầu:</Text>
                    <Text style={styles.infoValue}>
                      {new Date(order.expectedStartTime).toLocaleDateString('vi-VN')}
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
    paddingHorizontal: 0, // Full width
    marginTop: 16,
  },
  statusCard: {
    borderRadius: 0, // Full width, no border radius
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
  // Price Review Action Styles
  priceReviewActions: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#609CEF', // Màu xanh chủ đạo
  },
  priceReviewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  priceReviewButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  rejectButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  acceptButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.3,
  },
  priceReviewNote: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  
  // Technician Notes Section
  technicianNotesSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#E5F0FF', // Màu xanh nhạt chủ đạo
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#609CEF', // Màu xanh chủ đạo
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  notesHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF', // Xanh đậm
  },
  notesContent: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1F2937',
  },
  
  // Photos Section
  photosSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#E5F0FF', // Màu xanh nhạt chủ đạo
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4F8BE8', // Màu xanh đậm hơn
  },
  photosHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  photosHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF', // Xanh đậm
  },
  photosScroll: {
    marginTop: 8,
  },
  photoContainer: {
    width: 120,
    height: 120,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photosDescription: {
    marginTop: 8,
    fontSize: 12,
    color: '#3B82F6',
    fontStyle: 'italic',
  },
  
  // Timeline Styles - Card Design (Match App Style)
  timelineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    marginTop: 16,
  },
  timelineToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  timelineCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  timelineCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  timelineCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timelineCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  timelineCardBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  timelineCardBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B82F6',
  },
  timelineCardContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  timelineStepContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  timelineStepIconColumn: {
    alignItems: 'center',
    marginRight: 16,
    width: 40,
  },
  timelineStepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  timelineStepIconCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  timelineStepIconCurrent: {
    backgroundColor: '#FFFFFF',
    borderColor: '#3B82F6',
    borderWidth: 3,
  },
  timelineStepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  timelineStepLineCompleted: {
    backgroundColor: '#10B981',
  },
  timelineStepContent: {
    flex: 1,
    paddingBottom: 20,
  },
  timelineStepContentCurrent: {
    backgroundColor: '#F0F9FF',
    marginLeft: -8,
    marginRight: -8,
    paddingLeft: 8,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 12,
  },
  timelineStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timelineStepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94A3B8',
    flex: 1,
  },
  timelineStepTitleCompleted: {
    color: '#1E293B',
    fontWeight: '700',
  },
  timelineStepTitleCurrent: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  timelineStepDescription: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 20,
  },
  timelineStepDescriptionCompleted: {
    color: '#64748B',
  },
  timelineStepCurrentBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  timelineStepCurrentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
  },
  
  // Order ID Section (NEW)
  orderIdSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  orderIdLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  orderIdIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderIdTextContainer: {
    flex: 1,
  },
  orderIdLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  orderIdValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF',
    letterSpacing: 0.5,
  },
  orderIdCopyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default withCustomerAuth(CustomerOrderTracking);
