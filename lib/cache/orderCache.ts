// Simple in-memory cache for order details
// This avoids prop drilling and allows easy data sharing between screens

interface CachedOrder {
  id: string;
  serviceName: string;
  customerName: string;
  customerPhone: string;
  address: string;
  description: string;
  images?: string[];
  status: string;
  createdAt: string;
  appointmentDate: string;
  appointmentTime: string;
  distance: string;
  addressNote?: string;
}

class OrderCache {
  private cache: Map<string, CachedOrder> = new Map();

  set(orderId: string, order: CachedOrder) {
    this.cache.set(orderId, order);
  }

  get(orderId: string): CachedOrder | undefined {
    return this.cache.get(orderId);
  }

  clear() {
    this.cache.clear();
  }

  remove(orderId: string) {
    this.cache.delete(orderId);
  }
}

export const orderCache = new OrderCache();
export type { CachedOrder };
