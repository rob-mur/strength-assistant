# Tasks: Local First Storage with Backup

**Branch**: `001-we-are-actually` | **Generated**: 2025-09-12 | **Source**: [plan.md](./plan.md)
**Input**: Design documents from `/home/rob/Documents/Github/strength-assistant/specs/001-we-are-actually/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

## Tech Stack Summary
- **Language**: TypeScript 5.8.3, React Native 0.79.5, Expo 53.0.22
- **Storage**: Firebase (current) → Supabase PostgreSQL + Legend State (local-first)
- **Testing**: Jest 29.7.0, React Native Testing Library, Constitutional enforcement
- **Architecture**: Mobile app with dual backend support and offline-first patterns
- **Critical**: Sequential execution only (memory management), binary exit code validation

## 🚨 CONSTITUTIONAL PRIORITY: Amendment v2.5.0 Compliance
**MANDATORY**: All test validation must use exit code verification, not log parsing

## Format: `[ID] Description` (Sequential Execution Only)
- **Sequential processing**: All tasks run one at a time for memory safety
- **Exit code validation**: Always verify `devbox run test` returns 0 or non-zero
- Include exact file paths in descriptions

## Phase 3.1: Constitutional Compliance & Test Infrastructure

### Setup Tasks
- [ ] **T001** Update scripts/test.sh to properly propagate binary exit codes for constitutional compliance
- [ ] **T002** Create lib/test-utils/ directory structure for missing test infrastructure components
- [ ] **T003** Configure Jest for memory-optimized sequential test execution in jest.config.js

### Performance Optimization (Critical <60 second target)
- [ ] **T003a** Optimize Jest for speed: disable sourcemaps, reduce transformIgnorePatterns, cache optimization
- [ ] **T003b** Implement smart test filtering: skip slow component tests for basic validation runs
- [ ] **T003c** Optimize package.json scripts: parallel linting, faster TypeScript checks, cache npm ci
- [ ] **T003d** Create fast-test mode: core validation only (TS + lint + critical tests < 30 seconds)

### Test Infrastructure Implementation (TDD) ⚠️ MUST COMPLETE BEFORE IMPLEMENTATION
**CRITICAL: These components MUST exist before tests can run**

- [ ] **T004** Create TestDevice class implementation in lib/test-utils/TestDevice.ts
- [ ] **T005** Create TestApp utility class in lib/test-utils/TestApp.ts
- [ ] **T006** Create MockFactories collection in lib/test-utils/mocks/MockFactories.ts
- [ ] **T007** Create TestDataBuilders in lib/test-utils/builders/TestDataBuilders.ts
- [ ] **T008** Create Firebase service mocks in lib/test-utils/mocks/FirebaseMocks.ts
- [ ] **T009** Create Supabase service mocks in lib/test-utils/mocks/SupabaseMocks.ts

## Phase 3.2: Contract Tests (ONLY after infrastructure exists)

- [ ] **T010** Contract test for TestDevice interface in __tests__/contracts/test-infrastructure.test.ts
- [ ] **T011** Contract test for storage backend interface in __tests__/contracts/storage-interface.test.ts
- [ ] **T012** Contract test for constitutional amendment in __tests__/contracts/constitutional-amendment.test.ts
- [ ] **T013** Contract test for TypeScript validation in __tests__/contracts/typescript-validation.test.ts
- [ ] **T014** Contract test for Jest validation in __tests__/contracts/jest-validation.test.ts
- [ ] **T015** Contract test for test repair interface in __tests__/contracts/test-repair.test.ts
- [ ] **T016** Contract test for Legend State config in __tests__/contracts/legend-state-config.test.ts

## Phase 3.3: Integration Tests (ONLY after contracts exist)

- [ ] **T017** Integration test for anonymous local-first storage in __tests__/integration/anonymous-local-first.test.ts
- [ ] **T018** Integration test for authenticated cross-device sync in __tests__/integration/auth-cross-device-sync.test.ts
- [ ] **T019** Integration test for offline-to-online sync in __tests__/integration/offline-to-online-sync.test.ts
- [ ] **T020** Integration test for Firebase to Supabase migration in __tests__/integration/firebase-supabase-migration.test.ts

## Phase 3.4: Constitutional Validation Gate
**MANDATORY GATE: Must pass before ANY feature implementation**

- [ ] **T021** Validate constitutional compliance with exit code verification: `devbox run test; echo "Exit code: $?"`

## Phase 3.5: Core Implementation (ONLY after tests are failing)

### Models and Data Layer
- [ ] **T022** Enhance Exercise model with sync capabilities in lib/models/Exercise.ts
- [ ] **T023** Create SyncOperation model in lib/models/SyncOperation.ts
- [ ] **T024** Create UserAccount model enhancements in lib/models/UserAccount.ts

### Services and Storage
- [ ] **T025** Install and configure Legend State in package.json and lib/data/legend-state/config.ts
- [ ] **T026** Implement SupabaseStorage backend in lib/data/supabase/SupabaseStorage.ts
- [ ] **T027** Implement SyncManager service in lib/services/SyncManager.ts
- [ ] **T028** Update ExerciseRepo with dual backend support in lib/repo/ExerciseRepo.ts

### Feature Flag System
- [ ] **T029** Implement FeatureFlagService in lib/services/FeatureFlagService.ts
- [ ] **T030** Create StorageManager with backend delegation in lib/data/StorageManager.ts

## Phase 3.6: Constitutional Framework Implementation

- [ ] **T031** Implement ConstitutionalAmendmentManager in lib/constitution/ConstitutionalAmendmentManager.ts
- [ ] **T032** Implement TypeScriptValidator in lib/typescript/TypeScriptValidator.ts
- [ ] **T033** Update pre-commit hooks for exit code validation in .husky/pre-commit
- [ ] **T034** Create TestRepairManager for systematic test fixing in lib/test-utils/TestRepairManager.ts

## Phase 3.7: UI Integration and Sync Status

- [ ] **T035** Create SyncStatusIcon component in lib/components/SyncStatusIcon.tsx
- [ ] **T036** Update exercise list UI with sync indicators in app/(tabs)/exercises/index.tsx
- [ ] **T037** Update useExercises hook for local-first operations in lib/hooks/useExercises.ts

## Phase 3.8: Migration and Performance

- [ ] **T038** Implement MigrationService for Firebase to Supabase data transfer in lib/services/MigrationService.ts
- [ ] **T039** Add performance monitoring in lib/utils/PerformanceMonitor.ts
- [ ] **T040** Implement memory management utilities in lib/test-utils/MemoryMonitor.ts

## Phase 3.9: Final Validation and Polish

- [ ] **T041** Run comprehensive quickstart scenario validation from quickstart.md
- [ ] **T042** Final constitutional compliance validation with exit code verification: `devbox run test; echo "Exit code: $?"`
- [ ] **T043** Performance validation: verify <50ms local operations, <2s sync operations
- [ ] **T044** Update project documentation with constitutional requirements
- [ ] **T045** Create regression prevention monitoring script in scripts/monitor-test-regressions.sh

## Dependencies (Sequential Chain)
```
Setup: T001 → T002 → T003
Infrastructure: T003 → T004 → T005 → T006 → T007 → T008 → T009
Contracts: T009 → T010 → T011 → T012 → T013 → T014 → T015 → T016
Integration: T016 → T017 → T018 → T019 → T020
Gate: T020 → T021 (MANDATORY PASS)
Models: T021 → T022 → T023 → T024
Services: T024 → T025 → T026 → T027 → T028
Features: T028 → T029 → T030
Constitution: T030 → T031 → T032 → T033 → T034
UI: T034 → T035 → T036 → T037
Migration: T037 → T038 → T039 → T040
Validation: T040 → T041 → T042 → T043 → T044 → T045
```

## Sequential Execution Example
```bash
# NEVER parallel - memory safety first
# Task T001: Fix test script exit codes
Task: "Update scripts/test.sh to properly propagate binary exit codes"
# Wait for completion, verify success
echo "Exit code: $?"
# Continue to T002 only if T001 succeeded
```

## Critical Success Criteria
- [ ] `devbox run test` returns exit code 0 (verified with `echo "Exit code: $?"`)
- [ ] **`devbox run test` completes in <60 seconds** (performance requirement)
- [ ] All 80+ tests pass consistently without memory issues
- [ ] Constitutional Amendment v2.5.0 fully implemented and enforced
- [ ] Local-first operations respond in <50ms
- [ ] Seamless Firebase to Supabase migration capability
- [ ] Zero test regressions in main branch

## Constitutional Amendment v2.5.0 Compliance
**Binary Exit Code Enforcement**:
- **T001, T021, T042**: Implement and validate exit code checking
- **ALL test validation**: Must check exit codes, never parse logs
- **Constitutional gate**: T021 blocks all feature work until exit code 0
- **Final validation**: T042 ensures complete compliance

## Memory Management Protocol
- **Sequential execution only**: No parallel tasks to prevent memory exhaustion
- **Memory monitoring**: Check usage before/after each task
- **Emergency protocol**: Stop if approaching 32GB system limit
- **Garbage collection**: Force GC between memory-intensive tasks

## Task Generation Rules Applied
1. **From Contracts**: 7 contract files → 7 contract test tasks (T010-T016)
2. **From Data Model**: 3 entities → 3 model tasks + services (T022-T024, T025-T028)
3. **From Research**: Memory/constitution decisions → infrastructure tasks (T001-T009)
4. **From Quickstart**: User scenarios → integration tests (T017-T020)

## Validation Checklist
- [x] All contracts have corresponding tests (T010-T016)
- [x] All entities have model implementation tasks (T022-T024)
- [x] All tests come before implementation (Phase 3.2-3.3 → 3.5+)
- [x] Sequential execution enforced (no parallel markers)
- [x] Exit code validation mandatory (T001, T021, T042)
- [x] Constitutional compliance prioritized (Amendment v2.5.0)
- [x] Memory constraints addressed throughout
- [x] Each task specifies exact file path

**TOTAL TASKS**: 45 sequential tasks
**ESTIMATED DURATION**: 25-30 hours
**CRITICAL PATH**: T001→T021 (constitutional gate)→T042 (final validation)