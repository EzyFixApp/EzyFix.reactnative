import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  ScrollView,
  TouchableOpacity, 
  Text, 
  StyleSheet,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { locationService, AddressSuggestion } from '../lib/api/location';

interface AddressSearchInputProps {
  value: string;
  onAddressSelect: (address: string, lat: number, lng: number, components?: any) => void;
  placeholder?: string;
  error?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
}

export default function AddressSearchInput({
  value,
  onAddressSelect,
  placeholder,
  error,
  multiline = true,
  numberOfLines = 3
}: AddressSearchInputProps) {
  const [searchText, setSearchText] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [textSelection, setTextSelection] = useState({ start: 0, end: 0 });

  useEffect(() => {
    setSearchText(value);
  }, [value]);

  useEffect(() => {
    const searchAddresses = async () => {
      if (searchText.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      try {
        const results = await locationService.searchAddresses(searchText);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search để tránh gọi API quá nhiều
    const debounce = setTimeout(searchAddresses, 800);
    return () => clearTimeout(debounce);
  }, [searchText]);

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setSearchText(suggestion.description);
    setShowSuggestions(false);
    
    // Đặt con trỏ về đầu để hiển thị phần quan trọng nhất (số nhà + tên đường)
    setTimeout(() => {
      setTextSelection({ start: 0, end: 0 });
    }, 100);
    
    // Parse address components for structured data
    const components = locationService.parseAddressComponents({
      address: suggestion.addressComponents
    });
    
    onAddressSelect(
      suggestion.description, 
      suggestion.latitude, 
      suggestion.longitude,
      components
    );
  };

  const handleTextChange = (text: string) => {
    setSearchText(text);
    // Reset text selection khi người dùng gõ
    setTextSelection({ start: text.length, end: text.length });
    
    // Only call onAddressSelect if text is different from current value
    // to avoid interference with suggestion selection
    if (text !== value) {
      onAddressSelect(text, 0, 0, undefined);
    }
  };

  const handleBlur = () => {
    // Hide suggestions when input loses focus
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200); // Delay to allow suggestion tap
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.inputContainer,
        error && styles.inputError
      ]}>
        <Ionicons name="location" size={20} color="#609CEF" />
        <TextInput
          style={styles.textInput}
          placeholder={placeholder || "Nhập địa chỉ cụ thể..."}
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          onFocus={() => searchText.length >= 3 && suggestions.length > 0 && setShowSuggestions(true)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical="top"
          selection={textSelection}
        />
        {loading && (
          <ActivityIndicator size="small" color="#609CEF" />
        )}
      </View>

      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          <View style={styles.suggestionsList}>
            {suggestions.slice(0, 5).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(item)}
                activeOpacity={0.7}
              >
                <View style={styles.locationIcon}>
                  <Ionicons name="location" size={20} color="#609CEF" />
                </View>
                <View style={styles.suggestionText}>
                  <Text style={styles.mainText}>{item.mainText}</Text>
                  <Text style={styles.distanceText}>
                    {item.distance ? `${item.distance.toFixed(2)}km • ` : '📍 '}
                    {item.secondaryText}
                  </Text>
                  <Text style={styles.secondaryText} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    backgroundColor: 'white',
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
    minHeight: 20,
    textAlignVertical: 'center',
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: 250,
    zIndex: 1001,
  },
  suggestionsList: {
    // No additional styles needed for simple View
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
    backgroundColor: 'white',
  },
  suggestionText: {
    flex: 1,
  },
  mainText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  secondaryText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 16,
  },
  distanceText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 2,
  },
  locationIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});