import { API_ENDPOINTS } from './config';
import { apiService } from './base';
import type { AddressData, Address, AddressResponse, AddressListResponse } from '../../types/api';

export class AddressService {
  /**
   * Create a new address
   */
  async createAddress(addressData: AddressData): Promise<Address> {
    try {
      // Send as JSON with lowercase field names
      const backendData = {
        street: addressData.street || '',
        city: addressData.city || '',
        province: addressData.province || '',
        postalCode: addressData.postalCode || '',
        latitude: addressData.latitude,
        longitude: addressData.longitude
      };
      
      const response = await apiService.post<Address>(
        API_ENDPOINTS.ADDRESS.CREATE,
        backendData,
        { requireAuth: true }
      );
      
      // Extract data from ApiResponse wrapper
      if (response.is_success && response.data) {
        return response.data; // ApiResponse wrapper contains Address directly in data
      } else {
        throw new Error(response.message || 'Không thể tạo địa chỉ');
      }
    } catch (error: any) {
      console.error('Create address error:', error);
      throw new Error(error.message || 'Không thể tạo địa chỉ. Vui lòng thử lại.');
    }
  }

  /**
   * Get all addresses for current user
   */
  async getAllAddresses(): Promise<Address[]> {
    try {
      const response = await apiService.get<Address[]>(
        API_ENDPOINTS.ADDRESS.GET_ALL,
        undefined,
        { requireAuth: true }
      );
      
      // Extract data from ApiResponse wrapper
      if (response.is_success && response.data) {
        return response.data; // ApiResponse wrapper contains Address[] directly in data
      } else {
        throw new Error(response.message || 'Không thể tải danh sách địa chỉ');
      }
    } catch (error: any) {
      console.error('Get addresses error:', error);
      throw new Error(error.message || 'Không thể tải danh sách địa chỉ.');
    }
  }

  /**
   * Get address by ID
   */
  async getAddressById(id: string): Promise<AddressResponse> {
    try {
      const response = await apiService.get<AddressResponse>(
        API_ENDPOINTS.ADDRESS.GET_BY_ID(id),
        undefined,
        { requireAuth: true }
      );
      
      // Extract data from ApiResponse wrapper
      if (response.is_success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tải thông tin địa chỉ');
      }
    } catch (error: any) {
      console.error('Get address by ID error:', error);
      throw new Error(error.message || 'Không thể tải thông tin địa chỉ.');
    }
  }

  /**
   * Update address
   */
  async updateAddress(id: string, addressData: Partial<AddressData>): Promise<Address> {
    try {
      // Try sending with capitalized field names as validation expects
      const backendData = {
        Street: addressData.street?.trim() || '',
        City: addressData.city?.trim() || '',
        Province: addressData.province?.trim() || '',
        PostalCode: addressData.postalCode?.trim() || '',
        Latitude: addressData.latitude,
        Longitude: addressData.longitude
      };
      
      const response = await apiService.put<Address>(
        API_ENDPOINTS.ADDRESS.UPDATE(id),
        backendData,
        { requireAuth: true }
      );
      
      // Extract data from ApiResponse wrapper
      if (response.is_success && response.data) {
        return response.data; // ApiResponse wrapper contains Address directly in data
      } else {
        throw new Error(response.message || 'Không thể cập nhật địa chỉ');
      }
    } catch (error: any) {
      console.error('Update address error:', error);
      throw new Error(error.message || 'Không thể cập nhật địa chỉ. Vui lòng thử lại.');
    }
  }

  /**
   * Delete address
   */
  async deleteAddress(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(
        API_ENDPOINTS.ADDRESS.DELETE(id),
        { requireAuth: true }
      );
      
      // Extract data from ApiResponse wrapper
      if (response.is_success && response.data) {
        return response.data;
      } else {
        return { success: false, message: response.message || 'Không thể xóa địa chỉ' };
      }
    } catch (error: any) {
      console.error('Delete address error:', error);
      throw new Error(error.message || 'Không thể xóa địa chỉ. Vui lòng thử lại.');
    }
  }


}

// Export singleton instance
export const addressService = new AddressService();