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
} from 'react-native';
import { authService } from '../lib/api/auth';
import type { 
  SendEmailOTPRequest, 
  ValidateOTPRequest, 
  ForgotPasswordResetRequest 
} from '../types/api';

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  userType: 'customer' | 'technician';
}

type StepType = 'contact' | 'otp' | 'newPassword';

export default function ForgotPasswordScreen({
  onBack,
  onSuccess,
  userType,
}: ForgotPasswordScreenProps) {
  const [currentStep, setCurrentStep] = useState<StepType>('contact');
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Animation values
  const contactStepOpacity = useRef(new Animated.Value(1)).current;
  const contactStepTransform = useRef(new Animated.Value(0)).current;
  const otpStepOpacity = useRef(new Animated.Value(0)).current;
  const otpStepTransform = useRef(new Animated.Value(100)).current;
  const passwordStepOpacity = useRef(new Animated.Value(0)).current;
  const passwordStepTransform = useRef(new Animated.Value(100)).current;
  const titleOpacity = useRef(new Animated.Value(1)).current;
  const titleScale = useRef(new Animated.Value(1)).current;

  // OTP input refs
  const otpInputRefs = useRef<Array<TextInput | null>>([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (currentStep === 'otp' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, currentStep]);

  // Validate contact (email only)
  const validateContact = (text: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  // Handle continue from contact step
  const handleContinue = async () => {
    setError('');
    
    if (!validateContact(contact)) {
      setError('Vui lòng nhập email hợp lệ');
      return;
    }

    setIsLoading(true);

    try {
      const sendOTPData: SendEmailOTPRequest = {
        email: contact.trim().toLowerCase(),
        purpose: 'forgot-password'
      };

      await authService.sendForgotPasswordOTP(sendOTPData);

      // If successful, animate transition to OTP step
      Animated.parallel([
        Animated.timing(contactStepOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(contactStepTransform, {
          toValue: -100,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(titleScale, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep('otp');
        setCountdown(60);
        setCanResend(false);

        // Reset and animate in OTP step
        Animated.parallel([
          Animated.timing(otpStepOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(otpStepTransform, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 300,
            delay: 100,
            useNativeDriver: true,
          }),
          Animated.timing(titleScale, {
            toValue: 1,
            duration: 300,
            delay: 100,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } catch (error: any) {
      setError(error.message || 'Gửi email reset mật khẩu thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async () => {
    setError('');
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số OTP');
      return;
    }

    setIsLoading(true);

    try {
      // Verify OTP for password reset
      const validateOTPData: ValidateOTPRequest = {
        email: contact.trim().toLowerCase(),
        otp: otpCode,
        purpose: 'forgot-password'
      };

      await authService.validateForgotPasswordOTP(validateOTPData);

      // If successful, animate transition to new password step
      Animated.parallel([
        Animated.timing(otpStepOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(otpStepTransform, {
          toValue: -100,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(titleScale, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep('newPassword');

        // Reset and animate in password step
        Animated.parallel([
          Animated.timing(passwordStepOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(passwordStepTransform, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 300,
            delay: 100,
            useNativeDriver: true,
          }),
          Animated.timing(titleScale, {
            toValue: 1,
            duration: 300,
            delay: 100,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } catch (error: any) {
      setError(error.message || 'Mã OTP không chính xác');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    
    try {
      const forgotPasswordData: SendEmailOTPRequest = {
        email: contact.trim().toLowerCase(),
        purpose: 'forgot-password'
      };

      await authService.sendForgotPasswordOTP(forgotPasswordData);
      
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      
      setSuccessMessage('Mã OTP đã được gửi lại đến email của bạn');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Không thể gửi lại OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reset password
  const handleResetPassword = async () => {
    setError('');
    
    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);

    try {
      const resetPasswordData: ForgotPasswordResetRequest = {
        email: contact.trim().toLowerCase(),
        newPassword,
        otp: otp.join(''),
      };

      await authService.resetForgotPassword(resetPasswordData);

      setIsSuccess(true);
      
      // Auto navigate back after 3 seconds
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Đổi mật khẩu thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (currentStep === 'contact') {
      onBack();
    } else if (currentStep === 'otp') {
      // Animate back to contact step
      Animated.parallel([
        Animated.timing(otpStepOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(otpStepTransform, {
          toValue: 100,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep('contact');
        contactStepTransform.setValue(0);

        Animated.parallel([
          Animated.timing(contactStepOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 300,
            delay: 100,
            useNativeDriver: true,
          }),
          Animated.timing(titleScale, {
            toValue: 1,
            duration: 300,
            delay: 100,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else if (currentStep === 'newPassword') {
      // Animate back to OTP step
      Animated.parallel([
        Animated.timing(passwordStepOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(passwordStepTransform, {
          toValue: 100,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep('otp');
        otpStepTransform.setValue(0);

        Animated.parallel([
          Animated.timing(otpStepOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 300,
            delay: 100,
            useNativeDriver: true,
          }),
          Animated.timing(titleScale, {
            toValue: 1,
            duration: 300,
            delay: 100,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  };

  const getTitle = () => {
    switch (currentStep) {
      case 'contact':
        return 'Quên mật khẩu';
      case 'otp':
        return 'Xác thực OTP';
      case 'newPassword':
        return 'Tạo mật khẩu mới';
    }
  };

  const getSubtitle = () => {
    switch (currentStep) {
      case 'contact':
        return 'Nhập email để nhận mã OTP reset mật khẩu';
      case 'otp':
        return `Chúng tôi đã gửi mã OTP đến email ${contact}`;
      case 'newPassword':
        return 'Vui lòng nhập mật khẩu mới của bạn';
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
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Success Screen */}
          {isSuccess ? (
            <View style={styles.successScreenContainer}>
              <View style={styles.successIconContainer}>
                <Text style={styles.successIcon}>✅</Text>
              </View>
              <Text style={styles.successTitle}>Đổi mật khẩu thành công!</Text>
              <Text style={styles.successDescription}>
                Mật khẩu của bạn đã được cập nhật.{'\n'}
                Bạn sẽ được chuyển đến màn hình đăng nhập.
              </Text>
              <View style={styles.successFooter}>
                <ActivityIndicator color="#609CEF" size="small" />
                <Text style={styles.successFooterText}>Đang chuyển hướng...</Text>
              </View>
            </View>
          ) : (
            <>
              {/* Title */}
              <Animated.View
                style={[
                  styles.titleContainer,
                  {
                    opacity: titleOpacity,
                    transform: [{ scale: titleScale }],
                  },
                ]}
              >
                <Text style={styles.title}>{getTitle()}</Text>
                <Text style={styles.subtitle}>{getSubtitle()}</Text>
              </Animated.View>

              {/* Error Display */}
              {error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Success Message Display */}
              {successMessage ? (
                <View style={styles.successContainer}>
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              ) : null}

          {/* Step 1: Contact Input */}
          {currentStep === 'contact' && (
            <Animated.View
              style={[
                styles.stepContainer,
                {
                  opacity: contactStepOpacity,
                  transform: [{ translateX: contactStepTransform }],
                },
              ]}
            >
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập email của bạn"
                  placeholderTextColor="#94a3b8"
                  value={contact}
                  onChangeText={setContact}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoFocus
                />
              </View>

              <View style={styles.noteContainer}>
                <Text style={styles.noteIcon}>ℹ️</Text>
                <Text style={styles.noteText}>
                  Chúng tôi sẽ gửi mã OTP về email của bạn để xác thực
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  (!validateContact(contact) || isLoading) && styles.disabledButton,
                ]}
                onPress={handleContinue}
                disabled={!validateContact(contact) || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Tiếp theo</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Step 2: OTP Input */}
          {currentStep === 'otp' && (
            <Animated.View
              style={[
                styles.stepContainer,
                {
                  opacity: otpStepOpacity,
                  transform: [{ translateX: otpStepTransform }],
                },
              ]}
            >
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      otpInputRefs.current[index] = ref;
                    }}
                    style={[
                      styles.otpInput,
                      digit && styles.otpInputFilled,
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              <View style={styles.resendContainer}>
                {canResend && !isLoading ? (
                  <TouchableOpacity onPress={handleResendOtp}>
                    <Text style={styles.resendTextActive}>Gửi lại mã OTP</Text>
                  </TouchableOpacity>
                ) : isLoading ? (
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                    <ActivityIndicator size="small" color="#609CEF" />
                    <Text style={styles.resendText}>Đang gửi...</Text>
                  </View>
                ) : (
                  <Text style={styles.resendText}>
                    Gửi lại mã sau {countdown}s
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  (otp.join('').length !== 6 || isLoading) && styles.disabledButton,
                ]}
                onPress={handleVerifyOtp}
                disabled={otp.join('').length !== 6 || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Xác nhận</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Step 3: New Password Input */}
          {currentStep === 'newPassword' && (
            <Animated.View
              style={[
                styles.stepContainer,
                {
                  opacity: passwordStepOpacity,
                  transform: [{ translateX: passwordStepTransform }],
                },
              ]}
            >
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Mật khẩu mới"
                  placeholderTextColor="#94a3b8"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoFocus
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Xác nhận mật khẩu mới"
                  placeholderTextColor="#94a3b8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.passwordRequirement}>
                <Text style={styles.requirementText}>
                  • Mật khẩu phải có ít nhất 6 ký tự
                </Text>
                <Text style={styles.requirementText}>
                  • Nên bao gồm chữ hoa, chữ thường và số
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  (newPassword.length < 6 || newPassword !== confirmPassword || isLoading) &&
                    styles.disabledButton,
                ]}
                onPress={handleResetPassword}
                disabled={
                  newPassword.length < 6 || newPassword !== confirmPassword || isLoading
                }
              >
                {isLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Đổi mật khẩu</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
          </>
          )}
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
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

  titleContainer: {
      marginBottom: 20,
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
  stepContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
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
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    gap: 12,
  },
  noteIcon: {
    fontSize: 20,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#0369a1',
    lineHeight: 20,
    fontWeight: '500',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
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
  },
  otpInputFilled: {
    borderColor: '#609CEF',
    backgroundColor: '#f0f9ff',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 15,
    color: '#94a3b8',
    fontWeight: '500',
  },
  resendTextActive: {
    fontSize: 15,
    color: '#609CEF',
    fontWeight: '700',
  },
  passwordRequirement: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  requirementText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#609CEF',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#609CEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
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
  // Error styles
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Success styles
  successContainer: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  successText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Success Screen styles
  successScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  successIcon: {
    fontSize: 48,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  successDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  successFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  successFooterText: {
    fontSize: 16,
    color: '#609CEF',
    fontWeight: '500',
  },
});
