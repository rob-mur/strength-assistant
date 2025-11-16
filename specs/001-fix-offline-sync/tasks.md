# Tasks: Fix Offline Sync

**Input**: Design documents from `/specs/001-fix-offline-sync/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test-first development explicitly requested - all test tasks MUST be implemented and MUST FAIL before production code

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

React Native with Expo structure:
- **App screens**: `app/` directory
- **Business logic**: `lib/` directory  
- **Tests**: `__tests__/` directory
- **Sync services**: `lib/sync/` (new)
- **Integration tests**: `__tests__/integration/offline-sync/` (new)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Test infrastructure and sync service foundation

- [x] T001 Create offline sync test directory structure at `__tests__/integration/offline-sync/`
- [x] T002 Create sync service directory structure at `lib/sync/`
- [x] T003 [P] Create sync contracts directory at `lib/contracts/`
- [x] T004 [P] Copy sync manager contract from specs to `lib/contracts/sync-manager-contract.ts`
- [x] T005 [P] Create network mocking utilities at `__tests__/test-utils/NetworkMocks.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core sync infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Create SyncStatus model in `lib/models/SyncStatus.ts`
- [x] T007 [P] Create NetworkState model in `lib/models/NetworkState.ts`
- [x] T008 [P] Create SyncQueue model in `lib/models/SyncQueue.ts`
- [x] T009 [P] Create SyncConflict model in `lib/models/SyncConflict.ts`
- [x] T010 Create enhanced ExerciseRecord model in `lib/models/ExerciseRecord.ts`
- [x] T011 Create ConnectivityMonitor service in `lib/sync/ConnectivityMonitor.ts`
- [x] T012 Create basic SyncManager interface implementation in `lib/sync/SyncManager.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Offline Exercise Creation and Sync (Priority: P1) 🎯 MVP

**Goal**: Fix the critical bug where exercises created offline are lost on app restart and never sync to cloud

**Independent Test**: Turn on airplane mode → add exercises → restore connectivity → verify cloud sync → restart app → verify exercises persist

### Tests for User Story 1 (MUST FAIL FIRST) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T013 [P] [US1] Create critical bug test in `__tests__/integration/offline-sync/critical-bug-test.ts`
- [ ] T014 [P] [US1] Create offline operation tests in `__tests__/unit/sync/offline-operations.test.ts`
- [ ] T015 [P] [US1] Create sync recovery tests in `__tests__/unit/sync/sync-recovery.test.ts`
- [ ] T016 [P] [US1] Create app restart persistence tests in `__tests__/unit/sync/app-restart.test.ts`

### Implementation for User Story 1

- [ ] T017 [P] [US1] Implement queue management methods in `lib/sync/SyncManager.ts`
- [ ] T018 [P] [US1] Implement network state detection in `lib/sync/ConnectivityMonitor.ts`
- [ ] T019 [US1] Implement offline operation queuing in `lib/sync/SyncManager.ts`
- [ ] T020 [US1] Implement sync processing with batch management in `lib/sync/SyncManager.ts`
- [ ] T021 [US1] Integrate SyncManager with Legend State in `lib/data/legend-state/sync-config.ts`
- [ ] T022 [US1] Add sync status tracking to exercise store in `lib/data/legend-state/ExerciseStore.ts`
- [ ] T023 [US1] Implement automatic sync on connectivity restore in `lib/sync/SyncManager.ts`
- [ ] T024 [US1] Add sync persistence through app restarts in `lib/sync/SyncManager.ts`

**Checkpoint**: At this point, the critical offline sync bug should be fixed and all tests should pass

---

## Phase 4: User Story 2 - Comprehensive Test Coverage for Sync Scenarios (Priority: P2)

**Goal**: Comprehensive automated test suite that catches sync regressions and validates all offline scenarios

**Independent Test**: Run test suite and verify complete coverage of offline sync functionality with clear failure reporting

### Tests for User Story 2 (COMPREHENSIVE COVERAGE) ⚠️

- [ ] T025 [P] [US2] Create network transition tests in `__tests__/integration/offline-sync/network-transitions.test.ts`
- [ ] T026 [P] [US2] Create extended offline period tests in `__tests__/integration/offline-sync/extended-offline.test.ts`
- [ ] T027 [P] [US2] Create performance tests in `__tests__/unit/sync/performance.test.ts`
- [ ] T028 [P] [US2] Create error handling tests in `__tests__/unit/sync/error-handling.test.ts`
- [ ] T029 [P] [US2] Create Maestro integration tests in `__tests__/integration/offline-sync/airplane-mode.maestro`
- [ ] T030 [P] [US2] Create Maestro network simulation tests in `__tests__/integration/offline-sync/network-simulation.maestro`

### Implementation for User Story 2

- [ ] T031 [P] [US2] Implement comprehensive error logging in `lib/sync/SyncLogger.ts`
- [ ] T032 [P] [US2] Add sync metrics and monitoring in `lib/sync/SyncMetrics.ts`
- [ ] T033 [US2] Implement retry mechanism with exponential backoff in `lib/sync/RetryManager.ts`
- [ ] T034 [US2] Add sync status validation and health checks in `lib/sync/SyncValidator.ts`
- [ ] T035 [US2] Integrate sync monitoring with error blocking system in `lib/sync/SyncErrorHandler.ts`

**Checkpoint**: Test suite should catch 100% of sync regressions and provide detailed failure reporting

---

## Phase 5: User Story 3 - Data Integrity During Network Transitions (Priority: P3)

**Goal**: Robust handling of unstable network conditions with conflict resolution and zero data loss

**Independent Test**: Simulate various network conditions during exercise operations and verify no data corruption or loss

### Tests for User Story 3 (ADVANCED SCENARIOS) ⚠️

- [ ] T036 [P] [US3] Create conflict detection tests in `__tests__/unit/sync/conflict-detection.test.ts`
- [ ] T037 [P] [US3] Create conflict resolution tests in `__tests__/unit/sync/conflict-resolution.test.ts`
- [ ] T038 [P] [US3] Create data integrity tests in `__tests__/integration/offline-sync/data-integrity.test.ts`
- [ ] T039 [P] [US3] Create intermittent connectivity tests in `__tests__/integration/offline-sync/intermittent-connectivity.test.ts`

### Implementation for User Story 3

- [ ] T040 [P] [US3] Implement conflict detection in `lib/sync/ConflictDetector.ts`
- [ ] T041 [P] [US3] Implement automatic conflict resolution in `lib/sync/ConflictResolver.ts`
- [ ] T042 [US3] Add domain-specific conflict rules for exercise data in `lib/sync/ExerciseConflictResolver.ts`
- [ ] T043 [US3] Implement adaptive batch sizing for network conditions in `lib/sync/AdaptiveSyncManager.ts`
- [ ] T044 [US3] Add sync progress tracking and user feedback in `lib/sync/SyncProgressTracker.ts`
- [ ] T045 [US3] Create sync status UI component in `lib/components/SyncStatusIcon.tsx`
- [ ] T046 [US3] Integrate sync status with app bar in `app/_layout.tsx`

**Checkpoint**: All network transition scenarios should be handled robustly with user feedback

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final optimizations and production readiness

- [ ] T047 [P] Add comprehensive TypeScript types for all sync interfaces in `lib/types/sync.ts`
- [ ] T048 [P] Create sync debugging utilities in `lib/utils/sync-debug.ts`
- [ ] T049 [P] Add sync performance monitoring in production builds
- [ ] T050 [P] Update CLAUDE.md with sync functionality documentation
- [ ] T051 Run complete test suite validation including production Android builds
- [ ] T052 Performance optimization across all sync scenarios
- [ ] T053 Security hardening for sync data transmission
- [ ] T054 Run quickstart.md validation workflow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - CRITICAL BUG FIX - highest priority
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Builds on US1 infrastructure but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Advanced features, depends on US1 SyncManager but independently testable

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD approach)
- Models before services
- Core sync functionality before integration
- Story complete and validated before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Models within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (MUST FAIL FIRST):
Task: "Create critical bug test in __tests__/integration/offline-sync/critical-bug-test.ts"
Task: "Create offline operation tests in __tests__/unit/sync/offline-operations.test.ts"
Task: "Create sync recovery tests in __tests__/unit/sync/sync-recovery.test.ts"
Task: "Create app restart persistence tests in __tests__/unit/sync/app-restart.test.ts"

# Launch all models for User Story 1 together:
Task: "Implement queue management methods in lib/sync/SyncManager.ts"
Task: "Implement network state detection in lib/sync/ConnectivityMonitor.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (THE CRITICAL BUG FIX)
4. **STOP and VALIDATE**: Test the exact bug scenario from spec - exercises must NOT be lost
5. Deploy/test in production Android environment

### Test-First Development Flow

1. **RED**: Write failing tests that recreate the exact bug scenario
2. **GREEN**: Implement minimal SyncManager to make tests pass
3. **REFACTOR**: Enhance implementation while keeping tests green
4. **VALIDATE**: Verify fix works in production Android builds

### Incremental Delivery

1. Complete Setup + Foundational → Test infrastructure ready
2. Add User Story 1 → Test critical bug fix → Deploy/Demo (MVP!)
3. Add User Story 2 → Test comprehensive coverage → Deploy/Demo
4. Add User Story 3 → Test advanced scenarios → Deploy/Demo
5. Each story adds value without breaking previous functionality

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (PRIORITY - critical bug)
   - Developer B: User Story 2 (test coverage)
   - Developer C: User Story 3 (advanced features)
3. Stories complete and integrate independently

---

## Success Criteria Validation

### Critical Test: The Exact Bug Scenario

```typescript
// This EXACT scenario from the spec MUST work flawlessly:
// 1. Turn on airplane mode ✅
// 2. Add exercises ✅  
// 3. Turn back on internet ✅
// 4. Exercises sync to cloud ✅
// 5. App restart ✅
// 6. Exercises remain available ✅ (This was failing before)
```

### Performance Targets

- Offline operations complete in <100ms (SC measured)
- Sync recovery in <30 seconds after connectivity restoration (SC-001)
- Zero data loss in 100% of test scenarios (SC-002)
- Exercise data persists across app restarts in 100% of cases (SC-003)
- Automated tests catch sync functionality regressions with 100% reliability (SC-004)
- Works reliably on production Android builds in real-world conditions (SC-005)

### Test Coverage Requirements

- All offline sync scenarios covered by integration tests
- Real-world network conditions simulated in test suite
- App restart scenarios validated
- Conflict resolution workflows tested
- Maestro integration tests for actual user workflows

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **CRITICAL**: Tests must be written first and must fail initially (TDD)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Focus on fixing the specific bug: exercises lost on app restart after offline usage
- Verify all tests pass before considering implementation complete