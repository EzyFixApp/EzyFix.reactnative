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
import { tokenManager } from './tokenManager';
import type { 
  ApiResponse, 
  ApiError, 
  RequestConfig, 
  RequestOptions 
} from '../../types/api';

export class BaseApiService {
  private static instance: BaseApiService;
  private baseURL: string;
  private isHandlingSessionExpired: boolean = false; // Flag to prevent multiple session expired handlers

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
   * Session expired handler callback
   */
  private onSessionExpiredCallback?: () => void;

  /**
   * Set callback for session expired event
   */
  public setOnSessionExpired(callback: () => void): void {
    this.onSessionExpiredCallback = callback;
  }

  /**
   * Handle session expired (401 Unauthorized)
   * Prevents multiple simultaneous calls using a flag
   */
  private async handleSessionExpired(): Promise<void> {
    // Prevent multiple simultaneous session expired handlers
    if (this.isHandlingSessionExpired) {
      logger.info('⏭️ Session expired handler already running, skipping...');
      return;
    }

    try {
      this.isHandlingSessionExpired = true;
      
      // Clear all auth tokens
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.USER_TYPE,
      ]);
      
      logger.info('✅ Auth tokens cleared after session expiry');
      
      // Trigger callback (will be used to reset auth store and navigate)
      if (this.onSessionExpiredCallback) {
        this.onSessionExpiredCallback();
      }
    } catch (error) {
      logger.error('❌ Error handling session expired:', error);
    } finally {
      // Reset flag after a short delay to allow for race conditions
      setTimeout(() => {
        this.isHandlingSessionExpired = false;
      }, 2000);
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
   * Create authorization headers with automatic token refresh
   */
  private async createAuthHeaders(): Promise<Record<string, string>> {
    try {
      // Get valid token (auto refresh if needed)
      const token = await tokenManager.getValidAccessToken();
      
      // Removed excessive token logging to reduce console spam
      
      return token 
        ? { 'Authorization': `Bearer ${token}` }
        : {};
    } catch (error) {
      logger.error('❌ Error getting valid token - refresh may have failed:', error);
      
      // Token refresh failed → Trigger logout
      await this.handleSessionExpired();
      
      // Return empty headers to let the request fail gracefully
      return {};
    }
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
   * Handle response and parse data
   */
  private async handleResponse<T>(response: Response, skipAutoLogoutOn401: boolean = false): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    
    let data: any;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error = this.createApiError(response.status, data);
      
      // Handle 401 Unauthorized - session expired
      if (response.status === 401 && !skipAutoLogoutOn401) {
        logger.warn('🔒 Session expired (401) - triggering logout');
        // Clear tokens and trigger global logout - DON'T AWAIT to avoid blocking the error throw
        this.handleSessionExpired().catch(err => {
          logger.error('Error handling session expired:', err);
        });
      } else if (response.status === 401 && skipAutoLogoutOn401) {
        logger.warn('🔒 Got 401 but skipAutoLogoutOn401=true - not triggering logout');
      }
      
      throw error;
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
    const { requireAuth = false, retryOnUnauthorized = true, skipAutoLogoutOn401 = false } = options;
    
    // Abort request immediately if session expired is being handled
    if (this.isHandlingSessionExpired && requireAuth) {
      throw this.createApiError(401, 'Session expired - please login again');
    }
    
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
      return await this.handleResponse<T>(response, skipAutoLogoutOn401);

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
   * PATCH request
   */
  public async patch<T>(
    endpoint: string, 
    data?: any, 
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      url: endpoint,
      method: 'PATCH',
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