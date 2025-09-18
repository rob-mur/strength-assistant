# Phase 1: Contract Tests

**Date**: 2025-09-13

This document outlines the contract tests for the `IExerciseRepository` interface. These tests will be used to verify that both the Firebase and Supabase implementations of the repository behave identically.

## 1. Test Setup

- A testing utility will provide an instance of the repository (either Firebase or Supabase, depending on the test run).
- The tests will be run against the respective emulators (Firebase Emulator Suite and Supabase local dev environment).

## 2. Test Suite: `IExerciseRepository`

### `initialize()`

- **Test**: `it should initialize without errors`
  - **Action**: Call `repository.initialize()`.
  - **Assertion**: The promise resolves without throwing an error.

### `createExercise()`

- **Test**: `it should create a new exercise and add it to the observable list`
  - **Action**:
    1. Call `repository.createExercise()` with new exercise data.
    2. Observe the `repository.exercises$` observable.
  - **Assertion**: The new exercise appears in the `exercises$` list.

### `updateExercise()`

- **Test**: `it should update an existing exercise`
  - **Action**:
    1. Create an exercise.
    2. Call `repository.updateExercise()` with modified data.
  - **Assertion**: The `exercises$` list reflects the updated exercise data.

### `deleteExercise()`

- **Test**: `it should mark an exercise as deleted (soft delete)`
  - **Action**:
    1. Create an exercise.
    2. Call `repository.deleteExercise()` with the exercise ID.
  - **Assertion**: The exercise is marked as `deleted: true` in the database (or removed from the observable list, depending on the desired behavior of the `exercises$` observable).

### Real-time Sync

- **Test**: `it should receive real-time updates from the backend`
  - **Action**:
    1. Initialize two repository instances.
    2. Create an exercise using the first instance.
  - **Assertion**: The second instance's `exercises$` observable receives the new exercise.
