import { Exercise, ExerciseInput, ExerciseValidator } from "../models/Exercise";
import { IExerciseRepo } from "./IExerciseRepo";
import { Observable, observe, computed } from "@legendapp/state";
import { exercises$, user$ } from "../data/store";
import { supabaseClient } from "../data/supabase/SupabaseClient";
import { v4 as uuidv4 } from 'uuid';
import { RepositoryUtils } from "./utils/RepositoryUtils";
// Note: Using basic legend-state without sync for now
// TODO: Implement proper sync when library supports it

/**
 * Legend State + Supabase implementation of ExerciseRepo
 * Provides offline-first data access with automatic sync
 */
export class SupabaseExerciseRepo implements IExerciseRepo {
	private static instance: SupabaseExerciseRepo;
	private syncInstance: any = null;

	private constructor() { }

	public static getInstance(): SupabaseExerciseRepo {
		if (!SupabaseExerciseRepo.instance) {
			SupabaseExerciseRepo.instance = new SupabaseExerciseRepo();
		}
		return SupabaseExerciseRepo.instance;
	}

	async initialize(): Promise<void> {
		// Initialize the repository and load data
		// Set up real-time subscription for changes
		const channel = supabaseClient.getSupabaseClient()
			.channel('exercises-changes')
			.on('postgres_changes', 
				{ event: '*', schema: 'public', table: 'exercises' },
				async (payload) => {
					// Refresh exercises when data changes on server
					await this.refreshExercises();
				}
			)
			.subscribe();
		
		// Initial load of exercises
		await this.refreshExercises();
	}

	/**
	 * Refresh exercises from Supabase and update the observable store
	 */
	private async refreshExercises(): Promise<void> {
		try {
			const currentUser = await supabaseClient.getCurrentUser();
			if (!currentUser) return;
			
			const { data, error } = await supabaseClient.exercises
				.select('*')
				.eq('user_id', currentUser.id)
				.eq('deleted', false);
				
			if (error) throw error;
			
			const exercises = (data || []).map((ex: any) => ({
				id: ex.id,
				name: ex.name,
				user_id: ex.user_id,
				created_at: ex.created_at || new Date().toISOString(),
				updated_at: ex.updated_at || new Date().toISOString(),
				deleted: ex.deleted || false
			}));
			
			// Update the global store
			exercises$.set(exercises);
		} catch (error) {
			console.error('Failed to refresh exercises:', error);
		}
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

		try {
			// Save to Supabase
			const { error } = await (supabaseClient.exercises as any).insert({
				id: newExercise.id,
				name: newExercise.name,
				user_id: newExercise.user_id,
				created_at: newExercise.created_at,
				updated_at: newExercise.updated_at,
				deleted: false
			});

			if (error) {
				// Revert optimistic update on error
				exercises$.set(current => current.filter(ex => ex.id !== newExercise.id));
				throw error;
			}
		} catch (error) {
			// Revert optimistic update on error
			exercises$.set(current => current.filter(ex => ex.id !== newExercise.id));
			throw error;
		}
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

		// Find the exercise in the array and mark as deleted
		const exercises = exercises$.get();
		const exerciseIndex = exercises.findIndex(ex => ex.id === exerciseId);
		
		if (exerciseIndex === -1) {
			throw new Error('Exercise not found');
		}

		const originalExercise = exercises[exerciseIndex];

		// Optimistic delete - remove from local list
		exercises$.set(current => current.filter(ex => ex.id !== exerciseId));

		try {
			// Soft delete in Supabase
			const { error } = await (supabaseClient.exercises as any)
				.update({ 
					deleted: true, 
					updated_at: new Date().toISOString() 
				})
				.eq('id', exerciseId);

			if (error) {
				// Revert optimistic update on error
				exercises$.set(current => [...current, originalExercise]);
				throw error;
			}
		} catch (error) {
			// Revert optimistic update on error
			exercises$.set(current => [...current, originalExercise]);
			throw error;
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
		if (!this.syncInstance) return false;
		return this.syncInstance.isLoading?.get() || false;
	}

	/**
	 * Check online status
	 */
	isOnline(): boolean {
		if (!this.syncInstance) return false;
		return this.syncInstance.isConnected?.get() || false;
	}

	/**
	 * Get count of pending changes waiting to sync
	 */
	getPendingChangesCount(): number {
		if (!this.syncInstance) return 0;
		return this.syncInstance.getPendingCount?.() || 0;
	}

	/**
	 * Force manual sync (useful for pull-to-refresh)
	 */
	async forceSync(): Promise<void> {
		if (!this.syncInstance) return;
		return this.syncInstance.sync?.();
	}

	/**
	 * Check if there are sync errors
	 */
	hasErrors(): boolean {
		if (!this.syncInstance) return false;
		const error = this.syncInstance.error?.get();
		return error != null;
	}

	/**
	 * Get current sync error message
	 */
	getErrorMessage(): string | null {
		if (!this.syncInstance) return null;
		const error = this.syncInstance.error?.get();
		return error ? error.message || String(error) : null;
	}
}