import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  Dimensions, 
  StatusBar,
  Alert,
  RefreshControl
} from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../store/authStore';
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import BottomNavigation from '../../components/BottomNavigation';
import TechnicianHeader from '../../components/TechnicianHeader';
import TechnicianActivityContent from '../../components/TechnicianActivityContent';
import { serviceRequestService } from '../../lib/api/serviceRequests';
import { servicesService } from '../../lib/api/services';
import { serviceDeliveryOffersService } from '../../lib/api/serviceDeliveryOffers';
import { appointmentsService } from '../../lib/api/appointments';
import { techniciansService } from '../../lib/api/technicians';
import type { TechnicianProfile, TechnicianReview } from '../../types/api';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  iconBg: string;
}

function StatCard({ icon, title, subtitle, iconBg }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={32} color="white" />
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );
}

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  iconBg: string;
  onPress?: () => void;
}

interface ReviewProps {
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  avatar?: string;
}

interface ActiveOrderProps {
  orderId: string;
  customerName: string;
  service: string;
  status: 'on_the_way' | 'arrived' | 'repairing' | 'price_review' | 'repaired';
  address: string;
  estimatedTime: string;
  priority: 'high' | 'medium' | 'low';
  customerPhone?: string;
  offerId?: string; // Required for navigation to tracking page
}

function QuickAction({ icon, title, subtitle, iconBg, onPress }: QuickActionProps) {
  return (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.quickActionIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={28} color="white" />
      </View>
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

function ActiveOrderCard({ orderId, customerName, service, status, address, estimatedTime, priority, customerPhone, offerId }: ActiveOrderProps) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'on_the_way':
        return { text: 'Đang di chuyển', color: '#609CEF', icon: 'car-outline', bgColor: 'rgba(96, 156, 239, 0.1)' };
      case 'arrived':
        return { text: 'Đã đến nơi', color: '#609CEF', icon: 'location-outline', bgColor: 'rgba(96, 156, 239, 0.1)' };
      case 'repairing':
        return { text: 'Đang sửa chữa', color: '#609CEF', icon: 'build-outline', bgColor: 'rgba(96, 156, 239, 0.1)' };
      case 'price_review':
        return { text: 'Chờ xác nhận giá', color: '#609CEF', icon: 'cash-outline', bgColor: 'rgba(96, 156, 239, 0.1)' };
      case 'repaired':
        return { text: 'Chờ thanh toán', color: '#609CEF', icon: 'wallet-outline', bgColor: 'rgba(96, 156, 239, 0.1)' };
      default:
        return { text: 'Chưa xác định', color: '#609CEF', icon: 'help-circle-outline', bgColor: 'rgba(96, 156, 239, 0.1)' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#609CEF';
      case 'medium':
        return '#609CEF';
      case 'low':
        return '#609CEF';
      default:
        return '#609CEF';
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <TouchableOpacity 
      style={styles.compactOrderCard}
      onPress={() => {
        if (__DEV__) {
          console.log('🔍 [Dashboard] Navigating to tracking:', {
            serviceRequestId: orderId,
            offerId: offerId || 'undefined'
          });
        }
        
        // Navigate with available params (offerId is optional)
        router.push({
          pathname: '/technician/technician-order-tracking',
          params: { 
            serviceRequestId: orderId,
            ...(offerId && { offerId: offerId })
          }
        });
      }}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#FFFFFF', '#FAFBFF']}
        style={styles.compactCardGradient}
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusInfo.bgColor }]}>
          <View style={styles.statusContent}>
            <Ionicons name={statusInfo.icon as any} size={18} color={statusInfo.color} />
            <Text style={[styles.statusBannerText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
          </View>
          <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(priority) }]} />
        </View>

        {/* Customer & Order Info */}
        <View style={styles.compactHeader}>
          <View style={styles.compactCustomer}>
            <View style={[styles.compactAvatar, { backgroundColor: statusInfo.color }]}>
              <Text style={styles.compactInitials}>
                {customerName.split(' ').map(word => word.charAt(0)).join('').toUpperCase()}
              </Text>
            </View>
            <View style={styles.compactCustomerInfo}>
              <Text style={styles.compactCustomerName} numberOfLines={1}>{customerName}</Text>
              <Text style={styles.compactOrderId}>#{orderId.split('-').pop()}</Text>
            </View>
          </View>
          
          {customerPhone && (
            <TouchableOpacity 
              style={styles.compactCallButton}
              onPress={() => console.log(`Calling ${customerPhone}`)}
            >
              <Ionicons name="call" size={18} color={statusInfo.color} />
            </TouchableOpacity>
          )}
        </View>

        {/* Service Info */}
        <View style={styles.compactService}>
          <Text style={styles.compactServiceText} numberOfLines={2}>{service}</Text>
        </View>

        {/* Location & Time */}
        <View style={styles.compactDetails}>
          <View style={styles.compactDetailRow}>
            <Ionicons name="location" size={14} color="#6B7280" />
            <Text style={styles.compactDetailText} numberOfLines={1}>
              {address.length > 25 ? address.substring(0, 25) + '...' : address}
            </Text>
          </View>
          <View style={styles.compactDetailRow}>
            <Ionicons name="time" size={14} color="#6B7280" />
            <Text style={styles.compactDetailText}>{estimatedTime}</Text>
          </View>
        </View>

        {/* Quick Action */}
        <TouchableOpacity 
          style={[styles.quickActionButton, { backgroundColor: statusInfo.color }]}
          onPress={() => {
            if (__DEV__) {
              console.log('🔍 [Dashboard] Button - Navigating to tracking:', {
                serviceRequestId: orderId,
                offerId: offerId || 'undefined'
              });
            }
            
            // Navigate with available params (offerId is optional)
            router.push({
              pathname: '/technician/technician-order-tracking',
              params: { 
                serviceRequestId: orderId,
                ...(offerId && { offerId: offerId })
              }
            });
          }}
        >
          <Text style={styles.quickActionText}>Xem chi tiết</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function ReviewCard({ customerName, rating, comment, date }: ReviewProps) {
  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? "star" : "star-outline"}
        size={16}
        color={index < rating ? "#FFB800" : "#E5E7EB"}
      />
    ));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase();
  };

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarText}>{getInitials(customerName)}</Text>
        </View>
        <View style={styles.reviewInfo}>
          <Text style={styles.reviewName}>{customerName}</Text>
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars()}
            </View>
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.reviewDate}>{date}</Text>
      </View>
      <Text style={styles.reviewComment}>{comment}</Text>
    </View>
  );
}

interface DashboardContentProps {
  currentTime: Date;
  formatTime: () => string;
  formatDate: () => string;
}

const { width } = Dimensions.get('window');

type TabType = 'dashboard' | 'activity';

function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const params = useLocalSearchParams();
  
  // Tab state - support URL params
  const [activeTab, setActiveTab] = useState<TabType>(
    (params.tab as TabType) || 'dashboard'
  );
  
  // State for time
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // ALL OTHER STATE - Must be declared before any conditional returns
  const [isOnline, setIsOnline] = useState(true);
  const [technicianProfile, setTechnicianProfile] = useState<TechnicianProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [todayStats, setTodayStats] = useState({
    jobsCompleted: 0,
    averageRating: 0,
    todayEarnings: 0,
    pendingJobs: 0,
    totalJobs: 0
  });

  const [activeOrders, setActiveOrders] = useState<ActiveOrderProps[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Auto-refresh interval for orders
  const REFRESH_INTERVAL = 5000; // 5 seconds
  
  // Check authentication and verification status
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/technician/login');
      return;
    }

    // Check if user has verified their email  
    // isVerify: false means user never verified their email after registration
    if (user?.isVerify === false && user?.email) {
      router.replace(`/technician/verify?email=${encodeURIComponent(user.email)}`);
      return;
    }
  }, [isAuthenticated, user?.isVerify, user?.email]);
  
  // Load technician profile
  const loadTechnicianProfile = async () => {
    try {
      if (!user?.id) {
        if (__DEV__) console.warn('⚠️ No user ID available for profile fetch');
        return;
      }

      setLoadingProfile(true);
      const profile = await techniciansService.getTechnicianProfile(user.id);
      setTechnicianProfile(profile);
      
      // Update stats from profile
      setTodayStats(prev => ({
        ...prev,
        averageRating: profile.averageRating,
        // Keep other stats from service requests calculation
      }));
      
      if (__DEV__) {
        console.log('✅ Technician profile loaded:', {
          name: `${profile.firstName} ${profile.lastName}`,
          rating: profile.averageRating,
          totalReviews: profile.totalReviews,
        });
      }
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to load technician profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Load profile on mount
  useEffect(() => {
    if (user?.id && isAuthenticated) {
      loadTechnicianProfile();
    }
  }, [user?.id, isAuthenticated]);
  
  // Load active orders from API (OPTIMIZED)
  const loadActiveOrders = async (silent = false) => {
    try {
      if (!silent) {
        setLoadingOrders(true);
      }
      
      // Get service requests for technician (automatically filtered by their offers)
      const serviceRequests = await serviceRequestService.getUserServiceRequests();
      
      // Pre-fetch all data in parallel (OPTIMIZATION: Batch API calls)
      const serviceIds = [...new Set(serviceRequests.map(req => req.serviceId))];
      const requestIds = serviceRequests.map(req => req.requestID);
      
      // Fetch all services, offers, and appointments in parallel
      const [servicesResults, offersResults, appointmentsResults] = await Promise.all([
        // Batch fetch all unique services
        Promise.allSettled(serviceIds.map(id => servicesService.getServiceById(id))),
        // Batch fetch all offers
        Promise.allSettled(requestIds.map(id => serviceDeliveryOffersService.getAllOffers(id))),
        // Batch fetch all appointments
        Promise.allSettled(requestIds.map(id => appointmentsService.getAppointmentsByServiceRequest(id)))
      ]);
      
      // Create lookup maps for O(1) access
      const servicesMap = new Map<string, any>();
      serviceIds.forEach((id, index) => {
        const result = servicesResults[index];
        if (result.status === 'fulfilled') {
          servicesMap.set(id, result.value);
        }
      });
      
      const offersMap = new Map<string, any[]>();
      requestIds.forEach((id, index) => {
        const result = offersResults[index];
        if (result.status === 'fulfilled') {
          offersMap.set(id, result.value || []);
        }
      });
      
      const appointmentsMap = new Map<string, any[]>();
      requestIds.forEach((id, index) => {
        const result = appointmentsResults[index];
        if (result.status === 'fulfilled') {
          appointmentsMap.set(id, result.value || []);
        }
      });
      
      // Convert service requests to active orders format using cached data
      const orders: ActiveOrderProps[] = serviceRequests.map((request) => {
        let serviceName = 'Dịch vụ'; // Default fallback
        let customerName = request.fullName || 'Khách hàng';
        let customerPhone = request.phoneNumber || undefined;
        let actualStatus = request.status;
        let address = request.requestAddress || 'Chưa có địa chỉ';
        let estimatedTime = 'Chưa xác định';
        let offerId: string | undefined = undefined;
        
        // 1. Get service details from cache
        const service = servicesMap.get(request.serviceId);
        if (service) {
          serviceName = service.serviceName || service.description || 'Dịch vụ';
        } else if (request.serviceDescription) {
          serviceName = request.serviceDescription;
        }
        
        // 2. Get offer details from cache
        const offers = offersMap.get(request.requestID) || [];
        if (offers.length > 0) {
          const acceptedOffer = offers.find(offer => offer.status === 'ACCEPTED');
          offerId = acceptedOffer?.offerId || offers[offers.length - 1]?.offerId;
        }
        
        // 3. Get appointment details from cache
        const appointments = appointmentsMap.get(request.requestID) || [];
        if (appointments.length > 0) {
          const appointment = appointments[appointments.length - 1];
          actualStatus = appointment.status;
          
          // Format time from appointment
          if (appointment.scheduledDate) {
            const startTime = new Date(appointment.scheduledDate);
            const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Add 1 hour
            estimatedTime = `${startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
          }
        }
        
        // 4. HIGHEST PRIORITY: Check if serviceRequest is COMPLETED (payment done)
        if (request.status === 'COMPLETED') {
          actualStatus = 'COMPLETED';
        }
        
        // Map API status to UI status
        const mapStatus = (status: string): ActiveOrderProps['status'] => {
          const normalized = status?.toUpperCase() || '';
          switch (normalized) {
            case 'SCHEDULED':
            case 'EN_ROUTE':
              return 'on_the_way';
            case 'ARRIVED':
              return 'arrived';
            case 'CHECKING':
            case 'REPAIRING':
              return 'repairing';
            case 'PRICE_REVIEW':
              return 'price_review';
            case 'REPAIRED':
              return 'repaired';
            default:
              return 'on_the_way';
          }
        };
        
        return {
          orderId: request.requestID,
          customerName,
          service: serviceName,
          status: mapStatus(actualStatus),
          address,
          estimatedTime,
          priority: 'medium' as const,
          customerPhone,
          offerId,
          actualApiStatus: actualStatus,
        };
      });
      
      // Filter to show only ACTIVE orders
      // Hide: COMPLETED (paid), CANCELLED, DISPUTE
      // Show: SCHEDULED, EN_ROUTE, ARRIVED, CHECKING, REPAIRING, PRICE_REVIEW, REPAIRED (chờ thanh toán)
      const activeOnly = orders.filter(order => {
        const status = (order as any).actualApiStatus?.toUpperCase() || '';
        const shouldHide = ['COMPLETED', 'CANCELLED', 'DISPUTE'].includes(status);
        return !shouldHide;
      });
      
      setActiveOrders(activeOnly);
    } catch (error: any) {
      if (__DEV__) console.error('Error loading active orders:', error);
      setActiveOrders([]);
    } finally {
      if (!silent) {
        setLoadingOrders(false);
      }
    }
  };
  
  // Load orders on mount and set up auto-refresh
  useEffect(() => {
    if (isAuthenticated && user?.isVerify !== false) {
      loadActiveOrders();
      
      // Set up auto-refresh interval
      const interval = setInterval(() => {
        loadActiveOrders(true); // Silent refresh
      }, REFRESH_INTERVAL);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user?.isVerify]);
  
  // Update time every second  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, []);
  
  // Format time function
  const formatTime = () => {
    return currentTime.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Format date function
  const formatDate = () => {
    return currentTime.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };
  
  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Reload all data in parallel
      await Promise.all([
        loadTechnicianProfile(),
        loadActiveOrders(true)
      ]);
    } catch (error) {
      if (__DEV__) console.error('❌ Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [user?.id]);
  
  // Handle tab press - instant switch, no animation
  const handleTabPress = useCallback((tabId: string) => {
    const newTab: TabType = tabId === 'home' ? 'dashboard' : 'activity';
    
    // Don't switch if already on this tab
    if (newTab === activeTab) return;

    // Update state immediately for instant response
    setActiveTab(newTab);
  }, [activeTab]);
  
  // Handle center button press
  const handleCenterButtonPress = () => {
    // Logo pressed - could add navigation to main menu
  };
  
  // Handle profile press
  const handleSearchPress = () => {
    router.push('./profile');
  };
  
  // Handle notification press
  const handleNotificationPress = () => {
    // Navigation to notifications page
  };

  const handleNewOrderPress = () => {
    router.push('/technician/orders');
  };

  const handleTrackOrderPress = () => {
    router.push({
      pathname: '/technician/order-tracking',
      params: { orderId: 'ORD-001' }
    });
  };

  const handleQuickActionPress = (action: string) => {
console.log(`${action} pressed`);

  switch (action) {
    case 'Đơn hàng':
      router.push('/technician/orders');
      break;
    case 'Thông tin':
      router.push('/technician/profile'); // ✅ giữ lại từ repairmanProfile
      break;
    case 'Cài đặt':
      // TODO: Navigate to settings page
      break;
    case 'Thống kê':
      router.push('/technician/statistics');
      break;
    default:
      // Default action handler
      break;
  }
};

// ✅ giữ lại các hàm tiện ích từ main
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

const getCompletionRate = () => {
  return Math.round((todayStats.jobsCompleted / todayStats.totalJobs) * 100);
};

const toggleOnlineStatus = () => {
  setIsOnline(!isOnline);
};

// Format review date to friendly format
const formatReviewDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Hôm nay';
    } else if (diffDays === 1) {
      return 'Hôm qua';
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      // Format as DD/MM/YYYY
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (error) {
    return dateString;
  }
};

  // Memoize header title to prevent unnecessary re-renders
  const headerTitle = useMemo(() => 
    activeTab === 'dashboard' ? 'Trang chủ' : 'Hoạt động',
    [activeTab]
  );

  // Memoize bottom nav active tab
  const bottomNavActiveTab = useMemo(() => 
    activeTab === 'dashboard' ? 'home' : 'activity',
    [activeTab]
  );

  // CRITICAL: Render empty view during logout transition to prevent hooks errors
  // This prevents the component from trying to render with stale data
  if (!isAuthenticated || user?.isVerify === false) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#609CEF" />
        <Stack.Screen 
          options={{ 
            headerShown: false,
            gestureEnabled: false, // Disable swipe back to prevent returning to login
          }} 
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#609CEF" />
      {/* ✅ CRITICAL: Disable swipe back gesture to prevent returning to login */}
      <Stack.Screen 
        options={{ 
          headerShown: false,
          gestureEnabled: false, // Prevent swipe back to login screen
          animation: 'none', // No animation to prevent visual glitches
        }} 
      />

      {/* Header */}
      <TechnicianHeader
        title={headerTitle}
        onSearchPress={handleSearchPress}
        onAvatarPress={handleNotificationPress}
        notificationCount={2}
      />

      {/* Conditional Rendering - Only render active tab */}
      {activeTab === 'dashboard' && (
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#609CEF"
              colors={['#609CEF']}
            />
          }
        >
        {/* Enhanced Greeting Section with Real-time Clock */}
      <View style={styles.greetingSection}>
        <LinearGradient
          colors={['#609CEF', '#4F8BE8', '#3D7CE0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.greetingGradient}
        >
          {/* Time & Status Header */}
          <View style={styles.timeStatusHeader}>
            <View style={styles.timeContainer}>
              <Text style={styles.currentTime}>{formatTime()}</Text>
              <Text style={styles.currentDate}>{formatDate()}</Text>
            </View>
            <TouchableOpacity 
              style={styles.statusToggle}
              onPress={toggleOnlineStatus}
              activeOpacity={0.8}
            >
              <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#10B981' : '#EF4444' }]}>
                <View style={styles.statusPulse} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Welcome Content */}
          <View style={styles.welcomeContent}>
            <View style={styles.welcomeMain}>
              <Text style={styles.greetingTitle}>
                Chào, {user?.fullName || 'Thợ'}!
              </Text>
              <Text style={styles.motivationText}>
                {isOnline ? 'Sẵn sàng nhận việc mới hôm nay!' : 'Nghỉ ngơi và nạp lại năng lượng nhé!'}
              </Text>
            </View>
            
            {/* Performance Badge */}
            <View style={styles.performanceBadge}>
              <View style={styles.badgeIcon}>
                <Ionicons name="star" size={16} color="#FFB800" />
              </View>
              <Text style={styles.badgeText}>{todayStats.averageRating}/5.0</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Active Orders Section */}
      <View style={styles.activeOrdersSection}>
        <View style={styles.sectionHeaderWithPadding}>
          <Ionicons name="briefcase" size={22} color="#609CEF" />
          <Text style={styles.sectionTitle}>Đơn đang thực hiện ({activeOrders.length})</Text>
          <View style={styles.scrollHint}>
            <Text style={styles.scrollHintText}>Vuốt →</Text>
          </View>
        </View>
        
        {loadingOrders ? (
          <View style={styles.emptyOrdersContainerWithPadding}>
            <View style={styles.emptyOrdersIcon}>
              <Ionicons name="hourglass-outline" size={48} color="#609CEF" />
            </View>
            <Text style={styles.emptyOrdersTitle}>Đang tải...</Text>
            <Text style={styles.emptyOrdersSubtitle}>
              Vui lòng đợi trong giây lát
            </Text>
          </View>
        ) : activeOrders.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.ordersScrollView}
            contentContainerStyle={styles.horizontalOrdersContainer}
          >
            {activeOrders.map((order) => (
              <ActiveOrderCard
                key={order.orderId}
                orderId={order.orderId}
                customerName={order.customerName}
                service={order.service}
                status={order.status}
                address={order.address}
                estimatedTime={order.estimatedTime}
                priority={order.priority}
                customerPhone={order.customerPhone}
                offerId={order.offerId}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyOrdersContainerWithPadding}>
            <View style={styles.emptyOrdersIcon}>
              <Ionicons name="briefcase-outline" size={48} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyOrdersTitle}>Không có đơn hàng nào</Text>
            <Text style={styles.emptyOrdersSubtitle}>
              Khi có đơn hàng mới, chúng sẽ hiển thị ở đây
            </Text>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => loadActiveOrders()}
            >
              <Ionicons name="refresh" size={20} color="#609CEF" />
              <Text style={styles.refreshButtonText}>Làm mới</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Enhanced Quick Actions */}
      <View style={styles.quickActionsSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="grid-outline" size={22} color="#609CEF" />
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        </View>
        
        <View style={styles.quickActionsGrid}>
          <QuickAction
            icon="receipt-outline"
            title="Đơn hàng"
            subtitle="Quản lý đơn hàng"
            iconBg="#609CEF"
            onPress={() => handleQuickActionPress('Đơn hàng')}
          />
          <QuickAction
            icon="person-outline"
            title="Thông tin"
            subtitle="Hồ sơ cá nhân"
            iconBg="#8B5CF6"
            onPress={() => handleQuickActionPress('Thông tin')}
          />
          <QuickAction
            icon="settings-outline"
            title="Cài đặt"
            subtitle="Tùy chỉnh"
            iconBg="#F59E0B"
            onPress={() => handleQuickActionPress('Cài đặt')}
          />
          <QuickAction
            icon="bar-chart-outline"
            title="Thống kê"
            subtitle="Báo cáo doanh thu"
            iconBg="#10B981"
            onPress={() => handleQuickActionPress('Thống kê')}
          />
        </View>
      </View>

      {/* Professional Information Section - Data from Profile API */}
      <View style={styles.performanceSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="briefcase-outline" size={22} color="#609CEF" />
          <Text style={styles.sectionTitle}>Thông tin nghề nghiệp</Text>
          {technicianProfile && (
            <View style={styles.statusBadge}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: technicianProfile.availabilityStatus === 'AVAILABLE' ? '#10B981' : '#F59E0B' }
              ]} />
              <Text style={styles.statusText}>
                {technicianProfile.availabilityStatus === 'AVAILABLE' ? 'Sẵn sàng' : 
                 technicianProfile.availabilityStatus === 'BUSY' ? 'Bận' : 'Offline'}
              </Text>
            </View>
          )}
        </View>

        {loadingProfile ? (
          <View style={styles.loadingProfileContainer}>
            <Ionicons name="hourglass-outline" size={32} color="#CBD5E1" />
            <Text style={styles.loadingProfileText}>Đang tải thông tin...</Text>
          </View>
        ) : technicianProfile ? (
          <>
            {/* Professional Stats Grid */}
            <View style={styles.enhancedStatsGrid}>
              <View style={styles.statCardLarge}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.statGradient}
                >
                  <View style={styles.statHeader}>
                    <Ionicons name="cash" size={28} color="#FFFFFF" />
                    <View style={styles.statTrend}>
                      <Ionicons name="trending-up" size={16} color="#FFFFFF" />
                    </View>
                  </View>
                  <Text style={styles.statMainValue}>{formatMoney(technicianProfile.hourlyRate)}</Text>
                  <Text style={styles.statLabel}>Giá mỗi giờ</Text>
                </LinearGradient>
              </View>

              <View style={styles.statsColumn}>
                <View style={styles.statCardSmall}>
                  <View style={[styles.statIconSmall, { backgroundColor: '#609CEF' }]}>
                    <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.statContentSmall}>
                    <Text style={styles.statValueSmall}>{technicianProfile.yearsOfExperience}</Text>
                    <Text style={styles.statLabelSmall}>Năm KN</Text>
                  </View>
                </View>

                <View style={styles.statCardSmall}>
                  <View style={[styles.statIconSmall, { backgroundColor: '#FFB800' }]}>
                    <Ionicons name="star" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.statContentSmall}>
                    <Text style={styles.statValueSmall}>{technicianProfile.averageRating.toFixed(1)}</Text>
                    <Text style={styles.statLabelSmall}>Đánh giá TB</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Certification Badge */}
            {technicianProfile.certification && (
              <View style={styles.certificationContainer}>
                <View style={styles.certificationBadge}>
                  <Ionicons name="ribbon" size={20} color="#8B5CF6" />
                  <Text style={styles.certificationText}>{technicianProfile.certification}</Text>
                </View>
              </View>
            )}

            {/* Skills Display */}
            {technicianProfile.skills && technicianProfile.skills.length > 0 && (
              <View style={styles.skillsContainer}>
                <Text style={styles.skillsTitle}>Kỹ năng chuyên môn</Text>
                <View style={styles.skillsGrid}>
                  {technicianProfile.skills.map((skill, index) => (
                    <View key={index} style={styles.skillChip}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.skillText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyProfileContainer}>
            <Ionicons name="information-circle-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyProfileText}>Không thể tải thông tin</Text>
          </View>
        )}
      </View>

      {/* Enhanced Reviews Section */}
      <View style={styles.reviewsSection}>
        <View style={styles.reviewsSectionHeader}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star" size={22} color="#FFB800" />
            <Text style={styles.sectionTitle}>Đánh giá gần đây</Text>
            {technicianProfile && technicianProfile.totalReviews > 0 && (
              <View style={styles.reviewCountBadge}>
                <Text style={styles.reviewCountText}>
                  {technicianProfile.totalReviews} đánh giá
                </Text>
              </View>
            )}
          </View>
          {technicianProfile && technicianProfile.totalReviews > 3 && (
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>Xem tất cả</Text>
              <Ionicons name="chevron-forward" size={16} color="#609CEF" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.reviewsList}>
          {loadingProfile ? (
            <View style={styles.loadingReviewsContainer}>
              <Ionicons name="hourglass-outline" size={32} color="#CBD5E1" />
              <Text style={styles.loadingReviewsText}>Đang tải đánh giá...</Text>
            </View>
          ) : technicianProfile && technicianProfile.latestReviews.length > 0 ? (
            // Hiển thị tối đa 3 đánh giá đầu tiên
            technicianProfile.latestReviews.slice(0, 3).map((review) => (
              <ReviewCard
                key={review.id}
                customerName={review.customerName}
                rating={review.rating}
                comment={review.comment}
                date={formatReviewDate(review.createdAt)}
              />
            ))
          ) : (
            <View style={styles.emptyReviewsContainer}>
              <Ionicons name="star-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyReviewsText}>Chưa có đánh giá nào</Text>
              <Text style={styles.emptyReviewsSubtext}>
                Đánh giá từ khách hàng sẽ hiển thị ở đây
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Enhanced Action Buttons */}
      <View style={styles.quickActionSection}>
        <View style={styles.sectionHeader}>
          <Ionicons name="rocket" size={22} color="#F59E0B" />
          <Text style={styles.sectionTitle}>Hành động quan trọng</Text>
        </View>
        
        <View style={styles.enhancedActionButtons}>
          <TouchableOpacity 
            style={styles.primaryActionButton} 
            onPress={handleNewOrderPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <View style={styles.actionButtonContent}>
                <View style={styles.actionButtonIcon}>
                  <Ionicons name="list" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.actionButtonText}>
                  <Text style={styles.actionButtonTitle}>Xem đơn hàng</Text>
                  <Text style={styles.actionButtonSubtitle}>Quản lý công việc</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.8)" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
          
      
        </View>
      </View>

      {/* Bottom Spacing for Navigation */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
      )}

    {/* Activity Content - Only render when active */}
    {activeTab === 'activity' && (
      <View style={styles.scrollContainer}>
        <TechnicianActivityContent />
      </View>
    )}

    {/* Bottom Navigation */}
    <BottomNavigation 
      activeTab={bottomNavActiveTab}
      onTabPress={handleTabPress}
      onLogoPress={handleCenterButtonPress}
    />
  </View>
  );
}

// Include all the styles from the original dashboard
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flex: 1,
  },
  greetingSection: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  greetingGradient: {
    padding: 24,
    borderRadius: 20,
  },
  timeStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  timeContainer: {
    flex: 1,
  },
  currentTime: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  currentDate: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    textTransform: 'capitalize',
  },
  statusToggle: {
    alignItems: 'flex-end',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 6,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPulse: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    position: 'absolute',
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  welcomeMain: {
    flex: 1,
  },
  performanceBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeIcon: {
    marginRight: 6,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
  },
  quickActionsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: 'white',
    width: '48%',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(96, 156, 239, 0.08)',
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickActionContent: {
    alignItems: 'center',
    width: '100%',
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  performanceSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  completionBadge: {
    backgroundColor: '#609CEF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  completionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  enhancedStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCardLarge: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  statGradient: {
    padding: 20,
    borderRadius: 16,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTrend: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 4,
  },
  statMainValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsColumn: {
    flex: 1,
    gap: 12,
  },
  statCardSmall: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  statIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContentSmall: {
    flex: 1,
  },
  statValueSmall: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabelSmall: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  loadingProfileContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingProfileText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  emptyProfileContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyProfileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  certificationContainer: {
    marginTop: 16,
  },
  certificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  certificationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
    flex: 1,
  },
  skillsContainer: {
    marginTop: 16,
  },
  skillsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  skillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  statCard: {
    backgroundColor: 'white',
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 14,
  },
  quickActionSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  enhancedActionButtons: {
    gap: 16,
  },
  primaryActionButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  secondaryActionButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButtonGradient: {
    borderRadius: 20,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  actionButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionButtonText: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionButtonSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Active Orders Styles - Aligned with Quick Actions
  activeOrdersSection: {
    marginTop: 24,
  },
  sectionHeaderWithPadding: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  ordersScrollView: {
    paddingLeft: 16,
  },
  horizontalOrdersContainer: {
    paddingRight: 16,
  },
  compactOrderCard: {
    width: width * 0.8,
    marginRight: 16,
    borderRadius: 20,
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  compactCardGradient: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(96, 156, 239, 0.08)',
  },
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBannerText: {
    fontSize: 14,
    fontWeight: '700',
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  compactCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  compactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  compactInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  compactCustomerInfo: {
    flex: 1,
  },
  compactCustomerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  compactOrderId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  compactCallButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(96, 156, 239, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactService: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  compactServiceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 20,
  },
  compactDetails: {
    paddingHorizontal: 16,
    gap: 6,
    paddingBottom: 16,
  },
  compactDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactDetailText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    flex: 1,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollHint: {
    backgroundColor: 'rgba(96, 156, 239, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scrollHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#609CEF',
  },

  // Empty Orders Styles
  emptyOrdersContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyOrdersContainerWithPadding: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 36, // Same as quick actions (16 + 20)
  },
  emptyOrdersIcon: {
    marginBottom: 16,
  },
  emptyOrdersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyOrdersSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(96, 156, 239, 0.1)',
    gap: 6,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#609CEF',
  },
  reviewsSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  reviewsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  reviewCountBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
    borderRadius: 8,
  },
  reviewCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFB800',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(96, 156, 239, 0.1)',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#609CEF',
    marginRight: 4,
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#609CEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reviewAvatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  reviewInfo: {
    flex: 1,
  },
  reviewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  reviewDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  reviewComment: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  loadingReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  loadingReviewsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  emptyReviewsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyReviewsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyReviewsSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
  activityPlaceholder: {
    padding: 16,
  },
});

// Export protected component
export default withTechnicianAuth(Dashboard, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});