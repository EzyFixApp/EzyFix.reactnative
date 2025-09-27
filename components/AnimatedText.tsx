import React, { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';

interface AnimatedTextProps {
  text: string;
  style?: any;
  typingSpeed?: number;
  showCursor?: boolean;
  cursorColor?: string;
}

export default function AnimatedText({ 
  text, 
  style, 
  typingSpeed = 100,
  showCursor = true,
  cursorColor = '#94a3b8'
}: AnimatedTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Typing animation
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(text.substring(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, typingSpeed);

      return () => clearTimeout(timer);
    } else {
      // Start cursor blinking when typing is complete
      if (showCursor) {
        const blinkAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(cursorOpacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(cursorOpacity, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        );
        blinkAnimation.start();

        return () => blinkAnimation.stop();
      }
    }
  }, [currentIndex, text, typingSpeed, showCursor]);

  return (
    <Text style={[styles.text, style]}>
      {displayText}
      {showCursor && (
        <Animated.Text
          style={[
            styles.cursor,
            { 
              opacity: cursorOpacity,
              color: cursorColor 
            },
          ]}
        >
          |
        </Animated.Text>
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
  cursor: {
    fontSize: 16,
    fontWeight: '300',
  },
});