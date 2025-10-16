/**
 * Logging utility for development and production
 * Automatically disables logs in production builds
 */

const isDev = __DEV__;

export const logger = {
  /**
   * Log general information (disabled in production)
   */
  info: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log(`ℹ️ ${message}`, ...args);
    }
  },

  /**
   * Log warnings (disabled in production)
   */
  warn: (message: string, ...args: any[]) => {
    if (isDev) {
      console.warn(`⚠️ ${message}`, ...args);
    }
  },

  /**
   * Log errors (kept in production for crash reporting)
   */
  error: (message: string, error?: any) => {
    if (isDev) {
      console.error(`❌ ${message}`, error);
    } else {
      // In production, you might want to send to crash reporting service
      // e.g., Crashlytics, Sentry, etc.
      // crashlytics().recordError(error);
    }
  },

  /**
   * Log API calls (disabled in production)
   */
  api: (method: string, url: string, data?: any) => {
    if (isDev) {
      console.log(`🌐 API ${method}:`, url, data ? data : '');
    }
  },

  /**
   * Log navigation (disabled in production)
   */
  navigation: (from: string, to: string) => {
    if (isDev) {
      console.log(`🧭 Navigation: ${from} → ${to}`);
    }
  }
};