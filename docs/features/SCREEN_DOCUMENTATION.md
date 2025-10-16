# 📱 Screen Documentation

Tài liệu chi tiết về tất cả các màn hình được phát triển trong EzyFix React Native App.

## 📋 Tổng quan

### 🏗️ Kiến trúc ứng dụng
```
EzyFix App
├── 🏠 Home (Landing)
├── 👥 Customer Flow  
├── 🔧 Technician Flow
└── 📱 Shared Components
```

### 👥 Phân chia người dùng
- **👤 Customer (Khách hàng)**: Người cần sử dụng dịch vụ sửa chữa
- **🔧 Technician (Thợ sửa chữa)**: Người cung cấp dịch vụ sửa chữa

---

## 🏠 Home & Landing Screens

### 📍 `app/index.tsx`
**Mục đích**: Màn hình chính của ứng dụng  
**Features**:
- Landing page với branding
- Chọn vai trò (Customer/Technician)
- Navigation đến login flows

### 📍 `app/home/index.tsx`
**Mục đích**: Home screen chung  
**Features**:
- Welcome screen
- Role selection
- App introduction

### 📍 `components/HomeScreen.tsx`
**Mục đích**: Reusable home component  
**Features**:
- Animated welcome interface
- Beautiful UI with hero banner
- Call-to-action buttons

### 📍 `components/AnimatedHomeScreen.tsx`
**Mục đích**: Enhanced animated version  
**Features**:
- Professional animations
- Smooth transitions
- Modern UI elements

---

## 👤 Customer Flow

### 🔐 Authentication Screens

#### 📍 `app/customer/login.tsx`
**Mục đích**: Đăng nhập cho khách hàng  
**Features**:
- Email/password authentication
- Professional error handling
- "Remember me" functionality
- Link to forgot password

#### 📍 `app/customer/register.tsx`
**Mục đích**: Đăng ký tài khoản khách hàng  
**Features**:
- Complete user information form
- Email verification với OTP
- Terms and conditions acceptance
- Auto-login after registration

#### 📍 `app/customer/forgot-password.tsx`
**Mục đích**: Khôi phục mật khẩu  
**Features**:
- 3-step process (Email → OTP → New Password)
- Email validation
- OTP verification
- Password reset

### 🏠 Dashboard & Main Screens

#### 📍 `app/customer/dashboard.tsx`
**Mục đích**: Trang chủ sau khi đăng nhập  
**Features**:
- Personal greeting with time
- Quick service access
- Recent bookings overview
- Promotion highlights
- Weather-based service suggestions

#### 📍 `components/CustomerDashboard.tsx`
**Mục đích**: Reusable dashboard component  
**Features**:
- Modular dashboard sections
- Service categories display
- Active orders tracking
- Promotional content

### 🛠️ Service & Booking Screens

#### 📍 `app/customer/all-services.tsx`
**Mục đích**: Catalog tất cả dịch vụ  
**Features**:
- Service categories grid
- Search and filter functionality
- Service descriptions và pricing
- Quick booking access

#### 📍 `app/customer/book-service.tsx`
**Mục đích**: Form đặt lịch sửa chữa  
**Features**:
- Service selection
- Date and time picker
- Address selection
- Special requirements input
- Price estimation

#### 📍 `app/customer/booking-confirmation.tsx`
**Mục đích**: Xác nhận đặt lịch  
**Features**:
- Booking summary
- Payment method selection
- Terms confirmation
- Final booking submission

#### 📍 `app/customer/booking-detail.tsx`
**Mục đích**: Chi tiết đơn đặt lịch  
**Features**:
- Complete booking information
- Technician details
- Status tracking
- Communication options
- Modification/cancellation

#### 📍 `app/customer/booking-history.tsx`
**Mục đích**: Lịch sử đặt dịch vụ  
**Features**:
- Past bookings list
- Filter by status/date
- Re-book functionality
- Rating and reviews

### 💰 Payment & Pricing

#### 📍 `app/customer/quote-review.tsx`
**Mục đích**: Xem và duyệt báo giá  
**Features**:
- Detailed cost breakdown
- Service item listing
- Accept/reject quote options
- Communication với technician

#### 📍 `app/customer/payment-methods.tsx`
**Mục đích**: Quản lý phương thức thanh toán  
**Features**:
- Credit/debit card management
- Digital wallet integration
- Payment history
- Default payment setting

### 📍 Address & Location

#### 📍 `app/customer/saved-addresses.tsx`
**Mục đích**: Quản lý địa chỉ đã lưu  
**Features**:
- Address book management
- Add/edit/delete addresses
- Set default address
- Map integration

#### 📍 `app/customer/add-address.tsx`
**Mục đích**: Thêm địa chỉ mới  
**Features**:
- Address form input
- Map location picker
- Address validation
- Save for future use

### 📱 Communication & Tracking

#### 📍 `app/customer/order-tracking.tsx`
**Mục đích**: Theo dõi đơn hàng  
**Features**:
- Real-time status updates
- Technician location tracking
- ETA estimation
- Communication tools

#### 📍 `app/customer/notifications.tsx`
**Mục đích**: Hệ thống thông báo  
**Features**:
- Push notification history
- In-app messages
- Booking updates
- Promotional notifications

### 👥 User Management

#### 📍 `app/customer/profile.tsx`
**Mục đích**: Trang profile khách hàng  
**Features**:
- Personal information display
- Account settings access
- Booking statistics
- Loyalty program status

#### 📍 `app/customer/personal-info.tsx`
**Mục đích**: Thông tin cá nhân  
**Features**:
- Edit personal details
- Profile picture management
- Contact information
- Emergency contacts

#### 📍 `app/customer/favorite-technicians.tsx`
**Mục đích**: Danh sách thợ yêu thích  
**Features**:
- Favorite technicians list
- Quick booking với favorite technicians
- Rating history
- Direct communication

### ⚙️ Settings & Preferences

#### 📍 `app/customer/notification-settings.tsx`
**Mục đích**: Cài đặt thông báo  
**Features**:
- Push notification preferences
- Email notification settings
- SMS preferences
- Marketing communication opt-in/out

#### 📍 `app/customer/promotions.tsx`
**Mục đích**: Khuyến mãi và ưu đãi  
**Features**:
- Available promotions
- Coupon codes
- Loyalty rewards
- Special offers

---

## 🔧 Technician Flow

### 🔐 Authentication Screens

#### 📍 `app/technician/login.tsx`
**Mục đích**: Đăng nhập cho thợ sửa chữa  
**Features**:
- Professional login interface
- Specialized welcome message
- Work schedule access
- Emergency login options

#### 📍 `app/technician/register.tsx`
**Mục đích**: Đăng ký tài khoản thợ  
**Features**:
- Professional certification upload
- Skill and expertise selection
- Work area preferences
- Identity verification

#### 📍 `app/technician/forgot-password.tsx`
**Mục đích**: Khôi phục mật khẩu cho thợ  
**Features**:
- Same 3-step process as customer
- Professional context
- Work account recovery

### 🏠 Dashboard & Work Management

#### 📍 `app/technician/index.tsx`
**Mục đích**: Technician main entry point  
**Features**:
- Quick access to dashboard
- Work status toggle
- Emergency notifications

#### 📍 `app/technician/dashboard.tsx`
**Mục đích**: Work dashboard for technicians  
**Features**:
- Real-time clock display
- Daily work schedule
- Earnings summary
- Quick action buttons
- Work status management

### 📋 Order Management

#### 📍 `app/technician/orders.tsx`
**Mục đích**: Quản lý đơn hàng  
**Features**:
- Incoming job requests
- Accept/decline functionality
- Job queue management
- Priority ordering

#### 📍 `app/technician/order-details.tsx`
**Mục đích**: Chi tiết đơn hàng  
**Features**:
- Complete job information
- Customer details
- Location and directions
- Required tools/parts
- Time estimates

#### 📍 `app/technician/order-history-detail.tsx`
**Mục đích**: Chi tiết lịch sử công việc  
**Features**:
- Completed job details
- Payment information
- Customer feedback
- Photos and documentation

### 📊 Analytics & Performance

#### 📍 `app/technician/statistics.tsx`
**Mục đích**: Thống kê công việc  
**Features**:
- Earnings analytics
- Job completion rates
- Customer ratings
- Performance metrics
- Monthly/weekly reports

#### 📍 `app/technician/activity.tsx`
**Mục đích**: Hoạt động gần đây  
**Features**:
- Recent job activities
- Work log
- Time tracking
- Break management

### 💰 Quote & Pricing

#### 📍 `app/technician/quote-selection.tsx`
**Mục đích**: Tạo và gửi báo giá  
**Features**:
- Service cost calculator
- Parts and labor breakdown
- Quote templates
- Send to customer

### 📍 Tracking & Communication

#### 📍 `app/technician/order-tracking.tsx`
**Mục đích**: Theo dõi công việc đang thực hiện  
**Features**:
- Job progress tracking
- Status updates
- Customer communication
- Documentation upload

#### 📍 `app/technician/technician-order-tracking.tsx`
**Mục đích**: Enhanced tracking for technicians  
**Features**:
- Advanced tracking features
- GPS integration
- Real-time updates
- Professional tools

### 👥 Profile & Settings

#### 📍 `app/technician/profile.tsx`
**Mục đích**: Trang profile thợ sửa chữa  
**Features**:
- Professional profile display
- Certification management
- Work portfolio
- Customer reviews

#### 📍 `app/technician/personal-info.tsx`
**Mục đích**: Thông tin cá nhân thợ  
**Features**:
- Professional information
- Certification updates
- Skill management
- Work preferences

#### 📍 `app/technician/notification-settings.tsx`
**Mục đích**: Cài đặt thông báo cho thợ  
**Features**:
- Job notification preferences
- Work hour settings
- Emergency alerts
- Customer communication

---

## 📱 Shared Components

### 🎨 UI Components

#### 📍 `components/LoginScreen.tsx`
**Mục đích**: Shared login component  
**Features**:
- Reusable across customer/technician
- Professional error handling
- Responsive design
- Loading states

#### 📍 `components/RegisterScreen.tsx`
**Mục đích**: Shared registration component  
**Features**:
- Multi-step registration
- OTP verification
- Input validation
- Professional animations

#### 📍 `components/ForgotPasswordScreen.tsx`
**Mục đích**: Shared forgot password component  
**Features**:
- 3-step recovery process
- Email verification
- Professional UX
- Error handling

### 🎭 Animation & Visual

#### 📍 `components/AnimatedDots.tsx`
**Mục đích**: Loading animation  
**Features**:
- Smooth dot animation
- Customizable colors
- Performance optimized

#### 📍 `components/AnimatedText.tsx`
**Mục đích**: Text animations  
**Features**:
- Typewriter effects
- Fade in animations
- Professional transitions

#### 📍 `components/LoadingSpinner.tsx`
**Mục đích**: Loading indicators  
**Features**:
- Various spinner styles
- Brand color integration
- Performance optimized

### 🎯 Functional Components

#### 📍 `components/Button.tsx`
**Mục đích**: Standardized button component  
**Features**:
- Consistent styling
- Multiple variants
- Loading states
- Accessibility support

#### 📍 `components/BackButton.tsx`
**Mục đích**: Navigation back button  
**Features**:
- Consistent back navigation
- Custom styling
- Gesture support

#### 📍 `components/HeaderButton.tsx`
**Mục đích**: Header action buttons  
**Features**:
- Standardized header actions
- Icon integration
- Touch feedback

### 📱 Layout Components

#### 📍 `components/Container.tsx`
**Mục đích**: Standardized container  
**Features**:
- Consistent padding/margins
- Safe area handling
- Responsive layout

#### 📍 `components/ScreenContent.tsx`
**Mục đích**: Screen content wrapper  
**Features**:
- Consistent screen structure
- Keyboard handling
- Scroll management

### 🧭 Navigation Components

#### 📍 `components/BottomNavigation.tsx`
**Mục đích**: Bottom tab navigation  
**Features**:
- Role-based navigation
- Active state management
- Badge notifications

#### 📍 `components/TabBarIcon.tsx`
**Mục đích**: Tab bar icons  
**Features**:
- Consistent icon styling
- Active/inactive states
- Badge support

### 📊 Business Components

#### 📍 `components/ServiceCategories.tsx`
**Mục đích**: Service category display  
**Features**:
- Grid layout
- Category icons
- Navigation integration

#### 📍 `components/ActiveOrdersSection.tsx`
**Mục đích**: Active orders display  
**Features**:
- Order status visualization
- Quick actions
- Real-time updates

#### 📍 `components/PromotionSection.tsx`
**Mục đích**: Promotional content  
**Features**:
- Promotion display
- Call-to-action buttons
- Dynamic content

#### 📍 `components/OrderTrackingScreen.tsx`
**Mục đích**: Order tracking interface  
**Features**:
- Real-time tracking
- Status updates
- Map integration

### 👥 User-Specific Components

#### 📍 `components/CustomerHeader.tsx`
**Mục đích**: Customer-specific header  
**Features**:
- Customer branding
- Profile access
- Notifications

#### 📍 `components/TechnicianHeader.tsx`
**Mục đích**: Technician-specific header  
**Features**:
- Work status display
- Professional branding
- Quick actions

### 🎨 Theme & Styling

#### 📍 `components/ThemeToggle.tsx`
**Mục đích**: Dark/light theme switcher  
**Features**:
- Theme persistence
- Smooth transitions
- System theme detection

#### 📍 `components/DarkThemeExample.tsx`
**Mục đích**: Dark theme demonstration  
**Features**:
- Theme preview
- Component showcase

### 🔔 Feedback Components

#### 📍 `components/Toast.tsx`
**Mục đích**: Toast notifications  
**Features**:
- Success/error/info toasts
- Auto-dismiss
- Custom positioning

#### 📍 `components/HeroBanner.tsx`
**Mục đích**: Hero section banners  
**Features**:
- Promotional banners
- Image optimization
- Responsive design

---

## 📊 Screen Statistics

### 📈 Development Progress

```
📱 Total Screens: 45+
├── 👤 Customer Screens: 20
├── 🔧 Technician Screens: 17  
├── 🏠 Shared/Home Screens: 4
└── 🧩 Reusable Components: 25+
```

### 🎯 Feature Coverage

```
✅ Authentication System: 100%
✅ Dashboard & Home: 100%
✅ Service Booking: 90%
✅ Order Management: 85%
✅ User Profiles: 90%
✅ Notifications: 80%
✅ Payment Systems: 70%
🔄 Analytics: 60%
🔄 Advanced Features: 40%
```

### 📱 Platform Support

```
✅ Android: Full support
✅ iOS: Full support
✅ Web: Expo web compatible
✅ TypeScript: 100% coverage
✅ Responsive: Mobile-first design
```

---

## 🎯 Screen Categories

### 🔐 **Authentication Screens (6)**
- Login screens (Customer/Technician)
- Registration screens (Customer/Technician)
- Forgot password screens (Customer/Technician)

### 🏠 **Dashboard Screens (4)**
- Home/Landing screens
- Customer dashboard
- Technician dashboard
- Role selection

### 📋 **Business Logic Screens (25+)**
- Service booking flow
- Order management
- Payment processing
- Communication tools
- Tracking systems

### ⚙️ **Settings & Profile Screens (10+)**
- User profiles
- Personal information
- Notification settings
- Preferences

---

## 🚀 Technical Implementation

### 🏗️ **Architecture Patterns**
- **File-based routing**: Expo Router
- **Component reusability**: Shared components
- **Type safety**: Full TypeScript coverage
- **State management**: React hooks + context
- **Styling**: NativeWind (Tailwind CSS)

### 📱 **Mobile-First Design**
- **Responsive layouts**: Adapts to screen sizes
- **Touch-friendly**: Optimized for mobile interaction
- **Performance**: Lazy loading và optimization
- **Accessibility**: Screen reader support

### 🎨 **Design System**
- **Consistent colors**: Brand color palette
- **Typography**: Standardized text styles
- **Spacing**: Consistent padding/margins
- **Components**: Reusable UI elements

---

## 📞 Usage Guidelines

### 🎯 **For Developers**
1. Tham khảo component documentation
2. Follow naming conventions
3. Sử dụng shared components khi có thể
4. Maintain TypeScript types

### 👥 **For Product Team**
1. Screen flow documentation
2. Feature requirements mapping
3. User journey analysis
4. Testing scenarios

### 🧪 **For QA Team**
1. Screen-by-screen testing guide
2. User flow validation
3. Cross-platform testing
4. Performance benchmarks

---

*📱 App trên tay - thợ tới ngay 🔧*