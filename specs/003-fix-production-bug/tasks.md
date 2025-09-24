# Tasks: Fix Production Authentication Bug & Implement Release Testing

**Input**: Design documents from `/specs/003-fix-production-bug/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Tech stack: TypeScript/React Native/Expo with Supabase
   → Libraries: Legend State, Jest + React Native Testing Library, Maestro
   → Structure: Mobile app with lib/ and app/ directories
2. Load design documents:
   → data-model.md: Environment config, auth session, auth error, test result, network info entities
   → contracts/: auth-validation.json with 3 endpoints
   → research.md: Environment config, session persistence, network issues, testing infrastructure
3. Generate tasks by category:
   → Setup: Environment validation, dependencies, linting
   → Tests: Contract tests for auth endpoints, integration tests for production flows
   → Core: Environment config, session management, error handling, auth validation
   → Integration: Production build testing, CI/CD pipeline
   → Polish: Unit tests, performance validation, documentation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Mobile structure**: `lib/` for business logic, `app/` for screens, `__tests__/` for tests
- Paths follow existing React Native/Expo project structure

## Phase 3.1: Setup

- [ ] T001 Validate current environment configuration and dependencies
- [ ] T002 Install additional testing dependencies for production APK validation
- [ ] T003 [P] Configure ESLint and TypeScript checking for new authentication modules

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [ ] T004 [P] Contract test POST /auth/validate-environment in **tests**/contract/auth-validate-environment.test.ts
- [ ] T005 [P] Contract test POST /auth/test-connection in **tests**/contract/auth-test-connection.test.ts
- [ ] T006 [P] Contract test POST /auth/anonymous in **tests**/contract/auth-anonymous.test.ts
- [ ] T007 [P] Integration test production build authentication in **tests**/integration/production-auth.test.ts
- [ ] T008 [P] Integration test environment switching in **tests**/integration/env-switching.test.ts
- [ ] T009 [P] Integration test session persistence across app restarts in **tests**/integration/session-persistence.test.ts
- [ ] T010 [P] Integration test network error handling and fallback in **tests**/integration/network-fallback.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [ ] T011 [P] Environment configuration manager in lib/config/environment.ts
- [ ] T012 [P] Authentication session manager in lib/auth/session.ts
- [ ] T013 [P] Authentication error tracker in lib/auth/error-tracker.ts
- [ ] T014 [P] Network info collector in lib/auth/network-info.ts
- [ ] T015 [P] Test result recorder in lib/testing/test-recorder.ts
- [ ] T016 Environment validation service in lib/config/validation.ts
- [ ] T017 Connection testing service in lib/auth/connection-test.ts
- [ ] T018 Anonymous authentication handler in lib/auth/anonymous-auth.ts
- [ ] T019 Production auth validation wrapper in lib/auth/production-validator.ts
- [ ] T020 Update Supabase client initialization in lib/data/supabase/index.ts
- [ ] T021 Update existing auth implementation in lib/data/supabase/auth.ts

## Phase 3.4: Integration

- [ ] T022 Production build testing script in scripts/test-production-build.sh
- [ ] T023 Environment debugging utilities in scripts/debug-env-config.sh
- [ ] T024 APK validation testing script in scripts/test-apk-validation.sh
- [ ] T025 Session storage testing script in scripts/test-session-storage.sh
- [ ] T026 Network connectivity testing script in scripts/test-network.sh
- [ ] T027 Pre-release validation pipeline in .github/workflows/pre-release-validation.yml
- [ ] T028 Update package.json scripts for production testing commands

## Phase 3.5: Polish

- [ ] T029 [P] Unit tests for environment configuration in **tests**/unit/config/environment.test.ts
- [ ] T030 [P] Unit tests for session manager in **tests**/unit/auth/session.test.ts
- [ ] T031 [P] Unit tests for error tracker in **tests**/unit/auth/error-tracker.test.ts
- [ ] T032 [P] Unit tests for network info collector in **tests**/unit/auth/network-info.test.ts
- [ ] T033 [P] Unit tests for test recorder in **tests**/unit/testing/test-recorder.test.ts
- [ ] T034 Performance validation: auth flow completes within 5 seconds
- [ ] T035 [P] Update CLAUDE.md with new authentication testing commands
- [ ] T036 Remove code duplication and refactor for maintainability
- [ ] T037 Execute quickstart.md validation scenarios

## Dependencies

- Tests (T004-T010) before implementation (T011-T021)
- T011 (environment config) blocks T016, T019, T020
- T012 (session manager) blocks T018, T021
- T013 (error tracker) blocks T017, T019
- T014 (network info) blocks T017, T026
- T015 (test recorder) blocks T022-T024
- Core implementation (T011-T021) before integration (T022-T028)
- Implementation before polish (T029-T037)

## Parallel Example

```
# Launch T004-T010 together (contract and integration tests):
Task: "Contract test POST /auth/validate-environment in __tests__/contract/auth-validate-environment.test.ts"
Task: "Contract test POST /auth/test-connection in __tests__/contract/auth-test-connection.test.ts"
Task: "Contract test POST /auth/anonymous in __tests__/contract/auth-anonymous.test.ts"
Task: "Integration test production build authentication in __tests__/integration/production-auth.test.ts"
Task: "Integration test environment switching in __tests__/integration/env-switching.test.ts"
Task: "Integration test session persistence in __tests__/integration/session-persistence.test.ts"
Task: "Integration test network error handling in __tests__/integration/network-fallback.test.ts"

# Launch T011-T015 together (core models):
Task: "Environment configuration manager in lib/config/environment.ts"
Task: "Authentication session manager in lib/auth/session.ts"
Task: "Authentication error tracker in lib/auth/error-tracker.ts"
Task: "Network info collector in lib/auth/network-info.ts"
Task: "Test result recorder in lib/testing/test-recorder.ts"

# Launch T029-T033 together (unit tests):
Task: "Unit tests for environment configuration in __tests__/unit/config/environment.test.ts"
Task: "Unit tests for session manager in __tests__/unit/auth/session.test.ts"
Task: "Unit tests for error tracker in __tests__/unit/auth/error-tracker.test.ts"
Task: "Unit tests for network info collector in __tests__/unit/auth/network-info.test.ts"
Task: "Unit tests for test recorder in __tests__/unit/testing/test-recorder.test.ts"
```

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Test against actual production APK builds, not just development
- Commit after each task
- Focus on production authentication flows and fallback mechanisms
- All scripts must be executable and work in CI/CD environment

## Task Generation Rules

_Applied during main() execution_

1. **From Contracts**:
   - auth-validation.json → 3 contract test tasks [P] (T004-T006)
   - Each endpoint → corresponding implementation task
2. **From Data Model**:
   - Environment Configuration → T011 [P]
   - Authentication Session → T012 [P]
   - Authentication Error → T013 [P]
   - Network Info → T014 [P]
   - Test Result → T015 [P]
3. **From Research Decisions**:
   - Environment-specific configuration → T011, T016
   - Session persistence investigation → T012, T009
   - Network configuration & SSL → T014, T017, T026
   - Pre-release testing infrastructure → T015, T022-T027
   - Environment variable management → T011, T023

4. **From Quickstart Scenarios**:
   - Test current auth flow → T007, T037
   - Build and test production APK → T022, T024
   - Verify environment configuration → T008, T023
   - Pre-release test suite → T027, T037
   - Validate fix implementation → T025, T026, T037
5. **Ordering**:
   - Setup → Tests → Models → Services → Integration → Polish
   - Authentication core before production validation
   - Environment config before all auth services

## Validation Checklist

_GATE: Checked by main() before returning_

- [x] All contracts have corresponding tests (T004-T006)
- [x] All entities have model tasks (T011-T015)
- [x] All tests come before implementation (T004-T010 before T011-T021)
- [x] Parallel tasks truly independent (different files, no shared dependencies)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Production validation scenarios included
- [x] Pre-release testing pipeline tasks included
- [x] Environment configuration properly handled
- [x] Session persistence issues addressed
- [x] Network error handling covered
