/**
 * API Types for EzyFix React Native App
 * Based on the backend API schema
 */

import { UserType } from '../lib/api/config';

// Re-export UserType for convenience
export type { UserType };

// ============= Base API Response Type =============
export interface ApiResponse<T> {
  status_code: number;
  message: string | null;
  reason: string | null;
  is_success: boolean;
  data: T;
}

// ============= Authentication Types =============

// Login Request (email + password based on backend API)
export interface LoginRequest {
  email: string;
  password: string;
}

// Register Request (complete user registration)
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  userType: UserType;
  acceptTerms: boolean;
}

// Register Response
export interface RegisterResponse {
  message: string;
  userId: string;
  email: string;
  requiresEmailVerification: boolean;
}

// Email OTP Request
export interface SendOTPRequest {
  email: string;
  purpose: 'registration' | 'password-reset';
}

// Email OTP Verification Request  
export interface VerifyOTPRequest {
  email: string;
  otp: string;
  purpose: 'registration' | 'password-reset';
}

// OTP Response
export interface OTPResponse {
  message: string;
  isValid: boolean;
  token?: string; // For completing registration
}

// Login Response (based on backend LoginResponse.cs)
export interface LoginResponse {
  accessToken: string;
  id: string;
  fullName: string;
  email: string;
  avatarLink?: string | null;
  isPasswordExpired: boolean;
  refreshToken: string;
}

// User data structure for local storage
export interface UserData {
  id: string;
  fullName: string;
  email: string;
  avatarLink?: string | null;
  userType: UserType;
}

// Refresh Token Request
export interface RefreshTokenRequest {
  refreshToken: string;
}

// Refresh Token Response
export interface RefreshTokenResponse {
  accessToken: string;
}

// Forgot Password Request (send email)
export interface ForgotPasswordRequest {
  email: string;
}

// Email OTP Request (for forgot password)
export interface SendEmailOTPRequest {
  email: string;
  purpose: 'forgot-password' | 'registration' | 'verification';
}

// Email OTP Response
export interface SendEmailOTPResponse {
  message: string;
  success: boolean;
}

// Validate OTP Request
export interface ValidateOTPRequest {
  email: string;
  otp: string;
  purpose: 'forgot-password' | 'registration' | 'verification';
}

// Validate OTP Response
export interface ValidateOTPResponse {
  isValid: boolean;
  message: string;
  token?: string;
}

// Reset Password Request (with validated OTP)
export interface ForgotPasswordResetRequest {
  email: string;
  newPassword: string;
  otp: string;
}

// Change Password Request
export interface ChangePasswordRequest {
  email: string;
  oldPassword: string;
  newPassword: string;
  otp: string;
}

// ============= Error Types =============
export interface ApiError {
  status_code: number;
  message: string;
  reason?: string;
  data?: any;
}

// ============= Address Types =============
export interface Address {
  addressId: string;
  userId: string;
  street?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  latitude: number;
  longitude: number;
}

export interface CreateAddressRequest {
  street: string;
  city: string;
  province?: string | null;
  postalCode?: string | null;
  latitude: number;
  longitude: number;
}

// ============= Email/OTP Types =============
export interface SendOtpRequest {
  email: string;
}

export interface SendOtpResponse {
  message: string;
  attemptCount?: number;
}

// ============= Auth State Types =============
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserData | null;
  accessToken: string | null;
  refreshToken: string | null;
  error: string | null;
}

// ============= HTTP Client Types =============
export interface RequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  data?: any;
  params?: Record<string, any>;
  timeout?: number;
}

export interface RequestOptions {
  requireAuth?: boolean;
  retryOnUnauthorized?: boolean;
}

// ============= Form Validation Types =============
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}