# Tasks: Fix Android Integration Test Bug

**Input**: Design documents from `/specs/010-fix-android-integration/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Tech stack: TypeScript/JavaScript with React Native/Expo, Maestro, EAS Build, Supabase
   → Structure: Mobile app with Supabase backend
2. Load design documents:
   → spec.md: 6 consolidated functional requirements (FR-001 to FR-006)
   → research.md: Critical exit code bug identified, environment variable patterns
   → contracts/: GitHub Actions, environment config, test execution contracts
   → data-model.md: Test execution results, environment configuration entities
3. Generate tasks by category:
   → Setup: Environment validation, prerequisite checks
   → Critical Fix: Exit code handling in GitHub Actions (FR-001, FR-002)
   → Environment: Supabase configuration notifications and validation (FR-004, FR-006)
   → Error Handling: Clear error messages and debug artifacts (FR-003)
   → Testing: Integration test validation, production validation (FR-005)
   → Edge Cases: Address specific edge case scenarios from updated spec
4. Apply task rules:
   → Critical GitHub Action fix is highest priority
   → Environment tasks are notifications to user
   → Testing tasks validate fixes work correctly
5. Number tasks sequentially (T001-T020)
6. CRITICAL: Exit code fix must be completed before any testing
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[CRITICAL]**: Affects all CI/CD pipeline operations
- **[NOTIFICATION]**: User action required (Supabase/EAS configuration)
- **[EDGE]**: Addresses specific edge case scenario
- Include exact file paths in descriptions

## Phase 3.1: Setup and Validation

- [x] T001 [P] Verify devbox environment is active and Supabase local development is running
- [x] T002 [P] Validate current EAS environment variable configuration for production profile
- [x] T003 [P] Confirm Android emulator networking can reach host Supabase (10.0.2.2:54321)

## Phase 3.2: Critical Exit Code Fix ⚠️ HIGHEST PRIORITY

**CRITICAL: Addresses FR-001 and FR-002 - exit code handling and CI failure propagation**

- [x] T004 [CRITICAL] Fix exit code to boolean conversion in `.github/actions/maestro-test/action.yml` lines 62-66
- [x] T005 [CRITICAL] Update exit code propagation in `scripts/integration_test_android.sh` to ensure proper failure reporting
- [x] T006 [CRITICAL] Validate GitHub Action outputs match expected contract in `contracts/github-actions.yml`

## Phase 3.3: Environment Variable Configuration ⚠️ USER ACTION REQUIRED

**NOTIFICATION TASKS: Address FR-004 and FR-006 - environment variable configuration**

- [x] T007 [NOTIFICATION] **USER ACTION**: Set EAS environment variables for production profile using these exact commands:
  ```bash
  eas env:set EXPO_PUBLIC_SUPABASE_URL="https://oddphoddejomqiyctctq.supabase.co" --profile production
  eas env:set EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kZHBob2RkZWpvbXFpeWN0Y3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODExNjIsImV4cCI6MjA3MjE1NzE2Mn0.MKheiiDO2VCknBaD2QRw4Kf_GeHpQW15qUMMAtK7BDk" --profile production
  eas env:set EXPO_PUBLIC_USE_SUPABASE="true" --profile production
  eas env:set EXPO_PUBLIC_USE_SUPABASE_EMULATOR="false" --profile production
  ```

- [x] T008 [NOTIFICATION] **USER ACTION**: Verify current devbox configuration contains these exact values for development/preview:
  ```bash
  # In devbox environment:
  EXPO_PUBLIC_USE_SUPABASE_EMULATOR=true
  EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 (local) or http://10.0.2.2:54321 (Android)
  EXPO_PUBLIC_SUPABASE_EMULATOR_HOST=10.0.2.2
  EXPO_PUBLIC_SUPABASE_EMULATOR_PORT=54321
  ```

- [x] T009 [P] Validate environment variable loading logic in `lib/config/supabase-env.ts` matches contract requirements
- [x] T010 [P] Confirm `app.config.js` properly handles environment-specific configuration per contract

## Phase 3.4: Error Handling and Debug Artifacts ⚠️ ADDRESS FR-003

**NEW: Address clear error messages and debug artifact requirements**

- [x] T011 [P] Implement standardized error message format for test failures in `scripts/integration_test_android.sh`
- [x] T012 [P] Add debug artifact location reporting to error messages in `.github/actions/maestro-test/action.yml`
- [x] T013 [P] Create error message validation test to ensure messages include specific failure details and artifact paths

## Phase 3.5: Test Validation (ONLY after T004-T006 are complete)

**Address FR-005 - consistent validation across environments**

- [x] T014 Verify exit code fix with failing scenario: temporarily break Supabase connection in development build, run Maestro integration tests, and confirm CI reports failure correctly
- [x] T015 Verify exit code fix with passing scenario: run Maestro integration tests with valid configuration and confirm CI reports success correctly
- [x] T016 [P] Test development build with local Supabase emulator configuration
- [x] T017 Test production build with EAS environment variables (requires T007 completion)

## Phase 3.6: Edge Case Validation ⚠️ ADDRESS UPDATED EDGE CASES

**NEW: Address specific edge cases from updated specification**

- [x] T018 [EDGE] Validate exit code inversion fix: run integration tests and verify GitHub Actions outputs show `success=true/false` (boolean) rather than `success=0/1` (numeric exit codes)
- [x] T019 [EDGE] Validate fail-fast behavior for partial test suite failures with complete debug artifact collection
- [x] T020 [EDGE] Test Android emulator networking edge case: verify 10.0.2.2 vs 127.0.0.1 configuration handling

## Dependencies

- **CRITICAL PATH**: T004-T006 must complete before ANY testing (T014-T020)
- **EAS DEPENDENCY**: T007 (user action) must complete before T017
- **ERROR HANDLING**: T011-T013 can run in parallel with other phases after setup
- **VALIDATION ORDER**: T014-T015 before T016-T017 before T018-T020
- **EDGE CASES**: T018-T020 require all previous phases complete

## Parallel Example

```bash
# Setup phase (can run together):
Task: "Verify devbox environment and Supabase local development"
Task: "Validate current EAS environment variable configuration"
Task: "Confirm Android emulator networking"

# Error handling phase (can run together after setup):
Task: "Implement standardized error message format in scripts/integration_test_android.sh"
Task: "Add debug artifact location reporting in .github/actions/maestro-test/action.yml"
Task: "Create error message validation test"

# Environment validation (can run together after critical fix):
Task: "Validate environment variable loading in lib/config/supabase-env.ts"
Task: "Confirm app.config.js environment handling"
Task: "Test development build with emulator config"
```

## Critical Implementation Notes

### T004 - Exit Code Fix Details (Addresses FR-001, FR-002)
**File**: `.github/actions/maestro-test/action.yml`
**Current (BROKEN)**:
```yaml
echo "success=$TEST_EXIT_CODE" >> $GITHUB_OUTPUT
```
**Required (FIXED)**:
```yaml
echo "success=$([ $TEST_EXIT_CODE -eq 0 ] && echo "true" || echo "false")" >> $GITHUB_OUTPUT
echo "exit-code=$TEST_EXIT_CODE" >> $GITHUB_OUTPUT
```

### T011 - Error Message Format (Addresses FR-003)
**File**: `scripts/integration_test_android.sh`
**Required Format**:
```bash
echo "ERROR: Test '$test_name' failed with exit code $exit_code"
echo "Debug artifacts available at: $artifacts_path"
echo "Failure details: $failure_reason"
```

### T007 - User Environment Variable Actions (Addresses FR-004, FR-006)
This task requires the user to manually execute EAS CLI commands. Verify completion by running:
```bash
eas env:list --profile production
```

## Success Criteria Checklist

- [x] **Exit Code Fix (FR-001, FR-002)**: Failed tests properly report `success=false` and CI crashes on failures
- [x] **Error Messages (FR-003)**: Clear error messages include failure details and debug artifact locations
- [x] **Environment Variables (FR-004, FR-006)**: Production builds use correct EAS configuration, consistent validation across environments
- [x] **Integration Testing (FR-005)**: Tests work consistently across test and production environments
- [x] **Edge Cases**: All 5 specific edge case scenarios from spec are addressed and tested

## Rollback Plan

If issues are detected during implementation:

1. **T004-T006 Issues**: Revert GitHub Action changes
   ```bash
   git checkout HEAD~1 .github/actions/maestro-test/action.yml
   ```

2. **T007 Issues**: Restore previous EAS environment variables
   ```bash
   # User must manually restore previous values using eas env:set
   ```

3. **Testing Issues**: Use quickstart.md troubleshooting section for debugging

## Task Generation Rules Applied

1. **From Updated Spec**: 6 consolidated functional requirements → focused task groups
2. **From Contracts**: GitHub Actions, environment config → validation tasks
3. **From Data Model**: Environment configuration, test execution entities → setup and validation tasks
4. **From Edge Cases**: 5 specific edge cases → dedicated edge case validation tasks (T018-T020)
5. **From FR-003**: New error message requirements → dedicated error handling tasks (T011-T013)
6. **Ordering**: Setup → Critical Fix → Environment → Error Handling → Testing → Edge Cases