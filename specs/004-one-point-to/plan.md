# Implementation Plan: Production Server Testing Enhancement

**Branch**: `004-one-point-to` | **Date**: 2025-09-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-one-point-to/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Enhance existing production testing to validate applications against actual production server configuration using parameterized GitHub Actions and devbox for reproducible CI. Tests run post-deployment using production APK builds with existing Maestro flows, enabling early detection of environment-specific issues while maintaining test isolation through anonymous users.

## Technical Context

**Language/Version**: TypeScript/JavaScript with React Native, Expo 53.0.22, Node.js (latest via devbox)  
**Primary Dependencies**: GitHub Actions, devbox (for dependency management), Maestro (test automation), Expo CLI  
**Storage**: N/A (CI/CD pipeline infrastructure enhancement)  
**Testing**: Jest (unit), Maestro (integration), existing workflow orchestration  
**Target Platform**: Ubuntu Linux GitHub Actions runners, Android APK testing
**Project Type**: mobile - React Native/Expo app with CI/CD enhancement  
**Performance Goals**: Fast test execution (existing tests designed to be relatively fast), pipeline efficiency  
**Constraints**: Must run post-deployment, use devbox for reproducibility, parameterized actions for reusability  
**Scale/Scope**: Single production validation workflow with 2 reusable GitHub Actions (Android build + Maestro test)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Infrastructure as Code**: ✅ PASS - GitHub Actions workflows are version controlled and declarative  
**Reproducibility**: ✅ PASS - devbox ensures consistent dependency management across environments  
**Test-First Approach**: ✅ PASS - Enhancing existing test infrastructure, no new business logic  
**Reusability**: ✅ PASS - Creating parameterized GitHub Actions for DRY principle  
**Isolation**: ✅ PASS - Anonymous users ensure test isolation without data cleanup needs  
**Observability**: ✅ PASS - GitHub Actions provide native logging and artifact collection

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
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

Based on the parameterized GitHub Actions approach and infrastructure focus:

- Create GitHub Actions composite actions (android-build, maestro-test) [P]
- Update existing integration workflows to use new parameterized actions [P]  
- Create production validation workflow using parameterized actions
- Update production build workflow to run after all tests pass
- Remove redundant deployment gate and frontend deployment examples per user feedback
- Test parameterized actions locally using devbox for reproducibility

**Ordering Strategy**:

1. **Foundation Tasks** [P]: Create parameterized GitHub Actions with proper devbox integration
2. **Integration Tasks**: Update existing workflows to use new actions (integration tests first for safety)
3. **Production Tasks**: Implement production validation workflow with proper triggers
4. **Pipeline Tasks**: Update workflow orchestration for production APK → validation flow
5. **Cleanup Tasks**: Remove unnecessary example workflows as requested

**Key Dependencies**:
- Parameterized actions must be created before workflow updates
- Integration tests should be updated first to validate action functionality  
- Production validation depends on production APK build workflow
- All changes use existing devbox configurations for consistency

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
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (N/A - no violations)

---

_Based on Constitution v1.0.0 - See `/memory/constitution.md`_
