/**
 * VoucherSelectionModal Component
 * Displays eligible vouchers for selection
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { voucherService } from '../lib/api/vouchers';
import type { Voucher } from '../types/api';

interface VoucherSelectionModalProps {
  visible: boolean;
  appointmentId: string;
  onClose: () => void;
  onSelectVoucher: (voucher: Voucher) => void;
  orderAmount: number;
}

export default function VoucherSelectionModal({
  visible,
  appointmentId,
  onClose,
  onSelectVoucher,
  orderAmount,
}: VoucherSelectionModalProps) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(null);

  // Format tiền VND
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Load eligible vouchers
  const loadVouchers = async () => {
    if (!appointmentId) {
      console.log('⚠️ [VoucherModal] No appointmentId provided');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🎟️ [VoucherModal] Loading vouchers for appointment:', appointmentId);
      const data = await voucherService.getEligibleVouchers(appointmentId);
      console.log('📋 [VoucherModal] Received data:', JSON.stringify(data, null, 2));
      console.log('🎫 [VoucherModal] Vouchers array:', data.vouchers);
      console.log('🔢 [VoucherModal] Vouchers count:', data.vouchers?.length || 0);
      
      const voucherList = data.vouchers || [];
      setVouchers(voucherList);

      if (voucherList.length === 0) {
        console.log('⚠️ [VoucherModal] No vouchers available');
        setError('Không có voucher khả dụng cho đơn hàng này');
      } else {
        console.log('✅ [VoucherModal] Successfully loaded', voucherList.length, 'vouchers');
        setError(null); // Clear any previous error
      }
    } catch (err: any) {
      console.error('❌ [VoucherModal] Error loading vouchers:', err);
      console.error('❌ [VoucherModal] Error details:', err?.message, err?.status_code);
      setError(err?.message || 'Không thể tải danh sách voucher');
      setVouchers([]); // Clear vouchers on error
    } finally {
      setLoading(false);
    }
  };

  // Load vouchers when modal opens
  useEffect(() => {
    if (visible) {
      loadVouchers();
      setSelectedVoucherId(null);
    }
  }, [visible, appointmentId]);

  // Handle voucher selection
  const handleSelectVoucher = (voucher: Voucher) => {
    // Check if voucher still has remaining uses
    if (voucher.remainingPerUserCount === 0) {
      console.log('⚠️ [VoucherModal] Voucher has no remaining uses:', voucher.voucherCode);
      return; // Don't allow selection
    }
    setSelectedVoucherId(voucher.voucherId);
  };

  // Handle apply voucher
  const handleApplyVoucher = () => {
    const selectedVoucher = vouchers.find(v => v.voucherId === selectedVoucherId);
    if (selectedVoucher) {
      onSelectVoucher(selectedVoucher);
      onClose();
    }
  };

  // Get discount display text
  const getDiscountText = (voucher: Voucher) => {
    if (voucher.discountType === 'PERCENTAGE') {
      return `Giảm ${voucher.discountValue}%`;
    }
    return `Giảm ${formatMoney(voucher.discountValue)}`;
  };

  // Get saving amount text
  const getSavingText = (voucher: Voucher) => {
    const saving = voucher.previewDiscountAmount;
    return `Tiết kiệm ${formatMoney(saving)}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="pricetag" size={24} color="#FF6B35" />
              <Text style={styles.headerTitle}>Chọn Voucher</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Order Amount */}
          <View style={styles.orderAmountContainer}>
            <Text style={styles.orderAmountLabel}>Tổng giá trị đơn hàng:</Text>
            <Text style={styles.orderAmountValue}>{formatMoney(orderAmount)}</Text>
          </View>

          {/* Content */}
          {(() => {
            console.log('🎨 [VoucherModal] RENDER STATE:', {
              loading,
              vouchersLength: vouchers.length,
              hasError: !!error,
              error: error,
              firstVoucher: vouchers[0]?.voucherCode
            });
            return null;
          })()}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#609CEF" />
              <Text style={styles.loadingText}>Đang tải voucher...</Text>
            </View>
          ) : vouchers.length > 0 ? (
            <View style={{ flex: 1 }}>
              <ScrollView style={styles.voucherList} showsVerticalScrollIndicator={false}>
                {vouchers.map((voucher) => {
                  const isOutOfStock = voucher.remainingPerUserCount === 0;
                  return (
                  <TouchableOpacity
                    key={voucher.voucherId}
                    style={styles.voucherCardContainer}
                    onPress={() => handleSelectVoucher(voucher)}
                    activeOpacity={isOutOfStock ? 1 : 0.7}
                    disabled={isOutOfStock}
                  >
                    <LinearGradient
                      colors={
                        isOutOfStock
                          ? ['#F3F4F6', '#E5E7EB']
                          : selectedVoucherId === voucher.voucherId
                          ? ['#10B981', '#059669']
                          : ['#FFFFFF', '#F9FAFB']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.voucherCard,
                        selectedVoucherId === voucher.voucherId && styles.voucherCardSelected,
                        isOutOfStock && styles.voucherCardDisabled,
                      ]}
                    >
                      {isOutOfStock && (
                        <View style={styles.outOfStockBadge}>
                          <Text style={styles.outOfStockText}>Hết lượt</Text>
                        </View>
                      )}
                      {/* Voucher Left Side - Discount Badge */}
                      <View style={styles.voucherLeft}>
                        <LinearGradient
                          colors={['#609CEF', '#4F8BE8']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.discountBadge}
                        >
                          <View style={styles.discountContent}>
                            <Ionicons name="pricetag" size={24} color="#FFFFFF" />
                            <Text style={styles.discountText}>{getDiscountText(voucher)}</Text>
                          </View>
                        </LinearGradient>
                        <Text style={[
                          styles.savingText,
                          selectedVoucherId === voucher.voucherId && styles.savingTextSelected
                        ]}>
                          {getSavingText(voucher)}
                        </Text>
                      </View>

                    {/* Voucher Right Side - Details */}
                    <View style={styles.voucherRight}>
                      <View style={styles.voucherHeader}>
                        <Text style={[
                          styles.voucherCode,
                          selectedVoucherId === voucher.voucherId && styles.voucherCodeSelected
                        ]}>
                          {voucher.voucherCode}
                        </Text>
                        {selectedVoucherId === voucher.voucherId && (
                          <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                        )}
                      </View>
                      
                      <Text 
                        style={[
                          styles.voucherDescription,
                          selectedVoucherId === voucher.voucherId && styles.voucherDescriptionSelected
                        ]} 
                        numberOfLines={2}
                      >
                        {voucher.voucherDescription}
                      </Text>
                      
                      <View style={styles.voucherFooter}>
                        <View style={styles.voucherInfo}>
                          <Ionicons 
                            name="calendar-outline" 
                            size={14} 
                            color={selectedVoucherId === voucher.voucherId ? "#F3F4F6" : "#6B7280"} 
                          />
                          <Text style={[
                            styles.voucherInfoText,
                            selectedVoucherId === voucher.voucherId && styles.voucherInfoTextSelected
                          ]}>
                            HSD: {formatDate(voucher.validTo)}
                          </Text>
                        </View>
                        
                        <View style={styles.voucherInfo}>
                          <Ionicons 
                            name="cart-outline" 
                            size={14} 
                            color={selectedVoucherId === voucher.voucherId ? "#F3F4F6" : "#6B7280"} 
                          />
                          <Text style={[
                            styles.voucherInfoText,
                            selectedVoucherId === voucher.voucherId && styles.voucherInfoTextSelected
                          ]}>
                            Đơn tối thiểu: {formatMoney(voucher.minimumOrderAmount)}
                          </Text>
                        </View>

                        {/* Remaining uses */}
                        <View style={styles.voucherInfo}>
                          <Ionicons 
                            name="ticket-outline" 
                            size={14} 
                            color={selectedVoucherId === voucher.voucherId ? "#F3F4F6" : "#6B7280"} 
                          />
                          <Text style={[
                            styles.voucherInfoText,
                            selectedVoucherId === voucher.voucherId && styles.voucherInfoTextSelected,
                            voucher.remainingPerUserCount === 0 && styles.voucherInfoTextDanger
                          ]}>
                            Còn lại: {voucher.remainingPerUserCount} lượt
                          </Text>
                        </View>
                      </View>

                      {/* Additional Info */}
                        <View style={styles.additionalInfo}>
                          {voucher.discountCapped && (
                            <Text style={[
                              styles.additionalInfoText,
                              selectedVoucherId === voucher.voucherId && styles.additionalInfoTextSelected
                            ]}>
                              Giảm tối đa: {formatMoney(voucher.maxDiscountAmount)}
                            </Text>
                          )}
                          {voucher.remainingPerUserCount > 0 && (
                            <Text style={[
                              styles.additionalInfoText,
                              selectedVoucherId === voucher.voucherId && styles.additionalInfoTextSelected
                            ]}>
                              Còn lại: {voucher.remainingPerUserCount} lượt
                            </Text>
                          )}
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Footer - Apply Button */}
              <View style={styles.footer}>
                <TouchableOpacity
                  onPress={handleApplyVoucher}
                  disabled={!selectedVoucherId}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={!selectedVoucherId ? ['#D1D5DB', '#9CA3AF'] : ['#609CEF', '#4F8BE8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.applyButton}
                  >
                    <Text style={styles.applyButtonText}>Áp dụng Voucher</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#EF4444" />
              <Text style={styles.errorText}>{error || 'Không có voucher khả dụng'}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={loadVouchers}>
                <Text style={styles.retryButtonText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  orderAmountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  orderAmountLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  orderAmountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#609CEF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#609CEF',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  voucherList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  voucherCardContainer: {
    marginBottom: 16,
  },
  voucherCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  voucherCardSelected: {
    borderColor: '#10B981',
    borderWidth: 3,
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
    elevation: 8,
  },
  voucherCardDisabled: {
    opacity: 0.6,
    borderColor: '#D1D5DB',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  outOfStockText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  voucherLeft: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 2,
    borderRightColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
    paddingRight: 16,
  },
  discountBadge: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#609CEF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  discountContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  discountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  savingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
    textAlign: 'center',
  },
  savingTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  voucherRight: {
    flex: 1,
    paddingLeft: 16,
  },
  voucherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  voucherCode: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  voucherCodeSelected: {
    color: '#FFFFFF',
  },
  selectedBadge: {
    marginLeft: 8,
  },
  voucherDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  voucherDescriptionSelected: {
    color: '#F3F4F6',
  },
  voucherFooter: {
    gap: 6,
    marginBottom: 8,
  },
  voucherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voucherInfoText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  voucherInfoTextSelected: {
    color: '#F3F4F6',
    fontWeight: '600',
  },
  voucherInfoTextDanger: {
    color: '#EF4444',
    fontWeight: '700',
  },
  additionalInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  additionalInfoText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  additionalInfoTextSelected: {
    color: '#F3F4F6',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  applyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
