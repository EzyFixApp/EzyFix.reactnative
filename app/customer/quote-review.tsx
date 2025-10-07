import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Alert,
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface QuoteDetails {
  id: string;
  bookingId: string;
  technicianName: string;
  technicianPhone: string;
  technicianRating: number;
  technicianExperience: string;
  profileImage?: string;
  quotePrice: string;
  originalPrice?: string;
  discount?: string;
  serviceName: string;
  description: string;
  workItems: Array<{
    name: string;
    price: string;
    description?: string;
  }>;
  warranty: string;
  estimatedDuration: string;
  materials: Array<{
    name: string;
    quantity: string;
    price: string;
  }>;
  quotedAt: string;
  validUntil: string;
  notes?: string;
}

// Mock data
const getQuoteDetails = (bookingId: string): QuoteDetails => {
  return {
    id: 'quote-1',
    bookingId,
    technicianName: 'Thợ Minh Khang',
    technicianPhone: '0987654321',
    technicianRating: 4.8,
    technicianExperience: '5 năm kinh nghiệm',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    quotePrice: '350,000đ',
    originalPrice: '400,000đ',
    discount: '50,000đ',
    serviceName: 'Sửa điều hòa',
    description: 'Thay gas R32 và vệ sinh máy lạnh toàn bộ. Kiểm tra và sửa chữa các bộ phận hư hỏng.',
    workItems: [
      {
        name: 'Thay gas R32',
        price: '200,000đ',
        description: 'Thay hoàn toàn gas cũ, nạp gas mới R32 chính hãng'
      },
      {
        name: 'Vệ sinh máy lạnh',
        price: '100,000đ',
        description: 'Vệ sinh toàn bộ dàn lạnh, dàn nóng và filter'
      },
      {
        name: 'Kiểm tra hệ thống',
        price: '50,000đ',
        description: 'Kiểm tra áp suất, rò rỉ và hoạt động của máy'
      }
    ],
    warranty: '6 tháng',
    estimatedDuration: '2-3 giờ',
    materials: [
      { name: 'Gas R32', quantity: '1kg', price: '180,000đ' },
      { name: 'Dung dịch vệ sinh', quantity: '1 chai', price: '20,000đ' }
    ],
    quotedAt: '2025-09-29T11:45:00Z',
    validUntil: '2025-10-02T23:59:59Z',
    notes: 'Giá đã bao gồm chi phí di chuyển trong bán kính 10km. Nếu phát hiện thêm lỗi khác sẽ báo trước khi sửa.'
  };
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

export default function QuoteReview() {
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string || '1';
  
  const [quote, setQuote] = useState<QuoteDetails>(getQuoteDetails(bookingId));
  const [loading, setLoading] = useState(false);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
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

  const handleBack = () => {
    router.back();
  };

  const handleAcceptQuote = () => {
    Alert.alert(
      'Xác nhận báo giá',
      `Bạn có chắc chắn muốn chấp nhận báo giá ${quote.quotePrice} từ ${quote.technicianName}?\n\nSau khi chấp nhận, thợ sẽ liên hệ để sắp xếp lịch làm việc.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: () => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              Alert.alert(
                'Thành công!',
                'Báo giá đã được chấp nhận. Thợ sẽ liên hệ với bạn trong vòng 30 phút.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]
              );
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
              setLoading(false);
              Alert.alert(
                'Đã từ chối',
                'Chúng tôi sẽ tìm kiếm thợ khác cho bạn.',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            }, 1000);
          },
        },
      ]
    );
  };

  const handleCallTechnician = () => {
    Alert.alert(
      'Gọi thợ',
      `Gọi cho ${quote.technicianName} - ${quote.technicianPhone}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Gọi ngay', onPress: () => console.log('Calling technician...') },
      ]
    );
  };

  const calculateValidDays = () => {
    const now = new Date();
    const validUntil = new Date(quote.validUntil);
    const diffTime = validUntil.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#609CEF" />
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <LinearGradient
          colors={['#609CEF', '#3B82F6']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chi tiết báo giá</Text>
            <View style={styles.headerPlaceholder} />
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Validity Warning */}
          <View style={styles.validityCard}>
            <View style={styles.validityHeader}>
              <Ionicons name="time-outline" size={20} color="#F59E0B" />
              <Text style={styles.validityTitle}>Thời hạn báo giá</Text>
            </View>
            <Text style={styles.validityText}>
              Còn lại {calculateValidDays()} ngày ({formatDate(quote.validUntil)})
            </Text>
          </View>

          {/* Technician Profile */}
          <View style={styles.technicianCard}>
            <View style={styles.technicianHeader}>
              <View style={styles.technicianInfo}>
                {quote.profileImage ? (
                  <Image source={{ uri: quote.profileImage }} style={styles.technicianAvatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={32} color="#64748B" />
                  </View>
                )}
                <View style={styles.technicianDetails}>
                  <Text style={styles.technicianName}>{quote.technicianName}</Text>
                  <Text style={styles.technicianExperience}>{quote.technicianExperience}</Text>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <Text style={styles.rating}>{quote.technicianRating}</Text>
                    <Text style={styles.ratingText}>(132 đánh giá)</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.callButton} onPress={handleCallTechnician}>
                <Ionicons name="call" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Price Summary */}
          <View style={styles.priceCard}>
            <View style={styles.priceHeader}>
              <Ionicons name="cash-outline" size={24} color="#10B981" />
              <Text style={styles.priceHeaderTitle}>Tổng chi phí</Text>
            </View>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Giá gốc:</Text>
              <Text style={styles.originalPrice}>{quote.originalPrice}</Text>
            </View>
            
            {quote.discount && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Giảm giá:</Text>
                <Text style={styles.discountPrice}>-{quote.discount}</Text>
              </View>
            )}
            
            <View style={styles.priceDivider} />
            <View style={styles.totalPriceRow}>
              <Text style={styles.totalLabel}>Tổng cần thanh toán:</Text>
              <Text style={styles.totalPrice}>{quote.quotePrice}</Text>
            </View>
          </View>

          {/* Service Details */}
          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="construct-outline" size={20} color="#609CEF" />
              <Text style={styles.cardTitle}>Chi tiết dịch vụ</Text>
            </View>
            
            <Text style={styles.serviceDescription}>{quote.description}</Text>
            
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Thời gian ước tính:</Text>
                <Text style={styles.infoValue}>{quote.estimatedDuration}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Bảo hành:</Text>
                <Text style={styles.infoValue}>{quote.warranty}</Text>
              </View>
            </View>
          </View>

          {/* Work Items */}
          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="list-outline" size={20} color="#609CEF" />
              <Text style={styles.cardTitle}>Hạng mục công việc</Text>
            </View>
            
            {quote.workItems.map((item, index) => (
              <View key={index} style={styles.workItem}>
                <View style={styles.workItemHeader}>
                  <Text style={styles.workItemName}>{item.name}</Text>
                  <Text style={styles.workItemPrice}>{item.price}</Text>
                </View>
                {item.description && (
                  <Text style={styles.workItemDescription}>{item.description}</Text>
                )}
              </View>
            ))}
          </View>

          {/* Materials */}
          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="hardware-chip-outline" size={20} color="#609CEF" />
              <Text style={styles.cardTitle}>Vật tư sử dụng</Text>
            </View>
            
            {quote.materials.map((material, index) => (
              <View key={index} style={styles.materialItem}>
                <View style={styles.materialInfo}>
                  <Text style={styles.materialName}>{material.name}</Text>
                  <Text style={styles.materialQuantity}>SL: {material.quantity}</Text>
                </View>
                <Text style={styles.materialPrice}>{material.price}</Text>
              </View>
            ))}
          </View>

          {/* Notes */}
          {quote.notes && (
            <View style={styles.notesCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="document-text-outline" size={20} color="#64748B" />
                <Text style={styles.cardTitle}>Ghi chú từ thợ</Text>
              </View>
              <Text style={styles.notesText}>{quote.notes}</Text>
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </Animated.View>
      </ScrollView>

      {/* Action Buttons */}
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
          <LinearGradient colors={['#10B981', '#059669']} style={styles.acceptGradient}>
            <Text style={styles.acceptButtonText}>
              {loading ? 'Đang xử lý...' : 'Chấp nhận báo giá'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  backButton: {
    padding: 8,
  },
  customHeader: {
    backgroundColor: 'transparent',
  },
  headerGradient: {
    paddingTop: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    padding: 16,
  },
  validityCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  validityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  validityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  validityText: {
    fontSize: 12,
    color: '#92400E',
  },
  technicianCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  technicianHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  technicianInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  technicianAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  technicianDetails: {
    flex: 1,
  },
  technicianName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  technicianExperience: {
    fontSize: 14,
    color: '#64748B',
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
  ratingText: {
    fontSize: 12,
    color: '#64748B',
  },
  callButton: {
    backgroundColor: '#10B981',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#D1FAE5',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  originalPrice: {
    fontSize: 14,
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  discountPrice: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  notesCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  workItem: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  workItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  workItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  workItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  workItemDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  materialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  materialQuantity: {
    fontSize: 12,
    color: '#64748B',
  },
  materialPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  notesText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 20,
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
});