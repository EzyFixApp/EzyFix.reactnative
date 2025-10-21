import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import TechnicianHeader from '../../components/TechnicianHeader';
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';

const { width } = Dimensions.get('window');

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  trend?: {
    value: string;
    isUp: boolean;
  };
}

interface PeriodData {
  period: string;
  completedJobs: number;
  totalEarnings: number;
  averageRating: number;
  totalHours: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, trend }) => (
  <View style={styles.statCard}>
    <LinearGradient
      colors={[color, color + 'E6', color + 'CC']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statGradient}
    >
      <View style={styles.statHeader}>
        <View style={styles.statIconContainer}>
          <Ionicons name={icon} size={26} color="#FFFFFF" />
        </View>
        {trend && (
          <View style={styles.trendContainer}>
            <View style={[styles.trendBadge, { backgroundColor: trend.isUp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }]}>
              <Ionicons 
                name={trend.isUp ? "trending-up" : "trending-down"} 
                size={14} 
                color="#FFFFFF" 
              />
              <Text style={styles.trendText}>{trend.value}</Text>
            </View>
          </View>
        )}
      </View>
      
      <Text 
        style={styles.statValue}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.8}
      >
        {value}
      </Text>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </LinearGradient>
  </View>
);

const PeriodCard: React.FC<{ data: PeriodData; isActive: boolean; onPress: () => void }> = ({
  data,
  isActive,
  onPress,
}) => (
  <TouchableOpacity
    style={[styles.periodCard, isActive && styles.activePeriodCard]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    {isActive && (
      <LinearGradient
        colors={['#609CEF', '#4F8EF7']}
        style={styles.periodCardGradient}
      >
        <View style={styles.periodCardContent}>
          <Text style={[styles.periodTitle, styles.activePeriodTitle]}>
            {data.period}
          </Text>
          <View style={styles.periodStats}>
            <View style={styles.periodStatItem}>
              <Text style={[styles.periodStatValue, styles.activePeriodText]} numberOfLines={1}>
                {data.completedJobs}
              </Text>
              <Text style={[styles.periodStatLabel, styles.activePeriodText]}>
                Đơn hoàn thành
              </Text>
            </View>
            <View style={[styles.periodStatDivider, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]} />
            <View style={styles.periodStatItem}>
              <Text style={[styles.periodStatValue, styles.activePeriodText]} numberOfLines={1}>
                {(data.totalEarnings / 1000000).toFixed(1)}M
              </Text>
              <Text style={[styles.periodStatLabel, styles.activePeriodText]}>
                VND
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    )}
    {!isActive && (
      <View style={styles.periodCardContent}>
        <Text style={styles.periodTitle}>
          {data.period}
        </Text>
        <View style={styles.periodStats}>
          <View style={styles.periodStatItem}>
            <Text style={styles.periodStatValue} numberOfLines={1}>
              {data.completedJobs}
            </Text>
            <Text style={styles.periodStatLabel}>
              Đơn hoàn thành
            </Text>
          </View>
          <View style={styles.periodStatDivider} />
          <View style={styles.periodStatItem}>
            <Text style={styles.periodStatValue} numberOfLines={1}>
              {(data.totalEarnings / 1000000).toFixed(1)}M
            </Text>
            <Text style={styles.periodStatLabel}>
              VND
            </Text>
          </View>
        </View>
      </View>
    )}
  </TouchableOpacity>
);

function StatisticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState(0);
  
  const periodsData: PeriodData[] = [
    {
      period: 'Hôm nay',
      completedJobs: 8,
      totalEarnings: 1850000,
      averageRating: 4.8,
      totalHours: 9.5,
    },
    {
      period: 'Tuần này',
      completedJobs: 32,
      totalEarnings: 8500000,
      averageRating: 4.7,
      totalHours: 45.2,
    },
    {
      period: 'Tháng này',
      completedJobs: 127,
      totalEarnings: 28750000,
      averageRating: 4.8,
      totalHours: 186.5,
    },
    {
      period: 'Tháng trước',
      completedJobs: 145,
      totalEarnings: 32200000,
      averageRating: 4.6,
      totalHours: 198.3,
    },
  ];

  const currentData = periodsData[selectedPeriod];

  const formatMoney = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const getAverageEarningsPerJob = (): string => {
    if (currentData.completedJobs === 0) return '0';
    return formatMoney(Math.round(currentData.totalEarnings / currentData.completedJobs));
  };

  const getEarningsPerHour = (): string => {
    if (currentData.totalHours === 0) return '0';
    return formatMoney(Math.round(currentData.totalEarnings / currentData.totalHours));
  };

  // Mock data for charts/trends
  const weeklyEarnings = [
    { day: 'T2', amount: 1200000 },
    { day: 'T3', amount: 950000 },
    { day: 'T4', amount: 1450000 },
    { day: 'T5', amount: 1100000 },
    { day: 'T6', amount: 1680000 },
    { day: 'T7', amount: 1320000 },
    { day: 'CN', amount: 800000 },
  ];

  const serviceCategories = [
    { name: 'Sửa chữa điện', count: 45, percentage: 35, color: '#609CEF' },
    { name: 'Lắp đặt thiết bị', count: 32, percentage: 25, color: '#10B981' },
    { name: 'Sửa máy lạnh', count: 28, percentage: 22, color: '#F59E0B' },
    { name: 'Sửa đường ống nước', count: 23, percentage: 18, color: '#EF4444' },
  ];

  const handleBackPress = () => {
    router.back();
  };

  const handleSearchPress = () => {
    // Search functionality for statistics
  };

  const handleNotificationPress = () => {
    // Navigate to notifications
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#609CEF" />
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header - Using TechnicianHeader for consistency */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#609CEF', '#4F8BE8', '#3D7CE0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            {/* Back Button */}
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBackPress}
            >
              <View style={styles.backButtonContainer}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </View>
            </TouchableOpacity>

            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.headerTitle}>Thống kê</Text>
              <Text style={styles.headerSubtitle}>Báo cáo hiệu suất</Text>
            </View>

            {/* Filter Button */}
            <TouchableOpacity style={styles.filterButton}>
              <View style={styles.filterButtonContainer}>
                <Ionicons name="filter-outline" size={20} color="white" />
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Period Selection */}
        <View style={styles.periodSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={20} color="#609CEF" />
            <Text style={styles.sectionTitle}>Thời gian</Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.periodScrollContainer}
          >
            {periodsData.map((period, index) => (
              <PeriodCard
                key={index}
                data={period}
                isActive={selectedPeriod === index}
                onPress={() => setSelectedPeriod(index)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Main Statistics */}
        <View style={styles.mainStatsSection}>
          <View style={styles.statsRow}>
            <StatCard
              title="Tổng thu nhập"
              value={formatMoney(currentData.totalEarnings) + ' ₫'}
              subtitle={`${currentData.period.toLowerCase()}`}
              icon="wallet-outline"
              color="#10B981"
              trend={{ value: "+12%", isUp: true }}
            />
            
            <StatCard
              title="Đơn hoàn thành"
              value={currentData.completedJobs.toString()}
              subtitle="đơn hàng"
              icon="checkmark-circle-outline"
              color="#609CEF"
              trend={{ value: "+8%", isUp: true }}
            />
          </View>

          <View style={styles.statsRow}>
            <StatCard
              title="Đánh giá TB"
              value={currentData.averageRating.toFixed(1)}
              subtitle="trên 5 sao"
              icon="star-outline"
              color="#F59E0B"
              trend={{ value: "+0.2", isUp: true }}
            />
            
            <StatCard
              title="Giờ làm việc"
              value={currentData.totalHours.toString()}
              subtitle="giờ"
              icon="time-outline"
              color="#8B5CF6"
            />
          </View>
        </View>

        {/* Performance Insights */}
        <View style={styles.insightsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="analytics-outline" size={20} color="#609CEF" />
            <Text style={styles.sectionTitle}>Phân tích hiệu suất</Text>
          </View>

          <View style={styles.insightCard}>
            <View style={styles.insightRow}>
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>TB mỗi đơn</Text>
                <Text style={styles.insightValue}>{getAverageEarningsPerJob()} ₫</Text>
              </View>
              <View style={styles.insightDivider} />
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Thu nhập/giờ</Text>
                <Text style={styles.insightValue}>{getEarningsPerHour()} ₫</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Weekly Earnings Chart */}
        <View style={styles.chartSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bar-chart-outline" size={20} color="#609CEF" />
            <Text style={styles.sectionTitle}>Thu nhập tuần này</Text>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chart}>
              {weeklyEarnings.map((item, index) => {
                const maxAmount = Math.max(...weeklyEarnings.map(e => e.amount));
                const height = (item.amount / maxAmount) * 120;
                return (
                  <View key={index} style={styles.chartBar}>
                    <View 
                      style={[
                        styles.bar, 
                        { 
                          height: height,
                          backgroundColor: index === 4 ? '#609CEF' : '#E5E7EB' // Highlight Friday
                        }
                      ]} 
                    />
                    <Text style={styles.chartLabel}>{item.day}</Text>
                    <Text style={styles.chartAmount}>
                      {(item.amount / 1000000).toFixed(1)}M
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Service Categories */}
        <View style={styles.categorySection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pie-chart-outline" size={20} color="#609CEF" />
            <Text style={styles.sectionTitle}>Loại dịch vụ</Text>
          </View>

          <View style={styles.categoryCard}>
            {serviceCategories.map((category, index) => (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryCount}>({category.count})</Text>
                </View>
                <View style={styles.categoryProgress}>
                  <View 
                    style={[
                      styles.categoryProgressBar, 
                      { 
                        width: `${category.percentage}%`,
                        backgroundColor: category.color 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.categoryPercentage}>{category.percentage}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Achievement Badges */}
        <View style={styles.achievementSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy-outline" size={20} color="#609CEF" />
            <Text style={styles.sectionTitle}>Thành tích</Text>
          </View>

          <View style={styles.achievementsGrid}>
            <View style={styles.achievementBadge}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.badgeGradient}
              >
                <Ionicons name="star" size={24} color="#FFFFFF" />
                <Text style={styles.badgeTitle}>Top Performer</Text>
                <Text style={styles.badgeSubtitle}>Đánh giá 4.8/5</Text>
              </LinearGradient>
            </View>

            <View style={styles.achievementBadge}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.badgeGradient}
              >
                <Ionicons name="flash" size={24} color="#FFFFFF" />
                <Text style={styles.badgeTitle}>Speed Master</Text>
                <Text style={styles.badgeSubtitle}>Hoàn thành nhanh</Text>
              </LinearGradient>
            </View>

            <View style={styles.achievementBadge}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.badgeGradient}
              >
                <Ionicons name="people" size={24} color="#FFFFFF" />
                <Text style={styles.badgeTitle}>Customer Favorite</Text>
                <Text style={styles.badgeSubtitle}>Khách yêu thích</Text>
              </LinearGradient>
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Enhanced Header Styles
  headerContainer: {
    shadowColor: '#609CEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 50,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  backButton: {
    padding: 4,
  },
  backButtonContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  titleSection: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  filterButton: {
    padding: 4,
  },
  filterButtonContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  scrollContainer: {
    flex: 1,
  },
  
  // Period Selection
  periodSection: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  periodScrollContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  periodCard: {
    minWidth: 160,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activePeriodCard: {
    borderColor: '#609CEF',
    shadowColor: '#609CEF',
    shadowOpacity: 0.25,
    elevation: 8,
  },
  periodCardGradient: {
    borderRadius: 16,
    padding: 18,
  },
  periodCardContent: {
    padding: 18,
  },
  periodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  activePeriodTitle: {
    color: '#FFFFFF',
  },
  periodStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  periodStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  periodStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
  },
  periodStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  periodStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  activePeriodText: {
    color: '#FFFFFF',
  },

  // Main Statistics
  mainStatsSection: {
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  statGradient: {
    padding: 22,
    borderRadius: 20,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Insights Section
  insightsSection: {
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#609CEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(96, 156, 239, 0.08)',
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightItem: {
    flex: 1,
    alignItems: 'center',
  },
  insightLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  insightValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  insightDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },

  // Chart Section
  chartSection: {
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#609CEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(96, 156, 239, 0.08)',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingBottom: 24,
    paddingHorizontal: 8,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 24,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#609CEF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  chartAmount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#609CEF',
  },

  // Category Section
  categorySection: {
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#609CEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(96, 156, 239, 0.08)',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  categoryCount: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 12,
  },
  categoryProgress: {
    width: 60,
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    marginHorizontal: 12,
  },
  categoryProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  categoryPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 30,
    textAlign: 'right',
  },

  // Achievement Section
  achievementSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  achievementsGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  achievementBadge: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  badgeGradient: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 18,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 2,
    textAlign: 'center',
  },
  badgeSubtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});

// Export protected component
export default withTechnicianAuth(StatisticsScreen, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});