# 🔗 API Integration Guide

Hướng dẫn tích hợp API cho EzyFix React Native App.

## 🏗️ Cấu trúc API

### 🌐 Base URL
```
https://ezyfix.up.railway.app
```

### 📁 Endpoint Structure
```
/api/v1/
├── auth/
│   ├── login           # POST - Đăng nhập
│   ├── register        # POST - Đăng ký  
│   ├── forgot-password # POST - Quên mật khẩu
│   └── change-password # POST - Đổi mật khẩu
├── email/
│   └── send-otp        # POST - Gửi OTP qua email
└── otp/
    └── validate-otp    # POST - Xác thực OTP
```

## 🔐 Authentication Flow

### 1. Login Flow
```typescript
// 1. Gọi API login
const response = await authService.login({
  email: "user@example.com",
  password: "password123"
});

// 2. Lưu token vào AsyncStorage
await AsyncStorage.setItem('access_token', response.data.accessToken);
await AsyncStorage.setItem('refresh_token', response.data.refreshToken);
```

### 2. Registration Flow
```typescript
// 1. Đăng ký user
const response = await authService.register({
  firstName: "John",
  lastName: "Doe", 
  email: "john@example.com",
  password: "password123"
});

// 2. Gửi OTP verification
await authService.sendOTP({
  email: "john@example.com",
  purpose: "register"
});

// 3. Verify OTP
await authService.verifyOTP({
  email: "john@example.com", 
  otp: "123456",
  purpose: "register"
});
```

### 3. Forgot Password Flow
```typescript
// Bước 1: Gửi OTP reset password
await authService.sendForgotPasswordOTP({
  email: "user@example.com",
  purpose: "forgot-password"
});

// Bước 2: Verify OTP
await authService.validateForgotPasswordOTP({
  email: "user@example.com",
  otp: "123456", 
  purpose: "forgot-password"
});

// Bước 3: Reset password
await authService.resetForgotPassword({
  email: "user@example.com",
  newPassword: "newPassword123",
  otp: "123456"
});
```

## 📦 Service Layer

### 🔧 Auth Service (`lib/api/auth.ts`)
- `login()` - Đăng nhập
- `register()` - Đăng ký
- `sendForgotPasswordOTP()` - Gửi OTP forgot password
- `validateForgotPasswordOTP()` - Verify OTP
- `resetForgotPassword()` - Reset mật khẩu
- `sendOTP()` - Gửi OTP chung
- `verifyOTP()` - Verify OTP chung

### 🌐 Base Service (`lib/api/base.ts`)
- Xử lý HTTP requests
- Error handling chung
- Response formatting
- Development logging

## 🎯 Error Handling

### ✅ Professional Error Display
```typescript
// ❌ KHÔNG làm thế này
alert('Lỗi: ' + error.message);

// ✅ LÀM thế này  
setError(error.message);
// Hiển thị inline error message với styling đẹp
```

### 🔍 Development Logging
```typescript
if (__DEV__) {
  console.group('🔐 Login Success');
  console.log('👤 User:', response.data.user.email);
  console.log('🎫 Token:', response.data.accessToken.substring(0, 20) + '...');
  console.groupEnd();
}
```

## 📱 Frontend Integration

### 🔗 API Configuration
```typescript
// lib/api/config.ts
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register', 
    FORGOT_PASSWORD: '/auth/forgot-password',
    CHANGE_PASSWORD: '/auth/change-password'
  },
  EMAIL: {
    SEND_OTP: '/email/send-otp'
  },
  OTP: {
    VALIDATE: '/otp/validate-otp'
  }
};
```

### 📝 Type Definitions
```typescript
// types/api.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string; 
  password: string;
}

export interface SendEmailOTPRequest {
  email: string;
  purpose: 'register' | 'forgot-password';
}
```

## 🚨 Common Issues

### 1. Email Not Found (404)
```
Error: Staff with email xxx@xxx.com not found
```
**Solution**: Sử dụng email đã được đăng ký trong hệ thống

### 2. Invalid OTP Format
```
Error: OTP must be 6 digits
```
**Solution**: Đảm bảo OTP có đúng 6 số

### 3. API Endpoint Error (500)
```
Error: Internal Server Error  
```
**Solution**: Kiểm tra API documentation và đợi backend fix

## 🔄 Testing

### 🧪 Test với Postman/curl
```bash
# Test login
curl -X POST "https://ezyfix.up.railway.app/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Test send OTP
curl -X POST "https://ezyfix.up.railway.app/api/v1/email/send-otp" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","purpose":"forgot-password"}'
```

---

## 📞 Support

- **API Issues**: Liên hệ Backend team
- **Frontend Integration**: Kiểm tra service layer trong `lib/api/`