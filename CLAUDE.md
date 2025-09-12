# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm start` or `npx expo start` - Start the Expo development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator/device  
- `npm run web` - Run in web browser

### Testing (CONSTITUTIONAL REQUIREMENT)
- `devbox run test` - **MANDATORY SUCCESS**: Must pass before any feature completion
- `npm test` - Run unit tests with Jest  
- `npm run test:watch` - Run tests in watch mode
- `npx tsc --noEmit` - TypeScript compilation check (required before commit)

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting without making changes

### Storybook
- `npm run storybook` - Start Storybook dev server on port 6006
- `npm run build-storybook` - Build Storybook for production
- `npm run storybook-generate` - Generate Storybook stories

## Architecture Overview

### Project Structure
This is a React Native Expo app built with TypeScript, using file-based routing and Firebase for data persistence.

#### Key Directories
- `app/` - File-based routing with Expo Router, contains screens and navigation
- `lib/` - Core application logic
  - `components/` - Reusable UI components
  - `hooks/` - Custom React hooks
  - `models/` - TypeScript interfaces and types
  - `repo/` - Data access layer with repository pattern
  - `data/firebase/` - Firebase configuration and utilities
  - `locales/` - Internationalization files
- `__tests__/` - Unit tests
- `stories/` - Storybook stories for components

### Navigation Structure
- Tab-based navigation using `@react-navigation/bottom-tabs`
- Main tabs: Home, Exercises, Workout
- Exercises tab has nested navigation with index and add screens

### Data Layer
- **Repository Pattern**: `ExerciseRepo` class provides data access abstraction
- **Dual Backend Support**: Firebase (current) and Supabase (migration target) with feature flag control
- **Legend State Integration**: Local-first persistence with automatic sync engine for Supabase
- **Models**: Simple `Exercise` interface with id and name fields
- **Real-time Updates**: Uses Firebase `onSnapshot` and Supabase real-time subscriptions
- **Feature Flags**: Runtime switching between Firebase and Supabase implementations

### State Management
- Custom hooks pattern (e.g., `useExercises`, `useAddExercise`)
- React hooks for local state management
- Firebase handles persistence and real-time sync

### Platform Configuration
- **Path Aliases**: `@/*` maps to project root for cleaner imports
- **Firebase**: Separate configs for web (`firebase.web.ts`) and native (`firebase.native.ts`)
- **Cross-platform**: Supports Android, iOS, and web deployment

### Theme and Styling
- Uses React Native Paper for Material Design 3 components
- Automatic light/dark theme switching based on system preference
- Custom fonts: JetBrains Mono and Noto Sans

### Testing Strategy
- Jest with React Native Testing Library for unit tests
- Component tests in `__tests__/components/`
- Hook tests in `__tests__/hooks/`
- Screen tests in `__tests__/screens/`
- Integration testing capability (config referenced)

### Development Tools
- **TypeScript**: Strict mode enabled with custom path mapping
- **ESLint**: Expo config with additional plugins for unused imports, Storybook, Jest, and Testing Library
- **Prettier**: Code formatting
- **Storybook**: Component development and documentation
- **Devbox (Nix)**: Reproducible development environment with lock file for CI/local parity

## 🚨 CONSTITUTIONAL REQUIREMENTS (NON-NEGOTIABLE)

### TypeScript Testing Infrastructure (Amendment v2.2.0)
- **TypeScript Compilation**: MUST succeed before test execution (`npx tsc --noEmit`)
- **devbox run test**: MUST pass completely before any commit
- **Pre-commit Hooks**: Automatically validate TypeScript compilation and block violating commits
- **Zero Tolerance**: No exceptions for TypeScript compilation failures
- **FORBIDDEN**: Committing code that breaks TypeScript compilation
- **REQUIRED**: Immediate fix of any TypeScript compilation errors

### TypeScript Validation Workflow
1. **Before Starting Work**: Run `devbox run test` to ensure clean baseline
2. **During Development**: Run `npx tsc --noEmit` frequently to catch errors early
3. **Before Committing**: Pre-commit hook automatically validates TypeScript + tests
4. **CI/CD Validation**: `scripts/validate-typescript.sh` enforces constitutional compliance

### TypeScript Error Resolution Protocol
- **Immediate Action**: Fix TypeScript errors as soon as they appear
- **No Deferring**: Cannot push/merge code with TypeScript compilation errors
- **Validation Tools**:
  - `npx tsc --noEmit` - Quick compilation check
  - `scripts/validate-typescript.sh` - Full constitutional compliance validation
  - Jest global setup - Validates TypeScript before test execution
  - Pre-commit hooks - Blocks commits with TypeScript errors

### Constitutional Amendment Infrastructure
- **Amendment Manager**: `src/constitution/ConstitutionalAmendmentManager.ts`
- **TypeScript Validator**: `src/typescript/TypeScriptValidator.ts`
- **Compliance Validation**: Automated constitutional requirement checking
- **Enforcement Mechanisms**: Pre-commit hooks, CI pipelines, Jest global setup

## 🚨 CURRENT CRITICAL STATUS (Amendment v2.3.0)

### Test Suite Constitutional Violation
**CRITICAL ISSUE**: `devbox run test` is NOT passing, violating the constitutional requirement that "devbox run test MUST pass completely before any commit"

**Current Status**:
- ✅ TypeScript compilation validation working (constitutional check passes)
- ❌ **80+ Jest tests failing** - this blocks all constitutional compliance
- ❌ Missing test infrastructure: `TestDevice` and `TestApp` classes
- ❌ Component test timeouts in `AuthAwareLayout` tests
- 🚨 **Cannot commit until all tests pass**

**Required Actions**:
1. **Priority 1**: Implement missing `lib/test-utils/TestDevice.ts`
2. **Priority 1**: Implement missing `lib/test-utils/TestApp.ts`  
3. **Priority 2**: Fix component test timeout issues
4. **Priority 3**: Ensure `devbox run test` passes 100%

**Test Infrastructure Contracts**: Available in `specs/001-we-are-actually/contracts/`
- `test-infrastructure.ts` - TestDevice interface specification
- `jest-validation.ts` - Jest validation requirements
- `test-repair.ts` - Systematic test repair tracking

### Amendment v2.3.0: Enhanced Test Governance
Extends constitutional requirements to include:
- **Jest Test Passage**: All Jest tests MUST pass before commits
- **Test Infrastructure Requirements**: Missing test utilities must be implemented before dependent tests
- **Systematic Repair Tracking**: All failing tests must be catalogued and systematically repaired
- **Zero Test Regressions**: No new failing tests allowed in main branch
