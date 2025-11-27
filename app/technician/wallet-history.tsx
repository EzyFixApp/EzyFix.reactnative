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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useFocusEffect } from 'expo-router';
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';
import { walletService } from '../../lib/api/wallet';
import type { WalletTransaction, PaginatedResponse } from '../../lib/api/wallet';

function WalletHistory() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  // Reload transactions when screen is focused (after creating payout)
  useFocusEffect(
    React.useCallback(() => {
      loadTransactions(1, false);
    }, [])
  );

  const loadTransactions = async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1 && !append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await walletService.getTransactions({
        page,
        pageSize: 20,
      });

      if (append) {
        setTransactions((prev) => [...prev, ...response.items]);
      } else {
        setTransactions(response.items);
      }

      setCurrentPage(response.meta.current_page);
      setTotalPages(response.meta.total_pages);

      if (__DEV__) {
        console.log('✅ Loaded transactions:', {
          page: response.meta.current_page,
          total: response.meta.total_items,
        });
      }
    } catch (error: any) {
      if (__DEV__) console.error('❌ Failed to load transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTransactions(1, false);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loadingMore) {
      loadTransactions(currentPage + 1, true);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'EARNING':
        return 'Thu nhập';
      case 'COMMISSION':
        return 'Hoa hồng';
      case 'WITHDRAWAL':
        return 'Rút tiền';
      case 'ADJUSTMENT':
        return 'Điều chỉnh';
      default:
        return reason;
    }
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'EARNING':
        return 'trending-up';
      case 'COMMISSION':
        return 'pricetag';
      case 'WITHDRAWAL':
        return 'arrow-down-circle';
      case 'ADJUSTMENT':
        return 'swap-horizontal';
      default:
        return 'help-circle';
    }
  };

  const getReasonColor = (reason: string, type: string) => {
    if (type === 'CREDIT') {
      return '#10B981'; // Green for credits
    }
    return '#EF4444'; // Red for debits
  };

  const renderTransaction = (transaction: WalletTransaction) => {
    const isCredit = transaction.type === 'CREDIT';
    const color = getReasonColor(transaction.reason, transaction.type);

    return (
      <View key={transaction.transactionId} style={styles.transactionCard}>
        <View style={styles.transactionLeft}>
          <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
            <Ionicons
              name={getReasonIcon(transaction.reason) as any}
              size={24}
              color={color}
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionReason}>
              {getReasonLabel(transaction.reason)}
            </Text>
            <Text style={styles.transactionDate}>
              {formatDate(transaction.createdAt)}
            </Text>
            {transaction.note && (
              <Text style={styles.transactionNote} numberOfLines={2}>
                {transaction.note}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[styles.transactionAmount, { color }]}>
            {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
          </Text>
        </View>
      </View>
    );
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
              <Text style={styles.headerTitle}>Lịch sử ví</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#609CEF" />
          <Text style={styles.loadingText}>Đang tải giao dịch...</Text>
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
          {transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>Chưa có giao dịch</Text>
              <Text style={styles.emptyText}>
                Lịch sử giao dịch của bạn sẽ hiển thị tại đây
              </Text>
            </View>
          ) : (
            <>
              {transactions.map(renderTransaction)}
              
              {loadingMore && (
                <View style={styles.loadingMoreContainer}>
                  <ActivityIndicator size="small" color="#609CEF" />
                </View>
              )}
              
              {currentPage >= totalPages && transactions.length > 0 && (
                <Text style={styles.endText}>Đã hiển thị tất cả giao dịch</Text>
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
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionReason: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  transactionNote: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  endText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#9CA3AF',
    paddingVertical: 16,
  },
});

export default withTechnicianAuth(WalletHistory);
