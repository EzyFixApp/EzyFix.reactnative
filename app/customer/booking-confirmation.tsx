import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import withCustomerAuth from '../../lib/auth/withCustomerAuth';

const { width } = Dimensions.get('window');

function BookingConfirmation() {
  const params = useLocalSearchParams();
  
  // Extract booking details from params
  const serviceName = params.serviceName as string || 'Dịch vụ';
  const customerName = params.customerName as string || 'Khách hàng';
  const requestId = params.requestId as string || '';
  const imageCount = parseInt(params.imageCount as string || '0');
  const requestedDate = params.requestedDate as string || '';
  const expectedStartTime = params.expectedStartTime as string || '';
  const addressNote = params.addressNote as string || '';
  const serviceDescription = params.serviceDescription as string || '';
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString;
  };
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Start animation sequence
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleViewHistory = () => {
    router.push('/(tabs)/bookings' as any);
  };

  const handleBackToHome = () => {
    router.push('/customer/dashboard' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <ScrollView 
        style={styles.flex}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Animation */}
        <View style={styles.animationContainer}>
          <Animated.View
            style={[
              styles.successIconContainer,
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              },
            ]}
          >
            <LinearGradient
              colors={['#4ADE80', '#22C55E']}
              style={styles.successIcon}
            >
              <Ionicons name="checkmark" size={60} color="white" />
            </LinearGradient>
          </Animated.View>

          {/* Success Message */}
          <Animated.View
            style={[
              styles.messageContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.successTitle}>Đặt lịch thành công!</Text>
            <Text style={styles.successSubtitle}>
              Yêu cầu dịch vụ <Text style={styles.serviceName}>{serviceName}</Text> của bạn đã được gửi đi
              {imageCount > 0 && (
                <>
                  {'\n'}cùng với <Text style={styles.serviceName}>{imageCount} ảnh</Text> mô tả vấn đề
                </>
              )}
            </Text>
          </Animated.View>
        </View>

        {/* Booking Info Card */}
        <Animated.View
          style={[
            styles.infoCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.infoHeader}>
            <Ionicons name="document-text-outline" size={24} color="#609CEF" />
            <Text style={styles.infoTitle}>Thông tin đặt lịch</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mã yêu cầu:</Text>
            <Text style={styles.infoValue}>{requestId.slice(-8).toUpperCase()}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Khách hàng:</Text>
            <Text style={styles.infoValue}>{customerName}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dịch vụ:</Text>
            <Text style={styles.infoValue}>{serviceName}</Text>
          </View>

          {requestedDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ngày:</Text>
              <Text style={styles.infoValue}>{formatDate(requestedDate)}</Text>
            </View>
          )}

          {expectedStartTime && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Giờ bắt đầu:</Text>
              <Text style={styles.infoValue}>{formatTime(expectedStartTime)}</Text>
            </View>
          )}

          {addressNote && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ghi chú địa chỉ:</Text>
              <Text style={styles.infoValue}>{addressNote}</Text>
            </View>
          )}

          {imageCount > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ảnh đính kèm:</Text>
              <Text style={styles.infoValue}>{imageCount} ảnh</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trạng thái:</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Đang tìm thợ</Text>
            </View>
          </View>
        </Animated.View>

        {/* Next Steps */}
        <Animated.View
          style={[
            styles.stepsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.stepsTitle}>Bước tiếp theo:</Text>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Chúng tôi sẽ tìm kiếm thợ phù hợp trong khu vực</Text>
          </View>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Thợ sẽ liên hệ và gửi báo giá cho bạn</Text>
          </View>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Xác nhận báo giá và lên lịch thực hiện</Text>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View
          style={[
            styles.actionContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.historyButton}
            onPress={handleViewHistory}
            activeOpacity={0.8}
          >
            <Text style={styles.historyButtonText}>Xem lịch sử đặt</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeButton}
            onPress={handleBackToHome}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#609CEF', '#4F8BE8']}
              style={styles.homeGradient}
            >
              <Text style={styles.homeButtonText}>Về trang chủ</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  flex: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  animationContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4ADE80',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  messageContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },
  serviceName: {
    fontWeight: '600',
    color: '#609CEF',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    width: '40%',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  stepsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#609CEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  actionContainer: {
    marginTop: 24,
    gap: 12,
  },
  historyButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#609CEF',
  },
  historyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#609CEF',
  },
  homeButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  homeGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default withCustomerAuth(BookingConfirmation, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});