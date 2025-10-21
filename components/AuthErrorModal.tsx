/**
 * Auth Error Modal Component
 * Displays authentication and authorization errors with action buttons
 */

import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export type AuthErrorType = 
  | 'ROLE_MISMATCH' 
  | 'TOKEN_EXPIRED' 
  | 'UNAUTHORIZED'
  | 'SESSION_INVALID';

interface AuthErrorModalProps {
  visible: boolean;
  errorType: AuthErrorType;
  onClose?: () => void;
  onLoginPress: () => void;
  autoCloseSeconds?: number; // Auto-close and redirect after N seconds
}

const ERROR_CONFIG = {
  ROLE_MISMATCH: {
    icon: 'warning' as const,
    iconColor: '#FF9800',
    title: 'Không có quyền truy cập',
    message: 'Bạn cần đăng nhập với tài khoản Thợ để sử dụng tính năng này.',
    buttonText: 'Đăng nhập lại',
  },
  TOKEN_EXPIRED: {
    icon: 'time' as const,
    iconColor: '#F44336',
    title: 'Phiên đăng nhập hết hạn',
    message: 'Vui lòng đăng nhập lại để tiếp tục sử dụng dịch vụ.',
    buttonText: 'Đăng nhập lại',
  },
  UNAUTHORIZED: {
    icon: 'lock-closed' as const,
    iconColor: '#F44336',
    title: 'Phiên đăng nhập không hợp lệ',
    message: 'Vui lòng đăng nhập lại.',
    buttonText: 'Đăng nhập lại',
  },
  SESSION_INVALID: {
    icon: 'alert-circle' as const,
    iconColor: '#F44336',
    title: 'Phiên làm việc không hợp lệ',
    message: 'Phiên làm việc của bạn đã hết hạn hoặc bị gián đoạn. Vui lòng đăng nhập lại.',
    buttonText: 'Đăng nhập lại',
  },
};

export default function AuthErrorModal({
  visible,
  errorType,
  onClose,
  onLoginPress,
  autoCloseSeconds = 0,
}: AuthErrorModalProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const countdownRef = useRef<number | null>(null);
  const [countdown, setCountdown] = React.useState(autoCloseSeconds);

  const config = ERROR_CONFIG[errorType];

  useEffect(() => {
    if (visible) {
      // Reset countdown
      setCountdown(autoCloseSeconds);
      
      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Start countdown if enabled
      if (autoCloseSeconds > 0) {
        let seconds = autoCloseSeconds;
        countdownRef.current = setInterval(() => {
          seconds -= 1;
          setCountdown(seconds);
          
          if (seconds <= 0) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
            }
            handleLoginPress();
          }
        }, 1000);
      }
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Clear countdown
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [visible, autoCloseSeconds]);

  const handleLoginPress = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    onLoginPress();
  };

  const handleClose = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    onClose?.();
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: config.iconColor + '20' }]}>
            <Ionicons name={config.icon} size={60} color={config.iconColor} />
          </View>

          {/* Title */}
          <Text style={styles.title}>{config.title}</Text>

          {/* Message */}
          <Text style={styles.message}>{config.message}</Text>

          {/* Countdown */}
          {autoCloseSeconds > 0 && countdown > 0 && (
            <Text style={styles.countdown}>
              Tự động chuyển sau {countdown} giây...
            </Text>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLoginPress}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#609CEF', '#4A89DC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.loginButtonText}>{config.buttonText}</Text>
              </LinearGradient>
            </TouchableOpacity>

            {onClose && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: width - 40,
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 10,
  },
  countdown: {
    fontSize: 13,
    color: '#95A5A6',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
  },
  loginButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  gradientButton: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#7F8C8D',
    fontSize: 16,
    fontWeight: '500',
  },
});
