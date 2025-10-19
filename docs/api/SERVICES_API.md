# 🛠️ Services API Integration

## 📋 Overview

Documentation for the Services API integration implemented in EzyFix React Native app.

## 🏗️ Architecture

### Services API Structure
```
lib/api/
├── services.ts          # Services API implementation
├── auth.ts             # Authentication (services functionality moved out)
├── base.ts             # Base API service
├── config.ts           # API endpoints configuration
└── index.ts            # API exports
```

## 🔧 Implementation

### 1. Services Service Class

**File:** `lib/api/services.ts`

```typescript
export class ServicesService {
  // Singleton pattern
  public static getInstance(): ServicesService

  // Get all services from API
  public async getAllServices(): Promise<Service[]>

  // Get all categories from API  
  public async getAllCategories(): Promise<Category[]>

  // Get service by ID
  public async getServiceById(serviceId: string): Promise<Service>

  // Search services
  public async searchServices(query: string): Promise<Service[]>

  // Get services by category
  public async getServicesByCategory(categoryId: string): Promise<Service[]>
}
```

### 2. API Endpoints

**File:** `lib/api/config.ts`

```typescript
SERVICES: {
  BASE: '/api/v1/services',
  GET_ALL: '/api/v1/services',
  GET_BY_ID: '/api/v1/services',
  SEARCH: '/api/v1/services/search',
  GET_BY_CATEGORY: '/api/v1/services/category',
},

CATEGORIES: {
  BASE: '/api/v1/categories',
  GET_ALL: '/api/v1/categories',
  GET_BY_ID: '/api/v1/categories',
}
```

### 3. Type Definitions

**File:** `types/api.ts`

```typescript
export interface Service {
  serviceId: string;
  categoryId: string;
  serviceName: string | null;
  description: string | null;
  serviceIconUrl: string | null;
  basePrice: number;
}

export interface Category {
  categoryId: string;
  categoryName: string;
  description?: string | null;
  iconUrl?: string | null;
}
```

## 📱 UI Implementation

### Services Screen

**File:** `app/customer/all-services.tsx`

**Features:**
- ✅ Real-time API data loading
- ✅ Category-based service organization
- ✅ Professional card design with rating badges
- ✅ Price formatting and "Book Now" buttons
- ✅ Search functionality
- ✅ Loading states and error handling
- ✅ Gradient category headers

**Key Components:**
1. **ServiceItem** - Individual service card with enhanced design
2. **ServiceCategory** - Category section with gradient header
3. **AllServices** - Main container with data fetching logic

## 🔄 Data Flow

```
1. User opens All Services screen
2. App calls servicesService.getAllServices() and getAllCategories()
3. API returns services data and categories data
4. Services are grouped by categoryId
5. Category names are resolved from categories data
6. UI renders organized service cards by category
7. User can search, browse, and interact with services
```

## 🎨 Design Features

### Service Cards
- **Enhanced shadows** with proper elevation
- **Rating badges** with star icons
- **Professional price display** with "Từ" label
- **Action buttons** with gradient and icons
- **Responsive grid** layout (2 cards per row)

### Category Headers
- **Gradient backgrounds** for category icons
- **Dynamic icons** based on category type
- **Service count** display
- **Professional typography** with proper spacing

### Color Scheme
- **Primary:** #609CEF (EzyFix Blue)
- **Categories:** Dynamic colors based on service type
- **Text:** Professional gray scale
- **Shadows:** Subtle blue-tinted shadows

## 🚀 Performance Optimizations

1. **Parallel API calls** - Services and categories fetched simultaneously
2. **Singleton pattern** - Single instance of ServicesService
3. **Proper error handling** - Graceful fallbacks and user feedback
4. **Image optimization** - Proper image loading with fallbacks
5. **Memory efficient** - Clean component structure

## 🔐 Security

1. **JWT Authentication** - All API calls require valid access token
2. **Error sanitization** - Sensitive error details hidden from users
3. **Input validation** - Search queries properly encoded
4. **Type safety** - Full TypeScript implementation

## 🧪 Testing Considerations

### API Testing
- Verify JWT token inclusion in headers
- Test error handling for 404, 401, and network errors
- Validate response data structure matches types

### UI Testing
- Test loading states display correctly
- Verify error states show appropriate messages
- Test search functionality works properly
- Validate service card interactions

## 📈 Future Enhancements

1. **Caching** - Implement service data caching
2. **Pagination** - Add pagination for large service lists
3. **Filters** - Advanced filtering by price, rating, location
4. **Favorites** - User can save favorite services
5. **Reviews** - Display service reviews and ratings
6. **Offline mode** - Cache data for offline viewing

## 🐛 Troubleshooting

### Common Issues

**Services not loading:**
- Check API endpoint accessibility
- Verify JWT token is valid
- Confirm user is authenticated

**Categories showing as IDs:**
- Ensure categories API is accessible
- Check category name mapping logic
- Verify API response structure

**Design issues:**
- Check if all style properties are properly defined
- Verify gradient dependencies are installed
- Confirm icon library is properly imported

### Debug Commands

```typescript
// Enable debug logging in services.ts
if (__DEV__) {
  console.log('API Response:', response);
}

// Check stored token
AsyncStorage.getItem('access_token').then(console.log);

// Verify API connectivity
fetch('https://ezyfix.up.railway.app/api/v1/services', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
}).then(r => r.json()).then(console.log);
```

## 📝 Change Log

### Version 1.0.0 (Current)
- ✅ Basic services API integration
- ✅ Category-based organization
- ✅ Professional UI design
- ✅ Search functionality
- ✅ Error handling and loading states

---

**Last Updated:** October 20, 2025  
**Author:** EzyFix Development Team