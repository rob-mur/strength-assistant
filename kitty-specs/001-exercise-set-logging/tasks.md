# Tasks: Exercise Set Logging

**Input**: Design documents from `/kitty-specs/001-exercise-set-logging/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/workout-sets-api.yaml

## Overview

Enable users to log weight, repetitions, and Rate of Perceived Exertion (RPE) for each set using React Native Paper components with real-time validation. Features smart defaults, offline sync, and sub-15 second logging performance.

**Tech Stack**: React Native 0.79.5, Expo SDK 53, React Native Paper, Legend State, Supabase, React Hook Form + Zod

## Work Package Summary

- **WP01**: Database Foundation and Data Models (4 tasks)
- **WP02**: Validation and Form Logic (5 tasks)  
- **WP03**: Local State Management (4 tasks)
- **WP04**: Core Set Logging - User Story 1 (7 tasks)
- **WP05**: Session History and Display - User Story 2 (3 tasks)
- **WP06**: Edit and Delete Functionality - User Stories 3 & 5 (4 tasks)
- **WP07**: Offline Sync and Reliability (3 tasks)
- **WP08**: Performance and Polish (4 tasks)

**Total**: 34 tasks across 8 work packages

## WP01: Database Foundation and Data Models 
*Priority: Critical | Dependencies: None*

**Goal**: Establish database schema and TypeScript type definitions for workout set data

**Subtasks**:
- [x] T001 Create Supabase workout_sets table with constraints in lib/repo/supabase/schema.sql
- [x] T002 [P] Set up database indexes for performance (user_id, session_date) in lib/repo/supabase/indexes.sql 
- [x] T003 [P] Configure Row Level Security policies for workout_sets in lib/repo/supabase/policies.sql
- [x] T004 [P] Create TypeScript WorkoutSet and WorkoutSession interfaces in lib/models/WorkoutSet.ts

**Implementation Notes**: Use existing Supabase project structure. Follow existing naming conventions for database objects.

**Success Criteria**: Database schema supports all functional requirements, TypeScript types match API contracts exactly

**Risks**: None - foundational work

---

## WP02: Validation and Form Logic
*Priority: Critical | Dependencies: WP01*

**Goal**: Implement robust form validation with Zod schemas and React Hook Form integration

**Subtasks**:
- [ ] T005 Create Zod validation schemas for workout set fields in lib/models/validation.ts
- [ ] T006 [P] Write unit tests for Zod validation rules in __tests__/unit/validation.test.ts
- [ ] T007 [P] Write unit tests for form state management in __tests__/unit/form-state.test.ts
- [ ] T008 Implement form validation logic with Zod resolver in lib/hooks/useWorkoutSetForm.ts  
- [ ] T009 Set up React Hook Form with real-time validation in lib/components/WorkoutSetForm.tsx

**Implementation Notes**: Validation must provide <200ms feedback. Support weight (float >0), reps (int ≥1), RPE (1-10, 0.5 increments).

**Success Criteria**: All validation rules enforced, tests pass, immediate user feedback

**Risks**: Performance bottlenecks in real-time validation

---

## WP03: Local State Management  
*Priority: Critical | Dependencies: WP01, WP02*

**Goal**: Set up Legend State store for local persistence and smart form defaults

**Subtasks**:
- [ ] T010 Configure Legend State syncedCrud with Supabase in lib/store/workoutSetStore.ts
- [ ] T011 [P] Write unit tests for Legend State store operations in __tests__/unit/store.test.ts
- [ ] T012 Implement workout set actions using Legend State CRUD methods
- [ ] T013 Add computed values for form defaults and session data

**Implementation Notes**: Use Legend State's built-in syncedCrud() for automatic Supabase sync, no custom sync queue needed

**Success Criteria**: Offline capability works via Legend State, form defaults reduce input time by 50%

**Risks**: Legend State sync configuration complexity, data consistency via built-in conflict resolution

---

## WP04: Core Set Logging - User Story 1
*Priority: High | Dependencies: WP02, WP03*

**Goal**: Enable complete set logging flow (weight, reps, RPE) in under 15 seconds

**Subtasks**:
- [ ] T014 Write Maestro test for complete set logging flow in .maestro/workout/log-set.yaml
- [ ] T015 [P] Create weight input component with React Native Paper in lib/components/WeightInput.tsx
- [ ] T016 [P] Create reps input component with validation in lib/components/RepsInput.tsx
- [ ] T017 [P] Create RPE slider component (1-10, 0.5 increments) in lib/components/RPESlider.tsx
- [ ] T018 Create set logging form container component in lib/components/WorkoutSetForm.tsx
- [ ] T019 Implement Supabase create workout set function in lib/repo/supabase/workoutSets.ts
- [ ] T020 Implement form default values from Legend State

**Implementation Notes**: Focus on speed - target <15 seconds total time. Use React Native Paper Slider for RPE.

**Success Criteria**: User can log complete set in <15 seconds, form resets with smart defaults

**Risks**: Performance issues, complex form state management

---

## WP05: Session History and Display - User Story 2  
*Priority: High | Dependencies: WP04*

**Goal**: Display today's workout sets by default with proper ordering

**Subtasks**:
- [ ] T021 Create session history list component in lib/components/SessionHistoryList.tsx
- [ ] T022 Implement Supabase get workout sets with filters in lib/repo/supabase/workoutSets.ts
- [ ] T023 Integrate form and history components into workout screen in app/(tabs)/workout.tsx

**Implementation Notes**: Show today's sets by default, newest first. Maintain performance with large set counts.

**Success Criteria**: Sets visible immediately after logging, proper chronological ordering

**Risks**: Performance with large datasets

---

## WP06: Edit and Delete Functionality - User Stories 3 & 5
*Priority: Medium | Dependencies: WP05*

**Goal**: Allow users to edit or delete recently logged sets within session

**Subtasks**:
- [ ] T024 Write Maestro test for edit/delete functionality in .maestro/workout/edit-delete-sets.yaml
- [ ] T025 [P] Create set edit/delete action components in lib/components/SetActions.tsx
- [ ] T026 Implement Supabase update workout set function in lib/repo/supabase/workoutSets.ts
- [ ] T027 Implement Supabase delete workout set function with optimistic updates

**Implementation Notes**: Edit/delete must be available within 30 seconds of logging. Use optimistic updates for responsiveness.

**Success Criteria**: Users can modify sets quickly, changes persist correctly

**Risks**: Data consistency during concurrent edits

---

## WP07: Offline Sync and Reliability
*Priority: Medium | Dependencies: WP04, WP05, WP06*

**Goal**: Ensure data persistence during network issues with automatic sync

**Subtasks**:
- [ ] T028 Write Maestro test for Legend State offline sync behavior in .maestro/workout/offline-sync.yaml  
- [ ] T029 Write integration tests for Legend State sync scenarios in __tests__/integration/legend-state-sync.test.ts
- [ ] T030 Configure Legend State sync monitoring and status in lib/services/syncMonitoring.ts

**Implementation Notes**: Configure Legend State's built-in sync for 95% save success rate. Use framework's automatic retry mechanisms.

**Success Criteria**: No data loss during network issues, automatic sync via Legend State, clear sync status indicators

**Risks**: Legend State configuration complexity, sync conflict handling via framework

---

## WP08: Performance and Polish  
*Priority: Low | Dependencies: All previous WPs*

**Goal**: Optimize performance and add comprehensive error handling

**Subtasks**:
- [ ] T031 [P] Write component tests for form inputs in __tests__/unit/components.test.ts
- [ ] T032 Add real-time validation with <200ms feedback optimization
- [ ] T033 Add comprehensive error handling and user feedback
- [ ] T034 Performance optimization for <15 second logging goal

**Implementation Notes**: Focus on user experience polish. Ensure all error scenarios have appropriate feedback.

**Success Criteria**: Consistent <15 second logging, graceful error handling, 60fps UI

**Risks**: Performance regressions

---

## Dependencies

**Blocking Dependencies**:
- WP01 (Database) blocks WP02, WP03
- WP02 (Validation) blocks WP04
- WP03 (State) blocks WP04  
- WP04 (Core Logging) blocks WP05, WP06
- WP05 (History) before WP06 (Edit/Delete)
- All core WPs before WP07 (Sync) and WP08 (Polish)

**Parallel Opportunities**:
- T002, T003, T004 (different database files)
- T006, T007 (different test files)
- T015, T016, T017 (different component files)
- T025, T031 (different test/component files)

## Execution Phases

### Phase 1: Foundation (WP01-WP03)
Critical infrastructure that enables all feature work

### Phase 2: Core Features (WP04-WP06)  
User-facing functionality covering primary user stories

### Phase 3: Integration (WP07-WP08)
Reliability, performance, and polish

## MVP Scope

**Minimum Viable Product**: Complete WP01-WP05
- Basic set logging with weight, reps, RPE
- Smart form defaults
- Session history display
- Real-time validation

**Future Enhancements**: WP06-WP08
- Edit/delete functionality  
- Offline sync reliability
- Performance optimizations

## Success Metrics

- **Speed**: <15 seconds per set logging
- **Reliability**: 95% save success rate
- **Performance**: <200ms validation feedback
- **User Experience**: 50% input time reduction with defaults