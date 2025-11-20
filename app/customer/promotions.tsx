import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import withCustomerAuth from '../../lib/auth/withCustomerAuth';
import { voucherService } from '../../lib/api/vouchers';
import type { VoucherItem } from '../../types/api';

interface StatCardProps {
  number: string;
  label: string;
}

function StatCard({ number, label }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

type VoucherStatus = 'available' | 'used' | 'expired';

interface VoucherCardProps {
  discount: string;
  title: string;
  description: string;
  code: string;
  expiryDate: string;
  status: VoucherStatus;
  minimumOrder?: number;
  maxDiscount?: number;
  remainingCount?: number;
  maxCount?: number;
  categories?: string[];
  onUse?: () => void;
}

function VoucherCard({ 
  discount, 
  title, 
  description, 
  code, 
  expiryDate, 
  status, 
  minimumOrder,
  maxDiscount,
  remainingCount,
  maxCount,
  categories,
  onUse 
}: VoucherCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = () => {
    switch (status) {
      case 'available':
        return getDiscountBadgeColor();
      case 'used':
        return ['#6B7280', '#6B7280']; // Gray
      case 'expired':
        return ['#EF4444', '#EF4444']; // Red
      default:
        return ['#6B7280', '#6B7280'];
    }
  };

  const getDiscountBadgeColor = (): [string, string] => {
    // Extract discount type from the discount string or use a prop
    // For now, we'll use a simple heuristic
    if (discount.includes('Free') || discount.includes('Miễn phí')) {
      return ['#10b981', '#059669']; // Emerald gradient
    } else if (discount.includes('%')) {
      return ['#609CEF', '#4A8DD9']; // Primary blue gradient
    } else {
      return ['#F59E0B', '#DC8309']; // Amber gradient
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'available':
        return 'Sử dụng';
      case 'used':
        return 'Đã dùng';
      case 'expired':
        return 'Hết hạn';
      default:
        return 'Không khả dụng';
    }
  };

  const isDisabled = status !== 'available';

  return (
    <TouchableOpacity 
      style={[styles.voucherCard, isDisabled && styles.disabledCard]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={
          isDisabled 
            ? ['#9CA3AF', '#6B7280']
            : getStatusColor()
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bannerGradient}
      >
        {/* Left Section - Discount */}
        <View style={styles.leftSection}>
          <Text style={styles.discountText}>{discount}</Text>
          <Text style={styles.discountLabel}>OFF</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Right Section - Info */}
        <View style={styles.rightSection}>
          <Text style={[styles.voucherTitle, isDisabled && styles.disabledText]}>
            {title}
          </Text>
          
          {/* Code Row with Copy Button */}
          <View style={styles.codeRow}>
            <View style={styles.codeBox}>
              <Ionicons name="pricetag" size={14} color="rgba(255,255,255,0.9)" />
              <Text style={[styles.voucherCode, isDisabled && styles.disabledText]}>
                {code}
              </Text>
            </View>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onUse?.();
              }}
              disabled={isDisabled}
              style={[styles.copyButton, isDisabled && styles.disabledButton]}
              activeOpacity={0.7}
            >
              <Ionicons name="copy-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.voucherDescription, isDisabled && styles.disabledText]}>
            {description}
          </Text>
          
          <View style={styles.bannerFooter}>
            <View style={styles.expiryBadge}>
              <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.9)" />
              <Text style={[styles.expiryText, isDisabled && styles.disabledText]}>
                {expiryDate}
              </Text>
            </View>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="rgba(255,255,255,0.8)"
            />
          </View>
        </View>
      </LinearGradient>

      {/* Expandable Details */}
      {expanded && (
        <View style={styles.expandedDetails}>
          {minimumOrder != null && minimumOrder > 0 && (
            <View style={styles.detailCard}>
              <View style={styles.detailIconWrapper}>
                <Ionicons name="wallet-outline" size={16} color="#609CEF" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Đơn tối thiểu</Text>
                <Text style={styles.detailValue}>
                  {new Intl.NumberFormat('vi-VN').format(minimumOrder)}₫
                </Text>
              </View>
            </View>
          )}

          {maxDiscount != null && maxDiscount > 0 && (
            <View style={styles.detailCard}>
              <View style={styles.detailIconWrapper}>
                <Ionicons name="trending-down-outline" size={16} color="#10B981" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Giảm tối đa</Text>
                <Text style={styles.detailValue}>
                  {new Intl.NumberFormat('vi-VN').format(maxDiscount)}₫
                </Text>
              </View>
            </View>
          )}

          {remainingCount != null && maxCount != null && maxCount > 0 && (
            <View style={styles.detailCard}>
              <View style={styles.detailIconWrapper}>
                <Ionicons name="ticket-outline" size={16} color="#F59E0B" />
              </View>
              <View style={styles.detailContent}>
                <View style={styles.remainingHeader}>
                  <Text style={styles.detailLabel}>Còn lại</Text>
                  <Text style={styles.remainingCount}>
                    {String(remainingCount)}/{String(maxCount)}
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar,
                      {
                        width: `${Math.min(100, Math.max(0, (remainingCount / maxCount) * 100))}%`,
                        backgroundColor: (remainingCount / maxCount) > 0.5 
                          ? '#10B981' 
                          : (remainingCount / maxCount) > 0.2 
                            ? '#F59E0B' 
                            : '#EF4444'
                      }
                    ]}
                  />
                </View>
              </View>
            </View>
          )}

          {Array.isArray(categories) && categories.length > 0 && (
            <View style={styles.categoryContainer}>
              <View style={styles.categoryHeader}>
                <Ionicons name="albums-outline" size={14} color="#6B7280" />
                <Text style={styles.categoryHeaderText}>Áp dụng cho</Text>
              </View>
              <View style={styles.categoryTags}>
                {categories.map((cat, idx) => (
                  <View key={idx} style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{cat || ''}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function Promotions() {
  const [activeTab, setActiveTab] = useState<'available' | 'used' | 'expired'>('available');
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      const response = await voucherService.getAllVouchers(1, 50);
      setVouchers(response.items);
      if (__DEV__) console.log('✅ [Promotions] Loaded vouchers:', response.items.length);
    } catch (error) {
      console.error('❌ [Promotions] Error loading vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVoucherStatus = (voucher: VoucherItem): VoucherStatus => {
    // Check if expired
    const now = new Date();
    const validTo = new Date(voucher.validTo);
    if (validTo < now) {
      return 'expired';
    }
    
    // Check if used (you might need to track this in your backend)
    // For now, we'll show all active non-expired vouchers as 'available'
    return 'available';
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleUseVoucher = (code: string) => {
    console.log(`Using voucher: ${code}`);
    // TODO: Implement voucher usage logic
  };

  const getFilteredVouchers = (): (VoucherItem & { status: VoucherStatus })[] => {
    return vouchers
      .map(voucher => ({
        ...voucher,
        status: getVoucherStatus(voucher)
      }))
      .filter(voucher => voucher.status === activeTab);
  };

  const getTabCount = (status: VoucherStatus) => {
    return vouchers
      .map(voucher => ({
        ...voucher,
        status: getVoucherStatus(voucher)
      }))
      .filter(voucher => voucher.status === status).length;
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#609CEF', '#4F8BE8', '#3D7CE0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Ưu Đãi Của Tôi</Text>
            <Text style={styles.headerSubtitle}>Quản lý và sử dụng các mã giảm giá</Text>
            
            {/* Stats Row */}
            <View style={styles.statsContainer}>
              <StatCard number={getTabCount('available').toString()} label="CÓ THỂ SỬ DỤNG" />
              <StatCard number={getTabCount('used').toString()} label="ĐÃ SỬ DỤNG" />
              <StatCard number={getTabCount('expired').toString()} label="HẾT HẠN" />
            </View>
          </View>
        </LinearGradient>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'available' && styles.activeTab]}
            onPress={() => setActiveTab('available')}
          >
            <Text style={[styles.tabText, activeTab === 'available' && styles.activeTabText]}>
              Có thể sử dụng ({getTabCount('available')})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'used' && styles.activeTab]}
            onPress={() => setActiveTab('used')}
          >
            <Text style={[styles.tabText, activeTab === 'used' && styles.activeTabText]}>
              Đã sử dụng ({getTabCount('used')})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'expired' && styles.activeTab]}
            onPress={() => setActiveTab('expired')}
          >
            <Text style={[styles.tabText, activeTab === 'expired' && styles.activeTabText]}>
              Hết hạn ({getTabCount('expired')})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Vouchers List */}
        <ScrollView style={styles.vouchersContainer} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#609CEF" />
              <Text style={styles.loadingText}>Đang tải ưu đãi...</Text>
            </View>
          ) : (
            <>
              {getFilteredVouchers().map((voucher, index) => (
                <VoucherCard
                  key={`${voucher.voucherId}-${index}`}
                  discount={voucherService.formatDiscountDisplay(voucher)}
                  title={voucher.voucherName}
                  description={voucher.voucherDescription}
                  code={voucher.voucherCode}
                  expiryDate={voucherService.getExpiryStatusText(voucher)}
                  status={voucher.status}
                  minimumOrder={voucher.minimumOrderAmount}
                  maxDiscount={voucher.maxDiscountAmount}
                  remainingCount={voucher.remainingGlobalCount}
                  maxCount={voucher.maxUsageCount}
                  categories={voucher.categoryNames}
                  onUse={() => handleUseVoucher(voucher.voucherCode)}
                />
              ))}
              
              {getFilteredVouchers().length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="gift-outline" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyText}>Không có ưu đãi nào</Text>
                  <Text style={styles.emptySubtext}>Hãy quay lại sau để xem thêm ưu đãi mới!</Text>
                </View>
              )}
            </>
          )}
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingBottom: 24,
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 24,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 350,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    minWidth: 100,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#609CEF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  activeTabText: {
    color: 'white',
  },
  vouchersContainer: {
    flex: 1,
    paddingTop: 16,
  },
  voucherCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledCard: {
    opacity: 0.7,
  },
  bannerGradient: {
    flexDirection: 'row',
    padding: 16,
    minHeight: 100,
  },
  leftSection: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 16,
    minWidth: 80,
  },
  discountText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
  },
  discountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 2,
    marginTop: 2,
  },
  divider: {
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
  },
  rightSection: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  voucherTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
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
  voucherCode: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 1.5,
  },
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voucherDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 8,
    lineHeight: 18,
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
  disabledButton: {
    opacity: 0.6,
  },
  disabledText: {
    opacity: 0.8,
  },
  
  // Expandable Details
  expandedDetails: {
    backgroundColor: 'white',
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
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
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  bottomSpacing: {
    height: 80,
  },
});

export default withCustomerAuth(Promotions, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});