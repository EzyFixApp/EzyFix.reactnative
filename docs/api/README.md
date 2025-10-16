# 🔗 API Documentation

Tài liệu về API integration và development cho EzyFix App.

## 📋 Nội dung

### 🔧 Integration Guides
- [**API Integration**](./API_INTEGRATION.md) - Hướng dẫn tích hợp API chi tiết
  - Base URL và endpoint structure
  - Authentication flows
  - Error handling patterns
  - Development logging
  - Testing procedures

### 📏 Development Rules
- [**API Rules**](./API_RULES.md) - Quy tắc phát triển API
  - Endpoint design standards
  - Response format conventions
  - Security requirements
  - Performance guidelines
  - Mobile-specific requirements

### 📊 Progress Tracking
- [**API Status**](./API_STATUS.md) - Tiến độ kết nối API
  - Integration progress tracking
  - Testing status của từng API
  - Current focus và dependencies
  - Sprint planning và milestones

## 🎯 Quick Reference

### 🌐 Base API
```
Production: https://ezyfix.up.railway.app/api/v1/
```

### 🔐 Key Endpoints
```
Auth: /auth/login, /auth/register, /auth/change-password
Email: /email/send-otp
OTP: /otp/validate-otp
```

### 📱 Mobile Integration
- Email-only authentication
- Professional error handling
- Real-time validation
- TypeScript support

---

📞 **API Issues**: Liên hệ Backend team hoặc tạo GitHub issue