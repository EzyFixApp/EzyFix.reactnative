import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface HeaderProps {
  title: string;
  onAvatarPress?: () => void;
  onNotificationPress?: () => void;
  notificationCount?: number;
}

export default function CustomerHeader({ 
  title, 
  onAvatarPress, 
  onNotificationPress,
  notificationCount = 0 
}: HeaderProps) {
  return (
    <LinearGradient
      colors={['#609CEF', '#4F8BE8', '#3D7CE0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Avatar Button */}
        <TouchableOpacity 
          onPress={onAvatarPress}
          style={styles.avatarButton}
        >
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={24} color="#609CEF" />
          </View>
        </TouchableOpacity>

        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Notification Button */}
        <TouchableOpacity 
          onPress={onNotificationPress}
          style={styles.notificationButton}
        >
          <View style={styles.notificationContainer}>
            <Ionicons name="notifications-outline" size={24} color="white" />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60, // Status bar height + padding
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarButton: {
    width: 44,
    height: 44,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  notificationButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});