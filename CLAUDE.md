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

## 🚨 CURRENT CRITICAL STATUS (Amendment v2.6.0 - Production Test Readiness)

### Production Readiness Blocking Issue
**CRITICAL ISSUE**: 122/420 Jest tests failing, preventing CI production deployment per constitutional requirements

**Current Status**:
- ✅ TypeScript compilation validation working (npx tsc --noEmit passes)
- ✅ Local-first storage feature implementation complete (Firebase ↔ Supabase migration)
- ❌ **122 Jest tests failing** - constitutional violation (exit code 1, requires 0)
- ❌ Jest worker child process exceptions causing cascade failures
- ❌ Supabase client mock initialization mismatches in test environment
- ❌ React Native component timeout issues (AuthAwareLayout, others)
- 🚨 **Cannot deploy to production until 100% test pass rate achieved**

**Production Readiness Plan**: Available in `specs/001-we-are-actually/plan.md`
- **Phase 0**: Research complete - test failure analysis and systematic repair strategy
- **Phase 1**: Design complete - test infrastructure models and constitutional compliance framework
- **Phase 2**: Ready for /tasks command - will generate 15-20 systematic repair tasks

**Systematic Repair Priorities**:
1. **P0 Foundation**: Jest worker stability, resource management, test environment setup
2. **P1 Backend**: Supabase client mocking, feature flag behavior consistency
3. **P2 Components**: React Native act() wrapping, timeout resolution  
4. **P3 Quality**: Mock factory consistency, assertion accuracy

### Amendment v2.3.0: Enhanced Test Governance
Extends constitutional requirements to include:
- **Jest Test Passage**: All Jest tests MUST pass before commits
- **Test Infrastructure Requirements**: Missing test utilities must be implemented before dependent tests
- **Systematic Repair Tracking**: All failing tests must be catalogued and systematically repaired
- **Zero Test Regressions**: No new failing tests allowed in main branch

### Amendment v2.4.0: Comprehensive Test Governance & Enforcement (ACTIVE)
**Enacted**: 2025-01-15 | **Effective Immediately**

#### Mandatory Test Governance Requirements
- **Complete Test Suite Success**: `devbox run test` MUST achieve 100% pass rate (80/80 tests) before ANY commit to main branch
- **Pre-commit Enforcement**: Git pre-commit hooks MUST block commits when any test fails
- **CI/CD Pipeline Blocking**: Continuous integration MUST block deployments and merges on test failures
- **Test Infrastructure Completeness**: All test utilities (`TestDevice`, mock factories, test builders) MUST be fully implemented and functional
- **Systematic Repair Protocol**: Test failures MUST be catalogued, categorized, and repaired using tracked, prioritized approach

#### Constitutional Enforcement Mechanisms
1. **Pre-commit Validation**:
   - Husky pre-commit hooks execute `devbox run test` before allowing commits
   - Commits blocked with clear error messaging when tests fail
   - Developers MUST fix failing tests before commit proceeds

2. **CI/CD Integration**:
   - GitHub Actions (or equivalent) pipeline runs `devbox run test` as mandatory gate
   - Deployments blocked when test suite fails
   - Pull requests cannot be merged until all tests pass

3. **Test Infrastructure Validation**:
   - Missing test utilities (TestDevice, mock factories) trigger immediate implementation requirement
   - Test infrastructure MUST support both local and CI environments
   - All mocks MUST implement complete interfaces with TypeScript validation

4. **Regression Prevention**:
   - Automated monitoring for new test failures
   - Constitutional violation reporting for governance breaches
   - Zero tolerance policy for test regressions in main branch

#### Exemption Process (Emergency Use Only)
- **Authority**: Only repository maintainers can grant test exemptions
- **Duration**: Maximum 24-hour exemption periods
- **Justification**: MUST include critical business justification and repair timeline
- **Documentation**: All exemptions MUST be logged with constitutional violation reports

#### Constitutional Violation Consequences
- **Level 1** (Test Failure): Immediate commit blocking, repair required before proceeding
- **Level 2** (Infrastructure Missing): Development blocked until infrastructure implemented
- **Level 3** (Governance Bypass): Constitutional review and potential policy updates required

#### Success Validation
Constitutional compliance achieved when:
- ✅ All 80 tests pass consistently (`devbox run test` = 100% success)
- ✅ Pre-commit hooks actively prevent failing test commits
- ✅ CI/CD pipeline blocks deployments on test failures  
- ✅ Test infrastructure fully implemented and documented
- ✅ Systematic repair tracking operational and maintained

**ENFORCEMENT STATUS**: ACTIVE - All constitutional requirements in effect immediately

### Amendment v2.5.0: Binary Exit Code Enforcement (ACTIVE)
**Enacted**: 2025-09-12 | **Effective Immediately**

#### Binary Exit Code Validation Requirements
- **Exit Code Verification**: ALL test validation MUST check process exit codes rather than parsing output logs
- **Binary Status**: `devbox run test` MUST return exit code 0 (complete success) or non-zero (any failure)
- **No Partial Success**: Exit code non-zero indicates ANY test failure, infrastructure issue, or constitutional violation
- **Validation Protocol**: Before declaring test success, ALWAYS verify exit code equals 0

#### Mandatory Exit Code Checking Protocol
1. **Command Execution with Exit Code Capture**:
   ```bash
   devbox run test
   echo "Exit code: $?"
   ```

2. **Constitutional Validation**:
   - Exit code 0 = Full constitutional compliance, all tests passed
   - Exit code non-zero = Constitutional violation, any test failure or infrastructure issue
   - NO reliance on log parsing for pass/fail determination

3. **Script Enhancement Requirements**:
   - `scripts/test.sh` MUST propagate final exit status correctly
   - All test phases must contribute to final binary result
   - Intermediate failures MUST bubble up to final exit code

#### Exit Code Enforcement Mechanisms
- **Pre-commit Hooks**: Block commits when `devbox run test` returns non-zero exit code
- **CI/CD Pipeline**: Fail builds when test command exit code is non-zero
- **Development Validation**: Always check exit code before proceeding with implementation
- **Constitutional Compliance**: Exit code validation is mandatory for all test governance

### Amendment v2.6.0: Task Completion Validation (ACTIVE)
**Enacted**: 2025-09-12 | **Effective Immediately**

#### Task Completion Validation Requirements
- **Mandatory Test Expectation Declaration**: EVERY task completion MUST include explicit prediction of test outcome (PASS/FAIL) with detailed reasoning
- **Post-Task Validation Execution**: MUST execute `devbox run test; echo "Exit code: $?"` and document results
- **Rapid Test Performance**: Test suite MUST complete in <60 seconds for constitutional compliance
- **Skip Pattern Prohibition**: Test skipping FORBIDDEN without explicit constitutional justification

#### Task Completion Protocol
1. **Pre-Completion Declaration**:
   ```markdown
   ## Task Completion Validation (Amendment v2.6.0)
   **Expected Test Outcome**: [PASS/FAIL] - [Detailed reasoning]
   **Reasoning**: [Why tests will pass/fail based on changes made]
   ```

2. **Validation Execution**:
   ```bash
   devbox run test
   echo "Exit code: $?"
   ```

3. **Results Documentation**:
   ```markdown
   **Actual Result**: [PASS/FAIL] - Exit code: [0/1]
   **Performance**: [X seconds] (Target: <60s)
   **Prediction Accuracy**: [CORRECT/INCORRECT]
   ```

#### Enforcement Mechanisms
- **Task Completion Blocking**: Tasks cannot be marked complete without proper validation format
- **Performance Monitoring**: Test execution time tracked and optimized
- **Learning Loop**: Prediction accuracy tracked for continuous improvement
- **Constitutional Integration**: Extends Amendment v2.5.0 binary exit code framework

#### Success Validation
Constitutional compliance achieved when:
- ✅ All task completions include test expectation declarations
- ✅ Post-task test validation consistently executed with results documented
- ✅ Test suite performance meets <60 second target consistently
- ✅ Zero test skips without constitutional justification
- ✅ Prediction accuracy improves through learning feedback loop

**ENFORCEMENT STATUS**: ACTIVE - All task completion validation requirements in effect immediately
