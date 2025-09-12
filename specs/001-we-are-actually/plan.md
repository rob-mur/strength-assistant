# Implementation Plan: Test Infrastructure Repair & Constitutional Compliance

**Branch**: `001-we-are-actually` | **Date**: 2025-01-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/home/rob/Documents/Github/strength-assistant/specs/001-we-are-actually/spec.md`

**CRITICAL STATUS UPDATE**: User has identified that `devbox run test` is NOT passing, violating constitutional requirement. Current failing tests include missing TestDevice/TestApp infrastructure and timeout issues. The constitutional amendment for TypeScript validation is working, but tests must pass completely for constitutional compliance.

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
**PRIMARY CONSTITUTIONAL CRISIS**: The test suite is failing with 80+ tests requiring immediate repair to meet constitutional requirement that "devbox run test MUST pass completely before any commit". The failing tests need missing test infrastructure (TestDevice, TestApp) and timeout issue resolution. While TypeScript constitutional validation is working, full test passage is required for constitutional compliance.

**SECONDARY FEATURE**: Migrate from Firebase to Supabase for offline-first storage with automatic cloud sync, maintaining existing functionality while fixing test infrastructure.

## Technical Context
**Language/Version**: TypeScript/JavaScript (React Native with Expo)  
**Primary Dependencies**: Jest (testing), React Native Testing Library, TypeScript compiler (tsc), ESLint, Prettier, Expo, Firebase (current), Supabase (migration target)  
**Storage**: Firebase (current) → Supabase (target), local-first persistence with Legend State, AsyncStorage for device storage  
**Testing**: Jest with React Native Testing Library, `devbox run test` pipeline, contract/integration/unit test structure  
**Target Platform**: React Native cross-platform (iOS, Android, Web) + CI/CD pipeline  
**Project Type**: mobile - React Native app with comprehensive test infrastructure requirements  
**Performance Goals**: All tests must pass consistently, Jest execution time <2 minutes, immediate UI responsiveness for local operations  
**Constraints**: Must maintain backward compatibility with existing app functionality, zero data loss during migration, offline-capable with automatic sync  
**Scale/Scope**: ~373 existing tests across 30 test suites, currently 80+ failing tests requiring immediate repair to meet constitutional requirements

**Current Issue**: The constitutional amendment for TypeScript compilation succeeded but left 80+ failing Jest tests. These failures violate the constitutional principle that "`devbox run test` MUST pass completely before any commit" and need immediate resolution.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (single React Native app with test infrastructure repair)
- Using framework directly? ✅ Yes - using Jest, TypeScript, and React Native Testing Library directly
- Single data model? ✅ Yes - Test repair entities and Exercise/User data models
- Avoiding patterns? ✅ Yes - no complex testing abstractions, direct test fixes

**Architecture**:
- EVERY feature as library? N/A - this is infrastructure/testing repair, not user features
- Libraries listed: N/A - repairing existing test infrastructure
- CLI per library: N/A - leveraging existing `devbox run test` command
- Library docs: N/A - updating CLAUDE.md and constitutional documentation only

**Testing (NON-NEGOTIABLE)**:
- ❌ **CRITICAL FAILURE**: `devbox run test` is NOT passing (80+ failing tests)
- ✅ TypeScript compilation enforced (constitutional amendment working)
- ❌ Tests failing due to missing infrastructure (TestDevice, TestApp)
- ❌ Component tests timing out, violating execution requirements
- 🚨 **CONSTITUTIONAL VIOLATION**: Cannot commit with failing tests
- ✅ RED-GREEN-Refactor cycle will be enforced during repair
- ✅ Order: Contract→Integration→E2E→Unit maintained in repair approach
- ✅ Real dependencies used - no mocking changes, fixing actual test failures
- ✅ Integration tests for: Jest validation, test pipeline integrity

**Observability**:
- ✅ Structured logging included - Jest provides detailed test failure reporting
- N/A Frontend logs → backend (this is development/testing tooling)
- ✅ Error context sufficient - Jest failures provide file/line context

**Versioning**:
- ✅ Version number assigned: Constitutional amendment v2.3.0 (adding Jest validation)
- N/A BUILD increments (not changing user-facing functionality)  
- ✅ Breaking changes handled - backward compatible test repairs and constitutional updates

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
- **CRITICAL PATH**: Prioritize tasks to fix the 80+ failing tests and achieve constitutional compliance
- Generate tasks from contract interfaces and data model entities
- TestDevice implementation → highest priority (blocks most tests)
- TestApp implementation → high priority (integration tests)
- Component test timeout fixes → medium priority (specific component failures)
- Constitutional enforcement enhancement → lower priority (once tests pass)

**Ordering Strategy**:
- **Emergency Repair Order**: Constitutional violations first (failing tests must pass)
- **TDD Order**: Implement test infrastructure before dependent tests run
- **Dependency Order**: TestDevice → TestApp → Component fixes → Constitutional enhancements
- **Parallel Execution**: Mark independent infrastructure tasks with [P]
- **Validation Gates**: Each task must result in fewer failing tests

**Critical Task Categories**:
1. **Test Infrastructure Implementation** (Tasks 1-10): Implement missing TestDevice/TestApp
2. **Component Test Fixes** (Tasks 11-15): Fix timeout issues in existing tests  
3. **Constitutional Compliance** (Tasks 16-20): Enhance Jest validation and enforcement
4. **Validation & Cleanup** (Tasks 21-25): Ensure `devbox run test` passes completely

**Estimated Output**: 20-25 numbered, ordered tasks with emergency repair focus

**SUCCESS CRITERION**: `devbox run test` must pass 100% by task completion

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
- [x] Initial Constitution Check: PASS (with noted violations requiring repair)
- [x] Post-Design Constitution Check: PASS (constitutional violations documented and prioritized)
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*