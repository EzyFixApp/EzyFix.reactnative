import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Sample images for carousel
const carouselImages = [
  { uri: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=200&fit=crop&crop=center' },
  { uri: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=200&fit=crop&crop=center' },
  { uri: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=200&fit=crop&crop=center' },
  { uri: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=200&fit=crop&crop=center' },
];

interface HeroBannerProps {
  imageSource?: any;
  location: string;
  rating: number;
  isFree?: boolean;
  onLocationPress?: () => void;
  onSearchPress?: () => void;
}

export default function HeroBanner({ 
  location, 
  rating, 
  isFree = true,
  onLocationPress,
  onSearchPress 
}: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const imageWidth = width - 32; // Account for margins

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % carouselImages.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * imageWidth,
          animated: true,
        });
        return nextIndex;
      });
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval);
  }, [imageWidth]);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / imageWidth);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      {/* Image Carousel */}
      <View style={styles.imageSection}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.carousel}
        >
          {carouselImages.map((image, index) => (
            <View key={index} style={[styles.imageContainer, { width: imageWidth }]}>
              <Image 
                source={image} 
                style={styles.heroImage}
                resizeMode="cover"
              />
              {/* Rating Badge */}
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#FFA500" />
                <Text style={styles.ratingText}>
                  {rating} • {isFree ? 'Miễn phí' : 'Có phí'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
        
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {carouselImages.map((_, index) => (
            <View 
              key={index}
              style={[
                styles.dot, 
                currentIndex === index && styles.activeDot
              ]} 
            />
          ))}
        </View>
      </View>

      {/* Separate Location & Search Bar */}
      <View style={styles.actionSection}>
        <TouchableOpacity 
          onPress={onLocationPress}
          style={styles.locationContainer}
        >
          <Ionicons name="location" size={18} color="#609CEF" />
          <Text style={styles.locationText} numberOfLines={1}>
            {location}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={onSearchPress}
          style={styles.searchButton}
        >
          <Ionicons name="search" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  imageSection: {
    backgroundColor: 'white',
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
    marginBottom: 12,
  },
  carousel: {
    height: 200,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  pagination: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: 20,
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginLeft: 4,
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    marginRight: 8,
    flex: 1,
    fontWeight: '500',
  },
  searchButton: {
    width: 48,
    height: 48,
    backgroundColor: '#609CEF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});