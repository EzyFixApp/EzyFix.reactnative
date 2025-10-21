import React from 'react';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import OrderTrackingScreen from '../../components/OrderTrackingScreen';
import withCustomerAuth from '../../lib/auth/withCustomerAuth';

function CustomerOrderTracking() {
  // Get orderId from route params
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const finalOrderId = orderId || 'order_123';

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OrderTrackingScreen
        orderId={finalOrderId}
        userType="customer"
        onBack={handleBack}
      />
    </>
  );
}

export default withCustomerAuth(CustomerOrderTracking, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});
