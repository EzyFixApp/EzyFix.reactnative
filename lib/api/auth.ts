/**
 * Authentication Service
 * Handles user authentication, token management, and related operations
 * Optimized version without debug logs
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './base';
import { tokenManager } from './tokenManager';
import { logger } from '../logger';
import { API_ENDPOINTS, STORAGE_KEYS, API_BASE_URL } from './config';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  SendOtpRequest,
  SendOtpResponse,
  VerifyAccountRequest,
  VerifyAccountResponse,
  ValidateOtpRequest,
  ValidateOtpResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ChangePasswordRequest,
  UserData,
  UserType,
  ApiResponse
} from '../../types/api';

export class AuthService {
  private static instance: AuthService;

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Login user with email and password
   */
  public async login(loginData: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await apiService.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        loginData
      );

      if (response.is_success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Login user with email, password and userType
   */
  public async loginWithUserType(loginData: LoginRequest, userType: UserType): Promise<LoginResponse> {
    try {
      const response = await apiService.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        loginData
      );

      if (response.is_success && response.data) {
        await this.storeAuthData(response.data, userType);
        return response.data;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Register a new user
   */
  public async register(registerData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiService.post<RegisterResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        registerData
      );

      if (response.is_success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Send email OTP
   */
  public async sendEmailOtp(otpData: SendOtpRequest): Promise<SendOtpResponse> {
    try {
      const response = await apiService.post<SendOtpResponse>(
        API_ENDPOINTS.EMAIL.SEND_OTP,
        otpData
      );

      if (response.is_success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Verify user account
   */
  public async verifyAccount(verifyData: VerifyAccountRequest): Promise<VerifyAccountResponse> {
    try {
      const response = await apiService.post<VerifyAccountResponse>(
        API_ENDPOINTS.AUTH.VERIFY,
        verifyData
      );

      if (response.is_success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Account verification failed');
      }
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Check OTP validity
   */
  public async checkOtp(validateData: ValidateOtpRequest): Promise<ValidateOtpResponse> {
    try {
      const response = await apiService.post<ValidateOtpResponse>(
        API_ENDPOINTS.OTP.CHECK,
        validateData
      );

      if (response.is_success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'OTP check failed');
      }
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Validate OTP
   */
  public async validateOtp(validateData: ValidateOtpRequest): Promise<ValidateOtpResponse> {
    try {
      const response = await apiService.post<ValidateOtpResponse>(
        API_ENDPOINTS.OTP.VALIDATE,
        validateData
      );

      if (response.is_success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'OTP validation failed');
      }
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Decode JWT token
   */
  private decodeJWT(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      return null;
    }
  }

  /**
   * Store authentication data
   * CRITICAL: Extract role from JWT token, not from parameter
   */
  public async storeAuthData(loginResponse: LoginResponse, userType: UserType): Promise<void> {
    try {
      // IMPORTANT: Clear any old tokens before storing new ones
      // This prevents old refresh tokens from interfering with new login
      await tokenManager.clearTokens();
      
      const { accessToken, refreshToken } = loginResponse;
      
      // Decode JWT to get user info and verification status
      const jwtPayload = this.decodeJWT(accessToken);
      
      if (!jwtPayload) {
        throw new Error('Invalid JWT token');
      }
      
      // CRITICAL: Extract role from JWT token
      // JWT payload should contain role field: "Customer" or "Technician"
      const jwtRole = jwtPayload.role || jwtPayload.Role || jwtPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      
      // Normalize role from JWT to UserType
      let roleFromJWT: UserType;
      if (typeof jwtRole === 'string') {
        const normalizedRole = jwtRole.toLowerCase();
        if (normalizedRole === 'customer') {
          roleFromJWT = 'customer';
        } else if (normalizedRole === 'technician') {
          roleFromJWT = 'technician';
        } else {
          // Fallback to provided userType if JWT role is invalid
          roleFromJWT = userType;
          if (__DEV__) {
            console.warn(`[AuthService] Invalid role in JWT: "${jwtRole}". Using provided userType: "${userType}"`);
          }
        }
      } else {
        // Fallback to provided userType if role not found in JWT
        roleFromJWT = userType;
        if (__DEV__) {
          console.warn('[AuthService] Role not found in JWT. Using provided userType:', userType);
        }
      }
      
      let isVerify = false;
      if (jwtPayload) {
        try {
          isVerify = jwtPayload.isVerify || false;
        } catch (jwtError) {
          // Silently handle JWT decode error
        }
      }
      
      // Create user data object with role from JWT
      const userData: UserData = {
        id: loginResponse.id || jwtPayload?.id || '',
        email: loginResponse.email || jwtPayload?.email || '',
        fullName: loginResponse.fullName || jwtPayload?.fullName || '',
        avatarLink: loginResponse.avatarLink || jwtPayload?.avatarLink || null,
        isVerify: isVerify,
        userType: roleFromJWT, // Use role from JWT
        phoneNumber: loginResponse.phoneNumber || jwtPayload?.phoneNumber || '',
        // Split fullName thành firstName và lastName
        firstName: this.extractFirstName(loginResponse.fullName || jwtPayload?.fullName || ''),
        lastName: this.extractLastName(loginResponse.fullName || jwtPayload?.fullName || '')
      };

      // Store all data in AsyncStorage
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData)),
        AsyncStorage.setItem(STORAGE_KEYS.USER_TYPE, roleFromJWT) // Use role from JWT
      ]);
    } catch (error) {
      throw new Error('Failed to store authentication data');
    }
  }

  /**
   * Get user data from storage
   */
  public async getUserData(): Promise<UserData | null> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update user verification status
   */
  public async updateUserVerificationStatus(isVerify: boolean): Promise<void> {
    try {
      const userData = await this.getUserData();
      if (userData) {
        userData.isVerify = isVerify;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      }
    } catch (error) {
      // Silently handle error
    }
  }

  /**
   * Get access token
   */
  public async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  public async isAuthenticated(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      return !!token;
    } catch (error) {
      return false;
    }
  }

  /**
   * Refresh access token
   */
  public async refreshToken(): Promise<string> {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiService.post<RefreshTokenResponse>(
        API_ENDPOINTS.AUTH.REFRESH_TOKEN,
        { refreshToken }
      );

      if (response.is_success && response.data) {
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.data.accessToken);
        return response.data.accessToken;
      } else {
        throw new Error(response.message || 'Token refresh failed');
      }
    } catch (error: any) {
      await this.clearAuthData();
      throw error;
    }
  }

  /**
   * Logout user with proper DELETE refresh token API
   */
  public async logout(): Promise<void> {
    try {
      const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      // Step 1: Call backend to invalidate refresh token
      if (accessToken && refreshToken) {
        try {
          logger.info('🚪 Calling DELETE refresh token API...');
          
          // Backend expects refreshToken as query parameter, not body
          const url = `${API_BASE_URL}${API_ENDPOINTS.AUTH.DELETE_REFRESH_TOKEN}?refreshToken=${encodeURIComponent(refreshToken)}`;
          
          // Use fetch directly to avoid interceptor complications during logout
          const response = await fetch(url, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
          });
          
          if (response.ok) {
            logger.info('✅ Refresh token deleted successfully on server');
          } else {
            const errorText = await response.text();
            logger.warn('⚠️ Failed to delete refresh token on server:', response.status, errorText);
          }
        } catch (error) {
          logger.error('❌ Error calling delete refresh token API:', error);
          // Continue with local cleanup even if API fails
        }
      }
    } catch (error) {
      logger.error('❌ Logout error:', error);
    } finally {
      // Step 2: Always clear local data regardless of server response
      await this.clearAuthData();
      await tokenManager.clearTokens();
      logger.info('✅ Local auth data cleared');
    }
  }

  /**
   * Clear all authentication data
   */
  public async clearAuthData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_TYPE)
      ]);
    } catch (error) {
      // Silently handle error
    }
  }

  /**
   * Send OTP for password reset
   */
  public async sendOtp(otpData: SendOtpRequest): Promise<SendOtpResponse> {
    try {
      const response = await apiService.post<SendOtpResponse>(
        API_ENDPOINTS.EMAIL.SEND_OTP,
        otpData
      );

      if (response.is_success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Change password
   */
  public async changePassword(changeData: ChangePasswordRequest): Promise<void> {
    try {
      const response = await apiService.post(
        API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
        changeData
      );

      if (!response.is_success) {
        throw new Error(response.message || 'Failed to change password');
      }
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Forgot password - send reset email
   */
  public async forgotPassword(forgotData: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    try {
      const response = await apiService.post<ForgotPasswordResponse>(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        forgotData
      );

      if (response.is_success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to send reset password email');
      }
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Set user type
   */
  public async setUserType(userType: UserType): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TYPE, userType);
      
      // Also update user data
      const userData = await this.getUserData();
      if (userData) {
        userData.userType = userType;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      }
    } catch (error) {
      // Silently handle error
    }
  }

  /**
   * Get user type
   */
  public async getUserType(): Promise<UserType | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_TYPE) as UserType | null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Helper method để extract firstName từ fullName
   */
  private extractFirstName(fullName: string): string {
    if (!fullName || !fullName.trim()) return '';
    const nameParts = fullName.trim().split(/\s+/); // Split by any whitespace
    return nameParts[0] || '';
  }

  /**
   * Helper method để extract lastName từ fullName
   * Cải thiện để handle các edge cases
   */
  private extractLastName(fullName: string): string {
    if (!fullName || !fullName.trim()) return '';
    const nameParts = fullName.trim().split(/\s+/); // Split by any whitespace
    if (nameParts.length <= 1) {
      // Nếu chỉ có 1 từ, có thể là backend concat sai
      // Thử một số heuristics để tách tên
      const singleName = nameParts[0];
      
      // Nếu tên có ký tự viết hoa ở giữa (VD: "NguyenVan")
      const camelCaseMatch = singleName.match(/^([A-Z][a-z]+)([A-Z][a-z]+.*)$/);
      if (camelCaseMatch) {
        return camelCaseMatch[2];
      }
      
      return '';
    }
    // Lấy tất cả parts từ thứ 2 trở đi làm lastName
    return nameParts.slice(1).join(' ');
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();