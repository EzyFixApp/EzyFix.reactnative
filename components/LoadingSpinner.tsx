import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LoadingSpinnerProps {
  size?: number;
  colors?: string[];
  strokeWidth?: number;
  style?: any;
}

export default function LoadingSpinner({ 
  size = 40, 
  colors = ['#609CEF', '#4F8BE8', '#3D7CE0'],
  strokeWidth = 3,
  style 
}: LoadingSpinnerProps) {
  const rotateValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Scale in animation
    Animated.spring(scaleValue, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Rotation animation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );

    rotateAnimation.start();

    return () => {
      rotateAnimation.stop();
    };
  }, []);

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [
            { rotate },
            { scale: scaleValue }
          ],
        },
      ]}
    >
      <View style={[styles.spinnerContainer, { width: size, height: size }]}>
        {/* Outer ring */}
        <View
          style={[
            styles.spinnerRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderTopColor: colors[0],
              borderRightColor: colors[1],
              borderBottomColor: 'transparent',
              borderLeftColor: 'transparent',
            },
          ]}
        />
        
        {/* Inner glow effect */}
        <View
          style={[
            styles.innerGlow,
            {
              width: size - strokeWidth * 4,
              height: size - strokeWidth * 4,
              borderRadius: (size - strokeWidth * 4) / 2,
              backgroundColor: `${colors[0]}15`,
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  spinnerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  spinnerRing: {
    position: 'absolute',
  },
  innerGlow: {
    position: 'absolute',
  },
});