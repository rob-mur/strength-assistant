# Implementation Plan: Fix Production Authentication Bug & Implement Release Testing

**Branch**: `003-fix-production-bug` | **Date**: 2025-09-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-fix-production-bug/spec.md`

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

Fix production APK authentication failures where the app cannot connect to live Supabase servers, requiring fallback to local anonymous users. Implement automated pre-release testing to detect authentication configuration issues before deployment. The error logs show `AuthRetryableFetchError: Network request failed` and `AuthSessionMissingError: Auth session missing!` indicating connection and session management problems in production builds.

## Technical Context

**Language/Version**: TypeScript/JavaScript with React Native/Expo  
**Primary Dependencies**: Supabase, Legend State, Jest + React Native Testing Library, Maestro  
**Storage**: Supabase (PostgreSQL) for backend services  
**Testing**: Jest for unit tests, Maestro for integration testing  
**Target Platform**: Android APK production builds, iOS apps
**Project Type**: mobile - determines source structure  
**Performance Goals**: Reliable authentication within 5 seconds, offline-first operation  
**Constraints**: Production APK must work with live Supabase servers, network failures must gracefully fallback  
**Scale/Scope**: Single mobile app, auth errors affect all production users

**Error Context from logs**:

- `AuthRetryableFetchError: Network request failed` - production APK cannot reach Supabase servers
- `AuthSessionMissingError: Auth session missing!` - session persistence issues between development and production
- App correctly falls back to local anonymous users but real auth fails
- Supabase client initializing with `http://127.0.0.1:54321` (emulator URL) in production build

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Simplicity**:

- Projects: 1 (mobile app) ✅
- Using framework directly? ✅ (Direct Supabase, no wrapper classes)
- Single data model? ✅ (Auth entities only)
- Avoiding patterns? ✅ (Repository already exists, reusing established patterns)

**Architecture**:

- EVERY feature as library? ✅ (lib/ directory structure followed)
- Libraries listed: auth (authentication), config (environment), testing (pre-release validation)
- CLI per library: npm scripts for testing, build validation commands
- Library docs: llms.txt format in CLAUDE.md ✅

**Testing (NON-NEGOTIABLE)**:

- RED-GREEN-Refactor cycle enforced? ✅ (TDD approach required)
- Git commits show tests before implementation? ✅ (Will enforce)
- Order: Contract→Integration→E2E→Unit strictly followed? ✅ (Test auth flow first)
- Real dependencies used? ✅ (Actual Supabase servers, not mocks)
- Integration tests for: authentication flows, production build validation
- FORBIDDEN: Implementation before test, skipping RED phase ✅

**Observability**:

- Structured logging included? ✅ (Existing auth logs show structure)
- Frontend logs → backend? ✅ (Auth errors logged locally and remotely)
- Error context sufficient? NEEDS IMPROVEMENT (Missing production environment context)

**Versioning**:

- Version number assigned? 003 (feature branch number)
- BUILD increments on every change? ✅ (Following existing patterns)
- Breaking changes handled? ✅ (Auth flow changes require migration plan)

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

**Structure Decision**: Mobile app structure - using existing React Native/Expo layout with lib/ and app/ directories

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

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Environment configuration → validation test tasks [P]
- Authentication flows → integration test tasks [P]
- Error handling → unit test tasks [P]
- Pre-release testing → CI/CD pipeline tasks
- Each contract endpoint → contract test task [P]
- Production build validation → E2E test tasks

**Ordering Strategy**:

- TDD order: Tests before implementation (contract tests → integration tests → implementation)
- Dependency order: Environment config → auth flows → error handling → pre-release pipeline
- Critical path: Fix production auth → implement testing → validate fix
- Mark [P] for parallel execution (independent test files)

**Key Task Categories**:

1. **Environment Configuration** (3-4 tasks): Build type detection, URL switching, validation
2. **Authentication Flow** (4-5 tasks): Session persistence, error handling, fallback mechanisms
3. **Testing Infrastructure** (5-6 tasks): Contract tests, integration tests, production validation
4. **CI/CD Integration** (3-4 tasks): Pre-release validation, automated testing, deployment gates

**Estimated Output**: 15-20 numbered, ordered tasks in tasks.md

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
- [x] Post-Design Constitution Check: PASS (no new violations introduced)
- [x] All NEEDS CLARIFICATION resolved (through research phase)
- [x] Complexity deviations documented (none required)

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
