// Types for booking system

export interface BookingFormData {
  customerName: string;
  phoneNumber: string;
  address: string;
  notes: string;
  images: string[];
}

export type BookingStatus = 
  | 'searching'      // Đang tìm thợ
  | 'quoted'         // Có báo giá
  | 'accepted'       // Đã chấp nhận báo giá
  | 'in-progress'    // Đang thực hiện
  | 'completed'      // Hoàn thành
  | 'cancelled';     // Đã hủy

export interface BookingItem {
  id: string;
  serviceName: string;
  servicePrice: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  notes?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt?: string;
  technicianId?: string;
  technicianName?: string;
  technicianPhone?: string;
  technicianRating?: number;
  quoteId?: string;
  quotePrice?: string;
  quoteDetails?: string;
  quotedAt?: string;
  acceptedAt?: string;
  completedAt?: string;
  images?: string[];
}

export interface TechnicianProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  rating: number;
  reviewCount: number;
  experience: string;
  specialties: string[];
  profileImage?: string;
  verified: boolean;
  location: {
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}

export interface QuoteItem {
  name: string;
  description?: string;
  price: string;
  quantity?: number;
}

export interface MaterialItem {
  name: string;
  quantity: string;
  price: string;
  brand?: string;
}

export interface Quote {
  id: string;
  bookingId: string;
  technicianId: string;
  technicianName: string;
  technicianPhone: string;
  technicianRating: number;
  technicianExperience: string;
  profileImage?: string;
  
  // Pricing
  totalPrice: string;
  originalPrice?: string;
  discount?: string;
  
  // Service details
  serviceName: string;
  description: string;
  workItems: QuoteItem[];
  materials: MaterialItem[];
  
  // Terms
  warranty: string;
  estimatedDuration: string;
  validUntil: string;
  notes?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt?: string;
  
  // Status
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
}

export interface BookingStatusInfo {
  color: string;
  bgColor: string;
  text: string;
  icon: string;
  description?: string;
}

// API Response types
export interface BookingResponse {
  success: boolean;
  data: BookingItem;
  message?: string;
}

export interface BookingListResponse {
  success: boolean;
  data: BookingItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface QuoteResponse {
  success: boolean;
  data: Quote;
  message?: string;
}

// Error types
export interface BookingError {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiError {
  message: string;
  errors?: BookingError[];
  statusCode?: number;
}

// Form validation
export interface FormValidation {
  isValid: boolean;
  errors: { [key: string]: string };
}

// Navigation params
export interface BookingConfirmationParams {
  serviceName: string;
  servicePrice?: string;
  customerName: string;
  phoneNumber?: string;
  address?: string;
  notes?: string;
}

export interface BookingDetailParams {
  bookingId: string;
  serviceName?: string;
  status?: BookingStatus;
  technicianName?: string;
  quotePrice?: string;
}

export interface QuoteReviewParams {
  bookingId: string;
  quoteId?: string;
}

// Utility functions types
export type BookingStatusMapper = (status: BookingStatus) => BookingStatusInfo;
export type DateFormatter = (dateString: string) => string;
export type PriceFormatter = (price: string | number) => string;

// All types are already exported above individually