/**
 * Promotion Vouchers Section Component
 * Premium design with app theme colors
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Clipboard,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { voucherService } from '../lib/api/vouchers';
import type { VoucherItem } from '../types/api';
import { useAuth } from '../store/authStore';

const { width } = Dimensions.get('window');

export default function PromotionVouchersSection() {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedVoucher, setExpandedVoucher] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState('');
  const toastAnim = useRef(new Animated.Value(0)).current;
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Only load vouchers for authenticated CUSTOMERS
    if (isAuthenticated && user?.userType === 'customer') {
      loadVouchers();
    }
  }, [isAuthenticated, user?.userType]);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Voucher fetch timeout')), 10000) // 10s timeout
      );
      
      const voucherPromise = voucherService.getAllVouchers(1, 20);
      const response = await Promise.race([voucherPromise, timeoutPromise]);
      
      setVouchers(response.items);
      if (__DEV__) console.log('✅ [PromotionVouchers] Loaded vouchers:', response.items.length);
    } catch (error: any) {
      if (__DEV__) console.error('❌ [PromotionVouchers] Error loading vouchers:', error?.message || error);
      // Set empty array on error so UI can show empty state instead of infinite loading
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  const copyVoucherCode = (code: string, voucherId: string) => {
    Clipboard.setString(code);
    setCopiedCode(code);
    setToastVisible(voucherId);
    
    // Animate toast in from bottom
    Animated.sequence([
      Animated.spring(toastAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
      Animated.delay(2000),
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastVisible(null);
    });
  };

  const toggleExpand = (voucherId: string) => {
    setExpandedVoucher(expandedVoucher === voucherId ? null : voucherId);
  };

  const getDiscountBadgeColor = (discountType: string): [string, string] => {
    switch (discountType) {
      case 'FREE_CHECKING':
        return ['#10b981', '#059669']; // Emerald gradient
      case 'PERCENTAGE':
        return ['#609CEF', '#4A8DD9']; // Primary blue gradient
      case 'FIXED_AMOUNT':
        return ['#F59E0B', '#DC8309']; // Amber gradient
      default:
        return ['#609CEF', '#4A8DD9']; // Primary blue
    }
  };

  // Hide for technicians only
  if (!isAuthenticated || user?.userType === 'technician') {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#609CEF" />
        <Text style={styles.loadingText}>Đang tải voucher...</Text>
      </View>
    );
  }

  if (vouchers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="pricetag-outline" size={48} color="#9CA3AF" />
        <Text style={styles.emptyText}>Chưa có voucher khả dụng</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Khuyến mãi đặc biệt</Text>
        <Text style={styles.headerCount}>({vouchers.length})</Text>
      </View>

      {/* Voucher Cards - Vertical Layout */}
      <View style={styles.voucherList}>
        {vouchers.map((voucher) => (
          <TouchableOpacity
            key={voucher.voucherId}
            style={styles.voucherBanner}
            onPress={() => toggleExpand(voucher.voucherId)}
            activeOpacity={0.95}
          >
            <LinearGradient
              colors={getDiscountBadgeColor(voucher.discountType)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bannerGradient}
            >
              {/* Left Section - Discount */}
              <View style={styles.leftSection}>
                <Text style={styles.discountText}>
                  {voucherService.formatDiscountDisplay(voucher)}
                </Text>
                <Text style={styles.discountLabel}>OFF</Text>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Right Section - Info */}
              <View style={styles.rightSection}>
                <View style={styles.codeRow}>
                  <View style={styles.codeBox}>
                    <Ionicons name="pricetag" size={14} color="#FFFFFF" />
                    <Text style={styles.codeText}>{voucher.voucherCode}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      copyVoucherCode(voucher.voucherCode, voucher.voucherId);
                    }}
                    style={styles.copyIcon}
                  >
                    <Ionicons name="copy-outline" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.bannerDescription} numberOfLines={2}>
                  {voucher.voucherDescription}
                </Text>

                <View style={styles.bannerFooter}>
                  <View style={styles.expiryBadge}>
                    <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.expiryText}>
                      {voucherService.getExpiryStatusText(voucher)}
                    </Text>
                  </View>
                  <Ionicons
                    name={expandedVoucher === voucher.voucherId ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="rgba(255,255,255,0.8)"
                  />
                </View>
              </View>
            </LinearGradient>

            {/* Toast for this voucher */}
            {toastVisible === voucher.voucherId && (
              <Animated.View 
                style={[
                  styles.voucherToast,
                  {
                    opacity: toastAnim,
                    transform: [{
                      translateY: toastAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [10, 0],
                      }),
                    }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.toastGradient}
                >
                  <View style={styles.toastIconWrapper}>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.toastContent}>
                    <Text style={styles.toastTitle}>Đã sao chép!</Text>
                    <Text style={styles.toastMessage}>Mã "{copiedCode}" đã được sao chép</Text>
                  </View>
                </LinearGradient>
              </Animated.View>
            )}

            {/* Expandable Details */}
            {expandedVoucher === voucher.voucherId && (
              <View style={styles.expandedSection}>
                <View style={styles.detailsGrid}>
                  {voucher.minimumOrderAmount > 0 && (
                    <View style={styles.detailCard}>
                      <View style={styles.detailIconWrapper}>
                        <Ionicons name="wallet-outline" size={18} color="#609CEF" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Đơn tối thiểu</Text>
                        <Text style={styles.detailValue}>
                          {new Intl.NumberFormat('vi-VN').format(voucher.minimumOrderAmount)}₫
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  {voucher.maxDiscountAmount > 0 && (
                    <View style={styles.detailCard}>
                      <View style={styles.detailIconWrapper}>
                        <Ionicons name="trending-down-outline" size={18} color="#10B981" />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={styles.detailLabel}>Giảm tối đa</Text>
                        <Text style={styles.detailValue}>
                          {new Intl.NumberFormat('vi-VN').format(voucher.maxDiscountAmount)}₫
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  <View style={styles.detailCard}>
                    <View style={styles.detailIconWrapper}>
                      <Ionicons name="ticket-outline" size={18} color="#F59E0B" />
                    </View>
                    <View style={styles.detailContent}>
                      <View style={styles.remainingHeader}>
                        <Text style={styles.detailLabel}>Còn lại</Text>
                        <Text style={styles.remainingCount}>
                          {voucher.remainingGlobalCount}/{voucher.maxUsageCount}
                        </Text>
                      </View>
                      <View style={styles.progressBarContainer}>
                        <View 
                          style={[
                            styles.progressBar, 
                            { 
                              width: `${(voucher.remainingGlobalCount / voucher.maxUsageCount) * 100}%`,
                              backgroundColor: voucher.remainingGlobalCount / voucher.maxUsageCount > 0.5 
                                ? '#10B981' 
                                : voucher.remainingGlobalCount / voucher.maxUsageCount > 0.2 
                                  ? '#F59E0B' 
                                  : '#EF4444'
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  </View>
                </View>

                {voucher.categoryNames.length > 0 && (
                  <View style={styles.categoryContainer}>
                    <View style={styles.categoryHeader}>
                      <Ionicons name="albums-outline" size={16} color="#6B7280" />
                      <Text style={styles.categoryHeaderText}>Áp dụng cho</Text>
                    </View>
                    <View style={styles.categoryTags}>
                      {voucher.categoryNames.map((category, index) => (
                        <View key={index} style={styles.categoryTag}>
                          <Text style={styles.categoryTagText}>{category}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerCount: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 6,
  },
  
  // Vertical List
  voucherList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  
  // Banner Card
  voucherBanner: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerGradient: {
    flexDirection: 'row',
    padding: 16,
    minHeight: 100,
  },
  
  // Left Section - Discount (30%)
  leftSection: {
    flex: 0.3,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 12,
  },
  discountText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 32,
    textAlign: 'center',
  },
  discountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 2,
    marginTop: 2,
    textAlign: 'center',
  },
  
  // Divider
  divider: {
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
  },
  
  // Right Section - Info (70%)
  rightSection: {
    flex: 0.7,
    justifyContent: 'space-between',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  codeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  copyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    lineHeight: 18,
    marginBottom: 8,
    flexShrink: 1,
  },
  bannerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  expiryText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
  },
  
  // Expandable Details
  expandedSection: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  detailsGrid: {
    gap: 10,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    gap: 12,
  },
  detailIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
  },
  remainingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  remainingCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f2937',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  categoryContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  categoryHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#609CEF',
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  
  // Loading & Empty
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Custom Toast (per voucher)
  voucherToast: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  toastGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  toastIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastContent: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  toastMessage: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
});
