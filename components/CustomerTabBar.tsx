/**
 * Customer Tab Bar Component
 * Tab switcher for Dashboard and Activity (Booking History)
 * Smooth transition animation with indicator
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_WIDTH = SCREEN_WIDTH / 2;

export type CustomerTab = 'dashboard' | 'activity';

interface CustomerTabBarProps {
  activeTab: CustomerTab;
  onTabChange: (tab: CustomerTab) => void;
}

export default function CustomerTabBar({ activeTab, onTabChange }: CustomerTabBarProps) {
  const indicatorPosition = useRef(new Animated.Value(0)).current;

  // Animate indicator when tab changes
  useEffect(() => {
    Animated.spring(indicatorPosition, {
      toValue: activeTab === 'dashboard' ? 0 : TAB_WIDTH,
      damping: 15,
      stiffness: 150,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const renderTab = (
    tab: CustomerTab,
    icon: keyof typeof Ionicons.glyphMap,
    label: string
  ) => {
    const isActive = activeTab === tab;

    return (
      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabChange(tab)}
        activeOpacity={0.7}
      >
        <Animated.View
          style={[
            styles.tabContent,
            isActive && styles.tabContentActive,
          ]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={isActive ? '#609CEF' : '#9CA3AF'}
          />
          <Text
            style={[
              styles.tabLabel,
              isActive && styles.tabLabelActive,
            ]}
          >
            {label}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.gradient}
      >
        <View style={styles.tabBar}>
          {renderTab('dashboard', 'home', 'Trang chủ')}
          {renderTab('activity', 'list', 'Hoạt động')}
        </View>

        {/* Animated Indicator */}
        <Animated.View
          style={[
            styles.indicator,
            {
              transform: [{ translateX: indicatorPosition }],
            },
          ]}
        >
          <LinearGradient
            colors={['#609CEF', '#4F8BE8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.indicatorGradient}
          />
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gradient: {
    paddingTop: 8,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  tabContentActive: {
    backgroundColor: 'rgba(96, 156, 239, 0.08)',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    fontSize: 14,
    fontWeight: '700',
    color: '#609CEF',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: TAB_WIDTH,
    height: 3,
    overflow: 'hidden',
  },
  indicatorGradient: {
    flex: 1,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});
