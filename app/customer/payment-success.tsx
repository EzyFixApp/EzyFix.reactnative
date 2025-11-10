import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  SafeAreaView,
  Animated,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import withCustomerAuth from '../../lib/auth/withCustomerAuth';
import ReviewModal from '../../components/ReviewModal';

function PaymentSuccess() {
  const params = useLocalSearchParams<{
    appointmentId: string;
    amount: string;
    orderId: string;
    serviceName: string;
    technicianName: string;
    providerId: string;
  }>();

  const [successAnimation] = useState(new Animated.Value(0));
  const [showReviewModal, setShowReviewModal] = useState(false);

  const amount = parseFloat(params.amount || '0');
  const currentDate = new Date();

  // Format tiền VND
  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  // Format ngày giờ
  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Success animation
  useEffect(() => {
    Animated.sequence([
      Animated.spring(successAnimation, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handle share bill
  const handleShareBill = async () => {
    try {
      const message = `
🧾 HÓA ĐƠN THANH TOÁN - EZYFIX

Mã đơn hàng: ${params.orderId}
Dịch vụ: ${params.serviceName}
Thợ sửa chữa: ${params.technicianName}
Số tiền: ${formatMoney(amount)}
Thời gian: ${formatDateTime(currentDate)}

Trạng thái: ✅ Đã thanh toán thành công

Cảm ơn bạn đã sử dụng dịch vụ EzyFix!
      `.trim();

      await Share.share({
        message,
      });
    } catch (error) {
      console.error('Error sharing bill:', error);
    }
  };

  // Navigate to home
  const handleGoToHome = () => {
    router.replace('/customer/dashboard');
  };

  // View order details
  const handleViewOrderDetails = () => {
    router.replace({
      pathname: '/customer/order-tracking',
      params: { orderId: params.appointmentId },
    });
  };

  // Handle review submission
  const handleReviewSubmit = () => {
    console.log('✅ Review submitted, closing modal');
    setShowReviewModal(false);
  };

  // Open review modal
  const handleOpenReview = () => {
    if (!params.providerId) {
      console.error('❌ Missing providerId');
      alert('Không thể đánh giá lúc này. Vui lòng thử lại sau.');
      return;
    }
    setShowReviewModal(true);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
          gestureEnabled: false, // CRITICAL: Prevent swipe back after payment success
        }}
      />
      <StatusBar barStyle="light-content" backgroundColor="#10B981" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Success Header */}
        <LinearGradient colors={['#10B981', '#059669']} style={styles.successHeader}>
          <SafeAreaView style={styles.safeAreaHeader}>
          <Animated.View
            style={[
              styles.successIconContainer,
              {
                transform: [
                  {
                    scale: successAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={64} color="#FFFFFF" />
            </View>
          </Animated.View>

          <Animated.Text
            style={[
              styles.successTitle,
              {
                opacity: successAnimation,
              },
            ]}
          >
            Thanh toán thành công!
          </Animated.Text>

          <Animated.Text
            style={[
              styles.successSubtitle,
              {
                opacity: successAnimation,
              },
            ]}
          >
            Đơn hàng của bạn đã được hoàn tất
          </Animated.Text>

          <Animated.View
            style={[
              styles.amountContainer,
              {
                opacity: successAnimation,
              },
            ]}
          >
            <Text style={styles.amountLabel}>Số tiền đã thanh toán</Text>
            <Text style={styles.amountValue}>{formatMoney(amount)}</Text>
          </Animated.View>
          </SafeAreaView>
        </LinearGradient>

        {/* Bill Details Card */}
        <View style={styles.billCard}>
          <View style={styles.billHeader}>
            <Ionicons name="receipt-outline" size={24} color="#609CEF" />
            <Text style={styles.billHeaderTitle}>Chi tiết hóa đơn</Text>
          </View>

          <View style={styles.billDivider} />

          {/* Order Info */}
          <View style={styles.billSection}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Mã đơn hàng</Text>
              <Text style={styles.billValue}>#{params.orderId?.substring(0, 8).toUpperCase()}</Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Dịch vụ</Text>
              <Text style={styles.billValueBold}>{params.serviceName}</Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Thợ sửa chữa</Text>
              <Text style={styles.billValue}>{params.technicianName}</Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Thời gian</Text>
              <Text style={styles.billValue}>{formatDateTime(currentDate)}</Text>
            </View>
          </View>

          <View style={styles.billDivider} />

          {/* Payment Info */}
          <View style={styles.billSection}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Phương thức</Text>
              <View style={styles.paymentMethodBadge}>
                <Ionicons name="card-outline" size={14} color="#609CEF" />
                <Text style={styles.paymentMethodText}>PayOS</Text>
              </View>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Trạng thái</Text>
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.statusText}>Đã thanh toán</Text>
              </View>
            </View>
          </View>

          <View style={styles.billDivider} />

          {/* Total Amount */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Tổng thanh toán</Text>
            <Text style={styles.totalValue}>{formatMoney(amount)}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Review Button - Prominent */}
          <TouchableOpacity
            style={styles.reviewButton}
            onPress={handleOpenReview}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#FFB800', '#FFA000']} style={styles.reviewButtonGradient}>
              <Ionicons name="star" size={20} color="#FFFFFF" />
              <Text style={styles.reviewButtonText}>Đánh giá thợ</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary Actions */}
          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.shareButton} onPress={handleShareBill} activeOpacity={0.8}>
              <Ionicons name="share-social-outline" size={20} color="#609CEF" />
              <Text style={styles.shareButtonText}>Chia sẻ hóa đơn</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.detailsButton}
              onPress={handleViewOrderDetails}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text-outline" size={20} color="#609CEF" />
              <Text style={styles.detailsButtonText}>Xem chi tiết đơn hàng</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Message */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Hóa đơn điện tử đã được gửi đến email của bạn. Bạn có thể xem lại chi tiết giao dịch trong lịch
            sử đơn hàng.
          </Text>
        </View>

        {/* Thank You Message */}
        <View style={styles.thankYouCard}>
          <Text style={styles.thankYouTitle}>🎉 Cảm ơn bạn đã sử dụng EzyFix!</Text>
          <Text style={styles.thankYouMessage}>
            Chúng tôi hy vọng dịch vụ đã mang lại trải nghiệm tốt cho bạn. Đừng quên đánh giá và chia sẻ
            góp ý để chúng tôi cải thiện dịch vụ nhé!
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.homeButton} onPress={handleGoToHome} activeOpacity={0.8}>
          <LinearGradient colors={['#609CEF', '#3B82F6']} style={styles.homeButtonGradient}>
            <Ionicons name="home-outline" size={20} color="#FFFFFF" />
            <Text style={styles.homeButtonText}>Về trang chủ</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Review Modal */}
      <ReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onReviewSubmit={handleReviewSubmit}
        appointmentId={params.appointmentId}
        providerId={params.providerId || ''}
        technicianName={params.technicianName}
        serviceName={params.serviceName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  successHeader: {
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  safeAreaHeader: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    paddingTop: 20,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 24,
    textAlign: 'center',
  },
  amountContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  amountLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  billHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  billSection: {
    gap: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  billValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  billValueBold: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentMethodText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#609CEF',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#10B981',
  },
  actionsContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  reviewButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#FFB800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  reviewButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  reviewButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryActions: {
    gap: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#609CEF',
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#609CEF',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#609CEF',
  },
  detailsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#609CEF',
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  thankYouCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 100,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  thankYouTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  thankYouMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  homeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  homeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default withCustomerAuth(PaymentSuccess);
