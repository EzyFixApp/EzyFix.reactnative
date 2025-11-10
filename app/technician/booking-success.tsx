import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Animated,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';

function TechnicianBookingSuccess() {
  const params = useLocalSearchParams<{
    appointmentId: string;
    serviceName: string;
    customerName: string;
    finalPrice: string;
  }>();
  
  // Animation values
  const [successAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    // Success animation
    Animated.sequence([
      Animated.spring(successAnimation, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleViewDetails = () => {
    // Navigate back to order tracking to see completed order
    router.replace({
      pathname: '/technician/technician-order-tracking',
      params: {
        serviceRequestId: params.appointmentId,
        offerId: '', // Will be loaded from appointment
      },
    });
  };

  const handleBackToOrders = () => {
    // Navigate to orders list
    router.replace('/technician/orders');
  };

  // Calculate platform fee (20%)
  const calculateEarnings = () => {
    try {
      // Remove currency formatting and parse
      const totalAmount = parseFloat(params.finalPrice?.replace(/[^\d]/g, '') || '0');
      const platformFee = totalAmount * 0.2;
      const earnings = totalAmount - platformFee;
      
      return {
        total: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount),
        platformFee: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(platformFee),
        earnings: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(earnings),
      };
    } catch (error) {
      console.error('Error calculating earnings:', error);
      return {
        total: params.finalPrice || '0 ₫',
        platformFee: '0 ₫',
        earnings: '0 ₫',
      };
    }
  };

  const amounts = calculateEarnings();

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          gestureEnabled: false, // Disable swipe back gesture
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
              Hoàn thành dịch vụ!
            </Animated.Text>

            <Animated.Text
              style={[
                styles.successSubtitle,
                {
                  opacity: successAnimation,
                },
              ]}
            >
              Khách hàng đã thanh toán thành công
            </Animated.Text>

            <Animated.View
              style={[
                styles.amountContainer,
                {
                  opacity: successAnimation,
                },
              ]}
            >
              <Text style={styles.amountLabel}>Thu nhập của bạn</Text>
              <Text style={styles.amountValue}>{amounts.earnings}</Text>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>
        {/* Service & Earnings Details Card */}
        <View style={styles.billCard}>
          <View style={styles.billHeader}>
            <Ionicons name="construct-outline" size={24} color="#609CEF" />
            <Text style={styles.billHeaderTitle}>Thông tin dịch vụ</Text>
          </View>

          <View style={styles.billDivider} />

          {/* Service Info */}
          <View style={styles.billSection}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Dịch vụ</Text>
              <Text style={styles.billValueBold}>{params.serviceName || 'Dịch vụ sửa chữa'}</Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Khách hàng</Text>
              <Text style={styles.billValue}>{params.customerName || 'Khách hàng'}</Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Mã đơn hàng</Text>
              <Text style={styles.billValue}>#{params.appointmentId?.substring(0, 8).toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.billDivider} />

          {/* Earnings Breakdown */}
          <View style={styles.billSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="wallet-outline" size={20} color="#609CEF" />
              <Text style={styles.sectionTitle}>Chi tiết thu nhập</Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Tổng thanh toán</Text>
              <Text style={styles.billValue}>{amounts.total}</Text>
            </View>

            <View style={styles.billRow}>
              <View style={styles.labelWithNote}>
                <Text style={styles.billLabel}>Phí nền tảng (20%)</Text>
                <Text style={styles.billNote}>Phí dịch vụ EzyFix</Text>
              </View>
              <Text style={styles.feeValue}>- {amounts.platformFee}</Text>
            </View>
          </View>

          <View style={styles.billDivider} />

          {/* Total Earnings */}
          <View style={styles.totalSection}>
            <View style={styles.labelWithNote}>
              <Text style={styles.totalLabel}>Thực nhận</Text>
              <Text style={styles.billNote}>Sẽ chuyển vào ví</Text>
            </View>
            <Text style={styles.totalValue}>{amounts.earnings}</Text>
          </View>
        </View>

        {/* Info Message */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Số tiền sẽ được cập nhật vào ví của bạn trong vòng 24 giờ. Bạn có thể xem lại chi tiết trong
            lịch sử giao dịch.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={handleViewDetails}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text-outline" size={20} color="#609CEF" />
            <Text style={styles.detailsButtonText}>Xem chi tiết đơn hàng</Text>
          </TouchableOpacity>
        </View>

        {/* Thank You Message */}
        <View style={styles.thankYouCard}>
          <Text style={styles.thankYouTitle}>🎉 Chúc mừng bạn đã hoàn thành công việc!</Text>
          <Text style={styles.thankYouMessage}>
            Cảm ơn bạn đã mang đến dịch vụ chất lượng cho khách hàng. Tiếp tục phát huy để nhận được nhiều
            đơn hàng hơn nhé!
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.homeButton} onPress={handleBackToOrders} activeOpacity={0.8}>
          <LinearGradient colors={['#609CEF', '#3B82F6']} style={styles.homeButtonGradient}>
            <Ionicons name="list-outline" size={20} color="#FFFFFF" />
            <Text style={styles.homeButtonText}>Về danh sách đơn</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#609CEF',
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
  billNote: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  labelWithNote: {
    flex: 1,
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    textAlign: 'right',
    marginLeft: 16,
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

export default withTechnicianAuth(TechnicianBookingSuccess);
