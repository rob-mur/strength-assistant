# Implementation Plan: Local First Storage with Backup

**Branch**: `001-we-are-actually` | **Date**: 2025-09-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-we-are-actually/spec.md`

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
Migrate from Firebase to Supabase while maintaining local-first storage patterns for the strength assistant app. Focus on addressing test suite memory leaks and ensuring constitutional compliance where `devbox run test` returns binary 0/1 status for complete pass/fail verification.

## Technical Context
**Language/Version**: TypeScript 5.8.3, React Native 0.79.5, Node.js latest (via devbox), Expo 53.0.22  
**Primary Dependencies**: React Native, Expo Router, Firebase (current), Supabase (migration target), Legend State, React Native Paper  
**Storage**: Migration from Firebase Firestore to Supabase PostgreSQL with Legend State local-first sync engine  
**Testing**: Jest 29.7.0 with React Native Testing Library, devbox test runner with memory leak detection, constitutional TypeScript validation  
**Target Platform**: Cross-platform (iOS, Android, Web) with React Native/Expo  
**Project Type**: mobile - React Native app with offline-first architecture  
**Performance Goals**: Immediate local operations, background sync, 80+ passing Jest tests, memory leak elimination, **devbox run test <60 seconds execution**  
**Constraints**: Memory leaks in test suite causing failures, constitutional requirement for binary 0/1 test status, offline-first user experience  
**Scale/Scope**: Simple exercise data model, focus on migration infrastructure and test suite stabilization

**User Feedback Integration**: 
1. Test suite memory leaks detected by Jest leak detection
2. `devbox run test` constitutional compliance requires binary 0/1 exit status
3. Test constitution needs updating to validate complete pass/fail scenarios

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (React Native app - mobile architecture - PASS)
- Using framework directly? Yes (Expo, React Native, Firebase, Supabase direct usage - PASS)
- Single data model? Yes (Exercise entity without DTOs - PASS)
- Avoiding patterns? Yes (existing ExerciseRepo pattern justified for data layer abstraction - PASS)

**Architecture**:
- EVERY feature as library? VIOLATION - This is primarily infrastructure/migration work within existing app
- Libraries listed: Test infrastructure utilities (TestDevice, TestApp), constitutional validation
- CLI per library: N/A for this migration feature
- Library docs: N/A for internal migration work

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? YES - tests currently failing, need fixing before implementation
- Git commits show tests before implementation? YES - constitutional requirement active
- Order: Contract→Integration→E2E→Unit strictly followed? YES - will follow for new test infrastructure
- Real dependencies used? YES - existing Firebase/Supabase real connections in tests
- Integration tests for: YES - migration requires contract testing between storage layers
- FORBIDDEN: Implementation before test, skipping RED phase - ENFORCED

**Observability**:
- Structured logging included? EXISTING - React Native exception handler and logging present
- Frontend logs → backend? N/A - mobile app with cloud sync
- Error context sufficient? YES - existing error handling patterns

**Versioning**:
- Version number assigned? 1.0.0 (MAJOR.MINOR.BUILD format - PASS)
- BUILD increments on every change? NEEDS IMPLEMENTATION
- Breaking changes handled? YES - this IS the migration plan for breaking changes

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

**Structure Decision**: Option 3 (Mobile + API) - React Native Expo app with existing architecture - preserving current structure

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
- **Priority 1**: Fix test suite memory leaks and binary exit code enforcement
- **Priority 2**: Implement missing test infrastructure (TestDevice, TestApp)
- **Priority 3**: Update scripts/test.sh for constitutional compliance
- Each failing test → systematic repair task with memory constraints
- Each missing contract → implementation task with sequential processing
- Constitutional enforcement → validation and amendment tasks

**Ordering Strategy**:
- **Sequential Processing**: All tasks must run sequentially to prevent memory exhaustion
- **Constitutional Order**: Test infrastructure before test fixes before feature work
- **Memory-Safe Implementation**: Tasks designed to work within 32GB memory limits
- **Binary Validation**: Every phase must validate `devbox run test` returns 0 (pass) or 1 (fail)

**User Feedback Integration**:
1. **Binary Exit Code Task**: Update test script to return proper exit codes for constitutional validation
2. **Memory Leak Resolution**: Implement systematic test cleanup and memory management
3. **Constitutional Compliance**: Tasks that only complete when `devbox run test` returns 0

**Estimated Output**: 15-20 numbered, sequential tasks in tasks.md focusing on test infrastructure and constitutional compliance

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
| Library-first architecture | Infrastructure/migration work within existing React Native app | Creating separate libraries for migration scripts would add unnecessary complexity and deviate from React Native architectural patterns |


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
- [x] Initial Constitution Check: PASS (with justified complexity deviation)
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*