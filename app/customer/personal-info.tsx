import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import withCustomerAuth from '../../lib/auth/withCustomerAuth';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  editable?: boolean;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
}

function InputField({ label, value, onChangeText, placeholder, editable = true, rightIcon, onRightIconPress, keyboardType = 'default' }: InputFieldProps) {
  return (
    <View style={styles.inputFieldOnly}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.textInput, !editable && styles.disabledInput]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          editable={editable}
          keyboardType={keyboardType}
          placeholderTextColor="#9CA3AF"
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIconButton}>
            <Ionicons name={rightIcon} size={20} color="#609CEF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function PersonalProfile() {
  const [formData, setFormData] = useState({
    fullName: 'Zun Zun',
    birthDate: '08/15/1990',
    gender: 'Nam',
    phoneNumber: '0901234567',
    email: 'ZunZun@gmail.com'
  });

  const handleBackPress = () => {
    router.back();
  };

  const handleSave = () => {
    console.log('Saving profile data:', formData);
    // Implement save functionality
    router.back();
  };

  const handleDatePicker = () => {
    console.log('Open date picker');
    // Implement date picker
  };

  const handleChangeAvatar = () => {
    console.log('Change avatar');
    // Implement avatar change functionality
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
          
          <Text style={styles.headerTitle}>Hồ Sơ Cá Nhân</Text>
          
          {/* Profile Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>Z</Text>
            </View>
            <TouchableOpacity onPress={handleChangeAvatar} style={styles.changeAvatarButton}>
              <Text style={styles.changeAvatarText}>Thay đổi ảnh đại diện</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Form Content */}
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          {/* Thông tin cơ bản */}
          <Section title="📋 Thông tin cơ bản">
            <View style={styles.inputContainer}>
              <InputField
                label="HỌ VÀ TÊN"
                value={formData.fullName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
                placeholder="Nhập họ và tên"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <InputField
                label="NGÀY SINH"
                value={formData.birthDate}
                onChangeText={(text) => setFormData(prev => ({ ...prev, birthDate: text }))}
                placeholder="DD/MM/YYYY"
                rightIcon="calendar-outline"
                onRightIconPress={handleDatePicker}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <InputField
                label="GIỚI TÍNH"
                value={formData.gender}
                onChangeText={(text) => setFormData(prev => ({ ...prev, gender: text }))}
                placeholder="Chọn giới tính"
              />
            </View>
          </Section>

          <Section title="📞 Thông tin liên hệ">
            <View style={styles.fieldWithBadge}>
              <InputField
                label="SỐ ĐIỆN THOẠI"
                value={formData.phoneNumber}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phoneNumber: text }))}
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
              />
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>ĐÃ XÁC THỰC</Text>
              </View>
            </View>
            
            <View style={styles.fieldWithBadge}>
              <InputField
                label="EMAIL"
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="Nhập email"
                keyboardType="email-address"
              />
              <View style={styles.unverifiedContainer}>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>ĐÃ XÁC THỰC</Text>
                </View>
              </View>
            </View>
          </Section>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity onPress={handleBackPress} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Quay lại</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Lưu tất cả</Text>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#609CEF',
  },
  changeAvatarButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  changeAvatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
    overflow: 'hidden',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  inputFieldOnly: {
    marginBottom: 0,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    paddingVertical: 8,
  },
  disabledInput: {
    color: '#9CA3AF',
  },
  rightIconButton: {
    padding: 8,
  },
  fieldWithBadge: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  unverifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  unverifiedBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  unverifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  verifyLink: {
    paddingVertical: 4,
  },
  verifyLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#609CEF',
    textDecorationLine: 'underline',
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

export default withCustomerAuth(PersonalProfile, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});