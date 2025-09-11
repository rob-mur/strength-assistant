# Tasks: Local First Storage with Backup

**Input**: Design documents from `/home/rob/Documents/Github/strength-assistant/specs/001-we-are-actually/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## 🚨 CRITICAL SUCCESS CRITERIA 🚨

**BEFORE ANY TASK IS CONSIDERED COMPLETE:**
- **`devbox run test` MUST pass successfully**
- This includes: Package lock validation, TypeScript checks, ESLint, Format checking, Jest tests
- Integration tests can run in CI (due to speed), but all unit tests must pass locally
- No task is complete until all code quality checks pass

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions
- All tasks must result in `devbox run test` passing

## Path Conventions
- **React Native**: `lib/` for core logic, `app/` for screens, `__tests__/` for tests
- Existing structure: `lib/data/`, `lib/models/`, `lib/hooks/`, `lib/components/`

## Phase 3.1: Setup & Dependencies
- [ ] T001 Install Legend State dependencies: `@legendapp/state` and sync plugins
- [ ] T002 [P] Configure Supabase auth environment variables validation in `lib/config/supabase-env.ts`
- [ ] T003 [P] Set up Legend State configuration for Supabase sync in `lib/state/legend-config.ts`

## Phase 3.2: Contract Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T004 [P] Contract test for StorageBackend interface in `__tests__/contracts/storage-backend-contract.test.ts`
- [ ] T005 [P] Contract test for Supabase auth methods in `__tests__/contracts/supabase-auth-contract.test.ts`
- [ ] T006 [P] Contract test for Exercise CRUD operations in `__tests__/contracts/exercise-crud-contract.test.ts`
- [ ] T007 [P] Integration test for anonymous user local-first scenario in `__tests__/integration/anonymous-local-first.test.ts`
- [ ] T008 [P] Integration test for authenticated cross-device sync in `__tests__/integration/auth-cross-device-sync.test.ts`
- [ ] T009 [P] Integration test for feature flag migration flow in `__tests__/integration/feature-flag-migration.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T010 [P] Implement ExerciseRecord model with validation in `lib/models/ExerciseRecord.ts`
- [ ] T011 [P] Implement UserAccount model with auth types in `lib/models/UserAccount.ts`
- [ ] T012 [P] Implement SyncStateRecord model for sync tracking in `lib/models/SyncStateRecord.ts`
- [ ] T013 Implement Supabase StorageBackend in `lib/data/supabase/SupabaseStorage.ts`
- [ ] T014 Implement Supabase authentication service in `lib/data/supabase/SupabaseAuth.ts`
- [ ] T015 Create Legend State store configuration in `lib/state/ExerciseStore.ts`
- [ ] T016 Implement Legend State sync engine integration in `lib/state/SupabaseSync.ts`

## Phase 3.4: Feature Flag Integration
- [ ] T017 Implement StorageManager with feature flag switching in `lib/data/StorageManager.ts`
- [ ] T018 Update ExerciseRepo to use StorageManager with USE_SUPABASE_DATA flag in `lib/repo/ExerciseRepo.ts`
- [ ] T019 Implement data consistency validation logic in `lib/migration/ConsistencyValidator.ts`
- [ ] T020 Create migration utilities for Firebase to Supabase in `lib/migration/DataMigrator.ts`

## Phase 3.5: UI Integration & Real-time Updates
- [ ] T021 [P] Update useExercises hook to use new storage backend in `lib/hooks/useExercises.ts`
- [ ] T022 [P] Update useAddExercise hook with Legend State integration in `lib/hooks/useAddExercise.ts`
- [ ] T023 [P] Create sync status indicator component in `lib/components/SyncStatusIcon.tsx`
- [ ] T024 Update exercise list screen with real-time sync updates in `app/(tabs)/exercises/index.tsx`
- [ ] T025 Update add exercise screen with optimistic updates in `app/(tabs)/exercises/add.tsx`

## Phase 3.6: Authentication Integration
- [ ] T026 Implement Supabase auth provider component in `lib/components/SupabaseAuthProvider.tsx`
- [ ] T027 Create feature-flag controlled auth context in `lib/context/AuthContext.tsx`
- [ ] T028 [P] Update authentication screens for dual auth support in `app/(auth)/`
- [ ] T029 [P] Implement anonymous to authenticated user migration in `lib/auth/UserMigration.ts`

## Phase 3.7: Testing & Validation
- [ ] T030 [P] Add unit tests for ExerciseRecord validation in `__tests__/models/ExerciseRecord.test.ts`
- [ ] T031 [P] Add unit tests for Legend State store actions in `__tests__/state/ExerciseStore.test.ts`
- [ ] T032 [P] Add unit tests for sync status logic in `__tests__/state/SyncState.test.ts`
- [ ] T033 E2E test for offline-first functionality using Maestro in `__tests__/e2e/offline-first.test.js`
- [ ] T034 E2E test for cross-device sync using Maestro in `__tests__/e2e/cross-device-sync.test.js`
- [ ] T035 Performance test for local operations (<50ms) in `__tests__/performance/local-operations.test.ts`

## Phase 3.8: Migration & Cleanup
- [ ] T036 Create migration script for existing Firebase users in `scripts/migrate-firebase-users.ts`
- [ ] T037 Implement data validation checks for migration accuracy in `lib/migration/MigrationValidator.ts`
- [ ] T038 [P] Update documentation with new authentication flow in `docs/authentication.md`
- [ ] T039 [P] Update CLAUDE.md with Legend State and migration context
- [ ] T040 **🚨 MANDATORY FINAL VALIDATION: Run `devbox run test` and fix ALL issues**

## Dependencies
- Setup (T001-T003) before all other phases
- Contract tests (T004-T009) before core implementation (T010-T016)
- T010-T012 (models) before T013-T016 (services)
- T013-T016 before T017-T020 (feature flag integration)
- T017-T020 before T021-T025 (UI integration)
- T013-T014 before T026-T029 (auth integration)
- Core implementation before testing (T030-T035)
- Everything before migration & cleanup (T036-T040)

## Parallel Execution Examples

### Contract Tests (After Setup)
```bash
# Launch T004-T009 together:
devbox run test -- __tests__/contracts/storage-backend-contract.test.ts
devbox run test -- __tests__/contracts/supabase-auth-contract.test.ts  
devbox run test -- __tests__/contracts/exercise-crud-contract.test.ts
devbox run test -- __tests__/integration/anonymous-local-first.test.ts
devbox run test -- __tests__/integration/auth-cross-device-sync.test.ts
devbox run test -- __tests__/integration/feature-flag-migration.test.ts
```

### Model Creation (After Contract Tests Fail)
```bash
# Launch T010-T012 together:
Task: "Implement ExerciseRecord model with validation in lib/models/ExerciseRecord.ts"
Task: "Implement UserAccount model with auth types in lib/models/UserAccount.ts"
Task: "Implement SyncStateRecord model for sync tracking in lib/models/SyncStateRecord.ts"
```

### UI Hook Updates (After Storage Backend Complete)
```bash
# Launch T021-T023 together:
Task: "Update useExercises hook to use new storage backend in lib/hooks/useExercises.ts"
Task: "Update useAddExercise hook with Legend State integration in lib/hooks/useAddExercise.ts"
Task: "Create sync status indicator component in lib/components/SyncStatusIcon.tsx"
```

## Feature Flag Testing Strategy
**USE_SUPABASE_DATA Environment Variable Control**:
1. Test with `USE_SUPABASE_DATA=false` (Firebase backend)
2. Test with `USE_SUPABASE_DATA=true` (Supabase backend)
3. Validate identical behavior across both modes
4. Test migration between modes

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Use `devbox run` commands for consistency
- Feature flag must work for both true/false states
- Commit after each task
- All tests must use Devbox environment for reproducibility

## Quality Assurance Notes

### Test-First Development Rules
1. **RED Phase**: Each test MUST fail when first written (no implementation exists)
2. **GREEN Phase**: Write minimal code to make test pass  
3. **REFACTOR Phase**: Improve code while keeping tests green
4. **Validation**: Run `devbox run test` after each task completion

### Task Completion Requirements
**ONLY mark a task as completed when:**
- All tests pass in `devbox run test`
- No TypeScript compilation errors
- No ESLint violations
- Consistent formatting with Prettier
- Implementation fully satisfies contract requirements

**Never mark complete if:**
- Tests are failing
- Implementation is partial
- Code quality checks fail
- Dependencies are unresolved

### Common Failure Patterns to Avoid
- ❌ Writing implementation before tests
- ❌ Declaring task complete without running `devbox run test`
- ❌ Accumulating TypeScript or ESLint errors
- ❌ Modifying same file in parallel tasks (causes conflicts)
- ❌ Skipping the RED phase in TDD cycle

## Final Deliverable Validation

The feature is complete ONLY when:
1. All 40 tasks are marked complete
2. `devbox run test` passes without any failures
3. All three user scenarios from quickstart.md execute successfully
4. Feature flag switching works for both `USE_SUPABASE_DATA=true` and `USE_SUPABASE_DATA=false`
5. No outstanding TypeScript, ESLint, or formatting issues

## Validation Checklist
*GATE: Checked before considering tasks complete*

- [x] All contracts have corresponding tests (T004-T006)
- [x] All entities have model tasks (T010-T012)
- [x] All tests come before implementation (T004-T009 before T010+)
- [x] Parallel tasks truly independent (different file paths)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Feature flag integration properly sequenced
- [x] Migration strategy tasks included
- [x] Performance and E2E testing included
- [x] Mandatory final validation task included (T040)