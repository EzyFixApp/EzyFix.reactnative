# 💎 Code Standards

Chuẩn viết code cho EzyFix React Native App.

## 🎯 Core Principles

### 1. 📖 **Readability First**
- Code phải dễ đọc hơn dễ viết
- Tên biến/function rõ ràng, có ý nghĩa
- Comments khi cần thiết, không comment obvious code

### 2. 🏗️ **Consistency**
- Follow existing patterns trong codebase
- Sử dụng TypeScript đầy đủ
- Consistent naming conventions

### 3. 📱 **Mobile Performance**
- Optimize cho mobile devices
- Lazy loading khi có thể
- Memory management tốt

## 📝 TypeScript Standards

### 🏷️ **Type Definitions**
```typescript
// ✅ Define clear interfaces
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'customer' | 'technician';
}

// ✅ Use proper generics
interface ApiResponse<T> {
  status_code: number;
  message: string;
  data: T;
}

// ❌ Avoid any types
const userData: any = response.data; // ❌
const userData: User = response.data; // ✅
```

### 🔧 **Type Safety**
```typescript
// ✅ Strict type checking
const handleLogin = async (credentials: LoginRequest): Promise<LoginResponse> => {
  // Implementation
};

// ✅ Proper error typing
catch (error: ApiError) {
  setError(error.message);
}

// ❌ Loose typing
catch (error: any) { // ❌
```

## 🎨 Component Standards

### 📦 **Component Structure**
```typescript
// ✅ Proper component structure
interface ComponentProps {
  title: string;
  onPress?: () => void;
  isLoading?: boolean;
}

const Component: React.FC<ComponentProps> = ({ 
  title, 
  onPress, 
  isLoading = false 
}) => {
  // Hooks first
  const [state, setState] = useState(false);
  
  // Event handlers
  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    }
  }, [onPress]);
  
  // Render
  return (
    <View>
      <Text>{title}</Text>
    </View>
  );
};

export default Component;
```

### 🎣 **Hooks Usage**
```typescript
// ✅ Custom hooks for logic reuse
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const login = useCallback(async (credentials: LoginRequest) => {
    // Implementation
  }, []);
  
  return { isAuthenticated, login };
};

// ✅ Proper dependency arrays
useEffect(() => {
  fetchData();
}, [userId, refreshToken]); // Clear dependencies

// ❌ Missing dependencies
useEffect(() => {
  fetchData();
}, []); // ❌ if fetchData uses external values
```

## 🎯 Naming Conventions

### 📁 **Files & Folders**
```
✅ PascalCase for components: LoginScreen.tsx
✅ camelCase for utilities: authService.ts
✅ kebab-case for assets: login-icon.png
✅ SCREAMING_SNAKE for constants: API_ENDPOINTS.ts
```

### 🏷️ **Variables & Functions**
```typescript
// ✅ Descriptive names
const isUserAuthenticated = true;
const handleLoginSubmit = () => {};
const fetchUserProfile = async () => {};

// ❌ Abbreviated/unclear names  
const isAuth = true; // ❌
const submit = () => {}; // ❌
const fetch = async () => {}; // ❌
```

### 🎯 **Constants**
```typescript
// ✅ Constants file
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register'
  }
} as const;

// ✅ Enum-like constants
export const USER_ROLES = {
  CUSTOMER: 'customer',
  TECHNICIAN: 'technician'
} as const;

type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
```

## 🎨 Styling Standards

### 🎨 **NativeWind Usage**
```typescript
// ✅ Consistent spacing
<View className="p-4 mb-6 bg-white rounded-lg">
  <Text className="text-lg font-semibold text-gray-800 mb-2">
    Title
  </Text>
</View>

// ✅ Responsive design
<View className="w-full md:w-1/2 lg:w-1/3">
  {/* Content */}
</View>

// ❌ Inline styles (avoid when possible)
<View style={{padding: 16, marginBottom: 24}}> {/* ❌ */}
```

### 🎭 **Theme Consistency**
```typescript
// ✅ Use design system colors
<Text className="text-primary-600"> {/* ✅ */}
<Text className="text-blue-600">   {/* ❌ Direct colors */}

// ✅ Consistent spacing scale
className="p-4 m-4 gap-4" // ✅ Consistent units
className="p-3 m-5 gap-6" // ❌ Random spacing
```

## 🔧 Service Layer Standards

### 📡 **API Services**
```typescript
// ✅ Proper service structure
class AuthService {
  private baseUrl = API_BASE_URL;
  
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await this.apiClient.post('/auth/login', credentials);
      
      if (response.status_code === 200) {
        return response.data;
      }
      
      throw new Error(response.message);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
  
  private handleError(error: any): void {
    if (__DEV__) {
      console.group('🚨 API Error');
      console.log('Error:', error.message);
      console.groupEnd();
    }
  }
}
```

### 🛡️ **Error Handling**
```typescript
// ✅ Structured error handling
try {
  const result = await apiCall();
  return result;
} catch (error: ApiError) {
  if (__DEV__) {
    console.error('API Error:', error);
  }
  
  // Professional user feedback
  setError(getErrorMessage(error));
  throw error;
}

// ✅ Error utility function
const getErrorMessage = (error: ApiError): string => {
  switch (error.status_code) {
    case 400:
      return 'Thông tin không hợp lệ';
    case 401:
      return 'Vui lòng đăng nhập lại';
    case 404:
      return 'Không tìm thấy dữ liệu';
    default:
      return 'Có lỗi xảy ra, vui lòng thử lại';
  }
};
```

## 🔍 Development Standards

### 📝 **Logging**
```typescript
// ✅ Development logging
if (__DEV__) {
  console.group('🔐 Authentication');
  console.log('👤 User:', user.email);
  console.log('🕐 Timestamp:', new Date().toISOString());
  console.groupEnd();
}

// ❌ Production logs
console.log('Debug info'); // ❌ Don't ship to production
```

### 🧪 **Testing Mindset**
```typescript
// ✅ Testable functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ✅ Pure functions when possible
const formatUserName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`.trim();
};
```

## 📱 Performance Standards

### ⚡ **Optimization Patterns**
```typescript
// ✅ Proper memoization
const MemoizedComponent = React.memo(({ data }: Props) => {
  return <ExpensiveComponent data={data} />;
});

// ✅ Callback optimization
const handlePress = useCallback((id: string) => {
  onItemPress(id);
}, [onItemPress]);

// ✅ Lazy loading
const LazyScreen = lazy(() => import('./screens/HeavyScreen'));
```

### 💾 **Memory Management**
```typescript
// ✅ Cleanup in useEffect
useEffect(() => {
  const subscription = subscribeToUpdates();
  
  return () => {
    subscription.unsubscribe();
  };
}, []);

// ✅ Avoid memory leaks
useEffect(() => {
  let isMounted = true;
  
  fetchData().then(data => {
    if (isMounted) {
      setData(data);
    }
  });
  
  return () => {
    isMounted = false;
  };
}, []);
```

## 🔒 Security Standards

### 🛡️ **Data Handling**
```typescript
// ✅ Secure token storage
import AsyncStorage from '@react-native-async-storage/async-storage';

const storeToken = async (token: string) => {
  await AsyncStorage.setItem('access_token', token);
};

// ✅ Input sanitization
const sanitizeInput = (input: string): string => {
  return input.trim().toLowerCase();
};

// ❌ Direct password handling
const password = 'plain-text'; // ❌ Never store plain passwords
```

### 🔐 **API Security**
```typescript
// ✅ Proper headers
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
  'X-Requested-With': 'XMLHttpRequest'
};

// ✅ Validate responses
if (response.status_code === 200 && response.data) {
  return response.data;
}
```

## 📋 Code Review Guidelines

### ✅ **Review Checklist**
- [ ] TypeScript types defined properly
- [ ] Error handling implemented
- [ ] Performance considerations
- [ ] Security best practices
- [ ] Mobile UX standards
- [ ] Consistent code style
- [ ] Documentation updated

### 🎯 **Review Comments Style**
```
✅ Constructive feedback:
"Consider using useMemo here for better performance"

✅ Suggest alternatives:
"What about using a custom hook for this logic?"

❌ Avoid criticism:
"This is wrong" // ❌
```

## 🚀 Deployment Standards

### 📦 **Build Optimization**
```typescript
// ✅ Environment variables
const API_BASE_URL = __DEV__ 
  ? 'https://dev-api.ezyfix.com'
  : 'https://api.ezyfix.com';

// ✅ Feature flags
const ENABLE_DEBUG_LOGS = __DEV__ && false;
```

### 🔄 **Version Control**
```bash
# ✅ Clear commit messages
feat: add forgot password flow
fix: resolve OTP validation issue
docs: update API integration guide

# ❌ Vague commits
fix: stuff // ❌
update: changes // ❌
```

---

## 📞 **Enforcement**

### 🔧 **Tools**
- **ESLint**: Code quality rules
- **Prettier**: Code formatting
- **TypeScript**: Type checking
- **Husky**: Pre-commit hooks

### 👥 **Team Responsibility**
- **Code Reviews**: Enforce standards
- **Documentation**: Keep standards updated
- **Training**: Share best practices
- **Continuous Improvement**: Evolve standards

---

## 📚 **Resources**

- [React Native Best Practices](https://reactnative.dev/docs/performance)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [NativeWind Documentation](https://nativewind.dev/)
- [Mobile Performance Guide](https://reactnative.dev/docs/performance)