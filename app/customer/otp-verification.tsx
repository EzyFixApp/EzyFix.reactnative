import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router';
import OTPVerificationScreen from '../../components/OTPVerificationScreen';

export default function CustomerOTPVerification() {
  const params = useLocalSearchParams();
  const email = params.email as string;
  const purpose = (params.purpose as 'registration' | 'password-reset') || 'registration';

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false
        }} 
      />
      <OTPVerificationScreen
        email={email}
        purpose={purpose}
        userType="customer"
      />
    </>
  );
}