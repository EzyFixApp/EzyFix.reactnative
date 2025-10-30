import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Platform,
  ScrollView,
  Dimensions,
  Image,
  Modal,
  ActivityIndicator,
  Linking,
  TextInput,
  Alert,
} from 'react-native';
import CustomModal from '../../components/CustomModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';
import { STANDARD_HEADER_STYLE, STANDARD_BACK_BUTTON_STYLE } from '../../constants/HeaderConstants';
import { serviceRequestService } from '../../lib/api/serviceRequests';
import { serviceDeliveryOffersService } from '../../lib/api/serviceDeliveryOffers';
import { appointmentsService, AppointmentStatus, type AppointmentData } from '../../lib/api/appointments';
import { servicesService } from '../../lib/api/services';
import { authService } from '../../lib/api/auth';
import { mediaService } from '../../lib/api/media';
import { paymentHub, PaymentUpdatePayload } from '../../lib/signalr/paymentHub';
import { useAuthStore } from '../../store/authStore';
import { useLocation } from '../../hooks/useLocation';
import TechnicianMapView from '../../components/TechnicianMapView';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Swipe Button Component
const SwipeButton: React.FC<{
  onSwipeComplete: () => void;
  title: string;
  isEnabled: boolean;
  backgroundColor?: string;
}> = ({ onSwipeComplete, title, isEnabled, backgroundColor = '#609CEF' }) => {
  const buttonWidth = SCREEN_WIDTH - 40;
  const knobSize = 60;
  const maxTranslate = buttonWidth - knobSize - 8;
  
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (isEnabled) {
        scale.value = withSpring(1.05);
      }
    })
    .onUpdate((event) => {
      if (isEnabled) {
        translateX.value = Math.max(0, Math.min(maxTranslate, event.translationX));
        // Fade out hint as user swipes
        opacity.value = Math.max(0.2, 1 - (event.translationX / maxTranslate));
      }
    })
    .onEnd((event) => {
      if (isEnabled) {
        scale.value = withSpring(1);
        if (event.translationX > maxTranslate * 0.6) {
          // Completed swipe
          translateX.value = withTiming(maxTranslate, { duration: 200 }, () => {
            runOnJS(onSwipeComplete)();
            // Reset after completion with delay
            setTimeout(() => {
              translateX.value = withTiming(0, { duration: 400 });
              opacity.value = withTiming(1, { duration: 200 });
            }, 800);
          });
        } else {
          // Return to start
          translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
          opacity.value = withTiming(1, { duration: 300 });
        }
      }
    });

  const knobAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value }
      ],
    };
  });

  const hintAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <View style={styles.swipeWrapper}>
      <LinearGradient 
        colors={isEnabled ? [backgroundColor, '#3B82F6'] : ['#E5E5E5', '#D1D5DB']} 
        style={styles.swipeContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.swipeTextContainer}>
          <Text style={[styles.swipeText, { color: isEnabled ? 'white' : '#9CA3AF' }]}>
            {title}
          </Text>
        </View>
        <Animated.View style={[styles.swipeHint, hintAnimatedStyle]}>
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.5)" style={{ marginLeft: -6 }} />
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.3)" style={{ marginLeft: -6 }} />
        </Animated.View>
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.swipeKnob,
              knobAnimatedStyle,
            ]}
          >
            <LinearGradient
              colors={isEnabled ? ['#FFFFFF', '#F8FAFC'] : ['#E5E7EB', '#D1D5DB']}
              style={styles.swipeKnobGradient}
            >
              <Ionicons 
                name="chevron-forward" 
                size={28} 
                color={isEnabled ? backgroundColor : '#9CA3AF'} 
              />
            </LinearGradient>
          </Animated.View>
        </GestureDetector>
      </LinearGradient>
      <Text style={styles.swipeInstruction}>Vuốt sang phải để tiếp tục</Text>
    </View>
  );
};

// Interface for tracking uploaded media (matching book-service.tsx)
interface UploadedMedia {
  mediaID: string;      // ID from backend
  fileURL: string;      // Backend URL for submission
  localUri: string;     // Local URI for display
  isUploading?: boolean; // Upload in progress
}

function TechnicianOrderTracking() {
  const { serviceRequestId, offerId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const { requestLocation } = useLocation(); // Get location hook
  
  // State for data
  const [serviceRequest, setServiceRequest] = useState<any>(null);
  const [offer, setOffer] = useState<any>(null);
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [serviceName, setServiceName] = useState<string>('Dịch vụ');
  
  // UI State
  const [currentStatus, setCurrentStatus] = useState('');
  const [showTimeline, setShowTimeline] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string>('');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [totalImages, setTotalImages] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMapView, setShowMapView] = useState(false); // Map view state
  
  // Success popup state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTitle, setSuccessTitle] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Photo upload state (CHECKING status) - Using UploadedMedia interface
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [initialNotes, setInitialNotes] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [finalCostInput, setFinalCostInput] = useState<string>(''); // For PRICE_REVIEW flow
  
  // Payment notification state
  const [showPaymentNotification, setShowPaymentNotification] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // Custom modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error' | 'warning' | 'info' | 'confirm'>('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalOnConfirm, setModalOnConfirm] = useState<(() => void) | undefined>();
  const [showCancelButton, setShowCancelButton] = useState(false);
  const [modalAutoClose, setModalAutoClose] = useState(false);
  
  // Helper function to show modal
  const showAlertModal = (
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm',
    title: string,
    message: string,
    onConfirm?: () => void,
    showCancel = false,
    autoClose?: boolean
  ) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setModalOnConfirm(onConfirm ? () => onConfirm : undefined);
    setShowCancelButton(showCancel);
    // Auto-close for non-confirm modals (unless explicitly set to false)
    setModalAutoClose(autoClose !== undefined ? autoClose : (type !== 'confirm' && !showCancel));
    setShowModal(true);
  };
  
  // Photo upload state (REPAIRING status) - For final photos
  const [finalMedia, setFinalMedia] = useState<UploadedMedia[]>([]);
  const [finalNotes, setFinalNotes] = useState<string>('');
  const [isUploadingFinalImage, setIsUploadingFinalImage] = useState(false);
  
  // Issue photos (ISSUE type) - Attached images from customer
  const [issueMedia, setIssueMedia] = useState<string[]>([]);
  
  // Success checkmark animation
  const checkmarkScale = useSharedValue(0);
  const checkmarkOpacity = useSharedValue(0);
  
  // Animated style for success checkmark (MUST be before any early returns)
  const checkmarkAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: checkmarkScale.value }],
      opacity: checkmarkOpacity.value,
    };
  });

  // Fetch data on mount
  useEffect(() => {
    if (serviceRequestId) {
      fetchOrderData();
    } else {
      setError('Thiếu thông tin đơn hàng');
      setLoading(false);
    }
  }, [serviceRequestId, offerId]);
  
  // SignalR payment notification listener
  useEffect(() => {
    if (!appointment?.id) return;
    
    const handlePaymentUpdate = (payload: PaymentUpdatePayload) => {
      console.log('💰 [Technician] Payment update received:', payload);
      
      // Only show notification for this appointment
      if (payload.appointmentId === appointment.id) {
        setPaymentAmount(payload.amount);
        setShowPaymentNotification(true);
        
        // Auto-reload order data to reflect COMPLETED status
        fetchOrderData();
        
        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setShowPaymentNotification(false);
        }, 5000);
      }
    };
    
    // Subscribe to payment updates (returns unsubscribe function)
    const unsubscribe = paymentHub.subscribe(handlePaymentUpdate);
    
    // Cleanup subscription
    return unsubscribe;
  }, [appointment?.id]);
  
  // Fetch media when status changes to REPAIRING or later
  useEffect(() => {
    const fetchMedia = async () => {
      if (!serviceRequestId) return;
      
      try {
        console.log('📸 Fetching media for request:', serviceRequestId);
        
        // Fetch all media for this request (works even without appointmentId)
        const mediaData = await mediaService.getMediaByRequest(
          serviceRequestId as string,
          appointment?.id
        );
        
        console.log('✅ Media fetched via mediaService:', mediaData);
        
        // Filter ISSUE type media (attached images from customer)
        const issueMediaUrls = mediaData
          .filter(m => m.mediaType === 'ISSUE')
          .map(m => m.fileURL);
        
        if (issueMediaUrls.length > 0) {
          setIssueMedia(issueMediaUrls);
          console.log('✅ Loaded ISSUE photos:', issueMediaUrls.length);
        }
        
        // Only fetch INITIAL and FINAL media after CHECKING status (when appointment exists)
        if (appointment?.id && (currentStatus === AppointmentStatus.REPAIRING || 
            currentStatus === AppointmentStatus.REPAIRED || 
            currentStatus === 'completed')) {
          
          // Filter INITIAL type media and convert to UploadedMedia
          const initialMedia = mediaData
            .filter(m => m.mediaType === 'INITIAL')
            .map(m => ({
              mediaID: m.mediaID,
              fileURL: m.fileURL,
              localUri: m.fileURL, // Use fileURL for display
              isUploading: false,
            }));
          
          if (initialMedia.length > 0) {
            setUploadedMedia(initialMedia);
            console.log('✅ Loaded initial photos:', initialMedia.length);
          }
          
          // Filter FINAL type media and convert to UploadedMedia
          const finalMediaItems = mediaData
            .filter(m => m.mediaType === 'FINAL')
            .map(m => ({
              mediaID: m.mediaID,
              fileURL: m.fileURL,
              localUri: m.fileURL, // Use fileURL for display
              isUploading: false,
            }));
          
          if (finalMediaItems.length > 0) {
            setFinalMedia(finalMediaItems);
            console.log('✅ Loaded final photos:', finalMediaItems.length);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching media:', error);
      }
    };
    
    fetchMedia();
  }, [currentStatus, appointment?.id, serviceRequestId]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch service request
      const requestData = await serviceRequestService.getServiceRequestById(serviceRequestId as string);
      console.log('📦 Service Request Data:', {
        requestID: requestData.requestID,
        requestAddress: requestData.requestAddress,
        addressID: requestData.addressID,
        allKeys: Object.keys(requestData)
      });
      setServiceRequest(requestData);
      
      // Validation: Ensure serviceRequest has requestID
      if (!requestData.requestID) {
        console.error('⚠️ WARNING: serviceRequest.requestID is missing!', requestData);
      }

      // Fetch service name
      if (requestData.serviceId) {
        try {
          const serviceData = await servicesService.getServiceById(requestData.serviceId);
          setServiceName(serviceData.serviceName || 'Dịch vụ');
        } catch (err) {
          console.log('Could not fetch service name, using default');
          setServiceName('Dịch vụ');
        }
      }

      // Fetch offer - if offerId not provided, try to find it
      let effectiveOfferId = offerId as string;
      
      if (!effectiveOfferId) {
        console.log('🔍 No offerId provided, fetching offers for request...');
        try {
          const offers = await serviceDeliveryOffersService.getAllOffers(requestData.requestID);
          if (offers && offers.length > 0) {
            // Find accepted offer or use the latest one
            const acceptedOffer = offers.find(o => o.status === 'ACCEPTED');
            effectiveOfferId = acceptedOffer?.offerId || offers[offers.length - 1]?.offerId;
            console.log('✅ Found offerId:', effectiveOfferId);
          } else {
            throw new Error('Không tìm thấy báo giá cho đơn hàng này');
          }
        } catch (err) {
          console.error('❌ Error fetching offers:', err);
          throw new Error('Không thể tải thông tin báo giá');
        }
      }

      // Fetch offer
      const offerData = await serviceDeliveryOffersService.getOfferById(effectiveOfferId);
      console.log('✅ Fetched offer:', {
        offerId: offerData.offerId,
        status: offerData.status,
        appointmentId: offerData.appointmentId,
        hasAppointmentId: !!offerData.appointmentId
      });
      setOffer(offerData);

      // Check if we have cached appointmentId in AsyncStorage (for when server doesn't sync)
      // Use userId in cache key to avoid conflicts between different users
      const cacheKey = user?.id ? `appointment_${effectiveOfferId}_${user.id}` : `appointment_${effectiveOfferId}`;
      const cachedAppointmentId = await AsyncStorage.getItem(cacheKey);
      console.log('💾 Cached appointmentId from storage:', cachedAppointmentId, 'key:', cacheKey);

      // Determine current status - PRIORITY: appointment status > offer status
      const effectiveAppointmentId = offerData.appointmentId || cachedAppointmentId;
      
      if (effectiveAppointmentId) {
        // If appointmentId exists (from server or cache), ALWAYS fetch and use appointment status
        console.log('📋 Found appointmentId, fetching appointment details...', {
          appointmentId: effectiveAppointmentId,
          userId: user?.id,
          hasToken: !!await authService.getAccessToken()
        });
        try {
          const appointmentData = await appointmentsService.getAppointment(effectiveAppointmentId);
          setAppointment(appointmentData);
          setCurrentStatus(appointmentData.status); // Use appointment status as source of truth
          console.log('✅ Current status from appointment:', appointmentData.status);
        } catch (err: any) {
          console.error('❌ Error fetching appointment:', err);
          
          // If 401 Unauthorized or 404 Not Found, this appointmentId is invalid
          // Clear cached data and fallback to offer status WITHOUT triggering logout
          if (err.status_code === 401 || err.status_code === 404 || err.reason?.includes('Authentication') || err.reason?.includes('not found')) {
            console.log('🔐 Invalid appointmentId (401/404), clearing cache and using offer status');
            const cacheKey = user?.id ? `appointment_${offerId}_${user.id}` : `appointment_${offerId}`;
            await AsyncStorage.removeItem(cacheKey);
            console.log('🗑️ Cleared invalid cached appointmentId');
            
            // DO NOT throw error - just fallback to offer status
            setAppointment(null);
            setCurrentStatus(offerData.status === 'ACCEPTED' ? 'accepted' : offerData.status.toLowerCase());
            console.log('✅ Fallback to offer status:', offerData.status);
          } else {
            // For other errors, still fallback but log differently
            console.warn('⚠️ Other error fetching appointment, fallback to offer status');
            setAppointment(null);
            setCurrentStatus(offerData.status === 'ACCEPTED' ? 'accepted' : offerData.status.toLowerCase());
          }
        }
      } else if (offerData.status === 'ACCEPTED') {
        // Offer is accepted but no appointment yet - ready to create appointment
        setCurrentStatus('accepted');
        setAppointment(null);
        console.log('⏳ Offer accepted but no appointment yet. Ready to create appointment on swipe.');
      } else {
        // Other offer statuses (PENDING, REJECTED, etc.)
        setCurrentStatus(offerData.status.toLowerCase());
        setAppointment(null);
        console.log('📊 Offer status:', offerData.status);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching order data:', err);
      setError(err.message || 'Không thể tải thông tin đơn hàng');
      setLoading(false);
    }
  };

  // Format datetime for display
  const formatDateTime = (dateString: string) => {
    if (!dateString) return { date: '', time: '' };
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return { date: dateStr, time: timeStr };
  };

  // Get formatted data for display
  const getDisplayData = () => {
    if (!serviceRequest || !offer) {
      return {
        serviceName: '',
        customerName: '',
        phoneNumber: '',
        address: '',
        addressNote: '',
        description: '',
        appointmentDate: '',
        appointmentTime: '',
        priceRange: '',
        quoteAmount: '',
        quoteType: '',
        attachedImages: []
      };
    }

    // Use expectedStartTime instead of requestedDateTime
    const { date: appointmentDate, time: appointmentTime } = formatDateTime(serviceRequest.expectedStartTime);
    const estimatedCost = offer.estimatedCost || 0;
    const finalCost = offer.finalCost || 0;
    const quoteAmount = (finalCost > 0 ? finalCost : estimatedCost).toLocaleString('vi-VN') + 'đ';
    const quoteType = finalCost > 0 ? 'final' : 'estimated';
    const priceRange = quoteAmount; // Same as quote amount for display
    

    return {
      serviceName: serviceName, // From state (fetched from services API)
      customerName: serviceRequest.fullName || 'Khách hàng',
      phoneNumber: serviceRequest.phoneNumber || '',
      address: serviceRequest.requestAddress || '',
      addressNote: serviceRequest.addressNote || '', // Add addressNote field
      description: serviceRequest.serviceDescription || '', // Use serviceDescription field
      appointmentDate,
      appointmentTime,
      priceRange,
      quoteAmount,
      quoteType,
      attachedImages: issueMedia // Use issueMedia (ISSUE type only) instead of serviceRequest.mediaUrls
    };
  };

  const displayData = getDisplayData();

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#609CEF" />
        <Stack.Screen options={{ headerShown: false }} />
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#609CEF" />
          <Text style={styles.loadingText}>Đang tải thông tin đơn hàng...</Text>
        </View>
      </View>
    );
  }

  if (error || !serviceRequest || !offer) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#609CEF" />
        <Stack.Screen options={{ headerShown: false }} />
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy đơn hàng</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getStatusInfo = (status: string) => {
    const statusMap: { [key: string]: { title: string; description: string; color: string; icon: string } } = {
      pending: {
        title: 'Đơn mới',
        description: 'Khách hàng vừa đặt lịch, chờ thợ tiếp nhận',
        color: '#609CEF',
        icon: 'notifications'
      },
      quote_sent: {
        title: 'Đã báo giá',
        description: 'Đã gửi báo giá, chờ khách hàng xác nhận',
        color: '#4F8BE8',
        icon: 'document-text'
      },
      accepted: {
        title: 'Báo giá được chấp nhận',
        description: 'Khách đã đồng ý, sẵn sàng tạo lịch hẹn',
        color: '#10B981',
        icon: 'checkmark-circle'
      },
      ACCEPTED: {
        title: 'Báo giá được chấp nhận',
        description: 'Khách đã đồng ý, sẵn sàng tạo lịch hẹn',
        color: '#10B981',
        icon: 'checkmark-circle'
      },
      SCHEDULED: {
        title: 'Đã lên lịch',
        description: 'Lịch hẹn đã được tạo, chuẩn bị xuất phát',
        color: '#3B82F6',
        icon: 'calendar'
      },
      EN_ROUTE: {
        title: 'Đang đến',
        description: 'Đang trên đường đến địa điểm khách hàng',
        color: '#F59E0B',
        icon: 'car'
      },
      ARRIVED: {
        title: 'Đã đến nơi',
        description: 'Đã có mặt tại địa điểm, kiểm tra tình trạng',
        color: '#8B5CF6',
        icon: 'location'
      },
      CHECKING: {
        title: 'Đang kiểm tra',
        description: 'Đang kiểm tra tình trạng thiết bị',
        color: '#06B6D4',
        icon: 'search'
      },
      PRICE_REVIEW: {
        title: 'Chờ xác nhận giá',
        description: 'Đã gửi báo giá cuối, chờ khách hàng xác nhận',
        color: '#8B5CF6',
        icon: 'hourglass'
      },
      REPAIRING: {
        title: 'Đang sửa chữa',
        description: 'Đang thực hiện sửa chữa thiết bị',
        color: '#F97316',
        icon: 'construct'
      },
      REPAIRED: {
        title: 'Đã sửa xong',
        description: 'Hoàn thành sửa chữa, chờ thanh toán',
        color: '#10B981',
        icon: 'checkmark-done'
      },
      completed: {
        title: 'Hoàn thành',
        description: 'Đã hoàn thành và nhận được thanh toán',
        color: '#10B981',
        icon: 'checkmark-done'
      }
    };
    
    return statusMap[status] || statusMap.quote_sent;
  };

  const getTimeline = () => {
    // Check if PRICE_REVIEW is in the flow (offer has estimatedCost but no finalCost initially)
    const hasPriceReview = offer && offer.estimatedCost && (currentStatus === AppointmentStatus.PRICE_REVIEW || (offer.finalCost && currentStatus !== AppointmentStatus.CHECKING));
    
    // Build status flow dynamically
    const statusFlow = hasPriceReview 
      ? ['accepted', 'SCHEDULED', 'EN_ROUTE', 'ARRIVED', 'CHECKING', 'PRICE_REVIEW', 'REPAIRING', 'REPAIRED', 'completed']
      : ['accepted', 'SCHEDULED', 'EN_ROUTE', 'ARRIVED', 'CHECKING', 'REPAIRING', 'REPAIRED', 'completed'];
    
    const currentIndex = statusFlow.indexOf(currentStatus);
    
    // Build timeline data dynamically
    const timelineData = [
      { 
        status: 'accepted', 
        time: offer?.updatedAt ? formatDateTime(offer.updatedAt).time : '', 
        date: offer?.updatedAt ? formatDateTime(offer.updatedAt).date : '', 
        completed: currentIndex >= 0 
      },
      { 
        status: 'SCHEDULED', 
        time: appointment?.scheduledDate ? formatDateTime(appointment.scheduledDate).time : '', 
        date: appointment?.scheduledDate ? formatDateTime(appointment.scheduledDate).date : '', 
        completed: currentIndex >= 1 
      },
      { 
        status: 'EN_ROUTE', 
        time: '', 
        date: '', 
        completed: currentIndex >= 2 
      },
      { 
        status: 'ARRIVED', 
        time: '', 
        date: '', 
        completed: currentIndex >= 3 
      },
      { 
        status: 'CHECKING', 
        time: '', 
        date: '', 
        completed: currentIndex >= 4 
      },
    ];
    
    // Add PRICE_REVIEW step if applicable
    if (hasPriceReview) {
      timelineData.push({ 
        status: 'PRICE_REVIEW', 
        time: '', 
        date: '', 
        completed: currentIndex >= 5 
      });
    }
    
    // Add remaining steps with adjusted indices
    const repairingIndex = hasPriceReview ? 6 : 5;
    const repairedIndex = hasPriceReview ? 7 : 6;
    const completedIndex = hasPriceReview ? 8 : 7;
    
    timelineData.push(
      { 
        status: 'REPAIRING', 
        time: '', 
        date: '', 
        completed: currentIndex >= repairingIndex 
      },
      { 
        status: 'REPAIRED', 
        time: '', 
        date: '', 
        completed: currentIndex >= repairedIndex 
      },
      { 
        status: 'completed', 
        time: '', 
        date: '', 
        completed: currentIndex >= completedIndex 
      }
    );
    
    return timelineData;
  };

  const handleShowTimeline = () => {
    setShowTimeline(!showTimeline);
  };

  const statusInfo = getStatusInfo(currentStatus);

  // Show success popup - Custom modal instead of Alert
  const showSuccessPopup = (title: string, message: string) => {
    setSuccessTitle(title);
    setSuccessMessage(message);
    setShowSuccessModal(true);
    
    // Gentle fade in and scale animation
    checkmarkScale.value = withTiming(1, { duration: 300 });
    checkmarkOpacity.value = withTiming(1, { duration: 300 });
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      setShowSuccessModal(false);
      // Reset animation for next time
      checkmarkScale.value = 0;
      checkmarkOpacity.value = 0;
    }, 3000);
  };

  // Handle status update with real API calls
  const handleUpdateStatus = async () => {
    if (updating) return;

    console.log('🔄 handleUpdateStatus called:', {
      currentStatus,
      hasAppointment: !!appointment,
      appointmentId: appointment?.id,
      userId: user?.id
    });

    try {
      setUpdating(true);
      let successTitle = '';
      let successMessage = '';

      // Case 1: Offer ACCEPTED → Create Appointment (SCHEDULED)
      if (currentStatus === 'accepted' && !appointment) {
        console.log('📝 Creating new appointment...');
        
        if (!user?.id) {
          showAlertModal('error', 'Lỗi', 'Không tìm thấy thông tin thợ');
          return;
        }

        // Step 1: Create appointment
        const createResponse = await appointmentsService.createAppointment(
          serviceRequestId as string,
          user.id
        );

        console.log('✅ Created appointment:', createResponse);
        
        // Step 2: GET full appointment data from server
        const appointmentData = await appointmentsService.getAppointment(createResponse.appointmentId);
        console.log('✅ Fetched full appointment data:', appointmentData);
        
        // Update local state with full appointment data from GET
        setAppointment(appointmentData);
        setCurrentStatus(appointmentData.status); // Use status from GET response
        
        // Update offer locally to include appointmentId
        if (offer) {
          setOffer({
            ...offer,
            appointmentId: appointmentData.id
          });
          console.log('✅ Updated offer with appointmentId:', appointmentData.id);
        }
        
        // Cache appointmentId in AsyncStorage (for persistence across app restarts)
        // Use userId in cache key to avoid conflicts between different users
        const cacheKey = user?.id ? `appointment_${offerId}_${user.id}` : `appointment_${offerId}`;
        await AsyncStorage.setItem(cacheKey, appointmentData.id);
        console.log('💾 Cached appointmentId to storage:', appointmentData.id, 'key:', cacheKey);
        
        successTitle = 'Tạo lịch hẹn thành công';
        successMessage = 'Đơn hàng đã được lên lịch. Hãy chuẩn bị xuất phát đến địa điểm!';
        
        console.log('✅ Appointment creation complete. Status:', appointmentData.status);
        showSuccessPopup(successTitle, successMessage);
        return;
      }

      // Case 2: Appointment SCHEDULED → Update to EN_ROUTE
      if (appointment && currentStatus === 'SCHEDULED') {
        // Get current location
        const locationCoords = await requestLocation();
        
        if (!locationCoords) {
          showAlertModal(
            'warning',
            'Cần quyền vị trí',
            'Vui lòng cấp quyền truy cập vị trí để cập nhật trạng thái xuất phát.'
          );
          return;
        }

        const updateData = await appointmentsService.updateAppointmentStatus(
          appointment.id,
          {
            status: AppointmentStatus.EN_ROUTE,
            lat: locationCoords.latitude,
            lng: locationCoords.longitude
          }
        );

        console.log('✅ Updated to EN_ROUTE with location:', {
          lat: locationCoords.latitude,
          lng: locationCoords.longitude,
          data: updateData
        });
        
        setAppointment(updateData as any);
        setCurrentStatus(updateData.status); // Use status from API response
        successTitle = 'Đã xác nhận xuất phát';
        successMessage = 'Bạn đang trên đường đến địa điểm. An toàn là trên hết!';
        
        await fetchOrderData();
        showSuccessPopup(successTitle, successMessage);
        
        // Auto-open map view after 3 seconds
        setTimeout(() => {
          setShowMapView(true);
        }, 3000);
        
        return;
      }

      // Case 3: EN_ROUTE → ARRIVED
      if (appointment && currentStatus === AppointmentStatus.EN_ROUTE) {
        // Get current location
        const locationCoords = await requestLocation();
        
        if (!locationCoords) {
          showAlertModal(
            'warning',
            'Cần quyền vị trí',
            'Vui lòng cấp quyền truy cập vị trí để xác nhận đã đến nơi.'
          );
          return;
        }

        const updateData = await appointmentsService.updateAppointmentStatus(
          appointment.id,
          {
            status: AppointmentStatus.ARRIVED,
            lat: locationCoords.latitude,
            lng: locationCoords.longitude
          }
        );

        console.log('✅ Updated to ARRIVED with location:', {
          lat: locationCoords.latitude,
          lng: locationCoords.longitude,
          data: updateData
        });
        
        setAppointment(updateData as any);
        setCurrentStatus(updateData.status); // Use status from API response
        successTitle = 'Đã đến nơi';
        successMessage = 'Bạn đã đến địa điểm. Hãy liên hệ khách hàng và bắt đầu kiểm tra!';
        
        await fetchOrderData();
        showSuccessPopup(successTitle, successMessage);
        return;
      }

      // Case 4: ARRIVED → CHECKING
      if (appointment && currentStatus === AppointmentStatus.ARRIVED) {
        const updateData = await appointmentsService.updateAppointmentStatus(
          appointment.id,
          {
            status: AppointmentStatus.CHECKING,
            timestamp: new Date().toISOString()
          }
        );

        console.log('✅ Updated to CHECKING:', updateData);
        
        setAppointment(updateData as any);
        setCurrentStatus(updateData.status); // Use status from API response
        successTitle = 'Bắt đầu kiểm tra';
        successMessage = 'Hãy kiểm tra kỹ lưỡng tình trạng thiết bị và xác định phương án sửa chữa.';
        
        await fetchOrderData();
        showSuccessPopup(successTitle, successMessage);
        return;
      }

      // Case 5: CHECKING → REPAIRING or PRICE_REVIEW (with photo + notes + finalCost validation)
      if (appointment && currentStatus === AppointmentStatus.CHECKING) {
        // Validation: Must have at least 1 photo
        if (uploadedMedia.length === 0) {
          showAlertModal('warning', 'Thiếu ảnh', 'Vui lòng chụp ít nhất 1 ảnh tình trạng ban đầu trước khi tiếp tục');
          return;
        }
        
        // Validation: Must have notes
        if (!initialNotes.trim()) {
          showAlertModal('warning', 'Thiếu ghi chú', 'Vui lòng nhập ghi chú về tình trạng thiết bị trước khi tiếp tục');
          return;
        }
        
        // Validation: No photos still uploading
        if (uploadedMedia.some(m => m.isUploading)) {
          showAlertModal('info', 'Đang tải ảnh', 'Vui lòng đợi các ảnh tải xong trước khi tiếp tục');
          return;
        }
        
        // Check if offer has estimatedCost but no finalCost → PRICE_REVIEW flow
        const needsFinalCost = offer && offer.estimatedCost && !offer.finalCost;
        
        if (needsFinalCost) {
          // Validation: Must have finalCost input
          if (!finalCostInput || !finalCostInput.trim()) {
            showAlertModal('warning', 'Thiếu giá cuối cùng', 'Vui lòng nhập giá cuối cùng sau khi kiểm tra');
            return;
          }
          
          const finalCostValue = parseInt(finalCostInput);
          if (isNaN(finalCostValue) || finalCostValue <= 0) {
            showAlertModal('error', 'Giá không hợp lệ', 'Vui lòng nhập giá cuối cùng hợp lệ (lớn hơn 0)');
            return;
          }
          
          // PRICE_REVIEW flow: CHECKING → PRICE_REVIEW
          console.log('💰 PRICE_REVIEW flow: Updating to PRICE_REVIEW with finalCost:', finalCostValue);
          
          // PATCH /api/v1/appointments/{id} with MediaItem objects - Status: PRICE_REVIEW
          const mediaItems = uploadedMedia.map(m => ({
            url: m.fileURL,
            mediaType: 'INITIAL'
          }));
          console.log('📸 Sending media items to PATCH (PRICE_REVIEW):', mediaItems);
          
          // Step 1: Update appointment to PRICE_REVIEW
          const updateData = await appointmentsService.updateAppointmentStatus(
            appointment.id,
            {
              status: AppointmentStatus.PRICE_REVIEW,
              media: mediaItems,
              note: initialNotes.trim(),
              timestamp: new Date().toISOString()
            }
          );

          console.log('✅ Updated to PRICE_REVIEW:', updateData);
          
          // Step 2: Update offer with finalCost (PUT /api/v1/serviceDeliveryOffers/{id}/update)
          // Backend only needs: ServiceRequestId, FinalCost, Notes (NOT EstimatedCost)
          try {
            await serviceDeliveryOffersService.updateOfferFinalCost(
              offerId as string,
              serviceRequestId as string,
              finalCostValue,
              initialNotes.trim() // Only pass notes, backend doesn't need estimatedCost
            );
            console.log('✅ Updated offer finalCost:', finalCostValue);
            
            // Update local offer state
            setOffer({
              ...offer,
              finalCost: finalCostValue
            });
          } catch (error: any) {
            console.error('❌ Error updating finalCost:', error);
            showAlertModal('error', 'Lỗi', 'Không thể cập nhật giá cuối cùng. Vui lòng thử lại.');
            return;
          }
          
          setAppointment(updateData as any);
          setCurrentStatus(updateData.status);
          successTitle = 'Đã gửi báo giá cuối cùng';
          successMessage = 'Đã gửi giá cuối cùng cho khách hàng. Chờ khách hàng xác nhận.';
          
          await fetchOrderData();
          showSuccessPopup(successTitle, successMessage);
          return;
        }
        
        // Normal flow: CHECKING → REPAIRING (when already has finalCost or no estimatedCost)
        const mediaItems = uploadedMedia.map(m => ({
          url: m.fileURL,
          mediaType: 'INITIAL'
        }));
        console.log('📸 Sending media items to PATCH:', mediaItems);
        
        const updateData = await appointmentsService.updateAppointmentStatus(
          appointment.id,
          {
            status: AppointmentStatus.REPAIRING,
            media: mediaItems,
            note: initialNotes.trim(),
            timestamp: new Date().toISOString()
          }
        );

        console.log('✅ Updated to REPAIRING with media:', updateData);
        
        setAppointment(updateData as any);
        setCurrentStatus(updateData.status); // Use status from API response
        successTitle = 'Bắt đầu sửa chữa';
        successMessage = 'Bạn đang tiến hành sửa chữa. Hãy hoàn thành tốt công việc!';
        
        await fetchOrderData();
        showSuccessPopup(successTitle, successMessage);
        return;
      }

      // Case 5.5: PRICE_REVIEW → REPAIRING (Customer accepted, just transition)
      if (appointment && currentStatus === AppointmentStatus.PRICE_REVIEW) {
        const updateData = await appointmentsService.updateAppointmentStatus(
          appointment.id,
          {
            status: AppointmentStatus.REPAIRING,
            timestamp: new Date().toISOString()
          }
        );

        console.log('✅ Updated from PRICE_REVIEW to REPAIRING:', updateData);
        
        setAppointment(updateData as any);
        setCurrentStatus(updateData.status);
        successTitle = 'Bắt đầu sửa chữa';
        successMessage = 'Khách hàng đã chấp nhận giá. Hãy bắt đầu sửa chữa!';
        
        await fetchOrderData();
        showSuccessPopup(successTitle, successMessage);
        return;
      }

      // Case 6: REPAIRING → REPAIRED (with photo + notes validation)
      if (appointment && currentStatus === AppointmentStatus.REPAIRING) {
        // Validation: Must have at least 1 photo
        if (finalMedia.length === 0) {
          showAlertModal('warning', 'Thiếu ảnh', 'Vui lòng chụp ít nhất 1 ảnh kết quả sau sửa chữa trước khi tiếp tục');
          return;
        }
        
        // Validation: Must have notes
        if (!finalNotes.trim()) {
          showAlertModal('warning', 'Thiếu ghi chú', 'Vui lòng nhập ghi chú về kết quả sửa chữa trước khi tiếp tục');
          return;
        }
        
        // Validation: No photos still uploading
        if (finalMedia.some(m => m.isUploading)) {
          showAlertModal('info', 'Đang tải ảnh', 'Vui lòng đợi các ảnh tải xong trước khi tiếp tục');
          return;
        }
        
        // PATCH /api/v1/appointments/{id} with MediaItem objects (FINAL type)
        const mediaItems = finalMedia.map(m => ({
          url: m.fileURL,
          mediaType: 'FINAL'
        }));
        console.log('📸 Sending final media items to PATCH:', mediaItems);
        
        const updateData = await appointmentsService.updateAppointmentStatus(
          appointment.id,
          {
            status: AppointmentStatus.REPAIRED,
            media: mediaItems,
            note: finalNotes.trim(),
            timestamp: new Date().toISOString()
          }
        );

        console.log('✅ Updated to REPAIRED with media:', updateData);
        
        setAppointment(updateData as any);
        setCurrentStatus(updateData.status); // Use status from API response
        successTitle = 'Hoàn thành sửa chữa';
        successMessage = 'Xuất sắc! Công việc đã hoàn thành. Hãy chụp ảnh kết quả và xác nhận với khách hàng.';
        
        await fetchOrderData();
        showSuccessPopup(successTitle, successMessage);
        return;
      }

    } catch (err: any) {
      console.error('Error updating status:', err);
      showAlertModal('error', 'Lỗi', err.message || 'Không thể cập nhật trạng thái');
    } finally {
      setUpdating(false);
    }
  };

  const handleContactCustomer = () => {
    if (!serviceRequest) return;
    
    showAlertModal(
      'confirm',
      'Liên hệ khách hàng',
      `Gọi cho ${serviceRequest.customerName || 'khách hàng'}?`,
      () => {
        showAlertModal('info', 'Đang gọi...', serviceRequest.phoneNumber);
      },
      true
    );
  };

  const handleViewLocation = async () => {
    if (!serviceRequest || !serviceRequest.requestAddress) {
      showAlertModal('error', 'Lỗi', 'Không có thông tin địa chỉ');
      return;
    }
    
    const address = serviceRequest.requestAddress;
    const encodedAddress = encodeURIComponent(address);
    
    // Try Google Maps first (more common on mobile)
    const googleMapsUrl = Platform.select({
      ios: `maps://app?daddr=${encodedAddress}`,
      android: `google.navigation:q=${encodedAddress}`,
    });
    
    const appleMapsUrl = `http://maps.apple.com/?daddr=${encodedAddress}`;
    const googleMapsWebUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    
    try {
      // Check if Google Maps app is available
      const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl || '');
      
      if (canOpenGoogleMaps) {
        await Linking.openURL(googleMapsUrl || '');
      } else {
        // Fallback to web Google Maps or Apple Maps on iOS
        const fallbackUrl = Platform.OS === 'ios' ? appleMapsUrl : googleMapsWebUrl;
        const canOpenFallback = await Linking.canOpenURL(fallbackUrl);
        
        if (canOpenFallback) {
          await Linking.openURL(fallbackUrl);
        } else {
          showAlertModal(
            'warning',
            'Không thể mở bản đồ',
            'Vui lòng cài đặt Google Maps hoặc Apple Maps'
          );
        }
      }
    } catch (error) {
      console.error('Error opening maps:', error);
      showAlertModal('error', 'Lỗi', 'Không thể mở ứng dụng bản đồ');
    }
  };

  const handleChatCustomer = () => {
    if (!serviceRequest) return;
    
    showAlertModal(
      'confirm',
      'Chat với khách hàng',
      `Mở chat với ${serviceRequest.customerName || 'khách hàng'}?`,
      () => {
        showAlertModal('info', 'Đang mở chat...', '');
      },
      true
    );
  };

  const handleViewImage = (imageUri: string, index: number, totalImgs: number) => {
    setSelectedImageUri(imageUri);
    setSelectedImageIndex(index);
    setTotalImages(totalImgs);
    setShowImageModal(true);
  };

  const handleNextImage = () => {
    if (selectedImageIndex < totalImages - 1 && displayData.attachedImages) {
      const nextIndex = selectedImageIndex + 1;
      setSelectedImageIndex(nextIndex);
      setSelectedImageUri(displayData.attachedImages[nextIndex]);
    }
  };

  const handlePreviousImage = () => {
    if (selectedImageIndex > 0 && displayData.attachedImages) {
      const prevIndex = selectedImageIndex - 1;
      setSelectedImageIndex(prevIndex);
      setSelectedImageUri(displayData.attachedImages[prevIndex]);
    }
  };

  const handleViewEarnings = () => {
    if (!offer) return;
    setShowEarningsModal(true);
  };

  const calculateEarnings = () => {
    if (!offer) return { finalPrice: 0, commission: 0, actualEarnings: 0 };
    
    // Get final cost from offer
    const finalPrice = offer.finalCost || offer.estimatedCost || 0;
    
    // Calculate 15% commission deduction
    const commissionRate = 0.15;
    const commission = finalPrice * commissionRate;
    const actualEarnings = finalPrice - commission;
    
    return { finalPrice, commission, actualEarnings };
  };

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  const handleConfirmReceived = () => {
    setShowEarningsModal(false);
    showAlertModal('success', 'Thành công', 'Cảm ơn bạn đã hoàn thành công việc!');
  };

  const handleFinalPriceConfirmation = () => {
    // This function is no longer used since we handle finalCost in the CHECKING step
    // Kept for backward compatibility but show info modal
    showAlertModal(
      'info',
      'Thông báo',
      'Vui lòng nhập giá cuối cùng trong bước "Đang kiểm tra"'
    );
  };

  const handleTakePhoto = async (type: 'before' | 'after') => {
    const currentMediaList = type === 'before' ? uploadedMedia : finalMedia;
    
    // Check max photos limit (4 images)
    if (currentMediaList.length >= 4) {
      showAlertModal('warning', 'Giới hạn', 'Chỉ được tải tối đa 4 ảnh', undefined, false, true);
      return;
    }
    
    // Show Alert.alert for photo picker menu
    const photoType = type === 'before' ? 'initial' : 'final';
    Alert.alert(
      'Chọn ảnh',
      'Bạn muốn chụp ảnh mới hay chọn từ thư viện?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: '📷 Chụp ảnh',
          onPress: () => openCameraForType(photoType)
        },
        {
          text: '🖼️ Thư viện',
          onPress: () => openImageLibraryForType(photoType)
        }
      ]
    );
  };

  const openCameraForType = async (type: 'initial' | 'final') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Cần quyền camera',
          'Vui lòng cấp quyền camera trong Cài đặt để chụp ảnh',
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Mở Cài đặt', 
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadImageImmediately(result.assets[0].uri, type === 'initial' ? 'before' : 'after');
      }
    } catch (error: any) {
      console.error('Error taking photo:', error);
      showAlertModal('error', 'Lỗi', 'Không thể chụp ảnh');
    }
  };

  const openImageLibraryForType = async (type: 'initial' | 'final') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Cần quyền thư viện ảnh',
          'Vui lòng cấp quyền truy cập thư viện ảnh trong Cài đặt',
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Mở Cài đặt', 
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            }
          ]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadImageImmediately(result.assets[0].uri, type === 'initial' ? 'before' : 'after');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showAlertModal('error', 'Lỗi', 'Không thể chọn ảnh');
    }
  };
  
  // Upload image immediately after selection (using mediaService)
  const uploadImageImmediately = async (localUri: string, type: 'before' | 'after' = 'before') => {
    const tempId = `temp-${Date.now()}`;
    const mediaType = type === 'before' ? 'INITIAL' : 'FINAL';
    const isInitial = type === 'before';
    
    try {
      // Add placeholder with loading state to appropriate state
      if (isInitial) {
        setUploadedMedia(prev => [...prev, {
          mediaID: tempId,
          fileURL: '',
          localUri: localUri,
          isUploading: true,
        }]);
        setIsUploadingImage(true);
      } else {
        setFinalMedia(prev => [...prev, {
          mediaID: tempId,
          fileURL: '',
          localUri: localUri,
          isUploading: true,
        }]);
        setIsUploadingFinalImage(true);
      }
      
      // Prepare file object
      const filename = localUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : 'image/jpeg';
      
      // Get requestID from serviceRequest object (use requestID property, not id)
      const requestID = serviceRequest?.requestID || serviceRequestId as string;
      
      // Validation: requestID must exist
      if (!requestID) {
        console.error('❌ Missing requestID! serviceRequest.requestID:', serviceRequest?.requestID, 'serviceRequestId:', serviceRequestId);
        showAlertModal('error', 'Lỗi', 'Không tìm thấy thông tin yêu cầu dịch vụ. Vui lòng thử lại.');
        
        // Remove failed upload
        if (isInitial) {
          setUploadedMedia(prev => prev.filter(media => media.mediaID !== tempId));
          setIsUploadingImage(false);
        } else {
          setFinalMedia(prev => prev.filter(media => media.mediaID !== tempId));
          setIsUploadingFinalImage(false);
        }
        return;
      }
      
      console.log(`📸 Uploading ${mediaType} photo via mediaService`);
      console.log('📋 RequestID:', requestID);
      console.log('📋 AppointmentID:', appointment?.id);
      console.log('📋 MediaType:', mediaType);
      
      // Use mediaService.uploadMedia (matching book-service.tsx pattern)
      const uploadedData = await mediaService.uploadMedia({
        requestID: requestID,
        appointmentID: appointment?.id,
        mediaType: mediaType,
        file: {
          uri: localUri,
          type: fileType,
          name: filename,
        },
      });
      
      console.log('✅ Photo uploaded successfully via mediaService:', uploadedData);
      console.log('📸 FileURL:', uploadedData.fileURL);
      
      // Update with real data from backend in appropriate state
      if (isInitial) {
        setUploadedMedia(prev => prev.map(media => 
          media.mediaID === tempId ? {
            mediaID: uploadedData.mediaID,
            fileURL: uploadedData.fileURL,
            localUri: localUri,
            isUploading: false,
          } : media
        ));
      } else {
        setFinalMedia(prev => prev.map(media => 
          media.mediaID === tempId ? {
            mediaID: uploadedData.mediaID,
            fileURL: uploadedData.fileURL,
            localUri: localUri,
            isUploading: false,
          } : media
        ));
      }
      
    } catch (error: any) {
      console.error('❌ Photo upload error:', error);
      showAlertModal('error', 'Lỗi', 'Không thể tải ảnh lên. Vui lòng thử lại.');
      // Remove failed upload from appropriate state
      if (isInitial) {
        setUploadedMedia(prev => prev.filter(media => media.mediaID !== tempId));
      } else {
        setFinalMedia(prev => prev.filter(media => media.mediaID !== tempId));
      }
    } finally {
      if (isInitial) {
        setIsUploadingImage(false);
      } else {
        setIsUploadingFinalImage(false);
      }
    }
  };
  
  // Delete photo from server (using mediaService)
  const handleDeletePhoto = async (mediaID: string, type: 'before' | 'after' = 'before') => {
    showAlertModal(
      'confirm',
      'Xác nhận',
      'Bạn có chắc muốn xóa ảnh này?',
      async () => {
        try {
          // Use mediaService.deleteMedia instead of fetch
          await mediaService.deleteMedia(mediaID);
          console.log('✅ Photo deleted via mediaService:', mediaID);
          
          // Remove from appropriate local state
          if (type === 'before') {
            setUploadedMedia(prev => prev.filter(media => media.mediaID !== mediaID));
          } else {
            setFinalMedia(prev => prev.filter(media => media.mediaID !== mediaID));
          }
          showAlertModal('success', 'Thành công', 'Đã xóa ảnh');
        } catch (error) {
          console.error('❌ Delete photo error:', error);
          showAlertModal('error', 'Lỗi', 'Không thể xóa ảnh. Vui lòng thử lại.');
        }
      },
      true
    );
  };
  
  // Open image viewer modal
  const openImageViewer = (imageUri: string, index: number, totalCount: number = uploadedMedia.length) => {
    setSelectedImageUri(imageUri);
    setSelectedImageIndex(index);
    setTotalImages(totalCount);
    setShowImageModal(true);
  };
  
  // Close image viewer modal
  const closeImageViewer = () => {
    setShowImageModal(false);
    setSelectedImageUri('');
    setSelectedImageIndex(0);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#609CEF" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient colors={['#609CEF', '#3B82F6']} style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Theo dõi đơn hàng</Text>
        <TouchableOpacity style={styles.headerAction} onPress={handleContactCustomer}>
          <Ionicons name="call" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Current Status */}
        <View style={styles.statusSection}>
          <TouchableOpacity 
            style={[styles.statusCard, { borderLeftColor: statusInfo.color }]}
            onPress={handleShowTimeline}
            activeOpacity={0.8}
          >
            <View style={styles.statusHeader}>
              <View style={[styles.statusIcon, { backgroundColor: statusInfo.color }]}>
                <Ionicons name={statusInfo.icon as any} size={24} color="#FFFFFF" />
              </View>
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>{statusInfo.title}</Text>
                <Text style={styles.statusDescription}>{statusInfo.description}</Text>
              </View>
              <View style={styles.timelineIndicator}>
                <Ionicons 
                  name={showTimeline ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#609CEF" 
                />
              </View>
            </View>
          </TouchableOpacity>

          {/* Inline Timeline */}
          {showTimeline && (
            <View style={styles.inlineTimelineContainer}>
              <View style={styles.timelineHeader}>
                <Ionicons name="time-outline" size={20} color="#609CEF" />
                <Text style={styles.timelineHeaderText}>Timeline Thực Hiện</Text>
              </View>
              
              {getTimeline().map((item, index) => {
                const stepInfo = getStatusInfo(item.status);
                const isCurrentStep = item.status === currentStatus;
                const isCompleted = item.completed;
                
                return (
                  <View key={index} style={styles.inlineTimelineItem}>
                    <View style={styles.timelineLeft}>
                      <View style={[
                        styles.timelineIcon,
                        { 
                          backgroundColor: isCompleted ? '#10B981' : (isCurrentStep ? '#3B82F6' : '#E5E7EB'),
                          borderColor: isCurrentStep && !isCompleted ? '#3B82F6' : 'transparent',
                          borderWidth: isCurrentStep && !isCompleted ? 2 : 0
                        }
                      ]}>
                        <Ionicons 
                          name={isCompleted ? "checkmark" : stepInfo.icon as any} 
                          size={14} 
                          color={isCompleted ? "#FFFFFF" : "#9CA3AF"} 
                        />
                      </View>
                      {index < getTimeline().length - 1 && (
                        <View style={[
                          styles.timelineLine,
                          { backgroundColor: isCompleted ? '#10B981' : '#E5E7EB' }
                        ]} />
                      )}
                    </View>
                    
                    <View style={styles.timelineRight}>
                      <Text style={[
                        styles.timelineStepTitle,
                        { 
                          color: isCompleted ? '#1F2937' : '#9CA3AF',
                          fontSize: 14
                        }
                      ]}>
                        {stepInfo.title}
                      </Text>
                      <Text style={[styles.timelineStepDescription, { fontSize: 12 }]}>
                        {stepInfo.description}
                      </Text>
                      {item.time && (
                        <Text style={styles.timelineTime}>
                          {item.date} • {item.time}
                        </Text>
                      )}
                      {isCurrentStep && !isCompleted && (
                        <View style={styles.currentStepBadge}>
                          <Text style={styles.currentStepText}>Hiện tại</Text>
                        </View>
                      )}
                      {isCompleted && isCurrentStep && item.status === 'completed' && (
                        <View style={[styles.currentStepBadge, { backgroundColor: '#DCFCE7' }]}>
                          <Text style={[styles.currentStepText, { color: '#10B981' }]}>Hoàn thành</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Map View Button - Show during EN_ROUTE status */}
        {currentStatus === AppointmentStatus.EN_ROUTE && serviceRequest && (
          <View style={styles.mapSection}>
            <TouchableOpacity 
              style={styles.mapButton}
              onPress={() => setShowMapView(true)}
              activeOpacity={0.8}
            >
              <View style={styles.mapButtonIcon}>
                <Ionicons name="map" size={24} color="#609CEF" />
              </View>
              <View style={styles.mapButtonContent}>
                <Text style={styles.mapButtonTitle}>Xem bản đồ chỉ đường</Text>
                <Text style={styles.mapButtonDescription}>
                  Theo dõi vị trí và khoảng cách đến khách hàng
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Photo Upload Section - Show during CHECKING status */}
        {currentStatus === AppointmentStatus.CHECKING && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Hình ảnh tình trạng ban đầu <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.imageHint}>
              Chụp ảnh hiện trạng thiết bị trước khi sửa chữa (Tối đa 4 ảnh)
            </Text>
            
            <View style={styles.imageContainer}>
              {uploadedMedia.map((media, index) => (
                <View key={media.mediaID} style={styles.imagePreview}>
                  <TouchableOpacity
                    style={styles.imagePreviewTouchable}
                    onPress={() => openImageViewer(media.localUri, index, uploadedMedia.length)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: media.localUri }} style={styles.previewImage} />
                  </TouchableOpacity>
                  
                  {media.isUploading && (
                    <View style={styles.imageUploadingOverlay}>
                      <ActivityIndicator size="small" color="#609CEF" />
                      <Text style={styles.uploadingText}>Đang tải...</Text>
                    </View>
                  )}
                  
                  {!media.isUploading && (
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => handleDeletePhoto(media.mediaID, 'before')}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              
              {uploadedMedia.length < 4 && (
                <TouchableOpacity 
                  style={styles.addImageButton}
                  onPress={() => handleTakePhoto('before')}
                  disabled={isUploadingImage}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="camera" 
                    size={28} 
                    color={isUploadingImage ? "#9CA3AF" : "#609CEF"} 
                  />
                  <Text style={styles.addImageText}>
                    {isUploadingImage ? 'Đang tải...' : 'Thêm ảnh'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Final Cost Input - Only show if offer has estimatedCost but no finalCost */}
            {offer && offer.estimatedCost && !offer.finalCost && (
              <>
                <Text style={styles.sectionTitle}>
                  Giá cuối cùng <Text style={styles.required}>*</Text>
                </Text>
                <Text style={styles.imageHint}>
                  Nhập giá cuối cùng sau khi kiểm tra thực tế (Giá dự kiến: {offer.estimatedCost.toLocaleString('vi-VN')}đ)
                </Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="cash-outline" size={20} color="#609CEF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nhập giá cuối cùng (VNĐ)"
                    value={finalCostInput}
                    onChangeText={(text) => {
                      // Only allow numbers
                      const numericValue = text.replace(/[^0-9]/g, '');
                      setFinalCostInput(numericValue);
                    }}
                    keyboardType="numeric"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                {finalCostInput && (
                  <Text style={styles.pricePreview}>
                    Giá đã nhập: {parseInt(finalCostInput).toLocaleString('vi-VN')}đ
                  </Text>
                )}
              </>
            )}
            
            <Text style={styles.sectionTitle}>
              Ghi chú tình trạng <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Mô tả chi tiết tình trạng thiết bị, các vấn đề phát hiện được..."
                value={initialNotes}
                onChangeText={setInitialNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        )}
        
        {/* Photo Upload Section - Show during REPAIRING status */}
        {currentStatus === AppointmentStatus.REPAIRING && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Hình ảnh kết quả sửa chữa <Text style={styles.required}>*</Text>
            </Text>
            <Text style={styles.imageHint}>
              Chụp ảnh thiết bị sau khi sửa chữa hoàn tất (Tối đa 4 ảnh)
            </Text>
            
            <View style={styles.imageContainer}>
              {finalMedia.map((media, index) => (
                <View key={media.mediaID} style={styles.imagePreview}>
                  <TouchableOpacity
                    style={styles.imagePreviewTouchable}
                    onPress={() => openImageViewer(media.localUri, index, finalMedia.length)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: media.localUri }} style={styles.previewImage} />
                  </TouchableOpacity>
                  
                  {media.isUploading && (
                    <View style={styles.imageUploadingOverlay}>
                      <ActivityIndicator size="small" color="#609CEF" />
                      <Text style={styles.uploadingText}>Đang tải...</Text>
                    </View>
                  )}
                  
                  {!media.isUploading && (
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => handleDeletePhoto(media.mediaID, 'after')}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              
              {finalMedia.length < 4 && (
                <TouchableOpacity 
                  style={styles.addImageButton}
                  onPress={() => handleTakePhoto('after')}
                  disabled={isUploadingFinalImage}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="camera" 
                    size={28} 
                    color={isUploadingFinalImage ? "#9CA3AF" : "#609CEF"} 
                  />
                  <Text style={styles.addImageText}>
                    {isUploadingFinalImage ? 'Đang tải...' : 'Thêm ảnh'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            
            <Text style={styles.sectionTitle}>
              Ghi chú kết quả <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Mô tả chi tiết công việc đã thực hiện, kết quả sửa chữa..."
                value={finalNotes}
                onChangeText={setFinalNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        )}

        {/* Action Buttons - Moved up for better visibility */}
        <View style={styles.actionSection}>
          {/* Priority Camera Button - Always visible when needed */}
          {currentStatus === 'arrived' && (
            <TouchableOpacity style={styles.primaryActionButton} onPress={() => handleTakePhoto('before')}>
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.primaryActionGradient}>
                <Ionicons name="camera" size={24} color="#FFFFFF" />
                <Text style={styles.primaryActionButtonText}>Chụp ảnh tình trạng ban đầu</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {currentStatus === 'repairing' && (
            <TouchableOpacity style={styles.primaryActionButton} onPress={() => handleTakePhoto('after')}>
              <LinearGradient colors={['#059669', '#047857']} style={styles.primaryActionGradient}>
                <Ionicons name="camera" size={24} color="#FFFFFF" />
                <Text style={styles.primaryActionButtonText}>Chụp ảnh sau sửa chữa</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {currentStatus === 'completed' && (
            <TouchableOpacity style={styles.primaryActionButton} onPress={handleViewEarnings}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.primaryActionGradient}>
                <Ionicons name="cash" size={24} color="#FFFFFF" />
                <Text style={styles.primaryActionButtonText}>Xem thực nhận</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Secondary Action Buttons - Hide after arrived */}
          {!['arrived', 'price_confirmation', 'repairing', 'payment_pending', 'completed'].includes(currentStatus) && (
            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleViewLocation}>
                <LinearGradient colors={['#609CEF', '#3B82F6']} style={styles.actionGradient}>
                  <Ionicons name="location" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Xem địa chỉ</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleContactCustomer}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.actionGradient}>
                  <Ionicons name="call" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Gọi khách hàng</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
          
          {/* Service Card - Redesigned */}
          <View style={styles.serviceCard}>
            <LinearGradient 
              colors={['#609CEF', '#4F8BE8']} 
              style={styles.serviceCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.serviceCardContent}>
                <View style={styles.serviceIconCircle}>
                  <Ionicons name="construct" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.serviceDetailsContainer}>
                  <Text style={styles.serviceLabel}>Dịch vụ đã chọn</Text>
                  <Text style={styles.serviceName}>{displayData.serviceName}</Text>
                </View>
              </View>
            </LinearGradient>
            
            <View style={styles.servicePriceContainer}>
              <View style={styles.priceRow}>
                <View style={styles.priceMainInfo}>
                  <Text style={styles.priceLabelText}>Giá trị đơn hàng</Text>
                  <Text style={styles.servicePriceValue}>{displayData.priceRange}</Text>
                </View>
                <View style={[
                  styles.priceTypeBadge,
                  { backgroundColor: displayData.quoteType === 'estimated' ? '#FFFBEB' : '#ECFDF5',
                    borderColor: displayData.quoteType === 'estimated' ? '#FCD34D' : '#A7F3D0' }
                ]}>
                  <Ionicons 
                    name={displayData.quoteType === 'estimated' ? "time-outline" : "checkmark-circle"} 
                    size={16} 
                    color={displayData.quoteType === 'estimated' ? '#F59E0B' : '#10B981'} 
                  />
                  <Text style={[
                    styles.priceTypeBadgeText,
                    { color: displayData.quoteType === 'estimated' ? '#F59E0B' : '#10B981' }
                  ]}>
                    {displayData.quoteType === 'estimated' ? 'GIÁ DỰ KIẾN' : 'GIÁ CHỐT'}
                  </Text>
                </View>
              </View>
              
              {displayData.quoteType === 'estimated' && (
                <View style={styles.priceNoteBox}>
                  <Ionicons name="information-circle" size={16} color="#F59E0B" />
                  <Text style={styles.priceNoteText}>Có thể điều chỉnh sau khi kiểm tra thực tế</Text>
                </View>
              )}
              {displayData.quoteType === 'final' && (
                <View style={[styles.priceNoteBox, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="lock-closed" size={16} color="#10B981" />
                  <Text style={[styles.priceNoteText, { color: '#10B981' }]}>Giá đã được xác nhận và không thay đổi</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Customer Info Card */}
          <View style={styles.customerCard}>
            <View style={styles.customerHeader}>
              <View style={styles.customerAvatarCircle}>
                <Ionicons name="person" size={20} color="#609CEF" />
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerLabel}>Khách hàng</Text>
                <Text style={styles.customerName}>{displayData.customerName}</Text>
              </View>
              <View style={styles.quickActionsGroup}>
                <TouchableOpacity style={styles.quickCallButton} onPress={handleContactCustomer}>
                  <Ionicons name="call" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickChatButton} onPress={handleChatCustomer}>
                  <Ionicons name="chatbubble-ellipses" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.customerPhoneSection}>
              <Ionicons name="call-outline" size={16} color="#9CA3AF" />
              <Text style={styles.customerPhoneText}>{displayData.phoneNumber}</Text>
            </View>
            {/* Address Section */}
            <View style={styles.customerAddressSection}>
              <Ionicons name="location-outline" size={16} color="#9CA3AF" />
              <View style={styles.addressTextContainer}>
                <Text style={styles.customerAddressText}>{displayData.address}</Text>
                {displayData.addressNote && (
                  <Text style={styles.addressNoteText}>Ghi chú: {displayData.addressNote}</Text>
                )}
              </View>
            </View>
          </View>
          
          {/* Appointment Card - Enhanced for visibility */}
          <View style={styles.appointmentCardHighlight}>
            <View style={styles.appointmentHeader}>
              <View style={styles.appointmentIconContainer}>
                <Ionicons name="calendar" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.appointmentTitleContainer}>
                <Text style={styles.appointmentTitle}>Lịch hẹn khách hàng</Text>
                <Text style={styles.appointmentSubtitle}>Thời gian đã đặt</Text>
              </View>
            </View>
            <View style={styles.appointmentTimeContainer}>
              <View style={styles.appointmentDateBox}>
                <Text style={styles.appointmentDateLabel}>Ngày</Text>
                <Text style={styles.appointmentDateValue}>{displayData.appointmentDate}</Text>
              </View>
              <View style={styles.appointmentTimeDivider} />
              <View style={styles.appointmentTimeBox}>
                <Text style={styles.appointmentTimeLabel}>Giờ</Text>
                <Text style={styles.appointmentTimeValue}>{displayData.appointmentTime}</Text>
              </View>
            </View>
            <View style={styles.appointmentAlert}>
              <Ionicons name="time" size={16} color="#F59E0B" />
              <Text style={styles.appointmentAlertText}>Vui lòng đến đúng giờ đã hẹn</Text>
            </View>
          </View>
          
          {/* Description Card */}
          <View style={styles.descriptionCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={24} color="#609CEF" />
              <Text style={styles.cardTitle}>Mô tả sự cố</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.descriptionText}>{displayData.description}</Text>
            </View>
          </View>

          {/* Attached Images Card */}
          {displayData.attachedImages && displayData.attachedImages.length > 0 && (
            <View style={styles.imagesCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="images" size={24} color="#609CEF" />
                <Text style={styles.cardTitle}>Hình ảnh đính kèm ({displayData.attachedImages.length})</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScrollView}>
                <View style={styles.imagesContainer}>
                  {displayData.attachedImages.map((imageUri: string, index: number) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.imageWrapper}
                      onPress={() => handleViewImage(imageUri, index, displayData.attachedImages.length)}
                    >
                      <Image source={{ uri: imageUri }} style={styles.attachedImage} />
                      <View style={styles.imageOverlay}>
                        <Ionicons name="expand" size={16} color="#FFFFFF" />
                      </View>
                      <View style={styles.imageNumberBadge}>
                        <Text style={styles.imageNumberText}>{index + 1}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <View style={styles.imagesFooter}>
                <Ionicons name="information-circle" size={16} color="#6B7280" />
                <Text style={styles.imagesFooterText}>Nhấn để xem chi tiết hình ảnh</Text>
              </View>
            </View>
          )}
          
          {/* Initial Photos Card - Show during REPAIRING and later */}
          {(currentStatus === AppointmentStatus.REPAIRING || 
            currentStatus === AppointmentStatus.REPAIRED || 
            currentStatus === 'completed') && uploadedMedia.length > 0 && (
            <View style={styles.imagesCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="camera" size={24} color="#609CEF" />
                <Text style={styles.cardTitle}>Hình ảnh tình trạng ban đầu ({uploadedMedia.length})</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScrollView}>
                <View style={styles.imagesContainer}>
                  {uploadedMedia.map((media, index) => (
                    <TouchableOpacity
                      key={media.mediaID}
                      style={styles.imageWrapper}
                      onPress={() => openImageViewer(media.localUri, index, uploadedMedia.length)}
                    >
                      <Image source={{ uri: media.localUri }} style={styles.attachedImage} />
                      <View style={styles.imageOverlay}>
                        <Ionicons name="expand" size={16} color="#FFFFFF" />
                      </View>
                      <View style={[styles.imageNumberBadge, { backgroundColor: '#609CEF' }]}>
                        <Text style={styles.imageNumberText}>{index + 1}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <View style={styles.imagesFooter}>
                <Ionicons name="checkmark-circle" size={16} color="#609CEF" />
                <Text style={styles.imagesFooterText}>Ảnh đã chụp lúc kiểm tra ban đầu</Text>
              </View>
            </View>
          )}
          
          {/* Final Photos Card - Show during REPAIRED and completed */}
          {(currentStatus === AppointmentStatus.REPAIRED || 
            currentStatus === 'completed') && finalMedia.length > 0 && (
            <View style={styles.imagesCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="checkmark-done" size={24} color="#609CEF" />
                <Text style={styles.cardTitle}>Hình ảnh kết quả sửa chữa ({finalMedia.length})</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScrollView}>
                <View style={styles.imagesContainer}>
                  {finalMedia.map((media, index) => (
                    <TouchableOpacity
                      key={media.mediaID}
                      style={styles.imageWrapper}
                      onPress={() => openImageViewer(media.localUri, index, finalMedia.length)}
                    >
                      <Image source={{ uri: media.localUri }} style={styles.attachedImage} />
                      <View style={styles.imageOverlay}>
                        <Ionicons name="expand" size={16} color="#FFFFFF" />
                      </View>
                      <View style={[styles.imageNumberBadge, { backgroundColor: '#609CEF' }]}>
                        <Text style={styles.imageNumberText}>{index + 1}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <View style={styles.imagesFooter}>
                <Ionicons name="checkmark-circle" size={16} color="#6B7280" />
                <Text style={styles.imagesFooterText}>Ảnh đã chụp sau khi hoàn thành sửa chữa</Text>
              </View>
            </View>
          )}
        </View>

        {/* Status-specific Actions */}
        {currentStatus === 'arrived' && displayData.quoteType === 'estimated' && (
          <View style={styles.statusActionSection}>
            <TouchableOpacity style={styles.statusActionButton} onPress={handleFinalPriceConfirmation}>
              <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.statusActionGradient}>
                <Ionicons name="calculator" size={20} color="#FFFFFF" />
                <Text style={styles.statusActionButtonText}>Xác nhận giá cuối cùng</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* Sticky Swipe Button */}
      {currentStatus !== 'completed' && (
        <View style={styles.swipeSection}>
          {/* Show hint when EN_ROUTE - must use map button */}
          {currentStatus === AppointmentStatus.EN_ROUTE && (
            <View style={styles.enRouteHint}>
              <Ionicons name="information-circle" size={20} color="#F59E0B" />
              <Text style={styles.enRouteHintText}>
                Vui lòng sử dụng "Xem bản đồ chỉ đường" để xác nhận đã đến nơi
              </Text>
            </View>
          )}
          
          {/* Show hint when CHECKING - must add photos and notes */}
          {currentStatus === AppointmentStatus.CHECKING && (uploadedMedia.length === 0 || !initialNotes.trim()) && (
            <View style={styles.enRouteHint}>
              <Ionicons name="information-circle" size={20} color="#F59E0B" />
              <Text style={styles.enRouteHintText}>
                Vui lòng chụp ảnh và nhập ghi chú về tình trạng thiết bị
              </Text>
            </View>
          )}
          
          {/* Show hint when REPAIRING - must add photos and notes */}
          {currentStatus === AppointmentStatus.REPAIRING && (finalMedia.length === 0 || !finalNotes.trim()) && (
            <View style={styles.enRouteHint}>
              <Ionicons name="information-circle" size={20} color="#F59E0B" />
              <Text style={styles.enRouteHintText}>
                Vui lòng chụp ảnh và nhập ghi chú về kết quả sửa chữa
              </Text>
            </View>
          )}

          {/* Show waiting message when PRICE_REVIEW - waiting for customer acceptance */}
          {currentStatus === AppointmentStatus.PRICE_REVIEW && (
            <View style={[styles.enRouteHint, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
              <Ionicons name="time" size={20} color="#F59E0B" />
              <Text style={styles.enRouteHintText}>
                Đang chờ khách hàng xác nhận giá cuối cùng. Vui lòng đợi...
              </Text>
            </View>
          )}
          
          <SwipeButton
            title={
              currentStatus === AppointmentStatus.EN_ROUTE 
                ? "Dùng bản đồ để xác nhận đã đến" 
                : currentStatus === AppointmentStatus.PRICE_REVIEW
                ? "Đang chờ khách hàng xác nhận giá"
                : currentStatus === AppointmentStatus.CHECKING && (uploadedMedia.length === 0 || !initialNotes.trim())
                ? "Cần ảnh và ghi chú để tiếp tục"
                : currentStatus === AppointmentStatus.REPAIRING && (finalMedia.length === 0 || !finalNotes.trim())
                ? "Cần ảnh và ghi chú kết quả để hoàn thành"
                : "Vuốt để tiếp tục bước sau"
            }
            isEnabled={
              currentStatus !== AppointmentStatus.EN_ROUTE && 
              currentStatus !== AppointmentStatus.PRICE_REVIEW &&
              !(currentStatus === AppointmentStatus.CHECKING && (uploadedMedia.length === 0 || !initialNotes.trim())) &&
              !(currentStatus === AppointmentStatus.REPAIRING && (finalMedia.length === 0 || !finalNotes.trim()))
            }
            onSwipeComplete={handleUpdateStatus}
            backgroundColor={
              currentStatus === AppointmentStatus.EN_ROUTE || 
              currentStatus === AppointmentStatus.PRICE_REVIEW ||
              (currentStatus === AppointmentStatus.CHECKING && (uploadedMedia.length === 0 || !initialNotes.trim())) ||
              (currentStatus === AppointmentStatus.REPAIRING && (finalMedia.length === 0 || !finalNotes.trim()))
                ? "#9CA3AF" 
                : "#609CEF"
            }
          />
        </View>
      )}

      {/* Full Screen Image Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <View style={styles.imageViewerOverlay}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.imageViewerCloseButton}
            onPress={closeImageViewer}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Touchable Area to Close */}
          <TouchableOpacity 
            style={styles.imageViewerCloseArea}
            activeOpacity={1}
            onPress={closeImageViewer}
          >
            <View style={styles.imageViewerContainer}>
              <Image
                source={{ uri: selectedImageUri }}
                style={styles.fullSizeImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>

          {/* Image Info & Delete Button */}
          <View style={styles.imageViewerInfo}>
            <Text style={styles.imageViewerText}>
              Ảnh {selectedImageIndex + 1} / {totalImages}
            </Text>
            <TouchableOpacity
              style={styles.imageViewerDeleteButton}
              onPress={() => {
                closeImageViewer();
                // Find media by index
                const mediaToDelete = uploadedMedia[selectedImageIndex];
                if (mediaToDelete) {
                  handleDeletePhoto(mediaToDelete.mediaID);
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="trash" size={20} color="#FFFFFF" />
              <Text style={styles.imageViewerDeleteText}>Xóa ảnh này</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Earnings Modal */}
      <Modal
        visible={showEarningsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEarningsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.modalHeaderGradient}
              >
                <View style={styles.modalHeaderLeft}>
                  <View style={styles.modalIconContainer}>
                    <Ionicons name="wallet-outline" size={32} color="#FFFFFF" />
                  </View>
                  <Text style={styles.modalTitle}>Thực nhận của bạn</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowEarningsModal(false)}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* Content */}
            <View style={styles.modalContent}>
              {(() => {
                const { finalPrice, commission, actualEarnings } = calculateEarnings();
                return (
                  <>
                    {/* Service Price */}
                    <View style={styles.earningsRow}>
                      <View style={styles.earningsIconContainer}>
                        <Ionicons name="pricetag" size={20} color="#3B82F6" />
                      </View>
                      <View style={styles.earningsInfo}>
                        <Text style={styles.earningsLabel}>Giá dịch vụ</Text>
                        <Text style={styles.earningsAmount}>{formatMoney(finalPrice)}</Text>
                      </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.modalDivider} />

                    {/* Platform Fee */}
                    <View style={styles.earningsRow}>
                      <View style={[styles.earningsIconContainer, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                        <Ionicons name="remove-circle" size={20} color="#EF4444" />
                      </View>
                      <View style={styles.earningsInfo}>
                        <Text style={styles.earningsLabel}>Phí nền tảng (15%)</Text>
                        <Text style={[styles.earningsAmount, { color: '#EF4444' }]}>-{formatMoney(commission)}</Text>
                      </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.modalDivider} />

                    {/* Final Earnings */}
                    <View style={styles.finalEarningsContainer}>
                      <LinearGradient
                        colors={['#10B981', '#059669']}
                        style={styles.finalEarningsGradient}
                      >
                        <View style={styles.finalEarningsContent}>
                          <View style={styles.finalEarningsIcon}>
                            <Ionicons name="wallet" size={24} color="#FFFFFF" />
                          </View>
                          <View style={styles.finalEarningsText}>
                            <Text style={styles.finalEarningsLabel}>Số tiền thực nhận</Text>
                            <Text style={styles.finalEarningsAmount}>{formatMoney(actualEarnings)}</Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </View>
                  </>
                );
              })()}
            </View>
          </View>
        </View>
      </Modal>

      {/* Map View Modal - Full screen during EN_ROUTE */}
      {showMapView && serviceRequest && (
        <Modal
          visible={showMapView}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowMapView(false)}
        >
          <TechnicianMapView
            customerAddress={serviceRequest.requestAddress || 'Địa chỉ không xác định'}
            onClose={() => setShowMapView(false)}
            onArrived={() => {
              setShowMapView(false);
              // Trigger swipe to update status to ARRIVED
              handleUpdateStatus();
            }}
          />
        </Modal>
      )}

      {/* Payment Notification Modal */}
      <Modal
        visible={showPaymentNotification}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentNotification(false)}
      >
        <View style={styles.paymentNotificationOverlay}>
          <View style={styles.paymentNotificationContainer}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.paymentNotificationGradient}
            >
              {/* Success Icon */}
              <View style={styles.paymentNotificationIconContainer}>
                <View style={styles.paymentNotificationIconCircle}>
                  <Ionicons name="checkmark-circle" size={64} color="#FFFFFF" />
                </View>
              </View>

              {/* Title */}
              <Text style={styles.paymentNotificationTitle}>
                Thanh toán thành công! 💰
              </Text>

              {/* Amount */}
              <View style={styles.paymentNotificationAmountContainer}>
                <Text style={styles.paymentNotificationAmountLabel}>Số tiền:</Text>
                <Text style={styles.paymentNotificationAmount}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(paymentAmount)}
                </Text>
              </View>

              {/* Message */}
              <Text style={styles.paymentNotificationMessage}>
                Khách hàng đã hoàn tất thanh toán.{'\n'}
                Đơn hàng này đã được chuyển sang trạng thái hoàn thành.
              </Text>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.paymentNotificationButton}
                onPress={() => setShowPaymentNotification(false)}
              >
                <Text style={styles.paymentNotificationButtonText}>Đã hiểu</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Success Popup Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalContainer}>
            {/* White Background with subtle gradient */}
            <View style={styles.successModalContent}>
              {/* Animated Checkmark */}
              <Animated.View 
                style={[
                  styles.successCheckmarkContainer,
                  checkmarkAnimatedStyle
                ]}
              >
                <View style={styles.successCheckmarkCircle}>
                  <Ionicons name="checkmark" size={48} color="#FFFFFF" />
                </View>
              </Animated.View>

              {/* Success Content */}
              <View style={styles.successContent}>
                <Text style={styles.successModalTitle}>{successTitle}</Text>
                <Text style={styles.successModalMessage}>{successMessage}</Text>
              </View>

              {/* Accent Bar */}
              <View style={styles.successAccentBar} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Modal */}
      <CustomModal
        visible={showModal}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setShowModal(false)}
        onConfirm={modalOnConfirm}
        showCancel={showCancelButton}
        confirmText="OK"
        cancelText="Hủy"
        autoClose={modalAutoClose}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    ...STANDARD_HEADER_STYLE,
  },
  headerBackButton: {
    ...STANDARD_BACK_BUTTON_STYLE,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 240, // Space for sticky SwipeButton
  },
  statusSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  required: {
    color: '#EF4444',
  },
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textInput: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    minHeight: 24,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  quoteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quoteHeader: {
    marginBottom: 12,
  },
  quoteTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  quoteTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quoteAmount: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  quoteNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionSection: {
    marginBottom: 24,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  primaryActionButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 16,
  },
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 12,
  },
  primaryActionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  updateSection: {
    marginBottom: 32,
  },
  updateButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  updateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#609CEF',
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusActionSection: {
    marginBottom: 16,
  },
  statusActionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  statusActionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Service Card - Redesigned Styles
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  serviceCardGradient: {
    padding: 20,
    paddingVertical: 24,
  },
  serviceCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  serviceDetailsContainer: {
    flex: 1,
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  servicePriceContainer: {
    padding: 20,
    paddingTop: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  priceLabelText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  servicePriceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  priceTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  priceTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  priceNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  priceNoteText: {
    fontSize: 13,
    color: '#F59E0B',
    flex: 1,
    lineHeight: 18,
  },
  // Old styles kept for compatibility
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  servicePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#609CEF',
  },
  priceTypeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priceTypeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priceNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  customerGradientHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  customerHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  customerHeaderInfo: {
    flex: 1,
  },
  customerHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  customerHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  customerContent: {
    padding: 20,
  },
  customerNameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  customerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  customerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  customerContactInfo: {
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactDetails: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  quickActionsGroup: {
    flexDirection: 'row',
    gap: 8,
    width: 80,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  quickCallButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickMapButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  imagesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  imagesScrollView: {
    marginVertical: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    gap: 12,
  },
  imageWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  attachedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageNumberBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  imagesFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingTop: 12, 
    paddingBottom: 12, 
  },
  imagesFooterText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  cardContent: {
    paddingLeft: 32,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 2,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  customerPhoneSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  customerPhoneText: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
  },
  customerAddressSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
  },
  addressTextContainer: {
    flex: 1,
  },
  customerAddressText: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
    lineHeight: 20,
  },
  addressNoteText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 18,
  },
  customerContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  appointmentHour: {
    fontSize: 16,
    fontWeight: '600',
    color: '#609CEF',
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  // Swipe Button styles
  swipeSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 0,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20, // Safe area for iOS
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  enRouteHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    gap: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  enRouteHintText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
    lineHeight: 20,
  },
  swipeWrapper: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  swipeContainer: {
    width: '100%',
    height: 68,
    borderRadius: 34,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#609CEF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(96, 156, 239, 0.15)',
    paddingHorizontal: 8,
  },
  swipeTextContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 70,  // Space for knob on the left
    marginRight: 16, // Space for hint icons on the right
    paddingHorizontal: 8,
  },
  swipeText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 18,
  },
  swipeHint: {
    position: 'absolute',
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeKnob: {
    position: 'absolute',
    left: 4,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  swipeKnobGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  swipeInstruction: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 12,
    fontWeight: '500',
  },
  // Enhanced Appointment Styles
  appointmentCardHighlight: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#609CEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  appointmentIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#609CEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  appointmentTitleContainer: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  appointmentSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  appointmentTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  appointmentDateBox: {
    flex: 1,
    alignItems: 'center',
  },
  appointmentDateLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  appointmentDateValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 20,
  },
  appointmentTimeDivider: {
    width: 2,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },
  appointmentTimeBox: {
    flex: 1,
    alignItems: 'center',
  },
  appointmentTimeLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  appointmentTimeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#609CEF',
    textAlign: 'center',
  },
  appointmentAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  appointmentAlertText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
  },
  timelineIndicator: {
    marginLeft: 8,
  },
  // Inline Timeline Styles
  inlineTimelineContainer: {
    backgroundColor: '#F8FAFC',
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  timelineHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  inlineTimelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 12,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
  },
  timelineRight: {
    flex: 1,
    paddingTop: 4,
  },
  timelineStepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineStepDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  timelineTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  currentStepBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  currentStepText: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  // Image Modal Styles
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCounter: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  imageModalCounterText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  imageModalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  imageModalImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  imageModalNavButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  imageModalPrevButton: {
    left: 20,
  },
  imageModalNextButton: {
    right: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalHeader: {
    overflow: 'hidden',
  },
  modalHeaderGradient: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 16,
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginLeft: 2,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flexShrink: 0,
  },
  modalContent: {
    padding: 28,
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 4,
  },
  earningsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  earningsInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 17,
    color: '#374151',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  earningsAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.3,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
    marginHorizontal: 4,
  },
  finalEarningsContainer: {
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  finalEarningsGradient: {
    padding: 24,
  },
  finalEarningsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalEarningsIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  finalEarningsText: {
    flex: 1,
  },
  finalEarningsLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 6,
    fontWeight: '600',
    opacity: 0.95,
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  finalEarningsAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 12,
    gap: 16,
  },
  modalSecondaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.2,
  },
  modalPrimaryButton: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalPrimaryButtonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  modalPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  
  // Success Modal Styles - Compact & Clean Design
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successModalContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  successModalContent: {
    backgroundColor: '#FFFFFF',
    paddingTop: 36,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  successCheckmarkContainer: {
    marginBottom: 20,
  },
  successCheckmarkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successContent: {
    alignItems: 'center',
    marginBottom: 4,
  },
  successModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 10,
    textAlign: 'center',
  },
  successModalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  successAccentBar: {
    width: 60,
    height: 4,
    backgroundColor: '#609CEF',
    borderRadius: 2,
    marginTop: 20,
  },
  // Map Section Styles
  mapSection: {
    marginBottom: 24,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  mapButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapButtonContent: {
    flex: 1,
  },
  mapButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  mapButtonDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  // Photo Upload Section Styles (Compact version like book-service.tsx)
  imageHint: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    paddingRight: 8,
    marginBottom: 20,
  },
  imagePreview: {
    width: 80,
    height: 80,
    position: 'relative',
    borderRadius: 12,
    overflow: 'visible',
    backgroundColor: '#F3F4F6',
    marginBottom: 8,
    marginRight: 8,
  },
  imagePreviewTouchable: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'cover',
    overflow: 'hidden',
  },
  imageUploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    fontSize: 10,
    color: '#609CEF',
    fontWeight: '600',
    marginTop: 4,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'white',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#609CEF',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(96, 156, 239, 0.05)',
  },
  addImageText: {
    fontSize: 11,
    color: '#609CEF',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  textAreaContainer: {
    paddingVertical: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  // Image Viewer Modal Styles
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  imageViewerCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  fullSizeImage: {
    width: '100%',
    height: '70%',
    borderRadius: 10,
  },
  imageViewerInfo: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  imageViewerText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  imageViewerDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  imageViewerDeleteText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  // Final Cost Input Styles
  inputIcon: {
    marginRight: 12,
  },
  pricePreview: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  // Payment Notification Modal Styles
  paymentNotificationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentNotificationContainer: {
    width: '85%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  paymentNotificationGradient: {
    padding: 32,
    alignItems: 'center',
  },
  paymentNotificationIconContainer: {
    marginBottom: 24,
  },
  paymentNotificationIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  paymentNotificationTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  paymentNotificationAmountContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  paymentNotificationAmountLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  paymentNotificationAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  paymentNotificationMessage: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  paymentNotificationButton: {
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  paymentNotificationButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  // Photo picker action sheet styles
  photoPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  photoPickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  photoPickerHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  photoPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  photoPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  photoPickerOptionText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  photoPickerDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },
  photoPickerCancelOption: {
    marginTop: 8,
  },
  photoPickerCancelText: {
    color: '#EF4444',
  },
});

// Export protected component
export default withTechnicianAuth(TechnicianOrderTracking, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});