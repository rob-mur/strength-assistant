# Phase 1: Repository Contracts

**Date**: 2025-09-13

This document defines the contracts for the data access layer. A repository pattern will be used to abstract the backend implementation (Firebase or Supabase), allowing the application to switch between them via a feature flag.

## 1. IExerciseRepository Interface

This TypeScript interface defines the standard methods for interacting with exercise data, regardless of the underlying backend.

**File Location**: `lib/repo/IExerciseRepository.ts`

```typescript
import { Observable } from "@legendapp/state";

// Assuming the Exercise model is defined elsewhere, matching data-model.md
import { Exercise } from "../models/Exercise";

export interface IExerciseRepository {
  /**
   * Initializes the repository and sets up the synchronization with the backend.
   */
  initialize(): Promise<void>;

  /**
   * An observable containing the list of all exercises.
   * Components can subscribe to this to get real-time updates.
   */
  exercises$: Observable<Exercise[]>;

  /**
   * Creates a new exercise record.
   *
   * @param exercise The exercise data to create.
   */
  createExercise(
    exercise: Omit<Exercise, "id" | "created_at" | "updated_at" | "deleted">,
  ): Promise<void>;

  /**
   * Updates an existing exercise record.
   *
   * @param exercise The exercise data to update.
   */
  updateExercise(exercise: Exercise): Promise<void>;

  /**
   * Marks an exercise record as deleted (soft delete).
   *
   * @param id The ID of the exercise to delete.
   */
  deleteExercise(id: string): Promise<void>;
}
```

## 2. Repository Factory

A factory function will be responsible for creating the correct repository implementation based on the feature flag.

**File Location**: `lib/repo/ExerciseRepoFactory.ts`

```typescript
import { IExerciseRepository } from "./IExerciseRepository";
import { FirebaseExerciseRepo } from "./FirebaseExerciseRepo";
import { SupabaseExerciseRepo } from "./SupabaseExerciseRepo";

export function createExerciseRepository(): IExerciseRepository {
  const useSupabase = process.env.EXPO_PUBLIC_USE_SUPABASE === "true";

  if (useSupabase) {
    return new SupabaseExerciseRepo();
  } else {
    return new FirebaseExerciseRepo();
  }
}
```
