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
