import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { BookingStatus } from '../types/BookingTypes';

interface OrderTrackingScreenProps {
  orderId?: string;
  userType?: 'customer' | 'technician';
  onBack?: () => void;
  quoteType?: 'estimated' | 'final';
  quoteAmount?: string;
}

interface BookingDetail {
  id: string;
  serviceName: string;
  servicePrice: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  status:
    | 'pending'
    | 'quoted'
    | 'accepted'
    | 'technician-coming'
    | 'technician-arrived'
    | 'in-progress'
    | 'payment'
    | 'completed'
    | 'cancelled';
  createdAt: string;
  technicianName?: string;
  quotePrice?: string;
  finalPrice?: string;
  notes?: string;
  description?: string;
  images?: string[];
  timeline?: TimelineStep[];
  estimatedArrival?: string;
  aiWarning?: boolean;
  aiWarningMessage?: string;
}

interface TimelineStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  timestamp?: string;
  icon: string;
}

const mockBookingDetail: BookingDetail = {
  id: '1',
  serviceName: 'Sửa điều hòa',
  servicePrice: '200,000đ - 500,000đ',
  customerName: 'Nguyễn Văn A',
  phoneNumber: '0901234567',
  address: '123 Lê Lợi, Quận 1, TP.HCM',
  status: 'quoted',
  createdAt: '2025-09-29T17:30:00Z',
  technicianName: 'Thợ Minh',
  quotePrice: '350,000đ',
  finalPrice: '350,000đ',
  notes: 'Điều hòa không lạnh, có tiếng ồn khi chạy',
  description: 'Điều hòa không làm lạnh được, có tiếng kêu lạ khi vận hành.',
  images: ['image1.jpg', 'image2.jpg'],
  estimatedArrival: '14:30',
  aiWarning: false,
  timeline: [
    {
      id: '1',
      title: 'Đặt lịch thành công',
      description:
        'Yêu cầu sửa chữa đã được ghi nhận và đưa vào hệ thống. Đang tìm thợ phù hợp trong khu vực.',
      status: 'completed',
      timestamp: '2025-10-13T10:00:00Z',
      icon: 'checkmark-circle',
    },
    {
      id: '2',
      title: 'Thợ tiếp nhận đơn',
      description:
        'Thợ Minh (⭐4.8) đã xác nhận nhận đơn và sẽ liên hệ với bạn trong thời gian sớm nhất.',
      status: 'completed',
      timestamp: '2025-10-13T10:30:00Z',
      icon: 'person-add',
    },
    {
      id: '3',
      title: 'Nhận báo giá từ thợ',
      description:
        'Thợ đã đưa ra mức giá 350,000đ sau khi xem xét yêu cầu. Vui lòng xác nhận để tiếp tục.',
      status: 'current',
      timestamp: '2025-10-13T11:00:00Z',
      icon: 'receipt',
    },
    {
      id: '4',
      title: 'Xác nhận & hẹn lịch',
      description: 'Sau khi chấp nhận báo giá, thợ sẽ liên hệ để sắp xếp thời gian đến kiểm tra.',
      status: 'pending',
      icon: 'calendar',
    },
    {
      id: '5',
      title: 'Thợ đến kiểm tra',
      description: 'Thợ sẽ đến địa chỉ để khảo sát thực tế và xác nhận tình trạng thiết bị.',
      status: 'pending',
      icon: 'location',
    },
    {
      id: '6',
      title: 'Tiến hành sửa chữa',
      description: 'Bắt đầu quá trình sửa chữa theo đúng yêu cầu và tiêu chuẩn kỹ thuật.',
      status: 'pending',
      icon: 'build',
    },
    {
      id: '7',
      title: 'Thanh toán dịch vụ',
      description:
        'Hoàn tất sửa chữa, tiến hành thanh toán qua các phương thức trực tuyến hoặc tiền mặt.',
      status: 'pending',
      icon: 'card',
    },
    {
      id: '8',
      title: 'Hoàn thành & đánh giá',
      description:
        'Dịch vụ kết thúc thành công. Chia sẻ trải nghiệm để cải thiện chất lượng dịch vụ.',
      status: 'pending',
      icon: 'star',
    },
  ],
};

export default function OrderTrackingScreen({
  orderId = 'order_123',
  userType = 'customer',
  onBack,
  quoteType,
  quoteAmount,
}: OrderTrackingScreenProps) {
  const [booking] = useState<BookingDetail>(mockBookingDetail);
  const [loading, setLoading] = useState(false);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    // Pulse animation for current step
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, [pulseAnim]);

  const getStatusDescription = (status: BookingDetail['status']) => {
    if (userType === 'technician') {
      const isEstimatedQuote = quoteType === 'estimated';

      switch (status) {
        case 'pending':
          return 'Đơn hàng mới, hãy xem xét và gửi báo giá cho khách hàng';
        case 'quoted':
          if (isEstimatedQuote) {
            return `Đã gửi báo giá dự kiến ${quoteAmount || ''}đ, chờ khách hàng xác nhận`;
          } else {
            return `Đã gửi báo giá chốt ${quoteAmount || ''}đ, chờ khách hàng xác nhận`;
          }
        case 'accepted':
          return 'Khách hàng đã chấp nhận báo giá, hãy liên hệ để sắp xếp thời gian';
        case 'technician-coming':
          return 'Hãy cập nhật trạng thái khi bạn đang trên đường đến';
        case 'technician-arrived':
          if (isEstimatedQuote) {
            return 'Bạn đã đến nơi, hãy kiểm tra thực tế và xác nhận báo giá cuối cùng';
          } else {
            return 'Bạn đã đến nơi, bắt đầu sửa chữa theo báo giá đã chốt';
          }
        case 'in-progress':
          return 'Đang tiến hành sửa chữa, hãy cập nhật tiến độ cho khách hàng';
        case 'payment':
          return 'Hoàn tất sửa chữa, chờ khách hàng thanh toán';
        case 'completed':
          return 'Dịch vụ đã hoàn thành, cảm ơn bạn đã làm việc tốt!';
        case 'cancelled':
          return 'Đơn hàng đã bị hủy';
        default:
          return 'Đang xử lý đơn hàng';
      }
    } else {
      // Customer descriptions (existing)
      switch (status) {
        case 'pending':
          return 'Đang tìm thợ phù hợp cho yêu cầu của bạn';
        case 'quoted':
          return 'Thợ đã gửi báo giá, vui lòng xem xét và xác nhận';
        case 'accepted':
          return 'Đã chấp nhận báo giá, thợ sẽ sớm liên hệ';
        case 'technician-coming':
          return 'Thợ đang trên đường đến địa chỉ của bạn';
        case 'technician-arrived':
          return 'Thợ đã đến nơi và sẵn sàng kiểm tra';
        case 'in-progress':
          return 'Đang tiến hành sửa chữa, vui lòng chờ đợi';
        case 'payment':
          return 'Sửa chữa hoàn tất, vui lòng thanh toán';
        case 'completed':
          return 'Dịch vụ đã hoàn thành thành công';
        case 'cancelled':
          return 'Đơn hàng đã được hủy';
        default:
          return 'Hệ thống đang xử lý yêu cầu của bạn';
      }
    }
  };

  const getTimelineColor = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'current':
        return '#609CEF';
      case 'pending':
        return '#E5E7EB';
      default:
        return '#E5E7EB';
    }
  };

  const getStatusInfo = (status: BookingDetail['status']) => {
    switch (status) {
      case 'pending':
        return {
          text: 'Đang chờ thợ',
          color: '#F59E0B',
          backgroundColor: '#FEF3C7',
          icon: 'search-outline',
        };
      case 'quoted':
        return {
          text: 'Có báo giá',
          color: '#3B82F6',
          backgroundColor: '#DBEAFE',
          icon: 'document-text-outline',
        };
      case 'accepted':
        return {
          text: 'Đã xác nhận',
          color: '#10B981',
          backgroundColor: '#D1FAE5',
          icon: 'checkmark-circle-outline',
        };
      case 'technician-coming':
        return {
          text: 'Thợ đang đến',
          color: '#8B5CF6',
          backgroundColor: '#EDE9FE',
          icon: 'car-outline',
        };
      case 'technician-arrived':
        return {
          text: 'Thợ đã đến',
          color: '#059669',
          backgroundColor: '#ECFDF5',
          icon: 'location-outline',
        };
      case 'in-progress':
        return {
          text: 'Đang sửa chữa',
          color: '#DC2626',
          backgroundColor: '#FEF2F2',
          icon: 'construct-outline',
        };
      case 'payment':
        return {
          text: 'Thanh toán',
          color: '#7C3AED',
          backgroundColor: '#F3E8FF',
          icon: 'card-outline',
        };
      case 'completed':
        return {
          text: 'Hoàn thành',
          color: '#10B981',
          backgroundColor: '#D1FAE5',
          icon: 'trophy-outline',
        };
      case 'cancelled':
        return {
          text: 'Đã hủy',
          color: '#EF4444',
          backgroundColor: '#FEE2E2',
          icon: 'close-circle-outline',
        };
      default:
        return {
          text: 'Đang xử lý',
          color: '#6B7280',
          backgroundColor: '#F3F4F6',
          icon: 'time-outline',
        };
    }
  };

  const handleAcceptQuote = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      Alert.alert('Thành công', 'Đã chấp nhận báo giá!');
      router.back();
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectQuote = () => {
    Alert.alert('Từ chối báo giá', 'Bạn có chắc chắn muốn từ chối báo giá này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Từ chối',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Đã từ chối', 'Báo giá đã được từ chối!');
          router.back();
        },
      },
    ]);
  };

  const handleAcceptFinalPrice = async () => {
    if (booking.aiWarning) {
      Alert.alert(
        'Xác nhận đặc biệt',
        'AI phát hiện sự chênh lệch giá. Bạn có chắc chắn muốn tiếp tục?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xác nhận',
            style: 'default',
            onPress: () => processAcceptFinalPrice(),
          },
        ]
      );
    } else {
      processAcceptFinalPrice();
    }
  };

  const processAcceptFinalPrice = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      Alert.alert('Thành công', 'Đã xác nhận giá cuối cùng!');
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyCancel = () => {
    Alert.alert(
      'Hủy khẩn cấp (SOS)',
      'Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy đơn',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Đã hủy', 'Đơn hàng đã được hủy!');
            router.back();
          },
        },
      ]
    );
  };

  const handlePayment = (method: 'online' | 'cash') => {
    if (method === 'online') {
      Alert.alert('Thanh toán online', 'Chọn phương thức thanh toán:', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'MoMo', onPress: () => processOnlinePayment('momo') },
        { text: 'ZaloPay', onPress: () => processOnlinePayment('zalopay') },
        { text: 'VNPay', onPress: () => processOnlinePayment('vnpay') },
        { text: 'QR Ngân hàng', onPress: () => processOnlinePayment('bank') },
      ]);
    } else {
      Alert.alert('Thanh toán tiền mặt', 'Vui lòng thanh toán trực tiếp cho thợ.');
    }
  };

  const processOnlinePayment = async (method: string) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      Alert.alert('Thành công', `Thanh toán qua ${method.toUpperCase()} thành công!`);
    } catch (error) {
      Alert.alert('Lỗi', 'Thanh toán thất bại, vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestInvoice = () => {
    Alert.alert('Yêu cầu hóa đơn GTGT', 'Hóa đơn sẽ được gửi trong vòng 24h.');
  };

  const handleRateService = () => {
    Alert.alert('Đánh giá dịch vụ', 'Chức năng đánh giá sẽ được mở sau khi hoàn thành.');
  };

  // Technician action handlers
  const handleSendQuote = () => {
    Alert.prompt(
      'Gửi báo giá',
      'Nhập giá bạn muốn báo cho khách hàng:',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gửi báo giá',
          onPress: (price?: string) => {
            if (price) {
              Alert.alert('Thành công', `Đã gửi báo giá ${price} cho khách hàng!`);
            }
          },
        },
      ],
      'plain-text',
      '350,000đ'
    );
  };

  const handleUpdateStatus = (status: string) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Cập nhật thành công', `Đã cập nhật trạng thái: ${status}`);
    }, 1500);
  };

  const handleUploadImage = () => {
    Alert.alert('Tải ảnh', 'Chọn ảnh từ thư viện hoặc chụp ảnh mới', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Thư viện', onPress: () => console.log('Library') },
      { text: 'Chụp ảnh', onPress: () => console.log('Camera') },
    ]);
  };

  const handleContactCustomer = () => {
    Alert.alert('Liên hệ khách hàng', 'Chọn cách liên hệ:', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Gọi điện', onPress: () => console.log('Call') },
      { text: 'Nhắn tin', onPress: () => console.log('SMS') },
    ]);
  };

  const handleConfirmFinalPrice = () => {
    Alert.prompt(
      'Xác nhận giá cuối cùng',
      `Giá dự kiến ban đầu: ${quoteAmount || ''}đ\nNhập giá cuối cùng sau khi kiểm tra:`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: (finalPrice?: string) => {
            if (finalPrice && finalPrice.trim()) {
              Alert.alert(
                'Xác nhận giá cuối',
                `Bạn có chắc chắn giá cuối cùng là ${finalPrice}đ?`,
                [
                  { text: 'Hủy', style: 'cancel' },
                  {
                    text: 'Xác nhận',
                    onPress: () => {
                      setLoading(true);
                      setTimeout(() => {
                        setLoading(false);
                        Alert.alert(
                          'Thành công',
                          `Đã xác nhận giá cuối ${finalPrice}đ. Bây giờ có thể bắt đầu sửa chữa.`
                        );
                        // Update status to allow starting work
                      }, 1500);
                    },
                  },
                ]
              );
            }
          },
        },
      ],
      'plain-text',
      quoteAmount?.replace(/[^\d]/g, '') || ''
    );
  };

  const renderTechnicianActions = () => {
    switch (booking.status) {
      case 'pending':
        return (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.contactButton} onPress={handleContactCustomer}>
              <Text style={styles.contactButtonText}>Liên hệ khách</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleSendQuote}
              disabled={loading}>
              <LinearGradient colors={['#609CEF', '#3B82F6']} style={styles.acceptGradient}>
                <Text style={styles.acceptButtonText}>
                  {loading ? 'Đang xử lý...' : 'Gửi báo giá'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );

      case 'accepted':
        return (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.contactButton} onPress={handleContactCustomer}>
              <Text style={styles.contactButtonText}>Liên hệ khách</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleUpdateStatus('Đang đến')}
              disabled={loading}>
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.acceptGradient}>
                <Text style={styles.acceptButtonText}>
                  {loading ? 'Đang cập nhật...' : 'Báo đang đến'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );

      case 'technician-coming':
        return (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.contactButton} onPress={handleContactCustomer}>
              <Text style={styles.contactButtonText}>Liên hệ khách</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleUpdateStatus('Đã đến nơi')}
              disabled={loading}>
              <LinearGradient colors={['#059669', '#047857']} style={styles.acceptGradient}>
                <Text style={styles.acceptButtonText}>
                  {loading ? 'Đang cập nhật...' : 'Đã đến nơi'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );

      case 'technician-arrived':
        const isEstimatedQuote = quoteType === 'estimated';

        return (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.imageButton} onPress={handleUploadImage}>
              <Text style={styles.imageButtonText}>Tải ảnh</Text>
            </TouchableOpacity>
            {isEstimatedQuote ? (
              // For estimated quote: need to confirm final price first
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={handleConfirmFinalPrice}
                disabled={loading}>
                <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.acceptGradient}>
                  <Text style={styles.acceptButtonText}>
                    {loading ? 'Đang cập nhật...' : 'Xác nhận giá cuối'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              // For final quote: can start work directly
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleUpdateStatus('Bắt đầu sửa')}
                disabled={loading}>
                <LinearGradient colors={['#DC2626', '#B91C1C']} style={styles.acceptGradient}>
                  <Text style={styles.acceptButtonText}>
                    {loading ? 'Đang cập nhật...' : 'Bắt đầu sửa'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'in-progress':
        return (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.imageButton} onPress={handleUploadImage}>
              <Text style={styles.imageButtonText}>Tải ảnh</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleUpdateStatus('Hoàn thành')}
              disabled={loading}>
              <LinearGradient colors={['#7C3AED', '#6D28D9']} style={styles.acceptGradient}>
                <Text style={styles.acceptButtonText}>
                  {loading ? 'Đang cập nhật...' : 'Hoàn thành'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );

      case 'payment':
        return (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.invoiceButton}
              onPress={() => Alert.alert('Xác nhận', 'Xác nhận đã nhận tiền mặt')}>
              <Text style={styles.invoiceButtonText}>Nhận tiền mặt</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => Alert.alert('Thông báo', 'Chờ khách thanh toán online')}>
              <LinearGradient colors={['#609CEF', '#3B82F6']} style={styles.acceptGradient}>
                <Text style={styles.acceptButtonText}>Chờ thanh toán</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  const renderActionButtons = () => {
    if (userType === 'technician') {
      return renderTechnicianActions();
    }

    // Customer actions (existing logic)
    switch (booking.status) {
      case 'quoted':
        return (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={handleRejectQuote}
              disabled={loading}>
              <Text style={styles.rejectButtonText}>Từ chối</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAcceptQuote}
              disabled={loading}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.acceptGradient}>
                <Text style={styles.acceptButtonText}>
                  {loading ? 'Đang xử lý...' : 'Chấp nhận báo giá'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );

      case 'technician-arrived':
        return (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyCancel}>
              <Text style={styles.emergencyButtonText}>SOS - Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAcceptFinalPrice}
              disabled={loading}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.acceptGradient}>
                <Text style={styles.acceptButtonText}>
                  {loading ? 'Đang xử lý...' : 'Xác nhận giá cuối'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );

      case 'payment':
        return (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.paymentButton} onPress={() => handlePayment('cash')}>
              <Text style={styles.paymentButtonText}>Tiền mặt</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handlePayment('online')}
              disabled={loading}>
              <LinearGradient colors={['#609CEF', '#3B82F6']} style={styles.acceptGradient}>
                <Text style={styles.acceptButtonText}>Thanh toán online</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );

      case 'completed':
        return (
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.invoiceButton} onPress={handleRequestInvoice}>
              <Text style={styles.invoiceButtonText}>Yêu cầu hóa đơn</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={handleRateService}>
              <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.acceptGradient}>
                <Text style={styles.acceptButtonText}>Đánh giá dịch vụ</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo(booking.status);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#609CEF" translucent={false} />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Safe area với padding cho status bar */}
      <SafeAreaView style={styles.safeAreaContainer}>
        {/* Header giống BookingHistory */}
        <View style={styles.customHeaderWrapper}>
          <LinearGradient colors={['#609CEF', '#3B82F6']} style={styles.customHeaderGradient}>
            <View style={styles.customHeaderContent}>
              <TouchableOpacity
                onPress={onBack || (() => router.back())}
                style={styles.customBackButton}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>

              <View style={styles.customHeaderTitleContainer}>
                <Text style={styles.customHeaderTitle}>Theo dõi đơn hàng</Text>
                <Text style={styles.customHeaderSubtitle}>Mã đơn {orderId}</Text>
              </View>

              <TouchableOpacity style={styles.customShareButton}>
                <Ionicons name="share-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Status Card */}
          <View style={styles.section}>
            <View style={[styles.statusCard, { backgroundColor: statusInfo.backgroundColor }]}>
              <View style={styles.statusIconContainer}>
                <Ionicons name={statusInfo.icon as any} size={32} color={statusInfo.color} />
              </View>
              <Text style={[styles.statusTitle, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
              <Text style={styles.statusDescription}>{getStatusDescription(booking.status)}</Text>

              {/* Estimated Arrival Time */}
              {booking.status === 'technician-coming' && booking.estimatedArrival && (
                <View style={styles.estimatedTimeContainer}>
                  <Ionicons name="time-outline" size={16} color={statusInfo.color} />
                  <Text style={[styles.estimatedTime, { color: statusInfo.color }]}>
                    Dự kiến đến: {booking.estimatedArrival}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* AI Warning */}
          {booking.aiWarning && (
            <View style={styles.section}>
              <View style={styles.aiWarningCard}>
                <View style={styles.aiWarningHeader}>
                  <Ionicons name="warning" size={20} color="#F59E0B" />
                  <Text style={styles.aiWarningTitle}>Cảnh báo AI</Text>
                </View>
                <Text style={styles.aiWarningText}>
                  {booking.aiWarningMessage ||
                    'Giá cuối cùng có sự chênh lệch so với báo giá ban đầu. Vui lòng xem xét kỹ trước khi xác nhận.'}
                </Text>
              </View>
            </View>
          )}

          {/* Timeline Progress */}
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.timelineCardHeader}>
                <Text style={styles.timelineHeaderTitle}>Tiến trình đơn hàng</Text>
                <View style={styles.progressBadge}>
                  <Text style={styles.progressBadgeText}>
                    {booking.timeline?.filter((s) => s.status === 'completed').length || 0}/
                    {booking.timeline?.length || 0}
                  </Text>
                </View>
              </View>

              <View style={styles.timelineContainer}>
                {booking.timeline?.map((step, index) => {
                  const isLast = index === (booking.timeline?.length || 0) - 1;
                  const statusColor = getTimelineColor(step.status);
                  const isActive = step.status === 'current';
                  const isCompleted = step.status === 'completed';

                  return (
                    <View key={step.id} style={styles.timelineStep}>
                      <View style={styles.timelineLeftContainer}>
                        {/* Timeline Icon with enhanced design */}
                        <View
                          style={[
                            styles.timelineIconWrapper,
                            {
                              borderColor: statusColor,
                              borderWidth: isActive ? 3 : 2,
                              backgroundColor: isCompleted ? statusColor : '#FFFFFF',
                            },
                          ]}>
                          {isCompleted ? (
                            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                          ) : (
                            <Ionicons
                              name={step.icon as any}
                              size={18}
                              color={isActive ? statusColor : '#9CA3AF'}
                            />
                          )}
                        </View>

                        {/* Connecting line */}
                        {!isLast && (
                          <View
                            style={[
                              styles.timelineLine,
                              {
                                backgroundColor: isCompleted ? statusColor : '#E5E7EB',
                                opacity: isCompleted ? 1 : 0.5,
                              },
                            ]}
                          />
                        )}
                      </View>

                      {/* Content */}
                      <View
                        style={[
                          styles.timelineContent,
                          {
                            backgroundColor: isActive ? 'rgba(96, 156, 239, 0.05)' : 'transparent',
                            borderLeftColor: isActive ? '#609CEF' : 'transparent',
                            borderLeftWidth: isActive ? 3 : 0,
                          },
                        ]}>
                        <View style={styles.timelineHeader}>
                          <Text
                            style={[
                              styles.timelineTitle,
                              {
                                color: isCompleted || isActive ? '#1F2937' : '#9CA3AF',
                                fontWeight: isActive ? '700' : '600',
                              },
                            ]}>
                            {step.title}
                          </Text>

                          {/* Status indicator */}
                          <View
                            style={[styles.timelineStatusDot, { backgroundColor: statusColor }]}
                          />
                        </View>

                        <Text
                          style={[
                            styles.timelineDescription,
                            { color: isCompleted || isActive ? '#6B7280' : '#9CA3AF' },
                          ]}>
                          {step.description}
                        </Text>

                        {step.timestamp && (isCompleted || isActive) && (
                          <View style={styles.timelineTimestampContainer}>
                            <Ionicons name="time-outline" size={12} color="#9CA3AF" />
                            <Text style={styles.timelineTimestamp}>
                              {new Date(step.timestamp).toLocaleDateString('vi-VN')} •{' '}
                              {new Date(step.timestamp).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          </View>
                        )}

                        {/* Progress indicator for current step */}
                        {isActive && (
                          <View style={styles.currentStepIndicator}>
                            <View style={styles.pulseContainer}>
                              <Animated.View
                                style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]}
                              />
                              <View style={styles.pulseCore} />
                            </View>
                            <Text style={styles.currentStepText}>Đang xử lý...</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Service Info */}
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="construct-outline" size={20} color="#609CEF" />
                <Text style={styles.cardTitle}>Thông tin dịch vụ</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Dịch vụ:</Text>
                  <Text style={styles.infoValue}>{booking.serviceName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ngày tạo:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(booking.createdAt).toLocaleString('vi-VN')}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ghi chú:</Text>
                  <Text style={styles.infoValue}>{booking.notes}</Text>
                </View>
                {booking.quotePrice && (
                  <View style={styles.priceRow}>
                    <Text style={styles.infoLabel}>Giá dịch vụ:</Text>
                    <Text style={styles.priceValue}>{booking.quotePrice}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Customer Info */}
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-outline" size={20} color="#609CEF" />
                <Text style={styles.cardTitle}>Thông tin khách hàng</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Họ tên:</Text>
                  <Text style={styles.infoValue}>{booking.customerName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Số điện thoại:</Text>
                  <Text style={styles.infoValue}>{booking.phoneNumber}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Địa chỉ:</Text>
                  <Text style={styles.infoValue}>{booking.address}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Technician Info */}
          {booking.technicianName && (
            <View style={styles.section}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="hammer-outline" size={20} color="#609CEF" />
                  <Text style={styles.cardTitle}>Thông tin thợ</Text>
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tên thợ:</Text>
                    <Text style={styles.infoValue}>{booking.technicianName}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Đánh giá:</Text>
                    <View style={styles.ratingContainer}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons key={star} name="star" size={16} color="#F59E0B" />
                      ))}
                      <Text style={styles.ratingText}>(4.8)</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Action Buttons based on status */}
        {renderActionButtons()}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#609CEF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  customHeaderWrapper: {
    backgroundColor: 'transparent',
  },
  customHeaderGradient: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  customHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    minHeight: 80,
  },
  customBackButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  customHeaderTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    height: 44, // Same height as buttons
  },
  customHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  customHeaderSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  customShareButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerGradient: {
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  statusCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
  cardContent: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  priceValue: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: '700',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  ratingText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 4,
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  acceptButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  bottomSpacing: {
    height: 100, // Space for action buttons
  },

  // Timeline header styles
  timelineCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  timelineHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  progressBadge: {
    backgroundColor: 'rgba(96, 156, 239, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(96, 156, 239, 0.2)',
    minWidth: 50,
    alignItems: 'center',
  },
  progressBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#609CEF',
    letterSpacing: 0.5,
  },

  // Enhanced Timeline styles
  timelineContainer: {
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  timelineStep: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  timelineLeftContainer: {
    alignItems: 'center',
    marginRight: 16,
    width: 40,
  },
  timelineIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineLine: {
    width: 3,
    height: 40,
    marginTop: 8,
    borderRadius: 2,
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 12,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  timelineStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  timelineDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  timelineTimestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timelineTimestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
    fontWeight: '500',
  },

  // Current step animation styles
  currentStepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(96, 156, 239, 0.2)',
  },
  pulseContainer: {
    position: 'relative',
    width: 16,
    height: 16,
    marginRight: 8,
  },
  pulseRing: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(96, 156, 239, 0.3)',
    transform: [{ scale: 1.2 }],
  },
  pulseCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#609CEF',
    position: 'absolute',
    top: 4,
    left: 4,
  },
  currentStepText: {
    fontSize: 13,
    color: '#609CEF',
    fontWeight: '600',
    fontStyle: 'italic',
  },

  // AI Warning styles
  aiWarningCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  aiWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiWarningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  aiWarningText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },

  // Estimated time styles
  estimatedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  estimatedTime: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Additional button styles
  emergencyButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  emergencyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paymentButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  paymentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  invoiceButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  invoiceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  imageButton: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    paddingVertical: 16,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  imageButtonText: {
    color: '#92400E',
    fontSize: 16,
    fontWeight: '600',
  },
});
