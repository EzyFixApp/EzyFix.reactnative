import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';
import { useAuthStore } from '~/store/authStore';
import { techniciansService } from '../../lib/api/technicians';
import type { TechnicianProfile } from '../../types/api';

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
  verified?: boolean;
  unverified?: boolean;
}

function InputField({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  editable = true, 
  rightIcon, 
  onRightIconPress, 
  keyboardType = 'default',
  verified = false,
  unverified = false
}: InputFieldProps) {
  return (
    <View style={styles.inputFieldOnly}>
      <View style={styles.labelRow}>
        <Text style={styles.inputLabel}>{label}</Text>
        {verified && (
          <View style={styles.verifiedBadgeInline}>
            <Text style={styles.verifiedText}>ĐÃ XÁC THỰC</Text>
          </View>
        )}
        {unverified && (
          <View style={styles.unverifiedBadgeInline}>
            <Text style={styles.unverifiedText}>CHƯA XÁC THỰC</Text>
          </View>
        )}
      </View>
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
      {unverified && (
        <TouchableOpacity style={styles.verifyLink}>
          <Text style={styles.verifyLinkText}>Xác thực ngay</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface SocialLinkProps {
  platform: 'Google' | 'Facebook' | 'Apple';
  email?: string;
  isConnected: boolean;
  onPress: () => void;
}

function SocialLink({ platform, email, isConnected, onPress }: SocialLinkProps) {
  const getIcon = () => {
    switch (platform) {
      case 'Google':
        return 'logo-google';
      case 'Facebook':  
        return 'logo-facebook';
      case 'Apple':
        return 'logo-apple';
      default:
        return 'link-outline';
    }
  };

  const getColor = () => {
    switch (platform) {
      case 'Google':
        return '#DB4437';
      case 'Facebook':
        return '#4267B2';
      case 'Apple':
        return '#000000';
      default:
        return '#609CEF';
    }
  };

  return (
    <View style={styles.socialLinkItem}>
      <View style={styles.socialLinkLeft}>
        <View style={[styles.socialIcon, { backgroundColor: `${getColor()}15` }]}>
          <Ionicons name={getIcon()} size={24} color={getColor()} />
        </View>
        <View style={styles.socialTextContainer}>
          <Text style={styles.socialPlatform}>{platform}</Text>
          {email && <Text style={styles.socialEmail}>{email}</Text>}
        </View>
      </View>
      
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.socialButton,
          isConnected ? styles.connectedButton : styles.connectButton
        ]}
      >
        <Text style={[
          styles.socialButtonText,
          isConnected ? styles.connectedButtonText : styles.connectButtonText
        ]}>
          {isConnected ? 'Hủy liên kết' : 'Liên kết'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function TechnicianPersonalInfo() {
  const { user } = useAuthStore();
  
  // Profile data state
  const [technicianProfile, setTechnicianProfile] = useState<TechnicianProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    certification: '',
    yearsOfExperience: 0,
    hourlyRate: 0,
  });

  const [socialConnections, setSocialConnections] = useState({
    google: false,
    facebook: false,
    apple: false
  });

  // Load technician profile on mount
  useEffect(() => {
    loadTechnicianProfile();
  }, [user?.id]);

  const loadTechnicianProfile = async () => {
    try {
      if (!user?.id) {
        if (__DEV__) console.warn('⚠️ No user ID available for profile fetch');
        return;
      }

      setLoadingProfile(true);
      const profile = await techniciansService.getTechnicianProfile(user.id);
      setTechnicianProfile(profile);
      
      // Populate form data
      setFormData({
        fullName: `${profile.firstName} ${profile.lastName}`,
        phoneNumber: profile.phone || '',
        email: profile.email || '',
        certification: profile.certification || '',
        yearsOfExperience: profile.yearsOfExperience || 0,
        hourlyRate: profile.hourlyRate || 0,
      });
      
      if (__DEV__) {
        console.log('✅ Profile loaded in personal-info:', {
          name: `${profile.firstName} ${profile.lastName}`,
          phone: profile.phone,
          email: profile.email,
        });
      }
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to load profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };
  
  // Helper function to get avatar initial
  const getAvatarInitial = () => {
    if (technicianProfile) {
      return technicianProfile.firstName?.charAt(0)?.toUpperCase() || 'T';
    }
    return user?.fullName?.charAt(0)?.toUpperCase() || 'T';
  };
  
  // Format money helper
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleSave = () => {
    console.log('Saving technician profile data:', formData);
    // TODO: Implement API update functionality
    router.back();
  };

  const handleDatePicker = () => {
    console.log('Open date picker');
    // TODO: Implement date picker
  };

  const handleSocialToggle = (platform: 'google' | 'facebook' | 'apple') => {
    setSocialConnections(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
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
            {loadingProfile ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="white" />
              </View>
            ) : (
              <>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>{getAvatarInitial()}</Text>
                </View>
                <TouchableOpacity onPress={handleChangeAvatar} style={styles.changeAvatarButton}>
                  <Text style={styles.changeAvatarText}>Thay đổi ảnh đại diện</Text>
                </TouchableOpacity>
                <Text style={styles.profileName}>{formData.fullName}</Text>
              </>
            )}
          </View>
        </LinearGradient>

        {/* Form Content */}
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          {loadingProfile ? (
            <View style={styles.formLoadingContainer}>
              <ActivityIndicator size="large" color="#609CEF" />
              <Text style={styles.loadingText}>Đang tải thông tin...</Text>
            </View>
          ) : (
            <>
              {/* Thông tin cơ bản */}
              <Section title="Thông tin cơ bản">
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
                    label="SỐ ĐIỆN THOẠI"
                    value={formData.phoneNumber}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, phoneNumber: text }))}
                    placeholder="Nhập số điện thoại"
                    keyboardType="phone-pad"
                    verified={!!formData.phoneNumber}
                    editable={false}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <InputField
                    label="EMAIL"
                    value={formData.email}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                    placeholder="Nhập email"
                    keyboardType="email-address"
                    verified={!!formData.email}
                    editable={false}
                  />
                </View>
              </Section>

              {/* Thông tin nghề nghiệp */}
              <Section title="Thông tin nghề nghiệp">
                <View style={styles.inputContainer}>
                  <InputField
                    label="CHỨNG CHỈ"
                    value={formData.certification}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, certification: text }))}
                    placeholder="Chứng chỉ chuyên môn"
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <InputField
                    label="KINH NGHIỆM"
                    value={`${formData.yearsOfExperience}`}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 0;
                      setFormData(prev => ({ ...prev, yearsOfExperience: num }));
                    }}
                    placeholder="Số năm kinh nghiệm"
                    keyboardType="numeric"
                    rightIcon="calendar-outline"
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <InputField
                    label="GIÁ MỖI GIỜ"
                    value={formData.hourlyRate.toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text.replace(/[^0-9]/g, '')) || 0;
                      setFormData(prev => ({ ...prev, hourlyRate: num }));
                    }}
                    placeholder="Giá dịch vụ"
                    keyboardType="numeric"
                    rightIcon="cash-outline"
                  />
                </View>
                
                {technicianProfile && technicianProfile.skills && technicianProfile.skills.length > 0 && (
                  <View style={styles.skillsDisplayContainer}>
                    <Text style={styles.skillsDisplayLabel}>KỸ NĂNG</Text>
                    <View style={styles.skillsChipsContainer}>
                      {technicianProfile.skills.map((skill, index) => (
                        <View key={index} style={styles.skillChip}>
                          <Text style={styles.skillChipText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </Section>

              {/* Thống kê */}
              {technicianProfile && (
                <Section title="Thống kê hoạt động">
                  <View style={styles.statsContainer}>
                    <View style={styles.statItemBox}>
                      <View style={styles.statIconCircle}>
                        <Ionicons name="star" size={28} color="#FFB800" />
                      </View>
                      <Text style={styles.statValue}>{technicianProfile.averageRating.toFixed(1)}</Text>
                      <Text style={styles.statLabel}>Đánh giá</Text>
                    </View>
                    
                    <View style={styles.statItemBox}>
                      <View style={styles.statIconCircle}>
                        <Ionicons name="chatbubble-ellipses" size={28} color="#609CEF" />
                      </View>
                      <Text style={styles.statValue}>{technicianProfile.totalReviews}</Text>
                      <Text style={styles.statLabel}>Nhận xét</Text>
                    </View>
                  </View>
                  
                  <View style={styles.statusContainer}>
                    <View style={styles.statusBox}>
                      <Ionicons 
                        name={technicianProfile.availabilityStatus === 'AVAILABLE' ? 'checkmark-circle' : 'time'} 
                        size={24} 
                        color={technicianProfile.availabilityStatus === 'AVAILABLE' ? '#10B981' : '#F59E0B'} 
                      />
                      <Text style={styles.statusLabel}>Trạng thái hiện tại</Text>
                      <Text style={[
                        styles.statusValue,
                        { color: technicianProfile.availabilityStatus === 'AVAILABLE' ? '#10B981' : '#F59E0B' }
                      ]}>
                        {technicianProfile.availabilityStatus === 'AVAILABLE' ? 'Sẵn sàng nhận việc' : 
                         technicianProfile.availabilityStatus === 'BUSY' ? 'Đang bận' : 'Không hoạt động'}
                      </Text>
                    </View>
                  </View>
                </Section>
              )}
            </>
          )}

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
    marginBottom: 8,
  },
  changeAvatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  formLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 12,
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
  verifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.3,
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
    fontSize: 9,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.3,
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
  socialLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  socialLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  socialIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  socialTextContainer: {
    flex: 1,
  },
  socialPlatform: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  socialEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  socialButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  connectButton: {
    backgroundColor: '#609CEF',
  },
  connectedButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#609CEF',
  },
  socialButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  connectButtonText: {
    color: 'white',
  },
  connectedButtonText: {
    color: '#609CEF',
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
  skillsDisplayContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  skillsDisplayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  skillsChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#609CEF',
  },
  skillChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#609CEF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 12,
  },
  statItemBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  statusContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    flex: 1,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  
  // Inline badge styles
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 8,
    minHeight: 16,
  },
  verifiedBadgeInline: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
    alignSelf: 'center',
    height: 16,
    justifyContent: 'center',
  },
  unverifiedBadgeInline: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
    alignSelf: 'center',
    height: 16,
    justifyContent: 'center',
  },
});

// Export protected component
export default withTechnicianAuth(TechnicianPersonalInfo, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});