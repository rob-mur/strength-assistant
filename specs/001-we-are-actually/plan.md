# Implementation Plan: TypeScript Testing Infrastructure & Constitution Update

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
Implement robust TypeScript testing infrastructure to prevent compilation errors in test pipeline and update the project constitution to mandate strict TypeScript validation as part of the testing requirements. The primary goal is ensuring `devbox run test` passes consistently with proper TypeScript compilation, addressing the critical issue where TypeScript errors prevent test execution.

## Technical Context
**Language/Version**: TypeScript/JavaScript (React Native with Expo)  
**Primary Dependencies**: Jest (testing), TypeScript compiler (tsc), ESLint, Prettier, React Native Testing Library, Expo  
**Storage**: Local file system (TypeScript config, Jest config, test files)  
**Testing**: Jest with React Native Testing Library, `devbox run test` pipeline includes TypeScript compilation
**Target Platform**: React Native cross-platform (iOS, Android, Web)
**Project Type**: mobile - React Native app requiring strict TypeScript validation in CI/testing  
**Performance Goals**: TypeScript compilation must complete without errors before test execution  
**Constraints**: Must maintain backward compatibility with existing test files while enforcing strict TypeScript validation  
**Scale/Scope**: ~373 existing tests across 30 test suites, prevent regression of TypeScript compilation issues

**Migration Context**: The issue is that `devbox run test` includes TypeScript compilation checks that are currently failing, blocking the entire test suite execution. This violates the fundamental testing principle that tests must be runnable at all times.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (single React Native app with testing infrastructure)
- Using framework directly? Yes - using Jest, TypeScript, and ESLint directly without wrappers
- Single data model? Yes - TypeScript configuration and test validation rules
- Avoiding patterns? Yes - no complex testing abstractions, direct toolchain integration

**Architecture**:
- EVERY feature as library? N/A - this is infrastructure/tooling update, not user features
- Libraries listed: N/A - updating existing testing pipeline configuration
- CLI per library: N/A - leveraging existing `devbox run test` command
- Library docs: N/A - updating constitution and testing docs only

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? ✅ This plan addresses the critical issue: tests MUST be runnable
- `devbox run test` MUST pass before any feature is considered complete? ✅ This is the core problem being solved
- Git commits show tests before implementation? ✅ Will add pre-commit TypeScript validation
- Order: Contract→Integration→E2E→Unit strictly followed? ✅ Maintained in updated pipeline
- Real dependencies used? ✅ No mocking changes - fixing actual TypeScript compilation
- Integration tests for: TypeScript validation, test pipeline integrity ✅ Will add validation tests
- FORBIDDEN: Committing code that breaks `devbox run test` compilation ✅ Core constitutional addition

**Observability**:
- Structured logging included? ✅ TypeScript compiler provides detailed error reporting
- Frontend logs → backend? N/A - this is development tooling
- Error context sufficient? ✅ TypeScript errors provide file/line context

**Versioning**:
- Version number assigned? No version change needed - infrastructure fix
- BUILD increments on every change? N/A - not changing user-facing functionality  
- Breaking changes handled? ✅ Backward compatible TypeScript configuration updates

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

**Structure Decision**: Using existing React Native app structure with enhanced testing infrastructure configuration

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
- TypeScript validation contract → contract test task [P]
- Constitutional amendment contract → constitutional validation test task [P]
- Pre-commit hook implementation → configuration task
- Constitution update → formal amendment process task
- **MANDATORY: Final task must be "Run `devbox run test` and fix all issues"**

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Constitutional amendment before technical implementation
- Pre-commit hooks before final validation
- All tasks must result in `devbox run test` passing
- Mark [P] for parallel execution (independent files)

**Quality Gates**:
- Each implementation task includes test success validation
- No task is complete until its tests pass in `devbox run test`
- Final validation task ensures entire test suite passes
- Constitutional compliance verification at each stage

**Estimated Output**: 15-20 numbered, ordered tasks in tasks.md + mandatory test validation

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
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v2.2.0 - See `/memory/constitution.md`*