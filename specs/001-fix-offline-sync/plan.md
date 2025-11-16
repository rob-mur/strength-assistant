# Implementation Plan: Fix Offline Sync

**Branch**: `001-fix-offline-sync` | **Date**: 2025-10-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-fix-offline-sync/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Fix broken offline-first sync between Legend State and Supabase where exercises created offline are lost on app restart and never reach the cloud. Implementation prioritizes test-first development to write comprehensive tests that catch the bug before fixing the sync mechanism. Focus on reliable local persistence, connectivity detection, and automatic sync restoration.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript with React Native 0.79.5, Expo SDK 53, React 19.0.0  
**Primary Dependencies**: @legendapp/state, @supabase/supabase-js, Expo Router, React Native Paper  
**Storage**: Supabase PostgreSQL (cloud), Legend State local persistence  
**Testing**: Jest + React Native Testing Library (unit), Maestro (integration) - NEEDS CLARIFICATION on offline testing approach  
**Target Platform**: React Native (iOS/Android), web deployment via Expo/Supabase
**Project Type**: mobile - React Native with web deployment capability  
**Performance Goals**: <30 second sync on connectivity restore, <100ms local operations - NEEDS CLARIFICATION on sync batch sizes  
**Constraints**: Offline-capable, zero data loss, works on production Android builds  
**Scale/Scope**: Individual user exercise data, real-world network conditions - NEEDS CLARIFICATION on sync conflict resolution strategy

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ PASS - Test-First Development Required
- Follows TDD mandate: Tests will be written first to catch existing bug
- Integration testing focus: Offline/online sync scenarios need comprehensive coverage  
- Library-first approach: Sync functionality can be extracted as testable service
- Observability: Text-based logging ensures debuggability of sync failures

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# React Native with Expo structure
app/                     # Expo Router screens and routes
├── (tabs)/
├── _layout.tsx
└── error.ts

lib/                     # Business logic and services
├── data/
│   └── supabase/       # Supabase implementation only
├── repo/               # Repository layer (Supabase only)
├── sync/               # NEW: Offline sync services
│   ├── SyncManager.ts
│   ├── ConnectivityMonitor.ts
│   └── ConflictResolver.ts
├── hooks/              # React hooks
└── models/             # Data models

__tests__/              # Test infrastructure
├── integration/
│   └── offline-sync/   # NEW: Offline sync test scenarios
├── unit/
│   └── sync/           # NEW: Sync unit tests
└── test-utils/
```

**Structure Decision**: Extending existing React Native/Expo structure with new sync services in `lib/sync/` and comprehensive test coverage in `__tests__/integration/offline-sync/` and `__tests__/unit/sync/`. This maintains the current project organization while adding focused sync functionality that can be independently tested and developed.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
