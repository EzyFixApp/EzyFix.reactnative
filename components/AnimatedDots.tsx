import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface AnimatedDotsProps {
  size?: number;
  color?: string;
  style?: any;
  animationDuration?: number;
}

export default function AnimatedDots({ 
  size = 8, 
  color = 'rgba(255, 255, 255, 0.8)', 
  style,
  animationDuration = 600 
}: AnimatedDotsProps) {
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;
  
  const dot1Scale = useRef(new Animated.Value(0.8)).current;
  const dot2Scale = useRef(new Animated.Value(0.8)).current;
  const dot3Scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const animateDots = () => {
      const createDotAnimation = (opacity: Animated.Value, scale: Animated.Value, delay: number) => {
        return Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 1,
              duration: animationDuration * 0.5,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1.2,
              duration: animationDuration * 0.5,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0.3,
              duration: animationDuration * 0.5,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 0.8,
              duration: animationDuration * 0.5,
              useNativeDriver: true,
            }),
          ]),
        ]);
      };

      const animation = Animated.parallel([
        createDotAnimation(dot1Opacity, dot1Scale, 0),
        createDotAnimation(dot2Opacity, dot2Scale, animationDuration * 0.2),
        createDotAnimation(dot3Opacity, dot3Scale, animationDuration * 0.4),
      ]);

      const loopAnimation = Animated.loop(animation);
      loopAnimation.start();

      return loopAnimation;
    };

    const animation = animateDots();

    return () => {
      animation.stop();
    };
  }, [animationDuration]);

  const dotStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    marginHorizontal: size * 0.3,
  };

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          dotStyle,
          {
            opacity: dot1Opacity,
            transform: [{ scale: dot1Scale }],
          },
        ]}
      />
      <Animated.View
        style={[
          dotStyle,
          {
            opacity: dot2Opacity,
            transform: [{ scale: dot2Scale }],
          },
        ]}
      />
      <Animated.View
        style={[
          dotStyle,
          {
            opacity: dot3Opacity,
            transform: [{ scale: dot3Scale }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});