import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
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
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';
import { STANDARD_HEADER_STYLE, STANDARD_BACK_BUTTON_STYLE } from '../../constants/HeaderConstants';
import { orderCache } from '../../lib/cache/orderCache';

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
  appointmentDate: string;
  appointmentTime: string;
  distance: string;
  addressNote?: string;
}

// Helper functions
const formatDate = (isoString: string): string => {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('vi-VN', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
};

const formatTime = (isoString: string): string => {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleTimeString('vi-VN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const extractDistrictFromAddress = (fullAddress: string): string => {
  // Extract only district info for privacy
  // Example: "Vinhomes Grand Park, Thành phố Hồ Chí Minh, Phường Long Bình, 71216"
  // Returns: "Phường Long Bình, TP.HCM"
  const parts = fullAddress.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    const district = parts[parts.length - 2]; // Phường/Quận
    return `${district}, TP.HCM`;
  }
  return fullAddress;
};

const maskPhone = (phone: string): string => {
  // Mask middle digits: +840787171600 -> +84***1600
  if (phone.length > 6) {
    return phone.substring(0, 3) + '***' + phone.slice(-4);
  }
  return phone;
};

function OrderDetails() {
  const { orderId } = useLocalSearchParams();
  const [order, setOrder] = useState<OrderDetailItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  useEffect(() => {
    if (orderId) {
      // Get order from cache
      const cachedOrder = orderCache.get(orderId as string);
      if (cachedOrder) {
        setOrder({
          ...cachedOrder,
          status: cachedOrder.status.toLowerCase() as 'pending' | 'accepted' | 'in-progress' | 'completed' | 'cancelled'
        });
      }
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

  const handleAcceptOrder = () => {
    // Navigate to quote selection screen
    router.push({
      pathname: './quote-selection',
      params: { orderId: order.id }
    } as any);
  };

  const handleCallCustomer = () => {
    if (!order || order.status === 'pending') {
      Alert.alert('Thông báo', 'Bạn cần nhận đơn trước khi có thể liên hệ khách hàng');
      return;
    }

    const phoneNumber = `tel:${order.customerPhone}`;
    Linking.openURL(phoneNumber);
  };

  const handleGetDirections = () => {
    if (!order || order.status === 'pending') {
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

  const isAccepted = order?.status === 'accepted' || order?.status === 'in-progress';

  return (
    <View style={styles.container}>
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
              Đặt lúc: {formatDate(order.createdAt)} {formatTime(order.createdAt)}
            </Text>
            <Text style={styles.orderTime}>
              Hẹn làm: {order.appointmentDate} lúc {order.appointmentTime}
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
                  {isAccepted ? order.customerPhone : maskPhone(order.customerPhone)}
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
                    : extractDistrictFromAddress(order.address)
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

        {/* Address Note */}
        {order.addressNote && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ghi chú địa chỉ</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons name="information-circle-outline" size={20} color="#609CEF" />
                <Text style={[styles.descriptionText, { marginLeft: 8, flex: 1 }]}>
                  {order.addressNote}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Action Button */}
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
  backButton: {
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

// Export protected component
export default withTechnicianAuth(OrderDetails, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});