import { router } from 'expo-router';
import LoginScreen from '../../components/LoginScreen';
import { useAuthStore } from '../../store/authStore';

export default function TechnicianLogin() {
  const handleBack = () => {
    router.push('/home');
  };

  const handleLogin = () => {
    // Get current user state to check verification after login
    const currentUser = useAuthStore.getState().user;
    
    if (currentUser?.isVerify === false && currentUser?.email) {
      // User email is not verified, redirect to verify page
      router.replace(`/technician/verify?email=${encodeURIComponent(currentUser.email)}`);
    } else {
      // User is verified or verification status unknown, navigate to dashboard
      router.replace('/technician/dashboard');
    }
  };

  return <LoginScreen onBack={handleBack} onLogin={handleLogin} userType="technician" title="Chào mừng thợ sửa chữa!" subtitle="Đăng nhập để bắt đầu công việc" />;
}