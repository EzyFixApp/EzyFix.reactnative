import { ApiResponse } from '../../types/api';

export interface AddressSuggestion {
  id: string;
  description: string;
  mainText: string;
  secondaryText: string;
  latitude: number;
  longitude: number;
  distance?: number;
  addressComponents?: any;
}

export interface AddressDetails {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  addressComponents: any;
}

class LocationService {
  private readonly BASE_URL = 'https://nominatim.openstreetmap.org';

  async searchAddresses(input: string): Promise<AddressSuggestion[]> {
    try {
      if (input.length < 3) {
        return [];
      }

      // Add delay to respect Nominatim usage policy
      await this.delay(1000);

      // Bounding box for Ho Chi Minh City area
      // Southwest: 10.45, 106.36, Northeast: 11.16, 107.02
      const bbox = '106.36,10.45,107.02,11.16';

      const response = await fetch(
        `${this.BASE_URL}/search?` +
        `q=${encodeURIComponent(input + ', Ho Chi Minh City, Vietnam')}&` +
        `format=json&` +
        `addressdetails=1&` +
        `countrycodes=vn&` +
        `bounded=1&` +
        `viewbox=${bbox}&` +
        `limit=10&` +
        `accept-language=vi`,
        {
          headers: {
            'User-Agent': 'EzyFix-ReactNative-App/1.0',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Filter results to only include Ho Chi Minh City addresses
      const filteredData = data.filter((item: any) => {
        const address = item.address || {};
        const displayName = item.display_name || '';
        
        // Check if address contains Ho Chi Minh City references
        const hcmKeywords = [
          'hồ chí minh', 'ho chi minh', 'hcm', 'saigon', 'sài gòn',
          'tp.hcm', 'tp hcm', 'thành phố hồ chí minh'
        ];
        
        const containsHCM = hcmKeywords.some(keyword => 
          displayName.toLowerCase().includes(keyword) ||
          (address.city && address.city.toLowerCase().includes(keyword)) ||
          (address.state && address.state.toLowerCase().includes(keyword))
        );
        
        // Also check coordinates are within HCM bounds
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        const withinBounds = lat >= 10.45 && lat <= 11.16 && lon >= 106.36 && lon <= 107.02;
        
        return containsHCM || withinBounds;
      });
      
      return filteredData.map((item: any, index: number) => ({
        id: `${item.place_id || index}`,
        description: item.display_name,
        mainText: this.extractMainAddress(item),
        secondaryText: this.extractSecondaryAddress(item),
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        addressComponents: item.address
      }));
    } catch (error) {
      console.error('Address search error:', error);
      return [];
    }
  }

  async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      // Add delay to respect Nominatim usage policy
      await this.delay(1000);

      const response = await fetch(
        `${this.BASE_URL}/reverse?` +
        `lat=${latitude}&` +
        `lon=${longitude}&` +
        `format=json&` +
        `addressdetails=1&` +
        `accept-language=vi`,
        {
          headers: {
            'User-Agent': 'EzyFix-ReactNative-App/1.0',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.display_name || '';
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return '';
    }
  }

  private extractMainAddress(item: any): string {
    const address = item.address || {};
    const parts = [
      address.house_number,
      address.road || address.street
    ].filter(Boolean);
    
    return parts.join(' ') || item.display_name.split(',')[0];
  }

  private extractSecondaryAddress(item: any): string {
    const address = item.address || {};
    
    // For HCM addresses, prioritize local district and ward info
    const parts = [
      address.suburb || address.neighbourhood || address.village,
      address.city_district || address.district,
    ].filter(Boolean);
    
    // Always end with "TP. Hồ Chí Minh" for consistency
    parts.push('TP. Hồ Chí Minh');
    
    return parts.join(', ');
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return d;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Parse full address into structured components
  parseAddressComponents(item: any): {
    street: string;
    city: string;
    province: string;
    postalCode: string;
  } {
    const address = item.address || {};
    
    const street = [
      address.house_number,
      address.road || address.street
    ].filter(Boolean).join(' ');

    // For HCM addresses, always use consistent naming
    const city = 'Thành phố Hồ Chí Minh';
    
    // Extract ward (phường) and district (quận) from OpenStreetMap data
    const ward = address.suburb || address.neighbourhood || address.quarter || '';
    const district = address.city_district || address.district || '';
    
    // Use ward as province since that's what we want to display
    let province = ward || district || 'Quận 1';
    
    // Get postal code from address or use default
    const postalCode = address.postcode || '700000';

    return {
      street: street || (item.display_name && item.display_name.split(',')[0]) || '',
      city,
      province,
      postalCode
    };
  }
}

export const locationService = new LocationService();