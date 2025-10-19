import { router } from 'expo-router';
import LoginScreen from '../../components/LoginScreen';
import { useAuthStore } from '../../store/authStore';

export default function CustomerLogin() {
  const handleBack = () => {
    router.push('/home');
  };

  const handleLogin = () => {
    // Get current user state to check verification after login
    const currentUser = useAuthStore.getState().user;
    
    if (currentUser?.isVerify === false && currentUser?.email) {
      // User email is not verified, redirect to verify page
      router.replace(`/customer/verify?email=${encodeURIComponent(currentUser.email)}`);
    } else {
      // User is verified or verification status unknown, navigate to dashboard
      router.replace('/customer/dashboard');
    }
  };

  return <LoginScreen onBack={handleBack} onLogin={handleLogin} userType="customer" />;
}