import { Stack } from 'expo-router';
import AnimatedHomeScreen from '../../components/AnimatedHomeScreen';

export default function HomeScreen() {
  return (
    <>
      {/* Disable swipe back gesture - this is the entry point */}
      <Stack.Screen 
        options={{ 
          headerShown: false,
          gestureEnabled: false, // Prevent swipe back (no screen before this)
        }} 
      />
      <AnimatedHomeScreen />
    </>
  );
}