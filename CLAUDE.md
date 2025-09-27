# strength-assistant Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-09-23

## Active Technologies

- YAML 1.2 (GitHub Actions workflow syntax), Bash scripting + GitHub CLI (gh), GitHub API, GitHub Actions workflow infrastructure (008-the-current-production)
- GitHub Releases as APK artifact storage (008-the-current-production)

- YAML 1.2 (GitHub Actions workflow syntax) + GitHub Actions, existing workflow infrastructure (006-fix-ci-issue)

- TypeScript with React Native, Expo 53.0.22, Node.js (latest via devbox) + GitHub Actions, devbox (dependency management), Maestro (test automation), Expo CLI (004-one-point-to)
- GitHub release artifacts for APK storage and reuse (004-one-point-to)

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

- 008-the-current-production: ✅ COMPLETED - Production APK download failure fix: Resolved systematic GitHub CLI `latest` alias resolution failure by implementing GitHub API-based tag resolution, APK asset verification before download, and systematic error detection (exit code 2) without inappropriate retries. Enhanced error diagnostics with specific troubleshooting steps. Constitutional compliance maintained with local testing using devbox and GitHub CLI.

- 008-the-current-production: Added YAML 1.2 (GitHub Actions workflow syntax), Bash scripting + GitHub CLI (gh), GitHub API, GitHub Actions workflow infrastructure

- 007-correct-production-validation: Added YAML 1.2 (GitHub Actions workflow syntax) + GitHub Actions, existing workflow infrastructure

- 006-fix-ci-issue: Added YAML 1.2 (GitHub Actions workflow syntax) + GitHub Actions, existing workflow infrastructure

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
