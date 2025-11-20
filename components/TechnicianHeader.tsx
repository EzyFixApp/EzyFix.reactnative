import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { HEADER_CONSTANTS } from '../constants/HeaderConstants';

interface TechnicianHeaderProps {
  title: string;
  technicianName?: string;
  onAvatarPress?: () => void;
  onSearchPress?: () => void;
  notificationCount?: number;
}

export default function TechnicianHeader({ 
  title, 
  technicianName = "Thợ Minh Tuấn",
  onAvatarPress, 
  onSearchPress,
  notificationCount = 0 
}: TechnicianHeaderProps) {
  return (
    <LinearGradient
      colors={['#609CEF', '#4F8BE8', '#3D7CE0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Profile Button */}
        <TouchableOpacity 
          onPress={onSearchPress}
          style={styles.searchButton}
        >
          <View style={styles.searchContainer}>
            <Ionicons name="person-outline" size={24} color="white" />
          </View>
        </TouchableOpacity>

        {/* Title and Technician Info */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
          
        </View>

        {/* Notification Button */}
        <TouchableOpacity 
          onPress={onAvatarPress}
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
    paddingTop: HEADER_CONSTANTS.TECHNICIAN_HEADER_PADDING_TOP,
    paddingBottom: HEADER_CONSTANTS.TECHNICIAN_HEADER_PADDING_BOTTOM,
    paddingHorizontal: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchButton: {
    width: HEADER_CONSTANTS.TECHNICIAN_HEADER_CONTENT_HEIGHT,
    height: HEADER_CONSTANTS.TECHNICIAN_HEADER_CONTENT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  technicianName: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  notificationButton: {
    width: HEADER_CONSTANTS.TECHNICIAN_HEADER_CONTENT_HEIGHT,
    height: HEADER_CONSTANTS.TECHNICIAN_HEADER_CONTENT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF4757',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
});