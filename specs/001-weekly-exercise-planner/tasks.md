# Tasks: Weekly Exercise Planner

**Input**: Design documents from `/specs/001-weekly-exercise-planner/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓), quickstart.md (✓)

## Execution Flow (main)

```
1. Load plan.md from feature directory ✓
   → Tech stack: TypeScript, React Native 0.79.5, Expo SDK 53, Legend State, Supabase
   → Structure: Mobile app enhancement with lib/ and app/ directories
2. Load design documents ✓:
   → data-model.md: ExerciseSchedule entity, Supabase schema, Legend State sync
   → contracts/: exercise-schedules-api.yaml, legend-state-interface.ts
   → research.md: react-native-calendars, configureSyncedSupabase approach
   → quickstart.md: Database migration, validation scenarios
3. Generate tasks by user story priority:
   → Foundation: Database schema, Legend State setup
   → User Story 1 (P1): View weekly schedule
   → User Story 2 (P2): Assign exercises to days  
   → User Story 3 (P3): Navigate to workout
   → Testing: E2E scenarios, contract validation
4. Apply task rules:
   → Database/model tasks = [P] (different concerns)
   → UI components = [P] (different files)
   → Integration tasks = sequential (dependencies)
   → TDD approach with contract tests first
```

## Path Conventions

- **Mobile app structure**: `app/` for routes, `lib/` for business logic
- **Database**: Supabase migrations in `supabase/migrations/`
- **Tests**: `__tests__/` with contract/, integration/, unit/ subdirectories

## Work Package 1: Database Foundation

**Goal**: Set up exercise_schedules table and data infrastructure  
**Priority**: P1 (Foundation)  
**Dependencies**: None  
**Independent Test**: Database operations work with sample data

- [ ] T001 [P] Create Supabase migration for exercise_schedules table in `supabase/migrations/`
- [ ] T002 [P] Set up RLS policies and performance indexes for exercise_schedules
- [ ] T003 [P] Create database update trigger for updated_at field
- [ ] T004 [P] Install react-native-calendars dependency via npm
- [ ] T005 Test database schema with sample data validation

## Work Package 2: Legend State Data Layer ✅

**Goal**: Set up reactive state management and Supabase sync  
**Priority**: P1 (Critical foundation)  
**Dependencies**: WP1 (database schema)  
**Independent Test**: Sync operations work with observable state  
**Status**: COMPLETED - See `specs/001-weekly-exercise-planner/tasks/done/WP02-legend-state-data-layer.md`

- [x] T006 [P] Create ExerciseSchedule TypeScript model in `lib/models/ExerciseSchedule.ts`
- [x] T007 [P] Set up configureSyncedSupabase config in `lib/data/sync/weeklyPlanSync.ts`
- [x] T008 [P] Create computed weekly plan observables in `lib/data/legend-state/WeeklyPlanStore.ts`
- [x] T009 [P] Create exercise assignment actions in `lib/data/legend-state/WeeklyPlanActions.ts`
- [x] T010 Test Legend State sync integration with Supabase

## Work Package 3: Core UI Components

**Goal**: Build calendar and exercise assignment interface components  
**Priority**: P2 (User interface)  
**Dependencies**: None (can use mock data)  
**Independent Test**: Components render and respond to interactions

- [ ] T011 [P] Create WeeklyPlannerCard component in `lib/components/Cards/WeeklyPlannerCard.tsx`
- [ ] T012 [P] Implement CalendarView with react-native-calendars in `lib/components/Calendar/CalendarView.tsx`
- [ ] T013 [P] Create DayAssignmentModal in `lib/components/Modals/DayAssignmentModal.tsx`
- [ ] T014 [P] Add current day highlighting logic in CalendarView
- [ ] T015 [P] Implement visual distinction for workout/rest days in CalendarView
- [ ] T016 [P] Add exercise list and assignment UI to DayAssignmentModal
- [ ] T017 [P] Implement exercise removal and reordering in DayAssignmentModal  
- [ ] T018 [P] Apply React Native Paper theming to all weekly planner components

## Work Package 4: User Story 1 - Weekly Schedule View

**Goal**: Implement weekly schedule viewing on home screen (User Story P1)  
**Priority**: P2 (Core user story)  
**Dependencies**: WP2 (Legend State), WP3 (UI components)  
**Independent Test**: User sees 7-day calendar with current day highlighted

**Acceptance Scenarios**:
- User opens home screen → sees 7 days labeled Monday-Sunday
- When it's Tuesday → Tuesday is visually highlighted as current day
- Days with exercises vs rest days are clearly distinguishable

- [ ] T019 Create useWeeklyPlanner hook in `lib/hooks/useWeeklyPlanner.ts`
- [ ] T020 Modify home screen to conditionally show WeeklyPlannerCard in `app/(tabs)/index.tsx`
- [ ] T021 Implement calendar expansion/collapse functionality in WeeklyPlannerCard

## Work Package 5: User Story 2 - Exercise Assignment

**Goal**: Enable exercise assignment and management (User Story P2)  
**Priority**: P2 (Core user story)  
**Dependencies**: WP4  
**Independent Test**: User can assign/remove exercises to days

**Acceptance Scenarios**:
- User taps Monday → exercise selection interface opens
- User selects exercise → Monday shows assigned exercise clearly  
- User can assign multiple exercises to one day

- [ ] T022 Connect day tap events to DayAssignmentModal in WeeklyPlannerCard
- [ ] T023 Handle edge cases: no exercises created, empty states, duplicate assignments

## Work Package 6: User Story 3 & Validation  

**Goal**: Complete workout navigation and comprehensive testing (User Story P3)  
**Priority**: P3 (Final integration)  
**Dependencies**: WP5  
**Independent Test**: Full user journey from planning to workout

**Acceptance Scenarios**:
- User has exercises assigned to today → tap today's plan → taken to workout screen
- Assigned exercises are pre-loaded or easily accessible

- [ ] T024 Write Maestro E2E tests for all user stories in `.maestro/shared/weekly-planner-flow.yml`
- [ ] T025 [P] Create contract tests for exercise_schedules operations in `__tests__/contracts/weekly-planner-contract.test.ts`

## Dependencies

- **Critical Path**: WP1 → WP2 → WP4 → WP5 → WP6
- **Parallel**: WP1 & WP3 can run simultaneously (WP3 uses mock data)
- **Blocking**: Database schema (T001-T003) before sync setup (T007-T010)
- **TDD**: Contract tests (T025) should be written early to validate approach

## Parallel Execution Examples

```
# Foundation (can run simultaneously):
Task: "Create Supabase migration for exercise_schedules table"
Task: "Install react-native-calendars dependency"
Task: "Create ExerciseSchedule TypeScript model"

# UI Components (independent development):
Task: "Create WeeklyPlannerCard component"
Task: "Implement CalendarView with react-native-calendars" 
Task: "Create DayAssignmentModal"
```

## Performance Targets

- **SC-001**: Weekly plan loads in <3 seconds (home screen performance)
- **SC-002**: Exercise assignment completes in <30 seconds (end-to-end flow)
- **SC-003**: 60 FPS animations for calendar interactions
- **SC-004**: Offline-capable with optimistic updates via Legend State

## Notes

- Follow TDD: Write contract tests before implementation
- Use Legend State's built-in `configureSyncedSupabase` - no custom sync code
- Components should work with mock data initially for parallel development
- All database operations use RLS for user isolation
- Maintain existing code style and React Native Paper theme consistency

## Validation Checklist

- [x] All user stories have corresponding tasks (P1: T019-T021, P2: T022-T023, P3: T024)
- [x] All entities have model tasks (ExerciseSchedule: T006)
- [x] Database schema tasks come before sync setup (T001-T003 → T007-T010)
- [x] Parallel tasks are truly independent ([P] tasks use different files)
- [x] Each task specifies exact file path or clear component scope
- [x] No task modifies same file as another [P] task