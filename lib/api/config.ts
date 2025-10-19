/**
 * API Configuration for EzyFix React Native App
 */

// Base API URL
export const API_BASE_URL = 'https://ezyfix.up.railway.app';

// API Endpoints
export const API_ENDPOINTS = {
  // Base paths
  ROOT: '/api',
  VERSION: '/v1',
  
  // Authentication endpoints
  AUTH: {
    BASE: '/api/v1/auth',
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    VERIFY: '/api/v1/auth/verify',
    REFRESH_TOKEN: '/api/v1/auth/refresh-token',
    DELETE_REFRESH_TOKEN: '/api/v1/auth/delete-refresh-token',
    LOGOUT: '/api/v1/auth/logout',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    CHANGE_PASSWORD: '/api/v1/auth/change-password',
  },

  // Email endpoints
  EMAIL: {
    BASE: '/api/v1/email',
    SEND: '/api/v1/email/send',
    SEND_OTP: '/api/v1/email/send-otp',
  },

  // OTP endpoints
  OTP: {
    BASE: '/api/v1/otp',
    VALIDATE: '/api/v1/otp/validate',
    CHECK: '/api/v1/otp/check', // New endpoint for forgot password OTP validation
  },

  // Address endpoints
  ADDRESS: {
    BASE: '/api/v1/addresses',
    CREATE: '/api/v1/addresses',
    GET_ALL: '/api/v1/addresses',
    GET_BY_ID: (id: string) => `/api/v1/addresses/${id}`,
    UPDATE: (id: string) => `/api/v1/addresses/${id}/update`,
    DELETE: (id: string) => `/api/v1/addresses/${id}/delete`,
  },

  // Services endpoints
  SERVICES: {
    BASE: '/api/v1/services',
    GET_ALL: '/api/v1/services',
    GET_BY_ID: '/api/v1/services',
    SEARCH: '/api/v1/services/search',
    GET_BY_CATEGORY: '/api/v1/services/category',
  },

  // Categories endpoints
  CATEGORIES: {
    BASE: '/api/v1/categories',
    GET_ALL: '/api/v1/categories',
    GET_BY_ID: '/api/v1/categories',
  },
} as const;

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
} as const;

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 10000;

// Headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
} as const;

// Storage keys for AsyncStorage
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  USER_TYPE: 'user_type', // 'customer' or 'technician'
} as const;

export const USER_TYPES = {
  CUSTOMER: 'customer',
  TECHNICIAN: 'technician',
} as const;

export type UserType = typeof USER_TYPES[keyof typeof USER_TYPES];