/**
 * Services Service
 * Handles service-related API operations
 */

import { apiService } from './base';
import { API_ENDPOINTS, API_BASE_URL } from './config';
import { logger } from '../logger';
import type {
  Service,
  ServicesResponse,
  Category,
  CategoriesResponse,
  ApiResponse
} from '../../types/api';

export class ServicesService {
  private static instance: ServicesService;

  private constructor() {}

  public static getInstance(): ServicesService {
    if (!ServicesService.instance) {
      ServicesService.instance = new ServicesService();
    }
    return ServicesService.instance;
  }

  /**
   * Get all categories
   */
  public async getAllCategories(): Promise<Category[]> {
    try {
      const response = await apiService.get(
        API_ENDPOINTS.CATEGORIES.GET_ALL,
        undefined,
        { requireAuth: true }
      ) as ApiResponse<Category[]>;

      // Check if response follows ApiResponse format
      if (response && typeof response === 'object' && 'is_success' in response) {
        if (response.is_success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to fetch categories');
        }
      }
      
      // If response is directly an array of categories
      if (Array.isArray(response)) {
        return response as Category[];
      }

      // If response has different structure, try to extract data
      if (response && typeof response === 'object' && 'data' in response) {
        return ((response as any).data as Category[]) || [];
      }

      throw new Error('Unexpected response format from categories API');

    } catch (error: any) {
      logger.error('Categories API Error:', error);
      throw error;
    }
  }

  /**
   * Get all services
   */
  public async getAllServices(): Promise<Service[]> {
    try {
      const response = await apiService.get(
        '/api/v1/services',
        undefined,
        { requireAuth: true }
      ) as ApiResponse<Service[]>;

      // Check if response follows ApiResponse format
      if (response && typeof response === 'object' && 'is_success' in response) {
        if (response.is_success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to fetch services');
        }
      }
      
      // If response is directly an array of services
      if (Array.isArray(response)) {
        return response as Service[];
      }

      // If response has different structure, try to extract data
      if (response && typeof response === 'object' && 'data' in response) {
        return ((response as any).data as Service[]) || [];
      }

      throw new Error('Unexpected response format from services API');

    } catch (error: any) {
      logger.error('Services API Error:', error);
      throw error;
    }
  }

  /**
   * Get service by ID
   */
  public async getServiceById(serviceId: string): Promise<Service> {
    try {
      const response = await apiService.get(
        `${API_ENDPOINTS.SERVICES.GET_BY_ID}/${serviceId}`,
        undefined,
        { requireAuth: true }
      ) as ApiResponse<Service>;

      if (response.is_success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch service');
      }
    } catch (error: any) {
      logger.error('Get service by ID error:', error);
      throw error;
    }
  }

  /**
   * Search services by name or category
   */
  public async searchServices(query: string): Promise<Service[]> {
    try {
      const response = await apiService.get(
        `${API_ENDPOINTS.SERVICES.SEARCH}?q=${encodeURIComponent(query)}`,
        undefined,
        { requireAuth: true }
      ) as ApiResponse<Service[]>;

      if (response.is_success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to search services');
      }
    } catch (error: any) {
      logger.error('Search services error:', error);
      throw error;
    }
  }

  /**
   * Get services by category
   */
  public async getServicesByCategory(categoryId: string): Promise<Service[]> {
    try {
      const response = await apiService.get(
        `${API_ENDPOINTS.SERVICES.GET_BY_CATEGORY}/${categoryId}`,
        undefined,
        { requireAuth: true }
      ) as ApiResponse<Service[]>;

      if (response.is_success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch services by category');
      }
    } catch (error: any) {
      logger.error('Get services by category error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const servicesService = ServicesService.getInstance();