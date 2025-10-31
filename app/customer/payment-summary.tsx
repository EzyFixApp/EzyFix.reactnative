import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  Platform,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Image } from 'react-native';
import { appointmentsService } from '../../lib/api/appointments';
import { paymentService } from '../../lib/api/payment';
import { paymentHub, PaymentUpdatePayload } from '../../lib/signalr/paymentHub';
import withCustomerAuth from '../../lib/auth/withCustomerAuth';

interface PaymentSummaryData {
  appointmentId: string;
  serviceName: string;
  technicianName: string;
  address: string;
  finalPrice: number;
  estimatedPrice?: number;
}

function PaymentSummary() {
  const params = useLocalSearchParams<{ 
    appointmentId: string;
    serviceName: string;
    technicianName: string;
    address: string;
    finalPrice: string;
  }>();

  const [voucherCode, setVoucherCode] = useState('');
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [invoiceRequested, setInvoiceRequested] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [providerId, setProviderId] = useState<string>('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [paymentId, setPaymentId] = useState(''); // Store payment ID for confirmation
  
  // Custom notification modal states
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationConfig, setNotificationConfig] = useState({
    type: 'success' as 'success' | 'error' | 'info' | 'warning',
    title: '',
    message: '',
    icon: 'checkmark-circle' as any,
  });

  const finalPrice = parseFloat(params.finalPrice || '0');
  const totalAmount = finalPrice - voucherDiscount;

  // Format tiền VND
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Show custom notification
  const showNotification = (
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message: string
  ) => {
    const iconMap = {
      success: 'checkmark-circle',
      error: 'close-circle',
      info: 'information-circle',
      warning: 'warning',
    };
    
    setNotificationConfig({
      type,
      title,
      message,
      icon: iconMap[type],
    });
    setShowNotificationModal(true);
  };

  // Handle apply voucher
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      showNotification('warning', 'Thông báo', 'Vui lòng nhập mã voucher');
      return;
    }

    try {
      setApplyingVoucher(true);
      
      // TODO: Call voucher validation API when backend is ready
      // For now, show message that voucher system is not available
      showNotification(
        'info',
        'Tính năng đang phát triển',
        'Hệ thống voucher đang được hoàn thiện. Vui lòng thanh toán với giá gốc.'
      );

      // Example: const voucherData = await voucherService.validateVoucher(voucherCode, params.appointmentId);
      // setVoucherDiscount(voucherData.discountAmount);
      // setVoucherApplied(true);

    } catch (error: any) {
      showNotification('error', 'Lỗi', error?.message || 'Mã voucher không hợp lệ');
    } finally {
      setApplyingVoucher(false);
    }
  };

  // Handle remove voucher
  const handleRemoveVoucher = () => {
    setVoucherCode('');
    setVoucherApplied(false);
    setVoucherDiscount(0);
  };

  // Handle payment
  const handleProceedToPayment = async () => {
    try {
      setProcessingPayment(true);

      if (__DEV__) {
        console.log('💳 [PaymentSummary] Creating payment checkout for appointment:', params.appointmentId);
      }

      // Call payment API to create checkout session
      const paymentData = await paymentService.createPayment({
        appointmentId: params.appointmentId,
        voucherCode: voucherApplied ? voucherCode : undefined,
        invoiceRequested: invoiceRequested,
      });

      if (__DEV__) {
        console.log('✅ [PaymentSummary] Payment checkout created:', paymentData);
      }

      // Store payment ID for confirmation later
      if (paymentData.paymentId) {
        setPaymentId(paymentData.paymentId);
      }

      // Open payment modal with checkout URL
      setCheckoutUrl(paymentData.checkoutUrl);
      setShowPaymentModal(true);

    } catch (error: any) {
      console.error('❌ [PaymentSummary] Error creating payment:', error);
      
      const errorMessage = error?.message || 'Không thể tạo phiên thanh toán. Vui lòng thử lại.';
      showNotification('error', 'Lỗi thanh toán', errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle manual payment confirmation
  const handleManualPaymentConfirm = async () => {
    setShowPaymentModal(false);
    setProcessingPayment(false);
    
    showNotification(
      'success',
      'Cảm ơn bạn!',
      'Đang xác nhận thanh toán...'
    );

    // Confirm payment with backend
    if (paymentId) {
      try {
        if (__DEV__) {
          console.log('💳 [PaymentSummary] Confirming payment:', paymentId);
        }
        await paymentService.confirmPayment(paymentId);
        if (__DEV__) {
          console.log('✅ [PaymentSummary] Payment confirmed successfully');
        }
      } catch (error) {
        console.error('❌ [PaymentSummary] Error confirming payment:', error);
        // Continue to success page even if confirmation fails (SignalR will handle)
      }
    }

    // Navigate to success page
    setTimeout(() => {
      router.push({
        pathname: '/customer/payment-success',
        params: {
          appointmentId: params.appointmentId,
          amount: params.finalPrice,
          orderId: params.appointmentId,
          serviceName: params.serviceName,
          technicianName: params.technicianName,
          providerId: providerId || '',
        },
      });
    }, 1000);
  };

  // Handle WebView navigation state changes
  const handleWebViewNavigationStateChange = async (navState: any) => {
    const { url } = navState;

    if (__DEV__) {
      console.log('📱 [PaymentSummary] WebView URL changed:', url);
    }

    // Check for PayOS success URL patterns
    // PayOS redirects to: http://ezyfix.site/payment/success or https://pay.payos.vn/.../success/
    if (
      url.includes('ezyfix.site/payment/success') || 
      url.includes('/success/') ||
      url.includes('/success')
    ) {
      if (__DEV__) {
        console.log('✅ [PaymentSummary] Payment success detected from URL');
      }

      // Close WebView
      setShowPaymentModal(false);
      setProcessingPayment(false);

      // Show success notification briefly
      showNotification(
        'success',
        'Thanh toán thành công!',
        'Đang xác nhận với hệ thống...'
      );

      // Confirm payment with backend
      if (paymentId) {
        try {
          if (__DEV__) {
            console.log('💳 [PaymentSummary] Confirming payment after URL success:', paymentId);
          }
          await paymentService.confirmPayment(paymentId);
          if (__DEV__) {
            console.log('✅ [PaymentSummary] Payment confirmed successfully');
          }
        } catch (error) {
          console.error('❌ [PaymentSummary] Error confirming payment:', error);
          // Continue to success page even if confirmation fails (SignalR will handle)
        }
      }

      // Close notification and navigate to success page
      setTimeout(() => {
        setShowNotificationModal(false); // Close notification before navigating
        router.push({
          pathname: '/customer/payment-success',
          params: {
            appointmentId: params.appointmentId,
            amount: params.finalPrice,
            orderId: params.appointmentId,
            serviceName: params.serviceName,
            technicianName: params.technicianName,
          },
        });
      }, 2000);

      return;
    }

    // Check for failure/cancel URL patterns
    // PayOS redirects to: http://ezyfix.site/payment/failed or /cancel
    if (
      url.includes('ezyfix.site/payment/cancel') ||
      url.includes('ezyfix.site/payment/failed') ||
      url.includes('/cancel/') ||
      url.includes('/cancel')
    ) {
      if (__DEV__) {
        console.log('❌ [PaymentSummary] Payment failed/cancelled detected from URL');
      }

      // Close WebView
      setShowPaymentModal(false);

      // Show failure notification
      showNotification(
        'error',
        'Thanh toán không thành công',
        'Thanh toán của bạn đã bị hủy hoặc không thành công. Vui lòng thử lại.'
      );

      setProcessingPayment(false);
    }
  };

  // Subscribe to SignalR payment updates
  // Fetch providerId (technicianId) from appointment
  useEffect(() => {
    const fetchProviderId = async () => {
      if (!params.appointmentId) return;
      
      try {
        const appointment = await appointmentsService.getAppointment(params.appointmentId);
        if (appointment.technicianId) {
          setProviderId(appointment.technicianId);
          console.log('✅ [PaymentSummary] ProviderId (technicianId) loaded:', appointment.technicianId);
        }
      } catch (error) {
        console.error('❌ [PaymentSummary] Error fetching providerId:', error);
      }
    };
    
    fetchProviderId();
  }, [params.appointmentId]);

  useEffect(() => {
    if (!params.appointmentId) return;

    const handlePaymentUpdate = async (payload: PaymentUpdatePayload) => {
      if (payload.appointmentId === params.appointmentId) {
        if (__DEV__) {
          console.log('💰 [PaymentSummary] Payment update received via SignalR:', payload);
        }

        // Confirm payment with backend if we have paymentId
        if (paymentId) {
          try {
            if (__DEV__) {
              console.log('💳 [PaymentSummary] Confirming payment via SignalR:', paymentId);
            }
            await paymentService.confirmPayment(paymentId);
            if (__DEV__) {
              console.log('✅ [PaymentSummary] Payment confirmed successfully via SignalR');
            }
          } catch (error) {
            console.error('❌ [PaymentSummary] Error confirming payment via SignalR:', error);
            // Continue anyway as SignalR already confirmed the payment
          }
        }

        // Close modal if open
        setShowPaymentModal(false);
        setProcessingPayment(false);

        // Navigate to payment success screen with order details
        router.push({
          pathname: '/customer/payment-success',
          params: {
            appointmentId: params.appointmentId,
            amount: payload.amount.toString(),
            orderId: payload.appointmentId,
            serviceName: params.serviceName,
            technicianName: params.technicianName,
            providerId: providerId || '',
          },
        });
      }
    };

    const unsubscribe = paymentHub.subscribe(handlePaymentUpdate);

    return () => {
      unsubscribe();
    };
  }, [params.appointmentId, paymentId]);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />
      <StatusBar barStyle="light-content" backgroundColor="#609CEF" />

      {/* Custom Header */}
      <View style={styles.customHeaderWrapper}>
        <LinearGradient
          colors={['#609CEF', '#3B82F6']}
          style={styles.customHeaderGradient}
        >
          <View style={styles.customHeaderContent}>
            <TouchableOpacity
              style={styles.customBackButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.customHeaderTitleContainer}>
              <Text style={styles.customHeaderTitle}>Xác nhận thanh toán</Text>
              <Text style={styles.customHeaderSubtitle}>Kiểm tra thông tin đơn hàng</Text>
            </View>

            {/* Placeholder to center title */}
            <View style={{ width: 44 }} />
          </View>
        </LinearGradient>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Service Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="construct" size={20} color="#609CEF" />
            <Text style={styles.cardTitle}>Thông tin dịch vụ</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dịch vụ:</Text>
            <Text style={styles.infoValue}>{params.serviceName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Thợ sửa chữa:</Text>
            <Text style={styles.infoValue}>{params.technicianName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Địa chỉ:</Text>
            <Text style={styles.infoValueAddress}>{params.address}</Text>
          </View>
        </View>

        {/* Voucher Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="pricetag" size={20} color="#F59E0B" />
            <Text style={styles.cardTitle}>Mã giảm giá</Text>
            <View style={styles.optionalBadge}>
              <Text style={styles.optionalText}>Tùy chọn</Text>
            </View>
          </View>

          {!voucherApplied ? (
            <View style={styles.voucherInputContainer}>
              <TextInput
                style={styles.voucherInput}
                placeholder="Nhập mã voucher (nếu có)"
                placeholderTextColor="#9CA3AF"
                value={voucherCode}
                onChangeText={setVoucherCode}
                autoCapitalize="characters"
                editable={!applyingVoucher}
              />
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  (!voucherCode.trim() || applyingVoucher) && styles.applyButtonDisabled
                ]}
                onPress={handleApplyVoucher}
                disabled={!voucherCode.trim() || applyingVoucher}
              >
                {applyingVoucher ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.applyButtonText}>Áp dụng</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.voucherAppliedContainer}>
              <View style={styles.voucherAppliedLeft}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <View>
                  <Text style={styles.voucherAppliedCode}>{voucherCode}</Text>
                  <Text style={styles.voucherAppliedDiscount}>
                    Giảm {formatMoney(voucherDiscount)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleRemoveVoucher}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Invoice Option */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.invoiceOption}
            onPress={() => setInvoiceRequested(!invoiceRequested)}
            activeOpacity={0.7}
          >
            <View style={styles.invoiceLeft}>
              <Ionicons name="document-text-outline" size={20} color="#609CEF" />
              <View style={styles.invoiceTextContainer}>
                <Text style={styles.invoiceTitle}>Yêu cầu hóa đơn VAT</Text>
                <Text style={styles.invoiceSubtitle}>Hóa đơn điện tử sẽ được gửi qua email</Text>
              </View>
            </View>
            <View style={[styles.checkbox, invoiceRequested && styles.checkboxChecked]}>
              {invoiceRequested && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Payment Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Tổng thanh toán</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Giá dịch vụ</Text>
            <Text style={styles.summaryValue}>{formatMoney(finalPrice)}</Text>
          </View>

          {voucherApplied && voucherDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#10B981' }]}>Giảm giá</Text>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                -{formatMoney(voucherDiscount)}
              </Text>
            </View>
          )}

          <View style={styles.summaryDivider} />

          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Tổng cộng</Text>
            <Text style={styles.summaryTotalValue}>{formatMoney(totalAmount)}</Text>
          </View>
        </View>

        {/* Payment Methods Info */}
        <View style={styles.paymentMethodsCard}>
          <Text style={styles.paymentMethodsTitle}>Phương thức thanh toán</Text>
          <View style={styles.paymentMethodContainer}>
            <Image
              source={require('../../assets/vnpaylogo.jpg')}
              style={styles.vnpayLogo}
              resizeMode="contain"
            />
            <View style={styles.paymentMethodInfo}>
              <Text style={styles.paymentMethodName}>VNPay</Text>
              <Text style={styles.paymentMethodDesc}>Ví điện tử, thẻ ATM, thẻ tín dụng</Text>
            </View>
          </View>
          <View style={styles.securityNote}>
            <Ionicons name="shield-checkmark" size={14} color="#10B981" />
            <Text style={styles.securityNoteText}>Thanh toán bảo mật qua PayOS - VNPay</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Payment Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.proceedButton}
          onPress={handleProceedToPayment}
          activeOpacity={0.8}
          disabled={processingPayment}
        >
          <LinearGradient
            colors={processingPayment ? ['#9CA3AF', '#6B7280'] : ['#609CEF', '#3B82F6']}
            style={styles.proceedButtonGradient}
          >
            {processingPayment ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.proceedButtonText}>Đang xử lý...</Text>
              </>
            ) : (
              <>
                <Ionicons name="card-outline" size={22} color="#FFFFFF" />
                <Text style={styles.proceedButtonText}>Tiến hành thanh toán</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Payment WebView Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowPaymentModal(false);
          setProcessingPayment(false);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Thanh toán</Text>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Hủy thanh toán?',
                  'Bạn có chắc muốn hủy giao dịch này?',
                  [
                    { text: 'Tiếp tục thanh toán', style: 'cancel' },
                    {
                      text: 'Hủy',
                      style: 'destructive',
                      onPress: () => {
                        setShowPaymentModal(false);
                        setProcessingPayment(false);
                      },
                    },
                  ]
                );
              }}
            >
              <Ionicons name="close" size={28} color="#1F2937" />
            </TouchableOpacity>
          </View>
          <WebView
            source={{ uri: checkoutUrl }}
            onNavigationStateChange={handleWebViewNavigationStateChange}
            style={styles.webview}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="large" color="#609CEF" />
                <Text style={styles.webviewLoadingText}>Đang tải trang thanh toán...</Text>
              </View>
            )}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              if (__DEV__) {
                console.warn('WebView error:', nativeEvent);
              }
            }}
          />
          
          {/* Manual Payment Confirmation Button - HIDDEN (No payment verification API yet) */}
          {/* TODO: Re-enable when payment verification API is available */}
          {false && (
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.manualConfirmButton}
                onPress={handleManualPaymentConfirm}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.manualConfirmGradient}
                >
                  <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                  <Text style={styles.manualConfirmText}>Tôi đã thanh toán</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.manualConfirmHint}>
                Nhấn nút này nếu bạn đã hoàn tất thanh toán
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Custom Notification Modal */}
      <Modal
        visible={showNotificationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <TouchableOpacity
          style={styles.notificationOverlay}
          activeOpacity={1}
          onPress={() => setShowNotificationModal(false)}
        >
          <View style={styles.notificationContainer}>
            <View
              style={[
                styles.notificationCard,
                notificationConfig.type === 'success' && styles.notificationSuccess,
                notificationConfig.type === 'error' && styles.notificationError,
                notificationConfig.type === 'info' && styles.notificationInfo,
                notificationConfig.type === 'warning' && styles.notificationWarning,
              ]}
            >
              <View style={styles.notificationIconContainer}>
                <Ionicons
                  name={notificationConfig.icon}
                  size={48}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.notificationTitle}>{notificationConfig.title}</Text>
              <Text style={styles.notificationMessage}>{notificationConfig.message}</Text>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => setShowNotificationModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.notificationButtonText}>Đã hiểu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  customHeaderWrapper: {
    zIndex: 1000,
  },
  customHeaderGradient: {
    paddingTop: Platform.OS === 'ios' ? 54 : 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  customHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customBackButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  customHeaderTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  customHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  customHeaderSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.2,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  optionalBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  optionalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    width: 120,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  infoValueAddress: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 20,
  },
  voucherInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  voucherInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  applyButton: {
    backgroundColor: '#609CEF',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  voucherAppliedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  voucherAppliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voucherAppliedCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  voucherAppliedDiscount: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
  },
  invoiceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  invoiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  invoiceTextContainer: {
    flex: 1,
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  invoiceSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#609CEF',
    borderColor: '#609CEF',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#609CEF',
  },
  paymentMethodsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 100,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentMethodsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  vnpayLogo: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  paymentMethodDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  securityNoteText: {
    fontSize: 12,
    color: '#6B7280',
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
  proceedButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  proceedButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  webviewLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  modalFooter: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  manualConfirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  manualConfirmGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  manualConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  manualConfirmHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Custom Notification Modal
  notificationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notificationContainer: {
    width: '100%',
    maxWidth: 340,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  notificationSuccess: {
    borderTopWidth: 4,
    borderTopColor: '#10B981',
  },
  notificationError: {
    borderTopWidth: 4,
    borderTopColor: '#EF4444',
  },
  notificationInfo: {
    borderTopWidth: 4,
    borderTopColor: '#3B82F6',
  },
  notificationWarning: {
    borderTopWidth: 4,
    borderTopColor: '#F59E0B',
  },
  notificationIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#10B981',
  },
  notificationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  notificationButton: {
    backgroundColor: '#609CEF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
  },
  notificationButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default withCustomerAuth(PaymentSummary);
