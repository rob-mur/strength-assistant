# Implementation Plan: Local First Storage with Backup

**Branch**: `001-we-are-actually` | **Date**: 2025-09-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/home/rob/Documents/Github/strength-assistant/specs/001-we-are-actually/spec.md`

## 🚨 CRITICAL SUCCESS CRITERIA 🚨

**BEFORE ANY FEATURE IS CONSIDERED COMPLETE:**
- **`devbox run test` MUST pass successfully**
- This includes: Package lock validation, TypeScript checks, ESLint, Format checking, Jest tests
- Integration tests can run in CI (due to speed), but all unit tests must pass locally
- No implementation is complete until all code quality checks pass

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
Migrate from Firebase to Supabase for both authentication and storage while maintaining local-first architecture with automatic backup capabilities. Implementation uses Legend State for automatic sync engine with Supabase backend, feature flags for gradual migration, and comprehensive testing to ensure functionality parity.

## Technical Context
**Language/Version**: TypeScript/JavaScript (React Native with Expo)  
**Primary Dependencies**: Legend State (sync engine), Supabase (backend), React Native Paper (UI), Expo Router (navigation)  
**Storage**: Supabase (PostgreSQL backend), Legend State (local persistence with sync)  
**Testing**: Jest (unit tests), React Native Testing Library (component tests), Maestro (E2E tests)  
**Target Platform**: React Native cross-platform (iOS, Android, Web)
**Dependency Management**: Devbox (Nix) for reproducible development environment with lock file for CI/local parity
**Project Type**: mobile - React Native app with cloud backend  
**Performance Goals**: Immediate UI responsiveness, no noticeable pauses for data operations  
**Constraints**: Local-first operations, offline capability, data consistency across devices  
**Scale/Scope**: Simple exercise data, small data footprint, single-user focused with cross-device sync

**Migration Context**: Currently mid-migration from Firebase to Supabase. Completed: initial Supabase infra, data layer interfaces, Legend State offline persistence, feature flag foundation. Remaining: Supabase authentication with feature flagging, comprehensive testing, Firebase removal.

**CRITICAL TEST REQUIREMENT**: All implementations must pass `devbox run test` before completion. This includes:
- Package lock validation (`npm ci --dry-run`)
- TypeScript compilation (`npx tsc`)
- ESLint code quality (`npm run lint`)
- Prettier formatting (`npm run format:check`)
- Jest unit tests (`npx jest`)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: [#] (max 3 - e.g., api, cli, tests)
- Using framework directly? (no wrapper classes)
- Single data model? (no DTOs unless serialization differs)
- Avoiding patterns? (no Repository/UoW without proven need)

**Architecture**:
- EVERY feature as library? (no direct app code)
- Libraries listed: [name + purpose for each]
- CLI per library: [commands with --help/--version/--format]
- Library docs: llms.txt format planned?

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? (test MUST fail first)
- `devbox run test` MUST pass before any feature is considered complete
- Git commits show tests before implementation?
- Order: Contract→Integration→E2E→Unit strictly followed?
- Real dependencies used? (actual DBs, not mocks)
- Integration tests for: new libraries, contract changes, shared schemas?
- FORBIDDEN: Implementation before test, skipping RED phase, declaring completion without test success

**Observability**:
- Structured logging included?
- Frontend logs → backend? (unified stream)
- Error context sufficient?

**Versioning**:
- Version number assigned? (MAJOR.MINOR.BUILD)
- BUILD increments on every change?
- Breaking changes handled? (parallel tests, migration plan)

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

**Structure Decision**: [DEFAULT to Option 1 unless Technical Context indicates web/mobile app]

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
*Prerequisites: research.md complete*

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

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass
- **MANDATORY: Final task must be "Run `devbox run test` and fix all issues"**

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)
- **All tasks must result in `devbox run test` passing**

**Quality Gates**:
- Each implementation task includes test success validation
- No task is complete until its tests pass in `devbox run test`
- Final validation task ensures entire test suite passes

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md + mandatory test validation

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

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
- [ ] Complexity deviations documented

**🚨 CRITICAL SUCCESS GATES**:
- [ ] `devbox run test` passes after each implementation task
- [ ] All TypeScript compilation errors resolved
- [ ] All ESLint issues fixed
- [ ] All formatting issues resolved with Prettier
- [ ] All Jest unit tests passing
- [ ] Package lock file properly synchronized
- [ ] Final feature validation: `devbox run test` successful

## Implementation Guidelines for Future Tasks

### Test-First Development Process

1. **Before Starting Implementation**:
   - Ensure all contract tests are written and failing
   - Validate that `devbox run test` runs without crashing (tests can fail, but build must work)

2. **During Implementation**:
   - Run `devbox run test` frequently to catch issues early  
   - Fix TypeScript, ESLint, and formatting issues immediately
   - Do not accumulate technical debt

3. **Before Task Completion**:
   - `devbox run test` MUST pass successfully
   - All code quality checks must be green
   - No implementation task is complete until this validation passes

4. **Integration Test Strategy**:
   - Unit tests run locally and must pass (`devbox run test`)
   - Integration tests can be slower and run in CI
   - E2E tests run in CI for full system validation

### Debugging Test Failures

When `devbox run test` fails:
1. **Package Lock Issues**: Run `npm install` and commit lock file changes
2. **TypeScript Errors**: Fix type errors, add proper interfaces
3. **ESLint Issues**: Run `npm run lint:fix` and address remaining issues
4. **Formatting**: Run `npm run format` to fix formatting
5. **Jest Failures**: Debug test logic, fix implementation, or update test expectations

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*