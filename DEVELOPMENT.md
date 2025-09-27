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

#### 1. **AnimatedDots.tsx** - Loading Dots
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

</div>