# Tasks: Workout Empty State Message

**Input**: Design documents from `/specs/013-workout-empty-state/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL for this UI enhancement feature - not explicitly requested in specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

## Path Conventions

- **Mobile**: React Native with Expo Router file-based routing
- Structure: `app/`, `lib/`, `__tests__/` at repository root

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and component scaffolding

- [x] T001 [P] Create EmptyWorkoutState component file at lib/components/EmptyWorkoutState.tsx
- [x] T002 [P] Create TypeScript interface file for component props at lib/types/EmptyWorkoutState.ts
- [x] T003 [P] Create test file for EmptyWorkoutState component at __tests__/unit/EmptyWorkoutState.test.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Implement EmptyWorkoutState component with React Native Paper components in lib/components/EmptyWorkoutState.tsx
- [x] T005 [P] Add responsive design patterns with useWindowDimensions hook in lib/components/EmptyWorkoutState.tsx
- [x] T006 [P] Implement component styling with Material Design theme integration in lib/components/EmptyWorkoutState.tsx
- [x] T007 [P] Add proper accessibility labels and testID attributes in lib/components/EmptyWorkoutState.tsx

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Initial Workout Guidance (Priority: P1) 🎯 MVP

**Goal**: Replace empty exercise card with helpful guidance message when no exercise is selected

**Independent Test**: Navigate to workout screen with no exercise selected and verify helpful guidance message appears instead of empty card

### Implementation for User Story 1

- [x] T008 [US1] Modify workout screen conditional rendering logic in app/(tabs)/workout.tsx
- [x] T009 [US1] Import EmptyWorkoutState component in app/(tabs)/workout.tsx
- [x] T010 [US1] Add navigation handlers for exercise selection and creation in app/(tabs)/workout.tsx
- [x] T011 [US1] Implement showEmptyState condition based on exercise state in app/(tabs)/workout.tsx
- [x] T012 [US1] Add testID attributes for Maestro integration testing in app/(tabs)/workout.tsx
- [x] T013 [US1] Preserve existing FAB functionality and exercise card display in app/(tabs)/workout.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and validation across the feature

- [x] T014 [P] Add unit tests for EmptyWorkoutState component in __tests__/unit/EmptyWorkoutState.test.tsx
- [x] T015 [P] Add integration tests for workout screen empty state behavior in __tests__/integration/workout-empty-state.maestro
- [x] T016 [P] Test responsive behavior across different device sizes
- [x] T017 [P] Test light/dark theme integration with empty state component
- [x] T018 [P] Validate navigation flows from empty state to exercises and add screens
- [x] T019 Performance testing - verify no render time regression in workout screen
- [x] T020 Run manual testing per quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **Polish (Phase 4)**: Depends on User Story 1 being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within Each User Story

- Component creation before screen modification
- Logic implementation before testing integration
- Core functionality before performance validation

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- All Polish tasks marked [P] can run in parallel (within Phase 4)

---

## Parallel Example: User Story 1

```bash
# Launch User Story 1 implementation in sequence:
Task: "Modify workout screen conditional rendering logic in app/(tabs)/workout.tsx"
Task: "Import EmptyWorkoutState component in app/(tabs)/workout.tsx"
Task: "Add navigation handlers for exercise selection and creation in app/(tabs)/workout.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Polish phase → Additional testing and validation

### Timeline Estimate

- **Setup**: 30 minutes
- **Foundational**: 45 minutes  
- **User Story 1**: 30 minutes
- **Polish**: 45 minutes
- **Total**: ~2.5 hours

---

## Notes

- [P] tasks = different files, no dependencies
- [US1] label maps task to User Story 1 for traceability
- Single user story feature - independently completable and testable
- No tests explicitly requested - focus on implementation and manual validation
- Commit after each logical group of tasks
- Validate empty state appears correctly before proceeding to polish phase
- Preserve all existing workout screen functionality while adding empty state