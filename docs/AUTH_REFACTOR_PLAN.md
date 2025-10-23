# 📋 KẾ HOẠCH XÂY DỰNG LẠI HỆ THỐNG AUTHENTICATION

## 🎯 MỤC TIÊU

Xây dựng lại hệ thống authentication để phù hợp với yêu cầu backend:

1. **Auto Refresh Token**: Trước mỗi API call, kiểm tra access token có hết hạn → Tự động refresh nếu cần
2. **Proper Logout**: Sử dụng `DELETE /api/v1/auth/delete-refresh-token` khi logout

## 📊 PHÂN TÍCH HIỆN TRẠNG

### ❌ Vấn đề hiện tại:

1. **Không kiểm tra token expiry trước khi call API**
   - Code hiện tại: Gọi API → Nhận 401 → Xử lý sau
   - Vấn đề: User bị "out đột ngột" khi token hết hạn

2. **Logout không đúng endpoint**
   - Code hiện tại: `POST /api/v1/auth/logout`
   - Backend yêu cầu: `DELETE /api/v1/auth/delete-refresh-token`

3. **Session expired handler chưa tối ưu**
   - Hiện tại: Chỉ clear local storage khi nhận 401
   - Thiếu: Không call API để invalidate refresh token trên server

### ✅ Điểm mạnh hiện tại:

- Đã có cơ chế refresh token (`POST /api/v1/auth/refresh-token`)
- Có AsyncStorage để lưu access_token, refresh_token
- Có authStore với Zustand
- Có base.ts service với error handling

---

## 🏗️ KIẾN TRÚC MỚI

```
┌─────────────────────────────────────────────────────────────┐
│                         APP START                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Check Auth Status (authStore.checkAuthStatus)           │
│     - Load tokens from AsyncStorage                         │
│     - Decode JWT để lấy expiry time                         │
│     - Lưu expiry time vào memory                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. User thao tác → Call API                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. base.ts Interceptor (BEFORE REQUEST)                    │
│     ┌──────────────────────────────────────────┐            │
│     │ Check: Is access token expired?          │            │
│     │   - Compare current time vs expiry time  │            │
│     │   - Buffer: 60s trước khi hết hạn        │            │
│     └──────────────────────────────────────────┘            │
│              │                        │                      │
│         [Expired]               [Still Valid]               │
│              │                        │                      │
│              ▼                        ▼                      │
│     ┌────────────────┐      ┌──────────────────┐            │
│     │ Call Refresh   │      │ Use current token│            │
│     │ Token API      │      │                  │            │
│     └────────────────┘      └──────────────────┘            │
│              │                        │                      │
│              ▼                        ▼                      │
│     ┌────────────────────────────────────────┐              │
│     │ POST /api/v1/auth/refresh-token        │              │
│     │ Body: { refreshToken: "..." }          │              │
│     └────────────────────────────────────────┘              │
│              │                                               │
│         [Success]                                            │
│              │                                               │
│              ▼                                               │
│     ┌────────────────────────────────────────┐              │
│     │ Update AsyncStorage with new tokens    │              │
│     │ Update expiry time in memory           │              │
│     │ Retry original request with new token  │              │
│     └────────────────────────────────────────┘              │
│              │                                               │
│         [If Refresh Fails - 401/403]                        │
│              │                                               │
│              ▼                                               │
│     ┌────────────────────────────────────────┐              │
│     │ FORCE LOGOUT                           │              │
│     │ - Clear AsyncStorage                   │              │
│     │ - Reset authStore                      │              │
│     │ - Show Alert                           │              │
│     │ - Redirect to Login                    │              │
│     └────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Continue with API Request                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  5. User clicks LOGOUT                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  6. authStore.logout()                                      │
│     ┌──────────────────────────────────────────┐            │
│     │ Step 1: Call Backend API                │            │
│     │   DELETE /api/v1/auth/delete-refresh-token│           │
│     │   Headers: Bearer {accessToken}          │            │
│     │   Body: { refreshToken: "..." }          │            │
│     └──────────────────────────────────────────┘            │
│              │                                               │
│              ▼                                               │
│     ┌──────────────────────────────────────────┐            │
│     │ Step 2: Clear Local Storage             │            │
│     │   - Remove ACCESS_TOKEN                  │            │
│     │   - Remove REFRESH_TOKEN                 │            │
│     │   - Remove USER_DATA                     │            │
│     │   - Remove USER_TYPE                     │            │
│     └──────────────────────────────────────────┘            │
│              │                                               │
│              ▼                                               │
│     ┌──────────────────────────────────────────┐            │
│     │ Step 3: Reset Auth Store State          │            │
│     │   - isAuthenticated = false             │            │
│     │   - user = null                          │            │
│     │   - tokens = null                        │            │
│     └──────────────────────────────────────────┘            │
│              │                                               │
│              ▼                                               │
│     ┌──────────────────────────────────────────┐            │
│     │ Step 4: Redirect to Login               │            │
│     │   - Clear navigation stack               │            │
│     │   - Navigate to "/"                      │            │
│     └──────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 CHI TIẾT IMPLEMENTATION

### **PHASE 1: Token Management & Expiry Check**

#### File: `lib/api/tokenManager.ts` (NEW)

**Mục đích**: Quản lý token, kiểm tra expiry, tự động refresh

```typescript
/**
 * Token Manager
 * Handles token expiry checking and automatic refresh
 */

interface TokenInfo {
  token: string;
  expiresAt: number; // Unix timestamp (seconds)
}

class TokenManager {
  private accessTokenInfo: TokenInfo | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;
  
  // Buffer time: Refresh token 60s trước khi hết hạn
  private readonly REFRESH_BUFFER_SECONDS = 60;

  /**
   * Decode JWT và lấy expiry time
   */
  private decodeJWT(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      logger.error('Error decoding JWT:', error);
      return null;
    }
  }

  /**
   * Load access token từ AsyncStorage và cache expiry time
   */
  public async loadAccessToken(): Promise<string | null> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) {
        this.accessTokenInfo = null;
        return null;
      }

      const payload = this.decodeJWT(token);
      if (!payload || !payload.exp) {
        this.accessTokenInfo = null;
        return null;
      }

      this.accessTokenInfo = {
        token,
        expiresAt: payload.exp // JWT exp is in seconds
      };

      return token;
    } catch (error) {
      logger.error('Error loading access token:', error);
      return null;
    }
  }

  /**
   * Kiểm tra xem access token có hết hạn không
   * Returns: true nếu token hết hạn hoặc sắp hết hạn (< 60s)
   */
  public isAccessTokenExpired(): boolean {
    if (!this.accessTokenInfo) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const timeUntilExpiry = this.accessTokenInfo.expiresAt - currentTime;

    // Token hết hạn hoặc còn < 60s
    return timeUntilExpiry <= this.REFRESH_BUFFER_SECONDS;
  }

  /**
   * Get valid access token
   * Auto refresh nếu token hết hạn
   */
  public async getValidAccessToken(): Promise<string | null> {
    // Load token nếu chưa có trong memory
    if (!this.accessTokenInfo) {
      await this.loadAccessToken();
    }

    // Check nếu token còn valid
    if (this.accessTokenInfo && !this.isAccessTokenExpired()) {
      return this.accessTokenInfo.token;
    }

    // Token hết hạn → Refresh
    return await this.refreshAccessToken();
  }

  /**
   * Refresh access token
   * Prevent duplicate refresh calls
   */
  private async refreshAccessToken(): Promise<string | null> {
    // Nếu đang refresh, đợi promise hiện tại
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    // Bắt đầu refresh process
    this.isRefreshing = true;
    this.refreshPromise = this._performRefresh();

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * Thực hiện refresh token call
   */
  private async _performRefresh(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      logger.info('🔄 Refreshing access token...');

      // Call refresh token API (không qua interceptor để tránh infinite loop)
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Refresh token failed');
      }

      const data = await response.json();
      
      if (data.is_success && data.data?.accessToken) {
        const newAccessToken = data.data.accessToken;
        
        // Update AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
        
        // Update memory cache
        await this.loadAccessToken();
        
        logger.info('✅ Access token refreshed successfully');
        return newAccessToken;
      } else {
        throw new Error('Invalid refresh token response');
      }
    } catch (error) {
      logger.error('❌ Refresh token failed:', error);
      
      // Clear tokens và trigger logout
      await this.clearTokens();
      throw error;
    }
  }

  /**
   * Clear tokens khỏi memory và storage
   */
  public async clearTokens(): Promise<void> {
    this.accessTokenInfo = null;
    this.isRefreshing = false;
    this.refreshPromise = null;
    
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.USER_TYPE,
    ]);
  }

  /**
   * Update access token (sau khi login)
   */
  public async updateAccessToken(token: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    await this.loadAccessToken();
  }
}

export const tokenManager = new TokenManager();
```

---

### **PHASE 2: Update base.ts với Auto Token Refresh**

#### File: `lib/api/base.ts`

**Changes:**

```typescript
import { tokenManager } from './tokenManager';

// ... existing code ...

/**
 * Create authorization headers với auto token refresh
 */
private async createAuthHeaders(): Promise<Record<string, string>> {
  try {
    // Get valid token (auto refresh nếu cần)
    const token = await tokenManager.getValidAccessToken();
    
    if (__DEV__ && token) {
      const maskedToken = `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
      console.log('✅ Auth token valid:', maskedToken);
    }
    
    return token 
      ? { 'Authorization': `Bearer ${token}` }
      : {};
  } catch (error) {
    logger.error('❌ Error getting valid token:', error);
    // Token refresh failed → Trigger logout
    await this.handleSessionExpired();
    return {};
  }
}
```

**Key Changes:**
- Replace `getAccessToken()` với `tokenManager.getValidAccessToken()`
- Auto check expiry và refresh trước mỗi request
- Nếu refresh fail → Trigger logout

---

### **PHASE 3: Update Logout với DELETE API**

#### File: `lib/api/auth.ts`

**Changes:**

```typescript
/**
 * Logout user với proper DELETE refresh token API
 */
public async logout(): Promise<void> {
  try {
    const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    // Step 1: Call backend để invalidate refresh token
    if (accessToken && refreshToken) {
      try {
        logger.info('🚪 Calling delete refresh token API...');
        
        const response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.AUTH.DELETE_REFRESH_TOKEN}`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ refreshToken }),
          }
        );
        
        if (response.ok) {
          logger.info('✅ Refresh token deleted successfully');
        } else {
          logger.warn('⚠️ Failed to delete refresh token on server');
        }
      } catch (error) {
        logger.error('❌ Error calling delete refresh token:', error);
        // Continue với local cleanup dù API fail
      }
    }
  } catch (error) {
    logger.error('❌ Logout error:', error);
  } finally {
    // Step 2: Always clear local data
    await this.clearAuthData();
    await tokenManager.clearTokens();
    logger.info('✅ Local auth data cleared');
  }
}
```

**Key Changes:**
- Đổi từ `POST /logout` sang `DELETE /delete-refresh-token`
- Send refreshToken trong body
- Always clear local data dù API có fail

---

### **PHASE 4: Update authStore**

#### File: `store/authStore.ts`

**Changes:**

```typescript
// Import tokenManager
import { tokenManager } from '../lib/api/tokenManager';

// ... existing code ...

/**
 * Login action với token caching
 */
login: async (credentials: LoginRequest, userType: UserType) => {
  set({ isLoading: true, error: null });
  
  try {
    const response = await authService.loginWithUserType(credentials, userType);
    
    // Update tokenManager với new token
    await tokenManager.updateAccessToken(response.accessToken);
    
    const userData = await authService.getUserData();
    
    set({
      isAuthenticated: true,
      user: userData,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      isLoading: false,
    });
    
    logger.info('✅ Login successful');
  } catch (error: any) {
    logger.error('❌ Login failed:', error);
    set({ 
      isLoading: false, 
      error: error.message || 'Đăng nhập thất bại' 
    });
    throw error;
  }
},

/**
 * Logout action
 */
logout: async (silent: boolean = false) => {
  set({ isLoading: true });
  
  try {
    await authService.logout();
    
    set({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
    });
    
    if (!silent) {
      logger.info('✅ Logout successful');
    }
  } catch (error: any) {
    logger.error('❌ Logout error:', error);
    
    // Clear state dù có lỗi
    set({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      error: null,
    });
  }
},

/**
 * Check auth status khi app khởi động
 */
checkAuthStatus: async () => {
  set({ isLoading: true });
  
  try {
    const isAuth = await authService.isAuthenticated();
    
    if (isAuth) {
      // Load token vào tokenManager
      await tokenManager.loadAccessToken();
      
      const userData = await authService.getUserData();
      const accessToken = await authService.getAccessToken();
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      
      set({
        isAuthenticated: true,
        user: userData,
        accessToken,
        refreshToken,
        isLoading: false,
      });
    } else {
      set({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
      });
    }
  } catch (error) {
    logger.error('❌ Check auth status error:', error);
    set({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
    });
  }
},

/**
 * Handle session expired
 */
handleSessionExpired: () => {
  logger.warn('🔒 Session expired - forcing logout');
  
  set({
    isAuthenticated: false,
    user: null,
    accessToken: null,
    refreshToken: null,
    error: 'Phiên đăng nhập đã hết hạn',
  });
  
  // Clear tokenManager
  tokenManager.clearTokens();
},
```

---

### **PHASE 5: Update _layout.tsx**

#### File: `app/_layout.tsx`

**No major changes needed** - Existing session monitoring vẫn hoạt động

---

## 🧪 TEST CASES

### Test Case 1: Auto Refresh Token
**Scenario**: Access token sắp hết hạn (< 60s)
**Steps**:
1. Login thành công
2. Mock token expiry trong 50s
3. Call bất kỳ API nào
**Expected**:
- ✅ Token tự động refresh trước khi call API
- ✅ API call thành công với token mới
- ✅ Không có 401 error
- ✅ User không bị logout

### Test Case 2: Refresh Token Failed
**Scenario**: Refresh token API trả về 401
**Steps**:
1. Login thành công
2. Mock token expiry
3. Mock refresh token API trả về 401
4. Call bất kỳ API nào
**Expected**:
- ✅ Refresh token fail
- ✅ Clear local storage
- ✅ Show alert "Phiên đăng nhập đã hết hạn"
- ✅ Redirect về login page

### Test Case 3: Proper Logout
**Scenario**: User click logout
**Steps**:
1. Login thành công
2. Click logout button
**Expected**:
- ✅ Call DELETE /api/v1/auth/delete-refresh-token với refreshToken
- ✅ Clear AsyncStorage (access_token, refresh_token, user_data)
- ✅ Reset authStore state
- ✅ Redirect về login page

### Test Case 4: Multiple Concurrent Requests
**Scenario**: Nhiều API calls cùng lúc khi token hết hạn
**Steps**:
1. Login thành công
2. Mock token expiry
3. Call 5 API cùng lúc
**Expected**:
- ✅ Chỉ 1 refresh token call được thực hiện
- ✅ 5 API calls đều chờ refresh xong
- ✅ Tất cả 5 API calls đều dùng token mới

---

## 📦 FILES CẦN THAY ĐỔI

### 1. **CREATE NEW FILE**
- ✅ `lib/api/tokenManager.ts` (380 lines - Core token management)

### 2. **UPDATE EXISTING FILES**

- ✅ `lib/api/base.ts`
  - Import tokenManager
  - Update createAuthHeaders() method
  - Remove old session expired logic (keep callback)

- ✅ `lib/api/auth.ts`
  - Update logout() method với DELETE API
  - Keep existing methods

- ✅ `store/authStore.ts`
  - Import tokenManager
  - Update login() để cache token
  - Update checkAuthStatus() để load token
  - Update handleSessionExpired() để clear tokenManager

- ✅ `types/api.ts` (if needed)
  - Add DeleteRefreshTokenRequest interface

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Create TokenManager
```bash
# Create new file
touch lib/api/tokenManager.ts
```

### Step 2: Update base.ts
```bash
# Update createAuthHeaders() method
```

### Step 3: Update auth.ts
```bash
# Update logout() method
```

### Step 4: Update authStore.ts
```bash
# Update login(), checkAuthStatus(), handleSessionExpired()
```

### Step 5: Test
```bash
npm run start
# Test all scenarios
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

1. **Không dùng apiService.post() cho refresh token API**
   - Lý do: Tránh infinite loop (refresh API call lại createAuthHeaders)
   - Giải pháp: Dùng fetch() trực tiếp trong tokenManager

2. **Thread-safe refresh token**
   - Nhiều API calls cùng lúc chỉ trigger 1 refresh call
   - Các calls khác đợi refresh xong rồi dùng token mới

3. **Fallback handling**
   - Nếu refresh fail → Clear tokens → Logout
   - Nếu logout API fail → Vẫn clear local data

4. **Buffer time: 60 seconds**
   - Refresh token 60s trước khi hết hạn
   - Đảm bảo token luôn valid khi call API

---

## 📈 IMPROVEMENT POINTS

### Current Approach: Proactive Token Refresh
✅ **Pros:**
- User không bị out đột ngột
- Better UX - không có loading/error khi token hết hạn
- Ít 401 errors hơn

✅ **Performance:**
- Chỉ refresh khi cần (token sắp hết hạn)
- Cache token info trong memory
- Prevent duplicate refresh calls

---

## 📞 BACKEND API REQUIREMENTS

### 1. POST /api/v1/auth/refresh-token
**Request:**
```json
{
  "refreshToken": "string"
}
```
**Response:**
```json
{
  "is_success": true,
  "data": {
    "accessToken": "new_access_token",
    "refreshToken": "new_refresh_token" // Optional
  }
}
```

### 2. DELETE /api/v1/auth/delete-refresh-token
**Headers:**
```
Authorization: Bearer {accessToken}
```
**Request:**
```json
{
  "refreshToken": "string"
}
```
**Response:**
```json
{
  "is_success": true,
  "message": "Refresh token deleted successfully"
}
```

---

## ✅ CHECKLIST

- [ ] Create tokenManager.ts
- [ ] Update base.ts - createAuthHeaders()
- [ ] Update auth.ts - logout()
- [ ] Update authStore.ts - login(), checkAuthStatus(), handleSessionExpired()
- [ ] Test: Auto refresh token khi token sắp hết hạn
- [ ] Test: Logout call DELETE API
- [ ] Test: Multiple concurrent requests
- [ ] Test: Refresh token failed → Logout
- [ ] Update documentation
- [ ] Code review
- [ ] Deploy to staging
- [ ] Final testing
- [ ] Deploy to production

---

**Created**: October 23, 2025  
**Author**: GitHub Copilot  
**Status**: Ready for Implementation
