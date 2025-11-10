# 🔐 Token Management System - Complete Documentation

**Date:** November 10, 2025  
**Status:** ✅ Production Ready

---

## 📋 OVERVIEW

Complete token management system với automatic refresh, proactive token renewal, và proper logout handling.

---

## 🏗️ ARCHITECTURE

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    TOKEN MANAGER                            │
│  - Decode JWT & track expiry                                │
│  - Auto refresh before expiry (60s buffer)                  │
│  - Proactive refresh (every 5 min)                          │
│  - Handle non-JWT refresh tokens                            │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│                    AUTH SERVICE                             │
│  - Login/Register/Logout                                    │
│  - Call DELETE refresh token on logout                      │
│  - Clear local storage                                      │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND APIs                             │
│  POST /api/v1/auth/refresh-token                            │
│  DELETE /api/v1/auth/delete-refresh-token                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 TOKEN REFRESH FLOW

### 1. Login Flow
```
User Login
    ↓
Backend returns:
  - accessToken (JWT)
  - refreshToken (non-JWT/GUID)
    ↓
Save to AsyncStorage
    ↓
TokenManager.updateAccessToken()
    ↓
Start Proactive Refresh Timer (5 min interval)
    ↓
Decode access token → Extract expiry
    ↓
Refresh token NOT decoded (non-JWT format)
```

### 2. Automatic Refresh (On API Call)
```
API Call Triggered
    ↓
BaseService.createAuthHeaders()
    ↓
TokenManager.getValidAccessToken()
    ↓
Check: Is access token expired/expiring? (< 60s remaining)
    ↓
YES → Call refreshAccessToken()
    ↓
POST /api/v1/auth/refresh-token
    Body: { refreshToken }
    ↓
Backend validates & returns:
  - New accessToken
  - New refreshToken (optional)
    ↓
Update AsyncStorage
    ↓
Update TokenManager cache
    ↓
Return new access token to API call
```

### 3. Proactive Refresh (Background Timer)
```
Every 5 minutes
    ↓
Load latest tokens from storage
    ↓
Check: Do we still have refresh token?
NO → Stop timer, clear tokens, logout
    ↓
YES → Check: Is access token expiring soon?
YES → Call refreshAccessToken()
NO → Log "Token still valid" & wait
```

### 4. Logout Flow
```
User Logout
    ↓
Get current tokens from storage
    ↓
Call DELETE /api/v1/auth/delete-refresh-token
    Query: ?refreshToken={token}
    Headers: Authorization: Bearer {accessToken}
    ↓
Backend invalidates refresh token in database
    ↓
Clear local AsyncStorage:
  - access_token
  - refresh_token
  - user_data
  - user_type
    ↓
TokenManager.clearTokens()
    ↓
Stop proactive refresh timer
    ↓
Clear in-memory token cache
```

---

## 🎯 KEY FEATURES

### ✅ 1. Automatic Token Refresh
- Refresh 60 seconds BEFORE expiry
- Prevents 401 errors during API calls
- No user interruption

### ✅ 2. Proactive Background Refresh
- Check every 5 minutes
- Refresh even when app is idle
- Prevents "standing still" logout issue

### ✅ 3. Non-JWT Refresh Token Support
- Backend uses GUID/random string for refresh tokens
- App handles both JWT and non-JWT formats gracefully
- No error spam in logs

### ✅ 4. Duplicate Refresh Prevention
- Only one refresh call at a time
- Concurrent requests wait for same refresh
- Thread-safe implementation

### ✅ 5. Proper Logout Cleanup
- Server-side token invalidation (DELETE API)
- Local storage cleanup
- Memory cache cleanup
- Timer cleanup

---

## 📊 TOKEN TYPES

### Access Token (JWT Format)
```json
{
  "header": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  "payload": "eyJzdWIiOiJ1c2VyLWlkIiwiZXhwIjoxNjk5..."
  "signature": "..."
}
```
**Properties:**
- Format: JWT (3 parts separated by `.`)
- Expiry: Can be decoded from `exp` claim
- Lifetime: ~30 minutes (1800 seconds)
- Usage: Authorization header in API calls

### Refresh Token (Non-JWT Format)
```
Example: "a3f2e8b1-9c4d-4e7a-b2c5-1d8f9e0a3b6c"
```
**Properties:**
- Format: GUID or random string (NOT JWT)
- Expiry: Cannot be decoded (server-side only)
- Lifetime: ~30 days (estimated)
- Usage: POST /refresh-token to get new access token

---

## 🔧 IMPLEMENTATION DETAILS

### File: `lib/api/tokenManager.ts`

#### Key Methods

**`getValidAccessToken()`**
- Check if token exists
- Check if token is expired (< 60s remaining)
- Auto-refresh if needed
- Return valid token or null

**`refreshAccessToken()`**
- Prevent duplicate calls
- Call POST /refresh-token
- Update storage with new tokens
- Update memory cache

**`startProactiveRefresh()`**
- Set 5-minute interval timer
- Check & refresh in background
- Stop on logout or token unavailable

**`clearTokens()`**
- Stop proactive refresh timer
- Clear memory cache
- Clear AsyncStorage

---

## 🐛 COMMON ISSUES FIXED

### ❌ Issue: "Not a valid base64 encoded string length"
**Cause:** Trying to decode non-JWT refresh token  
**Fix:** Wrapped decode in try-catch, silent fail for non-JWT tokens

### ❌ Issue: Logout after 10 minutes of inactivity
**Cause:** Token expired, no proactive refresh  
**Fix:** Added 5-minute background refresh timer

### ❌ Issue: 401 during API calls
**Cause:** Token expired during request  
**Fix:** Auto-refresh BEFORE API call (60s buffer)

### ❌ Issue: Multiple concurrent refresh calls
**Cause:** No deduplication  
**Fix:** Singleton pattern with promise reuse

---

## 📝 CONFIGURATION

### TokenManager Settings
```typescript
REFRESH_BUFFER_SECONDS = 60            // Refresh 60s before expiry
PROACTIVE_REFRESH_INTERVAL_MS = 5 * 60 * 1000  // Check every 5 min
```

### Storage Keys
```typescript
STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  USER_TYPE: 'user_type'
}
```

### API Endpoints
```typescript
ENDPOINTS = {
  REFRESH_TOKEN: '/api/v1/auth/refresh-token',
  DELETE_REFRESH_TOKEN: '/api/v1/auth/delete-refresh-token'
}
```

---

## ✅ TESTING CHECKLIST

- [x] Login → Tokens saved
- [x] API call → Auto refresh when expired
- [x] Idle 10+ minutes → Still authenticated
- [x] Logout → Server token deleted
- [x] Logout → Local storage cleared
- [x] No JWT decode errors in logs
- [x] Proactive refresh timer working
- [x] Token expiry logs accurate

---

## 🎯 FUTURE IMPROVEMENTS

### Optional Enhancements
1. **Token Rotation:** Track refresh token generations
2. **Biometric Re-auth:** Require Face ID after long idle
3. **Token Analytics:** Track refresh frequency
4. **Offline Mode:** Handle no-network scenarios
5. **Token Encryption:** Encrypt tokens in AsyncStorage

---

## 📚 RELATED DOCUMENTATION

- [Authentication Flow](./AUTH_IMPLEMENTATION_COMPLETE.md)
- [Token Refresh Flow](./TOKEN_REFRESH_FLOW.md)
- [API Integration](./api/API_INTEGRATION.md)

---

**Status:** ✅ Complete & Production Ready  
**Last Updated:** November 10, 2025
