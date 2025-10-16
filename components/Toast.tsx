/**
 * Modern Toast Notification Component
 * Professional and subtle error/success notifications
 */

import React from 'react';
import { 
  View, 
  Text, 
  Animated, 
  StyleSheet, 
  Dimensions 
} from 'react-native';

const { width } = Dimensions.get('window');

interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  visible: boolean;
  onHide?: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'error', 
  visible, 
  onHide,
  duration = 4000 
}) => {
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: -100,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  if (!visible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          backgroundColor: '#fef2f2',
          borderColor: '#fecaca',
          iconColor: '#dc2626',
          textColor: '#dc2626',
          icon: '⚠️'
        };
      case 'success':
        return {
          backgroundColor: '#f0fdf4',
          borderColor: '#bbf7d0',
          iconColor: '#16a34a',
          textColor: '#16a34a',
          icon: '✅'
        };
      case 'info':
        return {
          backgroundColor: '#f0f9ff',
          borderColor: '#bae6fd',
          iconColor: '#0284c7',
          textColor: '#0284c7',
          icon: 'ℹ️'
        };
      default:
        return {
          backgroundColor: '#fef2f2',
          borderColor: '#fecaca',
          iconColor: '#dc2626',
          textColor: '#dc2626',
          icon: '⚠️'
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          backgroundColor: typeStyles.backgroundColor,
          borderColor: typeStyles.borderColor,
        }
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.icon, { color: typeStyles.iconColor }]}>
          {typeStyles.icon}
        </Text>
        <Text style={[styles.message, { color: typeStyles.textColor }]}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  icon: {
    fontSize: 16,
    marginRight: 10,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});