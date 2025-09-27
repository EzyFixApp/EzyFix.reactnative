import { router } from 'expo-router';
import LoginScreen from '../../components/LoginScreen';

export default function CustomerLogin() {
  const handleBack = () => {
    router.push('/home');
  };

  return <LoginScreen onBack={handleBack} />;
}