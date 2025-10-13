import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Technician() {
  useEffect(() => {
    // Redirect to dashboard immediately
    router.replace('/technician/dashboard');
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <View>
        <Text style={{ fontSize: 16, color: '#666' }}>Đang chuyển hướng...</Text>
      </View>
    </SafeAreaView>
  );
}