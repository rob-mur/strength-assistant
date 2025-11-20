/**
 * Exercise Set Logging: Supabase Workout Sets Repository
 *
 * Purpose: Database operations for workout sets with optimistic updates and error handling
 * Features: Create, read, update, delete operations with Supabase integration
 */

import { getSupabaseClient } from "../../data/supabase/supabase";
import { CreateWorkoutSetRequest, WorkoutSet } from "../../models/WorkoutSet";
import { workoutSetActions } from "../../store/workoutSetStore";

/**
 * Create a new workout set in the database
 * Handles set ordering, user authentication, and local store updates
 */
export async function createWorkoutSet(
  data: CreateWorkoutSetRequest,
): Promise<WorkoutSet> {
  const setOrder = await getNextSetOrder(data.exercise_id, data.session_date);

  const supabase = getSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    throw new Error("User must be authenticated to create workout sets");
  }

  const { data: newSet, error } = await (supabase.from("workout_sets") as any)
    .insert({
      ...data,
      set_order: setOrder,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create workout set: ${error.message}`);

  // Update local store via workoutSetActions
  await workoutSetActions.createSet(data);

  return newSet as WorkoutSet;
}

/**
 * Get the next set order for a specific exercise and session date
 */
async function getNextSetOrder(
  exerciseId: string,
  sessionDate: string,
): Promise<number> {
  const supabase = getSupabaseClient();

  const { data, error } = await (supabase.from("workout_sets") as any)
    .select("set_order")
    .eq("exercise_id", exerciseId)
    .eq("session_date", sessionDate)
    .order("set_order", { ascending: false })
    .limit(1);

  if (error) {
    console.warn("Error getting max set order, defaulting to 1:", error);
    return 1;
  }

  return data && data.length > 0 ? data[0].set_order + 1 : 1;
}

/**
 * Fetch workout sets for a specific session and exercise
 */
export async function getWorkoutSets(
  exerciseId: string,
  sessionDate: string,
): Promise<WorkoutSet[]> {
  const supabase = getSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;

  if (!userId) {
    throw new Error("User must be authenticated to fetch workout sets");
  }

  const { data, error } = await (supabase.from("workout_sets") as any)
    .select("*")
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)
    .eq("session_date", sessionDate)
    .order("set_order", { ascending: true });

  if (error) throw new Error(`Failed to fetch workout sets: ${error.message}`);

  return (data as WorkoutSet[]) || [];
}

/**
 * Update an existing workout set
 */
export async function updateWorkoutSet(
  id: string,
  updates: Partial<
    Omit<WorkoutSet, "id" | "user_id" | "created_at" | "updated_at">
  >,
): Promise<WorkoutSet> {
  const supabase = getSupabaseClient();

  const { data, error } = await (supabase.from("workout_sets") as any)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update workout set: ${error.message}`);

  // Update local store
  await workoutSetActions.updateSet(id, updates);

  return data as WorkoutSet;
}

/**
 * Delete a workout set
 */
export async function deleteWorkoutSet(id: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await (supabase.from("workout_sets") as any)
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Failed to delete workout set: ${error.message}`);

  // Update local store
  await workoutSetActions.deleteSet(id);
}
