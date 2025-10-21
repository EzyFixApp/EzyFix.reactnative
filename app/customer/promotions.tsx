import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import withCustomerAuth from '../../lib/auth/withCustomerAuth';

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
  onUse?: () => void;
}

function VoucherCard({ discount, title, description, code, expiryDate, status, onUse }: VoucherCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'available':
        return '#10B981'; // Green
      case 'used':
        return '#6B7280'; // Gray
      case 'expired':
        return '#EF4444'; // Red
      default:
        return '#6B7280';
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
    <View style={[styles.voucherCard, isDisabled && styles.disabledCard]}>
      {/* Discount Circle */}
      <View style={[styles.discountCircle, { backgroundColor: getStatusColor() }]}>
        <Text style={styles.discountText}>{discount}</Text>
      </View>

      {/* Voucher Content */}
      <View style={styles.voucherContent}>
        <Text style={[styles.voucherTitle, isDisabled && styles.disabledText]}>{title}</Text>
        <Text style={[styles.voucherDescription, isDisabled && styles.disabledText]}>
          {description}
        </Text>
        <Text style={[styles.voucherCode, isDisabled && styles.disabledText]}>
          Mã: {code}
        </Text>
        <Text style={[styles.expiryText, isDisabled && styles.disabledText]}>
          {expiryDate}
        </Text>
      </View>

      {/* Use Button */}
      <TouchableOpacity
        style={[
          styles.useButton,
          { backgroundColor: getStatusColor() },
          isDisabled && styles.disabledButton
        ]}
        onPress={onUse}
        disabled={isDisabled}
        activeOpacity={isDisabled ? 1 : 0.7}
      >
        <Text style={[styles.useButtonText, isDisabled && styles.disabledButtonText]}>
          {getStatusText()}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function Promotions() {
  const [activeTab, setActiveTab] = useState<'available' | 'used' | 'expired'>('available');

  const vouchers = [
    {
      discount: '-50K',
      title: 'Ưu đãi mùa hè',
      description: 'Giảm 50.000đ cho đơn hàng từ 500.000đ',
      code: 'SUMMER50',
      expiryDate: 'Hết hạn 31/12/2025',
      status: 'available' as VoucherStatus
    },
    {
      discount: '-15%',
      title: 'Giảm giá thợ điện lạnh',
      description: 'Giảm 15% cho tất cả dịch vụ điện lạnh',
      code: 'TECH15',
      expiryDate: 'Hết hạn 30/11/2025',
      status: 'available' as VoucherStatus
    },
    {
      discount: '-100K',
      title: 'Khách hàng thân thiết',
      description: 'Giảm 100.000đ cho đơn hàng từ 500.000đ',
      code: 'LOYAL100',
      expiryDate: 'Chưa sử dụng khiến',
      status: 'used' as VoucherStatus
    },
    {
      discount: '-20%',
      title: 'Khuyến mãi cuối tuần',
      description: 'Giảm 20% cho dịch vụ sửa chữa điện nước',
      code: 'WEEKEND20',
      expiryDate: 'Hết hạn 15/09/2025',
      status: 'expired' as VoucherStatus
    }
  ];

  const handleBackPress = () => {
    router.back();
  };

  const handleUseVoucher = (code: string) => {
    console.log(`Using voucher: ${code}`);
    // TODO: Implement voucher usage logic
  };

  const getFilteredVouchers = () => {
    return vouchers.filter(voucher => voucher.status === activeTab);
  };

  const getTabCount = (status: VoucherStatus) => {
    return vouchers.filter(voucher => voucher.status === status).length;
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
          {getFilteredVouchers().map((voucher, index) => (
            <VoucherCard
              key={`${voucher.code}-${index}`}
              discount={voucher.discount}
              title={voucher.title}
              description={voucher.description}
              code={voucher.code}
              expiryDate={voucher.expiryDate}
              status={voucher.status}
              onUse={() => handleUseVoucher(voucher.code)}
            />
          ))}
          
          {getFilteredVouchers().length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="gift-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Không có ưu đãi nào</Text>
              <Text style={styles.emptySubtext}>Hãy quay lại sau để xem thêm ưu đãi mới!</Text>
            </View>
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
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledCard: {
    opacity: 0.7,
  },
  discountCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  discountText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  voucherContent: {
    flex: 1,
    marginRight: 12,
  },
  voucherTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  voucherDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 16,
  },
  voucherCode: {
    fontSize: 12,
    color: '#609CEF',
    fontWeight: '600',
    marginBottom: 4,
  },
  expiryText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  useButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  useButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  disabledButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
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
  bottomSpacing: {
    height: 80,
  },
});

export default withCustomerAuth(Promotions, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});