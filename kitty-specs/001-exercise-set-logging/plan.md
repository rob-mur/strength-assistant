# Implementation Plan: Exercise Set Logging

**Branch**: `001-exercise-set-logging` | **Date**: 2025-11-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/kitty-specs/001-exercise-set-logging/spec.md`

## Summary

Enable users to log weight, repetitions, and Rate of Perceived Exertion (RPE) for each set during their workout session with friction-free data entry targeting <15 second logging time. Uses React Native 0.79.5 with React Native Paper components, React Hook Form + Zod validation, Legend State for local persistence, and Supabase for cloud storage. Features smart defaults, offline sync, and real-time validation feedback.

## Technical Context

**Language/Version**: TypeScript with React Native 0.79.5, Expo SDK 53, React 19.0.0
**Primary Dependencies**: React Native Paper, Legend State, Supabase client, React Hook Form, Zod, Expo Router
**Storage**: Supabase PostgreSQL (cloud) + Legend State local persistence
**Testing**: Jest + React Native Testing Library (unit), Maestro (integration)
**Target Platform**: iOS/Android mobile via React Native/Expo
**Project Type**: Mobile - React Native feature module
**Performance Goals**: <15 second complete set logging, <200ms validation feedback, 60fps UI
**Constraints**: Offline-capable, 95% save success rate, sub-second form response
**Scale/Scope**: Single feature within existing strength training app, ~8 new components, 34 implementation tasks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **PASS** - No constitution constraints defined in project template. Using established project patterns:
- TDD approach with tests before implementation
- Legend State for local persistence following existing patterns
- Supabase integration using established repo layer
- React Native Paper for UI consistency
- Standard TypeScript/React Native project structure

## Project Structure

### Documentation (this feature)

```
kitty-specs/001-exercise-set-logging/
├── plan.md                    # This file (implementation plan)
├── spec.md                    # Feature requirements and user stories
├── research.md                # Technology decisions and patterns
├── data-model.md              # WorkoutSet entity and database schema
├── quickstart.md              # User story validation steps
├── contracts/                 # API contracts
│   └── workout-sets-api.yaml  # OpenAPI spec for CRUD operations
├── tasks.md                   # 34 implementation tasks across 8 work packages
└── tasks/                     # Task management folders
    ├── planned/               # WP01-WP08 task files
    ├── doing/                 # Active implementation
    ├── for_review/            # Completed awaiting review
    └── done/                  # Validated complete tasks
```

### Source Code (repository root)

```
app/                           # Expo Router screens and routes
├── (tabs)/
│   └── workout.tsx            # Main workout screen with set logging
├── _layout.tsx
└── error.ts

lib/                           # Business logic and services
├── components/                # React Native Paper UI components
│   ├── ErrorBlocker.tsx
│   ├── WorkoutSetForm.tsx     # Main set logging form container
│   ├── WeightInput.tsx        # Weight input with validation
│   ├── RepsInput.tsx          # Repetition input component
│   ├── RPESlider.tsx          # RPE slider (1-10, 0.5 increments)
│   ├── SessionHistoryList.tsx # Today's logged sets display
│   └── SetActions.tsx         # Edit/delete actions for sets
├── hooks/                     # React hooks
│   └── useWorkoutSetForm.ts   # Form state management with validation
├── models/                    # Data models and validation
│   ├── WorkoutSet.ts          # TypeScript interfaces
│   └── validation.ts          # Zod schemas for form validation
├── store/                     # Legend State management
│   └── workoutSetStore.ts     # Local persistence + Supabase sync
├── repo/                      # Repository layer (Supabase)
│   └── supabase/
│       ├── schema.sql         # workout_sets table definition
│       ├── indexes.sql        # Performance indexes
│       ├── policies.sql       # Row Level Security
│       └── workoutSets.ts     # CRUD operations
└── services/
    └── syncMonitoring.ts      # Legend State sync status

__tests__/                     # Test infrastructure
├── unit/
│   ├── validation.test.ts     # Zod schema validation tests
│   ├── form-state.test.ts     # Form management tests
│   ├── store.test.ts          # Legend State operations
│   └── components.test.ts     # Component unit tests
└── integration/
    └── legend-state-sync.test.ts # Sync scenario tests

.maestro/                      # Integration test scenarios
├── workout/
│   ├── log-set.yaml          # Complete set logging flow
│   ├── edit-delete-sets.yaml # Edit/delete functionality
│   └── offline-sync.yaml     # Offline behavior validation
└── shared/
    └── error-check.yml        # Error detection utilities
```

**Structure Decision**: Using existing React Native/Expo project structure with Expo Router for navigation. All business logic in `lib/` directory, UI components follow React Native Paper patterns, testing uses Jest + Maestro framework already established in project.

## Implementation Approach

**Architecture**: Clean separation between UI (React Native Paper), business logic (React Hook Form + Legend State), and data persistence (Supabase). Uses established patterns from existing codebase.

**Key Design Decisions**:
- **Form Management**: React Hook Form + Zod for real-time validation with <200ms feedback
- **State Management**: Legend State syncedCrud() for automatic offline/online sync
- **UI Components**: React Native Paper Slider for RPE input, standard Paper form components
- **Validation Strategy**: Client-side Zod schemas matching OpenAPI contracts
- **Testing Strategy**: TDD with Jest unit tests first, then Maestro integration tests

**Risk Mitigation**:
- Legend State handles offline/sync complexity automatically
- Form defaults from last set reduce input time by 50%
- Optimistic updates provide immediate UI feedback
- Real-time validation prevents invalid submissions

**Success Criteria**:
- Complete set logging in <15 seconds
- 95% save success rate with Legend State sync
- Real-time validation feedback <200ms
- Seamless offline/online operation
