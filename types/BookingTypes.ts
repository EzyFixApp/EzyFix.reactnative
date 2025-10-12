// Types for booking system

export interface BookingFormData {
  customerName: string;
  phoneNumber: string;
  address: string;
  notes: string;
  images: string[];
}

// Enhanced booking status for full workflow
export type BookingStatus = 
  | 'pending'           // Mục 2: Đơn trong hàng chờ, chưa có thợ nhận
  | 'quoted'            // Mục 2: Thợ đã báo giá ban đầu
  | 'quote_accepted'    // Mục 3: Khách đã chấp nhận báo giá
  | 'quote_rejected'    // Mục 3: Khách từ chối báo giá
  | 'on_the_way'        // Mục 4: Thợ đang đến
  | 'arrived'           // Mục 4: Thợ đã đến nơi
  | 'inspecting'        // Mục 4: Đang kiểm tra, gửi ảnh/video
  | 'final_quoted'      // Mục 4: Đã có báo giá cuối cùng (nếu là dự kiến)
  | 'final_accepted'    // Mục 5: Khách chấp nhận báo giá cuối
  | 'final_rejected'    // Mục 5: Khách từ chối (SOS)
  | 'repairing'         // Mục 6: Đang sửa chữa
  | 'repair_completed'  // Mục 6: Hoàn tất sửa chữa, chờ thanh toán
  | 'payment_pending'   // Mục 7: Chờ thanh toán
  | 'payment_completed' // Mục 7: Đã thanh toán
  | 'completed'         // Mục 8: Hoàn tất toàn bộ
  | 'cancelled';        // Đã hủy

// Quote types
export type QuoteType = 'final' | 'estimated'; // Giá chốt hoặc giá dự kiến

export interface Quote {
  id: string;
  orderId: string;
  technicianId: string;
  type: QuoteType;
  amount: number;
  aiSuggestedMin?: number; // AI suggest khoảng giá
  aiSuggestedMax?: number;
  isOverThreshold?: boolean; // Vượt ngưỡng cho phép (X%)
  thresholdPercentage?: number;
  justification?: string; // Lý do nếu vượt ngưỡng
  justificationImages?: string[];
  createdAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  notes?: string;
}

// Payment methods
export type PaymentMethod = 
  | 'momo' 
  | 'zalopay' 
  | 'vnpay' 
  | 'bank_qr' 
  | 'cash';

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  escrowHeld: boolean; // Tiền đang được giữ
  escrowReleasedAt?: string; // Thời điểm giải ngân
  requiresInvoice: boolean; // Yêu cầu hóa đơn GTGT
  invoiceNumber?: string;
  transactionId?: string;
  createdAt: string;
  completedAt?: string;
}

// Media for documentation
export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  category: 'initial' | 'inspection' | 'completed'; // Ảnh ban đầu, kiểm tra, sau sửa
  uploadedBy: 'customer' | 'technician';
  uploadedAt: string;
  notes?: string;
}

// Timeline event for tracking
export interface TimelineEvent {
  id: string;
  orderId: string;
  status: BookingStatus;
  title: string;
  description: string;
  timestamp: string;
  actor: 'customer' | 'technician' | 'system';
  metadata?: any; // Additional data like quote, payment info
}

// Review/Rating
export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  technicianId: string;
  rating: number; // 1-5
  comment?: string;
  images?: string[];
  createdAt: string;
}

// Enhanced booking item with full workflow data
export interface BookingItem {
  id: string;
  serviceName: string;
  servicePrice: string;
  customerName: string;
  customerPhone: string;
  customerId: string;
  address: string;
  notes?: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt?: string;
  
  // Technician info
  technicianId?: string;
  technicianName?: string;
  technicianPhone?: string;
  technicianRating?: number;
  
  // Quotes
  initialQuote?: Quote;
  finalQuote?: Quote;
  
  // Payment
  payment?: Payment;
  
  // Media
  media: MediaItem[];
  
  // Timeline
  timeline: TimelineEvent[];
  
  // Review
  review?: Review;
  
  // Timestamps for each stage
  quotedAt?: string;
  quoteAcceptedAt?: string;
  arrivedAt?: string;
  repairStartedAt?: string;
  repairCompletedAt?: string;
  paidAt?: string;
  completedAt?: string;
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