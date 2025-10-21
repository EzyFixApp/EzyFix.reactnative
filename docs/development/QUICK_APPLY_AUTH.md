# 🚀 Quick Start Guide - Apply Auth to Remaining Screens

## ⚡ Copy-Paste Template

Cho mỗi file cần protect, làm 3 bước:

### Bước 1: Thêm Import (đầu file)
```typescript
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';
```

### Bước 2: Tìm dòng `export default function` và xóa `export default`
```typescript
// TÌM:
export default function ScreenName() {

// ĐỔI THÀNH:
function ScreenName() {
```

### Bước 3: Thêm export cuối file (trước `StyleSheet.create` cuối cùng)
```typescript
});  // <-- Dòng cuối của StyleSheet

// Thêm đoạn này:
export default withTechnicianAuth(ScreenName, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});
```

---

## 📋 Checklist - 7 Files Còn Lại

Copy template trên cho từng file sau:

- [ ] `order-details.tsx` → Function name: `OrderDetails`
- [ ] `order-tracking.tsx` → Function name: `TechnicianOrderTracking`
- [ ] `order-history-detail.tsx` → Function name: `OrderHistoryDetail`
- [ ] `quote-selection.tsx` → Function name: `QuoteSelection`
- [ ] `technician-order-tracking.tsx` → Function name: `TechnicianOrderTracking`
- [ ] `personal-info.tsx` → Function name: `TechnicianPersonalInfo`
- [ ] `notification-settings.tsx` → Function name: `TechnicianNotificationSettings`

---

## ✅ Example - dashboard.tsx (Đã xong)

```typescript
// 1. Import ở đầu
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';

// 2. Function không có export default
function Dashboard() {
  return (
    <SafeAreaView>
      {/* UI code */}
    </SafeAreaView>
  );
}

// 3. Styles
const styles = StyleSheet.create({
  // ...
});

// 4. Export wrapped component ở cuối
export default withTechnicianAuth(Dashboard, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});
```

---

## 🧪 Test Sau Khi Apply

1. **Login as Customer:**
   ```
   → Navigate to any technician screen
   → Should see popup: "Không có quyền truy cập"
   → Auto-redirect to login after 3s
   ```

2. **Login as Technician:**
   ```
   → All protected screens should work
   → No error popups
   → Normal navigation
   ```

3. **Token Expiry:**
   ```
   → Wait for token to expire (or manually clear)
   → Should see popup: "Phiên đăng nhập hết hạn"
   → Auto-logout + redirect
   ```

---

## 🐛 Common Issues

### Issue 1: "Cannot find module withTechnicianAuth"
**Fix:** Check import path is exactly:
```typescript
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';
```

### Issue 2: "A module cannot have multiple default exports"
**Fix:** Make sure you removed `export default` from function declaration:
```typescript
// ❌ WRONG
export default function ScreenName() {

// ✅ CORRECT
function ScreenName() {
```

### Issue 3: Component name mismatch
**Fix:** Use exact function name in export:
```typescript
function OrderDetails() { ... }

// Must match ↓
export default withTechnicianAuth(OrderDetails, { ... });
```

---

## 📝 Files Created

### Core Infrastructure
- ✅ `lib/auth/tokenUtils.ts` - Token parsing & validation
- ✅ `lib/auth/withTechnicianAuth.tsx` - HOC wrapper
- ✅ `hooks/useTechnicianAuth.ts` - Auth validation hook
- ✅ `components/AuthErrorModal.tsx` - Error popup UI

### Documentation
- ✅ `docs/development/TECHNICIAN_AUTH_PLAN.md` - Full plan
- ✅ `docs/development/TECHNICIAN_AUTH_SUMMARY.md` - Summary report
- ✅ `docs/development/APPLY_AUTH_STATUS.md` - Status tracker

---

## 🎯 Quick Commands

### Search for function names
```powershell
# Find all export default functions in technician folder
Get-ChildItem -Path "app/technician/*.tsx" | Select-String "export default function"
```

### Check if auth is applied
```powershell
# Check if withTechnicianAuth is imported
Get-ChildItem -Path "app/technician/*.tsx" | Select-String "withTechnicianAuth"
```

---

**Estimated Time:** 10-15 minutes for all 7 files  
**Difficulty:** Easy (copy-paste template)  
**Status:** Ready to apply
