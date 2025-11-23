# Implementation Plan: Weekly Exercise Planner

**Branch**: `001-weekly-exercise-planner` | **Date**: 2025-11-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `kitty-specs/001-weekly-exercise-planner/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Implement a simple weekly exercise planner on the home page where users can view 7 days of the week and assign exercises to specific days. Uses react-native-calendars for UI, Supabase for persistence with exercise_schedules junction table, and Legend State for local sync. Replaces the GettingStartedCard with a WeeklyPlannerCard that expands to show calendar functionality when users have exercises.

## Technical Context

**Language/Version**: TypeScript with React Native 0.79.5, Expo SDK 53, React 19.0.0  
**Primary Dependencies**: @legendapp/state, @supabase/supabase-js, Expo Router, React Native Paper, react-native-calendars  
**Storage**: Supabase PostgreSQL (cloud) with Legend State local persistence  
**Testing**: Jest + React Native Testing Library for unit tests, Maestro for integration testing  
**Target Platform**: iOS/Android mobile (React Native/Expo)
**Project Type**: mobile - existing app enhancement  
**Performance Goals**: Home screen loads in <3 seconds, exercise assignment in <30 seconds, 60 FPS animations  
**Constraints**: Offline-capable, real-time sync, must integrate with existing exercise management system  
**Scale/Scope**: Single feature addition to existing app, ~5-7 new components, 1 database table

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Simplicity**:

- Projects: 1 (mobile app enhancement)
- Using framework directly? YES (Legend State, React Native Paper, react-native-calendars directly)
- Single data model? YES (WeeklyPlan entity maps to exercise_schedules table)
- Avoiding patterns? YES (direct Legend State usage, no unnecessary abstractions)

**Architecture**:

- EVERY feature as library? NO - this is app-specific UI enhancement, business logic in lib/
- Libraries listed: N/A (app feature, not library)
- CLI per library: N/A (app feature)
- Library docs: N/A (app feature with existing patterns)

**Testing (NON-NEGOTIABLE)**:

- RED-GREEN-Refactor cycle enforced? YES (tests first, implementation to make them pass)
- Git commits show tests before implementation? YES (will follow TDD)
- Order: Contract→Integration→E2E→Unit strictly followed? YES (database contracts, Maestro E2E, Jest unit)
- Real dependencies used? YES (actual Supabase, real device testing)
- Integration tests for: YES (new sync patterns, database schema changes)
- FORBIDDEN: Implementation before test, skipping RED phase - ACKNOWLEDGED

**Observability**:

- Structured logging included? YES (using existing SimpleErrorLogger system)
- Frontend logs → backend? YES (existing error handling infrastructure)
- Error context sufficient? YES (sync errors, offline state, UI interactions)

**Versioning**:

- Version number assigned? N/A (feature branch, not versioned release)
- BUILD increments on every change? N/A (development feature)
- Breaking changes handled? N/A (additive feature, no breaking changes)

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 3 - Mobile App (React Native/Expo) with existing structure preserved

## Phase 0: Outline & Research

✅ **COMPLETED** - Research has been conducted and documented.

**Key Research Outcomes**:
- React Native calendar component: `react-native-calendars` with ExpandableCalendar
- Database design: `exercise_schedules` junction table with composite keys
- Sync pattern: Legend State bidirectional sync with Supabase real-time subscriptions
- UI integration: Replace GettingStartedCard with WeeklyPlannerCard on home screen

**Output**: research.md with comprehensive findings and technical decisions

## Phase 1: Design & Contracts

✅ **COMPLETED** - Design artifacts and contracts have been generated.

**Generated Artifacts**:

1. **data-model.md**: Complete data model with ExerciseSchedule entity, Supabase schema, Legend State structure, and sync patterns
   
2. **contracts/**: API contracts generated:
   - `exercise-schedules-api.yaml`: OpenAPI specification for Supabase REST operations
   - `legend-state-interface.ts`: TypeScript interfaces for Legend State integration

3. **quickstart.md**: Comprehensive setup and validation guide with test scenarios

4. **Agent context updated**: CLAUDE.md updated with new technology stack for weekly planner

**Key Design Decisions**:
- ExerciseSchedule entity with composite unique constraint (user_id, exercise_id, day_of_week)
- Legend State observable structure with computed weekly plan views
- Progressive UI enhancement: GettingStartedCard → WeeklyPlannerCard based on user state
- Real-time sync with optimistic updates and conflict resolution

**Output**: ✅ data-model.md, ✅ contracts/*, ✅ quickstart.md, ✅ CLAUDE.md updated

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- **Database Tasks**: Supabase migration, RLS policies, indexes (from data-model.md)
- **Legend State Tasks**: Sync configuration, observable store structure, actions (from contracts/)
- **UI Components**: WeeklyPlannerCard, CalendarView, DayAssignmentModal (from quickstart scenarios)
- **Integration Tasks**: Home screen integration, exercise assignment flow, workout navigation
- **Test Tasks**: Contract validation, E2E scenarios, sync testing

**Ordering Strategy**:

1. **Foundation** [P]: Database schema, Legend State store structure
2. **Data Layer** [P]: Sync configuration, CRUD operations, API contracts
3. **Core Components** [P]: Calendar component, assignment modal, planner card
4. **Integration**: Home screen integration, navigation flows
5. **Testing**: Contract tests, integration tests, E2E validation
6. **Polish**: Performance optimization, error handling, UI refinements

**Key Dependencies**:
- Database schema → Legend State sync → UI components
- Exercise library functionality → Exercise assignment workflow
- Authentication system → RLS policies and user isolation

**Estimated Output**: ~20-25 numbered, ordered tasks in tasks.md with TDD approach

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (N/A - no violations)

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
