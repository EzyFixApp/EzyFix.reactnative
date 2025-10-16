import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { authService } from '../lib/api/auth';
import type { RegisterRequest } from '../types/api';

interface CountryCode {
  name: string;
  code: string;
  flag: string;
  dialCode: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { name: 'Vietnam', code: 'VN', flag: '🇻🇳', dialCode: '+84' },
  { name: 'United States', code: 'US', flag: '🇺🇸', dialCode: '+1' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', dialCode: '+44' },
  { name: 'China', code: 'CN', flag: '🇨🇳', dialCode: '+86' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵', dialCode: '+81' },
  { name: 'South Korea', code: 'KR', flag: '🇰🇷', dialCode: '+82' },
  { name: 'Thailand', code: 'TH', flag: '🇹🇭', dialCode: '+66' },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬', dialCode: '+65' },
  { name: 'Malaysia', code: 'MY', flag: '🇲🇾', dialCode: '+60' },
  { name: 'Indonesia', code: 'ID', flag: '🇮🇩', dialCode: '+62' },
  { name: 'Philippines', code: 'PH', flag: '🇵🇭', dialCode: '+63' },
  { name: 'India', code: 'IN', flag: '🇮🇳', dialCode: '+91' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺', dialCode: '+61' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦', dialCode: '+1' },
  { name: 'France', code: 'FR', flag: '🇫🇷', dialCode: '+33' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪', dialCode: '+49' },
];

interface RegisterScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  userType: 'customer' | 'technician';
}

export default function RegisterScreen({
  onBack,
  onSuccess,
  userType,
}: RegisterScreenProps) {
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // OTP states
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOTP] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Validations
  const validateEmail = (text: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  const validatePhone = (text: string): boolean => {
    const phoneRegex = /^[0-9]{9,10}$/;
    return phoneRegex.test(text);
  };

  const validatePassword = (text: string): boolean => {
    return text.length >= 6;
  };

  const isFormValid = (): boolean => {
    return (
      firstName.trim().length >= 1 &&
      lastName.trim().length >= 1 &&
      validatePhone(phoneNumber) &&
      validateEmail(email) &&
      validatePassword(password) &&
      password === confirmPassword &&
      agreedToTerms
    );
  };

  // Handle registration
  const handleRegister = async () => {
    setError('');
    
    if (!isFormValid()) {
      if (firstName.trim().length < 1) {
        setError('Vui lòng nhập tên');
      } else if (lastName.trim().length < 1) {
        setError('Vui lòng nhập họ');
      } else if (!validatePhone(phoneNumber)) {
        setError('Số điện thoại không hợp lệ (9-10 chữ số)');
      } else if (!validateEmail(email)) {
        setError('Email không hợp lệ');
      } else if (!validatePassword(password)) {
        setError('Mật khẩu phải có ít nhất 6 ký tự');
      } else if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
      } else if (!agreedToTerms) {
        setError('Vui lòng đồng ý với điều khoản dịch vụ');
      }
      return;
    }

    setIsLoading(true);
    
    try {
      const registerData: RegisterRequest = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        phoneNumber: `${selectedCountry.dialCode}${phoneNumber}`,
        userType,
        acceptTerms: agreedToTerms,
      };

      const response = await authService.register(registerData);
      
      if (response.requiresEmailVerification) {
        // Send OTP
        await authService.sendOTP({
          email: email.trim().toLowerCase(),
          purpose: 'registration'
        });
        
        setShowOTPModal(true);
      } else {
        // Registration complete
        Alert.alert(
          'Thành công',
          'Đăng ký thành công! Vui lòng đăng nhập.',
          [{ text: 'OK', onPress: onSuccess }]
        );
      }
    } catch (error: any) {
      setError(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await authService.verifyOTP({
        email: email.trim().toLowerCase(),
        otp,
        purpose: 'registration'
      });

      if (response.isValid) {
        setShowOTPModal(false);
        Alert.alert(
          'Thành công',
          'Xác thực email thành công! Vui lòng đăng nhập.',
          [{ text: 'OK', onPress: onSuccess }]
        );
      } else {
        setError('Mã OTP không chính xác');
      }
    } catch (error: any) {
      setError(error.message || 'Xác thực thất bại. Vui lòng thử lại.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    try {
      await authService.sendOTP({
        email: email.trim().toLowerCase(),
        purpose: 'registration'
      });
      
      Alert.alert('Thành công', 'Mã OTP mới đã được gửi đến email của bạn');
    } catch (error: any) {
      setError(error.message || 'Không thể gửi lại OTP');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Đăng Ký</Text>
              <Text style={styles.subtitle}>
                {userType === 'customer' 
                  ? 'Tạo tài khoản để sử dụng dịch vụ' 
                  : 'Tạo tài khoản thợ sửa chữa'}
              </Text>
            </View>

            {/* Error Display */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tên</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên của bạn"
                placeholderTextColor="#94a3b8"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Họ</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập họ của bạn"
                placeholderTextColor="#94a3b8"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>

            {/* Phone Number with Country Code */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <View style={styles.phoneInputContainer}>
                <TouchableOpacity
                  style={styles.countryCodeButton}
                  onPress={() => setShowCountryPicker(true)}
                >
                  <Text style={styles.flagText}>{selectedCountry.flag}</Text>
                  <Text style={styles.dialCodeText}>{selectedCountry.dialCode}</Text>
                  <Text style={styles.chevronDown}>▼</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.phoneTextInput}
                  placeholder="Số điện thoại"
                  placeholderTextColor="#94a3b8"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>
                    {showPassword ? '👁️' : '🙈'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor="#94a3b8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text style={styles.eyeIcon}>
                    {showConfirmPassword ? '👁️' : '🙈'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms & Conditions */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                Tôi đồng ý với{' '}
                <Text style={styles.termsLink}>Điều khoản dịch vụ</Text>
                {' '}và{' '}
                <Text style={styles.termsLink}>Chính sách bảo mật</Text>
              </Text>
            </TouchableOpacity>

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                (!isFormValid() || isLoading) && styles.disabledButton,
              ]}
              onPress={handleRegister}
              disabled={!isFormValid() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.registerButtonText}>Đăng Ký</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={onBack}>
                <Text style={styles.loginLink}>Đăng nhập ngay</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Country Picker Modal */}
        <Modal
          visible={showCountryPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCountryPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn quốc gia</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowCountryPicker(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={COUNTRY_CODES}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.countryItem}
                    onPress={() => {
                      setSelectedCountry(item);
                      setShowCountryPicker(false);
                    }}
                  >
                    <Text style={styles.countryFlag}>{item.flag}</Text>
                    <Text style={styles.countryName}>{item.name}</Text>
                    <Text style={styles.countryDialCode}>{item.dialCode}</Text>
                    {selectedCountry.code === item.code && (
                      <Text style={styles.checkMark}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>
          </View>
        </Modal>

        {/* OTP Verification Modal */}
        <Modal
          visible={showOTPModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowOTPModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.otpModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Xác thực Email</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowOTPModal(false)}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.otpDescription}>
                Chúng tôi đã gửi mã xác thực 6 chữ số đến email:
              </Text>
              <Text style={styles.otpEmail}>{email}</Text>
              
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
              
              <TextInput
                style={styles.otpInput}
                placeholder="Nhập mã 6 chữ số"
                placeholderTextColor="#94a3b8"
                value={otp}
                onChangeText={setOTP}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
              />
              
              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  (otp.length !== 6 || isVerifying) && styles.disabledButton,
                ]}
                onPress={handleVerifyOTP}
                disabled={otp.length !== 6 || isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.verifyButtonText}>Xác Thực</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendOTP}
              >
                <Text style={styles.resendButtonText}>Gửi lại mã</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 24,
    color: '#475569',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 24,
  },
  titleContainer: {
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 6,
  },
  flagText: {
    fontSize: 24,
  },
  dialCodeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  chevronDown: {
    fontSize: 10,
    color: '#64748b',
    marginLeft: 2,
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  eyeButton: {
    padding: 12,
  },
  eyeIcon: {
    fontSize: 20,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 32,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#609CEF',
    borderColor: '#609CEF',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    fontWeight: '500',
  },
  termsLink: {
    color: '#609CEF',
    fontWeight: '700',
  },
  registerButton: {
    backgroundColor: '#609CEF',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#609CEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  disabledButton: {
    backgroundColor: '#e2e8f0',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 15,
    color: '#609CEF',
    fontWeight: '700',
  },
  // Country Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '600',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  countryFlag: {
    fontSize: 28,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  countryDialCode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  checkMark: {
    fontSize: 20,
    color: '#609CEF',
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 72,
  },
  // Error styles
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  // OTP Modal styles
  otpModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  otpDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  otpEmail: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  otpInput: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 24,
  },
  verifyButton: {
    backgroundColor: '#609CEF',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#609CEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resendButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  resendButtonText: {
    color: '#609CEF',
    fontSize: 15,
    fontWeight: '600',
  },
});
