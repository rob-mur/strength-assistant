# Implementation Plan: Fix Android Integration Test Bug

**Branch**: `010-fix-android-integration` | **Date**: 2025-09-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/010-fix-android-integration/spec.md`

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

Fix Android integration test reporting false positives due to improper exit code handling, and resolve underlying Maestro test failures caused by EAS environment variable misconfiguration in the build process. Solution requires fixing test script exit code propagation and ensuring correct Supabase environment variables are configured for both testing and production builds.

## Technical Context

**Language/Version**: TypeScript/JavaScript with React Native/Expo
**Primary Dependencies**: Expo SDK, Maestro (integration testing), EAS Build, Supabase
**Storage**: Supabase (PostgreSQL) for backend services
**Testing**: Jest + React Native Testing Library (unit), Maestro (integration), devbox (local environment)
**Target Platform**: Android (focus on integration testing and CI/CD pipeline)
**Project Type**: mobile - React Native app with Supabase backend
**Performance Goals**: Reliable test execution with accurate pass/fail reporting
**Constraints**: Must work in both local devbox and CI environments, anonymous user testing only
**Scale/Scope**: Integration test suite with multiple Maestro flows, production validation required

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### I. Local Testing First ✅
- Changes will be tested locally using devbox before CI/CD
- Fix will be validated in local environment first
- Devbox configuration ensures reproducible testing

### II. Test-Driven Development ✅
- Integration tests (Maestro) already exist but failing
- Fix will ensure tests accurately report failures
- Production validation tests must pass

### III. CI/CD Infrastructure as Code ✅
- GitHub Actions workflows are version controlled
- EAS build configuration will be updated declaratively
- Build processes use consistent environment configuration

### IV. Anonymous User Testing ✅
- Production testing uses fresh anonymous users
- No persistent test data cleanup required
- Follows established pattern

### V. Progressive Validation ✅
- Fix follows: unit tests → integration tests → production validation → deployment
- Each stage must pass before proceeding
- Production validation tests actual production infrastructure

**Status**: PASS - All constitutional principles satisfied

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

**Structure Decision**: Option 3 (Mobile + API) - React Native app with Supabase backend

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

Based on the research findings and contracts, the /tasks command will generate tasks focusing on:

1. **Critical Exit Code Fix Tasks**:
   - Fix GitHub Action exit code handling in `.github/actions/maestro-test/action.yml`
   - Update test script exit code propagation in `scripts/integration_test_android.sh`
   - Create validation tests for exit code handling

2. **Environment Variable Configuration Tasks**:
   - Set EAS environment variables for production profile
   - Validate environment variable loading in each build profile
   - Update environment validation scripts

3. **Testing and Validation Tasks**:
   - Create test cases for proper success/failure reporting
   - Validate Android emulator networking (10.0.2.2)
   - Create production validation test procedures

**Ordering Strategy**:

1. **Phase 2a**: Exit code handling fix (highest priority)
   - Tasks 1-3: Fix GitHub Actions and test scripts
2. **Phase 2b**: Environment variable configuration
   - Tasks 4-6: EAS setup and validation
3. **Phase 2c**: Testing and validation
   - Tasks 7-9: Comprehensive testing of fixes

**Dependencies**:
- Exit code fix must be completed before environment testing
- Local testing must pass before CI testing
- CI testing must pass before production validation

**Estimated Output**: 20 numbered, ordered tasks in tasks.md

**Special Considerations**:
- Mark GitHub Action changes as [CRITICAL] - affects all CI
- Mark environment variable tasks as [EAS] - requires EAS CLI access
- Mark validation tasks as [TEST] - requires local and CI environments

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
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
