# Phase 1: Quickstart Guide & Testing Strategy

**Date**: 2025-09-13

This guide explains the testing strategy and how to run the various test suites for the local-first storage feature. These tests validate the end-to-end functionality, including the repository abstraction and the synchronization with the backend.

## 1. Prerequisites

- You have the development environment set up, including `devbox`.
- The Firebase and Supabase emulators are configured and ready to run (this is handled automatically by the integration test scripts).

## 2. Testing Workflow

The testing process should follow a sequential workflow, starting with the fastest tests and progressing to the more comprehensive (and slower) suites.

### Step 1: Unit Tests (Fastest)

For small, incremental changes, you should run the unit tests. These are fast and provide immediate feedback.

```bash
npm test
```

### Step 2: Full Unit Test & Linting Pipeline

Once a logical piece of work is complete and the unit tests are passing, run the full pre-flight check pipeline. This includes linting, TypeScript checks, and all unit tests.

```bash
devbox run test
```

### Step 3: Integration Tests (When Necessary)

Integration tests should be run when you are working on a task that directly involves integration concerns (e.g., changes to the repository layer, backend configuration, or cross-service communication). You do not need to run these for every small change.

The integration tests are designed to run against both the Firebase and Supabase backends. This is controlled by the `EXPO_PUBLIC_USE_SUPABASE` environment variable set in the `devbox.json` files.

#### To run tests against Firebase (the existing setup):

1.  Ensure the `EXPO_PUBLIC_USE_SUPABASE` is set to `"false"` in the relevant `devbox.json` files.
2.  Run the tests:

```bash
# Run the Android integration tests
devbox run integration_test_android

# Or run the Chrome integration tests
devbox run integration_test_chrome
```

#### To run tests against Supabase (the new setup):

1.  Ensure the `EXPO_PUBLIC_USE_SUPABASE` is set to `"true"` in the relevant `devbox.json` files.
2.  Run the tests:

```bash
# Run the Android integration tests
devbox run integration_test_android

# Or run the Chrome integration tests
devbox run integration_test_chrome
```

## 3. Expected Behavior

- The goal is to ensure all tests pass at each stage of the workflow.
- The integration test runs will verify that the `IExerciseRepository` contract is correctly implemented by both the `FirebaseExerciseRepo` and the `SupabaseExerciseRepo` and that the application behaves identically regardless of the chosen backend.

---

# Production Test Readiness Workflow

**Context**: Constitutional compliance and CI readiness for production deployment

## 4. Constitutional Requirements (Amendment v2.6.0)

### Binary Exit Code Enforcement
All test validation MUST check process exit codes:

```bash
devbox run test
echo "Exit code: $?"
# Exit code 0 = Constitutional compliance (all tests pass)
# Exit code 1 = Constitutional violation (any test failure)
```

### Task Completion Validation Protocol
Every task completion MUST include:

1. **Pre-Completion Declaration**:
   ```markdown
   **Expected Test Outcome**: [PASS/FAIL] - [Detailed reasoning]
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

## 5. Test Repair Workflow

### Phase 1: Foundation Stability (P0)
```bash
# Check Jest worker stability
devbox run test 2>&1 | grep -i "worker\|child process\|exception"

# Monitor memory usage during tests
devbox run test 2>&1 | grep -i "memory\|timeout\|killed"
```

### Phase 2: Backend Integration (P1)  
```bash
# Test Supabase client initialization
EXPO_PUBLIC_USE_SUPABASE=true npm test -- __tests__/data/supabase/

# Test Firebase client stability
EXPO_PUBLIC_USE_SUPABASE=false npm test -- __tests__/data/firebase/
```

### Phase 3: Component Reliability (P2)
```bash
# Test React Native components with proper act() wrapping
npm test -- __tests__/components/ --verbose

# Check for async operation warnings
npm test 2>&1 | grep -i "act\|async\|update.*test"
```

## 6. Performance Monitoring

### Execution Time Tracking
```bash
# Time the full test suite
time devbox run test

# Target: <60 seconds total execution
# Current baseline: ~84 seconds (needs optimization)
```

### Memory Usage Monitoring
```bash
# Monitor Jest memory usage
devbox run test --detectOpenHandles --forceExit

# Check for memory leaks
devbox run test 2>&1 | grep -i "leak\|memory\|handle"
```

## 7. Systematic Failure Cataloging

### Current Status (Baseline)
- **Total Tests**: 420
- **Failing Tests**: 122 (❌ Constitutional violation)
- **Pass Rate**: 71% (Target: 100%)
- **Exit Code**: 1 (Target: 0)

### Repair Tracking Template
```markdown
## Test Repair: [TestName]
**Expected Outcome**: PASS - [Reasoning]
**Error Type**: [timeout/assertion/mock/worker]
**Fix Applied**: [Specific change made]
**Validation**: 
- Exit code: [0/1]
- Execution time: [X seconds]
- Pass status: [PASS/FAIL]
```

## 8. CI/CD Readiness Validation

### Pre-commit Requirements
```bash
# These commands must ALL return exit code 0:
npx tsc --noEmit                  # TypeScript compilation
devbox run test                   # Full test suite
npm run lint                      # Code quality
```

### Pipeline Integration
```bash
# Simulate CI environment
CI=true devbox run test

# Validate in clean environment
docker run --rm -v $(pwd):/app -w /app node:latest bash -c "npm ci && devbox run test"
```

### Success Criteria Checklist
- [ ] ✅ Exit code 0 from `devbox run test`
- [ ] ✅ All 420 tests passing
- [ ] ✅ <60 second execution time
- [ ] ✅ Zero Jest worker exceptions
- [ ] ✅ TypeScript compilation success
- [ ] ✅ No ESLint errors
- [ ] ✅ CI pipeline compatibility