import React from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import OrderTrackingScreen from '../../components/OrderTrackingScreen';
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';

function TechnicianOrderTracking() {
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

// Export protected component
export default withTechnicianAuth(TechnicianOrderTracking, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});
