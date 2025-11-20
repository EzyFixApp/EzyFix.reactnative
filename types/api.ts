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

// ============= Address Types =============

// Address data for creating/updating (theo API thực tế)
export interface AddressData {
  street: string;           // Địa chỉ đường (bắt buộc)
  city: string;             // Thành phố (bắt buộc)
  province: string;         // Tỉnh/Thành phố (bắt buộc)
  postalCode: string;       // Mã bưu điện (bắt buộc)
  latitude?: number;        // Tọa độ vĩ độ (tùy chọn)
  longitude?: number;       // Tọa độ kinh độ (tùy chọn)
}

// Address response from API (theo API thực tế)
export interface Address {
  addressId: string;        // ID địa chỉ (thay vì 'id')
  userId: string;           // ID người dùng
  street: string;           // Địa chỉ đường
  city: string;             // Thành phố
  province: string;         // Tỉnh/Thành phố
  postalCode: string;       // Mã bưu điện
  latitude?: number;        // Tọa độ vĩ độ
  longitude?: number;       // Tọa độ kinh độ
  serviceRequests?: any[];  // Danh sách service requests liên quan
}

export interface AddressResponse {
  success: boolean;
  message: string;
  data: Address;
}

export interface AddressListResponse {
  success: boolean;
  message: string;
  data: Address[];
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
  phone?: string; // Optional field for backend compatibility
  userType: UserType;
  acceptTerms: boolean;
}

// Register Response (updated for isVerified flow)
export interface RegisterResponse {
  message: string;
  email: string;
  isVerified: boolean;
}

// Email OTP Request (updated)
export interface SendOtpRequest {
  email: string;
  purpose: 'registration' | 'password-reset' | 'verification';
}

// Email OTP Response (updated)
export interface SendOtpResponse {
  message: string;
  email: string;
}

// Verify Account Request (for registration)
export interface VerifyAccountRequest {
  email: string;
  otp: string;
}

// Verify Account Response
export interface VerifyAccountResponse {
  message: string;
  isVerified: boolean;
}

// OTP Validation Request (for forgot password)
export interface ValidateOtpRequest {
  email: string;
  otp: string;
  purpose: 'registration' | 'password-reset' | 'verification';
}

// OTP Validation Response
export interface ValidateOtpResponse {
  message: string;
  isValid: boolean;
}

// Forgot Password Request (OTP required to complete reset and remove from DB)
export interface ForgotPasswordRequest {
  email: string;
  newPassword: string;
  otp: string; // Required - OTP needed to finalize reset and clean up DB
}

// Forgot Password Response
export interface ForgotPasswordResponse {
  message: string;
}

// Login Response (based on backend LoginResponse.cs)
export interface LoginResponse {
  accessToken: string;
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  avatarLink?: string | null;
  isPasswordExpired: boolean;
  isVerify: boolean; // Added verification status from backend
  refreshToken: string;
}

// User data structure for local storage
export interface UserData {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  avatarLink?: string | null;
  userType: UserType;
  isVerify: boolean; // Added verification status
}

// Services API Types
export interface Service {
  serviceId: string;
  categoryId: string;
  serviceName: string | null;
  description: string | null;
  serviceIconUrl: string | null;
  basePrice: number;
}

// Categories API Types
export interface Category {
  categoryId: string;
  categoryName: string;
  description?: string | null;
  iconUrl?: string | null;
}

export interface ServicesResponse {
  services: Service[];
}

export interface CategoriesResponse {
  categories: Category[];
}

// Refresh Token Request
export interface RefreshTokenRequest {
  refreshToken: string;
}

// Refresh Token Response
export interface RefreshTokenResponse {
  accessToken: string;
}

// Forgot Password Request (send email) - DEPRECATED, use SendOtpRequest instead
export interface ForgotPasswordEmailRequest {
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
  skipAutoLogoutOn401?: boolean; // Skip auto-logout on 401 error (for special cases like cached appointmentId)
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

// ============= Service Request Types =============
export interface ServiceRequestData {
  addressID: string;            // ID của địa chỉ đã lưu (để reference)
  serviceId: string;            // ID dịch vụ
  serviceDescription: string;   // Mô tả chi tiết vấn đề
  fullName: string;             // Tên người nhận - REQUIRED (user có thể edit)
  phoneNumber: string;          // SĐT người nhận - REQUIRED (user có thể edit)
  addressNote?: string;         // Ghi chú địa chỉ (tầng, căn hộ, etc.)
  requestedDate: string;        // Ngày yêu cầu (ISO string format)
  expectedStartTime: string;    // Giờ bắt đầu dự kiến (ISO string format)
  mediaUrls?: string[];         // Danh sách URL ảnh/video
}

export interface ServiceRequestResponse {
  requestID: string;
  customerID: string;
  addressID: string | null;
  serviceId: string;
  fullName: string | null;
  phoneNumber: string | null;
  requestAddress: string | null;
  serviceDescription: string;
  addressNote: string | null;
  requestedDate: string;
  expectedStartTime: string;
  status: string;
  createdDate: string;
  mediaUrls: string[];
}

// Booking form data for UI
export interface BookingFormData {
  customerName: string;         // Tên khách hàng (from auth)
  phoneNumber: string;          // SĐT khách hàng (from auth)
  serviceName: string;          // Tên dịch vụ (for display)
  serviceId: string;            // ID dịch vụ
  servicePrice: string;         // Giá dịch vụ (for display)
  serviceDescription: string;   // Mô tả chi tiết vấn đề
  address: string;              // Địa chỉ đầy đủ (for display)
  addressID: string;            // ID của địa chỉ đã lưu (GUID) - send to API
  addressNote: string;          // Ghi chú địa chỉ
  requestedDate: string;        // Ngày yêu cầu (YYYY-MM-DD)
  expectedStartTime: string;    // Giờ bắt đầu (HH:mm)
  images: string[];             // Danh sách URI ảnh local
}

// ============= Voucher Types =============
export interface Voucher {
  voucherId: string;
  voucherCode: string;
  voucherDescription: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  maxDiscountAmount: number;
  minimumOrderAmount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  appliesToService: boolean;
  appliesToCategory: boolean;
  appliesToPaymentMethod: boolean;
  eligiblePaymentMethodCodes: string[];
  remainingGlobalCount: number;
  remainingPerUserCount: number;
  previewDiscountAmount: number;
  discountCapped: boolean;
}

export interface EligibleVouchersData {
  appointmentId: string;
  serviceRequestId: string;
  customerId: string;
  orderAmount: number;
  vouchers: Voucher[];
}

export interface ValidateVoucherRequest {
  appointmentId: string;
  voucherCode: string;
}

export interface VoucherUsageData {
  voucherUsageId: string;
  voucherId: string;
  appointmentId: string;
  serviceRequestId: string;
  customerId: string;
  voucherCode: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  originalAmount: number;
  discountAmount: number;
  netAmount: number;
  discountCapped: boolean;
  status: string;
  reservationToken: string;
  expiresAt: string;
  voucherDescription: string;
  voucherMetadataJson: string;
}

// ============= All Vouchers (Dashboard) Types =============

export interface VoucherItem {
  voucherId: string;
  voucherCode: string;
  voucherDescription: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_CHECKING';
  discountValue: number;
  maxDiscountAmount: number;
  minimumOrderAmount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  maxUsageCount: number;
  maxUsagePerUserCount: number;
  pendingReservations: number;
  confirmedUsages: number;
  releasedReservations: number;
  remainingGlobalCount: number;
  categoryNames: string[];
  serviceNames: string[];
  paymentMethodCodes: string[];
}

export interface AllVouchersData {
  items: VoucherItem[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// ============= Technician Profile Types =============

export interface TechnicianReview {
  id: string;
  rating: number;
  comment: string;
  customerName: string;
  createdAt: string;
}

export interface TechnicianProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatar: string | null;
  certification: string | null;
  yearsOfExperience: number;
  availabilityStatus: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  hourlyRate: number;
  averageRating: number;
  totalReviews: number;
  skills: string[];
  latestReviews: TechnicianReview[];
}

export interface TechnicianProfileResponse {
  status_code: number;
  message: string;
  reason: string | null;
  is_success: boolean;
  data: TechnicianProfile;
}