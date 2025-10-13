# strength-assistant Development Guidelines

## Active Technologies

- TypeScript/JavaScript with React Native/Expo + Expo SDK, Maestro (integration testing), EAS Build, Supabase (010-fix-android-integration)

- TypeScript/JavaScript with React Native/Expo
- Supabase (PostgreSQL) for backend services
- Legend State for local state management
- Jest + React Native Testing Library for unit tests
- Maestro for integration testing
- GitHub Actions for CI/CD
- Devbox for dependency management

## Project Structure

```
app/                     # Expo Router screens and routes
├── (tabs)/
├── _layout.tsx
└── error.ts

lib/                     # Business logic and services
├── data/
│   └── supabase/       # Supabase implementation only
├── repo/               # Repository layer (Supabase only)
├── hooks/              # React hooks
└── models/             # Data models

__tests__/              # Test infrastructure
├── integration/
├── unit/
└── test-utils/
```

## Commands

# Testing

npm test # Run Jest unit tests
devbox run test # Run complete test suite
devbox run maestro-test # Run Maestro integration tests
npm run test:production-build # Validate production APK authentication
npm run validate-env # Check environment configuration

# Development

npm run lint # ESLint
npm run typecheck # TypeScript checking
npm start # Start Expo dev server

## Code Style

- All business logic in lib/ directory
- Routes and screens in app/ directory
- Direct framework usage (no unnecessary wrappers)
- Supabase-only backend (no Firebase)
- TDD approach: tests before implementation

## Error Handling System

The application uses a comprehensive error logging and recovery system to replace empty catch blocks with proper error handling.

### Core Components

- **LoggingService**: Centralized error logging with contextual information
- **ErrorHandler**: Global error boundaries and function wrapping
- **UserErrorDisplay**: User-friendly error messages and recovery options
- **RecoveryActions**: Automated retry and fallback mechanisms

### Usage Patterns

#### Basic Error Logging

```typescript
import { initializeErrorHandling } from "@/lib/utils/logging/LoggingServiceFactory";

const { loggingService, userErrorDisplay } = initializeErrorHandling();

try {
  await riskyOperation();
} catch (error) {
  loggingService
    .logError(error, "operation-name", "Error", "Network")
    .catch((loggingError) => console.error("Logging failed:", loggingError));

  userErrorDisplay
    .showNetworkError("operation-name")
    .catch(() => console.warn("Failed to show error to user"));
}
```

#### Function Wrapping

```typescript
const { errorHandler } = initializeErrorHandling();

const safeFunction = errorHandler.wrapAsyncWithErrorHandling(
  async () => await dangerousOperation(),
  "dangerous-operation",
  "Database",
  true, // Enable recovery
);
```

#### Error Types and Recovery

- **Network**: Retry with exponential backoff (3 attempts, 2s delay)
- **Database**: Limited retry (2 attempts, 1s delay)
- **Authentication**: User prompt for re-authentication
- **UI**: Fallback to default UI behavior
- **Logic**: Fail gracefully with user notification

### File Structure

```
lib/utils/logging/
├── LoggingServiceFactory.ts     # Factory for creating logging services
├── DefaultLoggingService.ts     # Core logging implementation
├── DefaultErrorHandler.ts       # Global error handling
├── DefaultUserErrorDisplay.ts   # User-facing error messages
├── RecoveryConfig.ts           # Recovery action configuration
└── ReactNativeContextCollector.ts # React Native context collection
```

### Performance Targets

- Error logging overhead: <1ms per operation
- Memory footprint: <2MB for error system
- Automatic cleanup of old error logs (7-day retention)

## Recent Changes

- 011-improve-error-logging: Added comprehensive error logging system with 47 empty catch block migrations, recovery actions, and React Native context collection

- 010-fix-android-integration: Added TypeScript/JavaScript with React Native/Expo + Expo SDK, Maestro (integration testing), EAS Build, Supabase

- Fixed production deployment pipeline APK path resolution and devbox environment setup

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
