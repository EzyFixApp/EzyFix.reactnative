/**
 * Authentication Service
 * Handles user authentication, token management, and related operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from './base';
import { API_ENDPOINTS, STORAGE_KEYS } from './config';
import { logger } from '../logger';
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
  ApiResponse
} from '../../types/api';

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

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
        // Store tokens and user data
        await this.storeAuthData(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      // Development logging with useful context
      if (__DEV__) {
        console.group('🌐 API Auth Error');
        console.log('🔗 Endpoint:', API_ENDPOINTS.AUTH.LOGIN);
        console.log('📧 Email:', loginData.email);
        console.log('📊 Status:', error.status_code || 'Network Error');
        
        if (error.status_code === 401) {
          console.log('🔐 Auth Failed: Invalid credentials');
        } else if (error.status_code === 404) {
          console.log('👤 User Not Found');
        } else if (error.status_code === 0) {
          console.log('🌐 Network Error: Cannot reach server');
        } else {
          console.log('❌ Unexpected Error:', error.message);
        }
        console.groupEnd();
      }
      
      throw error;
    }
  }

  /**
   * Register a new user (Step 1: Create account with isVerified: false)
   */
  public async register(registerData: RegisterRequest): Promise<RegisterResponse> {
    try {
      // Development logging for request
      if (__DEV__) {
        console.group('📤 Registration Request');
        console.log('🔗 Endpoint:', API_ENDPOINTS.AUTH.REGISTER);
        console.log('📧 Email:', registerData.email);
        console.log('👤 Name:', `${registerData.firstName} ${registerData.lastName}`);
        console.log('📱 Phone:', registerData.phoneNumber);
        console.log('🎯 User Type:', registerData.userType);
        console.log('✅ Accept Terms:', registerData.acceptTerms);
        console.log('📋 Full Payload:', JSON.stringify(registerData, null, 2));
        console.groupEnd();
      }
      
      const response = await apiService.post<RegisterResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        registerData
      );

      if (response.is_success && response.data) {
        // Development logging
        if (__DEV__) {
          console.group('✅ Registration Response');
          console.log('📧 Email:', registerData.email);
          console.log('👤 Name:', `${registerData.firstName} ${registerData.lastName}`);
          console.log('📱 Phone:', registerData.phoneNumber);
          console.log('🎯 User Type:', registerData.userType);
          console.log('✅ Is Verified:', response.data.isVerified);
          console.log('📋 Full Response:', JSON.stringify(response, null, 2));
          console.groupEnd();
        }
        
        return response.data;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      // Development logging
      if (__DEV__) {
        console.group('❌ Registration Failed');
        console.log('📧 Email:', registerData.email);
        console.log('📱 Phone:', registerData.phoneNumber);
        console.log('📊 Status:', error.status_code || 'Network Error');
        console.log('💬 Error:', error.message);
        console.log('📋 Full Error:', JSON.stringify(error, null, 2));
        console.groupEnd();
      }
      
      throw error;
    }
  }

  /**
   * Send email OTP (Step 2: for registration or password reset)
   */
  public async sendEmailOtp(otpData: SendOtpRequest): Promise<SendOtpResponse> {
    try {
      const response = await apiService.post<SendOtpResponse>(
        API_ENDPOINTS.EMAIL.SEND_OTP,
        otpData
      );

      if (response.is_success && response.data) {
        // Development logging
        if (__DEV__) {
          console.group('📧 OTP Sent');
          console.log('📧 Email:', otpData.email);
          console.log('🎯 Purpose:', otpData.purpose);
          console.log('💬 Message:', response.data.message);
          console.groupEnd();
        }
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      // Development logging
      if (__DEV__) {
        console.group('❌ OTP Send Failed');
        console.log('📧 Email:', otpData.email);
        console.log('📊 Status:', error.status_code || 'Network Error');
        console.log('💬 Error:', error.message);
        console.groupEnd();
      }
      
      throw error;
    }
  }

  /**
   * Verify account with OTP (Step 3: for registration completion)
   */
  public async verifyAccount(verifyData: VerifyAccountRequest): Promise<VerifyAccountResponse> {
    try {
      const response = await apiService.post<VerifyAccountResponse>(
        API_ENDPOINTS.AUTH.VERIFY,
        verifyData
      );

      if (response.is_success && response.data) {
        // Development logging
        if (__DEV__) {
          console.group('✅ Account Verified');
          console.log('📧 Email:', verifyData.email);
          console.log('✨ Verified:', response.data.isVerified);
          console.groupEnd();
        }
        
        return response.data;
      } else {
        throw new Error(response.message || 'Account verification failed');
      }
    } catch (error: any) {
      // Convert errors to Vietnamese
      let vietnameseError = { ...error };
      
      if (error.message) {
        const message = error.message.toLowerCase();
        if (message.includes('invalid') || message.includes('incorrect') || message.includes('wrong')) {
          vietnameseError.reason = 'Mã OTP không chính xác';
        } else if (message.includes('expired') || message.includes('expire')) {
          vietnameseError.reason = 'Mã OTP đã hết hạn';
        } else if (message.includes('verification failed') || message.includes('failed')) {
          vietnameseError.reason = 'Xác thực thất bại';
        }
      }
      
      if (error.status_code) {
        switch (error.status_code) {
          case 400:
            vietnameseError.reason = 'Mã OTP không hợp lệ';
            break;
          case 401:
            vietnameseError.reason = 'Mã OTP không chính xác';
            break;
          case 404:
            vietnameseError.reason = 'Không tìm thấy thông tin';
            break;
          case 500:
            vietnameseError.reason = 'Lỗi server. Vui lòng thử lại sau';
            break;
        }
      }
      
      // Only log in development, never in production
      if (__DEV__) {
        console.group('❌ Account Verification Failed');
        console.log('� Email:', verifyData.email);
        console.log('📊 Status:', error.status_code || 'Network Error');
        console.log('💬 Vietnamese Error:', vietnameseError.reason);
        console.groupEnd();
      }
      
      throw vietnameseError;
    }
  }

  /**
   * Validate OTP (for forgot password flow)
   */
  public async validateOtp(validateData: ValidateOtpRequest): Promise<ValidateOtpResponse> {
    try {
      const response = await apiService.post<ValidateOtpResponse>(
        API_ENDPOINTS.OTP.VALIDATE,
        validateData
      );

      if (response.is_success && response.data) {
        // Development logging
        if (__DEV__) {
          console.group('✅ OTP Validated');
          console.log('📧 Email:', validateData.email);
          console.log('🎯 Purpose:', validateData.purpose);
          console.log('✨ Valid:', response.data.isValid);
          console.groupEnd();
        }
        
        return response.data;
      } else {
        throw new Error(response.message || 'OTP validation failed');
      }
    } catch (error: any) {
      // Convert errors to Vietnamese
      let vietnameseError = { ...error };
      
      if (error.message) {
        const message = error.message.toLowerCase();
        if (message.includes('invalid') || message.includes('incorrect') || message.includes('wrong')) {
          vietnameseError.reason = 'Mã OTP không chính xác';
        } else if (message.includes('expired') || message.includes('expire')) {
          vietnameseError.reason = 'Mã OTP đã hết hạn';
        } else if (message.includes('validation failed') || message.includes('failed')) {
          vietnameseError.reason = 'Xác thực thất bại';
        }
      }
      
      if (error.status_code) {
        switch (error.status_code) {
          case 400:
            vietnameseError.reason = 'Mã OTP không hợp lệ';
            break;
          case 401:
            vietnameseError.reason = 'Mã OTP không chính xác';
            break;
          case 404:
            vietnameseError.reason = 'Không tìm thấy thông tin';
            break;
          case 500:
            vietnameseError.reason = 'Lỗi server. Vui lòng thử lại sau';
            break;
        }
      }
      
      // Only log in development, never in production
      if (__DEV__) {
        console.group('❌ OTP Validation Failed');
        console.log('� Email:', validateData.email);
        console.log('📊 Status:', error.status_code || 'Network Error');
        console.log('💬 Vietnamese Error:', vietnameseError.reason);
        console.groupEnd();
      }
      
      throw vietnameseError;
    }
  }

  /**
   * Reset password with validated OTP (final step of forgot password)
   */
  public async forgotPassword(resetData: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    try {
      const response = await apiService.post<ForgotPasswordResponse>(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        resetData
      );

      if (response.is_success && response.data) {
        // Development logging
        if (__DEV__) {
          console.group('✅ Password Reset Successful');
          console.log('📧 Email:', resetData.email);
          console.log('💬 Message:', response.data.message);
          console.groupEnd();
        }
        
        return response.data;
      } else {
        throw new Error(response.message || 'Password reset failed');
      }
    } catch (error: any) {
      // Development logging
      if (__DEV__) {
        console.group('❌ Password Reset Failed');
        console.log('📧 Email:', resetData.email);
        console.log('📊 Status:', error.status_code || 'Network Error');
        console.log('💬 Error:', error.message);
        console.groupEnd();
      }
      
      throw error;
    }
  }

  /**
   * Store authentication data in AsyncStorage
   */
  private async storeAuthData(loginResponse: LoginResponse): Promise<void> {
    try {
      const userData: UserData = {
        id: loginResponse.id,
        fullName: loginResponse.fullName,
        email: loginResponse.email,
        avatarLink: loginResponse.avatarLink,
        userType: 'customer' // Default, should be determined based on app flow
      };

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, loginResponse.accessToken),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, loginResponse.refreshToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
      ]);
    } catch (error) {
      logger.error('Error storing auth data:', error);
      throw new Error('Failed to store authentication data');
    }
  }

  /**
   * Get stored user data
   */
  public async getUserData(): Promise<UserData | null> {
    try {
      const userDataString = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userDataString ? JSON.parse(userDataString) : null;
    } catch (error) {
      logger.error('Error getting user data:', error);
      return null;
    }
  }

  /**
   * Get stored access token
   */
  public async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      logger.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  public async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getAccessToken();
      const userData = await this.getUserData();
      return !!(token && userData);
    } catch (error) {
      logger.error('Error checking authentication:', error);
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

      const requestData: RefreshTokenRequest = { refreshToken };
      const response = await apiService.post<RefreshTokenResponse>(
        API_ENDPOINTS.AUTH.REFRESH_TOKEN,
        requestData
      );

      if (response.is_success && response.data?.accessToken) {
        // Store new access token
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.data.accessToken);
        return response.data.accessToken;
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error: any) {
      logger.error('Token refresh error:', error);
      // If refresh fails, logout user
      await this.logout();
      throw error;
    }
  }

  /**
   * Logout user
   */
  public async logout(): Promise<void> {
    try {
      // Try to delete refresh token from server
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (refreshToken) {
        try {
          await apiService.delete(
            `${API_ENDPOINTS.AUTH.DELETE_REFRESH_TOKEN}?refreshToken=${refreshToken}`,
            { requireAuth: true }
          );
        } catch (error) {
          // Don't throw if server logout fails, just log it
          logger.warn('Server logout failed:', error);
        }
      }

      // Clear local storage
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_TYPE)
      ]);
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Send OTP to email (deprecated - use sendEmailOtp instead)
   */
  public async sendOtp(email: string): Promise<SendOtpResponse> {
    try {
      const requestData: SendOtpRequest = { 
        email,
        purpose: 'registration' // Default purpose
      };
      const response = await apiService.post<SendOtpResponse>(
        API_ENDPOINTS.EMAIL.SEND_OTP,
        requestData
      );

      if (response.is_success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      logger.error('Send OTP error:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  public async changePassword(requestData: ChangePasswordRequest): Promise<void> {
    try {
      const response = await apiService.post(
        API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
        requestData,
        { requireAuth: true }
      );

      if (!response.is_success) {
        throw new Error(response.message || 'Failed to change password');
      }
    } catch (error: any) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Set user type (customer or technician)
   */
  public async setUserType(userType: 'customer' | 'technician'): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_TYPE, userType);
      
      // Update stored user data
      const userData = await this.getUserData();
      if (userData) {
        userData.userType = userType;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      }
    } catch (error) {
      logger.error('Error setting user type:', error);
      throw error;
    }
  }

  /**
   * Get user type
   */
  public async getUserType(): Promise<'customer' | 'technician' | null> {
    try {
      const userType = await AsyncStorage.getItem(STORAGE_KEYS.USER_TYPE);
      return userType as 'customer' | 'technician' | null;
    } catch (error) {
      logger.error('Error getting user type:', error);
      return null;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();