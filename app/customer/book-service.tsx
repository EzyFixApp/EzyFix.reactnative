import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  TextInput, 
  Image,
  Alert,
  Platform,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useAuth } from '../../store/authStore';
import { serviceRequestService, addressService } from '../../lib/api';
import { mediaService, MediaType } from '../../lib/api/media';
import { locationService } from '../../lib/api/location';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AddressSearchInput from '../../components/AddressSearchInput';
import type { BookingFormData, ServiceRequestData, Address } from '../../types/api';

export default function BookService() {
  const params = useLocalSearchParams();
  const serviceName = params.serviceName as string || 'Dịch vụ';
  const servicePrice = params.servicePrice as string || 'Liên hệ';
  const serviceId = params.serviceId as string || '';

  // Get user data from auth
  const { user } = useAuth();

  const [formData, setFormData] = useState<BookingFormData>({
    customerName: user?.fullName || '',
    phoneNumber: user?.phoneNumber || '', // Get phone number from auth
    serviceName: serviceName,
    serviceId: serviceId,
    servicePrice: servicePrice,
    serviceDescription: '', // User input for service description
    address: '',
    addressId: '', // ID of selected address
    addressNote: '',
    requestedDate: new Date().toISOString().split('T')[0], // Today's date
    expectedStartTime: '09:00',
    images: []
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [imageViewModal, setImageViewModal] = useState<{visible: boolean; imageUri: string; index: number}>({
    visible: false,
    imageUri: '',
    index: 0
  });
  
  // Address coordinates and components for better address handling
  const [addressCoordinates, setAddressCoordinates] = useState<{
    latitude?: number;
    longitude?: number;
    components?: any;
  }>({});

  // Time slots data
  const timeSlots = [
    { value: '08:00', display: '8:00', period: 'Sáng', available: true },
    { value: '09:00', display: '9:00', period: 'Sáng', available: true },
    { value: '10:00', display: '10:00', period: 'Sáng', available: true },
    { value: '11:00', display: '11:00', period: 'Sáng', available: true },
    { value: '13:00', display: '1:00', period: 'Chiều', available: true },
    { value: '14:00', display: '2:00', period: 'Chiều', available: true },
    { value: '15:00', display: '3:00', period: 'Chiều', available: true },
    { value: '16:00', display: '4:00', period: 'Chiều', available: true },
    { value: '17:00', display: '5:00', period: 'Chiều', available: false }, // Example unavailable
    { value: '18:00', display: '6:00', period: 'Tối', available: true },
  ];

  // Date helper functions
  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.toDateString() === today.toDateString();
  };

  const isTomorrow = (dateString: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = new Date(dateString);
    return date.toDateString() === tomorrow.toDateString();
  };

  const formatQuickDate = (type: 'today' | 'tomorrow') => {
    const date = new Date();
    if (type === 'tomorrow') {
      date.setDate(date.getDate() + 1);
    }
    
    const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const weekday = weekdays[date.getDay()];
    
    return `${day}/${month} (${weekday})`;
  };

  // Quick date selection handler
  const handleQuickDateSelect = (type: 'today' | 'tomorrow') => {
    const date = new Date();
    if (type === 'tomorrow') {
      date.setDate(date.getDate() + 1);
    }
    
    const dateString = date.toISOString().split('T')[0];
    handleInputChange('requestedDate', dateString);
  };

  // Time slot selection handler
  const handleTimeSlotSelect = (time: string) => {
    handleInputChange('expectedStartTime', time);
  };

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: user.fullName || '',
        // phoneNumber can be added if available in user data
      }));
    }
  }, [user]);

  // Refresh addresses when screen is focused (user returns from add-address)
  useFocusEffect(
    React.useCallback(() => {
      // Only refresh if modal is not showing (to avoid unnecessary API calls)
      if (!showAddressModal) {
        return;
      }
      
      // If address modal is open and we have user, refresh addresses
      if (user?.id) {
        loadSavedAddresses();
      }
    }, [showAddressModal, user?.id])
  );

  const handleBackPress = () => {
    router.back();
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Customer name and phone number are now read-only from auth, no validation needed
    
    if (!formData.address.trim()) {
      newErrors.address = 'Vui lòng chọn địa chỉ từ danh sách hoặc thêm địa chỉ mới';
    }

    if (!formData.serviceId) {
      newErrors.serviceId = 'Vui lòng chọn dịch vụ';
    }

    if (!formData.requestedDate) {
      newErrors.requestedDate = 'Vui lòng chọn ngày yêu cầu';
    }

    if (!formData.expectedStartTime) {
      newErrors.expectedStartTime = 'Vui lòng chọn thời gian bắt đầu';
    }

    if (!formData.serviceDescription.trim()) {
      newErrors.serviceDescription = 'Vui lòng mô tả chi tiết vấn đề cần sửa chữa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof BookingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Date/Time picker handlers
  const handleDateSelect = (date: Date) => {
    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    setFormData(prev => ({ ...prev, requestedDate: formattedDate }));
    if (errors.requestedDate) {
      setErrors(prev => ({ ...prev, requestedDate: '' }));
    }
    setShowDatePicker(false);
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return 'Chọn ngày';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatDisplayTime = (timeString: string) => {
    if (!timeString) return 'Chọn giờ';
    return timeString;
  };

  // Professional date/time formatting functions
  const formatProfessionalDate = (dateString: string) => {
    if (!dateString) return 'Chọn ngày';
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Ngày mai';
    } else {
      const weekdays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const weekday = weekdays[date.getDay()];
      return `${weekday}, ${day}/${month}`;
    }
  };

  const formatProfessionalTime = (timeString: string) => {
    if (!timeString) return 'Chọn giờ';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const period = hour < 12 ? 'SA' : 'CH';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    
    return `${displayHour}:${minutes} ${period}`;
  };

  // Date/Time picker handlers
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      handleInputChange('requestedDate', dateString);
    }
    
    if (Platform.OS === 'ios') {
      setShowDatePicker(false);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      handleInputChange('expectedStartTime', timeString);
    }
    
    if (Platform.OS === 'ios') {
      setShowTimePicker(false);
    }
  };

  // Load saved addresses
  const loadSavedAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const allAddresses = await addressService.getAllAddresses();
      
      // Filter addresses by current user (same logic as saved-addresses.tsx)
      const userAddresses = allAddresses.filter(addr => addr.userId === user?.id);
      setSavedAddresses(userAddresses);
    } catch (error: any) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Load addresses when address modal opens
  const handleOpenAddressModal = () => {
    setShowAddressModal(true);
    loadSavedAddresses();
  };

  // Handle address modal close and refresh
  const handleCloseAddressModal = () => {
    setShowAddressModal(false);
    // Refresh addresses in case user added new one
    loadSavedAddresses();
  };

  // Handle address selection with consistent logic
  const selectAddress = (address: string, addressId?: string, coordinates?: { latitude: number; longitude: number; components?: any }) => {
    setFormData(prev => ({ 
      ...prev, 
      address: address,
      addressId: addressId || '' 
    }));
    
    if (coordinates) {
      setAddressCoordinates(coordinates);
    }
    
    // Clear address error if exists
    if (errors.address) {
      setErrors(prev => ({ ...prev, address: '' }));
    }
  };

  // Format address display - avoid duplication
  const formatAddressDisplay = (address: Address) => {
    return address.street.includes(address.city) 
      ? address.street  // If street already contains full address, use as is
      : `${address.street}, ${address.city}, ${address.province} ${address.postalCode}`; // Otherwise build full address
  };

  // Handle address selection from saved addresses
  const handleSelectAddress = (address: Address) => {
    // Use formatted address to avoid duplication
    const fullAddress = formatAddressDisplay(address);
    
    const coordinates = (address.latitude && address.longitude) ? {
      latitude: address.latitude,
      longitude: address.longitude,
      components: {
        street: address.street,
        city: address.city,
        province: address.province,
        postalCode: address.postalCode
      }
    } : undefined;
    
    selectAddress(fullAddress, address.addressId, coordinates);
    setShowAddressModal(false);
  };

  const pickImage = async () => {
    // Check if already at max limit
    if (formData.images.length >= 4) {
      Alert.alert(
        'Đã đạt giới hạn',
        'Bạn chỉ có thể thêm tối đa 4 ảnh. Vui lòng xóa ảnh cũ để thêm ảnh mới.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Cần quyền truy cập',
          'Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Show options: Camera or Library
      Alert.alert(
        'Chọn ảnh',
        'Bạn muốn chụp ảnh mới hay chọn từ thư viện?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: '📷 Chụp ảnh',
            onPress: () => openCamera()
          },
          {
            text: '🖼️ Thư viện',
            onPress: () => openImageLibrary()
          }
        ]
      );
    } catch (error) {
      console.error('Error requesting permission:', error);
      Alert.alert('Lỗi', 'Không thể truy cập thư viện ảnh.');
    }
  };

  const openCamera = async () => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Cần quyền camera',
          'Ứng dụng cần quyền truy cập camera để chụp ảnh.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Disable editing/cropping
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImage = result.assets[0].uri;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, newImage]
        }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh.');
    }
  };

  const openImageLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Disable editing/cropping
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        const newImage = result.assets[0].uri;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, newImage]
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh.');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const openImageViewer = (imageUri: string, index: number) => {
    setImageViewModal({
      visible: true,
      imageUri: imageUri,
      index: index
    });
  };

  const closeImageViewer = () => {
    setImageViewModal({
      visible: false,
      imageUri: '',
      index: 0
    });
  };

  const createServiceRequest = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.addressId) {
        Alert.alert('Lỗi', 'Vui lòng chọn địa chỉ');
        setLoading(false);
        return;
      }

      // First, create the service request to get requestID
      const requestData: ServiceRequestData = {
        request: formData.serviceDescription,
        addressID: formData.addressId,
        serviceId: formData.serviceId,
        serviceDescription: formData.serviceDescription,
        addressNote: formData.addressNote || '',
        requestedDate: new Date(formData.requestedDate).toISOString(),
        expectedStartTime: new Date(`${formData.requestedDate}T${formData.expectedStartTime}:00`).toISOString(),
        mediaUrls: [] // Initially empty, will update after image upload
      };

      const response = await serviceRequestService.createServiceRequest(requestData);
      const requestID = response.id;

      // Upload images if any
      let mediaUrls: string[] = [];
      if (formData.images.length > 0) {
        try {
          // Prepare files for upload
          const files = formData.images.map((uri, index) => ({
            uri,
            type: 'image/jpeg', // Assuming JPEG, could be dynamic
            name: `issue_${requestID}_${index + 1}.jpg`
          }));

          // Upload all images with MediaType: ISSUE
          const uploadedMedia = await mediaService.uploadMultipleMedia(
            requestID,
            files,
            'ISSUE' as MediaType
          );

          // Extract URLs from upload response
          mediaUrls = uploadedMedia.map(media => media.fileURL);

          if (__DEV__) console.log('Images uploaded successfully:', mediaUrls);
        } catch (uploadError) {
          if (__DEV__) console.warn('Image upload failed:', uploadError);
          // Continue without images rather than failing the whole request
          Alert.alert(
            'Cảnh báo',
            'Không thể upload ảnh, nhưng yêu cầu dịch vụ đã được tạo thành công.'
          );
        }
      }

      // Navigate to confirmation page with booking details
      const imageCount = formData.images.length;
      router.push({
        pathname: '/customer/booking-confirmation' as any,
        params: {
          serviceName: formData.serviceName,
          customerName: formData.customerName,
          requestId: requestID,
          imageCount: imageCount.toString(),
          requestedDate: formData.requestedDate,
          expectedStartTime: formData.expectedStartTime,
          addressNote: formData.addressNote || '',
          serviceDescription: formData.serviceDescription
        }
      });
    } catch (error: any) {
      Alert.alert(
        'Lỗi đặt lịch ❌',
        error.message || 'Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại.',
        [{ text: 'Đóng' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const imageCount = formData.images.length;
      const imageText = imageCount > 0 ? `\nSố ảnh: ${imageCount} ảnh` : '\nKhông có ảnh đính kèm';
      
      Alert.alert(
        'Xác nhận đặt lịch 📅',
        `Dịch vụ: ${formData.serviceName}\nVấn đề: ${formData.serviceDescription}\nNgày: ${formatDisplayDate(formData.requestedDate)}\nGiờ: ${formData.expectedStartTime}\nĐịa chỉ: ${formData.address}${imageText}\n\nXác nhận đặt lịch?`,
        [
          { text: 'Hủy', style: 'cancel' },
          { 
            text: 'Xác nhận đặt lịch', 
            style: 'default',
            onPress: createServiceRequest
          }
        ]
      );
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#609CEF', '#4F8BE8', '#3D7CE0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Đặt lịch sửa chữa</Text>
          </View>
        </LinearGradient>

        {/* Service Info Card */}
        <View style={styles.serviceInfoCard}>
          <View style={styles.serviceInfo}>
            <View style={styles.serviceIconContainer}>
              <Ionicons name="construct" size={24} color="#609CEF" />
            </View>
            <View style={styles.serviceDetails}>
              <Text style={styles.serviceName}>{serviceName}</Text>
              <Text style={styles.servicePrice}>Giá: {servicePrice}</Text>
            </View>
          </View>
        </View>

        {/* Form Content */}
        <ScrollView 
          style={styles.formContainer} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Service Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dịch vụ</Text>
            <View style={styles.serviceCard}>
              <Text style={styles.selectedServiceText}>{serviceName}</Text>
            </View>
          </View>

          {/* Customer Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Tên khách hàng</Text>
            <View style={styles.readOnlyContainer}>
              <Ionicons name="person" size={20} color="#6B7280" />
              <Text style={styles.readOnlyText}>{formData.customerName || 'Chưa có thông tin'}</Text>
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.section}>
            <Text style={styles.label}>Số điện thoại</Text>
            <View style={styles.readOnlyContainer}>
              <Ionicons name="call" size={20} color="#6B7280" />
              <Text style={styles.readOnlyText}>{formData.phoneNumber || 'Chưa có thông tin'}</Text>
            </View>
          </View>

          {/* Address */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Địa chỉ cụ thể <Text style={styles.required}>*</Text>
            </Text>
            
            {/* Info Banner */}
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text style={styles.infoBannerText}>
                Vì lý do an toàn, bạn chỉ có thể chọn từ địa chỉ đã được xác thực
              </Text>
            </View>
            
            {/* Selected Address Display */}
            {formData.address ? (
              <View style={styles.selectedAddressContainer}>
                <View style={styles.selectedAddressContent}>
                  <Ionicons name="location" size={20} color="#10B981" />
                  <View style={styles.selectedAddressText}>
                    <Text style={styles.selectedAddressLabel}>Địa chỉ đã chọn:</Text>
                    <Text style={styles.selectedAddressValue}>{formData.address}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.changeAddressButton}
                  onPress={() => {
                    setFormData(prev => ({ ...prev, address: '' }));
                    setAddressCoordinates({});
                  }}
                >
                  <Text style={styles.changeAddressText}>Đổi</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.noAddressContainer}>
                <Ionicons name="location-outline" size={24} color="#9CA3AF" />
                <Text style={styles.noAddressText}>Chưa chọn địa chỉ</Text>
              </View>
            )}

            {/* Address Selection Options */}
            <View style={styles.addressOptionsContainer}>
              <TouchableOpacity 
                style={styles.primaryAddressOption}
                onPress={handleOpenAddressModal}
              >
                <Ionicons name="list" size={20} color="white" />
                <Text style={styles.primaryOptionText}>Chọn từ địa chỉ đã lưu</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.secondaryAddressOption}
                onPress={() => router.push('./add-address' as any)}
              >
                <Ionicons name="add" size={20} color="#609CEF" />
                <Text style={styles.secondaryOptionText}>Thêm địa chỉ mới</Text>
              </TouchableOpacity>
            </View>
            {errors.address && (
              <Text style={styles.errorText}>{errors.address}</Text>
            )}
          </View>

          {/* Location Notes */}
          <View style={styles.section}>
            <Text style={styles.label}>Ghi chú thêm về vị trí</Text>
            <View style={[
              styles.inputContainer,
              styles.textAreaContainer
            ]}>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Ví dụ: Tầng 2, phòng 201, cạnh cửa hàng ABC..."
                placeholderTextColor="#9CA3AF"
                value={formData.addressNote}
                onChangeText={(value) => handleInputChange('addressNote', value)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Service Description */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Mô tả chi tiết vấn đề <Text style={styles.required}>*</Text>
            </Text>
            <View style={[
              styles.inputContainer,
              styles.textAreaContainer,
              errors.serviceDescription && styles.inputError
            ]}>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Ví dụ: Máy lạnh không mát, tiếng ồn lớn, không bật được..."
                placeholderTextColor="#9CA3AF"
                value={formData.serviceDescription}
                onChangeText={(value) => handleInputChange('serviceDescription', value)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            {errors.serviceDescription && (
              <Text style={styles.errorText}>{errors.serviceDescription}</Text>
            )}
          </View>

          {/* Date and Time Selection - Professional Design */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thời gian thực hiện</Text>
            
            <View style={styles.professionalDateTimeContainer}>
              {/* Date Selection */}
              <View style={styles.professionalDateTimeItem}>
                <Text style={styles.professionalLabel}>
                  Ngày yêu cầu <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity 
                  style={[styles.professionalDateTimeCard, errors.requestedDate && styles.inputError]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <View style={styles.professionalDateTimeContent}>
                    <View style={styles.professionalIconContainer}>
                      <Ionicons name="calendar-outline" size={20} color="#609CEF" />
                    </View>
                    <View style={styles.professionalDateTimeInfo}>
                      <Text style={styles.professionalDateTimeLabel}>Ngày</Text>
                      <Text style={styles.professionalDateTimeValue}>
                        {formatProfessionalDate(formData.requestedDate)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
                {errors.requestedDate && (
                  <Text style={styles.errorText}>{errors.requestedDate}</Text>
                )}
              </View>

              {/* Time Selection */}
              <View style={styles.professionalDateTimeItem}>
                <Text style={styles.professionalLabel}>
                  Giờ bắt đầu <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity 
                  style={[styles.professionalDateTimeCard, errors.expectedStartTime && styles.inputError]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <View style={styles.professionalDateTimeContent}>
                    <View style={styles.professionalIconContainer}>
                      <Ionicons name="time-outline" size={20} color="#609CEF" />
                    </View>
                    <View style={styles.professionalDateTimeInfo}>
                      <Text style={styles.professionalDateTimeLabel}>Thời gian</Text>
                      <Text style={styles.professionalDateTimeValue}>
                        {formatProfessionalTime(formData.expectedStartTime)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
                {errors.expectedStartTime && (
                  <Text style={styles.errorText}>{errors.expectedStartTime}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Images */}
          <View style={styles.section}>
            <Text style={styles.label}>Ảnh mô tả vấn đề (Tối đa 4 ảnh)</Text>
            <Text style={styles.imageHint}>
              Cung cấp ảnh để kỹ thuật viên hiểu rõ vấn đề cần sửa chữa
            </Text>
            
            <View style={styles.imageContainer}>
              {formData.images.map((imageUri, index) => (
                <View key={index} style={styles.imagePreview}>
                  <TouchableOpacity 
                    onPress={() => openImageViewer(imageUri, index)}
                    style={styles.imagePreviewTouchable}
                  >
                    <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
              
              {formData.images.length < 4 && (
                <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                  <Ionicons name="camera" size={24} color="#609CEF" />
                  <Text style={styles.addImageText}>+ Thêm ảnh ({formData.images.length}/4)</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#9CA3AF', '#6B7280'] : ['#609CEF', '#4F8BE8', '#3D7CE0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.submitText}>Đang đặt lịch...</Text>
                </View>
              ) : (
                <Text style={styles.submitText}>Đặt lịch ngay</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Native Date & Time Pickers */}
        {showDatePicker && (
          <DateTimePicker
            value={formData.requestedDate ? new Date(formData.requestedDate) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
            maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // 30 days from now
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={(() => {
              const [hours, minutes] = formData.expectedStartTime.split(':');
              const date = new Date();
              date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
              return date;
            })()}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        )}

        {/* Address Selection Modal */}
        <Modal visible={showAddressModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Chọn địa chỉ đã lưu</Text>
              <Text style={styles.modalSubtitle}>Vui lòng chọn một địa chỉ từ danh sách bên dưới</Text>
              
              {loadingAddresses ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#609CEF" />
                  <Text style={styles.modalSubtitle}>Đang tải địa chỉ...</Text>
                </View>
              ) : savedAddresses.length === 0 ? (
                <View style={styles.emptyAddressContainer}>
                  <Ionicons name="location-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.modalSubtitle}>Chưa có địa chỉ đã lưu</Text>
                  <Text style={styles.emptyAddressHint}>
                    Bạn cần thêm ít nhất một địa chỉ để có thể đặt dịch vụ
                  </Text>
                  <TouchableOpacity 
                    style={styles.addAddressButton}
                    onPress={() => {
                      handleCloseAddressModal();
                      router.push('./add-address' as any);
                    }}
                  >
                    <Text style={styles.addAddressText}>Thêm địa chỉ đầu tiên</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <ScrollView style={styles.addressList}>
                    {savedAddresses.map((address, index) => (
                      <TouchableOpacity
                        key={address.addressId}
                        style={styles.addressOption}
                        onPress={() => handleSelectAddress(address)}
                      >
                        <View style={styles.addressInfo}>
                          <Text style={styles.addressTitle}>Địa chỉ {index + 1}</Text>
                          <Text style={styles.addressDetail}>
                            {formatAddressDisplay(address)}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#609CEF" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  
                  {/* Add new address button */}
                  <TouchableOpacity 
                    style={styles.addNewAddressButton}
                    onPress={() => {
                      handleCloseAddressModal();
                      router.push('./add-address' as any);
                    }}
                  >
                    <Ionicons name="add-circle" size={20} color="#609CEF" />
                    <Text style={styles.addNewAddressText}>Thêm địa chỉ mới</Text>
                  </TouchableOpacity>
                </>
              )}
              
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={handleCloseAddressModal}
              >
                <Text style={styles.modalButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Image Viewer Modal */}
        <Modal 
          visible={imageViewModal.visible} 
          transparent 
          animationType="fade"
          onRequestClose={closeImageViewer}
        >
          <View style={styles.imageViewerOverlay}>
            <TouchableOpacity 
              style={styles.imageViewerCloseArea}
              onPress={closeImageViewer}
            >
              <View style={styles.imageViewerContainer}>
                <TouchableOpacity 
                  style={styles.imageViewerCloseButton}
                  onPress={closeImageViewer}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                
                <Image 
                  source={{ uri: imageViewModal.imageUri }} 
                  style={styles.fullSizeImage}
                  resizeMode="contain"
                />
                
                <View style={styles.imageViewerInfo}>
                  <Text style={styles.imageViewerText}>
                    Ảnh {imageViewModal.index + 1} / {formData.images.length}
                  </Text>
                  <TouchableOpacity 
                    style={styles.imageViewerDeleteButton}
                    onPress={() => {
                      removeImage(imageViewModal.index);
                      closeImageViewer();
                    }}
                  >
                    <Ionicons name="trash" size={20} color="#EF4444" />
                    <Text style={styles.imageViewerDeleteText}>Xóa ảnh này</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingBottom: 20,
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  serviceInfoCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: -10,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(96, 156, 239, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#609CEF',
  },
  formContainer: {
    flex: 1,
    paddingTop: 24,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedServiceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
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
  readOnlyContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  readOnlyText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  textAreaContainer: {
    paddingVertical: 16,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  textInput: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    minHeight: 24,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16, // Increased gap to accommodate remove buttons
    marginTop: 8,
    paddingTop: 8, // Add padding to make space for remove buttons
    paddingRight: 8, // Add padding for remove buttons on the right
  },
  imagePreview: {
    width: 80,
    height: 80,
    position: 'relative',
    borderRadius: 12,
    overflow: 'visible', // Changed from 'hidden' to 'visible' so button shows outside
    backgroundColor: '#F3F4F6',
    marginBottom: 8, // Add margin to accommodate the button
    marginRight: 8,  // Add margin to accommodate the button
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
  bottomSpacing: {
    height: 100,
  },
  submitContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Date Time Styles
  dateTimeContainer: {
    gap: 16,
  },
  dateTimeItem: {
    flex: 1,
  },
  dateTimeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    flex: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    minWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#609CEF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  timeOptionsContainer: {
    gap: 12,
  },
  timeOption: {
    backgroundColor: 'rgba(96, 156, 239, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#609CEF',
  },
  // Address Styles
  addressActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  savedAddressButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(96, 156, 239, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#609CEF',
  },
  savedAddressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#609CEF',
  },
  manageAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  manageAddressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Address Modal Styles
  addressList: {
    maxHeight: 300,
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressInfo: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  addressDetail: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  defaultLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginTop: 4,
  },
  emptyAddressContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyAddressHint: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 20,
  },
  addAddressButton: {
    backgroundColor: '#609CEF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  addAddressText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  // Add new address button in modal
  addNewAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 16,
    backgroundColor: 'rgba(96, 156, 239, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#609CEF',
    gap: 8,
  },
  addNewAddressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#609CEF',
  },
  // New Address Selection Styles
  selectedAddressContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#10B981',
    marginBottom: 16,
  },
  selectedAddressContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  selectedAddressText: {
    flex: 1,
    marginLeft: 12,
  },
  selectedAddressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  selectedAddressValue: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 22,
  },
  changeAddressButton: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  changeAddressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  noAddressContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  noAddressText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 8,
    fontWeight: '500',
  },
  addressOptionsContainer: {
    gap: 12,
  },
  primaryAddressOption: {
    backgroundColor: '#609CEF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  secondaryAddressOption: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#609CEF',
  },
  secondaryOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#609CEF',
  },
  // Info Banner Styles
  infoBanner: {
    backgroundColor: '#EBF8FF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoBannerText: {
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  // Image hint style
  imageHint: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
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
  // New Date & Time Selection Styles
  dateSelectionContainer: {
    marginBottom: 20,
  },
  quickDateOptions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  quickDateCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickDateCardSelected: {
    backgroundColor: '#609CEF',
    borderColor: '#609CEF',
    shadowColor: '#609CEF',
    shadowOpacity: 0.3,
  },
  quickDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
  },
  quickDateTextSelected: {
    color: 'white',
  },
  quickDateSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  quickDateSubtextSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  timeSelectionContainer: {
    marginTop: 16,
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  timeSlotCard: {
    width: '30%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
    minHeight: 70,
    justifyContent: 'center',
  },
  timeSlotCardSelected: {
    backgroundColor: '#609CEF',
    borderColor: '#609CEF',
  },
  timeSlotCardDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  timeSlotTextSelected: {
    color: 'white',
  },
  timeSlotTextDisabled: {
    color: '#9CA3AF',
  },
  timeSlotSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  timeSlotSubtextSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  timeSlotSubtextDisabled: {
    color: '#D1D5DB',
  },
  timeSlotDisabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeSlotDisabledText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '500',
    textAlign: 'center',
  },
  // Professional Date & Time Styles
  professionalDateTimeContainer: {
    gap: 16,
  },
  professionalDateTimeItem: {
    flex: 1,
  },
  professionalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  professionalDateTimeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  professionalDateTimeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  professionalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  professionalDateTimeInfo: {
    flex: 1,
  },
  professionalDateTimeLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  professionalDateTimeValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
});