# 📋 API Rules for EzyFix App

Quy tắc và guidelines khi viết API cho ứng dụng EzyFix React Native.

## 🎯 Core Principles

### 1. 🧹 Keep It Simple
- **Single responsibility**: Mỗi endpoint chỉ làm 1 việc
- **Clear naming**: Tên endpoint phải rõ ràng, dễ hiểu
- **Consistent structure**: Cấu trúc response thống nhất

### 2. 🔐 Security First
- **Authentication required**: Protect tất cả sensitive endpoints
- **Input validation**: Validate tất cả input từ client
- **Rate limiting**: Prevent abuse và spam

### 3. 📱 Mobile-Friendly
- **Lightweight responses**: Chỉ trả về data cần thiết
- **Batch operations**: Combine multiple calls khi có thể
- **Offline support**: Design cho intermittent connectivity

## 📝 API Design Standards

### 🌐 Endpoint Structure
```
/api/v1/{resource}/{action}
```

**Examples:**
```
✅ /api/v1/auth/login
✅ /api/v1/users/profile  
✅ /api/v1/orders/create
✅ /api/v1/email/send-otp

❌ /api/v1/login-user
❌ /api/v1/get-user-profile
❌ /api/v1/createOrder
```

### 📊 Response Format
```typescript
// ✅ Success Response
{
  "status_code": 200,
  "message": "Login successful", 
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}

// ✅ Error Response  
{
  "status_code": 400,
  "message": "Invalid email format",
  "errors": [
    {
      "field": "email",
      "message": "Email must be valid format"
    }
  ]
}
```

### 🏷️ HTTP Status Codes
```
✅ 200 - Success (GET, PUT, PATCH)
✅ 201 - Created (POST)
✅ 204 - No Content (DELETE)
✅ 400 - Bad Request (Invalid input)
✅ 401 - Unauthorized (Not authenticated)
✅ 403 - Forbidden (No permission)
✅ 404 - Not Found (Resource not exists)
✅ 422 - Validation Error (Input validation failed)
✅ 500 - Internal Server Error (Server issues)
```

## 🔐 Authentication Endpoints

### 📝 Registration Flow
```
POST /api/v1/auth/register
Body: {
  "firstName": "string",
  "lastName": "string", 
  "email": "string",
  "password": "string"
}

POST /api/v1/email/send-otp
Body: {
  "email": "string",
  "purpose": "register"
}

POST /api/v1/otp/validate-otp
Body: {
  "email": "string",
  "otp": "string",
  "purpose": "register"
}
```

### 🔑 Login Flow
```
POST /api/v1/auth/login
Body: {
  "email": "string",
  "password": "string"
}

Response: {
  "data": {
    "user": {
      "id": "string",
      "firstName": "string",
      "lastName": "string", 
      "email": "string",
      "role": "customer|technician"
    },
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

### 🔄 Forgot Password Flow
```
POST /api/v1/email/send-otp
Body: {
  "email": "string",
  "purpose": "forgot-password"
}

POST /api/v1/otp/validate-otp  
Body: {
  "email": "string",
  "otp": "string",
  "purpose": "forgot-password"
}

POST /api/v1/auth/change-password
Body: {
  "email": "string",
  "newPassword": "string", 
  "otp": "string"
}
```

## 📱 Mobile-Specific Requirements

### 1. 🔄 Pagination
```typescript
// Request
GET /api/v1/orders?page=1&limit=20

// Response
{
  "data": {
    "orders": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 2. 🔍 Search & Filters
```typescript
// Request
GET /api/v1/technicians?search=plumber&location=hanoi&rating=4

// Response structure tương tự pagination
```

### 3. 📊 Batch Operations
```typescript
// Request multiple operations
POST /api/v1/orders/batch
Body: {
  "operations": [
    { "action": "create", "data": {...} },
    { "action": "update", "id": "123", "data": {...} }
  ]
}
```

## 🚨 Error Handling Rules

### 1. 📝 Descriptive Messages
```typescript
// ❌ Vague error
{
  "message": "Error occurred"
}

// ✅ Descriptive error
{
  "message": "Email already exists. Please use a different email or try logging in.",
  "errors": [
    {
      "field": "email",
      "code": "EMAIL_EXISTS",
      "message": "This email is already registered"
    }
  ]
}
```

### 2. 🌐 Internationalization
```typescript
// Support multiple languages
{
  "message": "Email already exists",
  "message_vi": "Email đã tồn tại", 
  "message_en": "Email already exists"
}
```

### 3. 🔍 Error Codes
```typescript
// Consistent error codes
{
  "status_code": 422,
  "error_code": "VALIDATION_FAILED",
  "message": "Input validation failed",
  "errors": [
    {
      "field": "email",
      "code": "INVALID_FORMAT",
      "message": "Invalid email format"
    }
  ]
}
```

## 🔒 Security Requirements

### 1. 🛡️ Input Validation
```typescript
// Validate all inputs
{
  "email": {
    "required": true,
    "format": "email",
    "maxLength": 255
  },
  "password": {
    "required": true,
    "minLength": 6,
    "maxLength": 100
  }
}
```

### 2. 🔐 Rate Limiting
```
POST /api/v1/email/send-otp
Rate Limit: 5 requests per 15 minutes per email

POST /api/v1/auth/login  
Rate Limit: 10 requests per 5 minutes per IP
```

### 3. 🕐 OTP Rules
```typescript
{
  "otp": {
    "length": 6,
    "type": "numeric",
    "expiry": "5 minutes",
    "maxAttempts": 3
  }
}
```

## 📊 Performance Guidelines

### 1. ⚡ Response Time
- **Authentication**: < 500ms
- **Data fetching**: < 1s
- **File upload**: Progress tracking

### 2. 💾 Caching
```typescript
// Cache-Control headers
{
  "Cache-Control": "private, max-age=300", // 5 minutes
  "ETag": "hash-of-content"
}
```

### 3. 🗜️ Compression
- **gzip compression**: For all responses > 1KB
- **Image optimization**: WebP format when possible

## 📱 Platform-Specific Considerations

### 🤖 Android Requirements
- **Network Security Config**: Support for development/staging
- **Background sync**: Handle app backgrounding
- **Push notifications**: FCM integration

### 🍎 iOS Requirements  
- **App Transport Security**: HTTPS only
- **Background refresh**: Handle iOS limitations
- **Push notifications**: APNs integration

## 🧪 Testing Requirements

### 1. 📝 API Documentation
- **OpenAPI/Swagger**: Auto-generated docs
- **Postman collection**: For manual testing
- **Examples**: Request/response examples

### 2. 🧪 Test Coverage
```typescript
// Test scenarios
✅ Happy path (valid input)
✅ Validation errors (invalid input)
✅ Authentication errors (unauthorized)
✅ Permission errors (forbidden)
✅ Not found errors (missing resources)
✅ Server errors (500 scenarios)
```

### 3. 🔄 Environment Setup
```
Development: https://dev-api.ezyfix.com
Staging: https://staging-api.ezyfix.com  
Production: https://api.ezyfix.com
```

## 📈 Monitoring & Logging

### 1. 📊 Metrics to Track
- **Response times**: Per endpoint
- **Error rates**: By status code
- **Request volume**: Peak traffic times
- **User activity**: Most used features

### 2. 🔍 Logging Standards
```typescript
// Log format
{
  "timestamp": "2025-10-16T10:30:00Z",
  "level": "info|warn|error",
  "endpoint": "/api/v1/auth/login",
  "method": "POST", 
  "status": 200,
  "duration": 250,
  "userId": "user-123",
  "message": "User login successful"
}
```

## 🚀 Deployment Guidelines

### 1. 🔄 Versioning
- **API versions**: `/api/v1/`, `/api/v2/`
- **Backward compatibility**: Support previous version for 6 months
- **Deprecation notices**: 30 days advance notice

### 2. 📋 Release Process
1. **Development** → Test with mock data
2. **Staging** → Integration testing  
3. **Production** → Gradual rollout

### 3. 🔄 Rollback Plan
- **Database migrations**: Reversible
- **Feature flags**: Quick disable
- **Monitoring**: Alert on errors

---

## ✅ Checklist for New Endpoints

### 📋 Before Development
- [ ] Endpoint design reviewed
- [ ] Security requirements defined
- [ ] Input/output schemas documented
- [ ] Error scenarios identified

### 🧪 During Development  
- [ ] Input validation implemented
- [ ] Error handling added
- [ ] Tests written (unit + integration)
- [ ] Performance tested

### 🚀 Before Release
- [ ] API documentation updated
- [ ] Postman collection updated
- [ ] Frontend integration tested
- [ ] Production monitoring setup

---

## 📞 Support & Resources

- **API Documentation**: `/api/docs` (Swagger UI)
- **Postman Collection**: Shared team workspace
- **Issue Tracking**: GitHub Issues
- **Team Communication**: Slack #api-development