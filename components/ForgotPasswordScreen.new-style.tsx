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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { authService } from '../lib/api/auth';
import type { 
  SendOtpRequest 
} from '../types/api';

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  userType: 'customer' | 'technician';
}

export default function ForgotPasswordScreen({
  onBack,
  onSuccess,
  userType,
}: ForgotPasswordScreenProps) {
  const router = useRouter();
  const [contact, setContact] = useState('');
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Animation values for smooth transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Validate contact (email only)
  const validateContact = (text: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(text);
  };

  // Handle continue from contact step - send OTP and navigate to OTP screen
  const handleContinue = async () => {
    setError('');
    
    if (!validateContact(contact)) {
      setError('Vui lòng nhập email hợp lệ');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Send OTP to email
      const sendOTPData: SendOtpRequest = {
        email: contact.trim().toLowerCase(),
        purpose: 'password-reset'
      };

      await authService.sendEmailOtp(sendOTPData);
      if (__DEV__) {
        console.log('📧 Password reset OTP sent', { email: contact.trim().toLowerCase() });
      }

      // Navigate to OTP verification screen
      const otpRoute = userType === 'customer' 
        ? `/customer/otp-verification?email=${encodeURIComponent(contact.trim().toLowerCase())}&purpose=password-reset`
        : `/technician/otp-verification?email=${encodeURIComponent(contact.trim().toLowerCase())}&purpose=password-reset`;
      router.replace(otpRoute as any);

    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ Send OTP failed', error);
      }
      setError(error.reason || 'Gửi email reset mật khẩu thất bại');
    } finally {
      setIsLoading(false);
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
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quên mật khẩu</Text>
          <View style={styles.placeholder} />
        </View>

        <Animated.View style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -20],
              }),
            }],
          },
        ]}>
          {/* Title and Description */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Khôi phục mật khẩu</Text>
            <Text style={styles.subtitle}>
              Nhập email của bạn để nhận mã xác thực và đặt lại mật khẩu
            </Text>
          </View>

          {/* Contact Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="Nhập email của bạn"
              value={contact}
              onChangeText={(text) => {
                setContact(text);
                if (error) setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!contact || !validateContact(contact) || isLoading) && styles.continueButtonDisabled
            ]}
            onPress={handleContinue}
            disabled={!contact || !validateContact(contact) || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.continueButtonText}>Gửi mã xác thực</Text>
            )}
          </TouchableOpacity>

          {/* Help Text */}
          <Text style={styles.helpText}>
            Chúng tôi sẽ gửi mã xác thực 6 số đến email của bạn
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#333333',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  titleContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#FAFAFA',
  },
  inputError: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: 8,
    paddingLeft: 4,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
});