/**
 * Background Order Monitor Service
 * Monitors active orders and sends notifications even when app is in background
 * Uses periodic background fetch to check order status
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { serviceRequestService } from '../api/serviceRequests';
import { appointmentsService } from '../api/appointments';
import { notificationService } from './notificationService';
import { notificationDeduplicator } from './notificationDeduplicator';
import { STORAGE_KEYS } from '../api/config';

const BACKGROUND_ORDER_CHECK_TASK = 'BACKGROUND_ORDER_CHECK';
const LAST_STATUS_KEY = 'LAST_ORDER_STATUS';
const ACTIVE_ORDER_KEY = 'ACTIVE_ORDER_ID';

// Define background task
TaskManager.defineTask(BACKGROUND_ORDER_CHECK_TASK, async () => {
  try {
    if (__DEV__) console.log('📡 [BackgroundMonitor] Running background order check...');

    // ✅ Check if user is authenticated first
    const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!accessToken) {
      if (__DEV__) console.log('⏭️ [BackgroundMonitor] User not authenticated, stopping monitor');
      // Clear active order since user logged out
      await AsyncStorage.multiRemove([ACTIVE_ORDER_KEY, LAST_STATUS_KEY]);
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Get active order ID
    const activeOrderId = await AsyncStorage.getItem(ACTIVE_ORDER_KEY);
    
    if (!activeOrderId) {
      if (__DEV__) console.log('ℹ️ [BackgroundMonitor] No active order to monitor');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Fetch current order status
    let order;
    try {
      order = await serviceRequestService.getServiceRequestById(activeOrderId);
    } catch (error: any) {
      // If 401 (session expired), stop monitoring and clear data
      if (error?.status_code === 401) {
        if (__DEV__) console.log('⏭️ [BackgroundMonitor] Session expired, stopping monitor');
        await AsyncStorage.multiRemove([ACTIVE_ORDER_KEY, LAST_STATUS_KEY]);
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }
      throw error; // Re-throw other errors
    }
    
    if (!order) {
      if (__DEV__) console.log('⚠️ [BackgroundMonitor] Order not found:', activeOrderId);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    // Get appointment status if available
    let currentStatus = order.status.toUpperCase();
    try {
      const appointments = await appointmentsService.getAppointmentsByServiceRequest(activeOrderId);
      if (appointments.length > 0) {
        currentStatus = appointments[appointments.length - 1].status.toUpperCase();
      }
    } catch (error: any) {
      // If 401 (session expired), stop monitoring
      if (error?.status_code === 401) {
        if (__DEV__) console.log('⏭️ [BackgroundMonitor] Session expired during appointment fetch, stopping monitor');
        await AsyncStorage.multiRemove([ACTIVE_ORDER_KEY, LAST_STATUS_KEY]);
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }
      // For other errors, just log warning and continue with service request status
      if (__DEV__) console.warn('⚠️ [BackgroundMonitor] Could not fetch appointment:', error);
    }

    // Get last known status
    const lastStatusJson = await AsyncStorage.getItem(LAST_STATUS_KEY);
    const lastStatus = lastStatusJson ? JSON.parse(lastStatusJson) : null;

    if (__DEV__) {
      console.log('📊 [BackgroundMonitor] Status check:', {
        orderId: activeOrderId,
        lastStatus: lastStatus?.status,
        currentStatus,
      });
    }

    // Check if status changed
    if (!lastStatus || lastStatus.orderId !== activeOrderId || lastStatus.status !== currentStatus) {
      if (__DEV__) console.log('🔔 [BackgroundMonitor] Status changed! Checking if notification needed...');

      // Check if notification was already sent for this status (deduplication)
      const alreadySent = await notificationDeduplicator.wasNotificationSent(activeOrderId, currentStatus);
      
      if (alreadySent) {
        if (__DEV__) console.log('⏭️ [BackgroundMonitor] Notification already sent for this status, skipping');
        
        // Update last status but don't send notification
        await AsyncStorage.setItem(
          LAST_STATUS_KEY,
          JSON.stringify({
            orderId: activeOrderId,
            status: currentStatus,
            timestamp: new Date().toISOString(),
          })
        );
        
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      // Send notification based on status
      const serviceName = order.serviceDescription || 'Dịch vụ';
      let notificationId: string | null = null;
      
      switch (currentStatus) {
        case 'PENDING':
        case 'QUOTED':
          notificationId = await notificationService.notifyOrderPending(activeOrderId, serviceName);
          break;
        case 'ACCEPTED':
        case 'SCHEDULED':
        case 'QUOTEACCEPTED':
          notificationId = await notificationService.notifyOrderAccepted(activeOrderId, serviceName);
          break;
        case 'EN_ROUTE':
          notificationId = await notificationService.notifyOrderEnRoute(activeOrderId, serviceName);
          break;
        case 'ARRIVED':
          notificationId = await notificationService.notifyOrderArrived(activeOrderId, serviceName);
          break;
        case 'PRICE_REVIEW':
          notificationId = await notificationService.notifyOrderPriceReview(activeOrderId, serviceName);
          break;
        case 'CHECKING':
        case 'REPAIRING':
        case 'IN_PROGRESS':
          notificationId = await notificationService.notifyOrderInProgress(activeOrderId, serviceName);
          break;
        case 'COMPLETED':
          notificationId = await notificationService.notifyOrderCompleted(activeOrderId, serviceName);
          // Clear active order after completion
          await AsyncStorage.removeItem(ACTIVE_ORDER_KEY);
          // Clear notification history for this order
          await notificationDeduplicator.clearOrderHistory(activeOrderId);
          break;
      }

      // Mark notification as sent to prevent duplicates
      if (notificationId) {
        await notificationDeduplicator.markNotificationSent(activeOrderId, currentStatus, notificationId);
        if (__DEV__) console.log('✅ [BackgroundMonitor] Notification sent and marked');
      }

      // Save new status
      await AsyncStorage.setItem(
        LAST_STATUS_KEY,
        JSON.stringify({
          orderId: activeOrderId,
          status: currentStatus,
          timestamp: new Date().toISOString(),
        })
      );

      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    if (__DEV__) console.error('❌ [BackgroundMonitor] Background task failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

class BackgroundOrderMonitor {
  private static instance: BackgroundOrderMonitor;

  public static getInstance(): BackgroundOrderMonitor {
    if (!BackgroundOrderMonitor.instance) {
      BackgroundOrderMonitor.instance = new BackgroundOrderMonitor();
    }
    return BackgroundOrderMonitor.instance;
  }

  /**
   * Start monitoring an order
   */
  public async startMonitoring(orderId: string): Promise<void> {
    try {
      if (__DEV__) console.log('🚀 [BackgroundMonitor] Starting monitoring for order:', orderId);

      // Save active order ID
      await AsyncStorage.setItem(ACTIVE_ORDER_KEY, orderId);

      // Register background fetch task
      await BackgroundFetch.registerTaskAsync(BACKGROUND_ORDER_CHECK_TASK, {
        minimumInterval: 60, // Check every 60 seconds (minimum allowed)
        stopOnTerminate: false, // Continue after app termination
        startOnBoot: true, // Start after device reboot
      });

      if (__DEV__) console.log('✅ [BackgroundMonitor] Background monitoring started');
    } catch (error: any) {
      // Silently ignore if Background Fetch is not configured
      // This is expected in development or if iOS permissions are not set
      if (error?.message?.includes('Background Fetch has not been configured')) {
        if (__DEV__) console.log('⏭️ [BackgroundMonitor] Background Fetch not configured, skipping');
      } else {
        if (__DEV__) console.error('❌ [BackgroundMonitor] Failed to start monitoring:', error);
      }
    }
  }

  /**
   * Stop monitoring
   */
  public async stopMonitoring(): Promise<void> {
    try {
      if (__DEV__) console.log('🛑 [BackgroundMonitor] Stopping background monitoring...');

      // Check if task is registered before trying to unregister
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_ORDER_CHECK_TASK);
      if (isRegistered) {
        await BackgroundFetch.unregisterTaskAsync(BACKGROUND_ORDER_CHECK_TASK);
        if (__DEV__) console.log('✅ [BackgroundMonitor] Task unregistered');
      } else {
        if (__DEV__) console.log('ℹ️ [BackgroundMonitor] Task was not registered, skipping unregister');
      }

      await AsyncStorage.removeItem(ACTIVE_ORDER_KEY);
      await AsyncStorage.removeItem(LAST_STATUS_KEY);

      if (__DEV__) console.log('✅ [BackgroundMonitor] Background monitoring stopped');
    } catch (error) {
      if (__DEV__) console.error('❌ [BackgroundMonitor] Failed to stop monitoring:', error);
    }
  }

  /**
   * Check if background monitoring is active
   */
  public async isMonitoring(): Promise<boolean> {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_ORDER_CHECK_TASK);
      return isRegistered;
    } catch (error) {
      if (__DEV__) console.error('❌ [BackgroundMonitor] Failed to check monitoring status:', error);
      return false;
    }
  }

  /**
   * Get current monitored order ID
   */
  public async getMonitoredOrderId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACTIVE_ORDER_KEY);
    } catch (error) {
      if (__DEV__) console.error('❌ [BackgroundMonitor] Failed to get monitored order:', error);
      return null;
    }
  }
}

// Export singleton instance
export const backgroundOrderMonitor = BackgroundOrderMonitor.getInstance();
