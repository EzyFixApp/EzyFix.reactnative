/**
 * Technician Map View Component - WebView Version with MapTiler
 * Real-time map tracking for Expo Go compatibility
 * Uses MapLibre GL + MapTiler for beautiful maps
 * Geocodes address if coordinates not provided
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TechnicianMapViewProps {
  customerLatitude?: number; // Optional, will geocode from address if not provided
  customerLongitude?: number; // Optional, will geocode from address if not provided
  customerAddress: string;
  onClose: () => void;
  onArrived?: () => void;
}

export default function TechnicianMapView({
  customerLatitude: propCustomerLatitude,
  customerLongitude: propCustomerLongitude,
  customerAddress,
  onClose,
  onArrived,
}: TechnicianMapViewProps) {
  const webViewRef = useRef<WebView>(null);
  
  const [technicianLocation, setTechnicianLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  const [customerLocation, setCustomerLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<string>('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Geocode customer address if lat/lng not provided
  useEffect(() => {
    const geocodeAddress = async () => {
      // If we already have coordinates, use them
      if (propCustomerLatitude && propCustomerLongitude) {
        console.log('✅ Using provided customer coordinates:', {
          lat: propCustomerLatitude,
          lng: propCustomerLongitude
        });
        setCustomerLocation({
          latitude: propCustomerLatitude,
          longitude: propCustomerLongitude
        });
        return;
      }

      // Otherwise, geocode the address
      if (!customerAddress) {
        console.error('❌ No customer address or coordinates provided');
        return;
      }

      console.log('🔍 Geocoding customer address:', customerAddress);
      setIsLoadingAddress(true);

      try {
        const results = await Location.geocodeAsync(customerAddress);
        
        if (results && results.length > 0) {
          const { latitude, longitude } = results[0];
          console.log('✅ Geocoded customer location:', { latitude, longitude });
          setCustomerLocation({ latitude, longitude });
        } else {
          console.error('❌ No geocoding results for address:', customerAddress);
        }
      } catch (error) {
        console.error('❌ Geocoding error:', error);
      } finally {
        setIsLoadingAddress(false);
      }
    };

    geocodeAddress();
  }, [propCustomerLatitude, propCustomerLongitude, customerAddress]);

  // Start tracking technician's location
  useEffect(() => {
    if (!customerLocation) return; // Wait for customer location first

    let locationSubscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      try {
        console.log('🌍 Requesting location permissions...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('📍 Location permission status:', status);
        
        if (status !== 'granted') {
          console.error('❌ Location permission denied');
          return;
        }

        console.log('📡 Getting initial GPS location...');
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const newLoc = {
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude,
        };
        
        console.log('✅ Initial GPS location:', newLoc);
        console.log('📌 Customer location:', customerLocation);
        
        setTechnicianLocation(newLoc);
        
        // Calculate initial distance
        const dist = calculateDistance(
          newLoc.latitude,
          newLoc.longitude,
          customerLocation.latitude,
          customerLocation.longitude
        );
        setDistance(dist);
        const estimatedMinutes = Math.ceil((dist / 30) * 60);
        setDuration(estimatedMinutes > 0 ? `${estimatedMinutes} phút` : '< 1 phút');

        // Subscribe to location updates
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 15,
          },
          (location) => {
            const updatedLoc = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            
            setTechnicianLocation(updatedLoc);

            // Update marker on map via WebView
            if (webViewRef.current && mapLoaded) {
              webViewRef.current.injectJavaScript(`
                if (typeof updateTechnicianPosition === 'function') {
                  updateTechnicianPosition(${location.coords.latitude}, ${location.coords.longitude});
                }
                true;
              `);
            }

            // Calculate distance
            const dist = calculateDistance(
              location.coords.latitude,
              location.coords.longitude,
              customerLocation.latitude,
              customerLocation.longitude
            );
            setDistance(dist);

            const estimatedMinutes = Math.ceil((dist / 30) * 60);
            setDuration(estimatedMinutes > 0 ? `${estimatedMinutes} phút` : '< 1 phút');
          }
        );
      } catch (error) {
        console.error('Error starting location tracking:', error);
      }
    };

    startTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [customerLocation, mapLoaded]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg: number): number => deg * (Math.PI / 180);

  const handleRecenter = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript('recenterMap(); true;');
    }
  };

  const handleFitRoute = () => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript('fitRoute(); true;');
    }
  };

  const handleOpenGoogleMaps = () => {
    if (!customerLocation) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${customerLocation.latitude},${customerLocation.longitude}&travelmode=driving`;
    Linking.openURL(url);
  };

  const handleArrivedPress = () => {
    if (!distance) return;
    
    // Check if within 1.5km radius
    if (distance > 1.5) {
      Alert.alert(
        'Quá xa!',
        `Bạn đang cách địa điểm ${distance.toFixed(2)} km. Chỉ có thể xác nhận đã đến khi trong bán kính 1.5 km.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Within valid range, call the onArrived callback
    console.log(`✅ Distance check passed: ${distance.toFixed(2)} km < 1.5 km`);
    onArrived?.();
  };

  // Show loading while geocoding
  if (isLoadingAddress || !customerLocation) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#609CEF" />
          <Text style={styles.loadingText}>
            {isLoadingAddress ? 'Đang tìm vị trí khách hàng...' : 'Đang khởi tạo bản đồ...'}
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>
    );
  }

  const techLat = technicianLocation?.latitude || customerLocation.latitude;
  const techLng = technicianLocation?.longitude || customerLocation.longitude;

  const mapHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>
  <link href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #map { width: 100%; height: 100%; }
    .marker {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .marker-tech {
      background-color: #609CEF;
      width: 20px;
      height: 20px;
    }
    .marker-customer {
      background-color: #10B981;
      width: 28px;
      height: 28px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    let map;
    let technicianMarker;
    let customerMarker;
    
    console.log('🗺️ Initializing map...');
    console.log('📍 Tech position:', { lat: ${techLat}, lng: ${techLng} });
    console.log('📍 Customer position:', { lat: ${customerLocation.latitude}, lng: ${customerLocation.longitude} });
    
    function initMap() {
      try {
        console.log('🔧 Creating MapLibre instance...');
        
        // Initialize MapLibre with MapTiler
        map = new maplibregl.Map({
          container: 'map',
          style: 'https://api.maptiler.com/maps/streets-v2/style.json?key=r8okjomqwZjXoRl6oYvZ',
          center: [(${techLng} + ${customerLocation.longitude}) / 2, (${techLat} + ${customerLocation.latitude}) / 2],
          zoom: 14,
          pitch: 0,
          bearing: 0
        });
        
        console.log('✅ MapLibre instance created');
        
        map.on('error', (e) => {
          console.error('❌ Map error:', e);
          window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'error', message: e.error?.message || 'Map error' }));
        });
      
        map.on('load', function() {
          console.log('🎨 Map loaded! Adding markers and route...');
          
          // Add route line layer (dashed)
          map.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [
                  [${techLng}, ${techLat}],
                  [${customerLocation.longitude}, ${customerLocation.latitude}]
                ]
              }
            }
          });
          
          map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#609CEF',
              'line-width': 3,
              'line-dasharray': [2, 2]
            }
          });
          
          // Customer marker (green)
          const customerEl = document.createElement('div');
          customerEl.className = 'marker marker-customer';
          
          customerMarker = new maplibregl.Marker({ element: customerEl })
            .setLngLat([${customerLocation.longitude}, ${customerLocation.latitude}])
            .addTo(map);
          
          // Technician marker (blue)
          const techEl = document.createElement('div');
          techEl.className = 'marker marker-tech';
          
          technicianMarker = new maplibregl.Marker({ element: techEl })
            .setLngLat([${techLng}, ${techLat}])
            .addTo(map);
          
          // Fit to show both markers
          setTimeout(() => {
            const bounds = new maplibregl.LngLatBounds()
              .extend([${techLng}, ${techLat}])
              .extend([${customerLocation.longitude}, ${customerLocation.latitude}]);
            map.fitBounds(bounds, { padding: { top: 100, right: 80, bottom: 300, left: 80 } });
            console.log('✅ Markers added and fitted to bounds');
          }, 500);
        });
      } catch (error) {
        console.error('❌ Error initializing map:', error);
        window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'error', message: error.message }));
      }
    }
    
    initMap();
    
    function updateTechnicianPosition(lat, lng) {
      if (technicianMarker) {
        technicianMarker.setLngLat([lng, lat]);
        
        // Update route line
        if (map.getSource('route')) {
          map.getSource('route').setData({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [lng, lat],
                [${customerLocation.longitude}, ${customerLocation.latitude}]
              ]
            }
          });
        }
      }
    }
    
    function recenterMap() {
      if (map && technicianMarker) {
        const lngLat = technicianMarker.getLngLat();
        map.flyTo({ center: [lngLat.lng, lngLat.lat], zoom: 16, duration: 1000 });
      }
    }
    
    function fitRoute() {
      if (map && technicianMarker && customerMarker) {
        const techPos = technicianMarker.getLngLat();
        const custPos = customerMarker.getLngLat();
        
        const bounds = new maplibregl.LngLatBounds()
          .extend([techPos.lng, techPos.lat])
          .extend([custPos.lng, custPos.lat]);
        
        map.fitBounds(bounds, { padding: { top: 100, right: 80, bottom: 300, left: 80 }, duration: 1000 });
      }
    }
  </script>
</body>
</html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: mapHTML }}
        style={styles.map}
        onLoadStart={() => console.log('🗺️ WebView loading...')}
        onLoadEnd={() => {
          console.log('✅ WebView loaded successfully');
          setMapLoaded(true);
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('❌ WebView error:', nativeEvent);
        }}
        onMessage={(event) => {
          console.log('💬 WebView message:', event.nativeEvent.data);
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={24} color="#1F2937" />
      </TouchableOpacity>

      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.controlButton} onPress={handleRecenter}>
          <Ionicons name="locate" size={24} color="#609CEF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleFitRoute}>
          <Ionicons name="resize-outline" size={24} color="#609CEF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleOpenGoogleMaps}>
          <Ionicons name="navigate" size={24} color="#609CEF" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <View style={styles.infoRow}>
            <Ionicons name="navigate-circle" size={20} color="#609CEF" />
            <Text style={styles.infoLabel}>Khoảng cách</Text>
          </View>
          <Text style={styles.infoValue}>
            {distance !== null ? `${distance.toFixed(2)} km` : 'Đang tính...'}
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.infoHeader}>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={20} color="#F59E0B" />
            <Text style={styles.infoLabel}>Thời gian dự kiến</Text>
          </View>
          <Text style={styles.infoValue}>{duration}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.addressRow}>
          <Ionicons name="location" size={20} color="#10B981" />
          <Text style={styles.addressText} numberOfLines={2}>
            {customerAddress}
          </Text>
        </View>
      </View>

      {/* Show "Arrived" button when within 1.5km, change color based on distance */}
      {distance !== null && distance < 1.5 && onArrived && (
        <TouchableOpacity 
          style={[
            styles.arrivedButton,
            distance > 0.5 && styles.arrivedButtonWarning
          ]} 
          onPress={handleArrivedPress}
        >
          <Ionicons name="checkmark-circle" size={24} color="white" />
          <Text style={styles.arrivedButtonText}>
            {distance < 0.1 
              ? 'Tôi đã đến nơi' 
              : `Xác nhận đã đến (${distance.toFixed(2)} km)`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mapControls: {
    position: 'absolute',
    top: 50,
    right: 20,
    gap: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoCard: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  arrivedButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  arrivedButtonWarning: {
    backgroundColor: '#F59E0B', // Orange/yellow when distance > 0.5km
  },
  arrivedButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '700',
  },
});
