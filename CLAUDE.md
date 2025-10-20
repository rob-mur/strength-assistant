# strength-assistant Development Guidelines

## Active Technologies

- TypeScript/JavaScript with React Native/Expo SDK + React Native, Expo, Supabase, Legend State (012-production-bug-android)
- Supabase (PostgreSQL), local Legend State (012-production-bug-android)

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

## Simple Error Blocking System

The application uses a lightweight error blocking system that replaces the complex 750+ line error handling with simple, effective error detection for React Native. This system is specifically designed to solve production Android stack overflow issues.

### Core Components

- **ErrorBlocker**: React component that blocks app interaction when uncaught errors occur
- **SimpleErrorLogger**: Console-only logging with <0.01ms overhead (100x improvement)
- **MaestroErrorDetection**: Exposes error state to integration tests with testID attributes
- **ReactNativeErrorHandler**: Integrates with React Native ErrorUtils for global error handling

### Key Features

- **App Blocking**: When uncaught errors occur, entire app is blocked with overlay
- **Maestro Integration**: Error blocker provides testID attributes for test detection
- **Zero Recursion**: Simple console logging prevents stack overflow issues
- **Production Ready**: Works in production APK builds on real Android devices

### Usage Patterns

#### Basic Error Logging

```typescript
import { createSimpleErrorLogger } from "@/lib/utils/logging/SimpleErrorLogger";

const logger = createSimpleErrorLogger();

try {
  await riskyOperation();
} catch (error) {
  logger.logError(error, "operation-context");
}
```

#### Error Blocking for Uncaught Errors

```typescript
// For uncaught errors that should block the app
logger.logAndBlock(error, "uncaught-error-context");
```

#### Full System Initialization

```typescript
import { initializeErrorBlocking } from "@/lib/utils/logging/ErrorBlockingFactory";

const errorSystem = initializeErrorBlocking({
  enabled: true,
  showErrorDetails: false, // Keep false for production
  enableConsoleLogging: true,
});
```

### File Structure

```
lib/components/
└── ErrorBlocker.tsx              # React component that blocks app on errors

lib/models/
├── ErrorBlockerState.ts          # State model for error tracking
├── SimpleErrorLog.ts             # Lightweight log entry model
└── MaestroErrorIndicator.ts       # Model for Maestro test integration

lib/utils/logging/
├── SimpleErrorLogger.ts          # Console-only error logging
├── ReactNativeErrorHandler.ts    # React Native ErrorUtils integration
└── ErrorBlockingFactory.ts       # Factory for error blocking system

lib/utils/testing/
└── MaestroErrorDetection.ts      # Maestro test detection utilities

.maestro/shared/
└── error-check.yml               # Maestro test to check for uncaught errors
```

### Performance Targets

- Error logging overhead: <0.01ms per operation (100x improvement from previous <1ms)
- Memory footprint: Console-only logging with no accumulation
- Zero recursion: Prevents stack overflow issues in production builds

### Maestro Integration

Tests can detect uncaught errors using:

```yaml
# Check that no uncaught errors occurred
- assertNotVisible:
    id: "maestro-error-blocker"
```

### Error State TestIDs

- `maestro-error-blocker`: Main error overlay (visible when errors occur)
- `maestro-error-count`: Displays number of uncaught errors
- `maestro-error-message`: Shows last error message

## Recent Changes

- 012-production-bug-android: Implemented simple error blocking system to replace complex 750+ line error handler, preventing production Android stack overflow issues. Added ErrorBlocker React component, SimpleErrorLogger with <0.01ms performance, MaestroErrorDetection for integration tests, and ReactNativeErrorHandler for global error handling. Integrated system into app root layout and created Maestro tests for error detection.

- 011-improve-error-logging: Added comprehensive error logging system with 47 empty catch block migrations, recovery actions, and React Native context collection

- 010-fix-android-integration: Added TypeScript/JavaScript with React Native/Expo + Expo SDK, Maestro (integration testing), EAS Build, Supabase

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
