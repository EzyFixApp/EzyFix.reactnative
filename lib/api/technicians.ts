/**
 * Technicians API
 * Handles technician information retrieval
 */

import { apiService } from './base';
import { API_BASE_URL } from './config';
import { authService } from './auth';

export interface TechnicianResponse {
  technicianId: string;
  userId: string;
  specialization?: string;
  experience?: number;
  rating?: number;
  status?: string;
  user?: {
    userId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
  };
}

export class TechniciansService {
  private static instance: TechniciansService;

  public static getInstance(): TechniciansService {
    if (!TechniciansService.instance) {
      TechniciansService.instance = new TechniciansService();
    }
    return TechniciansService.instance;
  }

  /**
   * Get technician details by ID
   */
  public async getTechnicianById(technicianId: string): Promise<TechnicianResponse> {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      if (__DEV__) console.log('🔍 [Technicians] Fetching technician:', technicianId);

      const response = await fetch(
        `${API_BASE_URL}/api/v1/technicians/${technicianId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Get technician failed: ${response.status} - ${errorData}`);
      }

      const result = await response.json();

      if (result.is_success && result.data) {
        if (__DEV__) {
          console.log('✅ [Technicians] Technician data:', {
            technicianId: result.data.technicianId,
            firstName: result.data.user?.firstName,
            lastName: result.data.user?.lastName,
          });
        }
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to get technician');
      }
    } catch (error: any) {
      if (__DEV__) console.error('❌ [Technicians] Get technician error:', error);
      throw error;
    }
  }

  /**
   * Get technician full name
   */
  public async getTechnicianName(technicianId: string): Promise<string> {
    try {
      const technician = await this.getTechnicianById(technicianId);
      
      if (technician.user) {
        const firstName = technician.user.firstName || '';
        const lastName = technician.user.lastName || '';
        const fullName = `${lastName} ${firstName}`.trim();
        
        if (__DEV__) console.log('✅ [Technicians] Full name:', fullName);
        
        return fullName || 'Thợ được phân công';
      }
      
      return 'Thợ được phân công';
    } catch (error) {
      if (__DEV__) console.error('❌ [Technicians] Get name error:', error);
      return 'Thợ được phân công';
    }
  }
}

// Export singleton instance
export const techniciansService = TechniciansService.getInstance();
