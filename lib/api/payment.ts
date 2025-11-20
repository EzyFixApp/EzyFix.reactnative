/**
 * Payment API Service
 * Handles payment operations
 */

import { apiService } from './base';
import type { ApiResponse } from '../../types/api';

export interface CreatePaymentRequest {
  appointmentId: string;
  voucherCode?: string;
  voucherReservationToken?: string;
  invoiceRequested?: boolean;
}

export interface CreatePaymentResponse {
  checkoutUrl: string;
  orderId: string;
  amount: number;
  paymentId?: string; // Payment ID for confirmation
}

export interface PaymentStatus {
  appointmentId: string;
  paymentStatus: string;
  transactionId?: string;
  amount: number;
  paidAt?: string;
}

class PaymentService {
  private static instance: PaymentService;

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Create payment checkout session
   */
  public async createPayment(data: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      const response = await apiService.post<CreatePaymentResponse>(
        '/api/v1/payment/payos/checkout',
        data,
        { requireAuth: true }
      );

      if (response.is_success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create payment');
      }
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get payment status
   */
  public async getPaymentStatus(appointmentId: string): Promise<PaymentStatus> {
    try {
      const response = await apiService.get<PaymentStatus>(
        `/api/v1/payments/status/${appointmentId}`,
        undefined,
        { requireAuth: true }
      );

      if (response.is_success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to get payment status');
      }
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Verify payment
   */
  public async verifyPayment(orderId: string): Promise<boolean> {
    try {
      const response = await apiService.get<{ success: boolean }>(
        `/api/v1/payments/verify/${orderId}`,
        undefined,
        { requireAuth: true }
      );

      return response.is_success && response.data?.success === true;
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }

  /**
   * Confirm payment after successful PayOS transaction
   * Updates payment status to completed and service request to "Completed"
   */
  public async confirmPayment(paymentId: string): Promise<void> {
    try {
      const response = await apiService.post<void>(
        '/api/v1/payment/payos/confirm',
        { paymentId },
        { requireAuth: true }
      );

      if (!response.is_success) {
        throw new Error(response.message || 'Failed to confirm payment');
      }
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const paymentService = PaymentService.getInstance();
