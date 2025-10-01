import { router } from 'expo-router';
import LoginScreen from '../../components/LoginScreen';

export default function CustomerLogin() {
  const handleBack = () => {
    router.push('/home');
  };

  const handleLogin = () => {
    // Navigate to customer dashboard after successful login
    router.push('./dashboard');
  };

  return <LoginScreen onBack={handleBack} onLogin={handleLogin} userType="customer" />;
}