import React from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Stack } from 'expo-router';
import OTPVerificationScreen from '../../components/OTPVerificationScreen';

export default function CustomerVerificationPage() {
  const { email } = useLocalSearchParams<{ email: string }>();
  
  if (!email) {
    // Redirect back to login if no email provided
    router.replace('/customer/login');
    return null;
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false
        }} 
      />
      <OTPVerificationScreen 
        email={email}
        purpose="registration"
        userType="customer"
      />
    </>
  );
}