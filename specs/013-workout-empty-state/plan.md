# Implementation Plan: Workout Empty State Message

**Branch**: `013-workout-empty-state` | **Date**: 2025-10-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-workout-empty-state/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Replace the empty exercise card on the workout screen with helpful guidance message when no exercise is selected. This improves first-use experience by providing clear direction instead of confusing empty UI elements. Technical approach involves conditional rendering logic in the React Native workout component.

## Technical Context

**Language/Version**: TypeScript with React Native 0.79.5 / Expo SDK 53  
**Primary Dependencies**: React Native Paper, Expo Router, React 19.0.0  
**Storage**: Supabase (PostgreSQL) for persistence, Legend State for local state management  
**Testing**: Jest + React Native Testing Library for unit tests, Maestro for integration testing  
**Target Platform**: iOS/Android mobile apps via Expo  
**Project Type**: Mobile - React Native with Expo Router file-based routing  
**Performance Goals**: 60 fps UI rendering, instant state changes  
**Constraints**: Must work offline, responsive to all device sizes and orientations  
**Scale/Scope**: Single screen modification in existing workout feature

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Initial Review**: Constitution template not yet populated - no specific violations to assess for this UI enhancement feature.

✅ **INITIAL GATE PASSED**: Simple UI modification feature with no architectural complexity concerns.

**Post-Design Review**: After completing Phase 1 design and contracts:
- Single new reusable component (EmptyWorkoutState) following existing patterns
- Minimal modification to existing workout screen component
- No new dependencies or architectural changes
- Follows existing React Native Paper + Expo Router patterns
- No data model changes or API modifications required

✅ **FINAL GATE PASSED**: Design maintains simplicity with no constitution violations.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
app/
├── (tabs)/
│   └── workout.tsx          # Primary file to modify - workout screen component
└── _layout.tsx

lib/
├── components/              # Potential location for reusable empty state component
├── hooks/                   # Custom hooks for state management  
└── models/                  # Data models if needed

__tests__/
├── integration/            # Maestro tests for workout screen behavior
└── unit/                   # Jest tests for component logic
```

**Structure Decision**: Using existing React Native + Expo file-based routing structure. The main change will be in `app/(tabs)/workout.tsx` with potential reusable components in `lib/components/` if the empty state pattern is needed elsewhere.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No complexity violations - this is a simple UI enhancement with no architectural changes.
