import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 0.7; // 70% of container width to activate

interface SwipeToActivateProps {
  onActivate: () => void;
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
}

export default function SwipeToActivate({
  onActivate,
  isLoading = false,
  title = 'Bật chế độ nhận đơn',
  subtitle = 'Vuốt để bắt đầu nhận đơn hàng gần bạn'
}: SwipeToActivateProps) {
  const containerWidth = SCREEN_WIDTH - 64; // 32px padding each side
  const sliderWidth = 60;
  const maxSlide = containerWidth - sliderWidth - 8; // 8px for padding

  const slideAnim = useRef(new Animated.Value(0)).current;
  const [isActivated, setIsActivated] = useState(false);
  const [currentSlideValue, setCurrentSlideValue] = useState(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isLoading && !isActivated,
      onMoveShouldSetPanResponder: () => !isLoading && !isActivated,
      onPanResponderGrant: () => {
        slideAnim.setOffset(currentSlideValue);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isLoading || isActivated) return;
        
        // Clamp the value between 0 and maxSlide
        const newValue = Math.max(0, Math.min(gestureState.dx, maxSlide));
        slideAnim.setValue(newValue);
        setCurrentSlideValue(currentSlideValue + newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isLoading || isActivated) return;

        slideAnim.flattenOffset();
        const currentValue = currentSlideValue + gestureState.dx;
        
        // Check if swiped past threshold
        if (currentValue >= maxSlide * SWIPE_THRESHOLD) {
          // Activate
          setCurrentSlideValue(maxSlide);
          Animated.spring(slideAnim, {
            toValue: maxSlide,
            useNativeDriver: false,
            tension: 50,
            friction: 7,
          }).start(() => {
            setIsActivated(true);
            setTimeout(() => {
              onActivate();
            }, 300);
          });
        } else {
          // Reset to start
          setCurrentSlideValue(0);
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: false,
            tension: 50,
            friction: 7,
          }).start();
        }
      },
    })
  ).current;

  // Interpolate background opacity
  const backgroundOpacity = slideAnim.interpolate({
    inputRange: [0, maxSlide],
    outputRange: [0.3, 1],
  });

  // Interpolate text opacity (fade out as slider moves)
  const textOpacity = slideAnim.interpolate({
    inputRange: [0, maxSlide * 0.5],
    outputRange: [1, 0],
  });

  return (
    <View style={styles.container}>
      {/* Icon */}
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={['#609CEF', '#4F8EF7']}
          style={styles.iconGradient}
        >
          <Ionicons name="location" size={48} color="#FFFFFF" />
        </LinearGradient>
      </View>

      {/* Title and subtitle */}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      {/* Swipe container */}
      <View style={styles.swipeContainer}>
        {/* Background progress */}
        <Animated.View
          style={[
            styles.progressBackground,
            {
              opacity: backgroundOpacity,
              width: slideAnim.interpolate({
                inputRange: [0, maxSlide],
                outputRange: [0, containerWidth - 8],
              }),
            },
          ]}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressGradient}
          />
        </Animated.View>

        {/* Instruction text */}
        <Animated.View
          style={[
            styles.instructionContainer,
            { opacity: textOpacity },
          ]}
          pointerEvents="none"
        >
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          <Text style={styles.instructionText}>Vuốt sang phải</Text>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Animated.View>

        {/* Slider button */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.slider,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={isActivated ? ['#10B981', '#059669'] : ['#609CEF', '#4F8EF7']}
            style={styles.sliderGradient}
          >
            {isLoading ? (
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: slideAnim.interpolate({
                        inputRange: [0, maxSlide],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                }}
              >
                <Ionicons name="sync" size={28} color="#FFFFFF" />
              </Animated.View>
            ) : isActivated ? (
              <Ionicons name="checkmark" size={28} color="#FFFFFF" />
            ) : (
              <Ionicons name="arrow-forward" size={28} color="#FFFFFF" />
            )}
          </LinearGradient>
        </Animated.View>
      </View>

      {/* Info text */}
      <View style={styles.infoContainer}>
        <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
        <Text style={styles.infoText}>
          Bạn cần bật vị trí để nhận đơn hàng gần bạn
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F8FAFC',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#609CEF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 22,
  },
  swipeContainer: {
    width: SCREEN_WIDTH - 64,
    height: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 35,
    position: 'relative',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  progressBackground: {
    position: 'absolute',
    left: 4,
    top: 4,
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
    width: '100%',
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  slider: {
    position: 'absolute',
    left: 4,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  sliderGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#92400E',
    flex: 1,
  },
});
