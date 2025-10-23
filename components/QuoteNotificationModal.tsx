import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { serviceDeliveryOffersService } from '../lib/api';

interface QuoteNotificationModalProps {
  visible: boolean;
  onClose: () => void;
  quote: {
    offerID: string;
    serviceName: string;
    technicianName: string;
    estimatedCost?: number;
    finalCost?: number;
    notes?: string;
    serviceRequestId: string;
  };
  onAccepted?: () => void;
  onRejected?: () => void;
}

export default function QuoteNotificationModal({
  visible,
  onClose,
  quote,
  onAccepted,
  onRejected,
}: QuoteNotificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);

  const isEstimated = !!quote.estimatedCost;
  const amount = quote.estimatedCost || quote.finalCost || 0;
  const quoteType = isEstimated ? 'Báo giá dự kiến' : 'Báo giá chốt';

  const formatCurrency = (value: number) => {
    return value.toLocaleString('vi-VN') + ' VNĐ';
  };

  const handleAccept = async () => {
    Alert.alert(
      'Xác nhận chấp nhận',
      `Bạn có chắc chắn chấp nhận ${quoteType.toLowerCase()} với giá ${formatCurrency(amount)}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Chấp nhận',
          onPress: async () => {
            setActionType('accept');
            setLoading(true);
            try {
              await serviceDeliveryOffersService.acceptQuote(quote.offerID);
              
              setLoading(false);
              Alert.alert(
                '✅ Chấp nhận thành công!',
                'Bạn đã chấp nhận báo giá. Thợ sẽ nhận được thông báo và bắt đầu chuẩn bị.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      onClose();
                      onAccepted?.();
                    }
                  }
                ]
              );
            } catch (error: any) {
              setLoading(false);
              Alert.alert(
                'Lỗi',
                error.message || 'Không thể chấp nhận báo giá. Vui lòng thử lại.',
                [{ text: 'Đóng' }]
              );
            }
          }
        }
      ]
    );
  };

  const handleReject = async () => {
    Alert.alert(
      'Xác nhận từ chối',
      'Bạn có chắc chắn từ chối báo giá này? Thợ sẽ nhận được thông báo.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: async () => {
            setActionType('reject');
            setLoading(true);
            try {
              await serviceDeliveryOffersService.rejectQuote(quote.offerID);
              
              setLoading(false);
              Alert.alert(
                'Đã từ chối báo giá',
                'Bạn có thể chờ thợ gửi báo giá mới hoặc chọn thợ khác.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      onClose();
                      onRejected?.();
                    }
                  }
                ]
              );
            } catch (error: any) {
              setLoading(false);
              Alert.alert(
                'Lỗi',
                error.message || 'Không thể từ chối báo giá. Vui lòng thử lại.',
                [{ text: 'Đóng' }]
              );
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons 
                name={isEstimated ? "calculator" : "checkmark-circle"} 
                size={32} 
                color={isEstimated ? "#609CEF" : "#10B981"} 
              />
            </View>
            <Text style={styles.title}>Báo giá mới từ thợ</Text>
            <Text style={styles.subtitle}>{quote.technicianName}</Text>
          </View>

          {/* Quote Type Badge */}
          <View style={[
            styles.quoteTypeBadge,
            { backgroundColor: isEstimated ? '#EBF4FF' : '#ECFDF5' }
          ]}>
            <Text style={[
              styles.quoteTypeText,
              { color: isEstimated ? '#609CEF' : '#10B981' }
            ]}>
              {quoteType}
            </Text>
          </View>

          {/* Service Info */}
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceLabel}>Dịch vụ</Text>
            <Text style={styles.serviceName}>{quote.serviceName}</Text>
          </View>

          {/* Amount Display */}
          <View style={[
            styles.amountContainer,
            { backgroundColor: isEstimated ? '#F0F9FF' : '#F0FDF4' }
          ]}>
            <Text style={styles.amountLabel}>Số tiền báo giá</Text>
            <Text style={[
              styles.amount,
              { color: isEstimated ? '#609CEF' : '#10B981' }
            ]}>
              {formatCurrency(amount)}
            </Text>
          </View>

          {/* Notes for Estimated Quote */}
          {isEstimated && quote.notes && (
            <View style={styles.notesContainer}>
              <View style={styles.notesHeader}>
                <Ionicons name="information-circle-outline" size={18} color="#F59E0B" />
                <Text style={styles.notesLabel}>Ghi chú quan trọng</Text>
              </View>
              <Text style={styles.notesText}>{quote.notes}</Text>
            </View>
          )}

          {/* Warning for Estimated */}
          {isEstimated && (
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle-outline" size={16} color="#F59E0B" />
              <Text style={styles.warningText}>
                Giá có thể thay đổi sau khi thợ kiểm tra thiết bị trực tiếp
              </Text>
            </View>
          )}

          {/* Final Quote Info */}
          {!isEstimated && (
            <View style={styles.infoBox}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#10B981" />
              <Text style={styles.infoText}>
                Giá cố định - Không thay đổi
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={handleReject}
              disabled={loading}
            >
              <Text style={styles.rejectButtonText}>Từ chối</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
              disabled={loading}
            >
              <LinearGradient
                colors={isEstimated ? ['#609CEF', '#3B82F6'] : ['#10B981', '#059669']}
                style={styles.acceptGradient}
              >
                {loading && actionType === 'accept' ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    <Text style={styles.acceptButtonText}>Chấp nhận</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.closeButtonText}>Xem sau</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  quoteTypeBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  quoteTypeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  serviceInfo: {
    marginBottom: 16,
  },
  serviceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  amountContainer: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: '900',
  },
  notesContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  notesText: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    flex: 1,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  rejectButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  acceptButton: {
    flex: 1,
    borderRadius: 12,
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
    paddingVertical: 16,
    gap: 6,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
});
