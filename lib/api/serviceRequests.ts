/**
 * Service Requests API
 * Handles booking and service request operations
 */

import { apiService } from './base';
import { API_ENDPOINTS } from './config';
import type {
  ServiceRequestData,
  ServiceRequestResponse,
  ApiResponse
} from '../../types/api';

export class ServiceRequestService {
  private static instance: ServiceRequestService;

  public static getInstance(): ServiceRequestService {
    if (!ServiceRequestService.instance) {
      ServiceRequestService.instance = new ServiceRequestService();
    }
    return ServiceRequestService.instance;
  }

  /**
   * Create a new service request
   */
  public async createServiceRequest(requestData: ServiceRequestData): Promise<ServiceRequestResponse> {
    try {
      const response = await apiService.post<ServiceRequestResponse>(
        API_ENDPOINTS.SERVICE_REQUESTS.CREATE,
        requestData,
        { requireAuth: true }
      );

      if (response.is_success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tạo yêu cầu dịch vụ');
      }
    } catch (error: any) {
      if (__DEV__) console.error('Create service request error:', error);
      throw error;
    }
  }

  /**
   * Get all service requests for current user
   */
  public async getUserServiceRequests(): Promise<ServiceRequestResponse[]> {
    try {
      // Get current user data to filter by CustomerId
      const { authService } = await import('./auth');
      const userData = await authService.getUserData();
      const token = await authService.getAccessToken();
      
      if (__DEV__) {
        console.log('Getting service requests for user:', userData?.id);
        console.log('Token available:', !!token);
      }
      
      if (!userData?.id) {
        if (__DEV__) console.warn('User ID not found, returning empty array');
        return [];
      }

      if (!token) {
        if (__DEV__) console.warn('Access token not found, returning empty array');
        return [];
      }

      // Try different approaches to get user's service requests
      let response;
      
      // Approach 1: Try with CustomerId query parameter
      try {
        response = await apiService.get<ServiceRequestResponse[]>(
          API_ENDPOINTS.SERVICE_REQUESTS.GET_USER_REQUESTS,
          { CustomerId: userData.id },
          { requireAuth: true }
        );
        
        if (__DEV__) console.log('Approach 1 (CustomerId param) - Response:', response.status_code);
      } catch (paramError: any) {
        if (__DEV__) console.log('Approach 1 failed with:', paramError.status_code);
        
        // Approach 2: Try without parameters (might be server-side filtered by token)
        try {
          response = await apiService.get<ServiceRequestResponse[]>(
            API_ENDPOINTS.SERVICE_REQUESTS.GET_USER_REQUESTS,
            undefined,
            { requireAuth: true }
          );
          
          if (__DEV__) console.log('Approach 2 (no params) - Response:', response.status_code);
        } catch (noParamError: any) {
          if (__DEV__) console.log('Approach 2 also failed with:', noParamError.status_code);
          throw noParamError;
        }
      }

      if (response.is_success && response.data) {
        if (__DEV__) console.log('Service requests loaded successfully:', response.data.length, 'items');
        return response.data;
      } else {
        if (__DEV__) console.warn('API returned unsuccessful response:', response.message);
        return [];
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('Get service requests error details:', {
          status: error.status_code,
          message: error.message,
          reason: error.reason,
          endpoint: API_ENDPOINTS.SERVICE_REQUESTS.GET_USER_REQUESTS
        });
      }
      
      // Return empty array for any error to prevent crashes
      // The UI will handle empty state gracefully
      return [];
    }
  }

  /**
   * Get service request by ID
   */
  public async getServiceRequestById(id: string): Promise<ServiceRequestResponse> {
    try {
      const response = await apiService.get<ServiceRequestResponse>(
        API_ENDPOINTS.SERVICE_REQUESTS.GET_BY_ID(id),
        undefined,
        { requireAuth: true }
      );

      if (response.is_success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tải chi tiết yêu cầu');
      }
    } catch (error: any) {
      if (__DEV__) console.error('Get service request by ID error:', error);
      throw error;
    }
  }

  /**
   * Update service request
   */
  public async updateServiceRequest(id: string, requestData: Partial<ServiceRequestData>): Promise<ServiceRequestResponse> {
    try {
      const response = await apiService.put<ServiceRequestResponse>(
        API_ENDPOINTS.SERVICE_REQUESTS.UPDATE(id),
        requestData,
        { requireAuth: true }
      );

      if (response.is_success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể cập nhật yêu cầu dịch vụ');
      }
    } catch (error: any) {
      if (__DEV__) console.error('Update service request error:', error);
      throw error;
    }
  }

  /**
   * Delete service request
   */
  public async deleteServiceRequest(id: string): Promise<void> {
    try {
      const response = await apiService.delete(
        API_ENDPOINTS.SERVICE_REQUESTS.DELETE(id),
        { requireAuth: true }
      );

      if (!response.is_success) {
        throw new Error(response.message || 'Không thể xóa yêu cầu dịch vụ');
      }
    } catch (error: any) {
      if (__DEV__) console.error('Delete service request error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const serviceRequestService = ServiceRequestService.getInstance();