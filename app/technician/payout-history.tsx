import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useFocusEffect } from 'expo-router';
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';
import { walletService } from '../../lib/api/wallet';
import type { PayoutRequest, PaginatedResponse } from '../../lib/api/wallet';

function PayoutHistory() {
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED'>('ALL');

  useEffect(() => {
    loadPayouts();
  }, [selectedFilter]);

  // Reload payouts when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadPayouts(1, false);
    }, [selectedFilter])
  );

  const loadPayouts = async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1 && !append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await walletService.getPayouts({
        page,
        pageSize: 20,
        status: selectedFilter === 'ALL' ? undefined : selectedFilter,
      });

      if (append) {
        setPayouts((prev) => [...prev, ...response.items]);
      } else {
        setPayouts(response.items);
      }

      setCurrentPage(response.meta.current_page);
      setTotalPages(response.meta.total_pages);

      if (__DEV__) {
        console.log('✅ Loaded payouts:', {
          page: response.meta.current_page,
          total: response.meta.total_items,
          items: response.items.length,
        });
        // Debug: Log each payout status
        response.items.forEach((payout, index) => {
          console.log(`Payout ${index + 1}:`, {
            id: payout.payoutRequestId.substring(0, 8),
            amount: payout.amount,
            status: payout.status,
            requestedAt: payout.requestedAt,
            approvedAt: payout.approvedAt,
            paidAt: payout.paidAt,
            rejectedAt: payout.rejectedAt,
          });
        });
      }
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to load payouts:', error);
      // If error is due to authentication, don't keep retrying
      if (error.message?.includes('No access token') || error.message?.includes('Session expired')) {
        // User is being logged out, clear data
        setPayouts([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPayouts(1, false);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loadingMore) {
      loadPayouts(currentPage + 1, true);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return {
          text: 'Đang chờ',
          color: '#F59E0B',
          bgColor: '#FEF3C7',
          icon: 'time-outline' as const,
        };
      case 'APPROVED':
        return {
          text: 'Đã duyệt',
          color: '#3B82F6',
          bgColor: '#DBEAFE',
          icon: 'checkmark-circle-outline' as const,
        };
      case 'PAID':
        return {
          text: 'Đã thanh toán',
          color: '#10B981',
          bgColor: '#D1FAE5',
          icon: 'checkmark-done-circle-outline' as const,
        };
      case 'REJECTED':
        return {
          text: 'Bị từ chối',
          color: '#EF4444',
          bgColor: '#FEE2E2',
          icon: 'close-circle-outline' as const,
        };
      default:
        return {
          text: status,
          color: '#6B7280',
          bgColor: '#F3F4F6',
          icon: 'help-circle-outline' as const,
        };
    }
  };

  const getBankName = (bankCode: string) => {
    const bankNames: Record<string, string> = {
      '970436': 'Vietcombank',
      '970415': 'VietinBank',
      '970422': 'MB Bank',
      '970418': 'BIDV',
      '970405': 'Agribank',
      '970407': 'Techcombank',
      '970423': 'TPBank',
      '970403': 'Sacombank',
      '970416': 'ACB',
      '970432': 'VPBank',
    };
    return bankNames[bankCode] || bankCode;
  };

  const renderPayout = (payout: PayoutRequest) => {
    const statusInfo = getStatusInfo(payout.status);
    const bankName = getBankName(payout.bankCode);

    return (
      <View key={payout.payoutRequestId} style={styles.payoutCard}>
        {/* Header with status */}
        <View style={styles.payoutHeader}>
          <View style={styles.statusBadgeContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
              <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} />
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.text}
              </Text>
            </View>
          </View>
          <Text style={styles.payoutAmount}>{formatCurrency(payout.amount)}</Text>
        </View>

        {/* Bank Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="business-outline" size={16} color="#6B7280" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Ngân hàng</Text>
            <Text style={styles.infoValue}>{bankName}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="person-outline" size={16} color="#6B7280" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Chủ tài khoản</Text>
            <Text style={styles.infoValue}>{payout.receiverName}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIconContainer}>
            <Ionicons name="card-outline" size={16} color="#6B7280" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Số tài khoản</Text>
            <Text style={styles.infoValue}>{payout.receiverAccount}</Text>
          </View>
        </View>

        {/* Hold Amount (if any) */}
        {payout.holdAmount > 0 && (
          <View style={styles.holdWarning}>
            <Ionicons name="lock-closed-outline" size={14} color="#F59E0B" />
            <Text style={styles.holdText}>
              Đang giữ: {formatCurrency(payout.holdAmount)}
            </Text>
          </View>
        )}

        {/* Note */}
        {payout.note && (
          <View style={styles.noteContainer}>
            <Text style={styles.noteLabel}>Ghi chú:</Text>
            <Text style={styles.noteText}>{payout.note}</Text>
          </View>
        )}

        {/* Failure Reason */}
        {payout.status === 'REJECTED' && payout.failureReason && (
          <View style={styles.failureContainer}>
            <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
            <Text style={styles.failureText}>{payout.failureReason}</Text>
          </View>
        )}

        {/* Timestamps */}
        <View style={styles.timestampContainer}>
          <View style={styles.timestampRow}>
            <Text style={styles.timestampLabel}>Yêu cầu:</Text>
            <Text style={styles.timestampValue}>{formatDate(payout.requestedAt)}</Text>
          </View>
          {payout.approvedAt && (
            <View style={styles.timestampRow}>
              <Text style={styles.timestampLabel}>Duyệt:</Text>
              <Text style={styles.timestampValue}>{formatDate(payout.approvedAt)}</Text>
            </View>
          )}
          {payout.paidAt && (
            <View style={styles.timestampRow}>
              <Text style={styles.timestampLabel}>Thanh toán:</Text>
              <Text style={styles.timestampValue}>{formatDate(payout.paidAt)}</Text>
            </View>
          )}
          {payout.rejectedAt && (
            <View style={styles.timestampRow}>
              <Text style={styles.timestampLabel}>Từ chối:</Text>
              <Text style={styles.timestampValue}>{formatDate(payout.rejectedAt)}</Text>
            </View>
          )}
        </View>

        {/* QR Code (if available) */}
        {payout.vietQrImageBase64 && payout.status === 'APPROVED' && (
          <View style={styles.qrContainer}>
            <Text style={styles.qrLabel}>Mã QR thanh toán:</Text>
            <Image
              source={{ uri: `data:image/png;base64,${payout.vietQrImageBase64}` }}
              style={styles.qrImage}
              resizeMode="contain"
            />
            <Text style={styles.qrHint}>Quét mã để thanh toán</Text>
          </View>
        )}
      </View>
    );
  };

  const renderFilterButton = (
    filter: typeof selectedFilter,
    label: string,
    count?: number
  ) => {
    const isSelected = selectedFilter === filter;
    return (
      <TouchableOpacity
        style={[styles.filterButton, isSelected && styles.filterButtonActive]}
        onPress={() => setSelectedFilter(filter)}
      >
        <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
          {label}
        </Text>
        {count !== undefined && count > 0 && (
          <View style={[styles.filterBadge, isSelected && styles.filterBadgeActive]}>
            <Text style={[styles.filterBadgeText, isSelected && styles.filterBadgeTextActive]}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Count payouts by status
  const statusCounts = {
    PENDING: payouts.filter((p) => p.status === 'PENDING').length,
    APPROVED: payouts.filter((p) => p.status === 'APPROVED').length,
    PAID: payouts.filter((p) => p.status === 'PAID').length,
    REJECTED: payouts.filter((p) => p.status === 'REJECTED').length,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#609CEF" translucent={false} />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.headerWrapper}>
        <LinearGradient colors={['#609CEF', '#3B82F6']} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Lịch sử rút tiền</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {renderFilterButton('ALL', 'Tất cả', payouts.length)}
          {renderFilterButton('PENDING', 'Đang chờ', statusCounts.PENDING)}
          {renderFilterButton('APPROVED', 'Đã duyệt', statusCounts.APPROVED)}
          {renderFilterButton('PAID', 'Đã thanh toán', statusCounts.PAID)}
          {renderFilterButton('REJECTED', 'Bị từ chối', statusCounts.REJECTED)}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#609CEF" />
          <Text style={styles.loadingText}>Đang tải lịch sử rút tiền...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom =
              layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
            if (isCloseToBottom) {
              handleLoadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          {payouts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Chưa có yêu cầu rút tiền</Text>
              <Text style={styles.emptyText}>
                Lịch sử rút tiền của bạn sẽ hiển thị tại đây
              </Text>
            </View>
          ) : (
            <>
              {payouts.map(renderPayout)}

              {loadingMore && (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color="#609CEF" />
                </View>
              )}

              {currentPage >= totalPages && payouts.length > 0 && (
                <Text style={styles.endText}>Đã hiển thị tất cả yêu cầu rút tiền</Text>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerWrapper: {
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 40,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  filterContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#609CEF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: 'white',
  },
  filterBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  filterBadgeTextActive: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  payoutCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusBadgeContainer: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  payoutAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  holdWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  holdText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
  },
  noteContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  noteLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  failureContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  failureText: {
    flex: 1,
    fontSize: 13,
    color: '#991B1B',
    lineHeight: 18,
    fontWeight: '500',
  },
  timestampContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  timestampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestampLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  timestampValue: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  qrContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    alignItems: 'center',
  },
  qrLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  qrHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#9CA3AF',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
});

export default withTechnicianAuth(PayoutHistory);
