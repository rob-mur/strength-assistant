# Implementation Plan: Local First Storage with Backup

**Branch**: `001-we-are-actually` | **Date**: 2025-09-12 | **Spec**: [spec.md](/home/rob/Documents/Github/strength-assistant/specs/001-we-are-actually/spec.md)
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
Migrate from Firebase to Supabase for offline-first storage with automatic cloud synchronization. The primary requirement is maintaining a local-first experience where all operations are instant on device, with background sync to Supabase for cross-device consistency and data persistence. Critical challenge: memory usage optimization for test suite to prevent crashes during `devbox run test` execution.

## Technical Context
**Language/Version**: TypeScript with React Native Expo  
**Primary Dependencies**: Supabase JS client, Legend State (local-first sync), React Native Expo  
**Storage**: Supabase (PostgreSQL) for cloud, Legend State for local persistence  
**Testing**: Jest with React Native Testing Library, Devbox test runner  
**Target Platform**: React Native (iOS, Android, Web)
**Project Type**: mobile - React Native Expo app with authentication  
**Performance Goals**: Instant local operations (<10ms), background sync (not performance critical)  
**Constraints**: Offline-capable, memory-efficient test execution, maintain existing functionality  
**Scale/Scope**: Simple data model (Exercise records), user authentication, cross-device sync
**Memory Constraints**: `devbox run test` memory usage must be optimized to prevent crashes during AuthAwareLayout and TypeScript integration tests

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (React Native app with dual backend support)
- Using framework directly? Yes (Supabase JS client, Legend State)
- Single data model? Yes (Exercise entity)
- Avoiding patterns? Yes (using repository pattern only where needed for backend abstraction)

**Architecture**:
- EVERY feature as library? Yes (data layer as lib/repo, sync as lib/sync)
- Libraries listed: ExerciseRepo (data access), SyncEngine (Legend State integration), AuthService (Supabase auth)
- CLI per library: Not applicable (mobile app)
- Library docs: llms.txt format planned? Yes, for component documentation

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes, tests must fail first
- Git commits show tests before implementation? Yes
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Yes (actual Supabase instance for integration tests)
- Integration tests for: new libraries, contract changes, shared schemas? Yes
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? Yes (sync status, error tracking)
- Frontend logs → backend? Yes (error reporting to Supabase)
- Error context sufficient? Yes (sync conflicts, network errors)

**Versioning**:
- Version number assigned? Incremental within existing app version
- BUILD increments on every change? Following existing app versioning
- Breaking changes handled? Gradual migration with feature flags

**Memory Optimization Requirements**:
- Test suite memory usage must be reduced to prevent crashes
- AuthAwareLayout tests causing memory issues - need investigation
- TypeScript integration pipeline may be contributing to memory pressure
- `devbox run test` single-threaded execution hitting memory limits

## Project Structure

### Documentation (this feature)
```
specs/001-we-are-actually/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 3: Mobile + API (React Native Expo app with Supabase backend)
app/                     # Expo Router screens
├── (tabs)/
├── auth/
└── exercises/

lib/                     # Application libraries
├── repo/               # Data access layer
│   ├── ExerciseRepo.ts
│   └── supabase/
├── sync/              # Legend State sync engine
├── auth/              # Authentication services
├── hooks/             # React hooks
└── components/        # UI components

__tests__/             # Test suite
├── integration/       # Integration tests
├── unit/             # Unit tests
└── test-utils/       # Test utilities (needs memory optimization)
```

**Structure Decision**: Option 3 - Mobile app structure (React Native Expo) with Supabase backend integration

## Phase 0: Outline & Research

**Phase 0 Status: COMPLETE**

1. **Extract unknowns from Technical Context** above:
   - Memory optimization strategies for Jest/React Native Testing Library
   - Legend State integration patterns with Supabase real-time
   - Migration strategy from Firebase to Supabase without data loss
   - Test utility optimization to reduce memory footprint

2. **Generate and dispatch research agents**:
   ```
   Task: "Research memory optimization for Jest React Native test suites"
   Task: "Find best practices for Legend State + Supabase integration"
   Task: "Research Firebase to Supabase migration strategies for React Native"
   Task: "Investigate test utility memory usage patterns"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all unknowns resolved and memory optimization strategies identified

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Exercise Records: id, name, userId (for sync)
   - User Account: authentication state, sync preferences
   - Sync State: pending changes, conflict resolution
   - Conflict Records: conflict metadata, resolution strategy

2. **Generate API contracts** from functional requirements:
   - Supabase table schemas for exercises, users
   - Real-time subscription contracts
   - Authentication flow contracts
   - Output PostgreSQL schemas and TypeScript interfaces to `/contracts/`

3. **Generate contract tests** from contracts:
   - Database schema validation tests
   - Real-time subscription tests  
   - Authentication flow tests
   - Memory-optimized test utilities
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Offline CRUD operations
   - Online sync scenarios
   - Conflict resolution scenarios
   - Memory-efficient test execution

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh claude` for Claude Code
   - Add Supabase + Legend State context
   - Add memory optimization requirements
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, updated CLAUDE.md

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- **PRIORITY 0: Memory Optimization Tasks**
  - Analyze and optimize test-utils memory usage
  - Reduce AuthAwareLayout test complexity
  - Optimize TypeScript integration pipeline memory
  - Implement memory-efficient test patterns
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- **Phase 0**: Memory optimization (critical blocker)
- **Phase 1**: TDD order - Tests before implementation 
- **Phase 2**: Dependency order - Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 35-40 numbered, ordered tasks in tasks.md (including memory optimization tasks)

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
| Repository pattern | Backend abstraction for Firebase→Supabase migration | Direct DB access would require complete rewrite of existing components |
| Feature flag system | Gradual migration safety | Hard cutover would risk data loss and break existing functionality |

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
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - Enhanced with memory optimization requirements*