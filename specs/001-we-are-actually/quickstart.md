# Phase 1: Quickstart Guide & Testing Strategy

**Date**: 2025-09-13

This guide explains the testing strategy and how to run the various test suites for the local-first storage feature. These tests validate the end-to-end functionality, including the repository abstraction and the synchronization with the backend.

## 1. Prerequisites

- You have the development environment set up, including `devbox`.
- The Firebase and Supabase emulators are configured and ready to run (this is handled automatically by the integration test scripts).

## 2. Testing Workflow

The testing process should follow a sequential workflow, starting with the fastest tests and progressing to the more comprehensive (and slower) suites.

### Step 1: Unit Tests (Fastest)

For small, incremental changes, you should run the unit tests. These are fast and provide immediate feedback.

```bash
npm test
```

### Step 2: Full Unit Test & Linting Pipeline

Once a logical piece of work is complete and the unit tests are passing, run the full pre-flight check pipeline. This includes linting, TypeScript checks, and all unit tests.

```bash
devbox run test
```

### Step 3: Integration Tests (When Necessary)

Integration tests should be run when you are working on a task that directly involves integration concerns (e.g., changes to the repository layer, backend configuration, or cross-service communication). You do not need to run these for every small change.

The integration tests are designed to run against both the Firebase and Supabase backends. This is controlled by the `EXPO_PUBLIC_USE_SUPABASE` environment variable set in the `devbox.json` files.

#### To run tests against Firebase (the existing setup):

1.  Ensure the `EXPO_PUBLIC_USE_SUPABASE` is set to `"false"` in the relevant `devbox.json` files.
2.  Run the tests:

```bash
# Run the Android integration tests
devbox run integration_test_android

# Or run the Chrome integration tests
devbox run integration_test_chrome
```

#### To run tests against Supabase (the new setup):

1.  Ensure the `EXPO_PUBLIC_USE_SUPABASE` is set to `"true"` in the relevant `devbox.json` files.
2.  Run the tests:

```bash
# Run the Android integration tests
devbox run integration_test_android

# Or run the Chrome integration tests
devbox run integration_test_chrome
```

## 3. Expected Behavior

- The goal is to ensure all tests pass at each stage of the workflow.
- The integration test runs will verify that the `IExerciseRepository` contract is correctly implemented by both the `FirebaseExerciseRepo` and the `SupabaseExerciseRepo` and that the application behaves identically regardless of the chosen backend.