/**
 * Development Error Suppression
 * Only for development - suppresses specific known error messages
 * DO NOT use in production builds
 */

// Store original console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// List of error messages to suppress in development
const SUPPRESSED_ERRORS = [
  'Login failed:',
  'Wrong password',
  'Invalid password',
  'status_code:401',
  'WrongPasswordException'
];

// Override console.error only in development
if (__DEV__) {
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Check if this error should be suppressed
    const shouldSuppress = SUPPRESSED_ERRORS.some(suppressedError => 
      message.includes(suppressedError)
    );
    
    if (!shouldSuppress) {
      originalConsoleError.apply(console, args);
    }
  };

  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    
    // You can add specific warnings to suppress here
    originalConsoleWarn.apply(console, args);
  };
}

export const restoreConsole = () => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
};