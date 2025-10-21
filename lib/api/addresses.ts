import { API_ENDPOINTS, API_BASE_URL } from './config';
import { apiService } from './base';
import type { AddressData, Address, AddressResponse, AddressListResponse } from '../../types/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      // Validate required fields
      if (!addressData.street || addressData.street.trim() === '') {
        throw new Error('Địa chỉ đường không được để trống');
      }
      if (!addressData.city || addressData.city.trim() === '') {
        throw new Error('Thành phố không được để trống');
      }
      if (!addressData.province || addressData.province.trim() === '') {
        throw new Error('Tỉnh/Thành phố không được để trống');
      }
      if (!addressData.postalCode || addressData.postalCode.trim() === '') {
        throw new Error('Mã bưu điện không được để trống');
      }

      // Build FormData for multipart/form-data request (as backend expects)
      const formData = new FormData();
      formData.append('Street', addressData.street.trim());
      formData.append('City', addressData.city.trim());
      formData.append('Province', addressData.province.trim());
      formData.append('PostalCode', addressData.postalCode.trim());
      
      // Optional fields - only append if they exist
      if (addressData.latitude !== undefined && addressData.latitude !== null) {
        formData.append('Latitude', addressData.latitude.toString());
      }
      if (addressData.longitude !== undefined && addressData.longitude !== null) {
        formData.append('Longitude', addressData.longitude.toString());
      }

      // Log for debugging
      if (__DEV__) {
        console.log('🔄 Updating address:', id);
        console.log('📦 FormData fields:', {
          Street: addressData.street.trim(),
          City: addressData.city.trim(),
          Province: addressData.province.trim(),
          PostalCode: addressData.postalCode.trim(),
          Latitude: addressData.latitude,
          Longitude: addressData.longitude
        });
      }
      
      // Use fetch directly for FormData
      const token = await AsyncStorage.getItem('access_token');
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.ADDRESS.UPDATE(id)}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type for FormData - browser will set it with boundary
          },
          body: formData as any
        }
      );
      
      const responseData = await response.json();
      
      if (__DEV__) {
        console.log('✅ Update response:', responseData);
      }
      
      if (!response.ok) {
        throw new Error(JSON.stringify(responseData));
      }
      
      // Extract data from response
      if (responseData && responseData.data) {
        return responseData.data;
      } else if (responseData) {
        return responseData;
      } else {
        throw new Error('Không thể cập nhật địa chỉ');
      }
    } catch (error: any) {
      console.error('❌ Update address error:', error);
      
      // Try to parse error message
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.message) {
          throw new Error(errorData.message);
        }
      } catch (e) {
        // Not a JSON error, use original message
      }
      
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