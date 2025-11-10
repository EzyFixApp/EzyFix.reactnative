/**
 * Token Manager
 * Handles token expiry checking and automatic refresh
 * Prevents users from being logged out unexpectedly
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../logger';
import { API_BASE_URL, API_ENDPOINTS, STORAGE_KEYS } from './config';

interface TokenInfo {
  token: string;
  expiresAt: number; // Unix timestamp (seconds)
}

class TokenManager {
  private accessTokenInfo: TokenInfo | null = null;
  private refreshTokenInfo: TokenInfo | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;
  private refreshInterval: any = null;
  
  // Buffer time: Refresh token 60s before expiry
  private readonly REFRESH_BUFFER_SECONDS = 60;
  // Proactive refresh: Check every 5 minutes
  private readonly PROACTIVE_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

  /**
   * Decode JWT and extract payload
   */
  private decodeJWT(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      // Silent fail - some tokens (like refresh tokens) might not be JWT format
      // This is expected and not an error
      return null;
    }
  }

  /**
   * Load access token from AsyncStorage and cache expiry time
   */
  public async loadAccessToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) {
        this.accessTokenInfo = null;
        return null;
      }

      const payload = this.decodeJWT(token);
      if (!payload || !payload.exp) {
        logger.warn('⚠️ Invalid JWT token - missing expiry');
        this.accessTokenInfo = null;
        return null;
      }

      this.accessTokenInfo = {
        token,
        expiresAt: payload.exp // JWT exp is in seconds
      };

      if (__DEV__) {
        const expiryDate = new Date(payload.exp * 1000);
        console.log('📅 Access token expires at:', expiryDate.toLocaleString());
      }

      return token;
    } catch (error) {
      logger.error('❌ Error loading access token:', error);
      return null;
    }
  }

  /**
   * Load refresh token and check its expiry
   * Note: Refresh token might not be JWT, so we can't decode expiry
   */
  private async loadRefreshToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!token) {
        this.refreshTokenInfo = null;
        return null;
      }

      // Try to decode if it's a JWT, otherwise just store the token
      try {
        const payload = this.decodeJWT(token);
        if (payload && payload.exp) {
          this.refreshTokenInfo = {
            token,
            expiresAt: payload.exp
          };

          if (__DEV__) {
            const expiryDate = new Date(payload.exp * 1000);
            const timeUntilExpiry = payload.exp - Math.floor(Date.now() / 1000);
            console.log('📅 Refresh token expires at:', expiryDate.toLocaleString());
            console.log(`⏰ Refresh token valid for: ${Math.floor(timeUntilExpiry / 60)} minutes`);
          }
        } else {
          // JWT decode succeeded but no exp claim
          this.refreshTokenInfo = {
            token,
            expiresAt: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days default
          };
        }
      } catch (decodeError) {
        // Refresh token is not JWT format (e.g., GUID or random string)
        // This is normal for some auth systems
        this.refreshTokenInfo = {
          token,
          expiresAt: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days default
        };
        
        if (__DEV__) {
          logger.info('ℹ️ Refresh token is not JWT format - using default validity');
        }
      }

      return token;
    } catch (error) {
      logger.error('❌ Error loading refresh token:', error);
      return null;
    }
  }

  /**
   * Check if refresh token is expired
   * Returns false if we can't determine expiry (non-JWT tokens)
   */
  private isRefreshTokenExpired(): boolean {
    if (!this.refreshTokenInfo) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = this.refreshTokenInfo.expiresAt - currentTime;

    if (timeUntilExpiry <= 0) {
      logger.warn('⏰ Refresh token has expired');
      return true;
    }

    return false;
  }

  /**
   * Check if access token is expired or about to expire
   * Returns: true if token is expired or will expire within REFRESH_BUFFER_SECONDS
   */
  public isAccessTokenExpired(): boolean {
    if (!this.accessTokenInfo) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const timeUntilExpiry = this.accessTokenInfo.expiresAt - currentTime;

    if (timeUntilExpiry <= 0) {
      logger.warn('⏰ Access token has expired');
      return true;
    }

    if (timeUntilExpiry <= this.REFRESH_BUFFER_SECONDS) {
      logger.info(`⏰ Access token will expire in ${timeUntilExpiry}s - needs refresh`);
      return true;
    }

    return false;
  }

  /**
   * Get valid access token
   * Automatically refreshes if token is expired or about to expire
   */
  public async getValidAccessToken(): Promise<string | null> {
    try {
      // Load token if not in memory
      if (!this.accessTokenInfo) {
        await this.loadAccessToken();
      }

      // Load refresh token to ensure we have it
      if (!this.refreshTokenInfo) {
        await this.loadRefreshToken();
      }

      // If no refresh token available, can't refresh
      if (!this.refreshTokenInfo) {
        if (__DEV__) {
          logger.info('⚠️ [TokenManager] No refresh token available');
        }
      }

      // If still no access token after loading, user is logged out
      if (!this.accessTokenInfo) {
        if (__DEV__) {
          logger.info('⚠️ [TokenManager] No token available - user not authenticated');
        }
        return null;
      }

      // Check if token is still valid
      if (!this.isAccessTokenExpired()) {
        if (__DEV__) {
          const timeUntilExpiry = this.accessTokenInfo.expiresAt - Math.floor(Date.now() / 1000);
          console.log(`✅ Token is valid (expires in ${timeUntilExpiry}s)`);
        }
        return this.accessTokenInfo.token;
      }

      // Token is expired or about to expire → Refresh
      logger.info('🔄 Token expired or expiring soon - refreshing...');
      return await this.refreshAccessToken();
    } catch (error) {
      logger.error('❌ Error getting valid access token:', error);
      return null;
    }
  }

  /**
   * Refresh access token
   * Prevents duplicate refresh calls by reusing the same promise
   */
  private async refreshAccessToken(): Promise<string | null> {
    // If already refreshing, wait for the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      logger.info('⏳ Already refreshing - waiting for existing refresh...');
      return this.refreshPromise;
    }

    // Start refresh process
    this.isRefreshing = true;
    this.refreshPromise = this._performRefresh();

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual refresh token API call
   * Uses fetch directly to avoid infinite loop with interceptors
   */
  private async _performRefresh(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      logger.info('🔄 Calling refresh token API...');

      // Use fetch directly to avoid interceptor infinite loop
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`❌ Refresh token API failed: ${response.status} - ${errorText}`);
        throw new Error(`Refresh token failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.is_success && data.data?.accessToken) {
        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken; // Backend might return new refresh token
        
        // Update AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
          logger.info('✅ Both access token and refresh token updated');
        } else {
          logger.info('✅ Access token updated');
        }
        
        // Update memory cache
        await this.loadAccessToken();
        
        logger.info('✅ Token refresh successful');
        return newAccessToken;
      } else {
        logger.error('❌ Invalid refresh token response:', data);
        throw new Error('Invalid refresh token response');
      }
    } catch (error) {
      logger.error('❌ Refresh token failed:', error);
      
      // Clear tokens and let the app handle logout
      await this.clearTokens();
      throw error;
    }
  }

  /**
   * Clear tokens from memory and storage
   */
  public async clearTokens(): Promise<void> {
    // CRITICAL: Cancel any ongoing refresh to prevent orphaned API calls
    if (this.isRefreshing && this.refreshPromise) {
      if (__DEV__) {
        logger.info('⚠️ [TokenManager] Cancelling ongoing token refresh...');
      }
    }
    
    // Stop proactive refresh
    this.stopProactiveRefresh();
    
    // Clear all in-memory state first
    this.accessTokenInfo = null;
    this.refreshTokenInfo = null;
    this.isRefreshing = false;
    this.refreshPromise = null;
    
    try {
      // Clear AsyncStorage with all possible keys to ensure clean state
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.USER_TYPE,
      ]);
      
      if (__DEV__) {
        logger.info('✅ [TokenManager] All tokens and user data cleared from storage');
      }
    } catch (error) {
      logger.error('❌ [TokenManager] Error clearing tokens:', error);
      // Even if storage clear fails, in-memory state is already cleared
    }
  }

  /**
   * Update access token after login
   */
  public async updateAccessToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      await this.loadAccessToken();
      await this.loadRefreshToken();
      
      // Start proactive refresh after login
      this.startProactiveRefresh();
      
      logger.info('✅ Access token updated in TokenManager');
    } catch (error) {
      logger.error('❌ Error updating access token:', error);
    }
  }

  /**
   * Start proactive token refresh
   * Checks every 5 minutes and refreshes if needed
   */
  private startProactiveRefresh(): void {
    // Clear any existing interval
    this.stopProactiveRefresh();

    if (__DEV__) {
      logger.info('🔄 Starting proactive token refresh (check every 5 min)');
    }

    this.refreshInterval = setInterval(async () => {
      try {
        // Load latest token info
        await this.loadAccessToken();
        await this.loadRefreshToken();

        // Check if we still have refresh token
        if (!this.refreshTokenInfo) {
          logger.warn('🔒 No refresh token available - stopping proactive refresh');
          this.stopProactiveRefresh();
          await this.clearTokens();
          return;
        }

        // Check if access token needs refresh
        if (this.isAccessTokenExpired()) {
          logger.info('🔄 Proactive refresh triggered');
          await this.refreshAccessToken();
        } else {
          if (__DEV__) {
            const timeUntilExpiry = this.accessTokenInfo 
              ? this.accessTokenInfo.expiresAt - Math.floor(Date.now() / 1000)
              : 0;
            console.log(`✅ Proactive check: Token still valid (${Math.floor(timeUntilExpiry / 60)} min remaining)`);
          }
        }
      } catch (error) {
        logger.error('❌ Error during proactive refresh:', error);
      }
    }, this.PROACTIVE_REFRESH_INTERVAL_MS);
  }

  /**
   * Stop proactive token refresh
   */
  private stopProactiveRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      if (__DEV__) {
        logger.info('⏹️ Stopped proactive token refresh');
      }
    }
  }

  /**
   * Get time until token expiry (in seconds)
   * Useful for debugging
   */
  public getTimeUntilExpiry(): number | null {
    if (!this.accessTokenInfo) {
      return null;
    }
    const currentTime = Math.floor(Date.now() / 1000);
    return this.accessTokenInfo.expiresAt - currentTime;
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
