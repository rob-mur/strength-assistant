# Tasks: Complete Firebase Removal

**Input**: Design documents from `/home/rob/Documents/Github/strength-assistant/specs/002-remove-firebase-now/`
**Prerequisites**: plan.md (✅), research.md (✅), data-model.md (✅), contracts/ (✅)

## Execution Flow (main)

```
1. Load plan.md from feature directory ✅
   → Tech stack: React Native/Expo, TypeScript, Supabase
   → Structure: Mobile app (app/ + lib/)
2. Load optional design documents: ✅
   → data-model.md: Firebase entities to remove, Supabase to preserve
   → contracts/: Removal and validation contracts
   → research.md: 4 packages, 8 source files, test infrastructure
3. Generate tasks by category: ✅
   → Pre-validation: Ensure Supabase working
   → Package removal: Remove Firebase npm dependencies
   → Source cleanup: Remove Firebase implementation files
   → Test updates: Remove Firebase tests, update remaining
   → Configuration: Remove Firebase config and CI/CD
   → Final validation: Complete test suite execution
4. Apply task rules: ✅
   → Validation tasks = can be parallel [P]
   → Package removals = sequential (same package.json)
   → File removals = can be parallel [P] when different files
5. Number tasks sequentially (T001, T002...) ✅
6. Generate dependency graph ✅
7. Create parallel execution examples ✅
8. Validate task completeness: ✅
   → All Firebase components have removal tasks
   → All removal operations have validation
   → TDD approach with test failures first
9. Return: SUCCESS (tasks ready for execution) ✅
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

Mobile React Native/Expo app structure:

- **App**: `app/` directory for screens and routes
- **Business Logic**: `lib/` directory for services, data, hooks
- **Tests**: `__tests__/` directory for test files
- **Config**: Root level configuration files

## Phase 3.1: Pre-Removal Validation

- [ ] **T001** [P] Verify Supabase functionality with `export USE_SUPABASE_DATA=true && npm test`
- [ ] **T002** [P] Run baseline test suite with `devbox run test` to ensure current functionality
- [ ] **T003** [P] Run Maestro integration tests to validate current app functionality

## Phase 3.2: Package Dependency Removal ⚠️ MUST COMPLETE SEQUENTIALLY

**CRITICAL: Remove packages one by one and validate build after each removal**

- [ ] **T004** Remove `@react-native-firebase/app` package from package.json
- [ ] **T005** Validate build succeeds with `npm run lint && npm run typecheck`
- [ ] **T006** Remove `@react-native-firebase/auth` package from package.json
- [ ] **T007** Validate build succeeds with `npm run lint && npm run typecheck`
- [ ] **T008** Remove `@react-native-firebase/firestore` package from package.json
- [ ] **T009** Validate build succeeds with `npm run lint && npm run typecheck`
- [ ] **T010** Remove `firebase` package from package.json
- [ ] **T011** Validate no Firebase packages remain with `grep -i firebase package.json`

## Phase 3.3: Source Code Removal (ONLY after packages removed)

- [ ] **T012** [P] Remove entire Firebase source directory `lib/data/firebase/`
- [ ] **T013** [P] Remove Firebase repository implementation `lib/repo/FirebaseExerciseRepo.ts`
- [ ] **T014** Update `lib/data/index.ts` to remove Firebase exports and imports
- [ ] **T015** Update `lib/data/StorageManager.ts` to remove Firebase storage references
- [ ] **T016** Update `lib/repo/ExerciseRepoFactory.ts` to remove Firebase option and always return Supabase
- [ ] **T017** Update `app/error.ts` to remove Firebase logger and use Supabase logger
- [ ] **T018** Update `lib/hooks/useAuth.ts` to remove Firebase auth imports
- [ ] **T019** Update `lib/hooks/useExercises.ts` to remove Firebase logger references
- [ ] **T020** Update `lib/hooks/useAppInit.ts` to remove Firebase logger references
- [ ] **T021** Update `lib/data/sync/index.ts` to remove Firebase initializer imports
- [ ] **T022** Update `lib/repo/utils/LoggingUtils.ts` to remove Firebase logger usage

## Phase 3.4: Test Infrastructure Cleanup

- [ ] **T023** [P] Remove Firebase mock directory `__mocks__/@react-native-firebase/`
- [ ] **T024** [P] Remove Firebase mock factory `__tests__/test-utils/FirebaseMockFactory.ts`
- [ ] **T025** [P] Remove Firebase-specific tests `__tests__/repo/FirebaseExerciseRepo-new-methods.test.ts`
- [ ] **T026** Update `jest.setup.js` to remove Firebase mock implementations (lines 4-32)
- [ ] **T027** [P] Validate remaining test suite passes with `npm test`

## Phase 3.5: Configuration and Environment Cleanup

- [ ] **T028** [P] Remove Firebase configuration file `firebase.json`
- [ ] **T029** [P] Remove TypeScript Firebase path mapping from `tsconfig.json`
- [ ] **T030** Update DevBox configurations to remove `firebase-tools` from all `devbox.json` files
- [ ] **T031** [P] Remove Firebase environment variables from `.env` files and CI/CD workflows
- [ ] **T032** [P] Update GitHub Actions workflows to remove Firebase configuration inputs
- [ ] **T033** [P] Update build scripts to remove Firebase emulator startup commands

## Phase 3.6: Factory Pattern Simplification

- [ ] **T034** Simplify `lib/repo/ExerciseRepoFactory.ts` to always return `SupabaseExerciseRepo`
- [ ] **T035** Remove `USE_SUPABASE_DATA` environment variable logic from factory
- [ ] **T036** Update factory tests to verify Supabase-only operation
- [ ] **T037** [P] Validate factory tests pass with `npm test -- --testNamePattern="ExerciseRepoFactory"`

## Phase 3.7: Final Validation and Testing

- [ ] **T038** [P] Search for remaining Firebase references with `grep -r -i firebase . --exclude-dir=node_modules --exclude-dir=.git`
- [ ] **T039** [P] Validate zero Firebase references found in source code
- [ ] **T040** Run complete unit test suite with `npm test`
- [ ] **T041** Run devbox test suite with `devbox run test` (USER REQUIREMENT)
- [ ] **T042** Run Maestro integration tests with `devbox run maestro-test` (USER REQUIREMENT)
- [ ] **T043** [P] Validate application builds successfully with `npm run build`
- [ ] **T044** [P] Validate TypeScript compilation with `npm run typecheck`
- [ ] **T045** [P] Validate ESLint passes with `npm run lint`

## Dependencies

**Sequential Dependencies:**

- T001-T003 (Pre-validation) before T004 (Package removal)
- T004-T011 (Package removal) before T012 (Source removal)
- T012-T022 (Source removal) before T023 (Test cleanup)
- T023-T027 (Test cleanup) before T028 (Config cleanup)
- T028-T033 (Config cleanup) before T034 (Factory simplification)
- T034-T037 (Factory) before T038 (Final validation)

**Within-Phase Dependencies:**

- Package removal (T004-T011): Must be sequential
- Source updates (T014-T022): Must complete before test validation
- Final validation (T038-T045): T038-T039 before T040-T045

## Parallel Execution Examples

### Phase 3.1: Pre-validation (can run together)

```bash
# Launch T001-T003 together:
Task: "Verify Supabase functionality with export USE_SUPABASE_DATA=true && npm test"
Task: "Run baseline test suite with devbox run test"
Task: "Run Maestro integration tests"
```

### Phase 3.3: Source file removal (can run together for different files)

```bash
# Launch T012-T013 together:
Task: "Remove entire Firebase source directory lib/data/firebase/"
Task: "Remove Firebase repository implementation lib/repo/FirebaseExerciseRepo.ts"
```

### Phase 3.4: Test cleanup (different files, can run together)

```bash
# Launch T023-T025 together:
Task: "Remove Firebase mock directory __mocks__/@react-native-firebase/"
Task: "Remove Firebase mock factory __tests__/test-utils/FirebaseMockFactory.ts"
Task: "Remove Firebase-specific tests __tests__/repo/FirebaseExerciseRepo-new-methods.test.ts"
```

## Notes

- **[P] tasks** = different files, no dependencies
- **User Testing Requirements**: T041 (devbox run test) and T042 (maestro tests) are critical success criteria
- **TDD Approach**: Verify test failures during removal, then fix to pass
- **Commit Strategy**: Commit after each major phase for easy rollback
- **Rollback Plan**: Git reset available if any validation fails

## Task Generation Rules Applied

1. **From Contracts**: Each removal operation → validation task
2. **From Data Model**: Each Firebase entity → removal task [P] when different files
3. **From Research**: 4 packages → 4 removal tasks + validation
4. **From Quickstart**: 10 steps → corresponding tasks with validation

5. **Ordering**: Pre-validation → Packages → Source → Tests → Config → Factory → Final validation

## Validation Checklist

_GATE: Must verify before marking complete_

- [x] All Firebase components have corresponding removal tasks
- [x] All removal operations have validation tasks
- [x] Package removals come before source code changes
- [x] Parallel tasks are truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] User requirements integrated (devbox run test + maestro tests)
- [x] TDD approach with test validation at each step

## Success Criteria

**Complete Removal:**

- ✅ Zero Firebase packages in package.json
- ✅ Zero Firebase source files or directories
- ✅ Zero Firebase imports or references
- ✅ Zero Firebase configuration files

**Functional Preservation:**

- ✅ All unit tests pass (`npm test`)
- ✅ All devbox tests pass (`devbox run test`)
- ✅ All Maestro tests pass (`devbox run maestro-test`)
- ✅ Application builds and runs successfully
- ✅ Supabase-only operation confirmed
