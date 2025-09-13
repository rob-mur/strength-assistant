import { IExerciseRepo } from "./IExerciseRepo";
import { ExerciseRepoFactory } from "./ExerciseRepoFactory";

/**
 * Factory-based ExerciseRepo that delegates to appropriate implementation
 * Uses ExerciseRepoFactory to determine whether to use Firebase or Supabase
 * 
 * This class maintains backwards compatibility while enabling feature flag switching
 */
export class ExerciseRepo implements IExerciseRepo {
	private static instance: ExerciseRepo;
	private delegate: IExerciseRepo;

	private constructor() {
		// Initialize delegate - will be refreshed on each getInstance() call
		this.delegate = ExerciseRepoFactory.getInstance();
	}

	public static getInstance(): ExerciseRepo {
		if (!ExerciseRepo.instance) {
			ExerciseRepo.instance = new ExerciseRepo();
		}
		// Always refresh the delegate to respect environment variable changes
		// This ensures the repo uses the correct implementation even if USE_SUPABASE_DATA changes at runtime
		ExerciseRepo.instance.delegate = ExerciseRepoFactory.getInstance();
		return ExerciseRepo.instance;
	}

	/**
	 * Initialize the repository - delegates to the configured implementation
	 */
	async initialize(): Promise<void> {
		return this.delegate.initialize();
	}

	/**
	 * Add a new exercise - delegates to the configured implementation
	 */
	async addExercise(userId: string, exercise: import("../models/Exercise").ExerciseInput): Promise<void> {
		return this.delegate.addExercise(userId, exercise);
	}

	/**
	 * Get all exercises as a reactive observable - delegates to the configured implementation
	 */
	getExercises(userId: string): import("@legendapp/state").Observable<import("../models/Exercise").Exercise[]> {
		return this.delegate.getExercises(userId);
	}

	/**
	 * Subscribe to real-time exercise updates - delegates to the configured implementation
	 */
	subscribeToExercises(uid: string, callback: (exercises: import("../models/Exercise").Exercise[]) => void): () => void {
		return this.delegate.subscribeToExercises(uid, callback);
	}

	/**
	 * Delete an exercise - delegates to the configured implementation
	 */
	async deleteExercise(userId: string, exerciseId: string): Promise<void> {
		return this.delegate.deleteExercise(userId, exerciseId);
	}

	/**
	 * Get a specific exercise by ID - delegates to the configured implementation
	 */
	async getExerciseById(exerciseId: string, userId: string): Promise<import("../models/Exercise").Exercise | undefined> {
		return this.delegate.getExerciseById(exerciseId, userId);
	}

	// Offline-first capabilities - delegates to the configured implementation
	/**
	 * Check if the repository is currently syncing data
	 */
	isSyncing(): boolean {
		return this.delegate.isSyncing();
	}

	/**
	 * Check if the repository is currently online
	 */
	isOnline(): boolean {
		return this.delegate.isOnline();
	}

	/**
	 * Get the count of pending changes that need to be synced
	 */
	getPendingChangesCount(): number {
		return this.delegate.getPendingChangesCount();
	}

	/**
	 * Force synchronization of pending changes
	 */
	async forceSync(): Promise<void> {
		return this.delegate.forceSync();
	}

	/**
	 * Check if there are any sync errors
	 */
	hasErrors(): boolean {
		return this.delegate.hasErrors();
	}

	/**
	 * Get the current error message if any
	 */
	getErrorMessage(): string | null {
		return this.delegate.getErrorMessage();
	}

	/**
	 * Get the current data source being used
	 */
	getCurrentDataSource(): 'firebase' | 'supabase' {
		return ExerciseRepoFactory.getCurrentDataSource();
	}
}
