/**
 * useNotifications Hook
 * Custom hook for managing push notifications in the app
 * Features:
 * - Initialize notifications on mount
 * - Handle notification responses
 * - Navigate to appropriate screens when notification tapped
 * - Quote notification helpers
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { notificationService, QuoteNotificationData } from '../lib/services/notificationService';
import { useAuth } from '../store/authStore';

export function useNotifications() {
  const router = useRouter();
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const initRef = useRef(false);

  // Initialize notifications
  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      const token = await notificationService.initialize(handleNotificationResponse);
      setExpoPushToken(token);
      setIsInitialized(true);
    };

    init();

    // Cleanup on unmount
    return () => {
      notificationService.cleanup();
    };
  }, []);

  /**
   * Handle notification tap - navigate to appropriate screen
   */
  const handleNotificationResponse = (data: any) => {
    if (__DEV__) {
      console.log('🔔 Handling notification response:', data);
    }

    // Route based on notification type
    switch (data.type) {
      case 'new_quote':
        // Customer receives new quote → navigate to booking history
        if (user?.userType === 'customer') {
          router.push('/customer/booking-history' as any);
        }
        break;

      case 'quote_accepted':
        // Technician's quote accepted → navigate to orders
        if (user?.userType === 'technician') {
          router.push('/technician/orders' as any);
        }
        break;

      case 'quote_rejected':
        // Technician's quote rejected → navigate to orders
        if (user?.userType === 'technician') {
          router.push('/technician/orders' as any);
        }
        break;

      case 'ORDER_PENDING':
      case 'ORDER_ACCEPTED':
      case 'ORDER_IN_PROGRESS':
      case 'ORDER_COMPLETED':
        // Order status updates → navigate to order tracking (Customer)
        if (user?.userType === 'customer' && data.serviceRequestId) {
          router.push({
            pathname: '/customer/order-tracking' as any,
            params: { orderId: data.serviceRequestId }
          });
        }
        break;

      // Technician notifications
      case 'TECHNICIAN_QUOTE_ACCEPTED':
      case 'TECHNICIAN_APPOINTMENT_REMINDER':
      case 'TECHNICIAN_PAYMENT_RECEIVED':
      case 'TECHNICIAN_REVIEWED':
        // Technician order updates → navigate to order tracking
        if (user?.userType === 'technician' && data.serviceRequestId) {
          router.push({
            pathname: '/technician/technician-order-tracking' as any,
            params: { 
              serviceRequestId: data.serviceRequestId,
              // offerId might be needed, but not always available from notification
            }
          });
        }
        break;

      default:
        if (__DEV__) console.warn('⚠️ Unknown notification type:', data.type);
    }
  };

  /**
   * Send notification when new quote arrives
   */
  const notifyNewQuote = async (quoteData: QuoteNotificationData) => {
    try {
      await notificationService.scheduleQuoteNotification(quoteData);
    } catch (error) {
      if (__DEV__) console.error('Failed to send quote notification:', error);
    }
  };

  /**
   * Send notification for quote accepted (Technician side)
   */
  const notifyQuoteAccepted = async (quoteData: QuoteNotificationData) => {
    try {
      await notificationService.scheduleQuoteAcceptedNotification(quoteData);
    } catch (error) {
      if (__DEV__) console.error('Failed to send acceptance notification:', error);
    }
  };

  /**
   * Send notification for quote rejected (Technician side)
   */
  const notifyQuoteRejected = async (quoteData: QuoteNotificationData) => {
    try {
      await notificationService.scheduleQuoteRejectedNotification(quoteData);
    } catch (error) {
      if (__DEV__) console.error('Failed to send rejection notification:', error);
    }
  };

  /**
   * Clear all notifications
   */
  const clearAllNotifications = async () => {
    await notificationService.clearAllNotifications();
  };

  /**
   * Get/Set badge count
   */
  const getBadgeCount = async () => {
    return await notificationService.getBadgeCount();
  };

  const setBadgeCount = async (count: number) => {
    await notificationService.setBadgeCount(count);
  };

  return {
    expoPushToken,
    isInitialized,
    notifyNewQuote,
    notifyQuoteAccepted,
    notifyQuoteRejected,
    clearAllNotifications,
    getBadgeCount,
    setBadgeCount,
  };
}
