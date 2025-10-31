/**
 * Technician Reviews Screen
 * Display all reviews for a specific technician
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  Platform,
  Animated,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { techniciansService } from '../../lib/api/technicians';
import withCustomerAuth from '../../lib/auth/withCustomerAuth';

interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  customerName?: string | null;
  createdAt: string;
}

function TechnicianReviews() {
  const params = useLocalSearchParams<{
    technicianId: string;
    technicianName: string;
    totalReviews: string;
    averageRating: string;
  }>();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation for loading spinner
  const spinValue = new Animated.Value(0);

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.stopAnimation();
      spinValue.setValue(0);
    }
  }, [loading]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const loadReviews = async (showRefresh = false) => {
    if (!params.technicianId) {
      Alert.alert('Lỗi', 'Không tìm thấy ID thợ');
      router.back();
      return;
    }

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch technician profile which includes all reviews
      const data = await techniciansService.getTechnicianById(params.technicianId);
      
      // Extract reviews from response
      const allReviews = (data as any).latestReviews || (data as any).reviews || [];
      setReviews(allReviews);

      if (__DEV__) {
        console.log(`📋 [TechnicianReviews] Loaded ${allReviews.length} reviews for technician ${params.technicianId}`);
      }
    } catch (error: any) {
      console.error('❌ Error loading reviews:', error);
      Alert.alert(
        'Lỗi',
        'Không thể tải đánh giá. Vui lòng thử lại sau.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [params.technicianId]);

  const handleRefresh = () => {
    loadReviews(true);
  };

  const handleBack = () => {
    router.back();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStarArray = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => index < rating);
  };

  // Group reviews by rating for statistics
  const ratingStats = reviews.reduce((acc, review) => {
    const rating = review.rating || 0;
    acc[rating] = (acc[rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const totalReviews = parseInt(params.totalReviews) || reviews.length;
  const averageRating = parseFloat(params.averageRating) || 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#609CEF" translucent={false} />
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.safeAreaContainer}>
        {/* Header */}
        <View style={styles.customHeaderWrapper}>
          <LinearGradient
            colors={['#609CEF', '#3B82F6']}
            style={styles.customHeaderGradient}
          >
            <View style={styles.customHeaderContent}>
              <TouchableOpacity 
                onPress={handleBack}
                style={styles.customBackButton}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              
              <View style={styles.customHeaderTitleContainer}>
                <Text style={styles.customHeaderTitle}>Đánh giá</Text>
                <Text style={styles.customHeaderSubtitle}>{params.technicianName}</Text>
              </View>

              <View style={{ width: 40 }} />
            </View>
          </LinearGradient>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#609CEF" />
            <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollViewContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#609CEF']}
                tintColor="#609CEF"
              />
            }
          >
            {/* Rating Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRatingContainer}>
                <Text style={styles.summaryRatingValue}>{averageRating.toFixed(1)}</Text>
                <View style={styles.summaryStars}>
                  {getStarArray(Math.round(averageRating)).map((filled, index) => (
                    <Ionicons
                      key={index}
                      name={filled ? 'star' : 'star-outline'}
                      size={20}
                      color="#F59E0B"
                    />
                  ))}
                </View>
                <Text style={styles.summaryTotalReviews}>
                  {totalReviews} đánh giá
                </Text>
              </View>

              {/* Rating Distribution */}
              <View style={styles.ratingDistribution}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingStats[star] || 0;
                  const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  
                  return (
                    <View key={star} style={styles.ratingRow}>
                      <Text style={styles.ratingLabel}>{star}</Text>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <View style={styles.ratingBarContainer}>
                        <View style={styles.ratingBarBackground}>
                          <View
                            style={[
                              styles.ratingBarFill,
                              { width: `${percentage}%` },
                            ]}
                          />
                        </View>
                      </View>
                      <Text style={styles.ratingCount}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Reviews List */}
            {reviews.length > 0 ? (
              <View style={styles.reviewsList}>
                {reviews.map((review, index) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerInfo}>
                        <View style={styles.reviewerAvatar}>
                          <Ionicons name="shield-checkmark" size={20} color="#94A3B8" />
                        </View>
                        <View style={styles.reviewerDetails}>
                          <Text style={styles.reviewerName}>
                            Khách hàng ẩn danh
                          </Text>
                          <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
                        </View>
                      </View>
                      <View style={styles.reviewRatingBadge}>
                        <Ionicons name="star" size={16} color="#F59E0B" />
                        <Text style={styles.reviewRatingText}>{review.rating}</Text>
                      </View>
                    </View>

                    {/* Star Rating */}
                    <View style={styles.reviewStars}>
                      {getStarArray(review.rating).map((filled, idx) => (
                        <Ionicons
                          key={idx}
                          name={filled ? 'star' : 'star-outline'}
                          size={16}
                          color={filled ? '#F59E0B' : '#E5E7EB'}
                        />
                      ))}
                    </View>

                    {/* Comment */}
                    {review.comment && (
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="shield-checkmark-outline" size={48} color="#9CA3AF" />
                </View>
                <Text style={styles.emptyTitle}>Chưa có đánh giá</Text>
                <Text style={styles.emptySubtitle}>
                  Thợ này chưa nhận được đánh giá nào.{'\n'}
                  Tất cả đánh giá sẽ được ẩn danh để bảo vệ khách hàng.
                </Text>
              </View>
            )}

            <View style={styles.bottomSpacing} />
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  safeAreaContainer: {
    flex: 1,
  },
  customHeaderWrapper: {
    zIndex: 10,
  },
  customHeaderGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  customHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customHeaderTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  customHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  customHeaderSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRatingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryRatingValue: {
    fontSize: 56,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  summaryStars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  summaryTotalReviews: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  ratingDistribution: {
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    width: 12,
  },
  ratingBarContainer: {
    flex: 1,
  },
  ratingBarBackground: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  ratingCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    width: 30,
    textAlign: 'right',
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reviewRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reviewRatingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  reviewComment: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 32,
  },
});

export default withCustomerAuth(TechnicianReviews);
