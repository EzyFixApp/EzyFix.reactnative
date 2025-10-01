# 📱 Customer Profile System Components

Tài liệu chi tiết cho tất cả các components của Customer Profile System bao gồm Dashboard, Profile và các trang phụ được tạo theo thiết kế UI/UX chuyên nghiệp.

---

## 📋 Danh sách Components

### A. 🟦 **DASHBOARD SYSTEM**

### 1. 🎯 **CustomerDashboard.tsx** - Main Dashboard
**Main container** kết hợp tất cả components để tạo thành trang dashboard hoàn chỉnh.

```typescript
import CustomerDashboard from '../../components/CustomerDashboard';

export default function Page() {
  return <CustomerDashboard />;
}
```

**Features:**
- ✅ ScrollView với smooth scrolling
- ✅ SafeAreaView cho all devices
- ✅ State management cho active tab
- ✅ Event handlers cho tất cả interactions

---

### 2. 🎨 **CustomerHeader.tsx** - Header với Gradient
**Blue gradient header** với avatar, title và notification badge.

```typescript
<CustomerHeader
  title="Trang chủ"
  onAvatarPress={() => console.log('Profile')}
  onNotificationPress={() => console.log('Notifications')}
  notificationCount={3}
/>
```

**Props:**
- `title: string` - Header title
- `notificationCount?: number` - Badge count (0 = ẩn badge)
- `onAvatarPress?: () => void` - Avatar tap handler
- `onNotificationPress?: () => void` - Notification tap handler

**Features:**
- ✅ Linear gradient background (#609CEF → #3D7CE0)
- ✅ Red notification badge với smart counting (9+ cho >9)
- ✅ Responsive avatar với person icon

---

### 3. 🖼️ **HeroBanner.tsx** - Hero Section
**Image banner** với location, rating và action buttons.

```typescript
<HeroBanner
  imageSource={{ uri: 'https://...' }}
  location="133 Hai Ba Trung, Phuong Tan..."
  rating={4.8}
  isFree={true}
  onLocationPress={() => console.log('Location')}
  onSearchPress={() => console.log('Search')}
/>
```

**Props:**
- `imageSource: any` - Image source (require() hoặc {uri})
- `location: string` - Address text
- `rating: number` - Rating value (1-5)
- `isFree?: boolean` - Free/Paid badge
- `onLocationPress?: () => void` - Location button handler
- `onSearchPress?: () => void` - Search button handler

**Features:**
- ✅ Rounded corners với shadow
- ✅ Pagination dots indicator
- ✅ Rating badge với star icon
- ✅ Location dropdown với chevron icon
- ✅ Search button với blue background

---

### 4. 🛠️ **ServiceCategories.tsx** - Service Grid
**3-column grid** với service categories và icons.

```typescript
<ServiceCategories
  onCategoryPress={(id) => console.log('Category:', id)}
  onViewAllPress={() => console.log('View All')}
/>
```

**Props:**
- `onCategoryPress?: (categoryId: string) => void` - Category tap handler
- `onViewAllPress?: () => void` - "Xem thêm" tap handler

**Default Categories:**
- `electronics` - Điện Tử (phone-portrait-outline)
- `cooling` - Điện Lạnh (snow-outline)  
- `appliances` - Điện Gia Dụng (home-outline)

**Features:**
- ✅ Icon containers với light blue background
- ✅ Consistent spacing và sizing
- ✅ Active state với opacity change
- ✅ Shadow effects cho depth

---

### 5. 🎁 **PromotionSection.tsx** - Deals & Offers
**Promotion cards** với discount badges và apply buttons.

```typescript
<PromotionSection
  promotions={[
    {
      discount: '-50K',
      title: 'Ưu đãi mùa hè',
      description: 'Giảm 50.000đ cho đơn từ 300K',
      code: 'SUMMER',
      expiryDate: '31/12',
      onApplyPress: () => console.log('Apply')
    }
  ]}
  onViewAllPress={() => console.log('View All')}
/>
```

**Props:**
- `promotions?: PromotionCardProps[]` - Array of promotion objects
- `onViewAllPress?: () => void` - Expand section handler

**PromotionCardProps:**
- `discount: string` - Discount text (e.g., "-50K")
- `title: string` - Promotion title
- `description: string` - Description text
- `code: string` - Promo code
- `expiryDate: string` - Expiry date
- `onApplyPress?: () => void` - Apply button handler

**Features:**
- ✅ Green gradient discount badge
- ✅ Expandable section với dropdown arrow
- ✅ Card layout với shadow
- ✅ Blue apply button
- ✅ Code highlighting với blue color

---

### 6. 🧭 **BottomNavigation.tsx** - Navigation Bar
**Modern bottom navigation** với logo trung tâm và thiết kế bo tròn.

```typescript
<BottomNavigation
  activeTab="home"
  onTabPress={(tabId) => console.log('Tab:', tabId)}
  onLogoPress={() => console.log('Logo pressed')}
  theme="light" // or "dark"
/>
```

**Props:**
- `activeTab: string` - Currently active tab ID
- `onTabPress: (tabId: string) => void` - Tab selection handler
- `onLogoPress?: () => void` - Logo tap handler
- `theme?: 'light' | 'dark'` - Theme variant

**Tab IDs:**
- `home` - Trang chủ
- `activity` - Hoạt động

**Features:**
- ✅ **EzyFix Logo** ở giữa từ assets/Logo.png
- ✅ **Rounded navigation bar** với shadow
- ✅ **Light/Dark theme** support
- ✅ **Home indicator bar** ở dưới cùng
- ✅ **Active state** với blue color (#609CEF)
- ✅ **Elevated logo** với shadow và border

---

## � Theme Variants

### 🌞 **Light Theme** (Default)
```typescript
<BottomNavigation
  activeTab="home"
  onTabPress={handleTabPress}
  onLogoPress={handleLogoPress}
  theme="light" // White navigation bar
/>
```

### 🌙 **Dark Theme**
```typescript
<BottomNavigation
  activeTab="home"
  onTabPress={handleTabPress}
  onLogoPress={handleLogoPress}
  theme="dark" // Dark gray navigation bar
/>
```

**Theme Colors:**
- **Light:** White bar, black home indicator
- **Dark:** Dark gray bar (#374151), white home indicator
- **Logo container:** Always elevated với shadows

---

## �🎨 Design System

### 🌈 **Color Palette**
```typescript
const colors = {
  primary: '#609CEF',      // Main blue
  primaryDark: '#3D7CE0',  // Dark blue
  success: '#10B981',      // Green for discounts
  error: '#FF4757',        // Red for badges
  textPrimary: '#1f2937',  // Dark gray
  textSecondary: '#64748b', // Medium gray
  textLight: '#9CA3AF',    // Light gray
  background: '#f8fafc',   // Light background
  white: '#ffffff',        // Pure white
  border: '#f1f5f9',       // Light border
};
```

### 📐 **Spacing System**
```typescript
const spacing = {
  xs: 4,    // 4px
  sm: 8,    // 8px  
  md: 12,   // 12px
  lg: 16,   // 16px
  xl: 20,   // 20px
  xxl: 24,  // 24px
  xxxl: 32, // 32px
};
```

### 🔤 **Typography**
```typescript
const typography = {
  title: { fontSize: 20, fontWeight: '600' },
  subtitle: { fontSize: 18, fontWeight: '600' },  
  body: { fontSize: 16, fontWeight: '500' },
  caption: { fontSize: 14, fontWeight: '500' },
  small: { fontSize: 12, fontWeight: '500' },
};
```

---

## 📱 Usage Examples

### 🏠 **Complete Dashboard Setup**
```typescript
// app/customer/dashboard.tsx
import React from 'react';
import CustomerDashboard from '../../components/CustomerDashboard';

export default function CustomerDashboardPage() {
  return <CustomerDashboard />;
}
```

### 🎯 **Individual Component Usage**
```typescript
// Custom usage với custom data
import { ServiceCategories } from '../../components/ServiceCategories';

const MyComponent = () => {
  const handleCategoryPress = (categoryId: string) => {
    // Navigate to category detail
    router.push(`/services/${categoryId}`);
  };

  return (
    <ServiceCategories 
      onCategoryPress={handleCategoryPress}
      onViewAllPress={() => router.push('/services')}
    />
  );
};
```

---

## 🔧 Customization

### 🎨 **Custom Colors**
Update colors trong từng component:
```typescript
// ServiceCategories.tsx
const iconContainer = {
  backgroundColor: '#YOUR_COLOR20', // 20% opacity
}

const icon = {
  color: '#YOUR_COLOR', // Full color
}
```

### 📱 **Custom Navigation**
Replace bottom navigation với custom tabs:
```typescript
// BottomNavigation.tsx
const navItems = [
  { id: 'home', label: 'Trang chủ', icon: 'home-outline' },
  { id: 'orders', label: 'Đơn hàng', icon: 'list-outline' },
  { id: 'profile', label: 'Hồ sơ', icon: 'person-outline' },
];
```

---

## � **BOOKING SYSTEM**

### 1. 🎯 **booking-history.tsx** - Activity Page
**Main activity page** hiển thị danh sách tất cả các yêu cầu dịch vụ đã đặt với filtering và animations.

```typescript
// Usage trong app/customer/booking-history.tsx
export default function BookingHistory() {
  return (
    <SafeAreaView style={styles.fullContainer}>
      <CustomerHeader
        title="Hoạt động"
        notificationCount={3}
        onNotificationPress={() => router.push('./notifications')}
        onAvatarPress={() => router.push('./profile')}
      />
      {/* Filter Section */}
      {/* Booking List */}
      <BottomNavigation />
    </SafeAreaView>
  );
}
```

**Features:**
- ✅ **Professional Header**: CustomerHeader với gradient background
- ✅ **Filter System**: Horizontal scrollable filters (Tất cả, Đang tìm, Có báo giá, Hoàn thành)
- ✅ **Smooth Animations**: Fade in/out và slide animations cho booking cards
- ✅ **Status-based UI**: Cards với status badges và colors khác nhau
- ✅ **Navigation Integration**: Seamless navigation với dashboard
- ✅ **Clean Layout**: Simple header "Danh sách yêu cầu" không stats phức tạp
- ✅ **Responsive Design**: Proper spacing cho navigation bar

**Filter States:**
- `all` - Hiển thị tất cả bookings
- `searching` - Chỉ bookings đang tìm thợ
- `quoted` - Chỉ bookings có báo giá
- `completed` - Chỉ bookings đã hoàn thành

**Animation Features:**
- ✅ Staggered animations cho booking cards
- ✅ Smooth filter transitions
- ✅ Professional page transitions from/to dashboard

**Booking Card Design:**
- ✅ Clean white cards với subtle shadows
- ✅ Status badges với appropriate colors
- ✅ Service info, date, address, technician details
- ✅ Price display và "Xem chi tiết" button
- ✅ No left border colors (removed for cleaner look)

---

### 2. 🎯 **booking-detail.tsx** - Detail Page
**Detail page** cho từng booking với professional header và quote management.

```typescript
// Professional header design
<View style={styles.fullContainer}>
  <LinearGradient colors={['#609CEF', '#4F8BE8']} style={styles.headerContainer}>
    <SafeAreaView edges={['top']}>
      <View style={styles.headerContent}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Chi tiết đặt lịch</Text>
          <Text style={styles.headerSubtitle}>Mã đơn #000001</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  </LinearGradient>
</View>
```

**Features:**
- ✅ **Professional Header**: Gradient header với back button, title và share button
- ✅ **Status Cards**: Visual status indicators với icons
- ✅ **Service Info**: Complete service details với technician info
- ✅ **Customer Info**: Customer contact và address details
- ✅ **Technician Section**: Profile với rating và contact options
- ✅ **Action Buttons**: "Từ chối" và "Chấp nhận báo giá" buttons
- ✅ **Full Background**: No white space trên header

---

### 3. 🎯 **booking-confirmation.tsx** - Success Page
**Confirmation page** sau khi đặt dịch vụ thành công với animations.

**Features:**
- ✅ **Success Animation**: Checkmark animation với spring effect
- ✅ **Service Summary**: Booking details summary
- ✅ **Next Steps**: Clear instructions cho user
- ✅ **Navigation Options**: Về dashboard hoặc xem lịch sử

---

### 4. 🎯 **quote-review.tsx** - Quote Management
**Quote review page** để xem và quản lý báo giá từ thợ.

**Features:**
- ✅ **Detailed Pricing**: Breakdown của costs
- ✅ **Technician Profile**: Thông tin thợ và rating
- ✅ **Material List**: Chi tiết vật liệu cần thiết
- ✅ **Accept/Reject Actions**: Clear action buttons

---

### 📊 **Booking System State Management**

```typescript
// bookingStore.ts - Zustand store
interface BookingState {
  bookings: BookingItem[];
  selectedFilter: 'all' | 'searching' | 'quoted' | 'completed';
  isLoading: boolean;
  // Actions
  setFilter: (filter: string) => void;
  createBooking: (booking: BookingItem) => Promise<void>;
  updateBookingStatus: (id: string, status: string) => void;
  acceptQuote: (bookingId: string) => Promise<void>;
  rejectQuote: (bookingId: string) => Promise<void>;
}
```

**TypeScript Interfaces:**
```typescript
interface BookingItem {
  id: string;
  serviceName: string;
  servicePrice: string;
  customerName: string;
  phoneNumber: string;
  address: string;
  status: 'searching' | 'quoted' | 'accepted' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  technicianName?: string;
  quotePrice?: string;
  notes?: string;
}
```

---

## �🐛 Troubleshooting

### ❗ **Common Issues**

**1. Image Loading Issues**
```typescript
// Sử dụng placeholder khi image fail
const heroImagePlaceholder = {
  uri: 'https://via.placeholder.com/400x200?text=Service+Image'
};
```

**2. Navigation Errors**
```typescript
// Ensure Expo Router setup
import { router } from 'expo-router';

// Check if route exists
router.push('/customer/services');
```

**3. Icon Not Found**
```typescript
// Check Ionicons name exists
import { Ionicons } from '@expo/vector-icons';

// Valid icons: home-outline, list-outline, etc.
```

---

## 🚀 Performance Tips

### ⚡ **Optimization**
- ✅ Sử dụng `React.memo()` cho static components
- ✅ Optimize images với proper size
- ✅ Use `showsVerticalScrollIndicator={false}` cho clean UX
- ✅ Implement lazy loading cho large datasets

### 📊 **Monitoring**
- ✅ Test performance trên actual device
- ✅ Monitor memory usage
- ✅ Profile animation frames

---

<div align="center">

**🎯 Ready to Build Amazing Customer Experience!**

*Các components đã được tối ưu cho performance và UX* 🚀

</div>