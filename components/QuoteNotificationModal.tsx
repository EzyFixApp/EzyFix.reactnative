import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { serviceDeliveryOffersService } from '../lib/api';

interface QuoteNotificationModalProps {
  visible: boolean;
  onClose: () => void;
  quote: {
    offerID: string;
    serviceName: string;
    technicianName: string;
    technicianId?: string;
    technicianAvatar?: string;
    technicianRating?: number;
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'accept' | 'reject' | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultSuccess, setResultSuccess] = useState(false);
  const [resultMessage, setResultMessage] = useState('');

  const isEstimated = !!quote.estimatedCost;
  const amount = quote.estimatedCost || quote.finalCost || 0;
  const quoteType = isEstimated ? 'Báo giá dự kiến' : 'Báo giá chốt';

  const formatCurrency = (value: number) => {
    return value.toLocaleString('vi-VN') + ' VNĐ';
  };

  const handleAccept = () => {
    setConfirmAction('accept');
    setShowConfirmModal(true);
  };

  const handleReject = () => {
    setConfirmAction('reject');
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    setShowConfirmModal(false);
    setActionType(confirmAction);
    setLoading(true);

    try {
      if (confirmAction === 'accept') {
        await serviceDeliveryOffersService.acceptQuote(quote.offerID);
        setLoading(false);
        setResultSuccess(true);
        setResultMessage('Bạn đã chấp nhận báo giá. Thợ sẽ nhận được thông báo và bắt đầu chuẩn bị.');
        setShowResultModal(true);
      } else if (confirmAction === 'reject') {
        await serviceDeliveryOffersService.rejectQuote(quote.offerID);
        setLoading(false);
        setResultSuccess(true);
        setResultMessage('Bạn có thể chờ thợ gửi báo giá mới hoặc chọn thợ khác.');
        setShowResultModal(true);
      }
    } catch (error: any) {
      setLoading(false);
      setResultSuccess(false);
      setResultMessage(error.message || `Không thể ${confirmAction === 'accept' ? 'chấp nhận' : 'từ chối'} báo giá. Vui lòng thử lại.`);
      setShowResultModal(true);
    }
  };

  const handleResultClose = () => {
    setShowResultModal(false);
    if (resultSuccess) {
      onClose();
      if (confirmAction === 'accept') {
        onAccepted?.();
      } else {
        onRejected?.();
      }
    }
  };

  // Auto-dismiss success modal after 2 seconds
  React.useEffect(() => {
    if (showResultModal && resultSuccess) {
      const timer = setTimeout(() => {
        handleResultClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [showResultModal, resultSuccess]);

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
            <Text style={styles.title}>Báo giá mới từ thợ</Text>
            
            {/* Technician Info with Avatar - Clickable */}
            <TouchableOpacity
              style={styles.technicianInfo}
              onPress={() => {
                if (quote.technicianId) {
                  onClose();
                  router.push(`/customer/technician-profile?technicianId=${quote.technicianId}`);
                }
              }}
              activeOpacity={quote.technicianId ? 0.7 : 1}
              disabled={!quote.technicianId}
            >
              {quote.technicianAvatar ? (
                <Image 
                  source={{ uri: quote.technicianAvatar }} 
                  style={styles.technicianAvatar}
                />
              ) : (
                <View style={styles.technicianAvatarPlaceholder}>
                  <Ionicons name="person" size={24} color="#94A3B8" />
                </View>
              )}
              
              <View style={styles.technicianDetails}>
                <Text style={styles.technicianName}>{quote.technicianName}</Text>
                {quote.technicianRating && (
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <Text style={styles.ratingText}>{quote.technicianRating.toFixed(1)}</Text>
                  </View>
                )}
              </View>
              
              {/* View Profile Icon (visual indicator) */}
              {quote.technicianId && (
                <View style={styles.viewProfileButton}>
                  <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
                </View>
              )}
            </TouchableOpacity>
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

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmContainer}>
            <View style={styles.confirmIconContainer}>
              <Ionicons 
                name={confirmAction === 'accept' ? 'checkmark-circle' : 'close-circle'} 
                size={48} 
                color={confirmAction === 'accept' ? '#10B981' : '#EF4444'} 
              />
            </View>
            
            <Text style={styles.confirmTitle}>
              {confirmAction === 'accept' ? 'Xác nhận chấp nhận' : 'Xác nhận từ chối'}
            </Text>
            
            <Text style={styles.confirmMessage}>
              {confirmAction === 'accept' 
                ? `Bạn có chắc chắn chấp nhận ${quoteType.toLowerCase()} với giá ${formatCurrency(amount)}?`
                : 'Bạn có chắc chắn từ chối báo giá này? Thợ sẽ nhận được thông báo.'
              }
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.confirmCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmOkButton}
                onPress={handleConfirm}
              >
                <LinearGradient
                  colors={confirmAction === 'accept' ? ['#10B981', '#059669'] : ['#EF4444', '#DC2626']}
                  style={styles.confirmOkGradient}
                >
                  <Text style={styles.confirmOkText}>
                    {confirmAction === 'accept' ? 'Chấp nhận' : 'Từ chối'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Result Modal */}
      <Modal
        visible={showResultModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleResultClose}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmContainer}>
            <View style={styles.confirmIconContainer}>
              <Ionicons 
                name={resultSuccess ? 'checkmark-circle' : 'alert-circle'} 
                size={48} 
                color={resultSuccess ? '#10B981' : '#EF4444'} 
              />
            </View>
            
            <Text style={styles.confirmTitle}>
              {resultSuccess 
                ? (confirmAction === 'accept' ? 'Chấp nhận thành công!' : 'Đã từ chối báo giá')
                : 'Lỗi'
              }
            </Text>
            
            <Text style={styles.confirmMessage}>{resultMessage}</Text>

            <TouchableOpacity
              style={[styles.confirmOkButton, { width: '100%' }]}
              onPress={handleResultClose}
            >
              <LinearGradient
                colors={['#609CEF', '#3B82F6']}
                style={styles.confirmOkGradient}
              >
                <Text style={styles.confirmOkText}>OK</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  technicianInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    marginTop: 16,
    gap: 12,
  },
  technicianAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
  },
  technicianAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  technicianDetails: {
    flex: 1,
  },
  technicianName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  viewProfileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
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
  // Custom Modal Styles
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  confirmIconContainer: {
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 15,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  confirmCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmOkButton: {
    flex: 1,
    borderRadius: 12,
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
  confirmOkGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmOkText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
