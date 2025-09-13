# Phase 1: Data Model

**Date**: 2025-09-13

This document defines the data structures for the entities involved in this feature, as they will be represented in `legend-state` and synchronized with the Supabase backend.

## 1. Exercise

Represents a single exercise record created by a user.

| Field         | Type      | Description                                          | Constraints      |
|---------------|-----------|------------------------------------------------------|------------------|
| `id`          | `string`  | Unique identifier (client-generated)                 | Required, Unique |
| `name`        | `string`  | Name of the exercise (e.g., "Bench Press")           | Required         |
| `reps`        | `number`  | Number of repetitions performed                      | Optional         |
| `sets`        | `number`  | Number of sets performed                             | Optional         |
| `weight`      | `number`  | Weight used for the exercise (in kg)                 | Optional         |
| `created_at`  | `string`  | ISO 8601 timestamp of when the record was created    | Required         |
| `updated_at`  | `string`  | ISO 8601 timestamp of the last modification          | Required         |
| `deleted`     | `boolean` | Flag for soft deletes                                | Required         |
| `user_id`     | `string`  | Foreign key linking to the User who owns this record | Required         |

## 2. User

Represents an application user.

| Field      | Type     | Description                                | Constraints      |
|------------|----------|--------------------------------------------|------------------|
| `id`       | `string` | Unique identifier from Supabase Auth       | Required, Unique |
| `email`    | `string` | User's email address (for signed-in users) | Optional, Unique |
| `is_anonymous` | `boolean`| True if the user is an anonymous user      | Required         |

## 3. SyncState

(Conceptual) - This entity represents the state managed internally by the `@legendapp/state/sync/supabase` plugin. It tracks which records have been synchronized and when the last sync occurred. We do not need to model this ourselves, but we must ensure our Supabase tables have the necessary columns for the plugin to manage this state.

**Required Columns in Supabase Tables:**
- `created_at`
- `updated_at`
- `deleted`

## 4. Conflict

(Conceptual) - This entity represents a conflict that may occur during synchronization. The `legend-state` sync engine handles this, and the chosen strategy is "last-write-wins" based on the `updated_at` timestamp. We do not need to model a separate `Conflict` entity.

---

# Test Infrastructure Data Models

**Context**: Production test readiness and constitutional compliance

## 5. TestExecutionContext

Tracks test execution state for constitutional validation and failure analysis.

| Field               | Type     | Description                                      | Constraints    |
|--------------------|----------|--------------------------------------------------|----------------|
| `testSuiteId`      | `string` | Unique identifier for this test run             | Required       |
| `backend`          | `string` | Current backend under test ('firebase'\|'supabase') | Required   |
| `startTime`        | `Date`   | Test execution start timestamp                   | Required       |
| `expectedOutcome`  | `string` | Predicted result ('PASS'\|'FAIL')               | Required       |
| `reasoning`        | `string` | Why we expect this outcome                       | Required       |
| `actualResult`     | `TestResult` | Actual execution result                      | Optional       |

## 6. TestResult

Captures test execution results for constitutional compliance validation.

| Field            | Type       | Description                                     | Constraints    |
|------------------|------------|-------------------------------------------------|----------------|
| `outcome`        | `string`   | Actual result ('PASS'\|'FAIL')                 | Required       |
| `exitCode`       | `number`   | Binary exit code (0=success, 1=failure)        | Required       |
| `executionTime`  | `number`   | Milliseconds taken                              | Required       |
| `failureCount`   | `number`   | Number of failed tests                          | Required       |
| `errors`         | `TestError[]` | Specific errors encountered                  | Required       |

## 7. TestError

Details about individual test failures for systematic repair tracking.

| Field         | Type     | Description                                    | Constraints      |
|---------------|----------|------------------------------------------------|------------------|
| `testName`    | `string` | Specific test that failed                      | Required         |
| `errorType`   | `string` | Category ('timeout'\|'assertion'\|'mock'\|'worker') | Required  |
| `message`     | `string` | Error message                                  | Required         |
| `stackTrace`  | `string` | Full stack trace if available                  | Optional         |

## 8. MockClientConfig

Configuration for backend-specific mock implementations.

| Field             | Type      | Description                                   | Constraints       |
|-------------------|-----------|-----------------------------------------------|-------------------|
| `backendType`     | `string`  | Backend identifier ('firebase'\|'supabase')  | Required, Unique  |
| `factoryFunction` | `string`  | Name of factory function                      | Required          |
| `isActive`        | `boolean` | Whether this mock is currently active        | Required          |
| `initTimeout`     | `number`  | Initialization timeout in milliseconds       | Required, ≤10000  |

## 9. WorkerHealthStatus

Jest worker health tracking for stability monitoring.

| Field          | Type     | Description                                   | Constraints    |
|----------------|----------|-----------------------------------------------|----------------|
| `workerId`     | `string` | Worker identifier                             | Required       |
| `status`       | `string` | Current status ('healthy'\|'stressed'\|'failed') | Required   |
| `memoryUsage`  | `number` | Current memory usage in MB                    | Required       |
| `testCount`    | `number` | Tests processed by this worker                | Required       |
| `errorCount`   | `number` | Errors encountered                            | Required       |
