import React from 'react';
import { router, Stack } from 'expo-router';
import RegisterScreen from '../../components/RegisterScreen';

export default function CustomerRegister() {
  const handleBack = () => {
    router.back();
  };

  const handleSuccess = () => {
    router.replace('/customer/login');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <RegisterScreen
        onBack={handleBack}
        onSuccess={handleSuccess}
        userType="customer"
      />
    </>
  );
}
