import { Exercise, ExerciseInput, ExerciseValidator } from "../models/Exercise";
import { IExerciseRepo } from "./IExerciseRepo";
import { Observable, observe, computed } from "@legendapp/state";
import { exercises$, user$ } from "../data/store";
import { syncExerciseToSupabase, deleteExerciseFromSupabase, syncHelpers } from "../data/sync/syncConfig";
import { supabaseClient } from "../data/supabase/SupabaseClient";
import { v4 as uuidv4 } from 'uuid';
import { RepositoryUtils } from "./utils/RepositoryUtils";
/**
 * Legend State + Supabase implementation of ExerciseRepo
 * Provides offline-first data access with automatic sync
 */
export class SupabaseExerciseRepo implements IExerciseRepo {
	private static instance: SupabaseExerciseRepo;

	private constructor() { }

	public static getInstance(): SupabaseExerciseRepo {
		if (!SupabaseExerciseRepo.instance) {
			SupabaseExerciseRepo.instance = new SupabaseExerciseRepo();
		}
		return SupabaseExerciseRepo.instance;
	}

	/**
	 * Add a new exercise with optimistic updates and error recovery
	 * Changes are immediately visible in UI and synced in background
	 * Note: userId parameter is kept for backwards compatibility but Supabase user ID is used internally
	 */
	async addExercise(userId: string, exercise: ExerciseInput): Promise<void> {
		// Validate and prepare exercise data
		const sanitizedName = this.validateAndSanitizeExercise(exercise);
		const authenticatedUser = await this.validateUserAuthentication(userId);
		const newExercise = this.createNewExercise(sanitizedName, authenticatedUser.id);

		// Perform optimistic update with rollback capability
		await this.performOptimisticUpdate(newExercise, () => syncExerciseToSupabase(newExercise));
	}

	/**
	 * Validate and sanitize exercise input
	 */
	private validateAndSanitizeExercise(exercise: ExerciseInput): string {
		ExerciseValidator.validateExerciseInput(exercise);
		return ExerciseValidator.sanitizeExerciseName(exercise.name);
	}

	/**
	 * Validate user authentication and consistency
	 */
	private async validateUserAuthentication(userId: string): Promise<{ id: string }> {
		const supabaseUser = await supabaseClient.getCurrentUser();
		if (!supabaseUser) {
			throw new Error('User not authenticated with Supabase');
		}

		if (userId && userId !== supabaseUser.id) {
			throw new Error(`User ID mismatch: Expected ${userId}, but Supabase user is ${supabaseUser.id}. This may indicate a user mapping issue during Firebase-to-Supabase migration.`);
		}

		return supabaseUser;
	}

	/**
	 * Create new exercise object
	 */
	private createNewExercise(sanitizedName: string, userId: string): Exercise {
		return {
			id: uuidv4(),
			name: sanitizedName,
			user_id: userId,
			created_at: new Date().toISOString()
		};
	}

	/**
	 * Perform optimistic update with rollback on failure
	 */
	private async performOptimisticUpdate<T>(newItem: T, syncOperation: () => Promise<void>): Promise<void> {
		const currentExercises = exercises$.get();
		const rollbackOperation = () => exercises$.set(currentExercises);

		// Optimistic update
		exercises$.set([...currentExercises, newItem] as Exercise[]);

		try {
			await syncOperation();
		} catch (syncError) {
			rollbackOperation();
			throw syncError;
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
	 * Filtered for the authenticated Supabase user
	 * Note: userId parameter is kept for backwards compatibility but Supabase user ID is used internally
	 */
	getExercises(_userId: string): Observable<Exercise[]> {
		// Create a computed observable that filters exercises for the current Supabase user
		return computed(() => {
			const currentUser = user$.get();
			if (!currentUser) return [];
			return exercises$.get().filter(ex => ex.user_id === currentUser.id);
		});
	}

	/**
	 * Delete exercise with optimistic updates and error recovery
	 * Note: userId parameter is kept for backwards compatibility but Supabase user ID is used internally
	 */
	async deleteExercise(userId: string, exerciseId: string): Promise<void> {
		// Validate inputs and user authentication
		RepositoryUtils.validateExerciseId(exerciseId);
		const authenticatedUser = await this.validateUserAuthentication(userId);

		// Perform optimistic delete with rollback capability
		await this.performOptimisticDelete(exerciseId, authenticatedUser.id);
	}


	/**
	 * Perform optimistic delete with rollback on failure
	 */
	private async performOptimisticDelete(exerciseId: string, userId: string): Promise<void> {
		const currentExercises = exercises$.get();
		const rollbackOperation = () => exercises$.set(currentExercises);

		// Optimistic delete - remove from local store immediately
		const updatedExercises = currentExercises.filter(
			exercise => !(exercise.id === exerciseId && exercise.user_id === userId)
		);
		exercises$.set(updatedExercises);

		try {
			await deleteExerciseFromSupabase(exerciseId, userId);
		} catch (syncError) {
			rollbackOperation();
			throw syncError;
		}
	}

	/**
	 * Subscribe to exercises changes (for backwards compatibility)
	 * With Legend State, the observable itself provides real-time updates
	 * Note: uid parameter is kept for backwards compatibility but Supabase user ID is used internally
	 */
	subscribeToExercises(uid: string, callback: (exercises: Exercise[]) => void): () => void {
		// Use Legend State's observe method for reactive updates with Supabase user filtering
		return observe(() => {
			const currentUser = user$.get();
			if (!currentUser) {
				callback([]);
				return;
			}
			const filteredExercises = exercises$.get().filter(ex => ex.user_id === currentUser.id);
			callback(filteredExercises);
		});
	}

	/**
	 * Legacy methods for backwards compatibility with tests
	 */



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
	getErrorMessage(): string | null {
		return syncHelpers.getErrorMessage() ?? null;
	}
}