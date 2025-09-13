import { Exercise, ExerciseInput, ExerciseValidator } from "../models/Exercise";
import { IExerciseRepo } from "./IExerciseRepo";
import { Observable, observe, computed } from "@legendapp/state";
import { exercises$, user$ } from "../data/store";
import { supabaseClient } from "../data/supabase/SupabaseClient";
import { v4 as uuidv4 } from 'uuid';
import { RepositoryUtils } from "./utils/RepositoryUtils";
import { syncedSupabase } from "@legendapp/state/sync/supabase";

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

	async initialize(): Promise<void> {
		syncedSupabase(exercises$, supabaseClient, 'exercises', 'id', {
			realtime: true,
			modified: 'updated_at',
		});
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

		// Optimistic update
		exercises$.set(current => [...current, newExercise]);
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
		const now = new Date().toISOString();
		return {
			id: uuidv4(),
			name: sanitizedName,
			user_id: userId,
			created_at: now,
			updated_at: now,
			deleted: false,
		};
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
			return exercises$.get().filter(ex => ex.user_id === currentUser.id && !ex.deleted);
		}) as unknown as Observable<Exercise[]>;
	}

	/**
	 * Delete exercise with optimistic updates and error recovery
	 * Note: userId parameter is kept for backwards compatibility but Supabase user ID is used internally
	 */
	async deleteExercise(userId: string, exerciseId: string): Promise<void> {
		// Validate inputs and user authentication
		RepositoryUtils.validateExerciseId(exerciseId);
		const authenticatedUser = await this.validateUserAuthentication(userId);

		// Optimistic delete - mark as deleted locally
		exercises$[exerciseId].deleted.set(true);
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
			const filteredExercises = exercises$.get().filter(ex => ex.user_id === currentUser.id && !ex.deleted);
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
		return exercises$.isSyncing.get();
	}

	/**
	 * Check online status
	 */
	isOnline(): boolean {
		return true; // This should be implemented properly
	}

	/**
	 * Get count of pending changes waiting to sync
	 */
	getPendingChangesCount(): number {
		return 0; // This should be implemented properly
	}

	/**
	 * Force manual sync (useful for pull-to-refresh)
	 */
	async forceSync(): Promise<void> {
		return Promise.resolve(); // This should be implemented properly
	}

	/**
	 * Check if there are sync errors
	 */
	hasErrors(): boolean {
		return false; // This should be implemented properly
	}

	/**
	 * Get current sync error message
	 */
	getErrorMessage(): string | null {
		return null; // This should be implemented properly
	}
}