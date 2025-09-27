import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  required?: boolean;
}

function InputField({ label, value, onChangeText, placeholder, multiline = false, numberOfLines = 1, required = false }: InputFieldProps) {
  return (
    <View style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        {required && <Text style={styles.requiredMark}>*</Text>}
      </View>
      <TextInput
        style={[styles.textInput, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={multiline}
        numberOfLines={numberOfLines}
        placeholderTextColor="#9CA3AF"
        textAlignVertical={multiline ? 'top' : 'center'}
      />
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

export default function AddAddress() {
  const [formData, setFormData] = useState({
    title: '',
    selectedType: 'Nhà riêng',
    detailAddress: '',
    district: 'Quận 1, TP Hồ Chí Minh',
    phoneNumber: '0901234567',
    note: ''
  });

  const addressTypes = [
    { type: 'Nhà riêng', icon: 'home' as keyof typeof Ionicons.glyphMap },
    { type: 'Cơ quan', icon: 'business' as keyof typeof Ionicons.glyphMap },
    { type: 'Khác', icon: 'location' as keyof typeof Ionicons.glyphMap }
  ];

  const handleBackPress = () => {
    router.back();
  };

  const handleSave = () => {
    // Validate form
    if (!formData.title.trim() || !formData.detailAddress.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // Create new address object
    const newAddress = {
      id: Date.now().toString(),
      type: formData.selectedType,
      name: formData.title,
      address: formData.detailAddress,
      phone: formData.phoneNumber,
      details: formData.note || 'Không có ghi chú',
      isDefault: false
    };

    console.log('Saving address:', newAddress);
    
    // Show success message
    Alert.alert(
      'Thành công', 
      'Địa chỉ đã được lưu thành công!',
      [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back with the new address data
            router.back();
          }
        }
      ]
    );
  };

  const updateFormData = (field: string, value: string) => {
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
            <Text style={styles.headerTitle}>Thêm địa chỉ mới</Text>
            <Text style={styles.headerSubtitle}>Điền thông tin địa chỉ để được hỗ trợ dịch vụ</Text>
          </View>
        </LinearGradient>

        {/* Form Content */}
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          {/* Thông tin cơ bản */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
            
            <InputField
              label="Tiêu đề địa chỉ"
              value={formData.title}
              onChangeText={(text) => updateFormData('title', text)}
              placeholder="VD: Nhà riêng, Cơ quan, Nhà bạn..."
              required
            />

            <View style={styles.typeSelectionContainer}>
              <View style={styles.labelContainer}>
                <Text style={styles.inputLabel}>Loại địa chỉ</Text>
                <Text style={styles.requiredMark}>*</Text>
              </View>
              <View style={styles.typeButtonsContainer}>
                {addressTypes.map((item) => (
                  <AddressTypeButton
                    key={item.type}
                    type={item.type}
                    icon={item.icon}
                    isSelected={formData.selectedType === item.type}
                    onPress={() => updateFormData('selectedType', item.type)}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* Chi tiết địa chỉ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chi tiết địa chỉ</Text>
            
            <InputField
              label="Địa chỉ cụ thể"
              value={formData.detailAddress}
              onChangeText={(text) => updateFormData('detailAddress', text)}
              placeholder="Nhập số nhà, tên đường, phường/xã, quận/huyện"
              multiline
              numberOfLines={3}
              required
            />
          </View>

          {/* Số điện thoại liên lạc */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Số điện thoại liên lạc</Text>
            
            <InputField
              label="Số điện thoại liên hệ"
              value={formData.phoneNumber}
              onChangeText={(text) => updateFormData('phoneNumber', text)}
              placeholder="Nhập số điện thoại"
              required
            />
          </View>

          {/* Thông tin liên hệ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
            
            <InputField
              label="Ghi chú thêm"
              value={formData.note}
              onChangeText={(text) => updateFormData('note', text)}
              placeholder="Mô tả thêm về vị trí, cách thức tiếp cận nhà. (Tùy chọn)"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity onPress={handleBackPress} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Lưu địa chỉ</Text>
          </TouchableOpacity>
        </View>
      </View>
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
});