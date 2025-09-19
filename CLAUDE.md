# strength-assistant Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-09-19

## Active Technologies

- TypeScript/JavaScript with React Native/Expo
- Supabase (PostgreSQL) for backend services
- Legend State for local state management
- Jest + React Native Testing Library for unit tests
- Maestro for integration testing

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

- 002-remove-firebase-now: Complete Firebase removal - Supabase only backend
- Repository factory simplified to always use Supabase
- Firebase packages, source code, tests, and configuration removed

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
