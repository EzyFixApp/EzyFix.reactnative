import React from 'react';
import { router, Stack } from 'expo-router';
import ForgotPasswordScreen from '../../components/ForgotPasswordScreen';

export default function CustomerForgotPassword() {
  const handleBack = () => {
    router.back();
  };

  const handleSuccess = () => {
    router.replace('/customer/login');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ForgotPasswordScreen
        onBack={handleBack}
        onSuccess={handleSuccess}
        userType="customer"
      />
    </>
  );
}
