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
  SendOTPRequest,
  VerifyOTPRequest,
  OTPResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  SendEmailOTPRequest,
  SendEmailOTPResponse,
  ValidateOTPRequest,
  ValidateOTPResponse,
  ForgotPasswordResetRequest,
  ChangePasswordRequest,
  SendOtpRequest,
  SendOtpResponse,
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
   * Register a new user
   */
  public async register(registerData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiService.post<RegisterResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        registerData
      );

      if (response.is_success && response.data) {
        // Development logging
        if (__DEV__) {
          console.group('✅ Registration Initiated');
          console.log('📧 Email:', registerData.email);
          console.log('👤 Name:', `${registerData.firstName} ${registerData.lastName}`);
          console.log('📱 Phone:', registerData.phoneNumber);
          console.log('🎯 User Type:', registerData.userType);
          console.log('📬 Requires Email Verification:', response.data.requiresEmailVerification);
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
        console.log('📊 Status:', error.status_code || 'Network Error');
        console.log('💬 Error:', error.message);
        console.groupEnd();
      }
      
      throw error;
    }
  }

  /**
   * Send OTP to email for verification
   */
  public async sendOTP(otpData: SendOTPRequest): Promise<OTPResponse> {
    try {
      const response = await apiService.post<OTPResponse>(
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
   * Verify OTP code
   */
  public async verifyOTP(verifyData: VerifyOTPRequest): Promise<OTPResponse> {
    try {
      const response = await apiService.post<OTPResponse>(
        API_ENDPOINTS.EMAIL.VERIFY_OTP,
        verifyData
      );

      if (response.is_success && response.data) {
        // Development logging
        if (__DEV__) {
          console.group('✅ OTP Verified');
          console.log('📧 Email:', verifyData.email);
          console.log('🎯 Purpose:', verifyData.purpose);
          console.log('✨ Valid:', response.data.isValid);
          console.log('🎫 Token:', response.data.token ? '✅ Received' : '❌ None');
          console.groupEnd();
        }
        
        return response.data;
      } else {
        throw new Error(response.message || 'OTP verification failed');
      }
    } catch (error: any) {
      // Development logging
      if (__DEV__) {
        console.group('❌ OTP Verification Failed');
        console.log('📧 Email:', verifyData.email);
        console.log('🔢 OTP:', verifyData.otp);
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
   * Send OTP to email
   */
  public async sendOtp(email: string): Promise<SendOtpResponse> {
    try {
      const requestData: SendOtpRequest = { email };
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
   * Send forgot password OTP to email
   */
  public async sendForgotPasswordOTP(requestData: SendEmailOTPRequest): Promise<SendEmailOTPResponse> {
    try {
      const response = await apiService.post<SendEmailOTPResponse>(
        API_ENDPOINTS.EMAIL.SEND_OTP,
        requestData
      );

      if (response.is_success && response.data) {
        // Development logging
        if (__DEV__) {
          console.group('📧 Forgot Password OTP Sent');
          console.log('📧 Email:', requestData.email);
          console.log('🎯 Purpose:', requestData.purpose);
          console.log('💬 Message:', response.data.message);
          console.groupEnd();
        }
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to send forgot password OTP');
      }
    } catch (error: any) {
      // Development logging
      if (__DEV__) {
        console.group('❌ Forgot Password OTP Failed');
        console.log('📧 Email:', requestData.email);
        console.log('📊 Status:', error.status_code || 'Network Error');
        console.log('💬 Error:', error.message);
        console.groupEnd();
      }
      
      throw error;
    }
  }

  /**
   * Validate OTP for forgot password
   */
  public async validateForgotPasswordOTP(requestData: ValidateOTPRequest): Promise<ValidateOTPResponse> {
    try {
      const response = await apiService.post<ValidateOTPResponse>(
        API_ENDPOINTS.OTP.VALIDATE,
        requestData
      );

      if (response.is_success && response.data) {
        // Development logging
        if (__DEV__) {
          console.group('✅ OTP Validated');
          console.log('📧 Email:', requestData.email);
          console.log('🎯 Purpose:', requestData.purpose);
          console.log('✨ Valid:', response.data.isValid);
          console.groupEnd();
        }
        
        return response.data;
      } else {
        throw new Error(response.message || 'OTP validation failed');
      }
    } catch (error: any) {
      // Development logging
      if (__DEV__) {
        console.group('❌ OTP Validation Failed');
        console.log('📧 Email:', requestData.email);
        console.log('🔢 OTP:', requestData.otp);
        console.log('📊 Status:', error.status_code || 'Network Error');
        console.log('💬 Error:', error.message);
        console.groupEnd();
      }
      
      throw error;
    }
  }

  /**
   * Reset password after OTP validation
   */
  public async resetForgotPassword(requestData: ForgotPasswordResetRequest): Promise<void> {
    try {
      const response = await apiService.post<any>(
        API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
        requestData
      );

      if (response.is_success) {
        // Development logging
        if (__DEV__) {
          console.group('✅ Password Reset Successful');
          console.log('📧 Email:', requestData.email);
          console.log('💬 Message:', response.message);
          console.groupEnd();
        }
      } else {
        throw new Error(response.message || 'Failed to reset password');
      }
    } catch (error: any) {
      // Development logging
      if (__DEV__) {
        console.group('❌ Password Reset Failed');
        console.log('📧 Email:', requestData.email);
        console.log('📊 Status:', error.status_code || 'Network Error');
        console.log('💬 Error:', error.message);
        console.groupEnd();
      }
      
      throw error;
    }
  }

  /**
   * Forgot password (deprecated - use sendForgotPasswordOTP instead)
   */
  public async forgotPassword(requestData: ForgotPasswordRequest): Promise<void> {
    try {
      const response = await apiService.post(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        requestData
      );

      if (!response.is_success) {
        throw new Error(response.message || 'Failed to reset password');
      }
    } catch (error: any) {
      logger.error('Forgot password error:', error);
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