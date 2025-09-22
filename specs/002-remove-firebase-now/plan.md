# Implementation Plan: Complete Firebase Removal

**Branch**: `002-remove-firebase-now` | **Date**: 2025-09-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/home/rob/Documents/Github/strength-assistant/specs/002-remove-firebase-now/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path ✓
   → Feature spec loaded successfully
2. Fill Technical Context (scan for NEEDS CLARIFICATION) ✓
   → Detected Project Type: mobile app with React Native/Expo
   → Set Structure Decision: Mobile app structure (app/ + lib/)
3. Evaluate Constitution Check section below ✓
   → No violations found - straightforward cleanup operation
   → Update Progress Tracking: Initial Constitution Check ✓
4. Execute Phase 0 → research.md ✓
   → All technical unknowns resolved, comprehensive Firebase analysis complete
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md ✓
   → All design artifacts generated successfully
6. Re-evaluate Constitution Check section ✓
   → No new violations - design follows constitutional principles
   → Update Progress Tracking: Post-Design Constitution Check ✓
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md) ✓
   → 22-task strategy defined with user testing requirements integrated
8. STOP - Ready for /tasks command ✓
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Remove all Firebase dependencies, infrastructure, and code from the React Native/Expo strength training application while ensuring continued functionality through Supabase. This includes package dependencies, source code, test infrastructure, configuration files, and CI/CD references.

## Technical Context

**Language/Version**: TypeScript/JavaScript with React Native/Expo  
**Primary Dependencies**: React Native, Expo, Legend State, Supabase  
**Storage**: Supabase (PostgreSQL), Legend State for local state  
**Testing**: Jest, React Native Testing Library, Maestro (integration)  
**Target Platform**: iOS/Android mobile apps, Web (Expo)
**Project Type**: mobile - React Native/Expo application  
**Performance Goals**: Maintain current app performance after Firebase removal  
**Constraints**: All tests must pass (devbox run test + Maestro integration tests)  
**Scale/Scope**: Complete codebase cleanup, ~103 files with Firebase references

**User-provided Technical Context**: "i think this is relatively straight forward but let me know if you have questions. the final tests is that devbox run test succeeds as well as the integration maestro tests which are also in devbox"

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Simplicity**:

- Projects: 1 (mobile app only)
- Using framework directly? Yes (React Native, Expo, Supabase)
- Single data model? Yes (Exercise records, consistent across Supabase)
- Avoiding patterns? Yes (direct Supabase usage, no complex wrappers)

**Architecture**:

- EVERY feature as library? Yes (business logic in lib/ directory)
- Libraries listed: lib/data/supabase (Supabase integration), lib/repo (repository layer), lib/hooks (React hooks)
- CLI per library: N/A (mobile app, not CLI-based)
- Library docs: Existing CLAUDE.md will be updated

**Testing (NON-NEGOTIABLE)**:

- RED-GREEN-Refactor cycle enforced? Yes (tests will fail during removal, then pass)
- Git commits show tests before implementation? Yes (will validate test failures first)
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Yes (actual Supabase, not mocks)
- Integration tests for: Firebase removal verification, Supabase-only operation
- FORBIDDEN: Implementation before test - will verify failures first

**Observability**:

- Structured logging included? Yes (existing logging maintained)
- Frontend logs → backend? Yes (Supabase logging)
- Error context sufficient? Yes (error handling preserved)

**Versioning**:

- Version number assigned? Will increment BUILD on completion
- BUILD increments on every change? Yes
- Breaking changes handled? No breaking changes (internal cleanup)

## Project Structure

### Documentation (this feature)

```
specs/002-remove-firebase-now/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
# Option 3: Mobile + API (React Native/Expo app)
app/                     # Expo Router screens and routes
├── (tabs)/
├── _layout.tsx
└── error.ts

lib/                     # Business logic and services
├── data/
│   ├── supabase/       # Keep (Supabase implementation)
│   └── firebase/       # REMOVE (Firebase implementation)
├── repo/               # Repository layer
│   ├── SupabaseExerciseRepo.ts  # Keep
│   └── FirebaseExerciseRepo.ts  # REMOVE
├── hooks/              # React hooks
└── models/             # Data models

__tests__/              # Test infrastructure
├── integration/
├── unit/
└── test-utils/
```

**Structure Decision**: Mobile app structure (app/ + lib/) - Firebase components will be removed while preserving Supabase-only structure

## Phase 0: Outline & Research

**✅ COMPLETED**: research.md generated with comprehensive Firebase usage analysis

Key findings:

- 4 Firebase npm packages to remove
- Entire lib/data/firebase/ directory (8 files)
- Firebase repository implementation and tests
- Configuration files and CI/CD integration
- Factory pattern simplification needed

## Phase 1: Design & Contracts

**✅ COMPLETED**: All design artifacts generated

Generated artifacts:

- ✅ `data-model.md` - Entities involved in removal process
- ✅ `contracts/removal-contract.md` - Operation contracts and validation rules
- ✅ `contracts/test-validation.test.md` - Test contracts for validation
- ✅ `quickstart.md` - Step-by-step removal guide
- ✅ `CLAUDE.md` - Updated agent context with Supabase-only information

## Phase 2: Task Planning Approach

**✅ COMPLETED**: Task generation strategy defined

**Task Generation Strategy**:

Based on research findings and contracts, the /tasks command will generate:

1. **Pre-removal validation tasks** (2 tasks)
   - Verify Supabase implementation is working
   - Run baseline test suite

2. **Package removal tasks** (4 tasks)
   - Remove each Firebase npm package individually
   - Validate build after each removal

3. **Source code removal tasks** (6 tasks)
   - Remove Firebase source directory
   - Remove Firebase repository implementation
   - Update import references in core files
   - Update factory pattern to Supabase-only
   - Remove Firebase from error handling and logging

4. **Test infrastructure tasks** (4 tasks)
   - Remove Firebase mock implementations
   - Remove Firebase-specific tests
   - Update Jest setup
   - Validate remaining tests pass

5. **Configuration cleanup tasks** (3 tasks)
   - Remove Firebase configuration files
   - Clean environment variables
   - Update CI/CD workflows

6. **Final validation tasks** (3 tasks)
   - Run complete test suite (npm test)
   - Run devbox test suite
   - Run Maestro integration tests

**Ordering Strategy**:

Tasks follow dependency order with validation at each major step:

1. Pre-validation → 2. Packages → 3. Source code → 4. Tests → 5. Config → 6. Final validation

**Estimated Output**: 22 numbered, sequentially ordered tasks with clear success criteria

**User Testing Requirements Integration**:

- Task 21: Verify `devbox run test` succeeds
- Task 22: Verify Maestro integration tests succeed (also in devbox)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run devbox run test, maestro integration tests)

## Complexity Tracking

_No constitutional violations identified - Firebase removal is straightforward cleanup_

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
- [x] Complexity deviations documented (none required)

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
