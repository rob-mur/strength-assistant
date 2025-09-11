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

## Path Conventions & Implementation References

### Existing File Structure (Check before creating new files)
```
lib/
├── models/
│   ├── ExerciseRecord.ts          ✅ IMPLEMENTED (lines 1-245)
│   ├── UserAccount.ts             ✅ IMPLEMENTED (lines 1-341) 
│   ├── SyncStateRecord.ts         ✅ IMPLEMENTED (lines 1-367)
│   └── Exercise.ts                (legacy - reference only)
├── data/
│   ├── supabase/
│   │   ├── SupabaseStorage.ts     🔧 PARTIAL (lines 33-392, needs import fixes)
│   │   └── supabase.ts            ✅ CLIENT SETUP
│   ├── firebase/                  ✅ EXISTING (reference for patterns)
│   └── sync/                      (may be useful for migration)
├── config/
│   └── supabase-env.ts            ✅ IMPLEMENTED (lines 1-90)
├── hooks/                         ✅ EXISTING (update these)
├── components/                    ✅ EXISTING (add sync status here)
└── repo/                          ✅ EXISTING (update ExerciseRepo)

app/
└── (tabs)/exercises/              ✅ EXISTING (update for real-time sync)

__tests__/
├── contracts/                     🔧 PARTIAL (contract tests exist, may fail)
└── integration/                   🔧 PARTIAL (integration tests exist, may fail)
```

### Key Implementation Guidance

**When working on models (T010-T012)**:
- Import fixes needed: Remove non-existent imports from contract files
- Add proper exports for functions used by storage backends
- Ensure UUID generation works (currently custom implementation)

**When working on SupabaseStorage (T013)**:
- Fix import path: `../../specs/001-we-are-actually/contracts/storage-interface` → use relative contract
- Complete missing method implementations (check contract interface)
- Fix UserAccount and SyncState imports

**When creating new Legend State files (T016-T017)**:
- Reference: `specs/001-we-are-actually/contracts/legend-state-config.ts:1-109`
- Create in `lib/data/legend-state/` directory (new)
- Follow observable pattern from Legend State documentation

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

### Data Models (Parallel - Different Files)
**Reference**: Models already exist but need import fixes
- [ ] T010 [P] Fix import paths in ExerciseRecord model `lib/models/ExerciseRecord.ts:1-245` (already implemented)
- [ ] T011 [P] Fix import paths in UserAccount model `lib/models/UserAccount.ts:1-341` (already implemented)  
- [ ] T012 [P] Fix import paths in SyncStateRecord model `lib/models/SyncStateRecord.ts:1-367` (already implemented)

### Storage Backend Implementation
**Reference**: SupabaseStorage partially implemented at `lib/data/supabase/SupabaseStorage.ts:33-392`
- [ ] T013 Fix import errors and complete SupabaseStorage missing methods in `lib/data/supabase/SupabaseStorage.ts`
- [ ] T014 Create Firebase storage adapter implementing same interface in `lib/data/firebase/FirebaseStorage.ts`
- [ ] T015 Create StorageManager with feature flag switching in `lib/data/StorageManager.ts`

### Legend State Integration (New Files)
**Reference**: No existing implementations - create from contracts at `specs/001-we-are-actually/contracts/legend-state-config.ts`
- [ ] T016 Create Legend State store configuration in `lib/data/legend-state/ExerciseStore.ts`
- [ ] T017 Create Legend State actions with backend integration in `lib/data/legend-state/ExerciseActions.ts`

## Phase 3.4: Feature Flag Integration
**Reference**: Use existing ExerciseRepo pattern from codebase
- [ ] T018 Create unified data layer entry point in `lib/data/index.ts` (exports StorageManager, feature flag logic)
- [ ] T019 Update ExerciseRepo to use StorageManager with USE_SUPABASE_DATA flag in `lib/repo/ExerciseRepo.ts`
- [ ] T020 Implement data consistency validation logic in `lib/migration/ConsistencyValidator.ts`
- [ ] T021 Create migration utilities for Firebase to Supabase in `lib/migration/DataMigrator.ts`

## Phase 3.5: UI Integration & Real-time Updates
**Reference**: Follow existing hook patterns from `lib/hooks/` and screen patterns from `app/`
- [ ] T022 [P] Update useExercises hook to use new storage backend in `lib/hooks/useExercises.ts` (existing file)
- [ ] T023 [P] Update useAddExercise hook with Legend State integration in `lib/hooks/useAddExercise.ts` (existing file)
- [ ] T024 [P] Create sync status indicator component in `lib/components/SyncStatusIcon.tsx`
- [ ] T025 Update exercise list screen with real-time sync updates in `app/(tabs)/exercises/index.tsx` (existing file)
- [ ] T026 Update add exercise screen with optimistic updates in `app/(tabs)/exercises/add.tsx` (existing file)

## Phase 3.6: Authentication Integration  
**Reference**: Follow existing Firebase auth patterns from `lib/data/firebase/auth.*.ts`
- [ ] T027 Implement Supabase auth provider component in `lib/components/SupabaseAuthProvider.tsx`
- [ ] T028 Create feature-flag controlled auth context in `lib/context/AuthContext.tsx` 
- [ ] T029 [P] Update authentication screens for dual auth support in `app/(auth)/` (if exists)
- [ ] T030 [P] Implement anonymous to authenticated user migration in `lib/auth/UserMigration.ts`

## Phase 3.7: Testing & Validation
**Reference**: Follow existing test patterns from `__tests__/` directory
- [ ] T031 [P] Add unit tests for ExerciseRecord validation in `__tests__/models/ExerciseRecord.test.ts`
- [ ] T032 [P] Add unit tests for Legend State store actions in `__tests__/data/legend-state/ExerciseStore.test.ts`
- [ ] T033 [P] Add unit tests for sync status logic in `__tests__/data/legend-state/SyncState.test.ts`
- [ ] T034 E2E test for offline-first functionality using Maestro in `__tests__/e2e/offline-first.test.js`
- [ ] T035 E2E test for cross-device sync using Maestro in `__tests__/e2e/cross-device-sync.test.js`
- [ ] T036 Performance test for local operations (<50ms) in `__tests__/performance/local-operations.test.ts`

## Phase 3.8: Migration & Cleanup
**Reference**: See existing Firebase patterns and migration logic from Phase 3.4
- [ ] T037 Create migration script for existing Firebase users in `scripts/migrate-firebase-users.ts`
- [ ] T038 [P] Update documentation with new authentication flow in `docs/authentication.md` (if docs/ exists)
- [ ] T039 [P] Update CLAUDE.md with Legend State and migration context at project root
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