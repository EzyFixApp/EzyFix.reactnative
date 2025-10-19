import React, { useState, useEffect, useRef } from 'react';
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
  Alert,
  StatusBar,
  Modal,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { authService } from '../lib/api/auth';
import { useAuthActions } from '../store/authStore';

// Global flag to prevent duplicate OTP sends across component remounts
let globalOtpSendingFlag: { [key: string]: boolean } = {};

interface OTPVerificationScreenProps {
  email: string;
  purpose: 'registration' | 'password-reset' | 'verification';
  userType?: 'customer' | 'technician';
  onBack?: () => void;
  onSuccess?: () => void;
}

export default function OTPVerificationScreen({
  email,
  purpose,
  userType = 'customer',
  onBack,
  onSuccess,
}: OTPVerificationScreenProps) {
  const { checkAuthStatus } = useAuthActions();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  
  // Use ref to track auto-send to prevent React strict mode double execution
  const hasAutoSentRef = useRef(false);
  const isFirstRender = useRef(true);
  
  // OTP attempts tracking
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [isOtpInvalid, setIsOtpInvalid] = useState(false);
  const maxOtpAttempts = 3;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const successModalAnim = useRef(new Animated.Value(0)).current;
  const successScaleAnim = useRef(new Animated.Value(0.5)).current;
  const successIconAnim = useRef(new Animated.Value(0)).current;

  // OTP input refs
  const otpInputRefs = useRef<Array<TextInput | null>>([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Auto-send OTP when component mounts
  useEffect(() => {
    const sendInitialOTP = async () => {
      // Create unique key for this email+purpose combination
      const otpKey = `${email}-${purpose}`;
      
      // Check global flag to prevent duplicate sends
      if (globalOtpSendingFlag[otpKey]) {
        return;
      }

      // Prevent duplicate auto-send using ref to survive React strict mode
      if (hasAutoSentRef.current) {
        return;
      }

      // Auto-send OTP for both registration and verification
      // Both cases need to verify email and set isVerify: true via /api/v1/auth/verify
      try {
        // Set both local and global flags before API call
        hasAutoSentRef.current = true;
        globalOtpSendingFlag[otpKey] = true;
        isFirstRender.current = false;
        
        const otpResponse = await authService.sendEmailOtp({
          email,
          purpose
        });
        
        setCountdown(60);
        setCanResend(false);
        setSuccessMessage('Mã OTP đã được gửi đến email của bạn');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
        
        // Clear global flag after 5 seconds to allow manual resend
        setTimeout(() => {
          globalOtpSendingFlag[otpKey] = false;
        }, 5000);
        
      } catch (error: any) {
        // Reset flags if failed
        hasAutoSentRef.current = false;
        globalOtpSendingFlag[otpKey] = false;
        isFirstRender.current = true;
        setError('Không thể gửi OTP. Vui lòng thử lại.');
        setCanResend(true);
      }
    };

    sendInitialOTP();
  }, []); // Remove dependencies to prevent re-runs

  // Start enter animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Show success modal with animation
  const showSuccessModalWithAnimation = () => {
    setShowSuccessModal(true);
    
    // Reset animations
    successModalAnim.setValue(0);
    successScaleAnim.setValue(0.5);
    successIconAnim.setValue(0);
    
    Animated.sequence([
      // First show modal backdrop
      Animated.timing(successModalAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // Then scale in the modal content
      Animated.parallel([
        Animated.spring(successScaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
        // Animate icon with delay
        Animated.timing(successIconAnim, {
          toValue: 1,
          duration: 400,
          delay: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  // Hide success modal with animation
  const hideSuccessModalWithAnimation = async () => {
    // First animate modal away
    await new Promise<void>((resolve) => {
      Animated.parallel([
        Animated.timing(successModalAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(successScaleAnim, {
          toValue: 0.5,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSuccessModal(false);
        resolve();
      });
    });
    
    // For registration, ensure auth store is fully refreshed before navigation
    if (purpose === 'registration') {
      try {
        await checkAuthStatus();
        if (__DEV__) {
          console.log('✅ Final auth refresh before navigation completed');
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('⚠️ Final auth refresh failed, proceeding with navigation:', error);
        }
      }
    }
    
    // Navigate to appropriate screen based on purpose
    if (purpose === 'registration') {
      // After successful registration verification, go to dashboard
      const dashboardRoute = userType === 'customer' 
        ? '/customer/dashboard' 
        : '/technician/dashboard';
      router.replace(dashboardRoute);
    } else {
      // For password reset, go to login screen
      const loginRoute = userType === 'customer' 
        ? '/customer/login' 
        : '/technician/login';
      router.replace(loginRoute);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (text: string, index: number) => {
    let newOtp = [...otp];
    
    if (text.length > 1) {
      // Handle paste scenario
      const otpArray = text.slice(0, 6).split('');
      otpArray.forEach((digit, i) => {
        if (i < 6) {
          newOtp[i] = digit;
        }
      });
      setOtp(newOtp);
      
      // Focus the next empty input or the last one
      const nextIndex = Math.min(otpArray.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      
      // Auto-submit if all 6 digits are filled
      const completeOtp = newOtp.join('');
      if (completeOtp.length === 6 && !isLoading && !isAutoSubmitting) {
        setIsAutoSubmitting(true);
        // Small delay for better UX
        setTimeout(() => {
          handleVerifyOtp(completeOtp);
        }, 300);
      }
    } else {
      // Handle single character input
      newOtp[index] = text;
      setOtp(newOtp);

      // Auto-focus next input
      if (text && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
      
      // Auto-submit if all 6 digits are filled
      const completeOtp = newOtp.join('');
      if (completeOtp.length === 6 && !isLoading && !isAutoSubmitting) {
        setIsAutoSubmitting(true);
        // Small delay for better UX - let user see the last digit
        setTimeout(() => {
          handleVerifyOtp(completeOtp);
        }, 500);
      }
    }
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
    
    // Reset auto-submit state when user manually changes OTP
    if (isAutoSubmitting) {
      setIsAutoSubmitting(false);
    }
  };

  // Handle OTP input key press
  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async (providedOtp?: string) => {
    const otpCode = providedOtp || otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số OTP');
      return;
    }

    // Prevent multiple simultaneous submissions
    if (isLoading || isAutoSubmitting) {
      return;
    }

    setIsLoading(true);
    setIsAutoSubmitting(false); // Reset auto-submit state
    setError('');

    try {
      if (purpose === 'registration') {
        // Registration verification
        if (__DEV__) {
          console.log('🔄 Verifying account...', { email, otp: otpCode });
        }
        
        const response = await authService.verifyAccount({
          email,
          otp: otpCode
        });

        if (__DEV__) {
          console.log('📥 Verify account response:', response);
        }

        // Check response more flexibly
        if (response && (
          response.isVerified === true || 
          String(response.isVerified) === 'true' || 
          response.message?.toLowerCase().includes('success') || 
          response.message?.toLowerCase().includes('thành công') ||
          response.message?.toLowerCase().includes('verified')
        )) {
          if (__DEV__) {
            console.log('✅ Account verified successfully', { email });
          }
          
          // Update local user verification status
          try {
            await authService.updateUserVerificationStatus(true);
            if (__DEV__) {
              console.log('✅ Local verification status updated');
            }
          } catch (updateError) {
            if (__DEV__) {
              console.warn('⚠️ Failed to update local verification status:', updateError);
            }
          }
          
          // Force refresh auth store to get updated user data
          try {
            await checkAuthStatus();
            if (__DEV__) {
              console.log('✅ Auth store refreshed with updated verification status');
            }
          } catch (refreshError) {
            if (__DEV__) {
              console.warn('⚠️ Failed to refresh auth store:', refreshError);
            }
          }
          
          if (onSuccess) {
            onSuccess();
          } else {
            showSuccessModalWithAnimation();
          }
        } else {
          if (__DEV__) {
            console.log('❌ Account verification failed:', response);
          }
          setError('Mã OTP không chính xác hoặc đã hết hạn');
        }
      } else {
        // Password reset validation using new checkOtp endpoint
        if (__DEV__) {
          console.log('🔄 Checking OTP for password reset...', { email, otp: otpCode });
        }
        const response = await authService.checkOtp({
          email,
          otp: otpCode,
          purpose: 'password-reset'
        });

        if (__DEV__) {
          console.log('📥 Check OTP response:', response);
        }

        // Check response more flexibly
        // Check response more flexibly
        if (response && (
          response.isValid === true || 
          String(response.isValid) === 'true' || 
          response.message?.toLowerCase().includes('success') || 
          response.message?.toLowerCase().includes('thành công') ||
          response.message?.toLowerCase().includes('valid')
        )) {
          if (__DEV__) {
            console.log('✅ OTP validated successfully', { email });
          }
          
          if (onSuccess) {
            onSuccess();
          } else {
            // Navigate to reset password screen with validated OTP
            try {
              const resetRoute = userType === 'customer' 
                ? `/customer/reset-password?email=${encodeURIComponent(email)}&otp=${otpCode}` 
                : `/technician/reset-password?email=${encodeURIComponent(email)}&otp=${otpCode}`;
              
              if (__DEV__) {
                console.log('✅ Navigating to reset password with validated OTP');
              }
              
              router.push(resetRoute as any);
            } catch (navError) {
              if (__DEV__) {
                console.error('Navigation error:', navError);
              }
              Alert.alert(
                'Thành công!',
                'OTP đã được xác thực. Vui lòng đặt lại mật khẩu của bạn.',
                [{ text: 'OK' }]
              );
            }
          }
        } else {
          // Handle failed OTP validation
          if (__DEV__) {
            console.log('❌ OTP validation failed:', response);
          }
          
          // Increment attempts for password reset
          if (purpose === 'password-reset') {
            const newAttempts = otpAttempts + 1;
            setOtpAttempts(newAttempts);
            
            if (newAttempts >= maxOtpAttempts) {
              setIsOtpInvalid(true);
              setError(`Bạn đã nhập sai OTP ${maxOtpAttempts} lần. OTP này đã bị vô hiệu hóa. Vui lòng yêu cầu mã OTP mới.`);
              setCanResend(true);
              setCountdown(0);
            } else {
              const remainingAttempts = maxOtpAttempts - newAttempts;
              setError(`Mã OTP không chính xác. Còn lại ${remainingAttempts} lần thử.`);
            }
          } else {
            setError('Mã OTP không chính xác hoặc đã hết hạn');
          }
        }
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ OTP verification failed', error);
      }
      
      // Handle attempts tracking for password reset
      if (purpose === 'password-reset') {
        const newAttempts = otpAttempts + 1;
        setOtpAttempts(newAttempts);
        
        if (newAttempts >= maxOtpAttempts) {
          setIsOtpInvalid(true);
          setError(`Bạn đã nhập sai OTP ${maxOtpAttempts} lần. OTP này đã bị vô hiệu hóa. Vui lòng yêu cầu mã OTP mới.`);
          setCanResend(true);
          setCountdown(0);
        } else {
          const remainingAttempts = maxOtpAttempts - newAttempts;
          let errorMessage = `Mã OTP không chính xác. Còn lại ${remainingAttempts} lần thử.`;
          
          if (error.reason) {
            errorMessage = `${error.reason} Còn lại ${remainingAttempts} lần thử.`;
          }
          
          setError(errorMessage);
        }
      } else {
        // Enhanced Vietnamese error messages for registration
        let errorMessage = 'Xác thực thất bại. Vui lòng thử lại.';
        
        if (error.reason) {
          errorMessage = error.reason;
        } else if (error.message) {
          const message = error.message.toLowerCase();
          if (message.includes('invalid') || message.includes('incorrect') || message.includes('wrong')) {
            errorMessage = 'Mã OTP không chính xác';
          } else if (message.includes('expired') || message.includes('expire')) {
            errorMessage = 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới';
          } else if (message.includes('network') || message.includes('connection') || message.includes('fetch')) {
            errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra và thử lại';
          } else if (message.includes('timeout')) {
            errorMessage = 'Yêu cầu quá thời gian. Vui lòng thử lại';
          } else if (message.includes('server') || message.includes('500')) {
            errorMessage = 'Lỗi server. Vui lòng thử lại sau';
          } else if (message.includes('rate limit') || message.includes('too many')) {
            errorMessage = 'Bạn đã thử quá nhiều lần. Vui lòng đợi một chút';
          } else if (message.includes('not found') || message.includes('404')) {
            errorMessage = 'Không tìm thấy thông tin. Vui lòng thử lại';
          } else if (message.includes('unauthorized') || message.includes('401')) {
            errorMessage = 'Không có quyền truy cập. Vui lòng thử lại';
          } else {
            errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại';
          }
        } else if (error.status_code) {
          switch (error.status_code) {
            case 400:
              errorMessage = 'Mã OTP không hợp lệ';
              break;
            case 401:
              errorMessage = 'Mã OTP không chính xác';
              break;
            case 404:
              errorMessage = 'Không tìm thấy thông tin';
              break;
            case 429:
              errorMessage = 'Quá nhiều lần thử. Vui lòng đợi';
              break;
            case 500:
              errorMessage = 'Lỗi server. Vui lòng thử lại sau';
              break;
            default:
              errorMessage = 'Đã có lỗi xảy ra. Vui lòng thử lại';
          }
        }
        
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setIsAutoSubmitting(false); // Reset auto-submit state
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    const otpKey = `${email}-${purpose}`;
    
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // Allow manual resend by clearing global flag temporarily
      globalOtpSendingFlag[otpKey] = false;
      
      await authService.sendEmailOtp({
        email,
        purpose
      });
      
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      
      // Reset OTP attempts tracking
      setOtpAttempts(0);
      setIsOtpInvalid(false);
      
      setSuccessMessage('Mã OTP mới đã được gửi đến email của bạn');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      // Focus first input
      otpInputRefs.current[0]?.focus();
    } catch (error: any) {
      
      // Provide Vietnamese error messages
      let errorMessage = 'Không thể gửi lại OTP. Vui lòng thử lại.';
      
      if (error.reason) {
        errorMessage = error.reason;
      } else if (error.message) {
        // Convert common error messages to Vietnamese
        const message = error.message.toLowerCase();
        if (message.includes('network') || message.includes('connection')) {
          errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra và thử lại.';
        } else if (message.includes('timeout')) {
          errorMessage = 'Yêu cầu quá thời gian. Vui lòng thử lại.';
        } else if (message.includes('rate limit') || message.includes('too many')) {
          errorMessage = 'Bạn đã yêu cầu quá nhiều lần. Vui lòng đợi một chút.';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // Get screen title and subtitle based on purpose
  const getScreenContent = () => {
    if (purpose === 'registration') {
      return {
        title: 'Xác thực tài khoản',
        subtitle: `Chúng tôi đã gửi mã xác thực đến\n${email}`,
        successTitle: 'Tài khoản đã được xác thực!',
        buttonText: 'Xác thực tài khoản'
      };
    } else {
      return {
        title: 'Xác thực OTP',
        subtitle: `Chúng tôi đã gửi mã xác thực đến\n${email}`,
        successTitle: 'OTP hợp lệ!',
        buttonText: 'Xác nhận'
      };
    }
  };

  const content = getScreenContent();

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Title Section */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{content.title}</Text>
            <Text style={styles.subtitle}>{content.subtitle}</Text>
          </View>

          {/* OTP Input Section */}
          <View style={styles.otpSection}>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { otpInputRefs.current[index] = ref; }}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : null,
                    error ? styles.otpInputError : null,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  selectTextOnFocus
                  autoFocus={index === 0}
                />
              ))}
            </View>

            {/* Error Message */}
            {error ? (
              <Animated.View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </Animated.View>
            ) : null}

            {/* Success Message */}
            {successMessage ? (
              <Animated.View style={styles.successContainer}>
                <Text style={styles.successText}>✅ {successMessage}</Text>
              </Animated.View>
            ) : null}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[
              styles.verifyButton,
              (otp.join('').length !== 6 || isLoading || isAutoSubmitting) && styles.disabledButton,
            ]}
            onPress={() => handleVerifyOtp()}
            disabled={otp.join('').length !== 6 || isLoading || isAutoSubmitting}
          >
            {isLoading || isAutoSubmitting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#ffffff" size="small" />
                <Text style={styles.loadingText}>
                  {isAutoSubmitting ? 'Đang xác thực...' : 'Xác thực...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.verifyButtonText}>{content.buttonText}</Text>
            )}
          </TouchableOpacity>

          {/* Resend Section */}
          <View style={styles.resendSection}>
            <Text style={styles.resendText}>Không nhận được mã?</Text>
            {canResend ? (
              <TouchableOpacity onPress={handleResendOtp} disabled={isLoading}>
                <Text style={styles.resendButton}>Gửi lại</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendCountdown}>
                Gửi lại sau {countdown}s
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent
          animationType="none"
          statusBarTranslucent
        >
          <Animated.View 
            style={[
              styles.successModalOverlay,
              { opacity: successModalAnim }
            ]}
          >
            <Animated.View 
              style={[
                styles.successModalContent,
                {
                  transform: [{ scale: successScaleAnim }]
                }
              ]}
            >
              {/* Success Icon */}
              <Animated.View 
                style={[
                  styles.successIconContainer,
                  {
                    transform: [
                      { scale: successIconAnim },
                      {
                        rotate: successIconAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  }
                ]}
              >
                <Text style={styles.successIcon}>✓</Text>
              </Animated.View>
              
              {/* Success Title */}
              <Text style={styles.successModalTitle}>Thành công!</Text>
              
              {/* Success Message */}
              <Text style={styles.successModalMessage}>
                {purpose === 'registration' 
                  ? 'Tài khoản của bạn đã được xác thực thành công!\nBạn sẽ được chuyển đến trang chính.'
                  : 'Mã OTP đã được xác thực thành công.\nBạn có thể tiếp tục đặt lại mật khẩu.'
                }
              </Text>
              
              {/* Action Button */}
              <TouchableOpacity 
                style={styles.successModalButton}
                onPress={hideSuccessModalWithAnimation}
                activeOpacity={0.9}
              >
                <Text style={styles.successModalButtonText}>
                  {purpose === 'registration' ? 'Đăng nhập ngay' : 'Tiếp tục'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: (StatusBar.currentHeight || 0) + 5,
    paddingBottom: 20,
    zIndex: 10,
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
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backButtonText: {
    fontSize: 24,
    color: '#374151',
    fontWeight: '700',
    lineHeight: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleContainer: {
    marginBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 12,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'center',
  },
  otpSection: {
    marginBottom: 32,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  otpInput: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1f2937',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  otpInputFilled: {
    borderColor: '#609CEF',
    backgroundColor: '#f0f9ff',
  },
  otpInputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#22c55e',
  },
  successText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '500',
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: '#609CEF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 32,
  },
  disabledButton: {
    backgroundColor: '#e2e8f0',
    shadowOpacity: 0.1,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  resendSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  resendText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  resendButton: {
    fontSize: 14,
    color: '#609CEF',
    fontWeight: '600',
  },
  resendCountdown: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  // Success Modal Styles
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 32,
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  successIcon: {
    fontSize: 36,
    color: '#ffffff',
    fontWeight: '900',
    lineHeight: 36,
  },
  successModalTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  successModalMessage: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 8,
    fontWeight: '500',
  },
  successModalButton: {
    backgroundColor: '#609CEF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    minWidth: 180,
    alignItems: 'center',
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 1 }],
  },
  successModalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});