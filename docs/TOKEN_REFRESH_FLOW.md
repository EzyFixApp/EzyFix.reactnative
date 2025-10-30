# Token Refresh Flow - EzyFix React Native

## 🔄 Automatic Token Refresh System

Hệ thống tự động gia hạn token để người dùng không bị logout khi token hết hạn.

## 📋 Flow Diagram

```
User opens app
      ↓
Auth Hook checks token
      ↓
Is token expired? → NO → Continue
      ↓ YES
Try Token Refresh
      ↓
Token Manager.getValidAccessToken()
      ↓
Call /api/v1/auth/refresh-token
      ↓
Success? → YES → Update token → Continue
      ↓ NO
Show error modal → Auto logout → Redirect to login
```

## 🏗️ Architecture

### 1. **Token Manager** (`lib/api/tokenManager.ts`)
- Singleton service quản lý token lifecycle
- Cache token expiry time để check nhanh
- Tự động refresh token trước khi hết hạn 60 giây
- Prevent duplicate refresh calls

**Key Methods:**
```typescript
getValidAccessToken(): Promise<string | null>
// - Check if token is expired
// - Auto refresh if needed
// - Return valid token or null

isAccessTokenExpired(): boolean
// - Check if token expired or expiring soon (60s buffer)

refreshAccessToken(): Promise<string | null>
// - Call refresh token API
// - Update tokens in AsyncStorage
// - Update memory cache
```

### 2. **Base API Service** (`lib/api/base.ts`)
- Tự động inject token vào mỗi request
- Call `tokenManager.getValidAccessToken()` trước mỗi request
- Handle 401 Unauthorized → logout

**Flow:**
```typescript
createAuthHeaders()
  ↓
tokenManager.getValidAccessToken()
  ↓
Is token valid? → YES → Return token
  ↓ NO
Refresh token
  ↓
Success? → YES → Return new token
  ↓ NO
Trigger logout → Return empty headers
```

### 3. **Auth Hooks** (`hooks/useCustomerAuth.ts`, `hooks/useTechnicianAuth.ts`)
- Check authentication status
- Validate role from JWT
- **NEW:** Try to refresh token if expired before logout

**Flow:**
```typescript
checkAuth()
  ↓
1. Is user authenticated?
  ↓ NO → Show error
  ↓ YES
2. Token exists?
  ↓ NO → Show error
  ↓ YES
3. Token expired?
  ↓ NO → Continue to step 4
  ↓ YES → Try refresh
      ↓
      tokenManager.getValidAccessToken()
      ↓
      Success? → YES → Continue with new token
      ↓ NO → Show error + Logout
4. Validate role from JWT
  ↓
5. Check user data matches JWT
  ↓
All passed → Allow access
```

## 🔐 Security Features

### 1. **JWT-based Role Validation**
```typescript
// Extract role from JWT (signed by server)
const roleFromToken = getRoleFromToken(token);

// Validate role matches expected
if (roleFromToken !== 'customer') {
  logout(); // Tamper detected
}
```

### 2. **Multi-layer Defense**
- ✅ Check 1: User authenticated
- ✅ Check 2: Token exists
- ✅ Check 3: Token not expired (with auto-refresh)
- ✅ Check 4: Role in JWT matches expected
- ✅ Check 5: User data matches JWT

### 3. **Automatic Cleanup**
- Logout on refresh token failure
- Logout on role mismatch
- Clear all auth data from AsyncStorage
- Clear token manager cache

## 🎯 Token Expiry Handling

### Scenario 1: Token expiring soon (< 60s)
```
User makes API request
  ↓
tokenManager detects token expiring soon
  ↓
Auto refresh token
  ↓
Request continues with new token
  ↓
✅ User doesn't notice anything
```

### Scenario 2: Token already expired
```
Auth hook detects expired token
  ↓
Try to refresh via tokenManager
  ↓
Success? → YES → Continue with new token
  ↓ NO
Show error modal
  ↓
Auto logout after 3s
  ↓
Redirect to login
```

### Scenario 3: Refresh token expired
```
tokenManager tries to refresh
  ↓
API returns 401 Unauthorized
  ↓
Refresh token is invalid/expired
  ↓
Clear all tokens
  ↓
Trigger session expired handler
  ↓
Show error modal + Auto logout
```

## 📱 User Experience

### Good Flow (Seamless)
```
User using app → Token expires → Auto refresh → Continue using
```
- ✅ No interruption
- ✅ No logout
- ✅ Silent refresh

### Error Flow (Graceful)
```
User inactive for long time → Refresh token expires
  ↓
Open app → Auth check fails
  ↓
Show friendly error modal:
"Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."
  ↓
Auto redirect to login after 3s
```
- ✅ Clear error message
- ✅ Auto redirect
- ✅ Clean logout

## 🛠️ Configuration

### Token Expiry Settings
```typescript
// tokenManager.ts
REFRESH_BUFFER_SECONDS = 60 // Refresh 60s before expiry

// tokenUtils.ts
isTokenExpired(token, bufferMinutes = 5) // Check with 5min buffer
```

### Modal Auto-close
```typescript
// HOC options
withCustomerAuth(Component, {
  redirectOnError: true,
  autoCloseSeconds: 3, // Auto close modal after 3s
})
```

## 🔄 Token Rotation

Backend có thể return **new refresh token** khi refresh:

```typescript
// tokenManager.ts - _performRefresh()
const newAccessToken = data.data.accessToken;
const newRefreshToken = data.data.refreshToken; // Optional

if (newRefreshToken) {
  await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
}
```

## 📝 API Endpoints

### Refresh Token
```
POST /api/v1/auth/refresh-token
Body: { "refreshToken": "..." }
Response: {
  "is_success": true,
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token" // Optional
  }
}
```

### Delete Refresh Token (Logout)
```
DELETE /api/v1/auth/delete-refresh-token?refreshToken=...
Headers: { "Authorization": "Bearer ..." }
```

## 🐛 Debugging

### Enable Dev Logs
```typescript
if (__DEV__) {
  console.log('✅ Token is valid (expires in ${timeLeft}s)');
  console.log('🔄 Token expired - attempting refresh...');
  console.log('✅ Token refresh successful');
}
```

### Check Token Status
```typescript
// In dev tools
const timeLeft = tokenManager.getTimeUntilExpiry();
console.log(`Token expires in: ${timeLeft}s`);

const isExpired = tokenManager.isAccessTokenExpired();
console.log(`Token expired? ${isExpired}`);
```

## ✅ Benefits

1. **Seamless UX** - User không bị logout khi token hết hạn
2. **Secure** - Role validation từ JWT (không thể fake)
3. **Automatic** - Không cần manual intervention
4. **Graceful** - Error handling rõ ràng, user-friendly
5. **Efficient** - Cache token expiry, prevent duplicate refresh calls
6. **Clean** - Proper cleanup on logout

## 🚨 Important Notes

1. **Refresh token MUST be stored securely** in AsyncStorage
2. **Never send refresh token** in URL or query params (except for delete endpoint)
3. **Always use HTTPS** in production
4. **Backend must sign JWT** properly
5. **Token expiry time** should be reasonable (e.g., 15min access, 7 days refresh)

## 📚 Related Files

- `lib/api/tokenManager.ts` - Token lifecycle management
- `lib/api/base.ts` - API interceptor with auto-refresh
- `lib/auth/tokenUtils.ts` - JWT parsing utilities
- `hooks/useCustomerAuth.ts` - Customer auth hook
- `hooks/useTechnicianAuth.ts` - Technician auth hook
- `lib/auth/withCustomerAuth.tsx` - Customer HOC
- `lib/auth/withTechnicianAuth.tsx` - Technician HOC
