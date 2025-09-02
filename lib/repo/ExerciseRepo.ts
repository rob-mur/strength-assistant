import { Exercise, ExerciseInput, ExerciseValidator } from "../models/Exercise";
import { IExerciseRepo } from "./IExerciseRepo";
import { Observable } from "@legendapp/state";
import { exercises$, user$ } from "../data/store";
import { supabaseClient } from "../data/supabase/SupabaseClient";
import { syncHelpers } from "../data/sync/syncConfig";

/**
 * Legend State + Supabase implementation of ExerciseRepo
 * Provides offline-first data access with automatic sync
 */
export class ExerciseRepo implements IExerciseRepo {
	private static instance: ExerciseRepo;

	private constructor() { }

	public static getInstance(): ExerciseRepo {
		if (!ExerciseRepo.instance) {
			ExerciseRepo.instance = new ExerciseRepo();
		}
		return ExerciseRepo.instance;
	}

	/**
	 * Add a new exercise with optimistic updates
	 * Changes are immediately visible in UI and synced in background
	 */
	async addExercise(userId: string, exercise: ExerciseInput): Promise<void> {
		try {
			// Validate and sanitize input
			ExerciseValidator.validateExerciseInput(exercise);
			const sanitizedName = ExerciseValidator.sanitizeExerciseName(exercise.name);
			
			// Validate userId
			if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
				throw new Error('Valid userId is required');
			}
			
			// Create new exercise object
			const newExercise: Exercise = {
				id: crypto.randomUUID(),
				name: sanitizedName,
				user_id: userId,
				created_at: new Date().toISOString()
			};
			
			// Optimistic update - immediately add to local store
			// Legend State sync will handle pushing to Supabase automatically
			const currentExercises = exercises$.get();
			exercises$.set([...currentExercises, newExercise]);
			
			// If sync fails, Legend State will automatically queue for retry
			// No need for manual error handling here - the sync engine handles it
			
		} catch (error) {
			console.error('Failed to add exercise:', error);
			throw error;
		}
	}

	/**
	 * Get exercise by ID from local store (works offline)
	 */
	async getExerciseById(id: string, uid: string): Promise<Exercise | undefined> {
		// With Legend State, we can get data immediately from local store
		const exercises = exercises$.get();
		return exercises.find(exercise => exercise.id === id && exercise.user_id === uid);
	}

	/**
	 * Get all exercises as a reactive observable
	 * Data is automatically filtered for current user by sync configuration
	 */
	getExercises(userId: string): Observable<Exercise[]> {
		// Return the synced exercises observable directly
		// The sync engine automatically filters for current user
		return exercises$;
	}

	/**
	 * Delete exercise with optimistic updates
	 */
	async deleteExercise(userId: string, exerciseId: string): Promise<void> {
		try {
			// Validate inputs
			if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
				throw new Error('Valid userId is required');
			}
			if (!exerciseId || typeof exerciseId !== 'string' || exerciseId.trim().length === 0) {
				throw new Error('Valid exerciseId is required');
			}
			
			// Optimistic delete - remove from local store immediately
			const currentExercises = exercises$.get();
			const updatedExercises = currentExercises.filter(
				exercise => !(exercise.id === exerciseId && exercise.user_id === userId)
			);
			exercises$.set(updatedExercises);
			
			// Legend State sync will handle deletion in Supabase automatically
			
		} catch (error) {
			console.error('Failed to delete exercise:', error);
			throw error;
		}
	}

	/**
	 * Subscribe to exercises changes (for backwards compatibility)
	 * With Legend State, the observable itself provides real-time updates
	 */
	subscribeToExercises(uid: string, callback: (exercises: Exercise[]) => void): Unsubscribe {
		// Use Legend State's observe method for reactive updates
		return exercises$.observe(callback);
	}

	/**
	 * New methods for offline-first capabilities
	 */

	/**
	 * Check if we're currently online and syncing
	 */
	isSyncing(): boolean {
		return syncHelpers.isSyncing();
	}

	/**
	 * Check online status
	 */
	isOnline(): boolean {
		return syncHelpers.isOnline();
	}

	/**
	 * Get count of pending changes waiting to sync
	 */
	getPendingChangesCount(): number {
		return syncHelpers.getPendingChangesCount();
	}

	/**
	 * Force manual sync (useful for pull-to-refresh)
	 */
	async forceSync(): Promise<void> {
		await syncHelpers.forceSync();
	}

	/**
	 * Check if there are sync errors
	 */
	hasErrors(): boolean {
		return syncHelpers.hasErrors();
	}

	/**
	 * Get current sync error message
	 */
	getErrorMessage(): string | undefined {
		return syncHelpers.getErrorMessage();
	}
}
