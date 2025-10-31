/**
 * Reviews API Service
 * Handles review/feedback operations for completed appointments
 */

import { apiService } from './base';
import { API_ENDPOINTS } from './config';

export interface CreateReviewRequest {
  appointmentId: string;
  providerId: string;
  ratingOverall: number; // 1-5
  comment: string;
}

export interface ReviewResponse {
  reviewId: string;
  appointmentId: string;
  providerId: string;
  customerId: string;
  ratingOverall: number;
  comment: string;
  reviewDate: string;
  reviewer: string;
}

export interface ApiResponse<T> {
  is_success: boolean;
  message: string;
  data: T;
  status_code: number;
}

export class ReviewService {
  private static instance: ReviewService;

  public static getInstance(): ReviewService {
    if (!ReviewService.instance) {
      ReviewService.instance = new ReviewService();
    }
    return ReviewService.instance;
  }

  /**
   * Create a new review for a completed appointment
   */
  public async createReview(reviewData: CreateReviewRequest): Promise<ReviewResponse> {
    try {
      console.log('📝 [ReviewService] Creating review:', reviewData);

      const response = await apiService.post<ReviewResponse>(
        '/api/v1/review',
        reviewData,
        { requireAuth: true }
      );

      if (response.is_success && response.data) {
        console.log('✅ [ReviewService] Review created successfully:', response.data.reviewId);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create review');
      }
    } catch (error: any) {
      console.error('❌ [ReviewService] Create review error:', error);
      throw error;
    }
  }

  /**
   * Get all reviews for current user (customer's reviews)
   * This is the safe API that doesn't require special permissions
   */
  public async getMyReviews(): Promise<ReviewResponse[]> {
    try {
      console.log('🔍 [ReviewService] Fetching all reviews for current user');

      const response = await apiService.get<ReviewResponse[]>(
        '/api/v1/review',
        {},
        { requireAuth: true }
      );

      if (response.is_success && response.data) {
        console.log('✅ [ReviewService] Found', response.data.length, 'reviews');
        return response.data;
      } else {
        console.log('ℹ️ [ReviewService] No reviews found');
        return [];
      }
    } catch (error: any) {
      console.error('❌ [ReviewService] Get reviews error:', error);
      // Return empty array on error to not block UI
      return [];
    }
  }

  /**
   * Get review by appointment ID (for customers - uses list API)
   * This method lists all reviews and finds the one matching the appointmentId
   */
  public async getReviewByAppointment(appointmentId: string): Promise<ReviewResponse | null> {
    try {
      console.log('🔍 [ReviewService] Fetching review for appointment:', appointmentId);

      // Use the list API instead of direct get to avoid 401 errors
      const allReviews = await this.getMyReviews();
      console.log('📋 [ReviewService] Total reviews:', allReviews.length);
      
      if (allReviews.length > 0) {
        console.log('📋 [ReviewService] All appointment IDs:', allReviews.map(r => r.appointmentId));
      }
      
      // Find review matching this appointment
      const review = allReviews.find(r => r.appointmentId === appointmentId);
      console.log('🔍 [ReviewService] Looking for appointmentId:', appointmentId, 'Found:', !!review);
      
      if (review) {
        console.log('✅ [ReviewService] Review found:', review.reviewId);
        return review;
      } else {
        console.log('ℹ️ [ReviewService] No review found for appointment:', appointmentId);
        return null;
      }
    } catch (error: any) {
      console.error('❌ [ReviewService] Error getting review:', error);
      // Return null on error to not block UI
      return null;
    }
  }

  /**
   * Get review by appointment ID (direct API - for technicians/admin only)
   * Use getReviewByAppointment() instead for customers
   */
  public async getReviewByAppointmentDirect(appointmentId: string): Promise<ReviewResponse | null> {
    try {
      console.log('🔍 [ReviewService] Fetching review directly for appointment:', appointmentId);

      const response = await apiService.get<ReviewResponse>(
        `/api/v1/review/${appointmentId}`,
        {},
        { requireAuth: true }
      );

      if (response.is_success && response.data) {
        console.log('✅ [ReviewService] Review found:', response.data.reviewId);
        return response.data;
      } else {
        console.log('ℹ️ [ReviewService] No review found for appointment:', appointmentId);
        return null;
      }
    } catch (error: any) {
      // 404 is expected when no review exists yet
      if (error.status_code === 404) {
        console.log('ℹ️ [ReviewService] No review found (404):', appointmentId);
        return null;
      }
      
      // 401 means no permission (technician/admin only endpoint)
      if (error.status_code === 401) {
        console.log('⚠️ [ReviewService] Got 401 - user does not have permission for direct access');
        return null;
      }
      
      console.error('❌ [ReviewService] Unexpected error getting review:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const reviewService = ReviewService.getInstance();
