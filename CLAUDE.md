# strength-assistant Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-09-23

## Active Technologies

- TypeScript/JavaScript with React Native, Expo 53.0.22, Node.js (latest via devbox) + GitHub Actions, devbox (for dependency management), Maestro (test automation), Expo CLI (004-one-point-to)
- N/A (CI/CD pipeline infrastructure enhancement) (004-one-point-to)

- TypeScript/JavaScript with React Native/Expo + Maestro (test automation), existing CI/CD pipeline, Supabase (004-one-point-to)
- Production server configuration, anonymous user data (temporary) (004-one-point-to)

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
npm run test:production-build # Validate production APK authentication
npm run validate-env # Check environment configuration

# Development

npm run lint # ESLint
npm run typecheck # TypeScript checking
npm start # Start Expo dev server

# Production Authentication Testing

npm run debug:env-config # Debug environment loading
npm run test:session-storage # Test session persistence
npm run test:apk-validation # Test against built APK

# Production Validation

gh workflow run production-validation.yml --field terraform_deployment_id="manual-test-$(date +%s)" # Trigger manual production validation
gh run list --workflow=production-validation.yml --limit=5 # Check recent validation runs
gh workflow run deployment-gate.yml --field deployment_type="frontend" --field deployment_environment="production" # Test deployment gate
scripts/production-test-setup.sh # Setup environment for production testing
scripts/production-alert.sh DEPLOYMENT_ID STATUS # Send production validation alerts

## Code Style

- All business logic in lib/ directory
- Routes and screens in app/ directory
- Direct framework usage (no unnecessary wrappers)
- Supabase-only backend (no Firebase)
- TDD approach: tests before implementation

## Recent Changes

- 004-one-point-to: Added TypeScript/JavaScript with React Native, Expo 53.0.22, Node.js (latest via devbox) + GitHub Actions, devbox (for dependency management), Maestro (test automation), Expo CLI

- 004-one-point-to: Production server testing enhancement - validates against actual production infrastructure with Maestro flows, APK builds, and deployment gates
- 003-fix-production-bug: Added production authentication testing + environment configuration

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
