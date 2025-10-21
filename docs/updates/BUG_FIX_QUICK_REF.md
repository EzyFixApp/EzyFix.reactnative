# 🐛 Bug Fix Quick Reference

**Issue**: Address Update 400 Error  
**Status**: ✅ Fixed

---

## Problem
```
ERROR: Validation errors - City/Street required
Status: 400
```

## Root Causes
1. ❌ Empty strings sent to API
2. ❌ No validation before API call
3. ❌ Undefined params from navigation
4. ❌ No debugging logs

---

## Fixes Applied

### 1. `lib/api/addresses.ts`
✅ Added pre-validation for required fields  
✅ Changed `undefined` → `null` for optional fields  
✅ Added debug logging  
✅ Better error messages in Vietnamese

### 2. `app/customer/add-address.tsx`
✅ Trim all string fields  
✅ Double-validation before sending  
✅ Added debug logging  
✅ useEffect to log params on mount

### 3. `app/customer/saved-addresses.tsx`
✅ Ensure no undefined in navigation params  
✅ Fallback to empty strings  
✅ Debug logging before navigation

---

## Key Changes

**Before**:
```typescript
// ❌ Could send empty strings
const backendData = {
  Street: addressData.street?.trim() || '',
  // Backend rejects empty strings!
};
```

**After**:
```typescript
// ✅ Validate first
if (!addressData.street || addressData.street.trim() === '') {
  throw new Error('Địa chỉ đường không được để trống');
}
const backendData = {
  Street: addressData.street.trim(),  // Guaranteed non-empty
};
```

---

## Debug Logs Added

```typescript
// Navigation
console.log('🔄 Editing address:', address);
console.log('📤 Navigation params:', editParams);

// Form mount
console.log('📥 Navigation params:', params);
console.log('📋 Initial form data:', formData);

// Save
console.log('💾 Saving address data:', addressData);
console.log('🔧 Edit mode:', isEditMode);

// API call
console.log('🔄 Updating address:', id);
console.log('📦 Request data:', backendData);
console.log('✅ Update response:', response);
```

---

## Testing Steps

1. ✅ Check console logs when editing
2. ✅ Verify all fields populated
3. ✅ Try updating address
4. ✅ Should see success message
5. ✅ List should refresh with new data

---

## If Still Fails

1. **Check logs**: Look for 📥, 💾, 📦 emojis
2. **Verify data**: Ensure no empty strings in logs
3. **Check API**: Backend might have changed requirements
4. **Network**: Check if API is reachable

---

**Status**: ✅ Ready to test
