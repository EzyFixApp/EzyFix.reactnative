# 🔐 Apply Technician Auth Protection Script

## Màn Hình Cần Apply

Danh sách màn hình đã được protect:
- ✅ dashboard.tsx
- ✅ orders.tsx
- ⏳ profile.tsx
- ⏳ activity.tsx
- ⏳ statistics.tsx
- ⏳ order-details.tsx
- ⏳ order-tracking.tsx
- ⏳ order-history-detail.tsx
- ⏳ quote-selection.tsx
- ⏳ technician-order-tracking.tsx
- ⏳ personal-info.tsx
- ⏳ notification-settings.tsx

## Template để Apply

### Step 1: Add Import
```typescript
import { withTechnicianAuth } from '../../lib/auth/withTechnicianAuth';
```

### Step 2: Convert export default function
**Before:**
```typescript
export default function ScreenName() {
  // component code
}
```

**After:**
```typescript
function ScreenName() {
  // component code
}

export default withTechnicianAuth(ScreenName, {
  redirectOnError: true,
  autoCloseSeconds: 3,
});
```

## Quick Apply Commands

Cho mỗi file, làm 3 bước:
1. Add import ở đầu file
2. Remove `export default` từ function declaration
3. Add export ở cuối file

---

Status: In Progress
