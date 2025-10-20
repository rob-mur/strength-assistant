# Tasks: Android Production Stack Overflow Bug Fix

**Input**: Design documents from `/specs/012-production-bug-android/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓)

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Tech stack: TypeScript/JavaScript with React Native/Expo SDK
   → Libraries: React Native, Expo, Supabase, Legend State
   → Structure: Mobile - React Native app with API backend
2. Load design documents:
   → data-model.md: 3 entities (ErrorBlockerState, SimpleErrorLog, MaestroErrorIndicator)
   → contracts/: simple-error-blocking.ts with 8 interfaces
   → research.md: Decision to replace complex system with simple error blocking
3. Generate tasks by category:
   → Setup: Remove complex error handling (750+ lines)
   → Tests: Contract tests, integration tests with Maestro
   → Core: ErrorBlocker component, SimpleErrorLogger, React Native integration
   → Integration: App layout wrapper, Maestro test updates
   → Polish: Performance validation, production testing
4. Apply task rules:
   → Different files/interfaces = mark [P] for parallel
   → Same file modifications = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Focus on simplification and error visibility for Maestro tests
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup and Removal

- [x] T001 Audit current complex error handling system usage across codebase
- [x] T002 [P] Create backup of DefaultErrorHandler.ts and LoggingServiceFactory.ts before removal
- [ ] T003 Remove complex error handling files: DefaultErrorHandler.ts (~750 lines), LoggingServiceFactory.ts

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T004 [P] Contract test ErrorBlockerState interface in __tests__/contracts/error-blocker-state.test.ts
- [x] T005 [P] Contract test SimpleErrorLogger interface in __tests__/contracts/simple-error-logger.test.ts
- [x] T006 [P] Contract test MaestroErrorDetection interface in __tests__/contracts/maestro-error-detection.test.ts
- [x] T007 [P] Contract test ErrorBlockerComponent interface in __tests__/contracts/error-blocker-component.test.ts
- [x] T008 [P] Contract test ReactNativeErrorHandler interface in __tests__/contracts/react-native-error-handler.test.ts
- [x] T009 [P] Integration test error blocking with Maestro detection in __tests__/integration/error-blocking-maestro.test.ts
- [x] T010 [P] Integration test simple error logging performance in __tests__/integration/simple-logging-performance.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [ ] T011 [P] ErrorBlockerState model in lib/models/ErrorBlockerState.ts
- [ ] T012 [P] SimpleErrorLog model in lib/models/SimpleErrorLog.ts
- [ ] T013 [P] MaestroErrorIndicator model in lib/models/MaestroErrorIndicator.ts
- [ ] T014 [P] SimpleErrorLogger service in lib/utils/logging/SimpleErrorLogger.ts
- [ ] T015 [P] MaestroErrorDetection service in lib/utils/testing/MaestroErrorDetection.ts
- [ ] T016 ErrorBlocker React component in lib/components/ErrorBlocker.tsx
- [ ] T017 ReactNativeErrorHandler service in lib/utils/logging/ReactNativeErrorHandler.ts
- [ ] T018 ErrorBlockingFactory in lib/utils/logging/ErrorBlockingFactory.ts

## Phase 3.4: Integration

- [ ] T019 Integrate ErrorBlocker component in app/_layout.tsx as root wrapper
- [ ] T020 Replace complex error handling usage throughout codebase with SimpleErrorLogger
- [ ] T021 Update existing error handling in lib/hooks/useAppInit.ts to use SimpleErrorLogger
- [ ] T022 Update existing error handling in lib/data/supabase/supabase.ts to use SimpleErrorLogger
- [ ] T023 Add error blocker detection to .maestro/shared/common/error-check.yml
- [ ] T024 Update existing Maestro flows in .maestro/shared/add-exercise-and-see-it-in-list.yml to include error checks
- [ ] T025 Update existing Maestro flows in .maestro/shared/add-and-record-workout.yml to include error checks

## Phase 3.5: Polish

- [ ] T026 [P] Unit test ErrorBlocker component behavior in __tests__/components/ErrorBlocker.test.tsx
- [ ] T027 [P] Unit test SimpleErrorLogger methods in __tests__/unit/logging/SimpleErrorLogger.test.ts
- [ ] T028 [P] Performance benchmark simple vs complex logging in __tests__/performance/logging-comparison.test.ts
- [ ] T029 [P] Create error simulation test scenario for manual validation in __tests__/integration/error-simulation.test.ts
- [ ] T030 Production APK validation with real Android device testing using devbox integration test script
- [ ] T031 Update CLAUDE.md to document simple error handling approach and removal of complex system

## Parallel Execution Examples

### Phase 3.2 Tests (Can run simultaneously)
```bash
# All contract tests can run in parallel since they test different interfaces
npm test __tests__/contracts/error-blocker-state.test.ts &
npm test __tests__/contracts/simple-error-logger.test.ts &
npm test __tests__/contracts/maestro-error-detection.test.ts &
npm test __tests__/contracts/error-blocker-component.test.ts &
npm test __tests__/contracts/react-native-error-handler.test.ts &
wait

# Integration tests can run in parallel
npm test __tests__/integration/error-blocking-maestro.test.ts &
npm test __tests__/integration/simple-logging-performance.test.ts &
wait
```

### Phase 3.3 Core Models (Can run simultaneously)
```bash
# Model creation tasks can run in parallel since they're in different files
touch lib/models/ErrorBlockerState.ts &
touch lib/models/SimpleErrorLog.ts &
touch lib/models/MaestroErrorIndicator.ts &
wait

# Service creation tasks can run in parallel
touch lib/utils/logging/SimpleErrorLogger.ts &
touch lib/utils/testing/MaestroErrorDetection.ts &
wait
```

### Phase 3.5 Polish Tests (Can run simultaneously)
```bash
# All polish tests can run in parallel
npm test __tests__/components/ErrorBlocker.test.tsx &
npm test __tests__/unit/logging/SimpleErrorLogger.test.ts &
npm test __tests__/performance/logging-comparison.test.ts &
npm test __tests__/integration/error-simulation.test.ts &
wait
```

## Key Dependencies

**Must Complete First**:
- T001-T003 (Setup) before any implementation
- T004-T010 (Tests) before T011-T018 (Core Implementation)
- T011-T018 (Core) before T019-T025 (Integration)

**Critical Path**:
- T003 (Remove complex system) → T020 (Replace usage) → T030 (Production validation)
- T016 (ErrorBlocker component) → T019 (App integration) → T024-T025 (Maestro updates)

## Success Criteria

1. **Complex System Removed**: DefaultErrorHandler.ts (~750 lines) and LoggingServiceFactory.ts deleted
2. **Simple System Working**: ErrorBlocker component blocks app when uncaught errors occur
3. **Maestro Detection**: Integration tests can detect error blocker using testID attributes
4. **Performance Improved**: <0.01ms overhead vs previous <1ms (100x improvement)
5. **Production Ready**: Error blocking works in production APK builds on real Android devices

## Risk Mitigation

- **T002**: Backup complex system before removal for potential rollback
- **TDD Approach**: T004-T010 ensure tests fail before implementation, preventing regression
- **Gradual Replacement**: T020-T022 replace usage incrementally rather than all at once
- **Production Validation**: T030 validates on real devices before full deployment