import { create } from 'zustand';
import { BookingItem, BookingStatus, Quote } from '../types/BookingTypes';

interface BookingState {
  // Current bookings list
  bookings: BookingItem[];
  
  // Loading states
  loading: boolean;
  submitting: boolean;
  
  // Current booking being viewed/edited
  currentBooking: BookingItem | null;
  currentQuote: Quote | null;
  
  // Error state
  error: string | null;
  
  // Actions
  setBookings: (bookings: BookingItem[]) => void;
  addBooking: (booking: BookingItem) => void;
  updateBooking: (bookingId: string, updates: Partial<BookingItem>) => void;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => void;
  setCurrentBooking: (booking: BookingItem | null) => void;
  setCurrentQuote: (quote: Quote | null) => void;
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setError: (error: string | null) => void;
  
  // API simulation functions (will be replaced with real API calls)
  createBooking: (bookingData: Omit<BookingItem, 'id' | 'createdAt' | 'status'>) => Promise<BookingItem>;
  fetchBookings: () => Promise<BookingItem[]>;
  acceptQuote: (bookingId: string, quoteId: string) => Promise<void>;
  rejectQuote: (bookingId: string, quoteId: string) => Promise<void>;
}

// Mock data for development
const mockBookings: BookingItem[] = [
  {
    id: '1',
    serviceName: 'Sửa điều hòa',
    servicePrice: '200,000đ - 500,000đ',
    customerName: 'Nguyễn Văn A',
    phoneNumber: '0901234567',
    address: '123 Lê Lợi, Q1, TP.HCM',
    status: 'quoted',
    createdAt: '2025-09-29T10:30:00Z',
    technicianName: 'Thợ Minh',
    quotePrice: '350,000đ',
    notes: 'Điều hòa không lạnh, có tiếng ồn'
  },
  {
    id: '2',
    serviceName: 'Sửa ống nước',
    servicePrice: '150,000đ - 300,000đ',
    customerName: 'Trần Thị B',
    phoneNumber: '0987654321',
    address: '456 Nguyễn Huệ, Q1, TP.HCM',
    status: 'searching',
    createdAt: '2025-09-29T14:15:00Z',
    notes: 'Ống nước bị tắc, áp lực yếu'
  },
];

export const useBookingStore = create<BookingState>((set, get) => ({
  // Initial state
  bookings: mockBookings,
  loading: false,
  submitting: false,
  currentBooking: null,
  currentQuote: null,
  error: null,

  // Basic actions
  setBookings: (bookings) => set({ bookings }),
  
  addBooking: (booking) => 
    set((state) => ({
      bookings: [booking, ...state.bookings]
    })),
  
  updateBooking: (bookingId, updates) =>
    set((state) => ({
      bookings: state.bookings.map((booking) =>
        booking.id === bookingId ? { ...booking, ...updates } : booking
      )
    })),
  
  updateBookingStatus: (bookingId, status) =>
    set((state) => ({
      bookings: state.bookings.map((booking) =>
        booking.id === bookingId 
          ? { ...booking, status, updatedAt: new Date().toISOString() }
          : booking
      )
    })),
  
  setCurrentBooking: (booking) => set({ currentBooking: booking }),
  setCurrentQuote: (quote) => set({ currentQuote: quote }),
  setLoading: (loading) => set({ loading }),
  setSubmitting: (submitting) => set({ submitting }),
  setError: (error) => set({ error }),

  // API simulation functions
  createBooking: async (bookingData) => {
    set({ submitting: true, error: null });
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newBooking: BookingItem = {
        ...bookingData,
        id: Date.now().toString(),
        status: 'searching',
        createdAt: new Date().toISOString(),
      };
      
      get().addBooking(newBooking);
      set({ submitting: false });
      
      return newBooking;
    } catch (error) {
      set({ 
        submitting: false, 
        error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo đặt lịch'
      });
      throw error;
    }
  },

  fetchBookings: async () => {
    set({ loading: true, error: null });
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const bookings = get().bookings;
      set({ loading: false });
      
      return bookings;
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải danh sách đặt lịch'
      });
      throw error;
    }
  },

  acceptQuote: async (bookingId, quoteId) => {
    set({ submitting: true, error: null });
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      get().updateBookingStatus(bookingId, 'accepted');
      get().updateBooking(bookingId, {
        acceptedAt: new Date().toISOString()
      });
      
      set({ submitting: false });
    } catch (error) {
      set({ 
        submitting: false, 
        error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi chấp nhận báo giá'
      });
      throw error;
    }
  },

  rejectQuote: async (bookingId, quoteId) => {
    set({ submitting: true, error: null });
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset to searching status and clear technician info
      get().updateBooking(bookingId, {
        status: 'searching',
        technicianId: undefined,
        technicianName: undefined,
        technicianPhone: undefined,
        quoteId: undefined,
        quotePrice: undefined,
        quoteDetails: undefined,
        quotedAt: undefined,
        updatedAt: new Date().toISOString(),
      });
      
      set({ submitting: false });
    } catch (error) {
      set({ 
        submitting: false, 
        error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi từ chối báo giá'
      });
      throw error;
    }
  },
}));

// Utility function to get booking by ID
export const getBookingById = (bookingId: string): BookingItem | undefined => {
  const { bookings } = useBookingStore.getState();
  return bookings.find(booking => booking.id === bookingId);
};

// Utility function to get bookings by status
export const getBookingsByStatus = (status: BookingStatus): BookingItem[] => {
  const { bookings } = useBookingStore.getState();
  return bookings.filter(booking => booking.status === status);
};

export default useBookingStore;