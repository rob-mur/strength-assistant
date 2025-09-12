# Implementation Plan: Constitutional Amendment v2.6.0 - Task Completion Validation

**Branch**: `001-we-are-actually` | **Date**: 2025-09-12 | **Spec**: [Local First Storage with Backup](./spec.md)
**Input**: Constitutional change request: "What I want is that at the end of each task you state whether you expect the tests to pass or fail - and ideally check this against devbox run test. This will mean that we will need to improve the performance of the tests to meet our targets, but given that none of the tests are running on device they should be rapid"

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
Constitutional Amendment v2.6.0 introduces mandatory task completion validation requiring explicit test expectation statements and validation against `devbox run test` execution. This addresses current issues with skipped Jest tests and enforces rapid test execution performance for non-device tests.

## Technical Context
**Language/Version**: TypeScript 5.8.3, React Native 0.79.5, Expo 53.0.22  
**Primary Dependencies**: Jest 29.7.0, React Native Testing Library, Expo Router, Firebase, Supabase  
**Storage**: Firebase (current) → Supabase PostgreSQL + Legend State (local-first)  
**Testing**: Jest with devbox wrapper, constitutional enforcement via exit codes  
**Target Platform**: Mobile (Android/iOS) with web support  
**Project Type**: mobile - React Native Expo app with API integrations  
**Performance Goals**: <60 second test suite, <50ms local operations, <2s sync operations  
**Constraints**: Memory limit management (32GB system), offline-first required, constitutional compliance mandatory  
**Scale/Scope**: 80+ existing tests, constitutional governance framework, dual backend migration
**Constitutional Amendment Context**: User concern - "I am uncomfortable continuing with this testing strategy whilst the tests are being skipped jest. I have removed the skip so that they will run. this highlights a necesssary change to the consitution though - What I want is that at the end of each task you state whether you expect the tests to pass or fail - and ideally check this against devbox run test. This will mean that we will need to improve the performance of the tests to meet our targets, but given that none of the tests are running on device they should be rapid"

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (mobile app with test infrastructure)
- Using framework directly? YES (React Native, Expo, Jest directly)
- Single data model? YES (Exercise entity with sync metadata)
- Avoiding patterns? YES (no unnecessary abstraction layers)

**Architecture**:
- EVERY feature as library? N/A (mobile app architecture)
- Libraries listed: Test infrastructure (TestDevice, TestApp, MockFactories, TestDataBuilders) + Constitutional framework
- CLI per library: N/A (mobile app focus)
- Library docs: Constitutional amendments as structured docs

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? YES (TDD approach with failing tests first)
- Git commits show tests before implementation? YES (contract tests before implementation)
- Order: Contract→Integration→E2E→Unit strictly followed? YES (current phase executing contracts)
- Real dependencies used? YES (actual test infrastructure, not mocked)
- Integration tests for: new libraries, contract changes, shared schemas? YES (Phase 3.3 integration tests)
- FORBIDDEN: Implementation before test, skipping RED phase? ENFORCED by Amendment v2.5.0

**NEW CONSTITUTIONAL REQUIREMENT (Amendment v2.6.0)**:
- Task completion validation MANDATORY? YES
- Expected test outcome declaration required? YES (pass/fail prediction)
- Post-task `devbox run test` validation required? YES (binary exit code check)
- Rapid test execution enforced? YES (<60 second target, optimized for non-device tests)
- Skip/ignore patterns forbidden? YES (user removed skips, all tests must run)

**Observability**:
- Structured logging included? Constitutional logging via amendment tracking
- Frontend logs → backend? N/A (mobile app with local-first approach)
- Error context sufficient? YES (detailed constitutional violation reporting)

**Versioning**:
- Version number assigned? Amendment v2.6.0 (constitutional versioning)
- BUILD increments on every change? YES (amendment tracking)
- Breaking changes handled? YES (constitutional amendment process)

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

**Structure Decision**: Option 3 - Mobile app structure with existing React Native/Expo architecture

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


## Phase 0: Research Complete ✅

Research findings documented in `research.md` with comprehensive analysis of Amendment v2.6.0 requirements:
- ✅ Task completion validation protocol designed
- ✅ Test expectation declaration framework specified
- ✅ Performance optimization strategies identified
- ✅ Constitutional integration approach planned
- ✅ Risk mitigation strategies documented

**Output**: research.md updated with Amendment v2.6.0 analysis

## Phase 1: Design & Contracts ✅

Phase 1 complete with constitutional amendment contracts and integration designs:

### 1. Constitutional Amendment Contract ✅
Created comprehensive Amendment v2.6.0 contract in `/contracts/constitutional-amendment-v260.ts`:
- Task completion validation interfaces
- Performance monitoring contracts
- Constitutional enforcement mechanisms
- Integration with existing amendments (v2.4.0, v2.5.0)

### 2. Task Completion Template ✅
Standardized template created in `/contracts/task-completion-template.md`:
- Mandatory test expectation declaration format
- Post-task validation execution protocol
- Performance analysis requirements
- Constitutional compliance checklist

### 3. Test Performance Contract ✅
Performance requirements defined in `/contracts/test-performance.ts`:
- <60 second execution target contracts
- Memory usage monitoring (<8GB constitutional limit)
- Performance optimization interfaces
- Bottleneck detection and remediation

### 4. Constitutional Integration ✅
Amendment v2.6.0 added to `/home/rob/Documents/Github/strength-assistant/CLAUDE.md`:
- Active enforcement status documented
- Task completion protocol specified
- Integration with Amendment v2.5.0 (binary exit codes)
- Success validation criteria defined

**Output**: 
- `contracts/constitutional-amendment-v260.ts` - Core amendment contract
- `contracts/task-completion-template.md` - Standardized completion template  
- `contracts/test-performance.ts` - Performance monitoring contracts
- Updated `CLAUDE.md` with Amendment v2.6.0 active status

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy for Amendment v2.6.0 Implementation**:

### Constitutional Amendment Implementation Tasks
1. **Amendment Contract Tests** → Create contract tests for Amendment v2.6.0 interfaces [P]
2. **Task Completion Template Integration** → Implement template validation system [P]  
3. **Performance Monitoring Implementation** → Build test performance tracking system
4. **Constitutional Integration** → Integrate v2.6.0 with existing amendments (v2.4.0, v2.5.0)

### Test Performance Optimization Tasks
5. **Jest Configuration Optimization** → Optimize Jest for <60 second execution target
6. **Memory Usage Optimization** → Implement memory constraint compliance (<8GB)
7. **Test Suite Caching** → Implement TypeScript compilation and test result caching
8. **Selective Test Execution** → Build affected tests only execution system

### Enforcement Mechanism Tasks  
9. **Pre-commit Hook Enhancement** → Add v2.6.0 validation to pre-commit hooks
10. **CI/CD Pipeline Integration** → Integrate amendment validation into CI/CD
11. **Task Completion Validation** → Build automated task completion format validation
12. **Performance Gate Enforcement** → Implement performance compliance gates

### Learning and Improvement Tasks
13. **Prediction Accuracy Tracking** → Build test prediction accuracy measurement system
14. **Learning Insights Generation** → Create prediction improvement recommendation system
15. **Constitutional Compliance Monitoring** → Continuous compliance tracking and reporting

**Ordering Strategy**:
- **TDD order**: Contract tests before implementation (tasks 1, then implementation)
- **Constitutional priority**: Amendment integration before enforcement (tasks 2-4 before 9-12)
- **Performance focus**: Optimization tasks in parallel where possible [P]
- **Learning loop**: Tracking systems after core implementation (tasks 13-15 last)

**Estimated Output**: 15-20 numbered, ordered tasks in tasks.md focusing on Amendment v2.6.0 implementation

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - Amendment v2.6.0 analysis complete
- [x] Phase 1: Design complete (/plan command) - Constitutional contracts and integration complete
- [x] Phase 2: Task planning complete (/plan command - describe approach only) - Task generation strategy defined
- [ ] Phase 3: Tasks generated (/tasks command) - Ready for execution
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS - v2.6.0 constitutional requirements validated
- [x] Post-Design Constitution Check: PASS - Amendment contracts integrate with existing framework
- [x] All NEEDS CLARIFICATION resolved - User requirements clarified and contracts designed
- [ ] Complexity deviations documented - No constitutional violations identified

**Constitutional Amendment Status**:
- [x] Amendment v2.6.0: ACTIVE - Task completion validation requirements in effect
- [x] Amendment v2.5.0: INTEGRATED - Binary exit code validation extended
- [x] Amendment v2.4.0: COMPATIBLE - Test governance framework enhanced
- [x] Performance Requirements: DEFINED - <60 second target with <8GB memory constraint
- [x] Enforcement Mechanisms: SPECIFIED - Pre-commit hooks, CI/CD integration, learning loop

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*