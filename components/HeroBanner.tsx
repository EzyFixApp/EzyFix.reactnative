import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface HeroBannerProps {
  imageSource: any;
  location: string;
  rating: number;
  isFree?: boolean;
  onLocationPress?: () => void;
  onSearchPress?: () => void;
}

export default function HeroBanner({ 
  imageSource, 
  location, 
  rating, 
  isFree = true,
  onLocationPress,
  onSearchPress 
}: HeroBannerProps) {
  return (
    <View style={styles.container}>
      {/* Main Image */}
      <View style={styles.imageContainer}>
        <Image 
          source={imageSource} 
          style={styles.heroImage}
          resizeMode="cover"
        />
        
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Rating Badge */}
        <View style={styles.ratingBadge}>
          <Ionicons name="people" size={16} color="#609CEF" />
          <Text style={styles.ratingText}>
            {isFree ? 'Free' : 'Paid'} ★ {rating}
          </Text>
        </View>
      </View>

      {/* Location & Search Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          onPress={onLocationPress}
          style={styles.locationContainer}
        >
          <Ionicons name="location-outline" size={20} color="#64748b" />
          <Text style={styles.locationText} numberOfLines={1}>
            {location}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={onSearchPress}
          style={styles.searchButton}
        >
          <Ionicons name="search-outline" size={24} color="#609CEF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  pagination: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginRight: 8,
  },
  activeDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  ratingBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 6,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  locationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    marginRight: 8,
    flex: 1,
  },
  searchButton: {
    width: 48,
    height: 48,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});