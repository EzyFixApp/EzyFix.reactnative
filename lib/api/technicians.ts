/**
 * Technicians API
 * Handles technician profile and information retrieval
 */

import { apiService } from './base';
import { API_BASE_URL } from './config';
import { authService } from './auth';
import type { TechnicianProfile, TechnicianProfileResponse } from '~/types/api';

export class TechniciansService {
  private static instance: TechniciansService;

  public static getInstance(): TechniciansService {
    if (!TechniciansService.instance) {
      TechniciansService.instance = new TechniciansService();
    }
    return TechniciansService.instance;
  }

  /**
   * Get technician profile by user ID
   * @param userId - The user ID of the technician
   * @returns Technician profile with reviews and stats
   */
  public async getTechnicianProfile(userId: string): Promise<TechnicianProfile> {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      if (__DEV__) console.log('🔍 [Technicians] Fetching profile for user:', userId);

      const response = await fetch(
        `${API_BASE_URL}/api/v1/technicians/${userId}`,
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
        throw new Error(`Get technician profile failed: ${response.status} - ${errorData}`);
      }

      const result: TechnicianProfileResponse = await response.json();

      if (result.is_success && result.data) {
        if (__DEV__) {
          console.log('✅ [Technicians] Profile loaded:', {
            name: `${result.data.firstName} ${result.data.lastName}`,
            rating: result.data.averageRating,
            reviews: result.data.totalReviews,
            status: result.data.availabilityStatus,
          });
        }
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to get technician profile');
      }
    } catch (error: any) {
      if (__DEV__) console.error('❌ [Technicians] Get profile error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const techniciansService = TechniciansService.getInstance();
