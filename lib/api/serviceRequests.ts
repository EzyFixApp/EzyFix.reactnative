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
      // Backend expects PascalCase format (C# naming convention)
      const backendData = {
        AddressID: requestData.addressID,
        ServiceId: requestData.serviceId,
        ServiceDescription: requestData.serviceDescription,
        FullName: requestData.fullName,
        PhoneNumber: requestData.phoneNumber,
        AddressNote: requestData.addressNote,
        RequestedDate: requestData.requestedDate,
        ExpectedStartTime: requestData.expectedStartTime,
        MediaUrls: requestData.mediaUrls
      };

      const response = await apiService.post<ServiceRequestResponse>(
        API_ENDPOINTS.SERVICE_REQUESTS.CREATE,
        backendData,
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
   * For customers: filter by CustomerId
   * For technicians: get requests where they submitted offers
   */
  public async getUserServiceRequests(): Promise<ServiceRequestResponse[]> {
    try {
      // Get current user data to filter by CustomerId
      const { authService } = await import('./auth');
      const userData = await authService.getUserData();
      const token = await authService.getAccessToken();
      
      if (__DEV__) {
        console.log('Getting service requests for user:', userData?.id, 'role:', userData?.userType);
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

      // For technicians, get requests where they have submitted offers
      if (userData.userType === 'technician') {
        if (__DEV__) console.log('🔧 Fetching requests for technician via offers...');
        return await this.getTechnicianServiceRequests(userData.id);
      }

      // For customers, filter by CustomerId
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
   * Get service requests for technician
   * Gets requests where technician has submitted offers
   */
  private async getTechnicianServiceRequests(technicianId: string): Promise<ServiceRequestResponse[]> {
    try {
      // Step 1: Get all offers from this technician
      const { authService } = await import('./auth');
      const token = await authService.getAccessToken();
      
      if (!token) {
        if (__DEV__) console.warn('⚠️ No token for technician offers');
        return [];
      }

      // Use API_BASE_URL from config
      const { API_BASE_URL } = await import('./config');
      
      // Try without filtering first (backend might filter by JWT token)
      const offersUrl = `${API_BASE_URL}${API_ENDPOINTS.SERVICE_DELIVERY_OFFERS.BASE}`;
      
      if (__DEV__) console.log('📥 Fetching all offers (will be filtered by backend):', offersUrl);
      
      const offersResponse = await fetch(offersUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!offersResponse.ok) {
        const errorText = await offersResponse.text();
        if (__DEV__) {
          console.error('❌ Failed to fetch offers:', offersResponse.status);
          console.error('Error details:', errorText);
        }
        
        // If 500 error or offers endpoint not working, try to get all requests without filter
        if (__DEV__) console.log('⚠️ Falling back to get all requests...');
        return await this.getAllRequestsFallback();
      }

      const offersData = await offersResponse.json();
      
      if (__DEV__) {
        console.log('Offers response:', {
          success: offersData.is_success,
          dataLength: offersData.data?.length || 0
        });
      }
      
      if (!offersData.is_success || !offersData.data) {
        if (__DEV__) console.log('ℹ️ No offers data in response');
        return [];
      }

      // Filter offers by technicianId (client-side filter since backend returns all)
      const technicianOffers = offersData.data.filter(
        (offer: any) => offer.technicianId === technicianId || offer.TechnicianId === technicianId
      );

      if (technicianOffers.length === 0) {
        if (__DEV__) console.log('ℹ️ No offers found for this technician');
        return [];
      }

      if (__DEV__) console.log(`✅ Found ${technicianOffers.length} offers for technician (filtered from ${offersData.data.length} total)`);

      // Step 2: Get unique service request IDs from technician's offers
      const requestIds = [...new Set(technicianOffers.map((offer: any) => offer.serviceRequestId || offer.ServiceRequestId))];
      
      if (__DEV__) console.log(`📋 Fetching ${requestIds.length} unique service requests`);

      // Step 3: Fetch each service request
      const requests: ServiceRequestResponse[] = [];
      
      for (const requestId of requestIds) {
        try {
          const requestResponse = await apiService.get<ServiceRequestResponse>(
            `${API_ENDPOINTS.SERVICE_REQUESTS.GET_USER_REQUESTS}/${requestId}`,
            undefined,
            { requireAuth: true }
          );

          if (requestResponse.is_success && requestResponse.data) {
            requests.push(requestResponse.data);
          }
        } catch (error: any) {
          if (__DEV__) console.warn(`⚠️ Failed to fetch request ${requestId}:`, error.message);
          // Continue with other requests
        }
      }

      if (__DEV__) console.log(`✅ Loaded ${requests.length} service requests for technician`);
      
      return requests;
    } catch (error: any) {
      if (__DEV__) console.error('❌ Get technician requests error:', error);
      // Try fallback method
      return await this.getAllRequestsFallback();
    }
  }

  /**
   * Fallback method: Get all requests without filtering
   * Used when offers endpoint fails
   */
  private async getAllRequestsFallback(): Promise<ServiceRequestResponse[]> {
    try {
      if (__DEV__) console.log('🔄 Using fallback: fetching all requests...');
      
      const response = await apiService.get<ServiceRequestResponse[]>(
        API_ENDPOINTS.SERVICE_REQUESTS.GET_USER_REQUESTS,
        undefined,
        { requireAuth: true }
      );

      if (response.is_success && response.data) {
        if (__DEV__) console.log(`✅ Fallback loaded ${response.data.length} requests`);
        return response.data;
      }
      
      return [];
    } catch (error: any) {
      if (__DEV__) console.error('❌ Fallback also failed:', error);
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

  /**
   * Filter service requests by location (for technicians)
   * @param lat - Latitude of technician's location
   * @param lng - Longitude of technician's location
   * @param radius - Search radius in kilometers (default: 7km)
   */
  public async filterServiceRequests(
    lat: number,
    lng: number,
    radius: number = 7
  ): Promise<ServiceRequestResponse[]> {
    try {
      // Backend expects lowercase params (see ServiceRequestController.cs line 68)
      const response = await apiService.get<ServiceRequestResponse[]>(
        API_ENDPOINTS.SERVICE_REQUESTS.FILTER,
        { lat, lng, radius },
        { requireAuth: true }
      );

      if (response.is_success && response.data) {
        if (__DEV__) console.log('Filtered service requests:', response.data.length, 'items');
        return response.data;
      } else {
        if (__DEV__) console.warn('Filter API returned unsuccessful response:', response.message);
        return [];
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('Filter service requests error:', {
          status: error.status_code,
          message: error.message,
          lat,
          lng,
          radius
        });
      }
      // Return empty array on error to prevent crashes
      return [];
    }
  }
}

// Export singleton instance
export const serviceRequestService = ServiceRequestService.getInstance();