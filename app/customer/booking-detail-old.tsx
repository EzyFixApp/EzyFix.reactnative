import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BookingDetails {
  id: string;
  serviceName: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  notes: string;
  status: 'searching' | 'quoted' | 'accepted' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  technicianName?: string;
  technicianPhone?: string;
  technicianRating?: number;
  quotePrice?: string;
  quoteDetails?: string;
  quotedAt?: string;
}

// Mock data - in real app this would come from API
const getBookingDetails = (id: string): BookingDetails => {
  return {
    id,
    serviceName: 'Sửa điều hòa',
    customerName: 'Nguyễn Văn A',
    phoneNumber: '0901234567',
    address: '123 Lê Lợi, Quận 1, TP.HCM',
    notes: 'Điều hòa không lạnh, có tiếng ồn khi chạy',
    status: 'quoted',
    createdAt: '2025-09-29T10:30:00Z',
    technicianName: 'Thợ Minh Khang',
    technicianPhone: '0987654321',
    technicianRating: 4.8,
    quotePrice: '350,000đ',
    quoteDetails: 'Thay gas R32 và vệ sinh máy lạnh toàn bộ. Bảo hành 6 tháng.',
    quotedAt: '2025-09-29T11:45:00Z',
  };
};

const getStatusInfo = (status: BookingDetails['status']) => {
  switch (status) {
    case 'searching':
      return {
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        text: 'Đang tìm thợ',
        icon: 'search-outline' as const,
        description: 'Chúng tôi đang tìm kiếm thợ phù hợp trong khu vực của bạn',
      };
    case 'quoted':
      return {
        color: '#3B82F6',
        bgColor: '#DBEAFE',
        text: 'Có báo giá',
        icon: 'document-text-outline' as const,
        description: 'Thợ đã gửi báo giá, vui lòng xem xét và xác nhận',
      };
    case 'accepted':
      return {
        color: '#10B981',
        bgColor: '#D1FAE5',
        text: 'Đã xác nhận',
        icon: 'checkmark-circle-outline' as const,
        description: 'Báo giá đã được xác nhận, thợ sẽ liên hệ để sắp xếp lịch',
      };
    case 'in-progress':
      return {
        color: '#8B5CF6',
        bgColor: '#EDE9FE',
        text: 'Đang thực hiện',
        icon: 'time-outline' as const,
        description: 'Thợ đang thực hiện dịch vụ',
      };
    case 'completed':
      return {
        color: '#059669',
        bgColor: '#A7F3D0',
        text: 'Hoàn thành',
        icon: 'checkmark-done-outline' as const,
        description: 'Dịch vụ đã được hoàn thành',
      };
    case 'cancelled':
      return {
        color: '#EF4444',
        bgColor: '#FEE2E2',
        text: 'Đã hủy',
        icon: 'close-circle-outline' as const,
        description: 'Yêu cầu dịch vụ đã được hủy',
      };
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function BookingDetail() {
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string || '1';
  
  const [booking, setBooking] = useState<BookingDetails>(getBookingDetails(bookingId));
  const [loading, setLoading] = useState(false);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Pulse animation for searching status
    if (booking.status === 'searching') {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [booking.status]);

  const handleBack = () => {
    router.back();
  };

  const handleAcceptQuote = () => {
    Alert.alert(
      'Xác nhận báo giá',
      `Bạn có chắc chắn muốn chấp nhận báo giá ${booking.quotePrice} từ ${booking.technicianName}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: () => {
            setLoading(true);
            // Simulate API call
            setTimeout(() => {
              setBooking(prev => ({ ...prev, status: 'accepted' }));
              setLoading(false);
              Alert.alert('Thành công', 'Báo giá đã được chấp nhận. Thợ sẽ liên hệ với bạn sớm.');
            }, 1500);
          },
        },
      ]
    );
  };

  const handleRejectQuote = () => {
    Alert.alert(
      'Từ chối báo giá',
      'Bạn có chắc chắn muốn từ chối báo giá này? Chúng tôi sẽ tìm kiếm thợ khác cho bạn.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: () => {
            setLoading(true);
            setTimeout(() => {
              setBooking(prev => ({ ...prev, status: 'searching', technicianName: undefined, quotePrice: undefined }));
              setLoading(false);
              Alert.alert('Đã từ chối', 'Chúng tôi sẽ tìm kiếm thợ khác cho bạn.');
            }, 1000);
          },
        },
      ]
    );
  };

  const handleCallTechnician = () => {
    if (booking.technicianPhone) {
      Alert.alert(
        'Gọi thợ',
        `Gọi cho ${booking.technicianName} - ${booking.technicianPhone}?`,
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Gọi ngay', onPress: () => console.log('Calling technician...') },
        ]
      );
    }
  };

  const statusInfo = getStatusInfo(booking.status);

  return (
    <>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#609CEF" 
        translucent={false}
        networkActivityIndicatorVisible={false}
      />
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.fullContainer}>
        <SafeAreaView style={styles.container}>
      
      {/* Custom Header với Gradient đẹp */}
      <LinearGradient
        colors={['#609CEF', '#4F8BE8', '#3D7CE0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {/* Back Button với style đẹp */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.8}
          >
            <View style={styles.backButtonInner}>
              <Ionicons name="arrow-back" size={20} color="#609CEF" />
            </View>
          </TouchableOpacity>

          {/* Header Title với subtitle */}
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Chi tiết đặt lịch</Text>
            <Text style={styles.headerSubtitle}>
              Mã đơn: #{booking.id.padStart(6, '0')}
            </Text>
          </View>

          {/* Header Actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => {
                Alert.alert('Chia sẻ', 'Tính năng chia sẻ đang được phát triển');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={20} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {/* Status Card */}
          <View style={styles.statusCard}>
            <Animated.View
              style={[
                styles.statusIconContainer,
                { backgroundColor: statusInfo.bgColor },
                booking.status === 'searching' && { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Ionicons name={statusInfo.icon} size={32} color={statusInfo.color} />
            </Animated.View>
            <Text style={styles.statusTitle}>{statusInfo.text}</Text>
            <Text style={styles.statusDescription}>{statusInfo.description}</Text>
          </View>

          {/* Service Info */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="construct-outline" size={20} color="#609CEF" />
              <Text style={styles.cardTitle}>Thông tin dịch vụ</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Dịch vụ:</Text>
              <Text style={styles.value}>{booking.serviceName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Ngày tạo:</Text>
              <Text style={styles.value}>{formatDate(booking.createdAt)}</Text>
            </View>
            {booking.notes && (
              <View style={styles.infoColumn}>
                <Text style={styles.label}>Ghi chú:</Text>
                <Text style={styles.notesValue}>{booking.notes}</Text>
              </View>
            )}
          </View>

          {/* Customer Info */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={20} color="#609CEF" />
              <Text style={styles.cardTitle}>Thông tin khách hàng</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Họ tên:</Text>
              <Text style={styles.value}>{booking.customerName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Số điện thoại:</Text>
              <Text style={styles.value}>{booking.phoneNumber}</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.label}>Địa chỉ:</Text>
              <Text style={styles.addressValue}>{booking.address}</Text>
            </View>
          </View>

          {/* Technician Info - Only show if assigned */}
          {booking.technicianName && (
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="build-outline" size={20} color="#609CEF" />
                <Text style={styles.cardTitle}>Thông tin thợ</Text>
              </View>
              <View style={styles.technicianInfo}>
                <View style={styles.technicianHeader}>
                  <View style={styles.technicianDetails}>
                    <Text style={styles.technicianName}>{booking.technicianName}</Text>
                    {booking.technicianRating && (
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={16} color="#F59E0B" />
                        <Text style={styles.rating}>{booking.technicianRating}</Text>
                      </View>
                    )}
                  </View>
                  {booking.technicianPhone && (
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={handleCallTechnician}
                    >
                      <Ionicons name="call" size={20} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
                {booking.technicianPhone && (
                  <Text style={styles.technicianPhone}>{booking.technicianPhone}</Text>
                )}
              </View>
            </View>
          )}

          {/* Quote Info - Only show if quoted */}
          {booking.status === 'quoted' && booking.quotePrice && (
            <View style={styles.quoteCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
                <Text style={[styles.cardTitle, { color: '#3B82F6' }]}>Báo giá từ thợ</Text>
              </View>
              
              <View style={styles.quoteInfo}>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceLabel}>Giá dịch vụ:</Text>
                  <Text style={styles.priceValue}>{booking.quotePrice}</Text>
                </View>
                
                {booking.quoteDetails && (
                  <View style={styles.quoteDetails}>
                    <Text style={styles.label}>Chi tiết:</Text>
                    <Text style={styles.quoteDetailsText}>{booking.quoteDetails}</Text>
                  </View>
                )}
                
                {booking.quotedAt && (
                  <Text style={styles.quoteTime}>
                    Báo giá lúc: {formatDate(booking.quotedAt)}
                  </Text>
                )}
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Action Buttons */}
      {booking.status === 'quoted' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={handleRejectQuote}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.rejectButtonText}>Từ chối</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAcceptQuote}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.acceptGradient}
            >
              <Text style={styles.acceptButtonText}>
                {loading ? 'Đang xử lý...' : 'Chấp nhận báo giá'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: '#609CEF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  backButton: {
    padding: 2,
  },
  content: {
    padding: 16,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quoteCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#DBEAFE',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoColumn: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  notesValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 20,
  },
  addressValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 20,
  },
  technicianInfo: {
    marginTop: 4,
  },
  technicianHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  technicianDetails: {
    flex: 1,
  },
  technicianName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  technicianPhone: {
    fontSize: 14,
    color: '#64748B',
  },
  callButton: {
    backgroundColor: '#10B981',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteInfo: {
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
  },
  quoteDetails: {
    marginBottom: 12,
  },
  quoteDetailsText: {
    fontSize: 14,
    color: '#1F2937',
    marginTop: 4,
    lineHeight: 20,
  },
  quoteTime: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  acceptButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  acceptGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },

  // New Header Styles
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  backButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});