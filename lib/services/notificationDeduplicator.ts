/**
 * Notification Deduplication Manager
 * Ensures each notification is sent only once per order status
 * Shared between foreground and background contexts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_HISTORY_KEY = 'NOTIFICATION_HISTORY';
const MAX_HISTORY_SIZE = 100; // Keep last 100 notifications

interface NotificationRecord {
  orderId: string;
  status: string;
  timestamp: number;
  notificationId?: string;
}

class NotificationDeduplicator {
  private static instance: NotificationDeduplicator;
  private memoryCache: Map<string, NotificationRecord> = new Map();

  public static getInstance(): NotificationDeduplicator {
    if (!NotificationDeduplicator.instance) {
      NotificationDeduplicator.instance = new NotificationDeduplicator();
    }
    return NotificationDeduplicator.instance;
  }

  /**
   * Generate unique key for order + status combination
   */
  private getKey(orderId: string, status: string): string {
    return `${orderId}-${status.toUpperCase()}`;
  }

  /**
   * Check if notification was already sent for this order + status
   */
  public async wasNotificationSent(orderId: string, status: string): Promise<boolean> {
    const key = this.getKey(orderId, status);

    // Check memory cache first (fast)
    if (this.memoryCache.has(key)) {
      if (__DEV__) {
        console.log(`✅ [NotificationDedup] Found in memory cache: ${key}`);
      }
      return true;
    }

    // Check AsyncStorage (persistent across app restarts)
    try {
      const historyJson = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
      if (historyJson) {
        const history: NotificationRecord[] = JSON.parse(historyJson);
        const found = history.some(
          (record) => record.orderId === orderId && record.status.toUpperCase() === status.toUpperCase()
        );

        if (found) {
          // Add to memory cache for faster future lookups
          this.memoryCache.set(key, {
            orderId,
            status: status.toUpperCase(),
            timestamp: Date.now(),
          });
          if (__DEV__) {
            console.log(`✅ [NotificationDedup] Found in storage: ${key}`);
          }
          return true;
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [NotificationDedup] Error checking history:', error);
      }
    }

    if (__DEV__) {
      console.log(`❌ [NotificationDedup] NOT found: ${key} - Will send notification`);
    }
    return false;
  }

  /**
   * Mark notification as sent for this order + status
   */
  public async markNotificationSent(
    orderId: string,
    status: string,
    notificationId?: string
  ): Promise<void> {
    const key = this.getKey(orderId, status);
    const record: NotificationRecord = {
      orderId,
      status: status.toUpperCase(),
      timestamp: Date.now(),
      notificationId,
    };

    // Add to memory cache
    this.memoryCache.set(key, record);

    // Add to persistent storage
    try {
      const historyJson = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
      let history: NotificationRecord[] = historyJson ? JSON.parse(historyJson) : [];

      // Remove duplicate if exists
      history = history.filter(
        (r) => !(r.orderId === orderId && r.status.toUpperCase() === status.toUpperCase())
      );

      // Add new record
      history.push(record);

      // Keep only recent records to prevent storage bloat
      if (history.length > MAX_HISTORY_SIZE) {
        history = history.slice(-MAX_HISTORY_SIZE);
      }

      await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(history));

      if (__DEV__) {
        console.log(`✅ [NotificationDedup] Marked as sent: ${key}`);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [NotificationDedup] Error saving history:', error);
      }
    }
  }

  /**
   * Clear notification history for a specific order (e.g., when order is completed)
   */
  public async clearOrderHistory(orderId: string): Promise<void> {
    try {
      // Clear from memory cache
      for (const [key, record] of this.memoryCache.entries()) {
        if (record.orderId === orderId) {
          this.memoryCache.delete(key);
        }
      }

      // Clear from storage
      const historyJson = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
      if (historyJson) {
        let history: NotificationRecord[] = JSON.parse(historyJson);
        history = history.filter((record) => record.orderId !== orderId);
        await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(history));
      }

      if (__DEV__) {
        console.log(`🗑️ [NotificationDedup] Cleared history for order: ${orderId}`);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [NotificationDedup] Error clearing history:', error);
      }
    }
  }

  /**
   * Clear all notification history (for debugging or reset)
   */
  public async clearAllHistory(): Promise<void> {
    try {
      this.memoryCache.clear();
      await AsyncStorage.removeItem(NOTIFICATION_HISTORY_KEY);
      if (__DEV__) {
        console.log('🗑️ [NotificationDedup] Cleared all notification history');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [NotificationDedup] Error clearing all history:', error);
      }
    }
  }

  /**
   * Get notification history for debugging
   */
  public async getHistory(): Promise<NotificationRecord[]> {
    try {
      const historyJson = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      if (__DEV__) {
        console.error('❌ [NotificationDedup] Error getting history:', error);
      }
      return [];
    }
  }
}

// Export singleton instance
export const notificationDeduplicator = NotificationDeduplicator.getInstance();
