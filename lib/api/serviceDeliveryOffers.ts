/**
 * Service Delivery Offers API
 * Handles quote submission, acceptance, and rejection
 */

import { apiService } from './base';
import { API_BASE_URL } from './config';
import { authService } from './auth';

export interface ServiceDeliveryOfferRequest {
  serviceRequestId: string;
  // technicianId is NOT needed - backend gets it from JWT token
  estimatedCost?: number; // For estimated quotes (default 0 if not provided)
  finalCost?: number;     // For final quotes (default 0 if not provided)
  notes?: string;         // Required for estimated quotes, optional for final
}

export interface ServiceDeliveryOfferResponse {
  offerId: string;  // Backend uses lowercase 'offerId'
  serviceRequestId: string;
  technicianId: string;
  estimatedCost?: number;
  finalCost?: number;
  submitDate: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  notes?: string;
  appointmentId?: string; // ID of created appointment (when status is ACCEPTED and appointment created)
  // Backend might include technician details in response
  technician?: {
    technicianId: string;
    userId: string;
    technicianName?: string; // NEW: Full name from API
    technicianAvatar?: string; // NEW: Avatar URL from API
    technicianRating?: number; // NEW: Rating from API
    firstName?: string;
    lastName?: string;
    user?: {
      firstName: string;
      lastName: string;
      email?: string;
      phoneNumber?: string;
    };
  };
}

export class ServiceDeliveryOffersService {
  private static instance: ServiceDeliveryOffersService;

  public static getInstance(): ServiceDeliveryOffersService {
    if (!ServiceDeliveryOffersService.instance) {
      ServiceDeliveryOffersService.instance = new ServiceDeliveryOffersService();
    }
    return ServiceDeliveryOffersService.instance;
  }

  /**
   * Submit a quote (estimated or final)
   */
  public async submitQuote(quoteData: ServiceDeliveryOfferRequest): Promise<ServiceDeliveryOfferResponse> {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      // Validate quote data
      if (!quoteData.estimatedCost && !quoteData.finalCost) {
        throw new Error('Either estimatedCost or finalCost must be provided');
      }

      if (quoteData.estimatedCost && !quoteData.notes) {
        throw new Error('Notes are required for estimated quotes');
      }

      // Backend expects PascalCase (TechnicianId comes from JWT token, not from request body)
      const backendData = {
        ServiceRequestId: quoteData.serviceRequestId, // PascalCase
        EstimatedCost: quoteData.estimatedCost || 0, // Must be number, not null
        FinalCost: quoteData.finalCost || 0,         // Must be number, not null
        Notes: quoteData.notes || ''                 // PascalCase
      };

      const jsonBody = JSON.stringify(backendData);

      if (__DEV__) {
        console.log('📤 Submitting quote:', {
          ServiceRequestId: backendData.ServiceRequestId,
          type: quoteData.estimatedCost ? 'estimated' : 'final',
          amount: quoteData.estimatedCost || quoteData.finalCost,
          EstimatedCost: backendData.EstimatedCost,
          FinalCost: backendData.FinalCost,
          jsonBody: jsonBody  // Log the actual JSON string being sent
        });
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/serviceDeliveryOffers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: jsonBody,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Submit quote failed: ${response.status} - ${errorData}`);
      }

      const result = await response.json();

      if (result.is_success && result.data) {
        if (__DEV__) console.log('✅ Quote submitted successfully:', result.data.offerID);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to submit quote');
      }
    } catch (error: any) {
      if (__DEV__) console.error('❌ Submit quote error:', error);
      throw error;
    }
  }

  /**
   * Accept a quote (Customer action)
   */
  public async acceptQuote(offerId: string): Promise<ServiceDeliveryOfferResponse> {
    try {
      if (__DEV__) console.log('🔍 Accepting quote with offerID:', offerId);
      
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const url = `${API_BASE_URL}/api/v1/serviceDeliveryOffers/${offerId}/accept`;
      if (__DEV__) console.log('🌐 Accept URL:', url);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Accept quote failed: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      
      if (__DEV__) console.log('📥 Accept response:', result);

      // Backend returns { is_success, data, message }
      if (result.is_success) {
        if (__DEV__) console.log('✅ Quote accepted:', offerId);
        return result.data || result; // Return data if exists, otherwise whole result
      } else {
        throw new Error(result.message || 'Failed to accept quote');
      }
    } catch (error: any) {
      if (__DEV__) console.error('❌ Accept quote error:', error);
      throw error;
    }
  }

  /**
   * Reject a quote (Customer action)
   */
  public async rejectQuote(offerId: string): Promise<ServiceDeliveryOfferResponse> {
    try {
      if (__DEV__) console.log('🔍 Rejecting quote with offerID:', offerId);
      
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const url = `${API_BASE_URL}/api/v1/serviceDeliveryOffers/${offerId}/reject`;
      if (__DEV__) console.log('🌐 Reject URL:', url);

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Reject quote failed: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      
      if (__DEV__) console.log('📥 Reject response:', result);

      // Backend returns { is_success, data, message }
      if (result.is_success) {
        if (__DEV__) console.log('✅ Quote rejected:', offerId);
        return result.data || result; // Return data if exists, otherwise whole result
      } else {
        throw new Error(result.message || 'Failed to reject quote');
      }
    } catch (error: any) {
      if (__DEV__) console.error('❌ Reject quote error:', error);
      throw error;
    }
  }

  /**
   * Get pending offers for a service request (Customer view)
   */
  public async getPendingOffers(serviceRequestId: string): Promise<ServiceDeliveryOfferResponse[]> {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/serviceDeliveryOffers?ServiceRequestId=${serviceRequestId}&Status=PENDING`,
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
        throw new Error(`Get pending offers failed: ${response.status} - ${errorData}`);
      }

      const result = await response.json();

      if (result.is_success && result.data) {
        if (__DEV__) {
          console.log(`✅ Found ${result.data.length} pending offers for request ${serviceRequestId}`);
          if (result.data.length > 0) {
            console.log('📋 First offer structure:', JSON.stringify(result.data[0], null, 2));
          }
        }
        return result.data;
      } else {
        // Return empty array if no offers found
        return [];
      }
    } catch (error: any) {
      if (__DEV__) console.error('❌ Get pending offers error:', error);
      // Return empty array instead of throwing to prevent breaking UI
      return [];
    }
  }

  /**
   * Get a specific offer by ID (Technician view)
   */
  public async getOfferById(offerId: string): Promise<ServiceDeliveryOfferResponse> {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      const response = await fetch(
        `${API_BASE_URL}/api/v1/serviceDeliveryOffers/${offerId}`,
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
        throw new Error(`Get offer failed: ${response.status} - ${errorData}`);
      }

      const result = await response.json();

      if (result.is_success && result.data) {
        if (__DEV__) {
          console.log(`✅ Found offer ${offerId}:`, {
            status: result.data.status,
            estimatedCost: result.data.estimatedCost,
            finalCost: result.data.finalCost,
            appointmentId: result.data.appointmentId
          });
        }
        return result.data;
      } else {
        throw new Error(result.message || 'Offer not found');
      }
    } catch (error: any) {
      if (__DEV__) console.error('❌ Get offer by ID error:', error);
      throw error;
    }
  }

  /**
   * Get all offers for a service request (any status)
   */
  public async getAllOffers(serviceRequestId: string): Promise<ServiceDeliveryOfferResponse[]> {
    try {
      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      // Call without Status filter to get ALL offers
      const response = await fetch(
        `${API_BASE_URL}/api/v1/serviceDeliveryOffers?ServiceRequestId=${serviceRequestId}`,
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
        throw new Error(`Get all offers failed: ${response.status} - ${errorData}`);
      }

      const result = await response.json();

      if (result.is_success && result.data) {
        if (__DEV__) {
          console.log(`✅ Found ${result.data.length} total offers for request ${serviceRequestId}`);
          if (result.data.length > 0) {
            console.log('📋 Offers:', result.data.map((o: any) => ({ 
              offerId: o.offerId, 
              status: o.status, 
              estimatedCost: o.estimatedCost, 
              finalCost: o.finalCost 
            })));
          }
        }
        return result.data;
      } else {
        return [];
      }
    } catch (error: any) {
      if (__DEV__) console.error('❌ Get all offers error:', error);
      return [];
    }
  }

  /**
   * Update final cost for an offer (PRICE_REVIEW flow)
   * PUT /api/v1/serviceDeliveryOffers/{id}/update
   * 
   * Backend requires [FromForm] (NOT JSON!):
   * - ServiceRequestId (Guid)
   * - FinalCost (decimal, must be > 0)
   * - Notes (string, optional)
   */
  public async updateOfferFinalCost(
    offerId: string,
    serviceRequestId: string,
    finalCost: number,
    notes?: string
  ): Promise<ServiceDeliveryOfferResponse> {
    try {
      if (__DEV__) console.log('💰 Updating final cost for offer:', {
        offerId,
        serviceRequestId,
        finalCost,
        notes
      });

      const token = await authService.getAccessToken();
      if (!token) {
        throw new Error('No access token available');
      }

      // Validate finalCost > 0 (backend requirement)
      if (finalCost <= 0) {
        throw new Error('Final cost must be greater than 0');
      }

      // Backend expects [FromForm] - use FormData, NOT JSON!
      const formData = new FormData();
      formData.append('ServiceRequestId', serviceRequestId);
      formData.append('FinalCost', finalCost.toString()); // Convert to string for FormData
      if (notes) {
        formData.append('Notes', notes);
      }

      if (__DEV__) console.log('📤 Sending FormData to backend:', {
        ServiceRequestId: serviceRequestId,
        FinalCost: finalCost,
        Notes: notes || ''
      });

      const response = await fetch(
        `${API_BASE_URL}/api/v1/serviceDeliveryOffers/${offerId}/update`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type - let browser set it with boundary for FormData
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        if (__DEV__) console.error('❌ Backend error response:', errorData);
        throw new Error(`Update final cost failed: ${response.status} - ${errorData}`);
      }

      const result = await response.json();

      if (result.is_success && result.data) {
        if (__DEV__) console.log('✅ Final cost updated successfully:', result.data);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to update final cost');
      }
    } catch (error: any) {
      if (__DEV__) console.error('❌ Update final cost error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const serviceDeliveryOffersService = ServiceDeliveryOffersService.getInstance();
