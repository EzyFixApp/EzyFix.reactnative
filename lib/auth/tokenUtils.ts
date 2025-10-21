/**
 * Token Utility Functions
 * Parse and validate JWT tokens
 */

export interface TokenPayload {
  exp?: number;
  iat?: number;
  userId?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}

/**
 * Parse JWT token to extract payload
 */
export const parseJwt = (token: string): TokenPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    if (__DEV__) {
      console.error('Error parsing JWT token:', error);
    }
    return null;
  }
};

/**
 * Check if token is expired
 * @param token - JWT token string
 * @param bufferMinutes - Minutes before expiration to consider token expired (default: 5)
 */
export const isTokenExpired = (token: string | null, bufferMinutes: number = 5): boolean => {
  if (!token) return true;
  
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return true;
  
  const expirationTime = decoded.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const bufferTime = bufferMinutes * 60 * 1000;
  
  // Consider expired if within buffer time
  return currentTime >= (expirationTime - bufferTime);
};

/**
 * Get token expiration date
 */
export const getTokenExpirationDate = (token: string | null): Date | null => {
  if (!token) return null;
  
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return null;
  
  return new Date(decoded.exp * 1000);
};

/**
 * Get remaining time until token expiration in minutes
 */
export const getTokenRemainingMinutes = (token: string | null): number => {
  if (!token) return 0;
  
  const expirationDate = getTokenExpirationDate(token);
  if (!expirationDate) return 0;
  
  const now = new Date();
  const diffMs = expirationDate.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / 1000 / 60);
  
  return Math.max(0, diffMinutes);
};

/**
 * Validate if token is still valid
 */
export const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  
  // Check if properly formatted
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  // Check if expired
  return !isTokenExpired(token, 0); // No buffer for this check
};
