# Implementation Plan: Local First Storage with Backup

**Branch**: `001-we-are-actually` | **Date**: 2025-09-12 | **Spec**: [spec.md](./spec.md)
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
**Local-first storage with automatic cloud synchronization** - Migrating from Firebase to Supabase to provide offline-first architecture where all data operations are immediate on device, with background sync to cloud when online. Focus on maintaining existing app functionality while building robust test infrastructure and constitutional compliance framework.

## Technical Context
**Language/Version**: TypeScript 5.8.3, React Native 0.79.5, Expo 53.0.22  
**Primary Dependencies**: React Native Paper, Expo Router, Legend State, Supabase, Firebase (legacy)  
**Storage**: Supabase (target), Firebase (current), local SQLite via Legend State  
**Testing**: Jest 29.7.0, React Native Testing Library, Constitutional testing framework  
**Target Platform**: iOS 15+, Android 8+, Web browsers
**Project Type**: mobile - React Native Expo app with file-based routing  
**Performance Goals**: <60 second test suite, snappy local operations, background sync  
**Constraints**: Offline-capable, <8GB memory (constitutional), zero data loss migration  
**Scale/Scope**: Simple exercise data model, cross-device sync, dual backend support

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (React Native Expo app with constitutional framework)
- Using framework directly? YES (React Native, Expo Router, Legend State)
- Single data model? YES (Exercise entity with sync metadata)
- Avoiding patterns? YES (Repository pattern exists but justified for dual backend)

**Architecture**:
- EVERY feature as library? NO - Mobile app architecture with lib/ directory
- Libraries listed: 
  - constitutional framework (Amendment v2.6.0)
  - test infrastructure (TestDevice, mocks)
  - storage abstraction (dual Firebase/Supabase)
- CLI per library: N/A (mobile app, not CLI-based)
- Library docs: Constitutional amendments in CLAUDE.md

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? YES (Constitutional Amendment v2.6.0)
- Git commits show tests before implementation? YES (TDD required)
- Order: Contract→Integration→E2E→Unit strictly followed? YES
- Real dependencies used? YES (actual Supabase/Firebase, not mocks in integration)
- Integration tests for: YES (storage migration, sync functionality)
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? YES (constitutional compliance monitoring)
- Frontend logs → backend? YES (sync operation logs to cloud)
- Error context sufficient? YES (detailed error tracking for sync failures)

**Versioning**:
- Version number assigned? Constitutional Amendment v2.6.0
- BUILD increments on every change? YES (constitutional requirement)
- Breaking changes handled? YES (Amendment integration with v2.5.0, v2.4.0)

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

**Structure Decision**: Mobile application structure with React Native/Expo configuration:
```
app/               # Expo Router file-based routing
lib/              # Core application logic
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── models/       # TypeScript interfaces
├── repo/         # Data access layer
└── data/         # Firebase/Supabase utilities
__tests__/        # Jest tests
specs/001-we-are-actually/  # Feature documentation
```

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

## Phase 2: Task Planning Approach (ALREADY COMPLETED)
*Constitutional Amendment v2.6.0 tasks have been generated in tasks.md*

**Task Generation Strategy** (COMPLETED):
- 26 sequential tasks generated from constitutional amendment requirements
- Critical TypeScript fix (T001) → Contract tests (T002-T005) → Implementation (T006-T009)
- Each constitutional requirement → specific implementation task
- Performance optimization and enforcement automation included

**Ordering Strategy** (APPLIED):
- TDD order: Contract tests before implementation (Constitutional requirement)
- Sequential execution: Memory management requires one task at a time
- Dependency chain: T001 → T002-T005 → T006-T009 → T024-T026
- Constitutional compliance validation at each phase

**Actual Output**: 26 numbered, sequential tasks with constitutional validation requirements

**STATUS**: Phase 2 COMPLETE - tasks.md generated with Amendment v2.6.0 compliance protocol

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Constitutional violations documented and justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Repository pattern | Dual backend support (Firebase→Supabase) | Direct DB access cannot handle migration complexity |
| Constitutional framework complexity | Amendment v2.6.0 task completion validation | Simple testing insufficient for preventing 80 test failures |
| 26 sequential tasks | Memory constraint compliance | Parallel execution exceeds 8GB constitutional limit |
| Test infrastructure overhead | TestDevice, mock factories required | 80 failing tests cannot be fixed without systematic infrastructure |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - Constitutional Amendment v2.6.0 research done
- [x] Phase 1: Design complete (/plan command) - Data model, contracts, quickstart complete
- [x] Phase 2: Task planning complete (/plan command - describe approach only) - 26 tasks defined
- [ ] Phase 3: Tasks generated (/tasks command) - Ready for execution
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS - Amendment v2.6.0 integration approach approved
- [ ] Post-Design Constitution Check: PENDING TypeScript compilation fixes
- [x] All NEEDS CLARIFICATION resolved - Amendment v2.6.0 requirements clarified
- [ ] Complexity deviations documented - Constitutional framework complexity justified

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*