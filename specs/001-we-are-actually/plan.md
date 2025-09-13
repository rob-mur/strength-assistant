# Implementation Plan: Production Test Readiness

**Branch**: `001-we-are-actually` | **Date**: 2025-09-13 | **Spec**: /home/rob/Documents/Github/strength-assistant/specs/001-we-are-actually/spec.md
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
Local-first storage feature implementation with Firebase-to-Supabase migration is functionally complete, but requires production test readiness with 122 failing Jest tests preventing CI success. Primary focus: systematic test repair, infrastructure stabilization, and constitutional compliance for production deployment.

## Technical Context
**Language/Version**: TypeScript/React Native with Expo (Node.js testing environment)  
**Primary Dependencies**: @legendapp/state, @supabase/supabase-js, @react-native-firebase/*, Jest, Testing Library  
**Storage**: Firebase Firestore (legacy) + Supabase PostgreSQL (target) with feature flag switching  
**Testing**: Jest with React Native Testing Library, Storybook for components  
**Target Platform**: iOS/Android mobile + web (cross-platform React Native)
**Project Type**: mobile - React Native app with dual backend support  
**Performance Goals**: <60s test suite execution, instant offline-first UX, background sync  
**Constraints**: Constitutional requirement for 100% test passage, zero TypeScript errors, CI-ready  
**Scale/Scope**: Small dataset (exercises), 420 total tests, dual authentication (email/anonymous)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Constitutional Compliance (Amendment v2.6.0)**:
- ❌ Test Governance: 122/420 tests failing, violates "devbox run test MUST achieve 100% pass rate"
- ❌ Exit Code Enforcement: devbox run test returns exit code 1 (failure) vs required 0 (success)
- ✅ TypeScript Compilation: npx tsc --noEmit passes successfully
- ❌ Pre-commit Validation: Cannot commit until all tests pass (constitutional requirement)
- ❌ CI/CD Readiness: Failing tests block deployment pipeline

**Test Infrastructure Issues**:
- Jest worker child process exceptions (resource management)
- Supabase client initialization failures in test environment
- Component test timeouts in AuthAwareLayout tests
- Mock factory inconsistencies causing assertion failures

**Immediate Constitutional Violations**:
- Test failure tolerance: ZERO allowed per Amendment v2.4.0
- Binary exit code requirement: Must return 0 for constitutional compliance
- Systematic repair requirement: All 122 failures must be catalogued and fixed

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

**Test Repair Task Generation Strategy**:
- Categorize 122 failing tests by priority (P0: Foundation, P1: Backend, P2: Component, P3: Quality)
- Generate systematic repair tasks from research.md priority matrix
- Each Jest worker issue → foundation stability task [P0]
- Each Supabase mock issue → backend integration task [P1]
- Each component timeout → React Native act() wrapper task [P2]
- Each mock inconsistency → factory consistency task [P3]

**Constitutional Compliance Tasks**:
- Task completion validation (Amendment v2.6.0)
- Binary exit code validation (Amendment v2.5.0)
- Performance monitoring (<60s execution time)
- Test infrastructure completeness validation

**Ordering Strategy**:
- Priority order: P0 → P1 → P2 → P3 (must be sequential within priority)
- Constitutional validation after each priority phase
- Mark [P] for parallel execution within same priority level
- Each task includes expected outcome prediction

**Estimated Output**: 15-20 systematic test repair tasks in tasks.md focusing on production readiness

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
- [x] Phase 0: Research complete (/plan command) - research.md created with test failure analysis
- [x] Phase 1: Design complete (/plan command) - data-model.md updated, contracts verified, quickstart.md enhanced
- [x] Phase 2: Task planning complete (/plan command - describe approach only) - systematic repair strategy defined
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: DOCUMENTED (violations cataloged, requires systematic repair)
- [x] Post-Design Constitution Check: DOCUMENTED (design addresses all violations through test infrastructure)
- [x] All NEEDS CLARIFICATION resolved (technical context fully specified)
- [x] Complexity deviations documented (constitutional violations justified as blocking issues)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*