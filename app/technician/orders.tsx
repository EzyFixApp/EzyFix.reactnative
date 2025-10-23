import React, { useState, useEffect } from 'react';
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
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';
import { STANDARD_HEADER_STYLE, HEADER_CONSTANTS } from '../../constants/HeaderConstants';
import SwipeToActivate from '../../components/SwipeToActivate';
import { useLocation } from '../../hooks/useLocation';
import { serviceRequestService, servicesService, mediaService } from '../../lib/api';
import { locationService } from '../../lib/api/location';
import { orderCache } from '../../lib/cache/orderCache';
import { serviceDeliveryOffersService } from '../../lib/api/serviceDeliveryOffers';

interface OrderItem {
  id: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  address: string;
  description: string;
  images?: string[];
  status: 'pending' | 'accepted' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  priceRange: string;
  priceLabel?: string; // Label for price: "Giá đã chốt" or "Giá dự kiến"
  priority: 'normal' | 'urgent' | 'emergency';
  distance: string;
  estimatedTime: string;
  appointmentDate: string;
  appointmentTime: string;
  addressNote?: string;
  paymentMethod?: 'prepaid' | 'cash' | 'card';
}

const STORAGE_KEY_ACTIVATED = '@technician_orders_activated';
const DEFAULT_RADIUS = 10; // 10km

// Cache for service names to avoid repeated API calls
const serviceNameCache: { [key: string]: string } = {};
// Cache for geocoded coordinates to avoid repeated API calls
const geocodeCache: { [address: string]: { lat: number; lng: number } | null } = {};
// Track failed service fetches to avoid repeated attempts
const failedServiceFetches = new Set<string>();
// Flag to disable service fetch if too many errors
let disableServiceFetch = false;

// Helper function to extract district/ward from full address
const extractDistrictFromAddress = (fullAddress: string): string => {
  if (!fullAddress) return 'TP.HCM';
  
  // Address format: "Vinhomes Grand Park, Thành phố Hồ Chí Minh, Phường Long Bình, 71216"
  // We want: "Phường Long Bình, TP.HCM"
  const parts = fullAddress.split(',').map(p => p.trim());
  
  // Find ward/commune (Phường/Xã)
  const wardPart = parts.find(p => 
    p.startsWith('Phường') || 
    p.startsWith('Xã') || 
    p.startsWith('Thị trấn')
  );
  
  // Find district (Quận/Huyện) - usually before ward
  const districtPart = parts.find(p => 
    p.startsWith('Quận') || 
    p.startsWith('Huyện') ||
    p.startsWith('Thành phố Thủ Đức')
  );
  
  if (wardPart && districtPart) {
    return `${wardPart}, ${districtPart}`;
  } else if (wardPart) {
    return `${wardPart}, TP.HCM`;
  } else if (districtPart) {
    return `${districtPart}, TP.HCM`;
  }
  
  // Fallback: return last 2 parts (usually district and city)
  if (parts.length >= 2) {
    return parts.slice(-2).join(', ').replace('Thành phố Hồ Chí Minh', 'TP.HCM');
  }
  
  return 'TP.HCM';
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
};

// Helper function to format time (returns null if time is 00:00:00 UTC - meaning no specific time set)
const formatTime = (dateString: string): string | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  
  // Check if this is a "date-only" timestamp (00:00:00 UTC)
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  
  if (hours === 0 && minutes === 0 && seconds === 0) {
    return null; // No specific time set
  }
  
  // Format local time (Vietnam timezone will be applied automatically)
  const localHours = date.getHours().toString().padStart(2, '0');
  const localMinutes = date.getMinutes().toString().padStart(2, '0');
  return `${localHours}:${localMinutes}`;
};

// Helper function to mask phone number
const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 4) return phone;
  // "+840787171600" -> "+84***1600"
  const visibleStart = phone.substring(0, 3);
  const visibleEnd = phone.substring(phone.length - 4);
  return `${visibleStart}***${visibleEnd}`;
};

// Haversine formula to calculate distance between two coordinates
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  
  return distance;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Helper function to format price in Vietnamese currency
const formatPrice = (price: number): string => {
  return price.toLocaleString('vi-VN') + 'đ';
};

// Format distance for display
const formatDistance = (distanceInKm: number): string => {
  if (distanceInKm < 1) {
    // Less than 1km, show in meters
    const meters = Math.round(distanceInKm * 1000);
    return `${meters}m`;
  } else {
    // 1km or more, show with 1 decimal
    return `${distanceInKm.toFixed(1)}km`;
  }
};

// Geocode address to get coordinates using Nominatim
const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    // Check cache first
    if (geocodeCache[address] !== undefined) {
      return geocodeCache[address];
    }

    // Use Nominatim to search for the address
    const results = await locationService.searchAddresses(address);
    
    if (results.length > 0) {
      const coords = {
        lat: results[0].latitude,
        lng: results[0].longitude
      };
      // Cache the result
      geocodeCache[address] = coords;
      return coords;
    }
    
    // Cache null result to avoid repeated failed attempts
    geocodeCache[address] = null;
    return null;
  } catch (error) {
    console.error('Geocode error:', error);
    // Cache null result
    geocodeCache[address] = null;
    return null;
  }
};

// Geocode orders sequentially and update distances (respects 1s delay between requests)
const geocodeOrdersSequentially = async (
  orders: OrderItem[], 
  technicianLat: number, 
  technicianLng: number,
  updateCallback: (orderId: string, distance: string) => void
) => {
  for (const order of orders) {
    // Skip if already has distance or if no address
    if (order.distance !== 'Đang tính...' || !order.address) {
      continue;
    }

    try {
      const coords = await geocodeAddress(order.address);
      if (coords) {
        const distanceInKm = calculateDistance(
          technicianLat,
          technicianLng,
          coords.lat,
          coords.lng
        );
        const formattedDistance = formatDistance(distanceInKm);
        updateCallback(order.id, formattedDistance);
      } else {
        updateCallback(order.id, 'N/A');
      }
    } catch (error) {
      console.error(`Error geocoding order ${order.id}:`, error);
      updateCallback(order.id, 'N/A');
    }
  }
};

// Fetch service name from serviceId with caching
const fetchServiceName = async (serviceId: string): Promise<string> => {
  // If service fetch is disabled globally, skip
  if (disableServiceFetch) {
    return 'Dịch vụ sửa chữa';
  }
  
  // Check cache first
  if (serviceNameCache[serviceId]) {
    return serviceNameCache[serviceId];
  }
  
  // Skip if already failed
  if (failedServiceFetches.has(serviceId)) {
    return 'Dịch vụ sửa chữa';
  }
  
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Service fetch timeout')), 3000)
    );
    
    const servicePromise = servicesService.getServiceById(serviceId);
    const service = await Promise.race([servicePromise, timeoutPromise]);
    
    const serviceName = service.serviceName || 'Dịch vụ sửa chữa';
    
    // Cache the result
    serviceNameCache[serviceId] = serviceName;
    
    return serviceName;
  } catch (error) {
    if (__DEV__) console.warn('Failed to fetch service name:', error);
    
    // Mark as failed
    failedServiceFetches.add(serviceId);
    
    // If too many failures, disable service fetch globally
    if (failedServiceFetches.size >= 3) {
      disableServiceFetch = true;
      if (__DEV__) console.warn('⚠️ Too many service fetch failures, disabling service name fetch');
    }
    
    // Fallback to generic name
    return 'Dịch vụ sửa chữa';
  }
};

// Detect service type from description (fallback)
const detectServiceType = (description: string): string => {
  const desc = description.toLowerCase();
  
  if (desc.includes('điều hòa') || desc.includes('máy lạnh') || desc.includes('ac')) {
    return 'Sửa chữa điều hòa';
  } else if (desc.includes('tủ lạnh')) {
    return 'Sửa chữa tủ lạnh';
  } else if (desc.includes('máy giặt')) {
    return 'Sửa chữa máy giặt';
  } else if (desc.includes('điện') || desc.includes('electric')) {
    return 'Sửa chữa điện';
  } else if (desc.includes('nước') || desc.includes('water')) {
    return 'Sửa chữa nước';
  } else if (desc.includes('ống') || desc.includes('pipe')) {
    return 'Sửa ống nước';
  }
  
  return 'Dịch vụ sửa chữa';
};

// Transform API response to OrderItem (async to fetch service name and media)
const transformApiResponseToOrderItem = async (
  apiResponse: any, 
  technicianLat: number, 
  technicianLng: number
): Promise<OrderItem> => {
  // Debug log API response
  if (__DEV__) {
    console.log('📦 Transforming API response:', {
      requestID: apiResponse.requestID,
      requestedDate: apiResponse.requestedDate,
      expectedStartTime: apiResponse.expectedStartTime,
      mediaUrls: apiResponse.mediaUrls,
      addressNote: apiResponse.addressNote
    });
  }

  const description = apiResponse.serviceDescription || 'Không có mô tả';
  
  // Fetch service name from serviceId, with multiple fallbacks
  let serviceName = 'Dịch vụ sửa chữa';
  try {
    if (apiResponse.serviceId && !disableServiceFetch) {
      serviceName = await fetchServiceName(apiResponse.serviceId);
    } else {
      serviceName = detectServiceType(description);
    }
  } catch (error) {
    // Final fallback: use description detection
    if (__DEV__) console.warn('Service name fetch failed, using description detection');
    serviceName = detectServiceType(description);
  }
  
  // Fetch media from API by requestID
  let mediaUrls: string[] = [];
  try {
    const mediaList = await mediaService.getMediaByRequest(apiResponse.requestID);
    if (mediaList && mediaList.length > 0) {
      mediaUrls = mediaList.map(media => media.fileURL);
      if (__DEV__) console.log(`📸 Fetched ${mediaUrls.length} media files for request ${apiResponse.requestID}`);
    }
  } catch (error) {
    if (__DEV__) console.warn('Failed to fetch media, using fallback:', error);
    // Fallback to mediaUrls from API response if available
    if (apiResponse.mediaUrls && Array.isArray(apiResponse.mediaUrls)) {
      mediaUrls = apiResponse.mediaUrls;
    }
  }
  
  // Calculate actual distance using Haversine formula
  let distance = 'Đang tính...'; // Default while waiting for geocoding
  
  // Check if API already provides coordinates
  if (apiResponse.latitude && apiResponse.longitude && technicianLat && technicianLng) {
    const distanceInKm = calculateDistance(
      technicianLat,
      technicianLng,
      apiResponse.latitude,
      apiResponse.longitude
    );
    distance = formatDistance(distanceInKm);
  }
  // Note: If coordinates not in API, we'll geocode separately to respect rate limits
  
  // Format appointment time - if no specific time set, show "Chưa xác định"
  const formattedTime = formatTime(apiResponse.expectedStartTime);
  
  // Normalize status from backend
  // Backend returns: "Pending", "Quoted", "QuoteAccepted", "ACCEPTED", "IN_PROGRESS", "Completed", "Cancelled"
  // We need to map to lowercase and handle variations
  const normalizeStatus = (status: string): OrderItem['status'] => {
    if (!status) return 'pending';
    
    const normalized = status.toLowerCase().replace(/[_\s-]/g, ''); // Remove _, space, -
    
    // Map all variations
    if (normalized === 'quoteaccepted' || normalized === 'accepted') {
      if (__DEV__) console.log(`✅ Status "${status}" → "accepted"`);
      return 'accepted';
    }
    if (normalized === 'quoted') {
      if (__DEV__) console.log(`✅ Status "${status}" → "pending" (quoted)`);
      return 'pending'; // Quoted is still available (waiting for customer)
    }
    if (normalized === 'pending') return 'pending';
    if (normalized === 'inprogress') {
      if (__DEV__) console.log(`✅ Status "${status}" → "in-progress"`);
      return 'in-progress';
    }
    if (normalized === 'completed') return 'completed';
    if (normalized === 'cancelled') return 'cancelled';
    
    // Log unknown status
    if (__DEV__) console.warn(`⚠️ Unknown status "${status}" (normalized: "${normalized}"), defaulting to pending`);
    return 'pending'; // Default fallback
  };
  
  // Fetch offer to get price information
  let priceRange = '200,000 - 500,000đ'; // Default fallback
  let priceLabel: string | undefined = undefined;
  
  try {
    const offers = await serviceDeliveryOffersService.getAllOffers(apiResponse.requestID);
    
    if (offers && offers.length > 0) {
      // Get the first offer (should be technician's own offer)
      const offer = offers[0];
      
      if (offer.finalCost && offer.finalCost > 0) {
        // Final cost is set - this is confirmed price
        priceRange = formatPrice(offer.finalCost);
        priceLabel = 'Giá đã chốt';
        if (__DEV__) console.log(`💰 Order ${apiResponse.requestID}: Final cost ${priceRange}`);
      } else if (offer.estimatedCost && offer.estimatedCost > 0) {
        // Only estimated cost - this is quote
        priceRange = formatPrice(offer.estimatedCost);
        priceLabel = 'Giá dự kiến';
        if (__DEV__) console.log(`💰 Order ${apiResponse.requestID}: Estimated cost ${priceRange}`);
      }
    }
  } catch (error) {
    if (__DEV__) console.warn(`⚠️ Could not fetch offer for request ${apiResponse.requestID}:`, error);
    // Keep default price range
  }
  
  return {
    id: apiResponse.requestID,
    serviceName: serviceName,
    customerName: apiResponse.fullName,
    customerPhone: apiResponse.phoneNumber,
    address: apiResponse.requestAddress,
    description: description,
    images: mediaUrls, // Use fetched media URLs from API
    status: normalizeStatus(apiResponse.status),
    createdAt: apiResponse.createdDate || apiResponse.requestedDate,
    priceRange: priceRange,
    priceLabel: priceLabel,
    priority: 'normal', // Có thể dựa vào expectedStartTime để detect urgent
    distance: distance, // Calculated distance
    estimatedTime: '30-60 phút',
    appointmentDate: formatDate(apiResponse.expectedStartTime), // Use expectedStartTime for appointment date (when to do the service)
    appointmentTime: formattedTime || 'Chưa xác định', // Show "Chưa xác định" if no specific time
    addressNote: apiResponse.addressNote || undefined,
    paymentMethod: undefined
  };
};

function TechnicianOrders() {
  const [selectedTab, setSelectedTab] = useState<'available' | 'accepted'>('available');
  const [fadeAnim] = useState(new Animated.Value(1));
  const [hasCheckedAcceptedOrders, setHasCheckedAcceptedOrders] = useState(false); // Track if we've checked for accepted orders
  
  // Activation state
  const [isActivated, setIsActivated] = useState(false);
  const [isLoadingActivation, setIsLoadingActivation] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true); // Track first load
  const [lastLoadTime, setLastLoadTime] = useState(0); // Track last load timestamp
  
  // Location hook
  const { location, isLoading: isLocationLoading, requestLocation } = useLocation();
  
  // Orders state (replace mock data)
  const [availableOrders, setAvailableOrders] = useState<OrderItem[]>([]);
  const [acceptedOrders, setAcceptedOrders] = useState<OrderItem[]>([]);
  
  // Search and filter states
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    maxDistance: '', // '1km', '3km', '5km', '10km'
    serviceType: '', // 'điện', 'nước', 'điều hòa'
    priceRange: '', // 'under300k', '300k-500k', 'over500k'
    timeSlot: '', // 'morning', 'afternoon', 'evening'
    district: '' // 'q1', 'q3', 'q10', 'tanbinh'
  });

  // Load activation state from storage on mount
  useEffect(() => {
    loadActivationState();
  }, []);

  const loadActivationState = async () => {
    try {
      const savedState = await AsyncStorage.getItem(STORAGE_KEY_ACTIVATED);
      if (savedState === 'true') {
        setIsActivated(true);
        // Request location immediately if previously activated
        const coords = await requestLocation();
        if (coords) {
          await loadOrders(coords.latitude, coords.longitude);
          setIsFirstLoad(false); // Mark first load complete
        }
      }
    } catch (error) {
      if (__DEV__) console.error('Load activation state error:', error);
    } finally {
      setIsLoadingActivation(false);
    }
  };

  const saveActivationState = async (activated: boolean) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_ACTIVATED, activated.toString());
    } catch (error) {
      if (__DEV__) console.error('Save activation state error:', error);
    }
  };

  const handleActivate = async () => {
    setIsLoadingActivation(true);
    
    // Request location permission and get coords
    const coords = await requestLocation();
    
    if (coords) {
      // Activate and save state
      setIsActivated(true);
      await saveActivationState(true);
      
      // Load orders with location
      await loadOrders(coords.latitude, coords.longitude);
      setIsFirstLoad(false); // Mark first load complete
    }
    
    setIsLoadingActivation(false);
  };

  const handleRefresh = async () => {
    if (!location) {
      Alert.alert('Lỗi', 'Không có thông tin vị trí. Vui lòng thử lại.');
      return;
    }
    
    if (isLoadingOrders) {
      if (__DEV__) console.log('⏸️ Already loading, skipping manual refresh');
      return;
    }
    
    await loadOrders(location.latitude, location.longitude, false);
  };

  const handleDeactivate = async () => {
    Alert.alert(
      'Tắt chế độ nhận đơn',
      'Bạn có chắc muốn tắt chế độ nhận đơn? Bạn sẽ không nhận được đơn hàng mới.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Tắt',
          style: 'destructive',
          onPress: async () => {
            setIsActivated(false);
            await saveActivationState(false);
            setAvailableOrders([]);
            setIsFirstLoad(true); // Reset for next activation
          },
        },
      ]
    );
  };

  const loadOrders = async (lat: number, lng: number, silent = false, retryCount = 0) => {
    // Prevent concurrent calls - even for silent ones
    if (isLoadingOrders) {
      if (__DEV__) console.log('⏸️ Load orders already in progress, skipping...');
      return;
    }
    
    setIsLoadingOrders(true);
    
    try {
      if (__DEV__) {
        console.log(`Loading orders (attempt ${retryCount + 1})...`, { lat, lng, radius: DEFAULT_RADIUS });
      }
      
      // Add small delay before first request to let server stabilize
      if (retryCount === 0 && !silent) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Load both available orders (filter API) and accepted orders (user requests API) in parallel
      const [availableApiOrders, acceptedApiOrders] = await Promise.all([
        // Available orders: Filter API returns only Pending/Quoted orders (no technician assigned yet)
        serviceRequestService.filterServiceRequests(lat, lng, DEFAULT_RADIUS),
        // Accepted orders: Get orders where this technician has submitted offers
        serviceRequestService.getUserServiceRequests()
      ]);
      
      if (__DEV__) {
        console.log(`✅ Filter API returned ${availableApiOrders.length} available orders`);
        console.log(`✅ User requests API returned ${acceptedApiOrders.length} accepted orders`);
        if (availableApiOrders.length > 0) {
          console.log('Sample available order:', {
            id: availableApiOrders[0].requestID,
            serviceId: availableApiOrders[0].serviceId,
            status: availableApiOrders[0].status
          });
        }
        if (acceptedApiOrders.length > 0) {
          console.log('Sample accepted order:', {
            id: acceptedApiOrders[0].requestID,
            serviceId: acceptedApiOrders[0].serviceId,
            status: acceptedApiOrders[0].status
          });
        }
      }
      
      // Transform API responses to OrderItem format (now async with service name fetch and distance calculation)
      const [transformedAvailableOrders, transformedAcceptedOrders] = await Promise.all([
        Promise.all(availableApiOrders.map(order => transformApiResponseToOrderItem(order, lat, lng))),
        Promise.all(acceptedApiOrders.map(order => transformApiResponseToOrderItem(order, lat, lng)))
      ]);
      
      // Filter available orders: Only show Pending status (from filter API, these are new orders)
      // Note: Status đã được normalize trong transformApiResponseToOrderItem
      // Backend "Pending" | "Quoted" → Frontend "pending" (available to accept)
      const available = transformedAvailableOrders.filter(order => 
        order.status === 'pending' // Includes both Pending and Quoted from backend
      );
      
      // Filter accepted orders: Show orders where technician has involvement
      // Backend "QuoteAccepted" | "InProgress" | "Completed" → Frontend "accepted" | "in-progress" | "completed"
      
      // DEBUG: Log all statuses from acceptedApiOrders
      if (__DEV__ && transformedAcceptedOrders.length > 0) {
        console.log('🔍 DEBUG: All accepted order statuses:', 
          transformedAcceptedOrders.map(o => ({ id: o.id, status: o.status }))
        );
      }
      
      const accepted = transformedAcceptedOrders.filter(order => {
        const isAccepted = order.status === 'accepted' ||    // QuoteAccepted from backend
                          order.status === 'in-progress' || // InProgress from backend
                          order.status === 'completed';      // Completed from backend
        
        if (__DEV__ && !isAccepted) {
          console.log(`⚠️ Order ${order.id} with status "${order.status}" was FILTERED OUT`);
        }
        
        return isAccepted;
      });
      
      setAvailableOrders(available);
      setAcceptedOrders(accepted);
      setLastLoadTime(Date.now()); // Track successful load time
      
      // Auto-switch to "Đã nhận" tab if there are accepted orders and this is first check
      if (!hasCheckedAcceptedOrders && accepted.length > 0) {
        setSelectedTab('accepted');
        setHasCheckedAcceptedOrders(true);
        if (__DEV__) console.log('🔄 Auto-switched to "Đã nhận" tab (found accepted orders)');
      }
      
      if (__DEV__) {
        console.log('✅ Orders loaded successfully:', {
          available: available.length,
          accepted: accepted.length,
          total: available.length + accepted.length,
          rawAcceptedCount: transformedAcceptedOrders.length,
          filteredOut: transformedAcceptedOrders.length - accepted.length,
          timestamp: new Date().toLocaleTimeString()
        });
      }

      // Start geocoding addresses in background (sequentially to respect rate limits)
      const allOrders = [...transformedAvailableOrders, ...transformedAcceptedOrders];
      if (allOrders.length > 0) {
        geocodeOrdersSequentially(allOrders, lat, lng, (orderId, distance) => {
          // Update both available and accepted orders
          setAvailableOrders(prev => 
            prev.map(order => order.id === orderId ? { ...order, distance } : order)
          );
          setAcceptedOrders(prev => 
            prev.map(order => order.id === orderId ? { ...order, distance } : order)
          );
        });
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ Load orders error:', {
          status: error.status,
          message: error.message,
          attempt: retryCount + 1
        });
      }
      
      // Retry logic for 500 errors (max 2 retries with exponential backoff)
      if (error.status === 500 && retryCount < 2) {
        const waitTime = (retryCount + 1) * 2000; // 2s, 4s
        if (__DEV__) console.log(`⏳ Retrying in ${waitTime/1000}s... (attempt ${retryCount + 2}/3)`);
        
        // Clear loading before retry
        setIsLoadingOrders(false);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return loadOrders(lat, lng, silent, retryCount + 1);
      }
      
      // Show error alert only on final failure and not silent
      if (!silent) {
        Alert.alert(
          'Lỗi tải đơn hàng',
          error.status === 500 
            ? 'Server đang gặp sự cố. Vui lòng thử lại sau ít phút.'
            : error.message || 'Không thể tải danh sách đơn hàng. Vui lòng thử lại.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoadingOrders(false); // Always clear loading state
    }
  };

  const animateTabChange = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Note: maskPhoneNumber and hideSpecificAddress moved to top-level for reuse

  useEffect(() => {
    animateTabChange();
  }, [selectedTab]);

  // Filter and search functions
  const filterOrders = (orders: OrderItem[]) => {
    let filteredOrders = [...orders];

    // Text search
    if (searchText.trim()) {
      filteredOrders = filteredOrders.filter(order =>
        order.serviceName.toLowerCase().includes(searchText.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
        order.address.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Distance filter
    if (filters.maxDistance) {
      const maxKm = parseFloat(filters.maxDistance.replace('km', ''));
      filteredOrders = filteredOrders.filter(order => {
        const orderKm = parseFloat(order.distance.replace('km', ''));
        return orderKm <= maxKm;
      });
    }

    // Time slot filter
    if (filters.timeSlot) {
      filteredOrders = filteredOrders.filter(order => {
        const time = order.appointmentTime;
        const hour = parseInt(time.split(':')[0]);
        switch (filters.timeSlot) {
          case 'morning':
            return hour >= 6 && hour < 12;
          case 'afternoon':
            return hour >= 12 && hour < 18;
          case 'evening':
            return hour >= 18 && hour < 22;
          default:
            return true;
        }
      });
    }

    // District filter
    if (filters.district) {
      filteredOrders = filteredOrders.filter(order =>
        order.address.toLowerCase().includes(filters.district.toLowerCase())
      );
    }



    // Service type filter
    if (filters.serviceType) {
      filteredOrders = filteredOrders.filter(order =>
        order.serviceName.toLowerCase().includes(filters.serviceType.toLowerCase())
      );
    }

    // Price range filter
    if (filters.priceRange) {
      filteredOrders = filteredOrders.filter(order => {
        const priceText = order.priceRange.toLowerCase();
        switch (filters.priceRange) {
          case 'under300k':
            return priceText.includes('150,000') || priceText.includes('200,000');
          case '300k-500k':
            return priceText.includes('300,000') || priceText.includes('500,000');
          case 'over500k':
            return priceText.includes('600,000') || priceText.includes('800,000');
          default:
            return true;
        }
      });
    }

    return filteredOrders;
  };

  const clearFilters = () => {
    setFilters({
      maxDistance: '',
      serviceType: '',
      priceRange: '',
      timeSlot: '',
      district: ''
    });
    setSearchText('');
  };

  const hasActiveFilters = () => {
    return searchText.trim() || 
           filters.maxDistance || 
           filters.serviceType || 
           filters.priceRange ||
           filters.timeSlot ||
           filters.district;
  };

  const handleAcceptOrder = (orderId: string) => {
    // Navigate to quote selection screen
    router.push({
      pathname: './quote-selection',
      params: { orderId }
    } as any);
  };

  const handleViewOrder = (orderId: string, status: OrderItem['status']) => {
    // Find the order and cache it for the details page
    const order = [...availableOrders, ...acceptedOrders].find(o => o.id === orderId);
    if (order) {
      orderCache.set(orderId, {
        id: order.id,
        serviceName: order.serviceName,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        address: order.address,
        description: order.description,
        images: order.images,
        status: order.status,
        createdAt: order.createdAt,
        appointmentDate: order.appointmentDate,
        appointmentTime: order.appointmentTime,
        distance: order.distance,
        addressNote: order.addressNote,
      });
    }

    if (status === 'accepted' || status === 'in-progress' || status === 'completed') {
      // Navigate to technician order tracking for accepted orders
      router.push({
        pathname: './technician-order-tracking',
        params: { orderId }
      } as any);
    } else {
      // Navigate to quote selection for pending orders (to send quote)
      router.push({
        pathname: './order-details',
        params: { orderId }
      } as any);
    }
  };

  const renderOrderCard = (order: OrderItem) => {
    const isAccepted = order.status === 'accepted';

    return (
      <TouchableOpacity
        style={[styles.orderCard, isAccepted && styles.acceptedOrderCard]}
        onPress={() => handleViewOrder(order.id, order.status)}
        activeOpacity={0.7}
      >

        {/* Order header */}
        <View style={styles.orderHeader}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{order.serviceName}</Text>
            {isAccepted && (
              <Text style={styles.customerName}>{order.customerName}</Text>
            )}
          </View>
          <View style={styles.distanceContainer}>
            <Ionicons name="location-outline" size={16} color="#609CEF" />
            <Text style={styles.distanceText}>{order.distance}</Text>
          </View>
        </View>

        {/* Order content */}
        <View style={styles.orderContent}>
          {isAccepted && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>{maskPhone(order.customerPhone)}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              {isAccepted ? order.address : extractDistrictFromAddress(order.address)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="document-text-outline" size={16} color="#6B7280" />
            <Text style={styles.descriptionText}>{order.description}</Text>
          </View>
          {order.images && order.images.length > 0 && (
            <View style={styles.infoRow}>
              <Ionicons name="images-outline" size={16} color="#609CEF" />
              <Text style={styles.imageCountText}>{order.images.length} ảnh đính kèm</Text>
            </View>
          )}
        </View>

        {/* Price and time info */}
        <View style={styles.orderMeta}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>
              {order.priceLabel || 'Giá dự kiến'}:
            </Text>
            <Text style={[
              styles.priceText,
              order.priceLabel === 'Giá đã chốt' && styles.priceTextConfirmed
            ]}>
              {order.priceRange}
            </Text>
          </View>
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.timeText}>{order.estimatedTime}</Text>
          </View>
        </View>

        {/* Enhanced Appointment Time Display */}
        <View style={styles.appointmentBanner}>
          <View style={styles.appointmentIcon}>
            <Ionicons name="calendar" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.appointmentInfo}>
            <Text style={styles.appointmentLabel}>Lịch hẹn</Text>
            <View style={styles.appointmentDateTime}>
              <Text style={styles.appointmentDate}>{order.appointmentDate}</Text>
              <View style={styles.appointmentTimeBadge}>
                <Text style={styles.appointmentTime}>{order.appointmentTime}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action button - Moved to bottom */}
        <View style={styles.orderActions}>
          {!isAccepted ? (
            <>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleAcceptOrder(order.id);
                }}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.acceptGradient}
                >
                <Ionicons name="calculator-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.acceptButtonText}>Gửi báo giá</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.tapHint}>Nhấn vào thẻ để xem chi tiết</Text>
            </>
          ) : (
            <View style={styles.acceptedStatus}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.acceptedText}>Đã nhận • Nhấn để theo dõi</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const baseOrders = selectedTab === 'available' ? availableOrders : acceptedOrders;
  
  // Use useMemo to prevent unnecessary re-filtering on every render
  const currentOrders = React.useMemo(
    () => filterOrders(baseOrders),
    [baseOrders, searchText, filters, selectedTab]
  );

  // CRITICAL: NO early returns to prevent "Rendered fewer hooks" error
  // All hooks MUST be called in the same order every render
  // Render different content based on state using conditional rendering
  
  // Loading state
  if (isLoadingActivation) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="light-content" backgroundColor="#609CEF" />
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#609CEF" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  // Swipe to activate state
  if (!isActivated) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#609CEF" />
        <Stack.Screen options={{ headerShown: false }} />

        <LinearGradient
          colors={['#609CEF', '#4F8EF7']}
          style={styles.header}
        >
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={26} color="white" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.headerTitle}>Đơn hàng</Text>
          
          <View style={styles.headerRight} />
        </LinearGradient>

        <SwipeToActivate
          onActivate={handleActivate}
          isLoading={isLocationLoading}
        />
      </View>
    );
  }

  // Main activated content
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#609CEF" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header with Back Button, Refresh and Deactivate Button */}
      <LinearGradient
        colors={['#609CEF', '#4F8EF7']}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={26} color="white" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.headerTitle}>Đơn hàng</Text>
        
        {/* Header Right: Refresh + Deactivate */}
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={isLoadingOrders}
          >
            <Ionicons 
              name="refresh" 
              size={22} 
              color={isLoadingOrders ? 'rgba(255,255,255,0.5)' : 'white'}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deactivateButton}
            onPress={handleDeactivate}
          >
            <Ionicons name="power" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search and Filter Section */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm theo dịch vụ, khách hàng, địa chỉ..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#9CA3AF"
            />
            {searchText ? (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>
          
          <TouchableOpacity 
            style={[styles.filterButton, showFilters && styles.filterButtonActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options-outline" size={20} color={showFilters ? "#609CEF" : "#6B7280"} />
            {hasActiveFilters() && <View style={styles.filterDot} />}
          </TouchableOpacity>
        </View>

        {/* Filter Options */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
              {/* Distance Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Khoảng cách</Text>
                <View style={styles.filterOptions}>
                  {['1km', '3km', '5km', '10km'].map(distance => (
                    <TouchableOpacity
                      key={distance}
                      style={[styles.filterChip, filters.maxDistance === distance && styles.filterChipActive]}
                      onPress={() => setFilters({...filters, maxDistance: filters.maxDistance === distance ? '' : distance})}
                    >
                      <Text style={[styles.filterChipText, filters.maxDistance === distance && styles.filterChipTextActive]}>
                        ≤ {distance}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Time Slot Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Khung giờ</Text>
                <View style={styles.filterOptions}>
                  {[
                    { key: 'morning', label: 'Sáng (6-12h)' },
                    { key: 'afternoon', label: 'Chiều (12-18h)' },
                    { key: 'evening', label: 'Tối (18-22h)' }
                  ].map(timeSlot => (
                    <TouchableOpacity
                      key={timeSlot.key}
                      style={[styles.filterChip, filters.timeSlot === timeSlot.key && styles.filterChipActive]}
                      onPress={() => setFilters({...filters, timeSlot: filters.timeSlot === timeSlot.key ? '' : timeSlot.key})}
                    >
                      <Text style={[styles.filterChipText, filters.timeSlot === timeSlot.key && styles.filterChipTextActive]}>
                        {timeSlot.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* District Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Khu vực</Text>
                <View style={styles.filterOptions}>
                  {[
                    { key: 'Q1', label: 'Quận 1' },
                    { key: 'Q3', label: 'Quận 3' },
                    { key: 'Q10', label: 'Quận 10' },
                    { key: 'Tân Bình', label: 'Tân Bình' },
                    { key: 'Bình Thạnh', label: 'Bình Thạnh' }
                  ].map(district => (
                    <TouchableOpacity
                      key={district.key}
                      style={[styles.filterChip, filters.district === district.key && styles.filterChipActive]}
                      onPress={() => setFilters({...filters, district: filters.district === district.key ? '' : district.key})}
                    >
                      <Text style={[styles.filterChipText, filters.district === district.key && styles.filterChipTextActive]}>
                        {district.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Service Type Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Loại dịch vụ</Text>
                <View style={styles.filterOptions}>
                  {[
                    { key: 'điều hòa', label: 'Điều hòa' },
                    { key: 'điện', label: 'Điện' },
                    { key: 'nước', label: 'Nước' },
                    { key: 'tủ lạnh', label: 'Tủ lạnh' }
                  ].map(service => (
                    <TouchableOpacity
                      key={service.key}
                      style={[styles.filterChip, filters.serviceType === service.key && styles.filterChipActive]}
                      onPress={() => setFilters({...filters, serviceType: filters.serviceType === service.key ? '' : service.key})}
                    >
                      <Text style={[styles.filterChipText, filters.serviceType === service.key && styles.filterChipTextActive]}>
                        {service.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Clear Filters */}
            {hasActiveFilters() && (
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
                <Ionicons name="refresh-outline" size={16} color="#EF4444" />
                <Text style={styles.clearFiltersText}>Xóa bộ lọc</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Tab selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'available' && styles.activeTab]}
          onPress={() => {
            console.log('Switching to available tab');
            setSelectedTab('available');
          }}
        >
          <Text style={[styles.tabText, selectedTab === 'available' && styles.activeTabText]}>
            Có thể nhận ({selectedTab === 'available' ? currentOrders.length : filterOrders(availableOrders).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'accepted' && styles.activeTab]}
          onPress={() => {
            console.log('Switching to accepted tab');
            setSelectedTab('accepted');
          }}
        >
          <Text style={[styles.tabText, selectedTab === 'accepted' && styles.activeTabText]}>
            Đã nhận ({selectedTab === 'accepted' ? currentOrders.length : filterOrders(acceptedOrders).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders list */}
      <View style={styles.ordersContainer}>
        <Animated.View style={[
          styles.animatedContent,
          {
            opacity: fadeAnim,
          }
        ]}>
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.ordersList}>
            {/* Loading indicator */}
            {isLoadingOrders && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#609CEF" />
                <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
              </View>
            )}

            {/* Filter Results Info */}
            {!isLoadingOrders && hasActiveFilters() && currentOrders.length > 0 && (
              <View style={styles.filterResultsInfo}>
                <Ionicons name="funnel-outline" size={16} color="#609CEF" />
                <Text style={styles.filterResultsText}>
                  Tìm thấy {currentOrders.length} đơn phù hợp
                </Text>
              </View>
            )}

            {!isLoadingOrders && currentOrders.length > 0 ? (
              currentOrders.map((order) => (
                <View key={order.id}>
                  {renderOrderCard(order)}
                </View>
              ))
            ) : !isLoadingOrders ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <LinearGradient
                    colors={['#F3F4F6', '#E5E7EB']}
                    style={styles.emptyIconGradient}
                  >
                    <Ionicons 
                      name={selectedTab === 'available' ? 'document-outline' : 'checkmark-done-outline'} 
                      size={48} 
                      color="#9CA3AF" 
                    />
                  </LinearGradient>
                </View>
                <Text style={styles.emptyTitle}>
                  {hasActiveFilters() 
                    ? 'Không tìm thấy đơn phù hợp'
                    : selectedTab === 'available' 
                      ? 'Chưa có đơn hàng mới'
                      : 'Chưa có đơn đã nhận'
                  }
                </Text>
                <Text style={styles.emptySubtitle}>
                  {hasActiveFilters()
                    ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                    : selectedTab === 'available'
                      ? 'Các đơn hàng mới sẽ xuất hiện ở đây'
                      : 'Đơn hàng đã nhận sẽ hiển thị ở đây'
                  }
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.bottomSpacing} />
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  header: {
    ...STANDARD_HEADER_STYLE,
  },
  backButton: {
    width: HEADER_CONSTANTS.TECHNICIAN_HEADER_CONTENT_HEIGHT,
    height: HEADER_CONSTANTS.TECHNICIAN_HEADER_CONTENT_HEIGHT,
    borderRadius: HEADER_CONSTANTS.TECHNICIAN_HEADER_CONTENT_HEIGHT / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 88, // Same as headerRight (2 buttons + gap = 40 + 8 + 40)
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 88, // 2 buttons (40 + 40) + gap (8)
  },
  refreshButton: {
    width: HEADER_CONSTANTS.TECHNICIAN_HEADER_CONTENT_HEIGHT,
    height: HEADER_CONSTANTS.TECHNICIAN_HEADER_CONTENT_HEIGHT,
    borderRadius: HEADER_CONSTANTS.TECHNICIAN_HEADER_CONTENT_HEIGHT / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deactivateButton: {
    width: HEADER_CONSTANTS.TECHNICIAN_HEADER_CONTENT_HEIGHT,
    height: HEADER_CONSTANTS.TECHNICIAN_HEADER_CONTENT_HEIGHT,
    borderRadius: HEADER_CONSTANTS.TECHNICIAN_HEADER_CONTENT_HEIGHT / 2,
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Search and Filter Styles
  searchFilterContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(96, 156, 239, 0.1)',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  filtersContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  filtersScroll: {
    flexGrow: 0,
  },
  filterGroup: {
    marginRight: 24,
    minWidth: 120,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  filterOptions: {
    flexDirection: 'column',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: 'rgba(96, 156, 239, 0.1)',
    borderColor: '#609CEF',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  filterChipTextActive: {
    color: '#609CEF',
    fontWeight: '600',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingVertical: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  filterResultsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(96, 156, 239, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  filterResultsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#609CEF',
  },

  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#609CEF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  ordersContainer: {
    flex: 1,
    marginTop: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  ordersList: {
    paddingHorizontal: 16,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#609CEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  acceptedOrderCard: {
    borderLeftColor: '#10B981',
    backgroundColor: '#FEFFFE',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(96, 156, 239, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#609CEF',
    marginLeft: 4,
  },
  orderContent: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  priceTextConfirmed: {
    color: '#10B981', // Brighter green for confirmed price
    fontWeight: '800',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  orderActions: {
    marginTop: 12,
    marginBottom: 4,
  },
  acceptButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  acceptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  acceptedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  acceptedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 6,
  },
  orderTime: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 30,
  },
  animatedContent: {
    flex: 1,
  },
  tapHint: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  imageCountText: {
    fontSize: 14,
    color: '#609CEF',
    fontWeight: '600',
    marginLeft: 8,
  },
  // Balanced Appointment Styles for Orders List
  appointmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    marginTop: 16,
    marginBottom: 4,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#609CEF',
  },
  appointmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#609CEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  appointmentDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  appointmentDate: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  appointmentTimeBadge: {
    backgroundColor: '#609CEF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  appointmentTime: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Urgent Priority Styles
  appointmentBannerUrgent: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  appointmentIconUrgent: {
    backgroundColor: '#EF4444',
  },
  appointmentLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  appointmentTimeBadgeUrgent: {
    backgroundColor: '#EF4444',
  },
});

// Export protected component
export default withTechnicianAuth(TechnicianOrders, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});