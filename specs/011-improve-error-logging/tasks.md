# Tasks: Improve Error Logging and Handling

**Input**: Design documents from `/specs/011-improve-error-logging/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Extracted: TypeScript/React Native/Expo, Supabase, Jest/Maestro testing
   → Structure: Mobile app using lib/ and app/ directories
2. Load design documents:
   → data-model.md: ErrorEvent, LogEntry, ErrorContext, RecoveryAction entities
   → contracts/: logging-service.ts, error-migration.ts contracts
   → research.md: 47 empty catch blocks, centralized logging decisions
3. Generate tasks by category:
   → Setup: Logging infrastructure, dependencies
   → Tests: Contract tests for all interfaces
   → Core: Logging service, error handlers, migration tools
   → Migration: Replace 47 empty catch blocks systematically
   → Integration: Global error boundaries, recovery actions
   → Polish: Performance validation, documentation
4. Apply TDD rules:
   → Contract tests before any implementation
   → Different files marked [P] for parallel execution
   → Critical storage errors migrated before lower priority
5. Generated 42 tasks sequentially numbered
6. Validated task completeness and dependencies
7. SUCCESS: Tasks ready for execution
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- File paths relative to repository root
- Mobile project structure: lib/ for business logic, __tests__/ for tests

## Phase 3.1: Setup

- [x] T001 Create logging infrastructure directory structure in lib/utils/logging/
- [x] T002 Install additional TypeScript types for error handling (if needed)
- [x] T003 [P] Verify devbox environment and baseline test execution

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests [All Parallel]
- [x] T004 [P] Contract test for LoggingService interface in __tests__/contracts/logging-service.test.ts
- [x] T005 [P] Contract test for ErrorHandler interface in __tests__/contracts/error-handler.test.ts
- [x] T006 [P] Contract test for UserErrorDisplay interface in __tests__/contracts/user-error-display.test.ts
- [x] T007 [P] Contract test for ErrorMigrationService interface in __tests__/contracts/error-migration.test.ts

### Integration Tests [All Parallel]
- [x] T008 [P] Integration test for error event logging flow in __tests__/integration/error-logging-flow.test.ts
- [x] T009 [P] Integration test for error recovery scenarios in __tests__/integration/error-recovery.test.ts
- [x] T010 [P] Integration test for user error display scenarios in __tests__/integration/user-error-display.test.ts
- [x] T011 [P] Integration test for global error boundary in __tests__/integration/global-error-boundary.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Data Models [All Parallel]
- [ ] T012 [P] ErrorEvent model with validation in lib/models/ErrorEvent.ts
- [ ] T013 [P] LogEntry model with validation in lib/models/LogEntry.ts
- [ ] T014 [P] ErrorContext model with validation in lib/models/ErrorContext.ts
- [ ] T015 [P] RecoveryAction model with validation in lib/models/RecoveryAction.ts

### Core Logging Services
- [ ] T016 DefaultLoggingService implementation in lib/utils/logging/DefaultLoggingService.ts
- [ ] T017 DefaultErrorHandler with global error boundaries in lib/utils/logging/DefaultErrorHandler.ts
- [ ] T018 DefaultUserErrorDisplay for React Native in lib/utils/logging/DefaultUserErrorDisplay.ts
- [ ] T019 LoggingServiceFactory with configuration in lib/utils/logging/LoggingServiceFactory.ts

### Migration Infrastructure
- [ ] T020 ErrorMigrationService for scanning catch blocks in lib/utils/migration/ErrorMigrationService.ts
- [ ] T021 CodeAnalysisService for context extraction in lib/utils/migration/CodeAnalysisService.ts
- [ ] T022 Migration templates for different error types in lib/utils/migration/MigrationTemplates.ts

## Phase 3.4: Empty Catch Block Migration (Priority Order)

### Critical Priority - Storage Operations
- [ ] T023 Migrate empty catch blocks in lib/utils/asyncStorage.web.ts (4 instances)
- [ ] T024 Migrate empty catch blocks in lib/models/SyncStateRecord.ts (1 instance)

### High Priority - Database Operations
- [ ] T025 Migrate empty catch blocks in lib/repo/SupabaseExerciseRepo.ts (3 instances)
- [ ] T026 Migrate empty catch blocks in lib/data/supabase/SupabaseAuth.ts (4 instances)
- [ ] T027 Migrate empty catch blocks in lib/data/supabase/SupabaseStorage.ts (4 instances)
- [ ] T028 Migrate empty catch blocks in lib/data/supabase/SupabaseClient.ts (1 instance)

### Medium Priority - Sync and Service Operations
- [ ] T029 Migrate empty catch blocks in lib/data/sync/syncConfig.ts (6 instances)
- [ ] T030 Migrate empty catch blocks in lib/data/ExerciseService.ts (2 instances)
- [ ] T031 Migrate empty catch blocks in lib/data/legend-state/ExerciseActions.ts (8 instances)
- [ ] T032 Migrate empty catch blocks in lib/data/sync/index.ts (1 instance)

### Medium Priority - Authentication and Core Services
- [ ] T033 Migrate empty catch blocks in lib/hooks/useAuth.ts (6 instances)
- [ ] T034 Migrate empty catch blocks in lib/hooks/useAppInit.ts (1 instance)
- [ ] T035 Migrate empty catch blocks in lib/data/index.ts (1 instance)

### Low Priority - Test Infrastructure and Utilities
- [ ] T036 Migrate empty catch blocks in __tests__/test-utils/ files (8 instances)
- [ ] T037 Migrate empty catch blocks in lib/data/supabase/supabase/supabase-core.ts (2 instances)

## Phase 3.5: Integration

- [ ] T038 Configure global error boundary in app entry point
- [ ] T039 Configure recovery actions for each error type
- [ ] T040 Implement error context collection for React Native

## Phase 3.6: Polish

- [ ] T041 [P] Performance validation tests to ensure <1ms overhead and <2MB memory
- [ ] T042 [P] Run complete test suite and validate all error scenarios
- [ ] T043 Local testing using devbox before CI validation
- [ ] T044 Update CLAUDE.md with error handling patterns and usage

## Dependencies

### Setup → Tests → Implementation Flow
- T001-T003 (Setup) before all other tasks
- T004-T011 (Tests) before T012-T022 (Core Implementation)
- T012-T015 (Models) before T016-T019 (Services)
- T016-T019 (Core Services) before T020-T022 (Migration Infrastructure)
- T020-T022 (Migration Infrastructure) before T023-T037 (Migrations)

### Migration Priority Order
- Critical (T023-T024) before High (T025-T028)
- High (T025-T028) before Medium (T029-T035)
- Medium (T029-T035) before Low (T036-T037)

### Final Integration and Polish
- All migration tasks (T023-T037) before integration (T038-T040)
- Integration (T038-T040) before polish (T041-T044)

## Parallel Execution Examples

### Contract Tests (Can run simultaneously)
```bash
# Launch T004-T007 together:
Task: "Contract test for LoggingService interface in __tests__/contracts/logging-service.test.ts"
Task: "Contract test for ErrorHandler interface in __tests__/contracts/error-handler.test.ts"
Task: "Contract test for UserErrorDisplay interface in __tests__/contracts/user-error-display.test.ts"
Task: "Contract test for ErrorMigrationService interface in __tests__/contracts/error-migration.test.ts"
```

### Integration Tests (Can run simultaneously)
```bash
# Launch T008-T011 together:
Task: "Integration test for error event logging flow in __tests__/integration/error-logging-flow.test.ts"
Task: "Integration test for error recovery scenarios in __tests__/integration/error-recovery.test.ts"
Task: "Integration test for user error display scenarios in __tests__/integration/user-error-display.test.ts"
Task: "Integration test for global error boundary in __tests__/integration/global-error-boundary.test.ts"
```

### Data Models (Can run simultaneously)
```bash
# Launch T012-T015 together:
Task: "ErrorEvent model with validation in lib/models/ErrorEvent.ts"
Task: "LogEntry model with validation in lib/models/LogEntry.ts"
Task: "ErrorContext model with validation in lib/models/ErrorContext.ts"
Task: "RecoveryAction model with validation in lib/models/RecoveryAction.ts"
```

## Error-Specific Migration Batches

### Critical Storage Operations
- lib/utils/asyncStorage.web.ts: localStorage access failures
- lib/models/SyncStateRecord.ts: State persistence failures

### High Priority Database Operations
- lib/repo/SupabaseExerciseRepo.ts: Database query failures
- lib/data/supabase/SupabaseAuth.ts: Authentication failures
- lib/data/supabase/SupabaseStorage.ts: File storage failures

### Medium Priority Service Operations
- lib/data/sync/syncConfig.ts: Data synchronization failures
- lib/data/ExerciseService.ts: Business logic persistence failures
- lib/data/legend-state/ExerciseActions.ts: State management failures

## Notes

- **[P] tasks** = different files, no dependencies, safe for parallel execution
- **Verify tests fail** before implementing (TDD requirement)
- **Test locally using devbox** before pushing to CI
- **Constitutional compliance**: Business logic in lib/, direct framework usage
- **Performance targets**: <1ms logging overhead, <2MB memory footprint
- **Error categorization**: Network, Database, Logic, UI, Authentication, Storage
- **Recovery strategy**: Retry only for transient errors (network, I/O)

## Task Generation Summary

**From Contracts**: 4 contract tests + 4 integration tests = 8 test tasks
**From Data Model**: 4 entity models = 4 model tasks
**From Research**: 47 empty catch blocks = 15 migration tasks (grouped by file/priority)
**From Implementation Plan**: 4 core services + 3 migration infrastructure = 7 implementation tasks
**From Integration Requirements**: 3 integration + 4 polish = 7 final tasks
**Setup**: 3 setup tasks

**Total**: 44 tasks covering complete error logging and handling implementation

## Validation Checklist

✅ All contracts have corresponding tests (T004-T007)
✅ All entities have model tasks (T012-T015)
✅ All tests come before implementation (T004-T011 before T012+)
✅ Parallel tasks truly independent (different files)
✅ Each task specifies exact file path
✅ No task modifies same file as another [P] task
✅ TDD flow: Tests → Models → Services → Migration → Integration → Polish
✅ Constitutional compliance maintained throughout
✅ Performance and memory constraints addressed