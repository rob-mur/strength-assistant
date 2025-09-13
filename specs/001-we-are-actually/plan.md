# Implementation Plan: Local First Storage with Backup (Completion)

**Branch**: `001-we-are-actually` | **Date**: 2025-09-13 | **Spec**: [/specs/001-we-are-actually/spec.md]

**Input**: Feature specification from `/specs/001-we-are-actually/spec.md`

## Summary
The goal of this feature is to complete the migration from Firebase to a local-first storage solution with Supabase and `legend-state`. A significant portion of the repository layer, including abstractions and implementations for both Firebase and Supabase, already exists. This plan focuses on reviewing the existing code, implementing the missing `legend-state` synchronization, and ensuring the UI and all tests are correctly integrated with the new system.

## Technical Context
**Language/Version**: TypeScript
**Primary Dependencies**: React Native, Expo, Supabase, legend-state
**Storage**: Supabase (cloud), legend-state (local)
**Testing**: Jest
**Target Platform**: iOS, Android, Web
**Project Type**: Mobile + API
**Constraints**: The implementation will complete the existing repository pattern that uses a feature flag to switch between Firebase and Supabase backends. Environment variables for local development are managed in `devbox.json` files.

## Phase 0: Review & Analysis
1.  **Analyze Existing Codebase**: Review the existing repository pattern implementation in `lib/repo/`, including `IExerciseRepo.ts`, `FirebaseExerciseRepo.ts`, `SupabaseExerciseRepo.ts`, and `ExerciseRepoFactory.ts`.
2.  **Analyze Existing Tests**: Review the existing contract tests in `__tests__/contracts/` and integration tests in `__tests__/integration/` to understand the current test coverage.
3.  **Identify Gaps**: Identify the missing pieces of the implementation, which is primarily the integration of `legend-state` for local-first synchronization with the `SupabaseExerciseRepo`.

## Phase 1: Implementation & Testing
1.  **Implement `legend-state` Sync**: Integrate the `@legendapp/state/sync/supabase` plugin into the `SupabaseExerciseRepo.ts` to enable local-first synchronization.
2.  **Configure Conflict Resolution**: Configure the `legend-state` sync plugin to enforce a "last-write-wins" conflict resolution strategy.
3.  **Integrate UI**: Refactor the UI components to use the `ExerciseRepoFactory` and the `exercises$` observable from the repository for all data operations.
4.  **Run and Adapt Tests**: Execute all existing unit, contract, and integration tests. Adapt them as needed and implement any missing tests to ensure full coverage of the new functionality.

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Generate tasks based on the gaps identified in the review phase.
- Tasks will focus on implementation, configuration, and testing, rather than file creation.

**Ordering Strategy**:
- TDD order: Tests before implementation.
- Backend before frontend: Ensure the data layer is solid before integrating the UI.