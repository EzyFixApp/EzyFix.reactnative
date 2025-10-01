import { router } from 'expo-router';
import LoginScreen from '../../components/LoginScreen';

export default function TechnicianLogin() {
  const handleBack = () => {
    router.push('/home');
  };

  const handleLogin = () => {
    // Navigate to technician dashboard after successful login
    router.push('./dashboard');
  };

  return <LoginScreen onBack={handleBack} onLogin={handleLogin} userType="technician" title="Chào mừng thợ sửa chữa!" subtitle="Đăng nhập để bắt đầu công việc" />;
}