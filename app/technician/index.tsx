import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Technician() {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <View>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Technician Portal</Text>
        <Text style={{ fontSize: 16, color: '#666', marginTop: 10 }}>
          Chào mừng bạn đến với khu vực dành cho thợ sửa chữa
        </Text>
      </View>
    </SafeAreaView>
  );
}