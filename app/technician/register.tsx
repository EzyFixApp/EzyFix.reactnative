import React from 'react';
import { router, Stack } from 'expo-router';
import RegisterScreen from '../../components/RegisterScreen';

export default function TechnicianRegister() {
  const handleBack = () => {
    router.back();
  };

  const handleSuccess = () => {
    router.replace('./login');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <RegisterScreen
        onBack={handleBack}
        onSuccess={handleSuccess}
        userType="technician"
      />
    </>
  );
}
