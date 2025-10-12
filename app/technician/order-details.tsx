import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';

interface OrderDetailItem {
  id: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  address: string;
  description: string;
  images?: string[];
  status: 'pending' | 'accepted' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  priceRange: string;
  priority: 'normal' | 'urgent' | 'emergency';
  distance: string;
  estimatedTime: string;
}

// Mock data - Synced with orders.tsx but with full details and images
const mockOrders: OrderDetailItem[] = [
  {
    id: '1',
    serviceName: 'Sửa điều hòa',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0901234567',
    address: '123 Lê Lợi, Q1, TP.HCM',
    description: 'Điều hòa không làm lạnh, có tiếng kêu lạ khi vận hành. Đã sử dụng 3 năm, bảo dưỡng định kỳ 6 tháng/lần. Hiện tại máy vẫn chạy nhưng không xuất khí lạnh, có âm thanh bất thường từ dàn nóng.',
    images: [
      'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'
    ],
    status: 'pending',
    createdAt: '2025-10-13T14:30:00Z',
    priceRange: '200,000đ - 500,000đ',
    priority: 'urgent',
    distance: '2.5km',
    estimatedTime: '45 phút'
  },
  {
    id: '2',
    serviceName: 'Sửa ống nước',
    customerName: 'Trần Thị B',
    customerPhone: '0912345678',
    address: '456 Nguyễn Huệ, Q1, TP.HCM',
    description: 'Ống nước bị rò rỉ dưới bồn rửa bát. Đã thấy nước chảy ra từ đường ống nối với vòi, có thể là đệm cao su bị hỏng hoặc ống nối bị lỏng. Cần kiểm tra và thay thế linh kiện.',
    images: [
      'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop'
    ],
    status: 'pending',
    createdAt: '2025-10-13T15:00:00Z',
    priceRange: '150,000đ - 300,000đ',
    priority: 'normal',
    distance: '1.8km',
    estimatedTime: '30 phút'
  },
  {
    id: '3',
    serviceName: 'Sửa tủ lạnh',
    customerName: 'Lê Văn C',
    customerPhone: '0923456789',
    address: '789 Lý Tự Trọng, Q1, TP.HCM',
    description: 'Tủ lạnh không đông đá, ngăn mát vẫn hoạt động bình thường. Tủ dùng được 4 năm, thương hiệu LG. Ngăn đá hoàn toàn không lạnh, đồ ăn để trong đó bị tan hết.',
    images: [
      'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1493723843671-1d655e66ac1c?w=400&h=300&fit=crop'
    ],
    status: 'accepted',
    createdAt: '2025-10-13T10:00:00Z',
    priceRange: '300,000đ - 600,000đ',
    priority: 'normal',
    distance: '3.2km',
    estimatedTime: '1 giờ'
  }
];

export default function OrderDetails() {
  const { orderId, canAccept } = useLocalSearchParams();
  const [order, setOrder] = useState<OrderDetailItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  useEffect(() => {
    if (orderId) {
      const foundOrder = mockOrders.find(o => o.id === orderId);
      setOrder(foundOrder || null);
    }
  }, [orderId]);

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#609CEF" />
        <Stack.Screen options={{ headerShown: false }} />
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy đơn hàng</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleAcceptOrder = () => {
    // Navigate to quote selection screen
    router.push({
      pathname: './quote-selection',
      params: { orderId: order.id }
    } as any);
  };

  const handleCallCustomer = () => {
    if (canAccept === 'false') {
      Alert.alert('Thông báo', 'Bạn cần nhận đơn trước khi có thể liên hệ khách hàng');
      return;
    }
    
    const phoneNumber = `tel:${order.customerPhone}`;
    Linking.openURL(phoneNumber);
  };

  const handleGetDirections = () => {
    if (canAccept === 'false') {
      Alert.alert('Thông báo', 'Bạn cần nhận đơn trước khi có thể xem địa chỉ cụ thể');
      return;
    }
    
    const url = Platform.select({
      ios: `maps://?address=${encodeURIComponent(order.address)}`,
      android: `geo:0,0?q=${encodeURIComponent(order.address)}`,
    });
    
    if (url) {
      Linking.openURL(url);
    }
  };

  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageModalVisible(true);
  };

  const handleCloseImageModal = () => {
    setImageModalVisible(false);
    setSelectedImage(null);
  };

  const isAccepted = canAccept === 'true';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#609CEF" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient colors={['#609CEF', '#3B82F6']} style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Service Info */}
        <View style={styles.section}>
          <View style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceName}>{order.serviceName}</Text>
              <View style={styles.distanceContainer}>
                <Ionicons name="location-outline" size={16} color="#609CEF" />
                <Text style={styles.distanceText}>{order.distance}</Text>
              </View>
            </View>
            <Text style={styles.customerName}>Khách hàng: {order.customerName}</Text>
            <Text style={styles.orderTime}>
              Đặt lúc: {new Date(order.createdAt).toLocaleString('vi-VN')}
            </Text>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.contactRow}
              onPress={handleCallCustomer}
              disabled={!isAccepted}
            >
              <View style={styles.contactInfo}>
                <Ionicons name="call-outline" size={20} color={isAccepted ? "#10B981" : "#6B7280"} />
                <Text style={[styles.contactText, !isAccepted && styles.maskedText]}>
                  {isAccepted ? order.customerPhone : order.customerPhone.substring(0, 3) + '*****' + order.customerPhone.slice(-2)}
                </Text>
              </View>
              {isAccepted && <Ionicons name="call" size={20} color="#10B981" />}
              {!isAccepted && <Text style={styles.lockedText}>Nhận đơn để xem</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Address Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa chỉ</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.contactRow}
              onPress={handleGetDirections}
              disabled={!isAccepted}
            >
              <View style={styles.contactInfo}>
                <Ionicons name="location-outline" size={20} color={isAccepted ? "#609CEF" : "#6B7280"} />
                <Text style={[styles.contactText, !isAccepted && styles.maskedText]}>
                  {isAccepted 
                    ? order.address 
                    : order.address.split(', ').slice(-2).join(', ')
                  }
                </Text>
              </View>
              {isAccepted && <Ionicons name="navigate" size={20} color="#609CEF" />}
              {!isAccepted && <Text style={styles.lockedText}>Nhận đơn để xem</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả chi tiết</Text>
          <View style={styles.card}>
            <Text style={styles.descriptionText}>{order.description}</Text>
          </View>
        </View>

        {/* Images */}
        {order.images && order.images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ảnh thiết bị ({order.images.length})</Text>
            <View style={styles.card}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imagesContainer}
              >
                {order.images.map((imageUrl, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.imageWrapper}
                    onPress={() => handleImagePress(imageUrl)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.deviceImage}
                      resizeMode="cover"
                    />
                    <View style={styles.imageOverlay}>
                      <Ionicons name="expand-outline" size={20} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.imageHint}>Nhấn vào ảnh để xem kích thước đầy đủ</Text>
            </View>
          </View>
        )}

        {/* Price and Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin dự kiến</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="cash-outline" size={20} color="#10B981" />
                <Text style={styles.infoLabel}>Giá dự kiến</Text>
                <Text style={styles.infoValue}>{order.priceRange}</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={20} color="#F59E0B" />
                <Text style={styles.infoLabel}>Thời gian ước tính</Text>
                <Text style={styles.infoValue}>{order.estimatedTime}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Action Button */}
      {canAccept === 'false' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAcceptOrder}
            disabled={loading}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.acceptGradient}
            >
              {loading ? (
                <Text style={styles.acceptButtonText}>Đang xử lý...</Text>
              ) : (
                <>
                  <Ionicons name="calculator-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.acceptButtonText}>Gửi báo giá</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseImageModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleCloseImageModal}
          >
            <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" />
            
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCloseImageModal}
            >
              <Ionicons name="close" size={30} color="#FFFFFF" />
            </TouchableOpacity>

            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 16 : 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  section: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#609CEF',
    marginLeft: 4,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  maskedText: {
    color: '#6B7280',
  },
  lockedText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  descriptionText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 100,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  acceptButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  acceptGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
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
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#609CEF',
  },
  // Image styles
  imagesContainer: {
    paddingRight: 16,
  },
  imageWrapper: {
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  deviceImage: {
    width: 120,
    height: 120,
    backgroundColor: '#F3F4F6',
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageHint: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
});