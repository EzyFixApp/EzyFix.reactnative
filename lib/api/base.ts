/**
 * Base HTTP Service for API communication
 * Handles common HTTP operations, token management, and error handling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../logger';
import { 
  API_BASE_URL, 
  DEFAULT_HEADERS, 
  REQUEST_TIMEOUT, 
  STORAGE_KEYS 
} from './config';
import type { 
  ApiResponse, 
  ApiError, 
  RequestConfig, 
  RequestOptions 
} from '../../types/api';

export class BaseApiService {
  private static instance: BaseApiService;
  private baseURL: string;

  private constructor() {
    this.baseURL = API_BASE_URL;
  }

  public static getInstance(): BaseApiService {
    if (!BaseApiService.instance) {
      BaseApiService.instance = new BaseApiService();
    }
    return BaseApiService.instance;
  }

  /**
   * Get stored access token
   */
  private async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      logger.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get stored refresh token
   */
  private async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      logger.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Create authorization headers
   */
  private async createAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    
    if (__DEV__ && token) {
      // Only log first and last 10 characters for security
      const maskedToken = `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
      console.log('Auth token available:', maskedToken);
    } else if (__DEV__) {
      console.warn('No auth token available for request');
    }
    
    return token 
      ? { 'Authorization': `Bearer ${token}` }
      : {};
  }

  /**
   * Build complete request URL
   */
  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.baseURL);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    
    let data: any;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw this.createApiError(response.status, data);
    }

    // If the response is already in ApiResponse format, return as is
    if (data && typeof data === 'object' && 'is_success' in data) {
      return data as ApiResponse<T>;
    }

    // Otherwise, wrap the response in our standard format
    return {
      status_code: response.status,
      message: 'Success',
      reason: null,
      is_success: true,
      data: data as T
    };
  }

  /**
   * Create standardized API error
   */
  private createApiError(status: number, data: any): ApiError {
    if (data && typeof data === 'object' && 'message' in data) {
      return {
        status_code: status,
        message: data.message || 'An error occurred',
        reason: data.reason || null,
        data: data.data || null
      };
    }

    return {
      status_code: status,
      message: typeof data === 'string' ? data : 'An error occurred',
      reason: undefined,
      data: null
    };
  }

  /**
   * Generic request method
   */
  public async request<T>(
    config: RequestConfig, 
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { requireAuth = false, retryOnUnauthorized = true } = options;
    
    try {
      // Build headers
      let headers = { ...DEFAULT_HEADERS, ...config.headers };
      
      if (requireAuth) {
        const authHeaders = await this.createAuthHeaders();
        headers = { ...headers, ...authHeaders };
      }

      // Build URL
      const url = this.buildURL(config.url, config.params);

      // Prepare fetch options
      const fetchOptions: RequestInit = {
        method: config.method,
        headers,
      };

      // Add timeout using Promise.race instead of AbortSignal.timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timeout'));
        }, config.timeout || REQUEST_TIMEOUT);
      });

      // Add body for non-GET requests
      if (config.data && config.method !== 'GET') {
        fetchOptions.body = JSON.stringify(config.data);
      }

      // Make request with timeout
      const fetchPromise = fetch(url, fetchOptions);
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      return await this.handleResponse<T>(response);

    } catch (error: any) {
      // Handle specific error types
      if (error.message === 'Request timeout') {
        throw this.createApiError(408, 'Request timeout');
      }

      if (error.status === 401 && retryOnUnauthorized && requireAuth) {
        // Try to refresh token and retry
        // This would be implemented in AuthService
        logger.warn('Unauthorized request - token may need refresh');
      }

      // Re-throw ApiError instances
      if (error.status_code) {
        throw error;
      }

      // Handle network errors
      throw this.createApiError(0, error.message || 'Network error');
    }
  }

  /**
   * GET request
   */
  public async get<T>(
    endpoint: string, 
    params?: Record<string, any>, 
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      url: endpoint,
      method: 'GET',
      params
    }, options);
  }

  /**
   * POST request
   */
  public async post<T>(
    endpoint: string, 
    data?: any, 
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      url: endpoint,
      method: 'POST',
      data
    }, options);
  }

  /**
   * PUT request
   */
  public async put<T>(
    endpoint: string, 
    data?: any, 
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      url: endpoint,
      method: 'PUT',
      data
    }, options);
  }

  /**
   * DELETE request
   */
  public async delete<T>(
    endpoint: string, 
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      url: endpoint,
      method: 'DELETE'
    }, options);
  }
}

// Export singleton instance
export const apiService = BaseApiService.getInstance();