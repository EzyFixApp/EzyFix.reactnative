# 🆕 OTP Check API Update - October 19, 2025

## 📋 API Endpoint Change Summary

### 🔄 **What Changed**
Replaced OTP validation endpoint cho forgot password flow từ `/api/v1/otp/validate` sang `/api/v1/otp/check`.

### 🎯 **Reason for Change**
- **Better separation of concerns**: Different endpoints cho different purposes
- **Improved logic handling**: Forgot password có thể có logic riêng
- **Cleaner API design**: More specific endpoints

## 🔧 **Technical Implementation**

### **1. Config Updates**
```typescript
// lib/api/config.ts
OTP: {
  BASE: '/api/v1/otp',
  VALIDATE: '/api/v1/otp/validate',  // For registration
  CHECK: '/api/v1/otp/check',        // For forgot password ✨ NEW
}
```

### **2. Auth Service Updates**
```typescript
// lib/api/auth.ts

// New method for forgot password
public async checkOtp(validateData: ValidateOtpRequest): Promise<ValidateOtpResponse> {
  const response = await apiService.post<ValidateOtpResponse>(
    API_ENDPOINTS.OTP.CHECK,  // 🆕 New endpoint
    validateData
  );
  // ... error handling với Vietnamese messages
}

// Existing method for registration (unchanged)
public async validateOtp(validateData: ValidateOtpRequest): Promise<ValidateOtpResponse> {
  const response = await apiService.post<ValidateOtpResponse>(
    API_ENDPOINTS.OTP.VALIDATE,  // Existing endpoint
    validateData
  );
}
```

### **3. Component Updates**
```typescript
// components/OTPVerificationScreen.tsx

if (purpose === 'registration') {
  // Use existing validateOtp for registration
  const response = await authService.validateOtp({...});
} else {
  // Use new checkOtp for forgot password
  const response = await authService.checkOtp({...}); // 🆕
}
```

## 🎯 **API Usage Comparison**

### **Registration Flow** (unchanged)
```typescript
POST /api/v1/otp/validate
{
  "email": "user@example.com",
  "otp": "123456", 
  "purpose": "registration"
}
```

### **Forgot Password Flow** (updated)
```typescript
POST /api/v1/otp/check  // 🆕 New endpoint
{
  "email": "user@example.com",
  "otp": "123456", 
  "purpose": "password-reset"
}
```

## 🔍 **Error Handling**
Both endpoints return same response format, nhưng có thể có different error logic:

```typescript
{
  "is_success": boolean,
  "data": {
    "isValid": boolean,
    "message": string
  },
  "message": string
}
```

Vietnamese error messages được handle giống nhau cho consistent UX.

## ✅ **Files Modified**

1. **`lib/api/config.ts`** - Added `OTP.CHECK` endpoint
2. **`lib/api/auth.ts`** - Added `checkOtp()` method
3. **`components/OTPVerificationScreen.tsx`** - Updated để sử dụng `checkOtp()`
4. **Documentation files** - Updated API flows và endpoints

## 🚀 **Benefits**

- ✅ **Clear separation**: Registration vs Password Reset có separate endpoints
- ✅ **Maintainable**: Easier để customize logic cho different flows  
- ✅ **Backward compatible**: Existing registration flow không affected
- ✅ **Consistent UX**: Same error handling và messages
- ✅ **Future-ready**: Dễ extend cho additional OTP purposes

## 🎯 **Next Steps**

Backend team cần ensure:
1. `/api/v1/otp/check` endpoint implemented với same response format
2. Error responses consistent với existing `/api/v1/otp/validate`
3. Rate limiting và security measures applied
4. Testing cho both endpoints

---

**Status**: ✅ Frontend implementation complete  
**Date**: October 19, 2025  
**Impact**: Forgot password flow only (registration unchanged)