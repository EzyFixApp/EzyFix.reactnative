/**
 * Voucher Service
 * Handles voucher-related API operations
 */

import { BaseApiService } from './base';
import type { 
  ApiResponse, 
  EligibleVouchersData,
  ValidateVoucherRequest,
  VoucherUsageData,
  AllVouchersData
} from '../../types/api';

class VoucherService {
  private api: BaseApiService;

  constructor() {
    this.api = BaseApiService.getInstance();
  }

  /**
   * Get eligible vouchers for an appointment
   * GET /api/v1/vouchers/eligible?appointmentid={appointmentId}
   */
  async getEligibleVouchers(appointmentId: string): Promise<EligibleVouchersData> {
    try {
      const response = await this.api.get<EligibleVouchersData>(
        `/api/v1/vouchers/eligible`,
        { appointmentid: appointmentId },
        { requireAuth: true }
      );

      if (!response.is_success) {
        throw new Error(response.message || 'Không thể lấy danh sách voucher');
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ [VoucherService] Error getting eligible vouchers:', error);
      throw error;
    }
  }

  /**
   * Validate and reserve a voucher
   * POST /api/v1/vouchers/validate
   */
  async validateVoucher(request: ValidateVoucherRequest): Promise<VoucherUsageData> {
    try {
      const response = await this.api.post<VoucherUsageData>(
        `/api/v1/vouchers/validate`,
        request,
        { requireAuth: true }
      );

      if (!response.is_success) {
        throw new Error(response.message || 'Voucher không hợp lệ');
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ [VoucherService] Error validating voucher:', error);
      throw error;
    }
  }

  /**
   * Get all active vouchers for customer dashboard
   * GET /api/v1/admin/vouchers
   * Note: This endpoint requires authentication and is accessible by both admin and customer
   */
  async getAllVouchers(page = 1, pageSize = 20): Promise<AllVouchersData> {
    try {
      const response = await this.api.get<AllVouchersData>(
        `/api/v1/admin/vouchers`,
        { page: page.toString(), pageSize: pageSize.toString() },
        { requireAuth: true }
      );

      if (!response.is_success) {
        throw new Error(response.message || 'Không thể lấy danh sách voucher');
      }

      // Filter only active and valid vouchers for customers
      const now = new Date();
      const activeVouchers = response.data.items.filter((voucher: any) => 
        voucher.isActive && 
        voucher.remainingGlobalCount > 0 &&
        new Date(voucher.validTo) > now // Not expired
      );

      return {
        items: activeVouchers,
        pagination: {
          ...response.data.pagination,
          totalItems: activeVouchers.length
        }
      };
    } catch (error: any) {
      console.error('❌ [VoucherService] Error getting all vouchers:', error);
      throw error;
    }
  }

  /**
   * Format discount display text for UI
   */
  formatDiscountDisplay(voucher: any): string {
    if (voucher.discountType === 'FREE_CHECKING') {
      return 'Miễn phí kiểm tra';
    } else if (voucher.discountType === 'PERCENTAGE') {
      return `Giảm ${voucher.discountValue}%`;
    } else if (voucher.discountType === 'FIXED_AMOUNT') {
      return `Giảm ${new Intl.NumberFormat('vi-VN').format(voucher.discountValue)}₫`;
    }
    return '';
  }

  /**
   * Get voucher expiry status text
   */
  getExpiryStatusText(voucher: any): string {
    const validTo = new Date(voucher.validTo);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return 'Đã hết hạn';
    } else if (daysUntilExpiry === 0) {
      return 'Hết hạn hôm nay';
    } else if (daysUntilExpiry <= 3) {
      return `Còn ${daysUntilExpiry} ngày`;
    } else if (daysUntilExpiry <= 7) {
      return 'Còn dưới 1 tuần';
    } else {
      return `HSD: ${validTo.toLocaleDateString('vi-VN')}`;
    }
  }
}

export const voucherService = new VoucherService();
