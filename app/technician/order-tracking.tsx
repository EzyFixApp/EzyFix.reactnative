import React from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import OrderTrackingScreen from '../../components/OrderTrackingScreen';

export default function TechnicianOrderTracking() {
  // Get params from route
  const { orderId, quoteType, quoteAmount } = useLocalSearchParams<{ 
    orderId: string;
    quoteType: string;
    quoteAmount: string;
  }>();
  const finalOrderId = orderId || 'order_123';

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OrderTrackingScreen
        orderId={finalOrderId}
        userType="technician"
        onBack={handleBack}
        quoteType={quoteType as 'estimated' | 'final'}
        quoteAmount={quoteAmount}
      />
    </>
  );
}
