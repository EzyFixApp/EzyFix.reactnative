import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export interface UseLocationReturn {
  location: LocationCoords | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => Promise<LocationCoords | null>;
  hasPermission: boolean;
}

/**
 * Hook to handle location permissions and get current position
 */
export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  // Check permission status on mount
  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (err) {
      if (__DEV__) console.error('Check permission status error:', err);
    }
  };

  const requestLocation = async (): Promise<LocationCoords | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setHasPermission(false);
        const errorMsg = 'Bạn cần cấp quyền truy cập vị trí để nhận đơn hàng';
        setError(errorMsg);
        
        Alert.alert(
          'Cần quyền truy cập vị trí',
          'EzyFix cần quyền truy cập vị trí của bạn để tìm đơn hàng gần bạn. Vui lòng cấp quyền trong cài đặt.',
          [
            {
              text: 'Đóng',
              style: 'cancel',
            },
            {
              text: 'Mở Cài đặt',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Location.requestForegroundPermissionsAsync();
                } else {
                  // On Android, we can try to open settings
                  // This requires additional setup with expo-linking
                }
              },
            },
          ]
        );
        
        setIsLoading(false);
        return null;
      }

      setHasPermission(true);

      // Get current position
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Good balance between accuracy and battery
      });

      const coords: LocationCoords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy,
      };

      setLocation(coords);
      setIsLoading(false);
      
      if (__DEV__) {
        console.log('Location obtained:', {
          lat: coords.latitude.toFixed(6),
          lng: coords.longitude.toFixed(6),
          accuracy: coords.accuracy ? `${coords.accuracy.toFixed(0)}m` : 'unknown'
        });
      }

      return coords;
    } catch (err: any) {
      let errorMsg = 'Không thể lấy vị trí của bạn';
      
      if (err.code === 'E_LOCATION_SERVICES_DISABLED') {
        errorMsg = 'Dịch vụ định vị đang tắt. Vui lòng bật GPS trong cài đặt.';
      } else if (err.code === 'E_LOCATION_UNAVAILABLE') {
        errorMsg = 'Không thể xác định vị trí. Vui lòng kiểm tra kết nối GPS.';
      } else if (err.code === 'E_LOCATION_TIMEOUT') {
        errorMsg = 'Hết thời gian chờ định vị. Vui lòng thử lại.';
      }

      setError(errorMsg);
      setIsLoading(false);
      
      if (__DEV__) console.error('Location error:', err);

      Alert.alert(
        'Lỗi vị trí',
        errorMsg,
        [{ text: 'OK' }]
      );

      return null;
    }
  };

  return {
    location,
    isLoading,
    error,
    requestLocation,
    hasPermission,
  };
}
