# Tasks: Production Test Readiness

**Input**: Design documents from `/home/rob/Documents/Github/strength-assistant/specs/001-we-are-actually/`
**Prerequisites**: plan.md (✅), research.md (✅), data-model.md (✅), contracts/ (✅), quickstart.md (✅)

## Executive Summary
Systematic repair of 122/420 failing Jest tests to achieve constitutional compliance (Amendment v2.6.0) and CI production readiness. Current status: exit code 1 → target: exit code 0.

**Tech Stack**: TypeScript, React Native Expo, Jest, Testing Library, @legendapp/state, dual backend (Firebase/Supabase)
**Critical Path**: P0 Foundation → P1 Backend → P2 Components → P3 Quality → Constitutional Validation

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Each task includes constitutional validation per Amendment v2.6.0

---

## Phase 3.1: P0 Foundation Stability (Blocks All Testing)

### Task Completion Validation (Amendment v2.6.0)
**Expected Test Outcome**: FAIL initially - Jest worker exceptions prevent stable test execution
**Reasoning**: Foundation issues must be resolved before any tests can run reliably

- [ ] T001 [P] Optimize Jest worker configuration in `/home/rob/Documents/Github/strength-assistant/jest.config.js`
  - Set `maxWorkers: 1` for React Native + dual backend stability
  - Add `testTimeout: 30000` for complex component tests
  - Enable `detectOpenHandles: true` for resource leak detection
  - Add `forceExit: true` to prevent hanging processes

- [ ] T002 [P] Create Jest global setup in `/home/rob/Documents/Github/strength-assistant/jest.setup.js`
  - Add memory management configuration
  - Implement proper test environment initialization
  - Add React Native animation mocking
  - Configure cleanup between test suites

- [ ] T003 [P] Create test environment stabilization helper in `/home/rob/Documents/Github/strength-assistant/lib/test-utils/TestEnvironmentManager.ts`
  - Implement resource cleanup and monitoring
  - Add Jest worker health checks
  - Create test execution context tracking
  - Handle memory leak detection and cleanup

### Constitutional Validation Checkpoint P0
**Expected Test Outcome**: PASS - Jest worker exceptions eliminated, foundation stable
**Validation Command**: `devbox run test 2>&1 | grep -i "worker\|child process\|exception" | wc -l` (should be 0)

---

## Phase 3.2: P1 Backend Integration (Blocks Core Features)

### Task Completion Validation (Amendment v2.6.0)
**Expected Test Outcome**: FAIL initially - Supabase mock initialization mismatches
**Reasoning**: Backend mocks must be consistent regardless of feature flag state

- [ ] T004 [P] Create Supabase test client factory in `/home/rob/Documents/Github/strength-assistant/lib/test-utils/TestSupabaseClientFactory.ts`
  - Implement deterministic mock behavior
  - Isolate test vs production initialization paths
  - Handle feature flag switching without affecting mocks
  - Add proper cleanup between tests

- [ ] T005 [P] Fix Supabase client initialization in `/home/rob/Documents/Github/strength-assistant/lib/data/supabase/SupabaseClient.ts`
  - Separate test environment initialization logic
  - Fix mock createClient call patterns
  - Ensure consistent behavior with feature flags
  - Add proper error handling for test environment

- [ ] T006 [P] Create Firebase mock consistency layer in `/home/rob/Documents/Github/strength-assistant/lib/test-utils/FirebaseMockFactory.ts`
  - Standardize Firebase service mocking
  - Ensure parallel behavior with Supabase mocks
  - Add proper cleanup and reset functionality
  - Handle authentication state consistently

- [ ] T007 Fix backend integration tests in `/home/rob/Documents/Github/strength-assistant/__tests__/data/supabase/supabase-web-test.ts`
  - Update mock expectations to match actual initialization
  - Fix createClient assertion failures
  - Ensure emulator vs production mode detection works
  - Add proper test cleanup

### Constitutional Validation Checkpoint P1
**Expected Test Outcome**: PASS - Backend integration tests stable across feature flags
**Validation Command**: `EXPO_PUBLIC_USE_SUPABASE=true npm test -- __tests__/data/supabase/ && EXPO_PUBLIC_USE_SUPABASE=false npm test -- __tests__/data/firebase/`

---

## Phase 3.3: P2 Component Reliability (Blocks UI Coverage)

### Task Completion Validation (Amendment v2.6.0)
**Expected Test Outcome**: FAIL initially - React Native async operations not wrapped in act()
**Reasoning**: Component tests require proper async handling to prevent timeout failures

- [ ] T008 [P] Create React Native test helper with act() wrapping in `/home/rob/Documents/Github/strength-assistant/lib/test-utils/ReactNativeTestHelper.ts`
  - Implement `renderWithAct()` wrapper function
  - Add automatic cleanup for React Native components
  - Handle animation mocking and async operations
  - Provide timeout protection for component tests

- [ ] T009 Fix AuthAwareLayout component test in `/home/rob/Documents/Github/strength-assistant/__tests__/components/AuthAwareLayout-test.tsx`
  - Wrap all async operations in act()
  - Fix animation update warnings
  - Reduce test timeout from 60s to <30s
  - Add proper component cleanup

- [ ] T010 [P] Create component test utilities in `/home/rob/Documents/Github/strength-assistant/lib/test-utils/ComponentTestUtils.ts`
  - Add mock navigation providers
  - Implement auth provider mocking
  - Create component state verification helpers
  - Handle React Native module mocking

- [ ] T011 [P] Fix integration test timeouts in `/home/rob/Documents/Github/strength-assistant/__tests__/integration/auth-cross-device-sync.test.ts`
  - Wrap TestDevice operations in proper async handling
  - Fix assertion failures for exercise sync
  - Reduce test execution time
  - Add proper device cleanup between tests

### Constitutional Validation Checkpoint P2  
**Expected Test Outcome**: PASS - Component tests execute without timeouts or act() warnings
**Validation Command**: `npm test -- __tests__/components/ 2>&1 | grep -i "act\|timeout\|update.*test" | wc -l` (should be 0)

---

## Phase 3.4: P3 Test Quality (Improves Reliability)

### Task Completion Validation (Amendment v2.6.0)
**Expected Test Outcome**: PASS - Mock consistency and assertion accuracy achieved
**Reasoning**: Final quality improvements to achieve 420/420 test pass rate

- [ ] T012 [P] Standardize mock factory consistency in `/home/rob/Documents/Github/strength-assistant/lib/test-utils/mocks/MockFactoryRegistry.ts`
  - Create single source of truth for all mock factories
  - Implement backend-agnostic mock strategies
  - Add runtime mock validation
  - Ensure consistent Exercise and User mock generation

- [ ] T013 [P] Fix assertion mismatches in `/home/rob/Documents/Github/strength-assistant/__tests__/integration/feature-flag-migration.test.ts`
  - Update expected vs actual value alignment
  - Fix authentication flow test expectations
  - Correct exercise data structure assertions
  - Handle feature flag migration scenarios properly

- [ ] T014 [P] Optimize test data builders in `/home/rob/Documents/Github/strength-assistant/lib/test-utils/builders/TestDataBuilderCollection.ts`
  - Ensure all Exercise objects have required sync fields
  - Fix User account generation for both auth types
  - Add proper timestamp handling for sync operations
  - Validate test data against production schemas

### Constitutional Validation Checkpoint P3
**Expected Test Outcome**: PASS - All quality issues resolved, approaching 420/420 pass rate
**Validation Command**: `devbox run test --verbose | grep -E "PASS|FAIL" | sort | uniq -c`

---

## Phase 3.5: Constitutional Compliance Validation

### Final Constitutional Validation (Amendment v2.6.0)
**Expected Test Outcome**: PASS - 420/420 tests passing, exit code 0 achieved
**Reasoning**: All systematic repairs complete, constitutional compliance achieved

- [ ] T015 Final test suite validation and performance optimization
  - Execute `devbox run test` and achieve exit code 0
  - Validate execution time <60 seconds per constitutional requirement
  - Confirm zero Jest worker exceptions
  - Verify CI/CD pipeline readiness

- [ ] T016 [P] Create production readiness validation script in `/home/rob/Documents/Github/strength-assistant/scripts/validate-production-readiness.sh`
  - Implement automated constitutional compliance checking
  - Add test performance monitoring
  - Create CI/CD integration validation
  - Generate production readiness report

### Success Criteria Validation
- [ ] ✅ Exit code 0 from `devbox run test` (constitutional requirement)
- [ ] ✅ 420/420 tests passing consistently
- [ ] ✅ <60 second total execution time
- [ ] ✅ Zero Jest worker exceptions
- [ ] ✅ TypeScript compilation success
- [ ] ✅ CI/CD pipeline compatibility

---

## Dependencies

### Sequential Dependencies (Must Complete in Order)
- **P0 Foundation** (T001-T003) → **P1 Backend** (T004-T007) → **P2 Components** (T008-T011) → **P3 Quality** (T012-T014) → **Final Validation** (T015-T016)
- Each priority phase must achieve constitutional checkpoint before proceeding

### Parallel Execution Within Priority Levels
```bash
# Phase P0 - Run in parallel:
Task: "Optimize Jest worker configuration in jest.config.js"
Task: "Create Jest global setup in jest.setup.js" 
Task: "Create test environment stabilization helper in lib/test-utils/TestEnvironmentManager.ts"

# Phase P1 - Run in parallel:
Task: "Create Supabase test client factory in lib/test-utils/TestSupabaseClientFactory.ts"
Task: "Create Firebase mock consistency layer in lib/test-utils/FirebaseMockFactory.ts"
Task: "Create component test utilities in lib/test-utils/ComponentTestUtils.ts"
```

## Constitutional Compliance Framework

### Amendment v2.6.0 Requirements
Each task completion MUST include:

1. **Pre-Completion Declaration** (included above for each phase)
2. **Validation Execution**: `devbox run test; echo "Exit code: $?"`
3. **Results Documentation**: PASS/FAIL with exit code, execution time, prediction accuracy

### Binary Exit Code Enforcement (Amendment v2.5.0)
- Exit code 0 = Constitutional compliance achieved
- Exit code 1 = Constitutional violation, systematic repair continues
- NO partial success acceptance per constitutional requirements

### Performance Monitoring
- Target: <60 seconds total execution time
- Current baseline: ~84 seconds (requires optimization in T001-T002)
- Performance tracking required per Amendment v2.6.0

---

## Notes
- [P] tasks = different files, no dependencies, can run parallel
- Constitutional validation checkpoints are mandatory gates
- Each task must achieve expected outcome before proceeding
- Exit code 0 from `devbox run test` is the ultimate success criterion
- All 122 failing tests must be systematically repaired per Amendment v2.4.0

## Validation Checklist
*GATE: All items must be checked before marking feature complete*

- [ ] All P0 foundation issues resolved (Jest worker stability)
- [ ] All P1 backend integration tests passing (Supabase/Firebase mocks)
- [ ] All P2 component tests reliable (no timeouts or act() warnings)
- [ ] All P3 quality improvements applied (mock consistency, assertions)
- [ ] Constitutional compliance achieved (exit code 0)
- [ ] Performance target met (<60 seconds execution)
- [ ] CI/CD pipeline ready for production deployment