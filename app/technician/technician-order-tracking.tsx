import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OrderItem {
  id: string;
  serviceName: string;
  customerName: string;
  priceRange: string;
  status: string;
  address: string;
  phone: string;
  description: string;
  appointmentDate: string;
  appointmentTime: string;
  attachedImages?: string[];
}

// Mock order data - Synced with orders.tsx
const mockOrders: OrderItem[] = [
  {
    id: '1',
    serviceName: 'Sửa điều hòa',
    customerName: 'Nguyễn Văn A',
    priceRange: '200,000đ - 500,000đ',
    status: 'quote_sent',
    address: '123 Lê Lợi, Quận 1, TP.HCM',
    phone: '090****567',
    description: 'Điều hòa không làm lạnh, có tiếng kêu lạ khi vận hành',
    appointmentDate: '15/10/2025',
    appointmentTime: '14:00',
    attachedImages: [
      'https://via.placeholder.com/300x200/609CEF/FFFFFF?text=Điều+hòa+1',
      'https://via.placeholder.com/300x200/87CEEB/FFFFFF?text=Điều+hòa+2'
    ]
  },
  {
    id: '2',
    serviceName: 'Sửa ống nước',
    customerName: 'Trần Thị B',
    priceRange: '150,000đ - 300,000đ',
    status: 'quote_sent',
    address: '456 Nguyễn Huệ, Quận 1, TP.HCM',
    phone: '091****678',
    description: 'Ống nước bị rò rỉ dưới bồn rửa bát',
    appointmentDate: '16/10/2025',
    appointmentTime: '09:00'
  },
  {
    id: '3',
    serviceName: 'Sửa tủ lạnh',
    customerName: 'Lê Văn C',
    priceRange: '300,000đ - 600,000đ',
    status: 'quote_sent',
    address: '789 Lý Tự Trọng, Quận 1, TP.HCM',
    phone: '092****789',
    description: 'Tủ lạnh không đông đá, ngăn mát vẫn hoạt động bình thường',
    appointmentDate: '14/10/2025',
    appointmentTime: '16:00',
    attachedImages: [
      'https://via.placeholder.com/300x200/10B981/FFFFFF?text=Tủ+lạnh+1',
      'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Tủ+lạnh+2',
      'https://via.placeholder.com/300x200/EF4444/FFFFFF?text=Tủ+lạnh+3'
    ]
  }
];

// Swipe Button Component
const SwipeButton: React.FC<{
  onSwipeComplete: () => void;
  title: string;
  isEnabled: boolean;
  backgroundColor?: string;
}> = ({ onSwipeComplete, title, isEnabled, backgroundColor = '#609CEF' }) => {
  const buttonWidth = SCREEN_WIDTH - 40;
  const knobSize = 60;
  const maxTranslate = buttonWidth - knobSize - 8;
  
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (isEnabled) {
        scale.value = withSpring(1.05);
      }
    })
    .onUpdate((event) => {
      if (isEnabled) {
        translateX.value = Math.max(0, Math.min(maxTranslate, event.translationX));
        // Fade out hint as user swipes
        opacity.value = Math.max(0.2, 1 - (event.translationX / maxTranslate));
      }
    })
    .onEnd((event) => {
      if (isEnabled) {
        scale.value = withSpring(1);
        if (event.translationX > maxTranslate * 0.6) {
          // Completed swipe
          translateX.value = withTiming(maxTranslate, { duration: 200 }, () => {
            runOnJS(onSwipeComplete)();
            // Reset after completion with delay
            setTimeout(() => {
              translateX.value = withTiming(0, { duration: 400 });
              opacity.value = withTiming(1, { duration: 200 });
            }, 800);
          });
        } else {
          // Return to start
          translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
          opacity.value = withTiming(1, { duration: 300 });
        }
      }
    });

  const knobAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { scale: scale.value }
      ],
    };
  });

  const hintAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <View style={styles.swipeWrapper}>
      <LinearGradient 
        colors={isEnabled ? [backgroundColor, '#3B82F6'] : ['#E5E5E5', '#D1D5DB']} 
        style={styles.swipeContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.swipeTextContainer}>
          <Text style={[styles.swipeText, { color: isEnabled ? 'white' : '#9CA3AF' }]}>
            {title}
          </Text>
        </View>
        <Animated.View style={[styles.swipeHint, hintAnimatedStyle]}>
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.5)" style={{ marginLeft: -6 }} />
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.3)" style={{ marginLeft: -6 }} />
        </Animated.View>
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.swipeKnob,
              knobAnimatedStyle,
            ]}
          >
            <LinearGradient
              colors={isEnabled ? ['#FFFFFF', '#F8FAFC'] : ['#E5E7EB', '#D1D5DB']}
              style={styles.swipeKnobGradient}
            >
              <Ionicons 
                name="chevron-forward" 
                size={28} 
                color={isEnabled ? backgroundColor : '#9CA3AF'} 
              />
            </LinearGradient>
          </Animated.View>
        </GestureDetector>
      </LinearGradient>
      <Text style={styles.swipeInstruction}>Vuốt sang phải để tiếp tục</Text>
    </View>
  );
};

function TechnicianOrderTracking() {
  const { orderId, quoteType, quoteAmount } = useLocalSearchParams();
  const [order, setOrder] = useState<OrderItem | null>(null);
  const [currentStatus, setCurrentStatus] = useState('quote_sent');
  const [showTimeline, setShowTimeline] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);

  useEffect(() => {
    if (orderId) {
      const foundOrder = mockOrders.find(o => o.id === orderId);
      if (foundOrder) {
        setOrder(foundOrder);
        setCurrentStatus(foundOrder.status);
        setCurrentStatus(foundOrder.status);
      }
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

  const getStatusInfo = (status: string) => {
    const statusMap: { [key: string]: { title: string; description: string; color: string; icon: string } } = {
      pending: {
        title: 'Đơn mới',
        description: 'Khách hàng vừa đặt lịch, chờ thợ tiếp nhận',
        color: '#609CEF',
        icon: 'notifications'
      },
      quote_sent: {
        title: 'Đã báo giá',
        description: 'Đã gửi báo giá, chờ khách hàng xác nhận',
        color: '#F59E0B',
        icon: 'document-text'
      },
      quote_accepted: {
        title: 'Báo giá được chấp nhận',
        description: 'Khách đã đồng ý, chuẩn bị đến kiểm tra',
        color: '#10B981',
        icon: 'checkmark-circle'
      },
      on_the_way: {
        title: 'Đang đến',
        description: 'Đang trên đường đến địa điểm khách hàng',
        color: '#3B82F6',
        icon: 'car'
      },
      arrived: {
        title: 'Đã đến nơi',
        description: 'Đã có mặt tại địa điểm, kiểm tra tình trạng',
        color: '#8B5CF6',
        icon: 'location'
      },
      price_confirmation: {
        title: 'Xác nhận giá cuối',
        description: 'Đang chờ khách xác nhận giá sau kiểm tra',
        color: '#F59E0B',
        icon: 'calculator'
      },
      repairing: {
        title: 'Đang sửa chữa',
        description: 'Đang thực hiện sửa chữa thiết bị',
        color: '#EF4444',
        icon: 'construct'
      },
      payment_pending: {
        title: 'Chờ thanh toán',
        description: 'Hoàn thành sửa chữa, chờ khách thanh toán',
        color: '#10B981',
        icon: 'card'
      },
      completed: {
        title: 'Hoàn thành',
        description: 'Đã hoàn thành và nhận được thanh toán',
        color: '#059669',
        icon: 'checkmark-done'
      }
    };
    
    return statusMap[status] || statusMap.quote_sent;
  };

  const getTimeline = () => {
    const statusFlow = ['quote_sent', 'quote_accepted', 'on_the_way', 'arrived', 'price_confirmation', 'repairing', 'payment_pending', 'completed'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    
    const timelineData = [
      { status: 'quote_sent', time: '14:30', date: '13/10/2025', completed: true },
      { status: 'quote_accepted', time: '15:45', date: '13/10/2025', completed: currentIndex >= 1 },
      { status: 'on_the_way', time: '08:15', date: '14/10/2025', completed: currentIndex >= 2 },
      { status: 'arrived', time: '09:30', date: '14/10/2025', completed: currentIndex >= 3 },
      { status: 'price_confirmation', time: '10:15', date: '14/10/2025', completed: currentIndex >= 4 },
      { status: 'repairing', time: '10:45', date: '14/10/2025', completed: currentIndex >= 5 },
      { status: 'payment_pending', time: '', date: '', completed: currentIndex >= 6 },
      { status: 'completed', time: '', date: '', completed: currentIndex >= 7 },
    ];

    return timelineData;
  };

  const handleShowTimeline = () => {
    setShowTimeline(!showTimeline);
  };

  const statusInfo = getStatusInfo(currentStatus);

  const handleUpdateStatus = () => {
    const statusFlow = ['quote_sent', 'quote_accepted', 'on_the_way', 'arrived', 'price_confirmation', 'repairing', 'payment_pending', 'completed'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    
    if (currentIndex < statusFlow.length - 1) {
      const nextStatus = statusFlow[currentIndex + 1];
      const nextStatusInfo = getStatusInfo(nextStatus);
      
      // Special handling for different status transitions
      if (nextStatus === 'price_confirmation' && quoteType === 'final') {
        // Skip price confirmation for final quotes
        setCurrentStatus('repairing');
        Alert.alert('Thông báo', 'Báo giá chốt - chuyển thẳng sang sửa chữa');
        return;
      }
      
      if (nextStatus === 'arrived') {
        Alert.alert(
          'Xác nhận đã đến nơi',
          'Bạn đã có mặt tại địa điểm khách hàng?\n Vui lòng chụp ảnh tình trạng ban đầu',
          [
            { text: 'Chưa đến', style: 'cancel' },
            {
              text: 'Đã đến - Chụp ảnh',
              onPress: () => {
                setCurrentStatus(nextStatus);
                // Here you would open camera or image picker
                Alert.alert('Camera', 'Mở camera để chụp ảnh tình trạng thiết bị...');
              }
            }
          ]
        );
        return;
      }

      if (nextStatus === 'repairing') {
        Alert.alert(
          'Bắt đầu sửa chữa',
          'Bạn đã xác nhận giá với khách hàng và sẵn sàng sửa chữa?',
          [
            { text: 'Chưa xác nhận giá', style: 'cancel' },
            {
              text: 'Bắt đầu sửa chữa',
              onPress: () => setCurrentStatus(nextStatus)
            }
          ]
        );
        return;
      }

      if (nextStatus === 'payment_pending') {
        Alert.alert(
          'Hoàn thành sửa chữa',
          'Đã sửa chữa xong?\n\n📷 Vui lòng chụp ảnh sau khi sửa chữa',
          [
            { text: 'Chưa xong', style: 'cancel' },
            {
              text: 'Đã xong - Chụp ảnh',
              onPress: () => {
                setCurrentStatus(nextStatus);
                // Here you would open camera or image picker
                Alert.alert('Camera', 'Mở camera để chụp ảnh sau sửa chữa...');
              }
            }
          ]
        );
        return;
      }
      
      Alert.alert(
        'Cập nhật trạng thái',
        `Chuyển sang: ${nextStatusInfo.title}?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xác nhận',
            onPress: () => setCurrentStatus(nextStatus)
          }
        ]
      );
    } else {
      Alert.alert('Thông báo', 'Đơn hàng đã hoàn thành!');
    }
  };

  const handleContactCustomer = () => {
    Alert.alert(
      'Liên hệ khách hàng',
      `Gọi cho ${order.customerName}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Gọi ngay', onPress: () => Alert.alert('Đang gọi...', order.phone) }
      ]
    );
  };

  const handleViewLocation = () => {
    Alert.alert(
      'Xem địa chỉ',
      `Mở bản đồ đến: ${order.address}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Mở bản đồ', onPress: () => Alert.alert('Đang mở bản đồ...') }
      ]
    );
  };

  const handleChatCustomer = () => {
    Alert.alert(
      'Chat với khách hàng',
      `Mở chat với ${order.customerName}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Mở chat', onPress: () => Alert.alert('Đang mở chat...') }
      ]
    );
  };

  const handleViewImage = (imageUri: string, index: number, totalImages: number) => {
    Alert.alert(
      'Xem hình ảnh',
      `Hình ${index + 1}/${totalImages}`,
      [
        { text: 'Đóng', style: 'cancel' },
        { text: 'Xem toàn màn hình', onPress: () => Alert.alert('Đang mở hình ảnh...') }
      ]
    );
  };

  const handleViewEarnings = () => {
    if (!order) return;
    setShowEarningsModal(true);
  };

  const calculateEarnings = () => {
    if (!order) return { finalPrice: 0, commission: 0, actualEarnings: 0 };
    
    // Extract price from priceRange (e.g., "200,000đ - 500,000đ" -> 500,000)
    const priceText = order.priceRange;
    const prices = priceText.match(/[\d,]+/g) || [];
    const finalPriceText = prices[prices.length - 1] || '0'; // Get higher price
    const finalPrice = parseInt(finalPriceText.replace(/,/g, ''));
    
    // Calculate 15% commission deduction
    const commissionRate = 0.15;
    const commission = finalPrice * commissionRate;
    const actualEarnings = finalPrice - commission;
    
    return { finalPrice, commission, actualEarnings };
  };

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  const handleConfirmReceived = () => {
    setShowEarningsModal(false);
    Alert.alert('Thành công', 'Cảm ơn bạn đã hoàn thành công việc!');
  };

  const handleFinalPriceConfirmation = () => {
    Alert.prompt(
      'Xác nhận giá cuối cùng',
      'Nhập giá cuối cùng sau khi kiểm tra thực tế:',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: (finalPrice?: string) => {
            if (finalPrice) {
              Alert.alert(
                'Gửi giá cuối cùng',
                `Giá cuối cùng: ${finalPrice} VNĐ\n\nGửi cho khách hàng xác nhận?`,
                [
                  { text: 'Sửa lại', style: 'cancel' },
                  {
                    text: 'Gửi khách hàng',
                    onPress: () => {
                      Alert.alert('Thành công', 'Đã gửi giá cuối cùng cho khách hàng');
                      // Update status to waiting for customer confirmation
                    }
                  }
                ]
              );
            }
          }
        }
      ],
      'plain-text',
      quoteAmount && typeof quoteAmount === 'string' ? quoteAmount.replace(/[^\d]/g, '') : ''
    );
  };

  const handleTakePhoto = (type: 'before' | 'after') => {
    const title = type === 'before' ? 'Chụp ảnh trước sửa chữa' : 'Chụp ảnh sau sửa chữa';
    Alert.alert(
      title,
      'Chọn nguồn ảnh:',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Camera', onPress: () => Alert.alert('Camera', 'Mở camera...') },
        { text: 'Thư viện', onPress: () => Alert.alert('Gallery', 'Mở thư viện ảnh...') }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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
        <Text style={styles.headerTitle}>Theo dõi đơn hàng</Text>
        <TouchableOpacity style={styles.headerAction} onPress={handleContactCustomer}>
          <Ionicons name="call" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Current Status */}
        <View style={styles.statusSection}>
          <TouchableOpacity 
            style={[styles.statusCard, { borderLeftColor: statusInfo.color }]}
            onPress={handleShowTimeline}
            activeOpacity={0.8}
          >
            <View style={styles.statusHeader}>
              <View style={[styles.statusIcon, { backgroundColor: statusInfo.color }]}>
                <Ionicons name={statusInfo.icon as any} size={24} color="#FFFFFF" />
              </View>
              <View style={styles.statusContent}>
                <Text style={styles.statusTitle}>{statusInfo.title}</Text>
                <Text style={styles.statusDescription}>{statusInfo.description}</Text>
              </View>
              <View style={styles.timelineIndicator}>
                <Ionicons 
                  name={showTimeline ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#609CEF" 
                />
              </View>
            </View>
          </TouchableOpacity>

          {/* Inline Timeline */}
          {showTimeline && (
            <View style={styles.inlineTimelineContainer}>
              <View style={styles.timelineHeader}>
                <Ionicons name="time-outline" size={20} color="#609CEF" />
                <Text style={styles.timelineHeaderText}>Timeline Thực Hiện</Text>
              </View>
              
              {getTimeline().map((item, index) => {
                const stepInfo = getStatusInfo(item.status);
                const isCurrentStep = item.status === currentStatus;
                const isCompleted = item.completed;
                
                return (
                  <View key={index} style={styles.inlineTimelineItem}>
                    <View style={styles.timelineLeft}>
                      <View style={[
                        styles.timelineIcon,
                        { 
                          backgroundColor: isCompleted ? '#10B981' : (isCurrentStep ? '#3B82F6' : '#E5E7EB'),
                          borderColor: isCurrentStep && !isCompleted ? '#3B82F6' : 'transparent',
                          borderWidth: isCurrentStep && !isCompleted ? 2 : 0
                        }
                      ]}>
                        <Ionicons 
                          name={isCompleted ? "checkmark" : stepInfo.icon as any} 
                          size={14} 
                          color={isCompleted ? "#FFFFFF" : "#9CA3AF"} 
                        />
                      </View>
                      {index < getTimeline().length - 1 && (
                        <View style={[
                          styles.timelineLine,
                          { backgroundColor: isCompleted ? '#10B981' : '#E5E7EB' }
                        ]} />
                      )}
                    </View>
                    
                    <View style={styles.timelineRight}>
                      <Text style={[
                        styles.timelineStepTitle,
                        { 
                          color: isCompleted ? '#1F2937' : '#9CA3AF',
                          fontSize: 14
                        }
                      ]}>
                        {stepInfo.title}
                      </Text>
                      <Text style={[styles.timelineStepDescription, { fontSize: 12 }]}>
                        {stepInfo.description}
                      </Text>
                      {item.time && (
                        <Text style={styles.timelineTime}>
                          {item.date} • {item.time}
                        </Text>
                      )}
                      {isCurrentStep && !isCompleted && (
                        <View style={styles.currentStepBadge}>
                          <Text style={styles.currentStepText}>Hiện tại</Text>
                        </View>
                      )}
                      {isCompleted && isCurrentStep && item.status === 'completed' && (
                        <View style={[styles.currentStepBadge, { backgroundColor: '#DCFCE7' }]}>
                          <Text style={[styles.currentStepText, { color: '#10B981' }]}>Hoàn thành</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Action Buttons - Moved up for better visibility */}
        <View style={styles.actionSection}>
          {/* Priority Camera Button - Always visible when needed */}
          {currentStatus === 'arrived' && (
            <TouchableOpacity style={styles.primaryActionButton} onPress={() => handleTakePhoto('before')}>
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.primaryActionGradient}>
                <Ionicons name="camera" size={24} color="#FFFFFF" />
                <Text style={styles.primaryActionButtonText}>Chụp ảnh tình trạng ban đầu</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {currentStatus === 'repairing' && (
            <TouchableOpacity style={styles.primaryActionButton} onPress={() => handleTakePhoto('after')}>
              <LinearGradient colors={['#059669', '#047857']} style={styles.primaryActionGradient}>
                <Ionicons name="camera" size={24} color="#FFFFFF" />
                <Text style={styles.primaryActionButtonText}>Chụp ảnh sau sửa chữa</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {currentStatus === 'completed' && (
            <TouchableOpacity style={styles.primaryActionButton} onPress={handleViewEarnings}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.primaryActionGradient}>
                <Ionicons name="cash" size={24} color="#FFFFFF" />
                <Text style={styles.primaryActionButtonText}>Xem thực nhận</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Secondary Action Buttons - Hide after arrived */}
          {!['arrived', 'price_confirmation', 'repairing', 'payment_pending', 'completed'].includes(currentStatus) && (
            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleViewLocation}>
                <LinearGradient colors={['#609CEF', '#3B82F6']} style={styles.actionGradient}>
                  <Ionicons name="location" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Xem địa chỉ</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleContactCustomer}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.actionGradient}>
                  <Ionicons name="call" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Gọi khách hàng</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
          
          {/* Service Card */}
          <View style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <View style={styles.serviceIcon}>
                <Ionicons name="construct" size={24} color="#609CEF" />
              </View>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{order.serviceName}</Text>
                <Text style={styles.servicePrice}>{order.priceRange}</Text>
              </View>
            </View>
          </View>
          
          {/* Customer Info Card */}
          <View style={styles.customerCard}>
            <View style={styles.customerHeader}>
              <View style={styles.customerAvatarCircle}>
                <Ionicons name="person" size={20} color="#609CEF" />
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerLabel}>Khách hàng</Text>
                <Text style={styles.customerName}>{order.customerName}</Text>
              </View>
              <View style={styles.quickActionsGroup}>
                <TouchableOpacity style={styles.quickCallButton} onPress={handleContactCustomer}>
                  <Ionicons name="call" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickChatButton} onPress={handleChatCustomer}>
                  <Ionicons name="chatbubble-ellipses" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.customerPhoneSection}>
              <Ionicons name="call-outline" size={16} color="#9CA3AF" />
              <Text style={styles.customerPhoneText}>{order.phone}</Text>
            </View>
          </View>
          
          {/* Appointment Card - Enhanced for visibility */}
          <View style={styles.appointmentCardHighlight}>
            <View style={styles.appointmentHeader}>
              <View style={styles.appointmentIconContainer}>
                <Ionicons name="calendar" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.appointmentTitleContainer}>
                <Text style={styles.appointmentTitle}>Lịch hẹn khách hàng</Text>
                <Text style={styles.appointmentSubtitle}>Thời gian đã đặt</Text>
              </View>
            </View>
            <View style={styles.appointmentTimeContainer}>
              <View style={styles.appointmentDateBox}>
                <Text style={styles.appointmentDateLabel}>Ngày</Text>
                <Text style={styles.appointmentDateValue}>{order.appointmentDate}</Text>
              </View>
              <View style={styles.appointmentTimeDivider} />
              <View style={styles.appointmentTimeBox}>
                <Text style={styles.appointmentTimeLabel}>Giờ</Text>
                <Text style={styles.appointmentTimeValue}>{order.appointmentTime}</Text>
              </View>
            </View>
            <View style={styles.appointmentAlert}>
              <Ionicons name="time" size={16} color="#F59E0B" />
              <Text style={styles.appointmentAlertText}>Vui lòng đến đúng giờ đã hẹn</Text>
            </View>
          </View>
          
          {/* Description Card */}
          <View style={styles.descriptionCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text" size={24} color="#609CEF" />
              <Text style={styles.cardTitle}>Mô tả sự cố</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.descriptionText}>{order.description}</Text>
            </View>
          </View>

          {/* Attached Images Card */}
          {order.attachedImages && order.attachedImages.length > 0 && (
            <View style={styles.imagesCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="images" size={24} color="#609CEF" />
                <Text style={styles.cardTitle}>Hình ảnh đính kèm ({order.attachedImages.length})</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScrollView}>
                <View style={styles.imagesContainer}>
                  {order.attachedImages.map((imageUri, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.imageWrapper}
                      onPress={() => handleViewImage(imageUri, index, order.attachedImages!.length)}
                    >
                      <Image source={{ uri: imageUri }} style={styles.attachedImage} />
                      <View style={styles.imageOverlay}>
                        <Ionicons name="expand" size={20} color="#FFFFFF" />
                      </View>
                      <View style={styles.imageNumberBadge}>
                        <Text style={styles.imageNumberText}>{index + 1}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <View style={styles.imagesFooter}>
                <Ionicons name="information-circle" size={16} color="#6B7280" />
                <Text style={styles.imagesFooterText}>Nhấn để xem chi tiết hình ảnh</Text>
              </View>
            </View>
          )}
        </View>

        {/* Quote Info */}
        {quoteType && quoteAmount && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin báo giá</Text>
            <View style={[
              styles.quoteCard,
              { borderColor: quoteType === 'estimated' ? '#F59E0B' : '#10B981' }
            ]}>
              <View style={styles.quoteHeader}>
                <View style={[
                  styles.quoteTypeTag,
                  { backgroundColor: quoteType === 'estimated' ? '#FFFBEB' : '#ECFDF5' }
                ]}>
                  <Ionicons 
                    name={quoteType === 'estimated' ? "calculator" : "checkmark-circle"} 
                    size={16} 
                    color={quoteType === 'estimated' ? '#F59E0B' : '#10B981'} 
                  />
                  <Text style={[
                    styles.quoteTypeText,
                    { color: quoteType === 'estimated' ? '#F59E0B' : '#10B981' }
                  ]}>
                    {quoteType === 'estimated' ? 'Báo giá dự kiến' : 'Báo giá chốt'}
                  </Text>
                </View>
              </View>
              <Text style={[
                styles.quoteAmount,
                { color: quoteType === 'estimated' ? '#F59E0B' : '#10B981' }
              ]}>
                {quoteAmount} VNĐ
              </Text>
              {quoteType === 'estimated' && (
                <Text style={styles.quoteNote}>
                  * Giá có thể thay đổi sau khi kiểm tra thực tế
                </Text>
              )}
            </View>
          </View>
        )}



        {/* Status-specific Actions */}
        {currentStatus === 'arrived' && quoteType === 'estimated' && (
          <View style={styles.statusActionSection}>
            <TouchableOpacity style={styles.statusActionButton} onPress={handleFinalPriceConfirmation}>
              <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.statusActionGradient}>
                <Ionicons name="calculator" size={20} color="#FFFFFF" />
                <Text style={styles.statusActionButtonText}>Xác nhận giá cuối cùng</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}



      </ScrollView>

      {/* Sticky Swipe Button */}
      {currentStatus !== 'completed' && (
        <View style={styles.swipeSection}>
          <SwipeButton
            title="Vuốt để chuyển bước tiếp theo"
            isEnabled={true}
            onSwipeComplete={handleUpdateStatus}
            backgroundColor="#609CEF"
          />
        </View>
      )}

      {/* Earnings Modal */}
      <Modal
        visible={showEarningsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEarningsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.modalHeaderGradient}
              >
                <View style={styles.modalHeaderLeft}>
                  <View style={styles.modalIconContainer}>
                    <Ionicons name="wallet-outline" size={32} color="#FFFFFF" />
                  </View>
                  <Text style={styles.modalTitle}>Thực nhận của bạn</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowEarningsModal(false)}
                >
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* Content */}
            <View style={styles.modalContent}>
              {(() => {
                const { finalPrice, commission, actualEarnings } = calculateEarnings();
                return (
                  <>
                    {/* Service Price */}
                    <View style={styles.earningsRow}>
                      <View style={styles.earningsIconContainer}>
                        <Ionicons name="pricetag" size={20} color="#3B82F6" />
                      </View>
                      <View style={styles.earningsInfo}>
                        <Text style={styles.earningsLabel}>Giá dịch vụ</Text>
                        <Text style={styles.earningsAmount}>{formatMoney(finalPrice)}</Text>
                      </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.modalDivider} />

                    {/* Platform Fee */}
                    <View style={styles.earningsRow}>
                      <View style={[styles.earningsIconContainer, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                        <Ionicons name="remove-circle" size={20} color="#EF4444" />
                      </View>
                      <View style={styles.earningsInfo}>
                        <Text style={styles.earningsLabel}>Phí nền tảng (15%)</Text>
                        <Text style={[styles.earningsAmount, { color: '#EF4444' }]}>-{formatMoney(commission)}</Text>
                      </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.modalDivider} />

                    {/* Final Earnings */}
                    <View style={styles.finalEarningsContainer}>
                      <LinearGradient
                        colors={['#10B981', '#059669']}
                        style={styles.finalEarningsGradient}
                      >
                        <View style={styles.finalEarningsContent}>
                          <View style={styles.finalEarningsIcon}>
                            <Ionicons name="wallet" size={24} color="#FFFFFF" />
                          </View>
                          <View style={styles.finalEarningsText}>
                            <Text style={styles.finalEarningsLabel}>Số tiền thực nhận</Text>
                            <Text style={styles.finalEarningsAmount}>{formatMoney(actualEarnings)}</Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </View>
                  </>
                );
              })()}
            </View>
          </View>
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
  headerBackButton: {
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
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 120, // Space for sticky SwipeButton
  },
  statusSection: {
    marginTop: 16,
    marginBottom: 24,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  quoteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quoteHeader: {
    marginBottom: 12,
  },
  quoteTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  quoteTypeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quoteAmount: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  quoteNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionSection: {
    marginBottom: 24,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  primaryActionButton: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: 16,
  },
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 12,
  },
  primaryActionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  updateSection: {
    marginBottom: 32,
  },
  updateButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  updateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  updateButtonText: {
    fontSize: 16,
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
  statusActionSection: {
    marginBottom: 16,
  },
  statusActionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  statusActionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // New improved styles
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#609CEF',
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#609CEF',
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  customerGradientHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  customerHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  customerHeaderInfo: {
    flex: 1,
  },
  customerHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  customerHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  customerContent: {
    padding: 20,
  },
  customerNameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  customerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  customerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  customerContactInfo: {
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactDetails: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  quickActionsGroup: {
    flexDirection: 'row',
    gap: 8,
    width: 80,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  quickCallButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickMapButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  imagesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  imagesScrollView: {
    marginVertical: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 4,
    gap: 12,
  },
  imageWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  attachedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(96, 156, 239, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageNumberBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  imagesFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  imagesFooterText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  cardContent: {
    paddingLeft: 32,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 2,
  },
  customerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  customerPhoneSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  customerPhoneText: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
  },
  customerContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  appointmentHour: {
    fontSize: 16,
    fontWeight: '600',
    color: '#609CEF',
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  // Swipe Button styles
  swipeSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 0,
    paddingTop: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20, // Safe area for iOS
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  swipeWrapper: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  swipeContainer: {
    width: '100%',
    height: 68,
    borderRadius: 34,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#609CEF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(96, 156, 239, 0.15)',
    paddingHorizontal: 8,
  },
  swipeTextContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  swipeText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  swipeHint: {
    position: 'absolute',
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeKnob: {
    position: 'absolute',
    left: 4,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  swipeKnobGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  swipeInstruction: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 12,
    fontWeight: '500',
  },
  // Enhanced Appointment Styles
  appointmentCardHighlight: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#609CEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  appointmentIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#609CEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  appointmentTitleContainer: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  appointmentSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  appointmentTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  appointmentDateBox: {
    flex: 1,
    alignItems: 'center',
  },
  appointmentDateLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  appointmentDateValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  appointmentTimeDivider: {
    width: 2,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },
  appointmentTimeBox: {
    flex: 1,
    alignItems: 'center',
  },
  appointmentTimeLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  appointmentTimeValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#609CEF',
  },
  appointmentAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  appointmentAlertText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
  },
  timelineIndicator: {
    marginLeft: 8,
  },
  // Inline Timeline Styles
  inlineTimelineContainer: {
    backgroundColor: '#F8FAFC',
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  timelineHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  inlineTimelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 12,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
  },
  timelineRight: {
    flex: 1,
    paddingTop: 4,
  },
  timelineStepTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  timelineStepDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  timelineTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  currentStepBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  currentStepText: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalHeader: {
    overflow: 'hidden',
  },
  modalHeaderGradient: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 16,
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginLeft: 2,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flexShrink: 0,
  },
  modalContent: {
    padding: 28,
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 4,
  },
  earningsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  earningsInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 17,
    color: '#374151',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  earningsAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 0.3,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
    marginHorizontal: 4,
  },
  finalEarningsContainer: {
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  finalEarningsGradient: {
    padding: 24,
  },
  finalEarningsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalEarningsIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  finalEarningsText: {
    flex: 1,
  },
  finalEarningsLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 6,
    fontWeight: '600',
    opacity: 0.95,
    letterSpacing: 0.3,
  },
  finalEarningsAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 12,
    gap: 16,
  },
  modalSecondaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.2,
  },
  modalPrimaryButton: {
    flex: 2,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalPrimaryButtonGradient: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  modalPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});

// Export protected component
export default withTechnicianAuth(TechnicianOrderTracking, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});