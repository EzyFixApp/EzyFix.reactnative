/**
 * Wallet API Service
 * Handles technician wallet operations (balance, transactions, payouts)
 */

import { apiService } from './base';
import { API_BASE_URL } from './config';
import { authService } from './auth';

// Types
export interface BankInfo {
  key: string;
  code: string;
  shortName: string;
  name: string;
  bin: string;
  vietQrStatus: 'TRANSFER_SUPPORTED' | 'RECEIVE_ONLY';
  lookupSupported: boolean;
  swiftCode?: string;
}

export interface WalletTransaction {
  transactionId: string;
  walletAccountId: string;
  type: 'CREDIT' | 'DEBIT';
  reason: 'EARNING' | 'COMMISSION' | 'WITHDRAWAL' | 'ADJUSTMENT';
  amount: number;
  referenceType?: string;
  referenceId?: string;
  appointmentId?: string;
  paymentId?: string;
  note?: string;
  createdAt: string;
}

export interface WalletSummary {
  walletAccountId: string;
  balance: number;
  holdAmount: number;
  availableBalance: number;
  hasDebt: boolean;
  recentTransactions: WalletTransaction[];
}

export interface PayoutRequest {
  payoutRequestId: string;
  walletAccountId: string;
  amount: number;
  holdAmount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  receiverName: string;
  receiverAccount: string;
  bankCode: string;
  note?: string;
  requestedAt: string;
  approvedAt?: string;
  paidAt?: string;
  rejectedAt?: string;
  processedAt?: string;
  failureReason?: string;
  processedBy?: string;
  vietQrPayload?: string;
  vietQrImageBase64?: string;
  renderQrEnabled: boolean;
}

export interface CreatePayoutRequest {
  amount: number;
  receiverName: string;
  receiverAccount: string;
  bankCode: string;
  note?: string;
}

export interface PaginationMeta {
  total_pages: number;
  total_items: number;
  current_page: number;
  page_size: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export class WalletService {
  private static instance: WalletService;

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  /**
   * Get list of banks supporting VietQR
   */
  public async getBanks(): Promise<BankInfo[]> {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      if (__DEV__) console.log('🏦 [Wallet] Fetching bank directory');

      const response = await fetch(`${API_BASE_URL}/api/v1/wallet/banks`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Get banks failed: ${response.status}`);
      }

      if (!result.data) {
        throw new Error(result.message || 'Bank data not found in response');
      }

      if (__DEV__) console.log(`✅ [Wallet] Loaded ${result.data.length} banks`);
      return result.data;
    } catch (error: any) {
      if (__DEV__) console.error('❌ [Wallet] Get banks error:', error);
      throw error;
    }
  }

  /**
   * Get wallet summary (balance + recent transactions)
   */
  public async getWalletSummary(): Promise<WalletSummary> {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      if (__DEV__) console.log('💰 [Wallet] Fetching wallet summary');

      const response = await fetch(`${API_BASE_URL}/api/v1/wallet/summary`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (__DEV__) {
        console.log('📦 [Wallet] Raw response:', {
          status: response.status,
          isSuccess: result.isSuccess,
          hasData: !!result.data,
        });
      }

      // Check if response is successful - backend returns data directly even if isSuccess is undefined
      if (!response.ok) {
        throw new Error(result.message || `Get wallet summary failed: ${response.status}`);
      }

      // Check if data exists in response
      if (!result.data) {
        throw new Error(result.message || 'Wallet data not found in response');
      }

      if (__DEV__) {
        console.log('✅ [Wallet] Summary loaded:', {
          balance: result.data.balance,
          available: result.data.availableBalance,
          hold: result.data.holdAmount,
        });
      }
      return result.data;
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ [Wallet] Get summary error:', {
          message: error.message,
          stack: error.stack,
        });
      }
      throw new Error(error.message || 'Unknown error occurred');
    }
  }

  /**
   * Get paginated wallet transactions with filters
   */
  public async getTransactions(params?: {
    page?: number;
    pageSize?: number;
    reason?: 'EARNING' | 'COMMISSION' | 'WITHDRAWAL' | 'ADJUSTMENT';
    type?: 'CREDIT' | 'DEBIT';
    from?: string;
    to?: string;
  }): Promise<PaginatedResponse<WalletTransaction>> {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params?.reason) queryParams.append('reason', params.reason);
      if (params?.type) queryParams.append('type', params.type);
      if (params?.from) queryParams.append('from', params.from);
      if (params?.to) queryParams.append('to', params.to);

      const url = `${API_BASE_URL}/api/v1/wallet/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      if (__DEV__) console.log('📜 [Wallet] Fetching transactions:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Get transactions failed: ${response.status}`);
      }

      if (!result.data) {
        throw new Error(result.message || 'Transaction data not found in response');
      }

      if (__DEV__) {
        console.log('✅ [Wallet] Transactions loaded:', {
          items: result.data.items.length,
          total: result.data.meta.total_items,
        });
      }
      return result.data;
    } catch (error: any) {
      if (__DEV__) console.error('❌ [Wallet] Get transactions error:', error);
      throw error;
    }
  }

  /**
   * Get paginated payout requests
   */
  public async getPayouts(params?: {
    page?: number;
    pageSize?: number;
    status?: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  }): Promise<PaginatedResponse<PayoutRequest>> {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params?.status) queryParams.append('status', params.status);

      const url = `${API_BASE_URL}/api/v1/wallet/payouts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      if (__DEV__) console.log('💸 [Wallet] Fetching payouts:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Get payouts failed: ${response.status}`);
      }

      if (!result.data) {
        throw new Error(result.message || 'Payout data not found in response');
      }

      if (__DEV__) {
        console.log('✅ [Wallet] Payouts loaded:', {
          items: result.data.items.length,
          total: result.data.meta.total_items,
        });
      }
      return result.data;
    } catch (error: any) {
      if (__DEV__) console.error('❌ [Wallet] Get payouts error:', error);
      throw error;
    }
  }

  /**
   * Create a new payout request
   */
  public async createPayout(request: CreatePayoutRequest): Promise<PayoutRequest> {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      if (__DEV__) console.log('💸 [Wallet] Creating payout request:', { amount: request.amount });

      const response = await fetch(`${API_BASE_URL}/api/v1/wallet/payouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Create payout failed: ${response.status}`);
      }

      if (!result.data) {
        throw new Error(result.message || 'Payout data not found in response');
      }

      if (__DEV__) console.log('✅ [Wallet] Payout created:', result.data.payoutRequestId);
      return result.data;
    } catch (error: any) {
      if (__DEV__) console.error('❌ [Wallet] Create payout error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const walletService = WalletService.getInstance();
