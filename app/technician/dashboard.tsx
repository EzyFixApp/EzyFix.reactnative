import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import TechnicianHeader from '../../components/TechnicianHeader';
import BottomNavigation from '../../components/BottomNavigation';

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  iconBg: string;
}

function StatCard({ icon, title, subtitle, iconBg }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={32} color="white" />
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </View>
  );
}

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  iconBg: string;
  onPress?: () => void;
}

interface ReviewProps {
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  avatar?: string;
}

interface ReviewProps {
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  avatar?: string;
}

function QuickAction({ icon, title, subtitle, iconBg, onPress }: QuickActionProps) {
  return (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.quickActionIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={28} color="white" />
      </View>
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

function ReviewCard({ customerName, rating, comment, date }: ReviewProps) {
  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? "star" : "star-outline"}
        size={16}
        color={index < rating ? "#FFB800" : "#E5E7EB"}
      />
    ));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase();
  };

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewAvatar}>
          <Text style={styles.reviewAvatarText}>{getInitials(customerName)}</Text>
        </View>
        <View style={styles.reviewInfo}>
          <Text style={styles.reviewName}>{customerName}</Text>
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars()}
            </View>
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.reviewDate}>{date}</Text>
      </View>
      <Text style={styles.reviewComment}>{comment}</Text>
    </View>
  );
}

export default function TechnicianDashboard() {
  const [activeTab, setActiveTab] = useState('home');

  const handleSearchPress = () => {
    console.log('Search pressed');
  };

  const handleNotificationPress = () => {
    console.log('Notification pressed');
  };

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId);
    console.log('Tab pressed:', tabId);
  };

  const handleCenterButtonPress = () => {
    console.log('Logo pressed');
  };

  const handleNewOrderPress = () => {
    router.push('/technician/orders');
  };

  const handleTrackOrderPress = () => {
    // Navigate to a sample order tracking
    router.push({
      pathname: '/technician/order-tracking',
      params: { orderId: 'ORD-001' }
    });
  };

  const handleQuickActionPress = (action: string) => {
    switch (action) {
      case 'Đơn hàng':
        router.push('/technician/orders');
        break;
      case 'Thông tin':
        console.log('Thông tin pressed - Sẽ tạo trang thông tin cá nhân sau');
        break;
      case 'Cài đặt':
        console.log('Cài đặt pressed - Sẽ tạo trang cài đặt sau');
        break;
      case 'Thống kê':
        console.log('Thống kê pressed - Sẽ tạo trang thống kê sau');
        break;
      default:
        console.log(`${action} pressed`);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <TechnicianHeader
          title="EzyFix Worker"
          onSearchPress={handleSearchPress}
          onAvatarPress={handleNotificationPress}
          notificationCount={3}
        />

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Greeting Section */}
          <View style={styles.greetingSection}>
            <View style={styles.welcomeContainer}>
              <Text style={styles.greetingTitle}>👋 Chào bạn!</Text>
              <Text style={styles.greetingSubtitle}>Thợ Minh Tuấn</Text>
              <Text style={styles.motivationText}>Hôm nay là ngày tốt để giúp đỡ khách hàng!</Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Đang sẵn sàng</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <View style={styles.quickActionsGrid}>
              <QuickAction
                icon="receipt-outline"
                title="Đơn hàng"
                subtitle="Quản lý đơn hàng"
                iconBg="#609CEF"
                onPress={() => handleQuickActionPress('Đơn hàng')}
              />
              <QuickAction
                icon="person-outline"
                title="Thông tin"
                subtitle="Hồ sơ cá nhân"
                iconBg="#609CEF"
                onPress={() => handleQuickActionPress('Thông tin')}
              />
              <QuickAction
                icon="settings-outline"
                title="Cài đặt"
                subtitle="Tùy chỉnh"
                iconBg="#609CEF"
                onPress={() => handleQuickActionPress('Cài đặt')}
              />
              <QuickAction
                icon="bar-chart-outline"
                title="Thống kê"
                subtitle="Báo cáo doanh thu"
                iconBg="#609CEF"
                onPress={() => handleQuickActionPress('Thống kê')}
              />
            </View>
          </View>

          {/* Today Stats */}
          <View style={styles.todaySection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={20} color="#FF6B6B" />
              <Text style={styles.sectionTitle}>Hôm nay</Text>
            </View>
            
            <View style={styles.statsGrid}>
              <StatCard
                icon="clipboard-outline"
                title="5"
                subtitle="Việc mới"
                iconBg="#FF6B6B"
              />
              <StatCard
                icon="checkmark-done-outline"
                title="3"
                subtitle="Đã xong"
                iconBg="#4ECDC4"
              />
              <StatCard
                icon="cash-outline"
                title="850,000"
                subtitle="VNĐ - Doanh thu"
                iconBg="#10B981"
              />
            </View>
          </View>


          {/* Reviews Section */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsSectionHeader}>
              <View style={styles.sectionHeader}>
                <Ionicons name="star-outline" size={20} color="#FF6B6B" />
                <Text style={styles.sectionTitle}>Đánh giá gần đây</Text>
              </View>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.reviewsList}>
              <ReviewCard
                customerName="Donna Bins"
                rating={4.5}
                comment="Thợ làm việc rất nhanh và chuyên nghiệp. Chất lượng dịch vụ tốt, giá cả hợp lý."
                date="02 Dec"
              />
              <ReviewCard
                customerName="Ashutosh Pandey"
                rating={4.5}
                comment="Rất hài lòng với dịch vụ. Thợ đến đúng giờ và giải quyết vấn đề nhanh chóng."
                date="25 Jan"
              />
              <ReviewCard
                customerName="Kristin Watson"
                rating={4.5}
                comment="Dịch vụ tốt, thợ tư vấn nhiệt tình. Sẽ gọi lại nếu có cần."
                date="30 Jan"
              />
            </View>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.quickActionSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash-outline" size={20} color="#FF6B6B" />
              <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
            </View>
            
            <View style={styles.quickActionButtons}>
              <TouchableOpacity style={styles.newOrderButton} onPress={handleNewOrderPress}>
                <LinearGradient
                  colors={['#10B981', '#10B981', '#10B981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 0 }}
                  style={styles.newOrderGradient}
                >
                  <Ionicons name="list-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.newOrderText}>Xem đơn hàng</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.trackOrderButton} onPress={handleTrackOrderPress}>
                <LinearGradient
                  colors={['#609CEF', '#3B82F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 0 }}
                  style={styles.trackOrderGradient}
                >
                  <Ionicons name="location-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.trackOrderText}>Theo dõi đơn</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Spacing for Navigation */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Bottom Navigation */}
        <BottomNavigation
          activeTab={activeTab}
          onTabPress={handleTabPress}
          onLogoPress={handleCenterButtonPress}
          theme="light"
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flex: 1,
  },
  greetingSection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2563EB',
    marginBottom: 8,
    textAlign: 'center',
  },
  greetingSubtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  motivationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  quickActionsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    backgroundColor: 'white',
    width: '48%',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(96, 156, 239, 0.08)',
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  quickActionContent: {
    alignItems: 'center',
    width: '100%',
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  todaySection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 14,
  },
  quickActionSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  newOrderButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  newOrderGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  newOrderText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  reviewsSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  viewAllButton: {
    marginLeft: 'auto',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#609CEF',
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#609CEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reviewAvatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  reviewInfo: {
    flex: 1,
  },
  reviewName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  reviewDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  reviewComment: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontWeight: '500',
  },
  reviewsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bottomSpacing: {
    height: 120,
  },
  quickActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  trackOrderButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  trackOrderGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  trackOrderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});