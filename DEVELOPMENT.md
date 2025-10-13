# 🚀 EzyFix Development Guide

Hướng dẫn chi tiết cho developers tham gia phát triển ứng dụng EzyFix.

---

## 📋 Table of Contents

1. [🔧 Setup Environment](#-setup-environment)
2. [📁 Project Structure](#-project-structure)  
3. [🎨 Component Development](#-component-development)
4. [🔄 Animation Guidelines](#-animation-guidelines)
5. [📱 Page Development](#-page-development)
6. [🎯 Best Practices](#-best-practices)
7. [🐛 Debugging](#-debugging)

---

## 🔧 Setup Environment

### ✅ Prerequisites Checklist

- [ ] **Node.js** >= 18.0.0
- [ ] **npm** >= 8.0.0 hoặc **yarn** >= 1.22.0
- [ ] **Git** latest version
- [ ] **VS Code** (recommended)
- [ ] **Android Studio** (cho Android development)
- [ ] **Xcode** (cho iOS development - chỉ trên macOS)

### 🛠️ VS Code Extensions (Recommended)

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "expo.vscode-expo-tools",
    "ms-vscode.vscode-react-native"
  ]
}
```

### ⚙️ Environment Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/EzyFixApp/EzyFix.reactnative.git
   cd EzyFix.reactnative
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Open on Device/Emulator**
   ```bash
   # Android
   npm run android
   
   # iOS (macOS only)
   npm run ios
   ```

---

## 📁 Project Structure

### 🗂️ Folder Organization

```
src/
├── 📱 app/                 # Expo Router - File-based routing
│   ├── (tabs)/            # Tab navigation group
│   ├── customer/          # Customer-specific screens
│   │   ├── dashboard.tsx       # ✅ Dashboard với carousel
│   │   ├── login.tsx           # ✅ Đăng nhập khách hàng
│   │   ├── notifications.tsx  # ✅ Hệ thống thông báo & tin nhắn
│   │   ├── all-services.tsx   # ✅ Catalog dịch vụ với tìm kiếm
│   │   ├── book-service.tsx   # ✅ Form đặt lịch sửa chữa
│   │   ├── profile.tsx         # ✅ Profile chính
│   │   ├── personal-info.tsx   # ✅ Thông tin cá nhân
│   │   ├── favorite-technicians.tsx # ✅ Thợ yêu thích
│   │   ├── saved-addresses.tsx # ✅ Địa chỉ đã lưu
│   │   ├── add-address.tsx     # ✅ Thêm địa chỉ
│   │   ├── payment-methods.tsx # ✅ Thanh toán
│   │   ├── notification-settings.tsx # ✅ Cài đặt TB
│   │   └── promotions.tsx      # ✅ Ưu đãi
│   ├── technician/        # Technician-specific screens  
│   │   ├── index.tsx           # ✅ Trang thợ
│   │   ├── login.tsx           # ✅ Đăng nhập thợ
│   │   ├── dashboard.tsx       # ✅ Dashboard thợ với stats
│   │   └── technician-order-tracking.tsx # 🆕 Theo dõi đơn hàng với timeline
│   └── _layout.tsx        # Root layout
├── 🧩 components/         # Reusable components
│   ├── nativewindui/      # UI component library
│   ├── AnimatedHomeScreen.tsx  # ✅ Main home screen
│   ├── AnimatedDots.tsx        # ✅ Loading animations
│   ├── CustomerDashboard.tsx   # ✅ Dashboard container
│   ├── CustomerHeader.tsx      # ✅ Header với gradient
│   ├── HeroBanner.tsx          # ✅ Hero với auto-slide
│   ├── ServiceCategories.tsx   # ✅ Service grid 2x3
│   └── ...
├── 📚 lib/               # Utilities & helpers
├── 🏪 store/             # State management
├── 🎨 theme/             # Design system
└── 📄 types/             # TypeScript types
```

### 📝 File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Components** | PascalCase | `AnimatedHomeScreen.tsx` |
| **Pages** | lowercase | `login.tsx`, `dashboard.tsx` |
| **Utilities** | camelCase | `cn.ts`, `useColorScheme.tsx` |
| **Types** | PascalCase | `AuthTypes.ts` |
| **Constants** | UPPER_CASE | `API_CONFIG.ts` |

---

## 🎨 Component Development

### 🧩 Component Template

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MyComponentProps {
  title: string;
  onPress?: () => void;
  style?: any;
}

export default function MyComponent({ 
  title, 
  onPress, 
  style 
}: MyComponentProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
});
```

### 🎭 Animation Components

Dự án có 3 animation components chính:

### 🔧 Technician Components

Các components chuyên biệt cho technician interface:

#### 1. **TechnicianHeader.tsx** - Professional Header
```typescript
<TechnicianHeader 
  showTechnicianName={false}        // Hide/show technician name
  style={styles.header}             // Custom styling
/>
```
Features:
- 🌈 Linear gradient background (#609CEF → #3D7CE0)
- 🔍 Search icon với onPress handler
- 🔔 Notification bell với badge support
- 📱 Safe area handling

#### 2. **ReviewCard Component** - Star Rating System
```typescript
const ReviewCard = ({ customerName, rating, comment, date }) => (
  <View style={styles.reviewCard}>
    <Text style={styles.customerName}>{customerName}</Text>
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map(star => (
        <Ionicons 
          key={star}
          name={star <= rating ? "star" : "star-outline"}
          size={16} 
          color="#fbbf24" 
        />
      ))}
    </View>
    <Text style={styles.comment}>{comment}</Text>
    <Text style={styles.date}>{date}</Text>
  </View>
);
```

#### 3. **AnimatedDots.tsx** - Loading Dots
```typescript
<AnimatedDots 
  size={8}                          // Kích thước dot
  color="rgba(255, 255, 255, 0.8)" // Màu sắc
  animationDuration={600}           // Thời gian animation
  style={styles.loadingDots}        // Custom style
/>
```

#### 2. **LoadingSpinner.tsx** - Rotating Spinner  
```typescript
<LoadingSpinner 
  size={40}                         // Kích thước spinner
  colors={['#609CEF', '#4F8BE8']}  // Gradient colors
  strokeWidth={3}                   // Độ dày stroke
  style={styles.spinner}            // Custom style
/>
```

#### 3. **AnimatedText.tsx** - Typing Effect
```typescript
<AnimatedText 
  text="Đang tải..."               // Text to animate
  typingSpeed={50}                 // Speed (ms per character)
  showCursor={true}                // Show blinking cursor
  cursorColor="#94a3b8"            // Cursor color
  style={styles.typingText}        // Custom style
/>
```

#### 4. **SwipeButton Component** 🆕 - Gesture-Based Actions
```typescript
<SwipeButton
  title="Vuốt để chuyển bước tiếp theo"
  isEnabled={true}
  onSwipeComplete={handleUpdateStatus}
  backgroundColor="#609CEF"
/>
```

**Features:**
- 🎭 **Animated Knob:** Smooth drag interaction with spring animations
- 🔄 **Auto Reset:** Returns to start position if not fully swiped
- 💫 **Visual Feedback:** Hint arrows, fade effects, scale transforms
- 🎯 **Completion Detection:** Triggers action when 80% threshold reached
- 🚫 **Disabled State:** Gray styling when action unavailable

#### 5. **Professional Modal System** 🆕 - Earnings Display
```typescript
<Modal
  visible={showEarningsModal}
  transparent={true}
  animationType="slide"
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      {/* Gradient header with wallet icon */}
      <LinearGradient colors={['#10B981', '#059669']}>
        <Ionicons name="wallet-outline" size={32} />
        <Text>Thực nhận của bạn</Text>
      </LinearGradient>
      
      {/* Earnings breakdown */}
      <View style={styles.earningsContent}>
        {/* Service price, platform fee, final amount */}
      </View>
    </View>
  </View>
</Modal>
```

**Design Features:**
- 🎨 **Professional Layout:** Gradient header, shadow effects, rounded corners
- 💰 **Earnings Calculation:** Automatic 15% commission deduction
- 📊 **Clear Breakdown:** Service price → Platform fee → Net earnings
- 🔘 **Action Buttons:** Secondary (close) + Primary (confirm) with gradients
- 📱 **Responsive Design:** Max width constraints, proper spacing hierarchy

---

## 🔄 Animation Guidelines

### ⏱️ Timing Standards

| Animation Type | Duration | Easing |
|---------------|----------|---------|
| **Micro-interactions** | 150-300ms | `Easing.out(Easing.cubic)` |
| **Page transitions** | 300-500ms | `Easing.inOut(Easing.cubic)` |
| **Loading states** | 600-1200ms | `Easing.linear` |
| **Complex sequences** | 2000-3000ms | Mixed |

### 🎯 Animation Best Practices

#### ✅ DO
- Sử dụng `useNativeDriver: true` khi có thể
- Cleanup animations trong `useEffect` cleanup
- Sử dụng `Animated.parallel()` cho multiple properties
- Test animations trên device thật

#### ❌ DON'T  
- Animate layout properties mà không cần thiết
- Tạo quá nhiều animation cùng lúc
- Quên cleanup animation listeners
- Sử dụng timing quá nhanh hoặc quá chậm

### 🎬 Animation Sequence Example

```typescript
const animateSequence = () => {
  // Phase 1: Fade in
  Animated.timing(opacity, {
    toValue: 1,
    duration: 300,
    useNativeDriver: true,
  }).start(() => {
    // Phase 2: Scale up
    Animated.spring(scale, {
      toValue: 1.1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start(() => {
      // Phase 3: Scale back
      Animated.spring(scale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    });
  });
};
```

---

## 📱 Page Development

### 🔧 Technician Order Tracking Development 🆕

#### **Complete Order Flow Implementation**

```typescript
// Status progression system
const statusFlow = [
  'quote_sent',      // Initial quote sent to customer
  'quote_accepted',  // Customer accepts the quote
  'on_the_way',      // Technician heading to location  
  'arrived',         // Arrived at customer location
  'price_confirmation', // Final price after inspection
  'repairing',       // Active repair in progress
  'payment_pending', // Repair complete, awaiting payment
  'completed'        // Job fully completed
];

// Color-coded status system
const statusColors = {
  completed: '#10B981',  // Green for finished steps
  current: '#3B82F6',    // Blue for current step
  pending: '#E5E7EB'     // Gray for future steps
};
```

#### **Inline Timeline Component**
```typescript
{showTimeline && (
  <View style={styles.inlineTimelineContainer}>
    {getTimeline().map((item, index) => {
      const isCompleted = item.completed;
      const isCurrentStep = item.status === currentStatus;
      
      return (
        <View key={index} style={styles.timelineItem}>
          <View style={[
            styles.timelineIcon,
            { backgroundColor: isCompleted ? '#10B981' : '#E5E7EB' }
          ]}>
            <Ionicons 
              name={isCompleted ? "checkmark" : stepInfo.icon}
              color={isCompleted ? "#FFFFFF" : "#9CA3AF"}
            />
          </View>
          <Text style={styles.stepTitle}>{stepInfo.title}</Text>
          <Text style={styles.stepTime}>{item.date} • {item.time}</Text>
        </View>
      );
    })}
  </View>
)}
```

#### **Conditional Action Buttons**
```typescript
// Smart button visibility based on current status
{currentStatus === 'arrived' && (
  <TouchableOpacity onPress={() => handleTakePhoto('before')}>
    <LinearGradient colors={['#8B5CF6', '#7C3AED']}>
      <Ionicons name="camera" size={24} />
      <Text>Chụp ảnh tình trạng ban đầu</Text>
    </LinearGradient>
  </TouchableOpacity>
)}

{currentStatus === 'completed' && (
  <TouchableOpacity onPress={handleViewEarnings}>
    <LinearGradient colors={['#10B981', '#059669']}>
      <Ionicons name="cash" size={24} />
      <Text>Xem thực nhận</Text>
    </LinearGradient>
  </TouchableOpacity>
)}

// Hide secondary buttons after arrival
{!['arrived', 'repairing', 'completed'].includes(currentStatus) && (
  <View style={styles.secondaryActions}>
    <TouchableOpacity onPress={handleViewLocation}>
      <Text>Xem địa chỉ</Text>
    </TouchableOpacity>
  </View>
)}
```

### 🏠 Page Template với Animation

```typescript
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyPage() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Page enter animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[styles.content, { opacity: fadeAnim }]}
      >
        <Text style={styles.title}>My Page</Text>
        {/* Page content */}
      </Animated.View>
    </SafeAreaView>
  );
}
```

### 🧭 Navigation với Expo Router

```typescript
// app/customer/profile.tsx
import { router } from 'expo-router';

const navigateToSettings = () => {
  router.push('/customer/settings');
};

const navigateBack = () => {
  router.back();
};
```

### 🔧 Technician Development Patterns

#### **Role-Specific Login**
```typescript
// app/technician/login.tsx
import LoginScreen from '../../components/LoginScreen';

export default function TechnicianLogin() {
  return (
    <LoginScreen 
      userType="technician"
      customTitle="Chào mừng thợ sửa chữa"
      customSubtitle="Đăng nhập để bắt đầu nhận việc"
    />
  );
}
```

#### **Order Tracking System** 🆕
```typescript
// app/technician/technician-order-tracking.tsx
export default function TechnicianOrderTracking() {
  const [currentStatus, setCurrentStatus] = useState('quote_sent');
  const [showTimeline, setShowTimeline] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);

  // Status flow progression
  const statusFlow = [
    'quote_sent', 'quote_accepted', 'on_the_way', 
    'arrived', 'price_confirmation', 'repairing', 
    'payment_pending', 'completed'
  ];
}
```

**Features:**
- 🔄 **8-Step Status Flow:** From quote to completion with timeline
- 📱 **SwipeButton Integration:** Professional gesture-based status updates
- 🎨 **Inline Timeline:** Expandable timeline with color-coded progress
- 📷 **Photo Capture:** Before/after repair documentation
- 💰 **Earnings Modal:** Professional earnings calculation with commission
- 🎯 **Conditional UI:** Smart button visibility based on current status

#### **Dashboard với Real-time Data**
```typescript
const [currentTime, setCurrentTime] = useState(new Date());
const [todayStats, setTodayStats] = useState({
  jobsCompleted: 8,
  averageRating: 4.8,
  todayEarnings: 850000
});

// Real-time clock update
useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

#### **Professional Gradient Headers**
```typescript
const gradientColors = ['#609CEF', '#3D7CE0'];

<LinearGradient
  colors={gradientColors}
  start={{x: 0, y: 0}}
  end={{x: 1, y: 0}}
  style={styles.headerGradient}
>
  {/* Header content */}
</LinearGradient>
```

### 📊 State Management Pattern

```typescript
import { useState, useEffect } from 'react';

interface PageState {
  loading: boolean;
  data: any[];
  error: string | null;
}

export default function DataPage() {
  const [state, setState] = useState<PageState>({
    loading: true,
    data: [],
    error: null,
  });

  const updateState = (updates: Partial<PageState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Usage
  // updateState({ loading: false, data: results });
}
```

---

## 🎯 Best Practices

### 💻 Code Quality

#### **TypeScript**
- Luôn định nghĩa interfaces cho props
- Sử dụng strict typing
- Tránh `any` type

#### **Performance**  
- Sử dụng `React.memo()` cho components không thay đổi thường xuyên
- Optimize images và assets
- Lazy load screens khi cần thiết

#### **Styling**
- Sử dụng NativeWind classes khi có thể
- Fallback StyleSheet cho logic phức tạp  
- Consistent spacing và colors

### 🎯 Technician UI/UX Best Practices 🆕

#### **Gesture-Based Interactions**
```typescript
// Always use native driver for gestures
const panGesture = Gesture.Pan()
  .onUpdate((event) => {
    translateX.value = event.translationX;
  });

// Provide visual feedback during interaction
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: translateX.value }],
  opacity: interpolate(translateX.value, [0, maxWidth], [1, 0.3])
}));
```

#### **Conditional UI Patterns**
```typescript
// Smart component visibility based on state
const ActionButtons = ({ currentStatus }) => {
  const showSecondaryActions = !['arrived', 'completed'].includes(currentStatus);
  const showEarningsButton = currentStatus === 'completed';
  
  return (
    <View>
      {showEarningsButton && <EarningsButton />}
      {showSecondaryActions && <SecondaryActions />}
    </View>
  );
};
```

#### **Professional Modal Design**
- ✅ **Layout Hierarchy:** Header → Content → Actions
- ✅ **Gradient Headers:** Use brand colors for importance
- ✅ **Proper Spacing:** 24px padding, 16-20px gaps
- ✅ **Shadow Effects:** Elevation for depth perception
- ✅ **Button Hierarchy:** Secondary (outline) + Primary (filled)
- ✅ **Responsive Constraints:** Max width for tablets

#### **Timeline UI Standards**
- ✅ **Color System:** Green (completed), Blue (current), Gray (pending)
- ✅ **Icon Consistency:** Checkmarks for completed, status icons for pending
- ✅ **Expandable Design:** Inline expansion preferred over modals
- ✅ **Time Display:** Format as "DD/MM/YYYY • HH:MM"
- ✅ **Status Badges:** Small pills for current state indication

### 🔧 Development Workflow

1. **Feature Branch**
   ```bash
   git checkout -b feature/customer-dashboard
   ```

2. **Development**
   - Tạo component/page
   - Viết TypeScript interfaces
   - Thêm styling
   - Test trên device

3. **Testing**
   ```bash
   npm run lint      # Check code quality
   npm run format    # Auto format
   ```

4. **Commit**
   ```bash
   git add .
   git commit -m "feat: add customer dashboard with animations"
   ```

---

## 🐛 Debugging

### 🔍 Debug Tools

#### **React Native Debugger**
```bash
# Install
npm install -g react-native-debugger

# Usage
- Shake device → "Debug JS Remotely"
- Open React Native Debugger
```

#### **Flipper** (Recommended)
- Network inspector
- Layout inspector  
- Performance profiling
- Crash reporting

### 📱 Device Testing

#### **Physical Device**
```bash
# Install Expo Go app
# Scan QR code from terminal
npm start
```

#### **Emulator**
```bash
# Android
npm run android

# iOS (macOS)
npm run ios
```

### 🚨 Common Issues & Solutions

#### **Metro bundler not starting**
```bash
npm start -- --reset-cache
```

#### **Android build errors**
```bash
cd android && ./gradlew clean && cd ..
npm run android
```

#### **Animation performance**
- Enable `useNativeDriver: true`
- Test on physical device
- Profile with Flipper

---

## 🆕 Recent Updates & Features

### � Bottom Navigation & Performance Fixes (Oct 13, 2025) 🆕

#### **Navigation System Optimization**

**Problem Solved:**
- ✅ **Bottom Navigation Issue:** Fixed navigation between Dashboard ↔ Activity pages
- ✅ **Inconsistent Navigation:** Standardized routing logic across all technician pages
- ✅ **Performance Optimization:** Removed unnecessary debug logs and console outputs

#### **Technical Fixes Applied**

**1. Navigation Logic Standardization:**
```typescript
// Before (inconsistent routing)
// activity.tsx used router.back() - unreliable
// dashboard.tsx used router.push() - created stack issues

// After (consistent routing)
const handleTabPress = (tabId: string) => {
  if (tabId === 'home') {
    router.replace('/technician/dashboard');  // ✅ Direct route
  }
  if (tabId === 'activity') {
    router.replace('/technician/activity');   // ✅ Direct route  
  }
};
```

**2. Route Configuration Fix:**
```typescript
// Added missing route in _layout.tsx
<Stack.Screen name="technician/activity" options={{ headerShown: false }} />
```

**3. Debug Cleanup & Performance:**
```typescript
// Removed heavy debug logging
- console.log(`🏠 Dashboard rendering at ${timestamp}`);
- console.log('⏰ Setting up timer...');
- console.log('🔄 Dashboard - Tab pressed:', tabId);

// Replaced with lightweight comments
// Timer setup for real-time clock
// Navigation handler for bottom tabs
```

**4. UI Improvements:**
```typescript
// Enhanced BottomNavigation component
const BottomNavigation = ({ activeTab, onTabPress }) => {
  const handleTabPress = (tabId: string) => {
    onTabPress(tabId);  // ✅ Clean, direct callback
  };
  
  return (
    <View style={[styles.container, { zIndex: 1000 }]}>
      {/* Improved z-index for proper touch handling */}
    </View>
  );
};

// Increased bottom spacing for navigation clearance
bottomSpacing: {
  height: 100,  // ✅ Increased from 20px
}
```

#### **Benefits Achieved**
- 🚀 **Improved Performance:** Removed 16+ console.log statements
- 🔄 **Reliable Navigation:** Bottom navigation now works consistently in both directions
- 📱 **Better UX:** Smooth transitions without navigation stack conflicts
- 🎯 **Code Quality:** Cleaner codebase with proper separation of concerns
- 💾 **Memory Efficiency:** Reduced logging overhead and unnecessary re-renders

#### **Files Updated**
1. **`app/technician/dashboard.tsx`** - Navigation logic & debug cleanup
2. **`app/technician/activity.tsx`** - Navigation logic & debug cleanup  
3. **`components/BottomNavigation.tsx`** - Event handling & z-index fix
4. **`app/_layout.tsx`** - Added missing activity route registration

---

### �🔧 Technician Order Tracking System (Oct 13, 2025) 🆕

#### **Complete Workflow Implementation**

**Status Flow Management:**
- ✅ **8-Step Progressive Flow:** `quote_sent` → `quote_accepted` → `on_the_way` → `arrived` → `price_confirmation` → `repairing` → `payment_pending` → `completed`
- ✅ **Color-Coded Timeline:** Green for completed, Blue for current, Gray for pending
- ✅ **Inline Timeline Display:** Expandable timeline with timestamps and status descriptions
- ✅ **Real-time Status Updates:** SwipeButton gesture controls for status progression

#### **SwipeButton Component System**
```typescript
// Advanced gesture-based interaction
const SwipeButton: React.FC<{
  onSwipeComplete: () => void;
  title: string;
  isEnabled: boolean;
  backgroundColor?: string;
}> = ({ onSwipeComplete, title, isEnabled, backgroundColor }) => {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (isEnabled) {
        translateX.value = Math.max(0, Math.min(maxTranslate, event.translationX));
        // Visual feedback during swipe
        opacity.value = Math.max(0.2, 1 - (event.translationX / maxTranslate));
      }
    })
    .onEnd(() => {
      if (translateX.value > maxTranslate * 0.8) {
        // Success - trigger action
        runOnJS(onSwipeComplete)();
      } else {
        // Reset to start position
        translateX.value = withSpring(0);
      }
    });
}
```

**Features:**
- 🎭 **Smooth Animations:** Spring physics for natural feel
- 🎯 **80% Threshold:** Requires significant swipe commitment
- 💫 **Visual Feedback:** Hint arrows fade during interaction
- 🔄 **Auto Reset:** Returns to start if not completed
- 🚫 **Disabled State:** Gray styling when unavailable

#### **Professional Earnings Modal**
```typescript
// Modal with professional design and calculations
const EarningsModal = () => {
  const { finalPrice, commission, actualEarnings } = calculateEarnings();
  
  return (
    <Modal visible={showEarningsModal} animationType="slide">
      <View style={styles.modalContainer}>
        {/* Gradient Header */}
        <LinearGradient colors={['#10B981', '#059669']}>
          <View style={styles.modalHeaderLeft}>
            <Ionicons name="wallet-outline" size={32} />
            <Text style={styles.modalTitle}>Thực nhận của bạn</Text>
          </View>
          <TouchableOpacity style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} />
          </TouchableOpacity>
        </LinearGradient>

        {/* Earnings Breakdown */}
        <View style={styles.modalContent}>
          <EarningsRow 
            icon="pricetag" 
            label="Giá dịch vụ" 
            amount={formatMoney(finalPrice)} 
          />
          <EarningsRow 
            icon="remove-circle" 
            label="Phí nền tảng (15%)" 
            amount={`-${formatMoney(commission)}`}
            color="#EF4444"
          />
          
          {/* Final Amount with Gradient */}
          <LinearGradient colors={['#10B981', '#059669']}>
            <Text>Số tiền thực nhận</Text>
            <Text style={styles.finalAmount}>
              {formatMoney(actualEarnings)}
            </Text>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};
```

**Design Features:**
- 🎨 **Professional Layout:** Clean hierarchy, proper spacing
- 📊 **Clear Breakdown:** Service price → Platform fee → Net earnings  
- 💰 **Smart Calculation:** Automatic 15% commission deduction
- 🎯 **Dual Actions:** Secondary close + Primary confirm buttons
- 📱 **Responsive Design:** Max width constraints, shadow effects

#### **Conditional UI System**
```typescript
// Smart button visibility based on workflow stage
const ActionButtons = () => (
  <View style={styles.actionSection}>
    {/* Priority actions based on current status */}
    {currentStatus === 'arrived' && (
      <TouchableOpacity onPress={() => handleTakePhoto('before')}>
        <LinearGradient colors={['#8B5CF6', '#7C3AED']}>
          <Ionicons name="camera" size={24} />
          <Text>Chụp ảnh tình trạng ban đầu</Text>
        </LinearGradient>
      </TouchableOpacity>
    )}

    {currentStatus === 'repairing' && (
      <TouchableOpacity onPress={() => handleTakePhoto('after')}>
        <LinearGradient colors={['#059669', '#047857']}>
          <Ionicons name="camera" size={24} />
          <Text>Chụp ảnh sau sửa chữa</Text>
        </LinearGradient>
      </TouchableOpacity>
    )}

    {currentStatus === 'completed' && (
      <TouchableOpacity onPress={handleViewEarnings}>
        <LinearGradient colors={['#10B981', '#059669']}>
          <Ionicons name="cash" size={24} />
          <Text>Xem thực nhận</Text>
        </LinearGradient>
      </TouchableOpacity>
    )}

    {/* Hide secondary buttons after arrival */}
    {!['arrived', 'price_confirmation', 'repairing', 'payment_pending', 'completed'].includes(currentStatus) && (
      <View style={styles.secondaryActions}>
        <TouchableOpacity onPress={handleViewLocation}>
          <Text>Xem địa chỉ</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleContactCustomer}>
          <Text>Gọi khách hàng</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);
```

#### **UX Improvements Made**
1. **SwipeButton Text Overlap Fix:** Restructured flexbox layout for proper text visibility
2. **Customer Card Redesign:** Simplified from gradient header to clean contact layout
3. **Timeline Color System:** Consistent green (#10B981) for completed, blue (#3B82F6) for current
4. **Modal Professional Design:** Removed emojis, improved spacing, proper button hierarchy
5. **Header Layout Fix:** Separated title and close button to prevent overlap
6. **Conditional Actions:** Smart UI that adapts to workflow progression

---

### 🔐 Authentication System

#### **2-Step Login Process**
- ✅ **Step 1:** Phone number input with country code picker  
- ✅ **Step 2:** Password input with phone number confirmation
- ✅ **Country Support:** 16 countries with flags (Vietnam, USA, UK, etc.)
- ✅ **Smart Navigation:** Context-aware back button behavior
- ✅ **Professional Animations:** Slide transitions with bezier easing

```tsx
// Usage Example
<LoginScreen 
  onBack={handleBack}
  onLogin={handleLogin}
  userType="customer" // or "technician"
/>
```

#### **Forgot Password Flow**
- ✅ **3-Step Process:** Contact input → OTP verification → New password
- ✅ **Multi-format Support:** Phone numbers (9-10 digits) or email addresses
- ✅ **OTP Features:** 6-digit input, 60s countdown timer, resend functionality
- ✅ **Password Requirements:** Minimum 6 characters with validation
- ✅ **Smooth Transitions:** Professional slide animations between steps

```tsx
// Usage Example
<ForgotPasswordScreen
  onBack={handleBack}
  onSuccess={handleSuccess}
  userType="customer" // or "technician"
/>
```

### 🎨 UI/UX Improvements

#### **Design System**
- **Primary Color:** `#609CEF` (EzyFix Blue)
- **Border Radius:** 12-16px for modern look
- **Shadows:** Consistent elevation with native shadows
- **Typography:** Font weights from 500-800 for hierarchy
- **Spacing:** 20-24px consistent margins

#### **Animation Standards**
- **Duration:** 400-500ms for transitions
- **Easing:** `bezier(0.25, 0.46, 0.45, 0.94)` for professional feel
- **Native Driver:** Always enabled for performance
- **Staggered Timing:** 100ms delays for element sequences

### 📱 Component Architecture

#### **Shared Components**
- `LoginScreen.tsx` - Used by both customer & technician
- `ForgotPasswordScreen.tsx` - Universal forgot password flow
- **Props Pattern:** `userType`, `onBack`, `onLogin/onSuccess` for flexibility

#### **Route Structure**
```
app/
├── customer/
│   ├── login.tsx
│   └── forgot-password.tsx
└── technician/
    ├── login.tsx
    └── forgot-password.tsx
```

### 🔧 Technical Implementation

#### **State Management**
- **Step States:** `'phone' | 'password'` for login, `'contact' | 'otp' | 'newPassword'` for forgot password
- **Animation Values:** Separate opacity and transform values for each step
- **Form Validation:** Real-time validation with regex patterns

#### **Performance Optimizations**
- **useRef for Animations:** Prevents unnecessary re-renders
- **Native Driver:** All animations use native thread
- **Conditional Rendering:** Steps rendered based on current state
- **Memoized Functions:** Callbacks wrapped with useCallback where needed

### 🐛 Bug Fixes & Improvements

#### **Layout Consistency**
- ✅ **Header Alignment:** Consistent padding (20px header, 24px content)
- ✅ **Back Button:** Uniform design with shadows and borders
- ✅ **Phone Display:** Shows country code format `(+84) 0787171600`

#### **TypeScript Fixes**
- ✅ **Ref Assignments:** Proper TextInput ref handling for OTP inputs
- ✅ **Interface Definitions:** Clear prop types for all components
- ✅ **Type Safety:** Country code objects with proper typing

---

## 📚 Resources

### 📖 Documentation
- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [NativeWind Docs](https://nativewind.dev/)

### 🎨 Design Resources
- [React Native Elements](https://react-native-elements.github.io/)
- [Tamagui](https://tamagui.dev/) 
- [Figma Design System](https://www.figma.com/community)

### 🛠️ Tools
- [Expo Snack](https://snack.expo.dev/) - Online playground
- [React Native Directory](https://reactnative.directory/) - Package directory
- [Can I Use](https://caniuse.com/) - Feature support

---

<div align="center">

**Happy Coding! 🚀**

*Made with ❤️ by EzyFix Development Team*

</div>