import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../../store/authStore';
import CustomerDashboard from '../../components/CustomerDashboard';

export default function CustomerDashboardPage() {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Check authentication first
    if (!isAuthenticated) {
      router.replace('/customer/login');
      return;
    }

    // Check if user has verified their email
    // isVerify: false means user never verified their email after registration
    if (user?.isVerify === false && user?.email) {
      router.replace(`/customer/verify?email=${encodeURIComponent(user.email)}`);
      return;
    }
  }, [isAuthenticated, user?.isVerify, user?.email]);

  // Show loading while checking authentication and verification
  if (!isAuthenticated || user?.isVerify === false) {
    return null;
  }

  return <CustomerDashboard />;
}