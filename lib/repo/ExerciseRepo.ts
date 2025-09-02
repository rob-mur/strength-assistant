import { Exercise, ExerciseInput, ExerciseValidator } from "../models/Exercise";
import { IExerciseRepo } from "./IExerciseRepo";
import { Observable, observe, computed } from "@legendapp/state";
import { exercises$, user$ } from "../data/store";
import { syncExerciseToSupabase, deleteExerciseFromSupabase, syncHelpers } from "../data/sync/syncConfig";
import { ExerciseInsert } from "../models/supabase";

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
	 * Add a new exercise with optimistic updates and error recovery
	 * Changes are immediately visible in UI and synced in background
	 */
	async addExercise(userId: string, exercise: ExerciseInput): Promise<void> {
		let rollbackOperation: (() => void) | null = null;
		
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
			
			// Store current state for potential rollback
			const currentExercises = exercises$.get();
			rollbackOperation = () => exercises$.set(currentExercises);
			
			// Optimistic update - immediately add to local store
			exercises$.set([...currentExercises, newExercise]);
			
			// Attempt immediate sync to validate the operation
			try {
				await syncExerciseToSupabase(newExercise);
			} catch (syncError) {
				// Rollback optimistic update on sync failure
				rollbackOperation();
				console.error('Sync failed, rolled back optimistic update:', syncError);
				throw syncError;
			}
			
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
	 * Filtered for the specified user
	 */
	getExercises(userId: string): Observable<Exercise[]> {
		// Create a computed observable that filters exercises for the specific user
		return computed(() => exercises$.get().filter(ex => ex.user_id === userId));
	}

	/**
	 * Delete exercise with optimistic updates and error recovery
	 */
	async deleteExercise(userId: string, exerciseId: string): Promise<void> {
		let rollbackOperation: (() => void) | null = null;
		
		try {
			// Validate inputs
			if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
				throw new Error('Valid userId is required');
			}
			if (!exerciseId || typeof exerciseId !== 'string' || exerciseId.trim().length === 0) {
				throw new Error('Valid exerciseId is required');
			}
			
			// Store current state for potential rollback
			const currentExercises = exercises$.get();
			rollbackOperation = () => exercises$.set(currentExercises);
			
			// Optimistic delete - remove from local store immediately
			const updatedExercises = currentExercises.filter(
				exercise => !(exercise.id === exerciseId && exercise.user_id === userId)
			);
			exercises$.set(updatedExercises);
			
			// Attempt immediate sync to validate the operation
			try {
				await deleteExerciseFromSupabase(exerciseId, userId);
			} catch (syncError) {
				// Rollback optimistic update on sync failure
				rollbackOperation();
				console.error('Delete sync failed, rolled back optimistic update:', syncError);
				throw syncError;
			}
			
		} catch (error) {
			console.error('Failed to delete exercise:', error);
			throw error;
		}
	}

	/**
	 * Subscribe to exercises changes (for backwards compatibility)
	 * With Legend State, the observable itself provides real-time updates
	 */
	subscribeToExercises(uid: string, callback: (exercises: Exercise[]) => void): () => void {
		// Use Legend State's observe method for reactive updates with user filtering
		return observe(() => {
			const filteredExercises = exercises$.get().filter(ex => ex.user_id === uid);
			callback(filteredExercises);
		});
	}

	/**
	 * Legacy methods for backwards compatibility with tests
	 */

	/**
	 * Get exercises collection path (legacy method for tests)
	 */
	private getExercisesCollectionPath(userId: string): string {
		return `users/${userId}/exercises`;
	}

	/**
	 * Validate exercise data (legacy method for tests)
	 */
	private validateExerciseData(data: any): boolean {
		if (data === null || data === undefined) return false;
		if (typeof data !== 'object') return false;
		if (typeof data.name !== 'string') return false;
		if (data.name.trim().length === 0) return false;
		return true;
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
