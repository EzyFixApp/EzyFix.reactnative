import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Alert,
  StatusBar,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { locationService } from '../lib/api/location';
import type { AddressSuggestion } from '../lib/api/location';

interface AddressSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onAddressSelect: (address: string, lat: number, lng: number, components?: any) => void;
  initialValue?: string;
}

export default function AddressSearchModal({
  visible,
  onClose,
  onAddressSelect,
  initialValue = ''
}: AddressSearchModalProps) {
  const [searchText, setSearchText] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    suggestion: AddressSuggestion;
  } | null>(null);

  useEffect(() => {
    if (visible) {
      setSearchText(initialValue);
    }
  }, [visible, initialValue]);

  useEffect(() => {
    const searchAddresses = async () => {
      if (searchText.length < 3) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const results = await locationService.searchAddresses(searchText);
        setSuggestions(results);
      } catch (error) {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchAddresses, 500);
    return () => clearTimeout(debounce);
  }, [searchText]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền truy cập vị trí', 'Vui lòng cấp quyền để sử dụng tính năng này');
        return;
      }

      setLoading(true);
      
      // Get GPS coordinates
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Reverse geocode to get detailed address components
      try {
        const geocodeResult = await locationService.reverseGeocode(latitude, longitude);
        
        if (geocodeResult) {
          // Parse address components
          const parsed = locationService.parseAddressComponents(geocodeResult);
          const addressText = geocodeResult.display_name || 'Vị trí hiện tại';
          
          const currentLocationSuggestion: AddressSuggestion = {
            id: 'current',
            description: addressText,
            mainText: parsed.street || addressText.split(',')[0] || 'Vị trí hiện tại',
            secondaryText: `${parsed.province}, ${parsed.city}`,
            latitude: latitude,
            longitude: longitude,
            distance: 0,
            addressComponents: {
              ...geocodeResult,
              parsed: parsed // Include parsed components for later use
            }
          };

          setSelectedLocation({
            latitude: latitude,
            longitude: longitude,
            address: addressText,
            suggestion: currentLocationSuggestion
          });
          
          setSearchText(addressText);
        } else {
          throw new Error('No geocode result');
        }
      } catch (geocodeError) {
        console.error('Reverse geocode error:', geocodeError);
        
        // Fallback: use basic coordinates if reverse geocoding fails
        const addressText = `Vị trí hiện tại (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
        
        const currentLocationSuggestion: AddressSuggestion = {
          id: 'current',
          description: addressText,
          mainText: 'Vị trí hiện tại',
          secondaryText: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
          latitude: latitude,
          longitude: longitude,
          distance: 0,
          addressComponents: {
            display_name: addressText,
            lat: latitude,
            lon: longitude
          }
        };

        setSelectedLocation({
          latitude: latitude,
          longitude: longitude,
          address: addressText,
          suggestion: currentLocationSuggestion
        });
        
        setSearchText(addressText);
        Alert.alert('Cảnh báo', 'Đã lấy tọa độ nhưng không thể tự động điền địa chỉ chi tiết.');
      }
    } catch (error) {
      console.error('Get location error:', error);
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setSearchText(suggestion.description);
    setSuggestions([]);
    
    setSelectedLocation({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      address: suggestion.description,
      suggestion
    });
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onAddressSelect(
        selectedLocation.address,
        selectedLocation.latitude,
        selectedLocation.longitude,
        selectedLocation.suggestion.addressComponents || { display_name: selectedLocation.address }
      );
      handleClose();
    } else if (searchText.trim()) {
      onAddressSelect(searchText.trim(), 0, 0);
      handleClose();
    }
  };

  const handleClose = () => {
    setSearchText('');
    setSuggestions([]);
    setSelectedLocation(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chọn địa chỉ</Text>
          <TouchableOpacity 
            style={[styles.confirmButton, !selectedLocation && !searchText.trim() && styles.confirmButtonDisabled]} 
            onPress={handleConfirm}
            disabled={!selectedLocation && !searchText.trim()}
          >
            <Text style={[styles.confirmButtonText, !selectedLocation && !searchText.trim() && styles.confirmButtonTextDisabled]}>
              Xác nhận
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm địa chỉ..."
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={setSearchText}
              autoFocus
            />
            {loading && <ActivityIndicator size="small" color="#609CEF" />}
          </View>
          
          <TouchableOpacity style={styles.currentLocationButton} onPress={getCurrentLocation}>
            <Ionicons name="location" size={20} color="#609CEF" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Location Button */}
          <TouchableOpacity 
            style={[styles.currentLocationCard, loading && styles.currentLocationCardDisabled]} 
            onPress={getCurrentLocation}
            disabled={loading}
          >
            <View style={styles.currentLocationIcon}>
              {loading ? (
                <ActivityIndicator size="small" color="#609CEF" />
              ) : (
                <Ionicons name="locate" size={24} color="#609CEF" />
              )}
            </View>
            <View style={styles.currentLocationText}>
              <Text style={styles.currentLocationTitle}>
                {loading ? 'Đang lấy vị trí...' : 'Sử dụng vị trí hiện tại'}
              </Text>
              <Text style={styles.currentLocationSubtitle}>
                {loading ? 'Vui lòng chờ...' : 'Tự động xác định địa chỉ của bạn'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Selected Location Info */}
          {selectedLocation && (
            <View style={styles.selectedLocationCard}>
              <View style={styles.selectedLocationHeader}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.selectedLocationTitle}>Địa chỉ đã chọn</Text>
              </View>
              <Text style={styles.selectedLocationAddress}>{selectedLocation.address}</Text>
              <View style={styles.selectedLocationCoords}>
                <Text style={styles.coordsText}>
                  Tọa độ: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Kết quả tìm kiếm</Text>
              {suggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={[
                    styles.suggestionItem,
                    selectedLocation?.suggestion.id === suggestion.id && styles.suggestionItemSelected
                  ]}
                  onPress={() => handleSelectSuggestion(suggestion)}
                >
                  <View style={styles.suggestionIcon}>
                    <Ionicons 
                      name={selectedLocation?.suggestion.id === suggestion.id ? "checkmark-circle" : "location-outline"} 
                      size={20} 
                      color={selectedLocation?.suggestion.id === suggestion.id ? "#10B981" : "#6B7280"} 
                    />
                  </View>
                  <View style={styles.suggestionText}>
                    <Text style={styles.suggestionMainText}>{suggestion.mainText}</Text>
                    <Text style={styles.suggestionSecondaryText}>{suggestion.secondaryText}</Text>
                    {suggestion.distance && suggestion.distance > 0 && (
                      <Text style={styles.suggestionDistance}>
                        Cách {suggestion.distance.toFixed(1)} km
                      </Text>
                    )}
                  </View>
                  {selectedLocation?.suggestion.id === suggestion.id && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedBadgeText}>Đã chọn</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Empty State */}
          {!loading && searchText.length >= 3 && suggestions.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>Không tìm thấy địa chỉ</Text>
              <Text style={styles.emptyStateSubtitle}>
                Thử tìm kiếm với từ khóa khác hoặc sử dụng vị trí hiện tại
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#609CEF',
    borderRadius: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmButtonTextDisabled: {
    color: '#9CA3AF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  currentLocationButton: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  content: {
    flex: 1,
  },
  currentLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  currentLocationCardDisabled: {
    opacity: 0.6,
  },
  currentLocationIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#EBF5FF',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationText: {
    flex: 1,
  },
  currentLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  currentLocationSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedLocationCard: {
    backgroundColor: '#F0FDF4',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  selectedLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  selectedLocationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  selectedLocationAddress: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
    marginBottom: 8,
  },
  selectedLocationCoords: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  coordsText: {
    fontSize: 12,
    color: '#059669',
    fontFamily: 'monospace',
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  suggestionItemSelected: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  suggestionIcon: {
    padding: 2,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionMainText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  suggestionSecondaryText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  suggestionDistance: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  selectedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});