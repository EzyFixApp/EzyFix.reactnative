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
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';

interface OrderItem {
  id: string;
  serviceName: string;
  customerName: string;
  priceRange: string;
}

// Mock order data - Same as other files
const mockOrders: OrderItem[] = [
  {
    id: '1',
    serviceName: 'Sửa điều hòa',
    customerName: 'Nguyễn Văn A',
    priceRange: '200,000đ - 500,000đ',
  },
  {
    id: '2',
    serviceName: 'Sửa ống nước',
    customerName: 'Trần Thị B',
    priceRange: '150,000đ - 300,000đ',
  },
  {
    id: '3',
    serviceName: 'Sửa tủ lạnh',
    customerName: 'Lê Văn C',
    priceRange: '300,000đ - 600,000đ',
  }
];

function QuoteSelection() {
  const { orderId } = useLocalSearchParams();
  const [order, setOrder] = useState<OrderItem | null>(null);
  const [selectedType, setSelectedType] = useState<'estimated' | 'final' | null>(null);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const amountInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const summaryRef = useRef<View>(null);

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

  const handleQuoteTypeSelect = (type: 'estimated' | 'final') => {
    setSelectedType(type);

    // Auto scroll to amount input section when quote type is selected
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 400, animated: true });
    }, 300);
  };

  const handleSendQuote = () => {
    if (!selectedType) {
      Alert.alert('Thông báo', 'Vui lòng chọn loại báo giá');
      return;
    }

    if (!quoteAmount.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập số tiền báo giá');
      return;
    }

    const quoteTypeText = selectedType === 'estimated' ? 'dự kiến' : 'chốt';
    const confirmMessage = selectedType === 'estimated'
      ? 'Báo giá dự kiến có thể thay đổi sau khi kiểm tra thực tế. Bạn có chắc chắn gửi báo giá này?'
      : 'Báo giá chốt sẽ không thay đổi và khách hàng có thể chấp nhận ngay. Bạn có chắc chắn gửi báo giá này?';

    Alert.alert(
      `Xác nhận báo giá ${quoteTypeText}`,
      `${confirmMessage}\n\n💰 Số tiền: ${quoteAmount} VNĐ`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận gửi',
          style: 'default',
          onPress: () => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              Alert.alert(
                '✅ Gửi báo giá thành công!',
                `Đã gửi báo giá ${quoteTypeText} với số tiền ${quoteAmount} VNĐ cho khách hàng.\n\nKhách hàng sẽ nhận được thông báo và có thể xem chi tiết báo giá.`,
                [
                  {
                    text: 'Theo dõi đơn hàng',
                    onPress: () => {
                      // Navigate to technician order tracking with quote info
                      router.push({
                        pathname: './technician-order-tracking',
                        params: {
                          orderId: order.id,
                          quoteType: selectedType,
                          quoteAmount: quoteAmount
                        }
                      } as any);
                    }
                  }
                ]
              );
            }, 1500);
          }
        }
      ]
    );
  };

  const formatCurrency = (text: string) => {
    // Remove non-numeric characters except commas
    const numericText = text.replace(/[^\d]/g, '');

    // Format with thousand separators
    if (numericText) {
      const formatted = parseInt(numericText).toLocaleString('vi-VN');
      return formatted;
    }
    return '';
  };

  const handleAmountChange = (text: string) => {
    const formatted = formatCurrency(text);
    setQuoteAmount(formatted);

    // Auto scroll to summary section when user finishes typing
    if (formatted && selectedType) {
      setTimeout(() => {
        summaryRef.current?.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({ y: y - 50, animated: true });
          },
          () => {
            // Fallback: scroll to end if measurement fails
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        );
      }, 500);
    }
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
        <Text style={styles.headerTitle}>Chọn loại báo giá</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Order Info */}
        <View style={styles.orderInfo}>
          <Text style={styles.serviceName}>{order.serviceName}</Text>
          <Text style={styles.customerName}>Khách hàng: {order.customerName}</Text>
          <Text style={styles.priceRange}>Giá dự kiến: {order.priceRange}</Text>
        </View>

        {/* Quote Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn loại báo giá</Text>

          <TouchableOpacity
            style={[
              styles.quoteTypeCard,
              selectedType === 'estimated' && styles.selectedCard
            ]}
            onPress={() => handleQuoteTypeSelect('estimated')}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <View style={[
                styles.radioButton,
                selectedType === 'estimated' && styles.selectedRadio
              ]}>
                {selectedType === 'estimated' && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <Text style={[
                styles.cardTitle,
                selectedType === 'estimated' && styles.selectedText
              ]}>
                Báo giá dự kiến
              </Text>
              <Ionicons
                name="calculator-outline"
                size={24}
                color={selectedType === 'estimated' ? '#609CEF' : '#6B7280'}
              />
            </View>
            <Text style={styles.cardDescription}>
              Giá có thể thay đổi sau khi kiểm tra thực tế tại hiện trường.
              Phù hợp khi chưa thể đánh giá chính xác tình trạng thiết bị.
            </Text>
            <View style={styles.cardFeatures}>
              <Text style={styles.featureText}>• Có thể điều chỉnh giá sau kiểm tra</Text>
              <Text style={styles.featureText}>• Cần xác nhận lại với khách hàng</Text>
              <Text style={styles.featureText}>• Linh hoạt trong quá trình sửa chữa</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quoteTypeCard,
              selectedType === 'final' && styles.selectedCard
            ]}
            onPress={() => handleQuoteTypeSelect('final')}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <View style={[
                styles.radioButton,
                selectedType === 'final' && styles.selectedRadio
              ]}>
                {selectedType === 'final' && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <Text style={[
                styles.cardTitle,
                selectedType === 'final' && styles.selectedText
              ]}>
                Báo giá chốt
              </Text>
              <Ionicons
                name="checkmark-circle-outline"
                size={24}
                color={selectedType === 'final' ? '#10B981' : '#6B7280'}
              />
            </View>
            <Text style={styles.cardDescription}>
              Giá cố định không thay đổi. Khách hàng có thể chấp nhận ngay.
              Chỉ sử dụng khi đã đánh giá chính xác qua ảnh và mô tả.
            </Text>
            <View style={styles.cardFeatures}>
              <Text style={styles.featureText}>• Giá cố định không đổi</Text>
              <Text style={styles.featureText}>• Khách hàng chấp nhận ngay</Text>
              <Text style={styles.featureText}>• Cam kết hoàn thành đúng giá</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Quote Amount Input */}
        {selectedType && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nhập số tiền báo giá</Text>
            <View style={styles.inputContainer}>
              <TextInput
                ref={amountInputRef}
                style={styles.amountInput}
                placeholder="Ví dụ: 350,000"
                value={quoteAmount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                maxLength={15}
              />
              <Text style={styles.currencyUnit}>VNĐ</Text>
            </View>
            <Text style={styles.inputHint}>
              {selectedType === 'estimated'
                ? 'Giá này có thể thay đổi sau khi kiểm tra thực tế'
                : 'Giá này sẽ không thay đổi và là giá cuối cùng'
              }
            </Text>
          </View>
        )}

        {/* Quote Summary - Show when both type and amount are selected */}
        {selectedType && quoteAmount && (
          <View ref={summaryRef} style={styles.quoteSummarySection}>
            <View style={styles.summaryHeaderSection}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.summaryTitle}>Xem lại báo giá</Text>
            </View>

            <View style={[
              styles.quoteSummaryCard,
              { borderColor: selectedType === 'estimated' ? '#609CEF' : '#10B981' }
            ]}>
              {/* Quote Type Display */}
              <View style={styles.quoteTypeDisplaySection}>
                <View style={[
                  styles.quoteTypeDisplayTag,
                  {
                    backgroundColor: selectedType === 'estimated' ? '#EBF4FF' : '#ECFDF5',
                    borderColor: selectedType === 'estimated' ? '#609CEF' : '#10B981'
                  }
                ]}>
                  <Ionicons
                    name={selectedType === 'estimated' ? "calculator" : "checkmark-circle"}
                    size={18}
                    color={selectedType === 'estimated' ? '#609CEF' : '#10B981'}
                  />
                  <Text style={[
                    styles.quoteTypeDisplayText,
                    { color: selectedType === 'estimated' ? '#609CEF' : '#10B981' }
                  ]}>
                    {selectedType === 'estimated' ? 'Báo giá dự kiến' : 'Báo giá chốt'}
                  </Text>
                </View>
              </View>

              {/* Amount Display - Made more prominent */}
              <View style={styles.amountHighlightContainer}>
                <View style={[
                  styles.amountHighlightBox,
                  { backgroundColor: selectedType === 'estimated' ? '#F0F9FF' : '#F0FDF4' }
                ]}>
                  <Text style={styles.amountHighlightLabel}>Số tiền báo giá</Text>
                  <View style={styles.amountHighlightDisplay}>
                    <Text style={[
                      styles.amountHighlightText,
                      { color: selectedType === 'estimated' ? '#609CEF' : '#10B981' }
                    ]}>
                      {quoteAmount}
                    </Text>
                    <Text style={styles.amountHighlightUnit}>VNĐ</Text>
                  </View>
                </View>
              </View>

              {/* Info Note */}
              <View style={[
                styles.summaryInfoNote,
                { backgroundColor: selectedType === 'estimated' ? '#FFFBEB' : '#F0FDF4' }
              ]}>
                <Ionicons
                  name="information-circle"
                  size={16}
                  color={selectedType === 'estimated' ? '#F59E0B' : '#10B981'}
                />
                <Text style={styles.summaryInfoText}>
                  {selectedType === 'estimated'
                    ? 'Giá có thể thay đổi sau kiểm tra thực tế'
                    : 'Giá cố định - không thay đổi'
                  }
                </Text>
              </View>

              {/* Action buttons - Improved design */}
              <View style={styles.summaryActionSection}>
                <Text style={styles.actionSectionLabel}>Tùy chọn chỉnh sửa</Text>
                <View style={styles.summaryActions}>
                  <TouchableOpacity
                    style={styles.editAmountButton}
                    onPress={() => {
                      setQuoteAmount('');
                      // Focus on input and scroll to it
                      setTimeout(() => {
                        amountInputRef.current?.focus();
                        scrollViewRef.current?.scrollTo({ y: 400, animated: true });
                      }, 100);
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="#609CEF" />
                    <Text style={styles.editAmountButtonText}>Sửa số tiền</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.editTypeButton}
                    onPress={() => {
                      Alert.alert(
                        'Thay đổi loại báo giá',
                        'Chọn loại báo giá khác (số tiền sẽ được giữ nguyên)',
                        [
                          { text: 'Hủy', style: 'cancel' },
                          {
                            text: 'Báo giá dự kiến',
                            onPress: () => setSelectedType('estimated')
                          },
                          {
                            text: 'Báo giá chốt',
                            onPress: () => setSelectedType('final')
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="swap-horizontal-outline" size={16} color="#F59E0B" />
                    <Text style={styles.editTypeButtonText}>Đổi loại</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={() => {
                      Alert.alert(
                        'Xác nhận',
                        'Bạn có muốn xóa tất cả và bắt đầu lại?',
                        [
                          { text: 'Hủy', style: 'cancel' },
                          {
                            text: 'Bắt đầu lại',
                            style: 'destructive',
                            onPress: () => {
                              setSelectedType(null);
                              setQuoteAmount('');
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="refresh-outline" size={16} color="#EF4444" />
                    <Text style={styles.resetButtonText}>Làm lại</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Send Quote Button - Fixed at bottom */}
      {selectedType && quoteAmount && (
        <View style={styles.floatingActionContainer}>
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendQuote}
            disabled={loading}
          >
            <LinearGradient
              colors={selectedType === 'estimated' ? ['#609CEF', '#3B82F6'] : ['#10B981', '#059669']}
              style={styles.sendGradient}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.sendButtonText}>Đang gửi báo giá...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <View style={styles.buttonMainInfo}>
                    <Ionicons name="send" size={20} color="#FFFFFF" />
                    <Text style={styles.sendButtonText}>
                      Gửi báo giá {selectedType === 'estimated' ? 'dự kiến' : 'chốt'}
                    </Text>
                  </View>
                  <Text style={styles.buttonAmountText}>
                    {quoteAmount} VNĐ
                  </Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
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
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 180, // Extra space for floating button and summary section
  },
  orderInfo: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  priceRange: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  quoteTypeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedCard: {
    borderColor: '#609CEF',
    backgroundColor: '#F0F9FF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadio: {
    borderColor: '#609CEF',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#609CEF',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    flex: 1,
  },
  selectedText: {
    color: '#609CEF',
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFeatures: {
    marginTop: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    paddingVertical: 16,
    textAlign: 'right',
  },
  currencyUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  // Quote Summary Styles
  quoteSummarySection: {
    marginTop: 20,
  },
  summaryHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  quoteSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    marginBottom: 16,
  },
  quoteTypeDisplaySection: {
    marginBottom: 20,
  },
  quoteTypeDisplayTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
    gap: 8,
  },
  quoteTypeDisplayText: {
    fontSize: 16,
    fontWeight: '700',
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
  quoteTypeTagText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Enhanced amount display
  amountHighlightContainer: {
    marginBottom: 20,
  },
  amountHighlightBox: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  amountHighlightLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  amountHighlightDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  amountHighlightText: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  amountHighlightUnit: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
  },
  // Original amount display (kept for compatibility)
  amountDisplayContainer: {
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  amountDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  amountDisplayText: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  amountDisplayUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  // Enhanced info note
  summaryInfoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 20,
  },
  summaryInfoText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  // Action section
  summaryActionSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  actionSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  // Original note (kept for compatibility)
  summaryNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  summaryNoteText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    flex: 1,
  },
  summaryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editAmountButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#EBF4FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#609CEF',
    gap: 4,
  },
  editAmountButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#609CEF',
  },
  editTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F59E0B',
    gap: 4,
  },
  editTypeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: 4,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  floatingActionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  actionContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sendButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#609CEF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sendGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
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
export default withTechnicianAuth(QuoteSelection, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});