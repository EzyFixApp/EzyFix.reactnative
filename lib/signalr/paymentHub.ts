/**
 * SignalR Payment Hub Service
 * Manages realtime payment status updates via SignalR
 */

import { 
  HubConnection, 
  HubConnectionBuilder, 
  HubConnectionState, 
  LogLevel 
} from '@microsoft/signalr';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STORAGE_KEYS } from '../api/config';

export interface PaymentUpdatePayload {
  appointmentId: string;
  status: string;
  paymentStatus: string;
  amount: number;
  transactionId?: string;
  timestamp: string;
}

type PaymentUpdateCallback = (payload: PaymentUpdatePayload) => void;

class PaymentHubService {
  private static instance: PaymentHubService;
  private connection: HubConnection | null = null;
  private callbacks: Set<PaymentUpdateCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  private constructor() {}

  public static getInstance(): PaymentHubService {
    if (!PaymentHubService.instance) {
      PaymentHubService.instance = new PaymentHubService();
    }
    return PaymentHubService.instance;
  }

  /**
   * Initialize and start SignalR connection
   */
  public async start(): Promise<void> {
    try {
      if (this.connection?.state === HubConnectionState.Connected) {
        if (__DEV__) {
          console.log('✅ SignalR already connected');
        }
        return;
      }

      // Get access token
      const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!accessToken) {
        throw new Error('No access token available for SignalR connection');
      }

      // Create connection
      this.connection = new HubConnectionBuilder()
        .withUrl(`${API_BASE_URL}/hubs/payments`, {
          accessTokenFactory: () => accessToken,
          // Use WebSockets for better performance
          // transport: HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Exponential backoff: 2s, 4s, 8s, 16s, 32s
            const delay = Math.min(2000 * Math.pow(2, retryContext.previousRetryCount), 32000);
            if (__DEV__) {
              console.log(`⏳ Reconnecting in ${delay}ms (attempt ${retryContext.previousRetryCount + 1})`);
            }
            return delay;
          },
        })
        .configureLogging(__DEV__ ? LogLevel.Information : LogLevel.Warning)
        .build();

      // Setup event handlers
      this.setupEventHandlers();

      // Start connection
      await this.connection.start();
      this.reconnectAttempts = 0;

      if (__DEV__) {
        console.log('✅ SignalR Payment Hub connected successfully');
      }
    } catch (error) {
      console.error('❌ Failed to start SignalR connection:', error);
      
      // Retry logic
      this.reconnectAttempts++;
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = 3000 * this.reconnectAttempts;
        if (__DEV__) {
          console.log(`🔄 Retrying connection in ${delay}ms...`);
        }
        setTimeout(() => this.start(), delay);
      }
      
      throw error;
    }
  }

  /**
   * Stop SignalR connection
   */
  public async stop(): Promise<void> {
    try {
      if (this.connection?.state === HubConnectionState.Connected) {
        await this.connection.stop();
        if (__DEV__) {
          console.log('🛑 SignalR Payment Hub disconnected');
        }
      }
      this.connection = null;
      this.callbacks.clear();
    } catch (error) {
      console.error('❌ Error stopping SignalR connection:', error);
    }
  }

  /**
   * Setup SignalR event handlers
   */
  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Listen for PaymentUpdated event
    this.connection.on('PaymentUpdated', (payload: PaymentUpdatePayload) => {
      if (__DEV__) {
        console.log('💳 PaymentUpdated event received:', payload);
      }

      // Notify all subscribers
      this.callbacks.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error('❌ Error in payment update callback:', error);
        }
      });
    });

    // Connection lifecycle events
    this.connection.onreconnecting((error) => {
      if (__DEV__) {
        console.log('🔄 SignalR reconnecting...', error);
      }
    });

    this.connection.onreconnected((connectionId) => {
      if (__DEV__) {
        console.log('✅ SignalR reconnected:', connectionId);
      }
      this.reconnectAttempts = 0;
    });

    this.connection.onclose((error) => {
      if (__DEV__) {
        console.log('🔌 SignalR connection closed:', error);
      }
    });
  }

  /**
   * Subscribe to payment updates
   */
  public subscribe(callback: PaymentUpdateCallback): () => void {
    this.callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Check connection state
   */
  public isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }

  /**
   * Get connection state
   */
  public getState(): HubConnectionState | null {
    return this.connection?.state ?? null;
  }
}

// Export singleton instance
export const paymentHub = PaymentHubService.getInstance();
