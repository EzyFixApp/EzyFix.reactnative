import React, { useState, useRef, useEffect } from 'react';
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
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { authService } from '../../lib/api/auth';
import type { ForgotPasswordRequest } from '../../types/api';

const { width } = Dimensions.get('window');

export default function TechnicianResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Animation values
  const slideAnim = useRef(new Animated.Value(width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(-50)).current;
  const formAnim = useRef(new Animated.Value(30)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startEnterAnimation();
    
    // Debug logging to check parameters
    if (__DEV__) {
      console.group('🔍 Technician Reset Password Screen Parameters');
      console.log('📧 Email:', email);
      console.log('✅ Email present:', !!email);
      console.groupEnd();
    }
  }, []);

  const startEnterAnimation = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(headerAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(formAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Validate password strength
  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    return null;
  };

  // Show success modal with animation
  const showSuccessModal = () => {
    setShowSuccess(true);
    
    Animated.parallel([
      Animated.spring(successScale, {
        toValue: 1,
        tension: 150,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Hide success modal and navigate
  const hideSuccessModal = () => {
    Animated.parallel([
      Animated.timing(successScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(successOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccess(false);
      router.replace('/technician/login');
    });
  };

  // Handle password reset
  const handleResetPassword = async () => {
    setError('');

    // Validate inputs
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (!email) {
      setError('Thông tin email không hợp lệ');
      return;
    }

    setIsLoading(true);

    try {
      const resetPasswordData: ForgotPasswordRequest = {
        email: email.trim().toLowerCase(),
        newPassword,
      };

      await authService.forgotPassword(resetPasswordData);
      
      if (__DEV__) {
        console.log('✅ Password reset successful', { email });
      }

      // Show success modal
      showSuccessModal();
      
      // Auto hide after 3 seconds
      setTimeout(() => {
        hideSuccessModal();
      }, 3000);

    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ Password reset failed', error);
      }
      setError(error.reason || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateX: slideAnim }]
        }
      ]}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              transform: [{ translateY: headerAnim }]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <View style={styles.backIconContainer}>
              <Text style={styles.backIcon}>‹</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          {/* Content */}
          <View style={styles.content}>
            
            {/* Welcome Section */}
            <Animated.View 
              style={[
                styles.welcomeSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: formAnim }]
                }
              ]}
            >
              <Text style={styles.greeting}>Tạo mật khẩu mới</Text>
              <Text style={styles.subGreeting}>
                Mật khẩu mới phải khác với mật khẩu cũ và có ít nhất 6 ký tự
              </Text>
            </Animated.View>

            {/* Error Display */}
            {error ? (
              <Animated.View 
                style={[
                  styles.errorContainer,
                  {
                    opacity: fadeAnim,
                  }
                ]}
              >
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            {/* Form Section */}
            <Animated.View 
              style={[
                styles.formSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: formAnim }]
                }
              ]}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mật khẩu mới</Text>
                <TextInput
                  style={[
                    styles.input,
                    error && error.includes('6 ký tự') ? styles.inputError : null,
                  ]}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (error) setError('');
                  }}
                  placeholder="Nhập mật khẩu mới"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
                <TextInput
                  style={[
                    styles.input,
                    error && error.includes('không khớp') ? styles.inputError : null,
                  ]}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (error) setError('');
                  }}
                  placeholder="Nhập lại mật khẩu mới"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  (!newPassword || !confirmPassword || isLoading) && styles.disabledButton,
                ]}
                onPress={handleResetPassword}
                disabled={!newPassword || !confirmPassword || isLoading}
                activeOpacity={0.9}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Đặt lại mật khẩu</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>

        {/* Success Modal */}
        {showSuccess && (
          <View style={styles.successOverlay}>
            <Animated.View 
              style={[
                styles.successModal,
                {
                  opacity: successOpacity,
                  transform: [{ scale: successScale }],
                },
              ]}
            >
              <View style={styles.successIcon}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              <Text style={styles.successTitle}>Thành công!</Text>
              <Text style={styles.successMessage}>
                Mật khẩu của bạn đã được đặt lại thành công! 
                Bạn sẽ được chuyển đến trang đăng nhập.
              </Text>
              <TouchableOpacity
                style={styles.successButton}
                onPress={hideSuccessModal}
              >
                <Text style={styles.successButtonText}>Đăng nhập ngay</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  safeArea: {
    flex: 1,
  },

  // Header Styles
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    marginTop: 20,
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
  },
  backIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#475569',
    fontWeight: '600',
    lineHeight: 24,
  },

  // Content Styles
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Welcome Section
  welcomeSection: {
    marginBottom: 40,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
    letterSpacing: 0.2,
  },

  // Form Section
  formSection: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },

  // Button Styles
  button: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 12,
  },
  primaryButton: {
    backgroundColor: '#609CEF',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  disabledButton: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },

  // Error styles
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Success Modal Styles
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  successModal: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 25,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#609CEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIconText: {
    fontSize: 40,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: '#609CEF',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});