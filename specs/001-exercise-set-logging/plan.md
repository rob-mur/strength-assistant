# Implementation Plan: Exercise Set Logging

**Branch**: `001-exercise-set-logging` | **Date**: 2025-11-18 | **Spec**: [spec.md](../../../kitty-specs/001-exercise-set-logging/spec.md)
**Input**: Feature specification from `/kitty-specs/001-exercise-set-logging/spec.md`

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

Enable users to log weight, repetitions, and Rate of Perceived Exertion (RPE) for each set during their workout session using React Native Paper components with form validation (integer reps ≥1, float weight >0, RPE 1-10 with 0.5 increments via slider). Focus on friction-free data entry with smart defaults and immediate persistence using Supabase backend and Legend State local storage.

## Technical Context

**Language/Version**: TypeScript with React Native 0.79.5, Expo SDK 53, React 19.0.0  
**Primary Dependencies**: React Native Paper, @legendapp/state, @supabase/supabase-js, Expo Router  
**Storage**: Supabase PostgreSQL (cloud), Legend State local persistence  
**Testing**: Jest + React Native Testing Library for unit tests, Maestro for integration testing  
**Target Platform**: React Native mobile app (iOS/Android)
**Project Type**: mobile - existing React Native app structure  
**Performance Goals**: <15 seconds per set logging, <1 second form response time, 95% save success rate  
**Constraints**: Offline-capable with local persistence, maintain 60fps UI, <200ms validation feedback  
**Scale/Scope**: Single workout screen enhancement, 3 input fields + validation + list display

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Simplicity**:

- Projects: 1 (mobile app enhancement only)
- Using framework directly? ✅ (React Native Paper components directly, no wrappers)
- Single data model? ✅ (WorkoutSet entity only)
- Avoiding patterns? ✅ (Direct Supabase calls, no repository layer for simple CRUD)

**Architecture**:

- EVERY feature as library? ✅ (UI components in lib/, business logic in lib/services)
- Libraries listed: lib/components (UI), lib/services (data), lib/models (types)
- CLI per library: N/A (mobile app feature)
- Library docs: llms.txt format planned? N/A (documented in CLAUDE.md)

**Testing (NON-NEGOTIABLE)**:

- RED-GREEN-Refactor cycle enforced? ✅ (Unit tests written first for validation logic)
- Git commits show tests before implementation? ✅ (TDD approach required)
- Order: Contract→Integration→E2E→Unit strictly followed? ✅ (Maestro integration tests, then unit tests)
- Real dependencies used? ✅ (Real Supabase test database)
- Integration tests for: new libraries, contract changes, shared schemas? ✅ (Maestro tests for UI flow)
- FORBIDDEN: Implementation before test, skipping RED phase ✅ (Enforced)

**Observability**:

- Structured logging included? ✅ (Using existing SimpleErrorLogger system)
- Frontend logs → backend? ✅ (Part of existing error logging infrastructure)
- Error context sufficient? ✅ (Form validation errors, network failures captured)

**Versioning**:

- Version number assigned? N/A (Feature branch, not standalone version)
- BUILD increments on every change? N/A (App-level versioning)
- Breaking changes handled? N/A (Additive feature, no breaking changes)

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

**Structure Decision**: Mobile app (existing React Native structure - app/ for screens, lib/ for business logic)

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/\*, quickstart.md, agent-specific file (CLAUDE.md updated)

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- Load task template and generate from Phase 1 design artifacts
- Form validation: Zod schema creation → validation logic → unit tests  
- UI components: React Native Paper form → RPE slider → validation display
- Data layer: Legend State store → Supabase integration → sync logic
- Integration flow: Maestro tests for complete user journey
- Each contract endpoint → contract test task [P]

**Ordering Strategy**:

- TDD order: Maestro tests → unit tests → implementation
- Dependency order: Models → validation → services → components → integration
- Parallel execution: Form validation tests [P], data model creation [P], component tests [P]
- Sequential: Data layer before UI, validation before submission

**Estimated Output**: 18-22 numbered, ordered tasks covering:
1. Database schema creation
2. Zod validation schemas
3. Legend State store setup
4. React Hook Form integration
5. React Native Paper components
6. Supabase CRUD operations
7. Maestro integration tests
8. Unit tests for validation logic

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
- [x] Complexity deviations documented (none required)

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
