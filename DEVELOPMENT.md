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
│   ├── technician/        # Technician-specific screens  
│   └── _layout.tsx        # Root layout
├── 🧩 components/         # Reusable components
│   ├── nativewindui/      # UI component library
│   ├── AnimatedHomeScreen.tsx  # ✅ Main home screen
│   ├── AnimatedDots.tsx        # ✅ Loading animations
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

</div>## 🆕 Recent Updates & Features

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

