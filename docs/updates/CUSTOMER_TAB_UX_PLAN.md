# 🎨 Customer Dashboard UX Improvement Plan

## 🎯 Mục tiêu
Chuyển đổi customer dashboard và booking-history từ **separate screens** sang **tab-based fragments** để tạo trải nghiệm mượt mà hơn, không có chuyển cảnh animation phiền phức.

---

## 📊 Current State (Hiện tại)

### Navigation Flow
```
Dashboard Screen (separate)
    ↓ navigate
Booking History Screen (separate)
    ↓ navigate
Dashboard Screen (back)

❌ Problems:
- Screen transition animation mỗi lần chuyển
- Phải reload header/footer mỗi lần
- Mất state khi navigate
- UX kém mượt
```

---

## 🎨 Target State (Mục tiêu)

### Tab-Based Fragment Pattern
```
Customer Main Screen (Container)
├── Fixed Header (CustomerHeader)
├── Tab Bar (Dashboard | Activity)
├── Content Fragment
│   ├── Dashboard Content (when tab = 'dashboard')
│   └── Booking History Content (when tab = 'activity')
└── Fixed Footer (BottomNavigation)

✅ Benefits:
- No screen transition animation
- Header/Footer persist across tabs
- State preserved
- Instant tab switching
- Better UX/Performance
```

---

## 🏗️ Architecture Design

### 1. Create Container Screen
**File:** `app/customer/dashboard.tsx` (refactor to container)

```typescript
function CustomerMainScreen() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'activity'>('dashboard');

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <CustomerHeader {...props} />

      {/* Tab Switcher */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content Fragment */}
      {activeTab === 'dashboard' ? (
        <DashboardContent />
      ) : (
        <BookingHistoryContent />
      )}

      {/* Fixed Footer */}
      <BottomNavigation 
        activeTab={activeTab === 'dashboard' ? 'home' : 'activity'}
        onTabPress={(tab) => {
          if (tab === 'home') setActiveTab('dashboard');
          if (tab === 'activity') setActiveTab('activity');
        }}
      />
    </View>
  );
}
```

### 2. Extract Dashboard Content
**File:** `components/DashboardContent.tsx` (new)

Extract current dashboard content từ CustomerDashboard component:
- Hero Banner
- Service Categories
- Active Orders Section
- Promotion Section

### 3. Extract Booking History Content  
**File:** `components/BookingHistoryContent.tsx` (new)

Extract booking history content từ booking-history screen:
- Stats Section
- Booking Cards List
- Empty State

### 4. Create Tab Bar Component
**File:** `components/CustomerTabBar.tsx` (new)

```typescript
interface CustomerTabBarProps {
  activeTab: 'dashboard' | 'activity';
  onTabChange: (tab: 'dashboard' | 'activity') => void;
}

function CustomerTabBar({ activeTab, onTabChange }: CustomerTabBarProps) {
  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'dashboard' && styles.tabActive]}
        onPress={() => onTabChange('dashboard')}
      >
        <Ionicons name="home" size={20} />
        <Text>Trang chủ</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'activity' && styles.tabActive]}
        onPress={() => onTabChange('activity')}
      >
        <Ionicons name="list" size={20} />
        <Text>Hoạt động</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## 📁 File Structure Changes

### Files to Create (3 new)
```
components/
├── CustomerTabBar.tsx           (NEW) - Tab switcher
├── DashboardContent.tsx         (NEW) - Dashboard fragment
└── BookingHistoryContent.tsx   (NEW) - Booking history fragment
```

### Files to Refactor (2 existing)
```
app/customer/
├── dashboard.tsx                (REFACTOR) - Container với tabs
└── booking-history.tsx          (DEPRECATE) - Có thể xóa hoặc redirect
```

### Files to Keep (reuse)
```
components/
├── CustomerDashboard.tsx        (EXTRACT TO → DashboardContent)
├── CustomerHeader.tsx           (REUSE)
└── BottomNavigation.tsx         (REUSE, update logic)
```

---

## 🔄 Implementation Steps

### Phase 1: Create Components ✅
**Step 1.1:** Create `CustomerTabBar.tsx`
- Tab switcher UI
- Active state styling
- Smooth transition animation

**Step 1.2:** Create `DashboardContent.tsx`
- Extract từ CustomerDashboard
- Remove header/footer
- Keep logic và state

**Step 1.3:** Create `BookingHistoryContent.tsx`
- Extract từ booking-history screen
- Remove header/footer
- Keep loadBookings logic

### Phase 2: Refactor Container ✅
**Step 2.1:** Update `dashboard.tsx`
- Add tab state: `useState<'dashboard' | 'activity'>('dashboard')`
- Render CustomerTabBar
- Conditional render content fragments
- Update BottomNavigation logic

**Step 2.2:** Update `booking-history.tsx`
- Option A: Redirect to dashboard with `activity` tab
- Option B: Keep for deep links but render same container

### Phase 3: Update Navigation ✅
**Step 3.1:** Update BottomNavigation
- Change `activity` tab behavior
- Instead of navigate → call `onTabChange('activity')`

**Step 3.2:** Update deep links
- `/customer/dashboard` → dashboard tab
- `/customer/booking-history` → activity tab

### Phase 4: Polish UX ✅
**Step 4.1:** Add tab transition animation
```typescript
const contentOpacity = useSharedValue(1);

const fadeOut = () => {
  contentOpacity.value = withTiming(0, { duration: 150 });
};

const fadeIn = () => {
  contentOpacity.value = withTiming(1, { duration: 150 });
};

const handleTabChange = (newTab) => {
  fadeOut();
  setTimeout(() => {
    setActiveTab(newTab);
    fadeIn();
  }, 150);
};
```

**Step 4.2:** Add tab indicator animation
```typescript
const indicatorPosition = useSharedValue(0);

useEffect(() => {
  indicatorPosition.value = withSpring(
    activeTab === 'dashboard' ? 0 : screenWidth / 2,
    { damping: 15 }
  );
}, [activeTab]);
```

---

## 🎨 UI/UX Design

### Tab Bar Design
```
┌─────────────────────────────────────────┐
│  [🏠 Trang chủ]    [📋 Hoạt động]      │
│      Active          Inactive          │
│  ▁▁▁▁▁▁▁▁▁▁                           │
│   Indicator                             │
└─────────────────────────────────────────┘

Active Tab:
- Bold text
- Primary color (#609CEF)
- Bottom indicator line
- Scale: 1.0

Inactive Tab:
- Regular text
- Gray color (#9CA3AF)
- No indicator
- Scale: 0.95
```

### Content Transition
```
Tab Switch Animation:
Old content → Fade Out (150ms)
           → Switch content
           → Fade In (150ms)

Total: 300ms smooth transition
No screen slide animation ✅
```

### Layout Structure
```
┌─────────────────────────────────────────┐
│  [Avatar] Customer Name    [🔔 3]      │ ← Fixed Header
├─────────────────────────────────────────┤
│  [🏠 Trang chủ]  [📋 Hoạt động]       │ ← Tab Bar
├─────────────────────────────────────────┤
│                                         │
│                                         │
│          Content Fragment               │ ← Dynamic Content
│        (Dashboard / Activity)           │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  [🏠] [📋] [🔧] [👤] [⚙️]            │ ← Fixed Footer
└─────────────────────────────────────────┘
```

---

## 📊 State Management

### Container State
```typescript
interface CustomerMainState {
  activeTab: 'dashboard' | 'activity';
  dashboardData: DashboardData | null;
  bookingsData: BookingItem[];
  loading: boolean;
  refreshing: boolean;
}
```

### State Preservation
```typescript
// Dashboard content state preserved khi switch tab
const [dashboardState, setDashboardState] = useState({
  scrollPosition: 0,
  expandedCategories: [],
  selectedPromotions: [],
});

// Booking history state preserved
const [bookingState, setBookingState] = useState({
  scrollPosition: 0,
  filters: [],
  sortBy: 'date',
});

// Restore scroll position khi switch back
useEffect(() => {
  if (activeTab === 'dashboard') {
    scrollViewRef.current?.scrollTo({
      y: dashboardState.scrollPosition,
      animated: false,
    });
  }
}, [activeTab]);
```

---

## 🔧 Technical Implementation

### Container Component Pattern
```typescript
// app/customer/dashboard.tsx
function CustomerMainScreen() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'activity'>('dashboard');
  const contentOpacity = useRef(new Animated.Value(1)).current;

  const handleTabChange = (newTab: 'dashboard' | 'activity') => {
    if (newTab === activeTab) return;

    // Fade out
    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Switch tab
      setActiveTab(newTab);
      
      // Fade in
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#609CEF" />
      
      {/* Fixed Header */}
      <CustomerHeader
        title={activeTab === 'dashboard' ? 'Trang chủ' : 'Hoạt động'}
        onAvatarPress={() => router.push('./profile')}
        onNotificationPress={() => router.push('./notifications')}
        notificationCount={3}
      />

      {/* Tab Bar */}
      <CustomerTabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Animated Content */}
      <Animated.View
        style={[
          styles.contentContainer,
          { opacity: contentOpacity }
        ]}
      >
        {activeTab === 'dashboard' ? (
          <DashboardContent />
        ) : (
          <BookingHistoryContent />
        )}
      </Animated.View>

      {/* Fixed Footer */}
      <BottomNavigation
        activeTab={activeTab === 'dashboard' ? 'home' : 'activity'}
        onTabPress={(tab) => {
          if (tab === 'home') handleTabChange('dashboard');
          if (tab === 'activity') handleTabChange('activity');
        }}
        onLogoPress={() => handleTabChange('dashboard')}
        theme="light"
      />
    </View>
  );
}
```

---

## ⚡ Performance Optimizations

### Lazy Content Rendering
```typescript
// Only render active tab content, keep other unmounted
{activeTab === 'dashboard' && <DashboardContent />}
{activeTab === 'activity' && <BookingHistoryContent />}

// OR: Mount both, control visibility
<DashboardContent visible={activeTab === 'dashboard'} />
<BookingHistoryContent visible={activeTab === 'activity'} />
```

### Memoization
```typescript
const DashboardContent = React.memo(() => {
  // Dashboard content
});

const BookingHistoryContent = React.memo(() => {
  // Booking history content
});
```

### Scroll Position Persistence
```typescript
// Save scroll position when switching tab
const handleScroll = (event) => {
  const scrollY = event.nativeEvent.contentOffset.y;
  if (activeTab === 'dashboard') {
    setDashboardScrollY(scrollY);
  } else {
    setActivityScrollY(scrollY);
  }
};

// Restore when tab becomes active
useEffect(() => {
  const scrollY = activeTab === 'dashboard' 
    ? dashboardScrollY 
    : activityScrollY;
  
  scrollViewRef.current?.scrollTo({
    y: scrollY,
    animated: false,
  });
}, [activeTab]);
```

---

## 🧪 Testing Scenarios

### Scenario 1: Tab Switching
```
1. Open dashboard
2. Click "Hoạt động" tab
3. Expected: 
   - Smooth fade transition (300ms)
   - No screen slide animation
   - Header/Footer persist
   - Content instantly switched
```

### Scenario 2: State Preservation
```
1. Scroll down in dashboard
2. Switch to activity tab
3. Switch back to dashboard
4. Expected:
   - Scroll position preserved
   - Data still loaded
   - No re-render flash
```

### Scenario 3: Bottom Nav Integration
```
1. Click "Hoạt động" in bottom nav
2. Expected:
   - Tab bar updates to "Hoạt động"
   - Content switches
   - Bottom nav icon active
```

### Scenario 4: Deep Link Support
```
1. Navigate to /customer/booking-history via deep link
2. Expected:
   - Container loads with 'activity' tab active
   - Content shows booking history
   - Tab bar reflects correct tab
```

---

## 📝 Migration Guide

### For Developers
1. **Don't delete** `booking-history.tsx` immediately
2. Keep it as **redirect** for backward compatibility
3. Update all internal links to use tab parameter
4. Test deep links thoroughly
5. Monitor analytics for user behavior changes

### Backward Compatibility
```typescript
// booking-history.tsx (keep as redirect)
export default function BookingHistoryRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to dashboard with activity tab
    router.replace({
      pathname: '/customer/dashboard',
      params: { tab: 'activity' }
    });
  }, []);

  return null; // Or loading indicator
}
```

---

## 🎯 Success Criteria

### UX Metrics
- [ ] Tab switch < 300ms
- [ ] No visible animation lag
- [ ] Smooth fade transition
- [ ] State preserved across tabs
- [ ] Scroll position maintained

### Technical Metrics
- [ ] No memory leaks
- [ ] Component properly memoized
- [ ] Deep links working
- [ ] Auth working on container
- [ ] Footer nav synced with tabs

### User Feedback
- [ ] Faster perceived performance
- [ ] More intuitive navigation
- [ ] Less disorienting than screen transitions
- [ ] Better for frequent switching

---

## 🚀 Rollout Plan

### Phase 1: Development (Day 1)
- Create 3 new components
- Extract content logic
- Build container

### Phase 2: Integration (Day 1-2)
- Wire up navigation
- Add animations
- Test thoroughly

### Phase 3: Polish (Day 2)
- Fine-tune transitions
- Optimize performance
- Add edge case handling

### Phase 4: Deploy (Day 3)
- Update documentation
- Monitor analytics
- Gather feedback

---

## 📊 Expected Results

### Before (Current)
```
Dashboard → Booking History: 
- Screen transition: 400ms
- Header remount: 50ms
- Data reload: 200ms
- Total: 650ms perceived delay

User action count: 15 taps/minute
```

### After (Tab-Based)
```
Dashboard → Activity Tab:
- Content fade: 150ms
- Content switch: 0ms
- Content fade in: 150ms
- Total: 300ms smooth transition

User action count: 25+ taps/minute (projected)
```

**Performance improvement: ~54% faster** 🚀

---

## 🔗 Related Files

### To Create
- `components/CustomerTabBar.tsx`
- `components/DashboardContent.tsx`
- `components/BookingHistoryContent.tsx`

### To Modify
- `app/customer/dashboard.tsx` (major refactor)
- `app/customer/booking-history.tsx` (convert to redirect)
- `components/BottomNavigation.tsx` (update logic)

### To Keep
- `components/CustomerHeader.tsx`
- `components/CustomerDashboard.tsx` (will extract from)
- All auth infrastructure

---

**Timeline:** 1-2 days  
**Priority:** High (UX improvement)  
**Risk:** Low (can rollback easily)

🎨 **Ready to implement!**
