# Implementation Plan: Jest Test Suite Repair & Constitutional Enhancement

**Branch**: `001-we-are-actually` | **Date**: 2025-01-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/home/rob/Documents/Github/strength-assistant/specs/001-we-are-actually/spec.md`

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
Fix failing Jest tests in the test suite and enhance the constitution to prevent regression. While the TypeScript constitutional amendment successfully enforced TypeScript compilation, 80 failing Jest tests remain that need repair. Additionally, update the constitution to include Jest test success validation to prevent future test failures from being overlooked.

## Technical Context
**Language/Version**: TypeScript/JavaScript (React Native with Expo)  
**Primary Dependencies**: Jest (testing), React Native Testing Library, TypeScript compiler (tsc), ESLint, Prettier, Expo  
**Storage**: Local file system (test files, Jest configuration, constitutional amendments)  
**Testing**: Jest with React Native Testing Library, `devbox run test` pipeline includes TypeScript + Jest validation  
**Target Platform**: React Native cross-platform (iOS, Android, Web) + CI/CD pipeline  
**Project Type**: mobile - React Native app requiring comprehensive test suite validation  
**Performance Goals**: All tests must pass consistently, Jest execution time <2 minutes  
**Constraints**: Must maintain backward compatibility with existing test files while ensuring 100% test passage  
**Scale/Scope**: ~373 existing tests across 30 test suites, with 80 currently failing that need immediate repair  

**Current Issue**: The constitutional amendment for TypeScript compilation succeeded but left 80 failing Jest tests. These failures violate the constitutional principle that "`devbox run test` MUST pass completely before any commit" and need immediate resolution.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (single React Native app with test infrastructure repair)
- Using framework directly? Yes - using Jest, TypeScript, and React Native Testing Library directly
- Single data model? Yes - Test repair entities and constitutional amendment tracking
- Avoiding patterns? Yes - no complex testing abstractions, direct test fixes

**Architecture**:
- EVERY feature as library? N/A - this is infrastructure/testing repair, not user features
- Libraries listed: N/A - repairing existing test infrastructure
- CLI per library: N/A - leveraging existing `devbox run test` command
- Library docs: N/A - updating constitution and testing docs only

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? ✅ This plan addresses the critical issue: ALL tests MUST pass
- `devbox run test` MUST pass completely before any commit? ✅ This is the core problem being solved
- Git commits show tests before implementation? ✅ Will fix failing tests before any new features
- Order: Contract→Integration→E2E→Unit strictly followed? ✅ Maintained in repair approach
- Real dependencies used? ✅ No mocking changes - fixing actual test failures
- Integration tests for: Jest validation, test pipeline integrity ✅ Will add validation infrastructure
- FORBIDDEN: Committing code with failing tests ✅ Core constitutional enhancement

**Observability**:
- Structured logging included? ✅ Jest provides detailed test failure reporting
- Frontend logs → backend? N/A - this is development/testing tooling
- Error context sufficient? ✅ Jest failures provide file/line context

**Versioning**:
- Version number assigned? Constitutional amendment v2.3.0 (adding Jest validation)
- BUILD increments on every change? N/A - not changing user-facing functionality  
- Breaking changes handled? ✅ Backward compatible test repairs and constitutional updates

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

**Structure Decision**: Using existing React Native app structure with enhanced test infrastructure repair

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

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

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
- [ ] Phase 0: Research complete (/plan command)
- [ ] Phase 1: Design complete (/plan command)
- [ ] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [ ] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All NEEDS CLARIFICATION resolved
- [ ] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*