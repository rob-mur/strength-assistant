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
Migrate from Firebase to Supabase for local-first storage with automatic cloud synchronization. Implement offline-first architecture where all user operations happen locally immediately, with background sync to cloud database when connectivity is available. Critical: Previous run crashed due to memory exhaustion from parallel processing - implementation must use sequential processing to stay within 32GB memory limit.

## Technical Context
**Language/Version**: TypeScript with React Native, Expo SDK  
**Primary Dependencies**: Expo, React Navigation, Supabase, Legend State, React Native Paper  
**Storage**: Migrating from Firebase to Supabase with local-first Legend State persistence  
**Testing**: Jest with React Native Testing Library, devbox test runner  
**Target Platform**: iOS, Android, Web (React Native cross-platform)
**Project Type**: mobile - React Native app with file-based routing  
**Performance Goals**: Immediate local operations (<50ms), background sync performance not critical  
**Constraints**: **MEMORY CRITICAL**: Sequential processing only, max 32GB memory usage, offline-capable  
**Scale/Scope**: Simple Exercise data model, ~80 existing tests, migration without data loss

**Memory Management Constraints**:
- Previous run crashed from parallel task execution exceeding 48GB physical memory
- Must implement sequential task processing to prevent memory exhaustion
- Target max 32GB usage with 16GB safety margin for system processes
- Use incremental processing for large operations

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
- Git commits show tests before implementation?
- Order: Contract→Integration→E2E→Unit strictly followed?
- Real dependencies used? (actual DBs, not mocks)
- Integration tests for: new libraries, contract changes, shared schemas?
- FORBIDDEN: Implementation before test, skipping RED phase

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

**Structure Decision**: Using existing React Native structure with app/ for routing and lib/ for core logic (mobile app pattern)

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

**Task Generation Strategy with Memory Constraints**:
- Generate sequential tasks from Phase 1 design docs (contracts, data model, quickstart)
- **CRITICAL**: All tasks must be executed sequentially, never in parallel
- Priority 1: Test infrastructure to fix constitutional violations
- Priority 2: Local-first storage implementation  
- Priority 3: Supabase migration logic
- Priority 4: Feature flag and sync status implementation

**Sequential Ordering Strategy (Memory Safe)**:
1. **Constitutional Compliance Phase** (Sequential execution required):
   - Implement TestDevice utility [MEMORY: ~2GB per task]
   - Fix Jest configuration [MEMORY: ~1GB]
   - Repair test infrastructure [MEMORY: ~3GB per test file]
   - Validate all 80 tests pass [MEMORY: ~6GB total]

2. **Local-First Implementation Phase** (Sequential execution required):
   - Install and configure Legend State [MEMORY: ~1GB]
   - Implement local storage models [MEMORY: ~2GB]
   - Create sync operation tracking [MEMORY: ~3GB]
   - Implement offline-first exercise operations [MEMORY: ~4GB]

3. **Migration Phase** (Sequential execution required):
   - Setup Supabase backend [MEMORY: ~2GB]
   - Implement feature flag switching [MEMORY: ~1GB]
   - Create data migration utilities [MEMORY: ~5GB]
   - Test dual backend support [MEMORY: ~8GB]

**Memory Management Requirements**:
- Maximum memory per task: 8GB
- Force garbage collection between tasks
- Monitor memory usage and log warnings at 6GB
- Break large operations into smaller chunks
- Never execute more than one task simultaneously

**Estimated Output**: 15-20 numbered, sequentially-ordered tasks in tasks.md

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
- [x] Phase 0: Research complete (/plan command) - Updated with memory management constraints
- [x] Phase 1: Design complete (/plan command) - Data model updated for local-first storage
- [x] Phase 2: Task planning complete (/plan command - describe approach only) - Sequential processing approach defined
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS - Memory constraints documented
- [x] Post-Design Constitution Check: PASS - Sequential processing enforced
- [x] All NEEDS CLARIFICATION resolved - Technical context fully specified
- [x] Complexity deviations documented - Memory management requirements added

**Memory Management Compliance**:
- [x] Memory exhaustion root cause identified (parallel processing)
- [x] Sequential processing strategy documented
- [x] Memory budget allocation planned (32GB target)
- [x] Task memory limits specified (8GB max per task)
- [x] Garbage collection strategy defined

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*