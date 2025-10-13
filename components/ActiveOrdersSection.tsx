import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

interface ActiveOrder {
  id: string;
  serviceName: string;
  status: 'searching' | 'quoted' | 'accepted' | 'in-progress';
  technicianName?: string;
  estimatedTime?: string;
  currentStep?: string;
}

// Mock data - replace with real data from API
const mockActiveOrders: ActiveOrder[] = [
  {
    id: '1',
    serviceName: 'Sửa điều hòa',
    status: 'quoted',
    technicianName: 'Thợ Minh',
    estimatedTime: '2 giờ',
    currentStep: 'Đang chờ xác nhận báo giá',
  },
  {
    id: '2',
    serviceName: 'Sửa ống nước',
    status: 'searching',
    estimatedTime: '30 phút',
    currentStep: 'Đang tìm thợ phù hợp',
  },
];

export default function ActiveOrdersSection() {
  if (mockActiveOrders.length === 0) {
    return null; // Don't show section if no active orders
  }

  const getStatusIcon = (status: ActiveOrder['status']) => {
    switch (status) {
      case 'searching':
        return 'search-outline';
      case 'quoted':
        return 'document-text-outline';
      case 'accepted':
        return 'checkmark-circle-outline';
      case 'in-progress':
        return 'build-outline';
      default:
        return 'time-outline';
    }
  };

  const getStatusColor = (status: ActiveOrder['status']) => {
    switch (status) {
      case 'searching':
        return '#F59E0B';
      case 'quoted':
        return '#3B82F6';
      case 'accepted':
        return '#10B981';
      case 'in-progress':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const renderOrderCard = (order: ActiveOrder) => {
    const statusColor = getStatusColor(order.status);
    const statusIcon = getStatusIcon(order.status);

    return (
      <TouchableOpacity
        key={order.id}
        style={styles.orderCard}
        onPress={() => {
          router.push({
            pathname: './order-tracking',
            params: { orderId: order.id }
          } as any);
        }}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.cardGradient}
        >
          {/* Status indicator */}
          <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />

          {/* Card Content */}
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${statusColor}20` }]}>
                <Ionicons name={statusIcon as any} size={20} color={statusColor} />
              </View>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.serviceName}>{order.serviceName}</Text>
                {order.technicianName && (
                  <View style={styles.technicianRow}>
                    <Ionicons name="person-outline" size={12} color="#6B7280" />
                    <Text style={styles.technicianText}>{order.technicianName}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Current Step */}
            <View style={styles.stepContainer}>
              <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
              <Text style={styles.stepText}>{order.currentStep}</Text>
            </View>

            {/* Footer with Track Button */}
            <View style={styles.cardFooter}>
              <View style={styles.timeContainer}>
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text style={styles.timeText}>~{order.estimatedTime}</Text>
              </View>
              <View style={styles.trackButtonSmall}>
                <Text style={[styles.trackButtonSmallText, { color: statusColor }]}>Theo dõi</Text>
                <Ionicons name="chevron-forward" size={14} color={statusColor} />
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.titleContainer}>
          <LinearGradient
            colors={['#609CEF', '#7B68EE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.titleIconContainer}
          >
            <Ionicons name="flash" size={16} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.sectionTitle}>Đơn đang xử lý</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{mockActiveOrders.length}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push('./booking-history' as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Scrollable Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {mockActiveOrders.map(renderOrderCard)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginRight: 8,
  },
  countBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#609CEF',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  orderCard: {
    width: 280,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardGradient: {
    padding: 16,
    position: 'relative',
  },
  statusIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  cardContent: {
    marginTop: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  technicianRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  technicianText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  stepText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  trackButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trackButtonSmallText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
