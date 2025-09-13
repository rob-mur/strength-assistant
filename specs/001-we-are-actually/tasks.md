# Feature Tasks: Local First Storage with Backup (Completion)

**Feature**: `001-we-are-actually`

This document lists the executable tasks to complete the implementation of the local-first storage feature. The primary goal is to make the `__tests__/integration/feature-flag-migration.test.ts` test suite pass.

## Phase 1: Configuration & Review

- ~~**T001: Configure Feature Flag in Devbox**~~ ✅ **COMPLETED**
  - **Files**: `devbox/minimal/devbox.json`, `devbox/android-testing/devbox.json`, and the root `devbox.json`.
  - **Action**: Ensure `"EXPO_PUBLIC_USE_SUPABASE": "false"` is present in the `env` block of each of the specified `devbox.json` files. This will be toggled to `true` to test the Supabase implementation.

- **T002: Update Supabase Schema**
  - **File**: `supabase/migrations/YYYYMMDDHHMMSS_add_sync_columns_to_exercises.sql`
  - **Action**: Create a new Supabase migration file to add the `created_at`, `updated_at`, and `deleted` columns to the `exercises` table if they do not already exist. These are required for `legend-state` synchronization.
  - **Command**: `supabase migration new add_sync_columns_to_exercises`

- **T003: Review the Core Integration Test**
  - **File**: `__tests__/integration/feature-flag-migration.test.ts`
  - **Action**: Thoroughly read and understand the `feature-flag-migration.test.ts` file and its helper, `lib/test-utils/MigrationTestApp.ts`. This test will be the main driver for the implementation.

## Phase 2: Implementation

- **T004: Implement `legend-state` Synchronization**
  - **File**: `lib/repo/SupabaseExerciseRepo.ts`
  - **Action**: Integrate the `@legendapp/state/sync/supabase` plugin into the `SupabaseExerciseRepo`. Configure it to synchronize the `exercises` table and to use a "last-write-wins" conflict resolution strategy based on the `updated_at` column.
  - **Test**: The `feature-flag-migration.test.ts` should start to pass more of its assertions related to data consistency and CRUD operations when the feature flag is set to `true`.

- **T005: Ensure `IExerciseRepo` Alignment**
  - **Files**: `lib/repo/IExerciseRepo.ts`, `lib/repo/FirebaseExerciseRepo.ts`, `lib/repo/SupabaseExerciseRepo.ts`
  - **Action**: Ensure that both `FirebaseExerciseRepo` and `SupabaseExerciseRepo` correctly and fully implement the `IExerciseRepo` interface. The existing `IExerciseRepo` seems to have a different method signature than what is implemented in the repos. The repos should be the source of truth, and the interface should be updated to reflect the actual implementation.

- **T006: Refactor UI to Use Repository**
  - **Files**: `app/(tabs)/index.tsx`, `app/components/AddExerciseForm.tsx`, etc.
  - **Action**: Refactor the UI components to get data from the `exercises$` observable in the `IExerciseRepository` and to use the repository methods for all CRUD operations. Use the `ExerciseRepoFactory` to obtain the repository instance.

## Phase 3: Testing & Validation

- **T007: Pass the Core Integration Test**
  - **File**: `__tests__/integration/feature-flag-migration.test.ts`
  - **Action**: Run the integration test with the feature flag set to `true` and fix any remaining issues in the `SupabaseExerciseRepo` until all tests pass.
  - **Command**:
    ```bash
    # Set the feature flag to true in the devbox.json file
    # Then run the tests
    devbox run integration_test_chrome
    ```

- **T008: Final Test Run**
  - **Action**: Run the full suite of tests (unit, contract, and integration) against both the Firebase and Supabase backends (by toggling the feature flag) to ensure that no existing functionality has broken and the new functionality is working as expected.