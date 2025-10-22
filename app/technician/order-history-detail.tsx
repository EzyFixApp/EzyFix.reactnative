import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';
import { STANDARD_HEADER_STYLE, STANDARD_BACK_BUTTON_STYLE } from '../../constants/HeaderConstants';

interface OrderHistoryDetail {
  id: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  address: string;
  description: string;
  status: 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
  priceRange: string;
  actualPrice: string;
  distance: string;
  estimatedTime: string;
  appointmentDate: string;
  appointmentTime: string;
  rating?: number;
  customerReview?: string;
  paymentMethod: 'prepaid' | 'cash' | 'card';
  technicianNotes?: string;
  materialsUsed?: string[];
  timeline: {
    status: string;
    timestamp: string;
    description: string;
  }[];
}

// Mock data - Chi tiết lịch sử đơn hàng
const mockOrderHistory: OrderHistoryDetail = {
  id: 'ORD-2024-002',
  serviceName: 'Thay công tắc và ổ cắm điện',
  customerName: 'Trần Thị Hoa',
  customerPhone: '0912345678',
  address: '456 Đường Nguyễn Huệ, Quận 3, TP.HCM',
  description: 'Thay 5 công tắc và 3 ổ cắm điện bị hỏng. Công tắc cũ đã bị cháy, ổ cắm không còn tiếp xúc tốt.',
  status: 'completed',
  createdAt: '2025-10-12T09:00:00Z',
  completedAt: '2025-10-12T11:30:00Z',
  priceRange: '200,000đ - 350,000đ',
  actualPrice: '280,000đ',
  distance: '1.8km',
  estimatedTime: '1.5 giờ',
  appointmentDate: '12/10/2025',
  appointmentTime: '09:30',
  rating: 5,
  customerReview: 'Thợ làm việc nhanh và chuyên nghiệp. Rất hài lòng với chất lượng công việc. Công tắc và ổ cắm hoạt động tốt, giá cả hợp lý.',
  paymentMethod: 'cash',
  technicianNotes: 'Đã thay thế 5 công tắc 1 chiều và 3 ổ cắm 2 lỗ. Sử dụng vật liệu chính hãng, đảm bảo an toàn điện.',
  materialsUsed: [
    '5 công tắc điện 1 chiều Panasonic',
    '3 ổ cắm điện 2 lỗ 16A',
    'Dây dẫn điện 1.5mm²',
    'Ống luồn dây PVC 16mm'
  ],
  timeline: [
    {
      status: 'quote_sent',
      timestamp: '2025-10-12T09:00:00Z',
      description: 'Đã gửi báo giá cho khách hàng'
    },
    {
      status: 'quote_accepted',
      timestamp: '2025-10-12T09:15:00Z',
      description: 'Khách hàng chấp nhận báo giá'
    },
    {
      status: 'on_the_way',
      timestamp: '2025-10-12T09:30:00Z',
      description: 'Đang di chuyển đến địa điểm'
    },
    {
      status: 'arrived',
      timestamp: '2025-10-12T09:45:00Z',
      description: 'Đã đến nơi và bắt đầu kiểm tra'
    },
    {
      status: 'repairing',
      timestamp: '2025-10-12T10:00:00Z',
      description: 'Bắt đầu thay thế công tắc và ổ cắm'
    },
    {
      status: 'completed',
      timestamp: '2025-10-12T11:30:00Z',
      description: 'Hoàn thành công việc và thanh toán'
    }
  ]
};

// Helper functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDateTime = (dateString: string) => {
  return `${formatDate(dateString)} • ${formatTime(dateString)}`;
};

const formatMoney = (amount: string) => {
  return amount.replace(/đ/g, 'đ');
};

const calculateEarnings = (actualPrice: string) => {
  const price = parseInt(actualPrice.replace(/[^\d]/g, ''));
  const commission = Math.round(price * 0.15); // 15% commission
  const netEarnings = price - commission;
  return { price, commission, netEarnings };
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return '#10B981';
    case 'cancelled':
      return '#EF4444';
    case 'quote_sent':
      return '#609CEF';
    case 'quote_accepted':
      return '#3B82F6';
    case 'on_the_way':
      return '#F59E0B';
    case 'arrived':
      return '#8B5CF6';
    case 'repairing':
      return '#EC4899';
    default:
      return '#6B7280';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'quote_sent':
      return 'Đã gửi báo giá';
    case 'quote_accepted':
      return 'Khách chấp nhận';
    case 'on_the_way':
      return 'Đang di chuyển';
    case 'arrived':
      return 'Đã đến nơi';
    case 'repairing':
      return 'Đang sửa chữa';
    case 'completed':
      return 'Hoàn thành';
    case 'cancelled':
      return 'Đã hủy';
    default:
      return status;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'quote_sent':
      return 'calculator-outline';
    case 'quote_accepted':
      return 'checkmark-circle-outline';
    case 'on_the_way':
      return 'car-outline';
    case 'arrived':
      return 'location-outline';
    case 'repairing':
      return 'build-outline';
    case 'completed':
      return 'checkmark-circle';
    case 'cancelled':
      return 'close-circle';
    default:
      return 'ellipse-outline';
  }
};

function OrderHistoryDetail() {
  const { orderId } = useLocalSearchParams();
  const [order, setOrder] = useState<OrderHistoryDetail | null>(null);
  const [showFullTimeline, setShowFullTimeline] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Reset and start entrance animation
    fadeAnim.setValue(0);
    slideAnim.setValue(30);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Load order data
    if (orderId) {
      // In real app, this would be an API call
      setOrder(mockOrderHistory);
    }
  }, [orderId]);

  if (!order) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#609CEF" />
        <Stack.Screen options={{ headerShown: false }} />

        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy đơn hàng</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const earnings = calculateEarnings(order.actualPrice);
  const displayTimeline = showFullTimeline ? order.timeline : order.timeline.slice(-3);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#609CEF" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient colors={['#609CEF', '#3B82F6']} style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <Animated.ScrollView
        style={[styles.scrollContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Order Status Banner */}
        <View style={styles.statusBanner}>
          <LinearGradient
            colors={order.status === 'completed' ? ['#10B981', '#059669'] : ['#EF4444', '#DC2626']}
            style={styles.statusGradient}
          >
            <View style={styles.statusContent}>
              <Ionicons
                name={order.status === 'completed' ? 'checkmark-circle' : 'close-circle'}
                size={24}
                color="white"
              />
              <Text style={styles.statusText}>
                {order.status === 'completed' ? 'Đơn hàng đã hoàn thành' : 'Đơn hàng đã hủy'}
              </Text>
              <Text style={styles.statusDate}>
                {order.status === 'completed'
                  ? `Hoàn thành: ${formatDateTime(order.completedAt!)}`
                  : `Hủy: ${formatDateTime(order.cancelledAt!)}`
                }
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Service Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin dịch vụ</Text>
          <View style={styles.card}>
            <Text style={styles.serviceName}>{order.serviceName}</Text>
            <Text style={styles.customerName}>Khách hàng: {order.customerName}</Text>

            <View style={styles.serviceDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                <Text style={styles.detailText}>
                  {formatDate(order.createdAt)} - {order.appointmentTime}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={16} color="#6B7280" />
                <Text style={styles.detailText}>{order.address}</Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.detailText}>
                  Thời gian dự kiến: {order.estimatedTime}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả công việc</Text>
          <View style={styles.card}>
            <Text style={styles.descriptionText}>{order.description}</Text>
          </View>
        </View>

        {/* Materials Used */}
        {order.materialsUsed && order.materialsUsed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vật liệu sử dụng</Text>
            <View style={styles.card}>
              {order.materialsUsed.map((material, index) => (
                <View key={index} style={styles.materialItem}>
                  <Ionicons name="hardware-chip-outline" size={16} color="#609CEF" />
                  <Text style={styles.materialText}>{material}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Technician Notes */}
        {order.technicianNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ghi chú kỹ thuật</Text>
            <View style={styles.card}>
              <Text style={styles.notesText}>{order.technicianNotes}</Text>
            </View>
          </View>
        )}

        {/* Payment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
          <View style={styles.card}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Giá dự kiến:</Text>
              <Text style={styles.paymentValue}>{formatMoney(order.priceRange)}</Text>
            </View>

            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Giá thực tế:</Text>
              <Text style={[styles.paymentValue, styles.actualPrice]}>{formatMoney(order.actualPrice)}</Text>
            </View>

            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Phương thức:</Text>
              <Text style={styles.paymentValue}>
                {order.paymentMethod === 'cash' ? 'Tiền mặt' :
                 order.paymentMethod === 'card' ? 'Thẻ' : 'Chuyển khoản'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.earningsBreakdown}>
              <Text style={styles.earningsTitle}>Phân bổ thu nhập</Text>

              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Tổng thu:</Text>
                <Text style={styles.earningsValue}>{formatMoney(order.actualPrice)}</Text>
              </View>

              <View style={styles.earningsRow}>
                <Text style={styles.earningsLabel}>Chi Phí App: (15%):</Text>
                <Text style={[styles.earningsValue, styles.commissionText]}>
                  -{earnings.commission.toLocaleString('vi-VN')}đ
                </Text>
              </View>

              <View style={[styles.earningsRow, styles.netEarningsRow]}>
                <Text style={[styles.earningsLabel, styles.netEarningsLabel]}>Thu nhập ròng:</Text>
                <Text style={[styles.earningsValue, styles.netEarningsValue]}>
                  {earnings.netEarnings.toLocaleString('vi-VN')}đ
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Customer Review */}
        {order.rating && order.customerReview && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Đánh giá từ khách hàng</Text>
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.starsContainer}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons
                      key={i}
                      name="star"
                      size={16}
                      color={i < order.rating! ? "#F59E0B" : "#E5E7EB"}
                    />
                  ))}
                </View>
                <Text style={styles.ratingText}>{order.rating}/5</Text>
              </View>
              <Text style={styles.reviewText}>"{order.customerReview}"</Text>
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.section}>
          <View style={styles.timelineHeader}>
            <Text style={styles.sectionTitle}>Quá trình thực hiện</Text>
            <TouchableOpacity
              onPress={() => setShowFullTimeline(!showFullTimeline)}
              style={styles.timelineToggle}
            >
              <Text style={styles.timelineToggleText}>
                {showFullTimeline ? 'Thu gọn' : 'Xem tất cả'}
              </Text>
              <Ionicons
                name={showFullTimeline ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#609CEF"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.timelineContainer}>
            {displayTimeline.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineLine}>
                  <View style={[styles.timelineDot, { backgroundColor: getStatusColor(item.status) }]} />
                  {index < displayTimeline.length - 1 && <View style={styles.timelineConnector} />}
                </View>

                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeaderRow}>
                    <Text style={styles.timelineStatus}>{getStatusText(item.status)}</Text>
                    <Text style={styles.timelineTime}>{formatTime(item.timestamp)}</Text>
                  </View>
                  <Text style={styles.timelineDescription}>{item.description}</Text>
                  <Text style={styles.timelineDate}>{formatDate(item.timestamp)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    ...STANDARD_HEADER_STYLE,
  },
  headerBackButton: {
    ...STANDARD_BACK_BUTTON_STYLE,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  statusBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statusGradient: {
    padding: 20,
  },
  statusContent: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginTop: 8,
    marginBottom: 4,
  },
  statusDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  serviceDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    lineHeight: 20,
  },
  descriptionText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  materialText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  actualPrice: {
    color: '#10B981',
    fontSize: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  earningsBreakdown: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },
  earningsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  earningsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  commissionText: {
    color: '#EF4444',
  },
  netEarningsRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 8,
  },
  netEarningsLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  netEarningsValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  reviewText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timelineToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#609CEF',
  },
  timelineContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLine: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
  },
  timelineConnector: {
    width: 2,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginTop: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  timelineTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  timelineDescription: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#609CEF',
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

// Export protected component
export default withTechnicianAuth(OrderHistoryDetail, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});