import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BottomNavItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

interface BottomNavigationProps {
  activeTab: string;
  onTabPress: (tabId: string) => void;
  onLogoPress?: () => void;
  theme?: 'light' | 'dark';
}

const navItems: BottomNavItem[] = [
  {
    id: 'home',
    label: 'Trang chủ',
    icon: 'home-outline',
    activeIcon: 'home',
  },
  {
    id: 'activity',
    label: 'Hoạt động',
    icon: 'list-outline',
    activeIcon: 'list',
  },
];

export default function BottomNavigation({ 
  activeTab, 
  onTabPress, 
  onLogoPress,
  theme = 'light'
}: BottomNavigationProps) {
  const isDark = theme === 'dark';
  
  return (
    <View style={[
      styles.container, 
      isDark && styles.containerDark
    ]}>
      <View style={[
        styles.navigationBar,
        isDark && styles.navigationBarDark
      ]}>
        {/* Left Tab - Trang chủ */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabPress('home')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'home' ? navItems[0].activeIcon : navItems[0].icon}
            size={24}
            color={activeTab === 'home' ? '#609CEF' : (isDark ? '#9CA3AF' : '#9CA3AF')}
          />
          <Text style={[
            styles.tabLabel,
            { color: activeTab === 'home' ? '#609CEF' : (isDark ? '#9CA3AF' : '#9CA3AF') }
          ]}>
            {navItems[0].label}
          </Text>
        </TouchableOpacity>

        {/* Center Logo */}
        <TouchableOpacity
          style={[styles.logoContainer, isDark && styles.logoContainerDark]}
          onPress={onLogoPress}
          activeOpacity={0.8}
        >
          <Image 
            source={require('../assets/logononame.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Right Tab - Hoạt động */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => onTabPress('activity')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'activity' ? navItems[1].activeIcon : navItems[1].icon}
            size={24}
            color={activeTab === 'activity' ? '#609CEF' : (isDark ? '#9CA3AF' : '#9CA3AF')}
          />
          <Text style={[
            styles.tabLabel,
            { color: activeTab === 'activity' ? '#609CEF' : (isDark ? '#9CA3AF' : '#9CA3AF') }
          ]}>
            {navItems[1].label}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Home Indicator */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    position: 'relative',
  },
  containerDark: {
    backgroundColor: '#1F2937',
  },
  navigationBar: {
    backgroundColor: 'white',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 24,
    marginHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  navigationBarDark: {
    backgroundColor: '#374151',
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  logoContainer: {
    width: 64,
    height: 64,
    backgroundColor: 'white',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 3,
    borderColor: '#E3F2FD',
  },
  logoContainerDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
    shadowColor: '#609CEF',
    shadowOpacity: 0.3,
  },
  logo: {
    width: 40,
    height: 40,
  },
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: '#000000',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 8,
  },
  homeIndicatorDark: {
    backgroundColor: '#FFFFFF',
  },
});