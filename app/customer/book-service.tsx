import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  TextInput, 
  Image,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';

interface FormData {
  customerName: string;
  phoneNumber: string;
  address: string;
  notes: string;
  images: string[];
}

export default function BookService() {
  const params = useLocalSearchParams();
  const serviceName = params.serviceName as string || 'Dịch vụ';
  const servicePrice = params.servicePrice as string || 'Liên hệ';

  const [formData, setFormData] = useState<FormData>({
    customerName: '',
    phoneNumber: '',
    address: '',
    notes: '',
    images: []
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleBackPress = () => {
    router.back();
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Vui lòng nhập tên khách hàng';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10,11}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const pickImage = async () => {
    Alert.alert(
      'Thêm ảnh',
      'Tính năng thêm ảnh sẽ được cập nhật trong phiên bản tiếp theo.',
      [{ text: 'OK' }]
    );
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    if (validateForm()) {
      Alert.alert(
        'Xác nhận đặt lịch',
        `Bạn có muốn đặt lịch ${serviceName} không?`,
        [
          { text: 'Hủy', style: 'cancel' },
          { 
            text: 'Đặt ngay', 
            style: 'default',
            onPress: () => {
              // Navigate to booking confirmation screen
              router.push({
                pathname: './booking-confirmation' as any,
                params: {
                  serviceName: serviceName,
                  servicePrice: servicePrice,
                  customerName: formData.customerName,
                  phoneNumber: formData.phoneNumber,
                  address: formData.address,
                  notes: formData.notes,
                },
              });
            }
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
            <Text style={styles.label}>
              Tên khách hàng <Text style={styles.required}>*</Text>
            </Text>
            <View style={[
              styles.inputContainer,
              errors.customerName && styles.inputError
            ]}>
              <TextInput
                style={styles.textInput}
                placeholder="Nhập tên của bạn"
                placeholderTextColor="#9CA3AF"
                value={formData.customerName}
                onChangeText={(value) => handleInputChange('customerName', value)}
              />
            </View>
            {errors.customerName && (
              <Text style={styles.errorText}>{errors.customerName}</Text>
            )}
          </View>

          {/* Phone Number */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Số điện thoại <Text style={styles.required}>*</Text>
            </Text>
            <View style={[
              styles.inputContainer,
              errors.phoneNumber && styles.inputError
            ]}>
              <TextInput
                style={styles.textInput}
                placeholder="0901234567"
                placeholderTextColor="#9CA3AF"
                value={formData.phoneNumber}
                onChangeText={(value) => handleInputChange('phoneNumber', value)}
                keyboardType="phone-pad"
                maxLength={11}
              />
            </View>
            {errors.phoneNumber && (
              <Text style={styles.errorText}>{errors.phoneNumber}</Text>
            )}
          </View>

          {/* Address */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Địa chỉ cụ thể <Text style={styles.required}>*</Text>
            </Text>
            <View style={[
              styles.inputContainer,
              styles.textAreaContainer,
              errors.address && styles.inputError
            ]}>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Số 25, Đường Phạm Hùng Thái, Phường Bến Thành, Quận 1, TP.Hồ Chí Minh"
                placeholderTextColor="#9CA3AF"
                value={formData.address}
                onChangeText={(value) => handleInputChange('address', value)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            {errors.address && (
              <Text style={styles.errorText}>{errors.address}</Text>
            )}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.label}>Ghi chú thêm về vị trí</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Gần cổng viên Lê Thị Riêng, nhà có cổng..."
                placeholderTextColor="#9CA3AF"
                value={formData.notes}
                onChangeText={(value) => handleInputChange('notes', value)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Images */}
          <View style={styles.section}>
            <Text style={styles.label}>Ảnh/Video (Tối đa 4)</Text>
            
            <View style={styles.imageContainer}>
              {formData.images.map((imageUri, index) => (
                <View key={index} style={styles.imagePreview}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
              
              {formData.images.length < 4 && (
                <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
                  <Ionicons name="camera" size={24} color="#609CEF" />
                  <Text style={styles.addImageText}>+ Thêm ảnh</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <LinearGradient
              colors={['#609CEF', '#4F8BE8', '#3D7CE0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              <Text style={styles.submitText}>Đặt ngay</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    gap: 12,
  },
  imagePreview: {
    width: 80,
    height: 80,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    fontSize: 12,
    color: '#609CEF',
    fontWeight: '600',
    marginTop: 4,
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
});