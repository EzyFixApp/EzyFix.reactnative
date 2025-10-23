import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { addressService } from '../../lib/api';
import { locationService } from '../../lib/api/location';
import AddressSearchModal from '../../components/AddressSearchModal';
import type { AddressData, Address } from '../../types/api';
import withCustomerAuth from '../../lib/auth/withCustomerAuth';

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  required?: boolean;
  error?: string;
  readonly?: boolean;
}

function InputField({ label, value, onChangeText, placeholder, multiline = false, numberOfLines = 1, required = false, error, readonly = false }: InputFieldProps) {
  return (
    <View style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        {required && <Text style={styles.requiredMark}>*</Text>}
      </View>
      <TextInput
        style={[
          styles.textInput, 
          multiline && styles.multilineInput,
          error && styles.inputError,
          readonly && styles.readonlyInput
        ]}
        value={value}
        onChangeText={readonly ? undefined : onChangeText}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={numberOfLines}
        placeholderTextColor="#9CA3AF"
        textAlignVertical={multiline ? 'top' : 'center'}
        editable={!readonly}
        selectTextOnFocus={!readonly}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

interface AddressTypeButtonProps {
  type: string;
  icon: keyof typeof Ionicons.glyphMap;
  isSelected: boolean;
  onPress: () => void;
}

function AddressTypeButton({ type, icon, isSelected, onPress }: AddressTypeButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.typeButton, isSelected && styles.selectedTypeButton]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={isSelected ? 'white' : '#609CEF'} 
      />
      <Text style={[styles.typeButtonText, isSelected && styles.selectedTypeButtonText]}>
        {type}
      </Text>
    </TouchableOpacity>
  );
}

function AddAddress() {
  // Get params from navigation (for edit mode)
  const params = useLocalSearchParams<{
    mode?: string;
    addressId?: string;
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    latitude?: string;
    longitude?: string;
  }>();

  // Determine if we're in edit mode
  const isEditMode = params.mode === 'edit' && params.addressId;
  const addressId = params.addressId;

  // Initialize form data from params or defaults
  const [formData, setFormData] = useState<AddressData>({
    street: params.street || '',
    city: params.city || 'Thành phố Hồ Chí Minh',
    province: params.province || 'TP. Hồ Chí Minh',
    postalCode: params.postalCode || '700000',
    latitude: params.latitude ? parseFloat(params.latitude) : undefined,
    longitude: params.longitude ? parseFloat(params.longitude) : undefined
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showAddressModal, setShowAddressModal] = useState(false);

  // Debug: Log params and form data on mount
  useEffect(() => {
    if (__DEV__) {
      console.log('📥 Navigation params:', params);
      console.log('🔧 Edit mode:', isEditMode);
      console.log('📋 Initial form data:', formData);
    }

    // Validate edit mode data
    if (isEditMode) {
      if (!params.street || params.street.trim() === '') {
        console.warn('⚠️ Street is empty in edit mode!');
        Alert.alert(
          'Lỗi dữ liệu',
          'Địa chỉ này thiếu thông tin đường. Vui lòng xóa và tạo lại địa chỉ mới.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }
      if (!params.city || params.city.trim() === '') {
        console.warn('⚠️ City is empty in edit mode!');
        Alert.alert(
          'Lỗi dữ liệu',
          'Địa chỉ này thiếu thông tin thành phố. Vui lòng xóa và tạo lại địa chỉ mới.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }
    }
  }, []);

  const addressTypes = [
    { type: 'Nhà riêng', icon: 'home' as keyof typeof Ionicons.glyphMap },
    { type: 'Cơ quan', icon: 'business' as keyof typeof Ionicons.glyphMap },
    { type: 'Khác', icon: 'location' as keyof typeof Ionicons.glyphMap }
  ];

  const handleBackPress = () => {
    router.back();
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!(formData.street || '').trim()) {
      newErrors.street = 'Vui lòng nhập địa chỉ đường';
    }

    // City, province, postalCode sẽ tự động được điền từ search
    // Chỉ validate nếu chúng vẫn trống sau khi search
    if (!(formData.city || '').trim()) {
      newErrors.city = 'Vui lòng chọn địa chỉ từ danh sách gợi ý';
    }

    if (!(formData.province || '').trim()) {
      newErrors.province = 'Vui lòng chọn địa chỉ từ danh sách gợi ý';
    }

    if (!(formData.postalCode || '').trim()) {
      newErrors.postalCode = 'Vui lòng chọn địa chỉ từ danh sách gợi ý';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Build address data with proper validation
      const addressData: AddressData = {
        street: formData.street?.trim() || '',
        city: formData.city?.trim() || '',
        province: formData.province?.trim() || '',
        postalCode: formData.postalCode?.trim() || '',
        latitude: formData.latitude,
        longitude: formData.longitude
      };

      // Additional validation to ensure no empty strings are sent
      if (!addressData.street) {
        Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ đường');
        return;
      }
      if (!addressData.city) {
        Alert.alert('Lỗi', 'Vui lòng nhập thành phố');
        return;
      }
      if (!addressData.province) {
        Alert.alert('Lỗi', 'Vui lòng nhập tỉnh/quận');
        return;
      }
      if (!addressData.postalCode) {
        Alert.alert('Lỗi', 'Vui lòng nhập mã bưu điện');
        return;
      }

      // Log data for debugging
      if (__DEV__) {
        console.log('💾 Saving address data:', addressData);
        console.log('🔧 Edit mode:', isEditMode);
        console.log('🆔 Address ID:', addressId);
      }

      let response;
      
      if (isEditMode && addressId) {
        // Update existing address
        response = await addressService.updateAddress(addressId, addressData);
        
        if (response && response.addressId) {
          Alert.alert(
            'Thành công',
            'Địa chỉ đã được cập nhật!',
            [
              {
                text: 'OK',
                onPress: () => router.back()
              }
            ]
          );
        } else {
          Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
        }
      } else {
        // Create new address
        response = await addressService.createAddress(addressData);

        if (response && response.addressId) {
          Alert.alert(
            'Thành công',
            'Địa chỉ đã được thêm mới!',
            [
              {
                text: 'OK',
                onPress: () => router.back()
              }
            ]
          );
        } else {
          Alert.alert('Lỗi', 'Có lỗi xảy ra. Vui lòng thử lại.');
        }
      }
    } catch (error: any) {
      console.error('❌ Save address error:', error);
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
            <Text style={styles.headerTitle}>
              {isEditMode ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isEditMode ? 'Cập nhật thông tin địa chỉ của bạn' : 'Điền thông tin địa chỉ để được hỗ trợ dịch vụ'}
            </Text>
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Thông tin cơ bản */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin địa chỉ</Text>
            
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Text style={styles.inputLabel}>Địa chỉ đường</Text>
                <Text style={styles.requiredMark}>*</Text>
              </View>
              <TouchableOpacity 
                style={[styles.addressSearchButton, errors.street && styles.inputError]} 
                onPress={() => setShowAddressModal(true)}
              >
                <Ionicons name="location" size={20} color="#609CEF" />
                <Text style={[styles.addressSearchText, !formData.street && styles.addressSearchPlaceholder]}>
                  {formData.street || 'Tìm kiếm địa chỉ...'}
                </Text>
                <Ionicons name="search" size={20} color="#6B7280" />
              </TouchableOpacity>
              {errors.street && <Text style={styles.errorText}>{errors.street}</Text>}
            </View>

            <InputField
              label="Thành phố"
              value={formData.city || ''}
              onChangeText={(text) => updateFormData('city', text)}
              placeholder="VD: Thành phố Hồ Chí Minh"
              required
              error={errors.city}
              readonly={false}
            />

            <InputField
              label="Phường/Quận"
              value={formData.province || ''}
              onChangeText={(text) => updateFormData('province', text)}
              placeholder="VD: Phường Tân Phú, Quận 7"
              required
              error={errors.province}
              readonly={false}
            />

            <InputField
              label="Mã bưu điện"
              value={formData.postalCode || ''}
              onChangeText={(text) => updateFormData('postalCode', text)}
              placeholder="VD: 700000"
              required
              error={errors.postalCode}
              readonly={false}
            />
          </View>

          {/* Tọa độ (tùy chọn) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tọa độ GPS (Tùy chọn)</Text>
            
            <View style={styles.coordinatesRow}>
              <View style={styles.coordinateField}>
                <InputField
                  label="Vĩ độ"
                  value={formData.latitude?.toString() || ''}
                  onChangeText={(text) => {
                    const value = text ? parseFloat(text) : undefined;
                    updateFormData('latitude', value);
                  }}
                  placeholder="VD: 10.737015"
                />
              </View>
              
              <View style={styles.coordinateField}>
                <InputField
                  label="Kinh độ"
                  value={formData.longitude?.toString() || ''}
                  onChangeText={(text) => {
                    const value = text ? parseFloat(text) : undefined;
                    updateFormData('longitude', value);
                  }}
                  placeholder="VD: 106.721548"
                />
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.getCurrentLocationButton}
              onPress={async () => {
                try {
                  setLoading(true);
                  
                  // Request location permission
                  const { status } = await Location.requestForegroundPermissionsAsync();
                  if (status !== 'granted') {
                    Alert.alert('Lỗi', 'Vui lòng cấp quyền truy cập vị trí để sử dụng tính năng này');
                    setLoading(false);
                    return;
                  }

                  // Get current location
                  const location = await Location.getCurrentPositionAsync({});
                  const { latitude, longitude } = location.coords;
                  
                  // Update coordinates
                  updateFormData('latitude', latitude);
                  updateFormData('longitude', longitude);
                  
                  // Reverse geocode to get address components
                  try {
                    const result = await locationService.reverseGeocode(latitude, longitude);
                    
                    if (result) {
                      // Parse address components
                      const parsed = locationService.parseAddressComponents(result);
                      
                      // Update all address fields
                      updateFormData('street', parsed.street || result.display_name);
                      updateFormData('city', parsed.city);
                      updateFormData('province', parsed.province);
                      updateFormData('postalCode', parsed.postalCode);
                      
                      Alert.alert('Thành công', 'Đã lấy vị trí và địa chỉ hiện tại!');
                    } else {
                      Alert.alert('Thành công', 'Đã lấy tọa độ. Vui lòng điền thông tin địa chỉ thủ công.');
                    }
                  } catch (geocodeError) {
                    console.error('Reverse geocode error:', geocodeError);
                    Alert.alert('Cảnh báo', 'Đã lấy tọa độ nhưng không thể tự động điền địa chỉ. Vui lòng điền thủ công.');
                  }
                } catch (error) {
                  console.error('Get location error:', error);
                  Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại');
                } finally {
                  setLoading(false);
                }
              }}
            >
              <Ionicons name="location" size={16} color="#609CEF" />
              <Text style={styles.getCurrentLocationText}>Lấy vị trí hiện tại</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity onPress={handleBackPress} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={loading}>
            {loading ? (
              <View style={styles.buttonLoadingContainer}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.saveButtonText}>
                  {isEditMode ? 'Đang cập nhật...' : 'Đang lưu...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditMode ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Address Search Modal */}
      <AddressSearchModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onAddressSelect={(address, lat, lng, components) => {
          updateFormData('latitude', lat);
          updateFormData('longitude', lng);
          
          // Auto-parse and fill other fields using locationService
          if (components) {
            // Check if we have parsed components from getCurrentLocation
            if (components.parsed) {
              const parsed = components.parsed;
              updateFormData('street', parsed.street || address);
              updateFormData('city', parsed.city);
              updateFormData('province', parsed.province);
              updateFormData('postalCode', parsed.postalCode);
            } else {
              // Parse from raw address components
              const parsed = locationService.parseAddressComponents(components);
              updateFormData('street', parsed.street || address);
              updateFormData('city', parsed.city);
              updateFormData('province', parsed.province);
              updateFormData('postalCode', parsed.postalCode);
            }
          } else {
            // Fallback: only update street
            updateFormData('street', address);
            updateFormData('city', 'Thành phố Hồ Chí Minh');
            updateFormData('province', 'Quận 1');
            updateFormData('postalCode', '700000');
          }
        }}
        initialValue={formData.street}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingBottom: 24,
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
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 18,
  },
  formContainer: {
    flex: 1,
    paddingTop: 16,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  requiredMark: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#F9FAFB',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  typeSelectionContainer: {
    marginBottom: 16,
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#609CEF',
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: 'transparent',
  },
  selectedTypeButton: {
    backgroundColor: '#609CEF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#609CEF',
    marginLeft: 6,
  },
  selectedTypeButtonText: {
    color: 'white',
  },
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6B7280',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#609CEF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  buttonLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coordinatesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  coordinateField: {
    flex: 1,
    marginHorizontal: 4,
  },
  getCurrentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#609CEF',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  getCurrentLocationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#609CEF',
    marginLeft: 6,
  },
  readonlyInput: {
    backgroundColor: '#F3F4F6',
    color: '#6B7280',
  },
  addressSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  addressSearchText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  addressSearchPlaceholder: {
    color: '#9CA3AF',
    fontWeight: '400',
  },
});

export default withCustomerAuth(AddAddress, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});