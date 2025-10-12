# 🔧 EzyFix Mobile App

<div align="center">
  <img src="./assets/Logo.png" alt="EzyFix Logo" width="120" height="120"/>
  
  **App trên tay - thợ tới ngay** 
  
  [![React Native](https://img.shields.io/badge/React%20Native-0.81.4-blue.svg)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-~54.0-black.svg)](https://expo.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
  [![NativeWind](https://img.shields.io/badge/NativeWind-4.2.1-38BDF8.svg)](https://nativewind.dev/)
</div>

---

## 📱 Giới thiệu

**EzyFix** là ứng dụng mobile kết nối khách hàng với thợ sửa chữa chuyên nghiệp. Ứng dụng được xây dựng bằng React Native với Expo và TypeScript, mang đến trải nghiệm người dùng mượt mà với animation đẹp mắt.

### ✨ Tính năng chính
- 🏠 **Trang chủ động** với animation chuyên nghiệp
- 👥 **Đăng nhập phân vai trò** (Khách hàng/Thợ sửa chữa)
- 🎨 **UI/UX hiện đại** với NativeWind
- ⚡ **Loading animation** mượt mà
- 📱 **Responsive design** 

---

## 🚀 Cài đặt và Chạy dự án

### 📋 Yêu cầu hệ thống
- **Node.js** >= 18.x
- **npm** hoặc **yarn**
- **Expo CLI** 
- **Android Studio** (cho Android)
- **Xcode** (cho iOS)

### 🔧 Cài đặt

1. **Clone repository**
   ```bash
   git clone https://github.com/EzyFixApp/EzyFix.reactnative.git
   cd EzyFix.reactnative
   ```

2. **Cài đặt dependencies**
   ```bash
   npm install
   # hoặc
   yarn install
   ```

3. **Chạy ứng dụng**
   ```bash
   # Chạy development server
   npm start
   
   # Chạy trên Android
   npm run android
   
   # Chạy trên iOS
   npm run ios
   
   # Chạy trên web
   npm run web
   ```

### 🛠️ Scripts có sẵn

| Script | Mô tả |
|--------|-------|
| `npm start` | Khởi động Expo development server |
| `npm run android` | Chạy trên Android emulator/device |
| `npm run ios` | Chạy trên iOS simulator/device |
| `npm run web` | Chạy trên trình duyệt web |
| `npm run lint` | Kiểm tra code linting |
| `npm run format` | Format code tự động |
| `npm run build:dev` | Build phiên bản development |
| `npm run build:preview` | Build phiên bản preview |
| `npm run build:prod` | Build phiên bản production |

---

## 📁 Cấu trúc dự án

```
EzyFix.reactnative/
├── 📱 app/                      # Expo Router pages
│   ├── (tabs)/                  # Tab navigation
│   │   ├── index.tsx           # Tab home
│   │   └── two.tsx             # Tab two
│   ├── customer/                # Khách hàng flow
│   │   ├── dashboard.tsx       # Dashboard khách hàng
│   │   ├── login.tsx           # Đăng nhập khách hàng
│   │   ├── notifications.tsx  # Hệ thống thông báo & tin nhắn
│   │   ├── all-services.tsx   # Catalog dịch vụ và tìm kiếm
│   │   ├── book-service.tsx   # Form đặt lịch sửa chữa
│   │   ├── profile.tsx         # Trang profile khách hàng
│   │   ├── personal-info.tsx   # Thông tin cá nhân
│   │   ├── favorite-technicians.tsx #  Thợ yêu thích
│   │   ├── saved-addresses.tsx # Địa chỉ đã lưu
│   │   ├── add-address.tsx     # Thêm địa chỉ mới
│   │   ├── payment-methods.tsx # Phương thức thanh toán
│   │   ├── notification-settings.tsx # Cài đặt thông báo
│   │   └── promotions.tsx      # Ưu đãi & vouchers
│   ├── home/                   # Home screens
│   │   └── index.tsx           # Home page
│   ├── technician/             # Thợ sửa chữa flow  
│   │   ├── index.tsx           # Trang thợ chính
│   │   ├── login.tsx           # Đăng nhập thợ sửa chữa
│   │   ├── dashboard.tsx       # Dashboard thợ với stats & reviews
│   │   ├── profile.tsx         # Profile thợ với wallet & contracts
│   │   ├── personal-info.tsx   # Thông tin cá nhân với verification
│   │   └── notification-settings.tsx # Cài đặt thông báo thợ
│   ├── index.tsx               # Root page (Welcome screen)
│   ├── modal.tsx               # Modal screens
│   ├── +not-found.tsx          # 404 page
│   └── _layout.tsx             # Root layout
├── 🧩 components/              # React components
│   ├── nativewindui/           # NativeWind UI components
│   ├── AnimatedHomeScreen.tsx  # Trang chủ với animation
│   ├── AnimatedDots.tsx        # Loading dots animation  
│   ├── AnimatedText.tsx        # Typing text animation
│   ├── LoadingSpinner.tsx      # Loading spinner component
│   ├── CustomerDashboard.tsx   # Dashboard khách hàng với carousel
│   ├── CustomerHeader.tsx      # Header với gradient
│   ├── HeroBanner.tsx          # Hero banner với auto-slide
│   ├── ServiceCategories.tsx   # Grid dịch vụ 2x3
│   ├── HomeScreen.tsx          # Trang chủ cơ bản
│   ├── LoginScreen.tsx         # Component đăng nhập
│   └── ...                     # Các components khác
├── 🎨 assets/                  # Images, icons
├── 📚 lib/                     # Utilities, helpers
├── 🏪 store/                   # State management  
├── 🎨 theme/                   # Theme, colors
└── ⚙️ config files             # Configuration
```

---

## 🎯 Tình trạng phát triển

### ✅ Đã hoàn thành

#### 🏠 **Trang chủ (Home)**
- ✅ **AnimatedHomeScreen.tsx** - Trang chủ với animation chuyên nghiệp
  - 🎭 3-stage animation sequence (Logo → Welcome → Selection)
  - 🔄 Loading spinner với gradient màu
  - ⌨️ Typing text animation
  - 🔄 Animated loading dots
  - 🚀 Smooth transition animation khi chuyển trang
  - ⏱️ Timing tối ưu (2.3s loading + 200ms fade out)

#### 🧩 **Components Library**
- ✅ **AnimatedDots.tsx** - Loading dots với fade/scale animation
- ✅ **AnimatedText.tsx** - Typing effect với cursor blinking
- ✅ **LoadingSpinner.tsx** - Modern spinner với gradient
- ✅ **HomeScreen.tsx** - Trang chủ cơ bản (static)
- ✅ **LoginScreen.tsx** - Component đăng nhập với role customization
- ✅ **TechnicianHeader.tsx** - Professional header cho technician interface

#### 🔧 **Thợ sửa chữa (Technician)**
- ✅ **login.tsx** - Trang đăng nhập chuyên biệt cho thợ
  - 🎨 Custom messaging "Chào mừng thợ sửa chữa"
  - 🔗 Tích hợp với LoginScreen component
  - 🚀 Professional welcome experience
- ✅ **dashboard.tsx** - Dashboard hoàn chỉnh cho thợ sửa chữa
  - 👋 Personal greeting với thời gian thực
  - ⚡ Quick Actions: Nhận việc mới, Lịch hẹn, Báo cáo
  - 📊 Today Stats: Công việc hoàn thành, Đánh giá, Thu nhập
  - ⭐ Reviews section với star rating system
  - 🎨 Professional blue gradient design (#609CEF → #3D7CE0)
- ✅ **profile.tsx** - Profile system hoàn chỉnh cho thợ sửa chữa
  - 💰 Wallet section với balance và payment methods
  - ⚙️ Account settings menu (Personal info, Payment, Notifications)
  - 🎓 Skills & Certificates management với inline links
  - 📋 Contract management và premium features
  - 🔄 Professional navigation với smooth routing
- ✅ **personal-info.tsx** - Form thông tin cá nhân chi tiết
  - 📝 Personal information form với verification badges
  - ✅ Inline verification status ("ĐÃ XÁC THỰC" badges)
  - 🔗 Social account linking (Google, Facebook, Apple)
  - 💾 Real-time validation và save functionality
  - 🎨 Gradient header với avatar section
- ✅ **notification-settings.tsx** - Cài đặt thông báo
  - 🔔 5 notification categories với toggle switches
  - 📊 Statistics overview (BẬT/TẮT/TỔNG CỘNG counters)
  - ⚡ Quick actions (Enable all, Disable all, Reset default)
  - 🎨 Professional settings interface

### � Đang phát triển

#### 👤 **Khách hàng (Customer)**  
- ✅ **login.tsx** - Trang đăng nhập khách hàng
- ✅ **dashboard.tsx** - Dashboard với carousel tự động, service categories
- ✅ **notifications.tsx** - Hệ thống thông báo và tin nhắn hoàn chỉnh
- ✅ **all-services.tsx** - Catalog dịch vụ với tìm kiếm và lọc
- ✅ **book-service.tsx** - Form đặt lịch với validation và confirmation
- ✅ **profile.tsx** - Profile chính với stats và menu navigation
- ✅ **personal-info.tsx** - Form thông tin cá nhân với verification badges
- ✅ **favorite-technicians.tsx** - Quản lý thợ yêu thích với ratings
- ✅ **saved-addresses.tsx** - Quản lý địa chỉ với CRUD operations
- ✅ **add-address.tsx** - Form thêm địa chỉ mới
- ✅ **payment-methods.tsx** - Quản lý phương thức thanh toán
- ✅ **notification-settings.tsx** - Cài đặt thông báo với switches
- ✅ **promotions.tsx** - Ưu đãi với tab navigation và voucher cards

#### 📱 **Navigation**
- 🚧 Tab navigation system
- 🚧 Deep linking setup

### 📋 Kế hoạch tiếp theo

- [x] ~~Hoàn thiện trang đăng nhập~~
- [x] ~~Xây dựng dashboard cho khách hàng~~
- [x] ~~Hệ thống profile khách hàng hoàn chỉnh~~
- [x] ~~Hệ thống thông báo và tin nhắn~~
- [x] ~~Catalog dịch vụ với tìm kiếm~~
- [x] ~~Hệ thống đặt lịch sửa chữa~~
- [ ] Tạo giao diện cho thợ sửa chữa
- [ ] Tích hợp API backend
- [ ] Thêm push notifications
- [ ] Tối ưu performance

---

## 🎨 Design System

### 🌈 Color Palette
```typescript
// Primary Colors
'#609CEF' - Blue primary
'#4F8BE8' - Blue secondary  
'#3D7CE0' - Blue dark

// Neutral Colors
'#f8fafc' - Background light
'#64748b' - Text secondary
'#1f2937' - Text primary
```

### 📐 Animation Timing
- **Fast:** 200-300ms (micro-interactions)
- **Standard:** 400-600ms (page transitions) 
- **Slow:** 800-1200ms (complex animations)
- **Loading:** 2300ms + 200ms fade out

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React Native 0.81.4 |
| **Platform** | Expo ~54.0 |
| **Language** | TypeScript 5.x |
| **Styling** | NativeWind 4.2.1 |
| **Navigation** | Expo Router 6.0 |
| **Animation** | React Native Animated API |
| **Icons** | @expo/vector-icons |
| **Gradient** | expo-linear-gradient |
| **State Management** | React Hooks (local state) |

### 📦 Key Dependencies
- **expo-linear-gradient** - Gradient effects (technician headers)
- **@expo/vector-icons** - Ionicons for UI elements và star ratings
- **@react-navigation/native** - Navigation
- **react-native-safe-area-context** - Safe area handling
- **class-variance-authority** - Styling utilities
- **clsx** - Conditional classes
- **expo-router** - File-based routing system

---

## 📱 Screenshots

### 🏠 Home Screen
- Logo animation với fade in/scale
- Welcome message với typing effect  
- Button selection với ripple effect
- Loading transition với spinner + dots

### 🔄 Loading States  
- Professional loading spinner
- Animated typing text
- Synchronized dots animation
- Smooth page transitions

---

## 🤝 Đóng góp

### 🔀 Workflow
1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)  
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

### 📝 Code Style
- Sử dụng **TypeScript** cho tất cả components
- Follow **ESLint** và **Prettier** config
- Đặt tên file theo **PascalCase** cho components
- Sử dụng **camelCase** cho functions và variables

---

## 📞 Liên hệ

- **Team:** EzyFix Development Team
- **Repository:** [EzyFix.reactnative](https://github.com/EzyFixApp/EzyFix.reactnative)
- **Email:** dev@ezyfix.com

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  
**Made with ❤️ by EzyFix Team**

*App trên tay - thợ tới ngay* 🔧📱

</div>