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
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { techniciansService } from '../../lib/api/technicians';
import withCustomerAuth from '../../lib/auth/withCustomerAuth';

interface TechnicianProfile {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  certification?: string | null;
  yearsOfExperience?: number;
  availabilityStatus?: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  hourlyRate?: number;
  averageRating?: number;
  totalReviews?: number;
  skills?: Array<{
    id: string;
    skillName?: string | null;
    proficiencyLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  }>;
  latestReviews?: Array<{
    id: string;
    rating: number;
    comment?: string | null;
    customerName?: string | null;
    createdAt: string;
  }>;
}

function TechnicianProfile() {
  const { technicianId } = useLocalSearchParams<{ technicianId: string }>();
  const [profile, setProfile] = useState<TechnicianProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

  const loadTechnicianProfile = async () => {
    if (!technicianId) {
      Alert.alert('Lỗi', 'Không tìm thấy ID thợ');
      router.back();
      return;
    }

    try {
      setLoading(true);
      const data = await techniciansService.getTechnicianById(technicianId);
      
      // Map API response to TechnicianProfile
      const mappedProfile: TechnicianProfile = {
        id: (data as any).id || technicianId,
        firstName: (data as any).firstName || (data as any).user?.firstName,
        lastName: (data as any).lastName || (data as any).user?.lastName,
        email: (data as any).email || (data as any).user?.email,
        phone: (data as any).phone || (data as any).user?.phoneNumber,
        avatar: (data as any).avatar,
        certification: (data as any).certification,
        yearsOfExperience: (data as any).yearsOfExperience || (data as any).experience,
        availabilityStatus: (data as any).availabilityStatus,
        hourlyRate: (data as any).hourlyRate,
        averageRating: (data as any).averageRating || (data as any).rating,
        totalReviews: (data as any).totalReviews,
        skills: (data as any).skills,
        latestReviews: (data as any).latestReviews,
      };
      
      setProfile(mappedProfile);
    } catch (error: any) {
      console.error('❌ Error loading technician profile:', error);
      Alert.alert(
        'Lỗi',
        'Không thể tải thông tin thợ. Vui lòng thử lại sau.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTechnicianProfile();
  }, [technicianId]);

  const handleBack = () => {
    router.back();
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return '#10B981';
      case 'BUSY':
        return '#F59E0B';
      case 'OFFLINE':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getAvailabilityText = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Đang rảnh';
      case 'BUSY':
        return 'Đang bận';
      case 'OFFLINE':
        return 'Offline';
      default:
        return 'Không rõ';
    }
  };

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'EXPERT':
        return '#8B5CF6';
      case 'ADVANCED':
        return '#3B82F6';
      case 'INTERMEDIATE':
        return '#10B981';
      case 'BEGINNER':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getProficiencyText = (level: string) => {
    switch (level) {
      case 'EXPERT':
        return 'Chuyên gia';
      case 'ADVANCED':
        return 'Nâng cao';
      case 'INTERMEDIATE':
        return 'Trung cấp';
      case 'BEGINNER':
        return 'Cơ bản';
      default:
        return level;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#609CEF" translucent={false} />
        <Stack.Screen options={{ headerShown: false }} />
        
        <View style={styles.safeAreaContainer}>
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
                  <Text style={styles.customHeaderTitle}>Thông tin thợ</Text>
                </View>

                <View style={{ width: 24 }} />
              </View>
            </LinearGradient>
          </View>

          <View style={styles.loadingContainer}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="refresh-circle" size={48} color="#609CEF" />
            </Animated.View>
            <Text style={styles.loadingText}>Đang tải thông tin thợ...</Text>
          </View>
        </View>
      </View>
    );
  }

  if (!profile) {
    return null;
  }

  const fullName = `${profile.lastName || ''} ${profile.firstName || ''}`.trim() || 'Thợ sửa chữa';

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
                <Text style={styles.customHeaderTitle}>Thông tin thợ</Text>
              </View>

              <View style={{ width: 40 }} />
            </View>
          </LinearGradient>
        </View>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* Profile Header Card */}
          <View style={styles.profileHeaderCard}>
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.profileAvatar} />
            ) : (
              <View style={styles.profileAvatarPlaceholder}>
                <Ionicons name="person" size={48} color="#94A3B8" />
              </View>
            )}
            
            <Text style={styles.profileName}>{fullName}</Text>
            
            {/* Rating */}
            <View style={styles.ratingRow}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={24} color="#F59E0B" />
                <Text style={styles.ratingValue}>{(profile.averageRating || 0).toFixed(1)}</Text>
              </View>
              <Text style={styles.reviewCount}>({profile.totalReviews || 0} đánh giá)</Text>
            </View>

            {/* Availability Status */}
            <View style={[
              styles.availabilityBadge,
              { backgroundColor: `${getAvailabilityColor(profile.availabilityStatus || 'OFFLINE')}20` }
            ]}>
              <View style={[
                styles.availabilityDot,
                { backgroundColor: getAvailabilityColor(profile.availabilityStatus || 'OFFLINE') }
              ]} />
              <Text style={[
                styles.availabilityText,
                { color: getAvailabilityColor(profile.availabilityStatus || 'OFFLINE') }
              ]}>
                {getAvailabilityText(profile.availabilityStatus || 'OFFLINE')}
              </Text>
            </View>
          </View>

          {/* Experience & Certification Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="briefcase-outline" size={20} color="#609CEF" />
              <Text style={styles.cardTitle}>Kinh nghiệm & Kỹ năng</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="time-outline" size={20} color="#6B7280" />
                  <View style={styles.infoItemText}>
                    <Text style={styles.infoLabel}>Kinh nghiệm</Text>
                    <Text style={styles.infoValue}>{profile.yearsOfExperience || 0} năm</Text>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="cash-outline" size={20} color="#6B7280" />
                  <View style={styles.infoItemText}>
                    <Text style={styles.infoLabel}>Giá mỗi giờ</Text>
                    <Text style={styles.infoValue}>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(profile.hourlyRate || 0)}
                    </Text>
                  </View>
                </View>
              </View>

              {profile.certification && (
                <>
                  <View style={styles.infoDivider} />
                  <View style={styles.certificationRow}>
                    <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                    <Text style={styles.certificationText}>{profile.certification}</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Skills Card */}
          {profile.skills && profile.skills.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="construct-outline" size={20} color="#609CEF" />
                <Text style={styles.cardTitle}>Kỹ năng</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.skillsContainer}>
                  {profile.skills.map((skill, index) => (
                    <View 
                      key={skill.id}
                      style={[
                        styles.skillBadge,
                        { 
                          backgroundColor: `${getProficiencyColor(skill.proficiencyLevel || 'BEGINNER')}15`,
                          borderColor: getProficiencyColor(skill.proficiencyLevel || 'BEGINNER'),
                        }
                      ]}
                    >
                      <Text style={[
                        styles.skillName,
                        { color: getProficiencyColor(skill.proficiencyLevel || 'BEGINNER') }
                      ]}>
                        {skill.skillName || 'Kỹ năng'}
                      </Text>
                      <Text style={[
                        styles.skillLevel,
                        { color: getProficiencyColor(skill.proficiencyLevel || 'BEGINNER') }
                      ]}>
                        {getProficiencyText(skill.proficiencyLevel || 'BEGINNER')}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Reviews Card */}
          {profile.latestReviews && profile.latestReviews.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="chatbox-outline" size={20} color="#609CEF" />
                <Text style={styles.cardTitle}>Đánh giá gần đây</Text>
              </View>
              <View style={styles.cardContent}>
                {profile.latestReviews.map((review, index) => (
                  <View key={review.id}>
                    {index > 0 && <View style={styles.reviewDivider} />}
                    <View style={styles.reviewItem}>
                      <View style={styles.reviewHeader}>
                        <Text style={styles.reviewerName}>
                          {review.customerName || 'Khách hàng'}
                        </Text>
                        <View style={styles.reviewRating}>
                          <Ionicons name="star" size={14} color="#F59E0B" />
                          <Text style={styles.reviewRatingText}>{review.rating}</Text>
                        </View>
                      </View>
                      {review.comment && (
                        <Text style={styles.reviewComment}>{review.comment}</Text>
                      )}
                      <Text style={styles.reviewDate}>{formatDate(review.createdAt)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
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
  profileHeaderCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#E5E7EB',
  },
  profileAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#F3F4F6',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F59E0B',
  },
  reviewCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  cardContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoItemText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  certificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
  },
  certificationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  skillLevel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  reviewItem: {
    paddingVertical: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  reviewComment: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reviewDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  bottomSpacing: {
    height: 32,
  },
});

export default withCustomerAuth(TechnicianProfile);
