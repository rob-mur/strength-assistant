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

## Recent Changes

- 010-fix-android-integration: Added TypeScript/JavaScript with React Native/Expo + Expo SDK, Maestro (integration testing), EAS Build, Supabase

- Fixed production deployment pipeline APK path resolution and devbox environment setup

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
