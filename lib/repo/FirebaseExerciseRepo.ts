import { Exercise, ExerciseInput, ExerciseValidator } from "../models/Exercise";
import { IExerciseRepo } from "./IExerciseRepo";
import { Observable, observable } from "@legendapp/state";
import { initializeFirebaseServices, getDb } from "../data/firebase/initializer";
import { Platform } from "react-native";
import { RepositoryLogger } from "./utils/LoggingUtils";
import { RepositoryUtils } from "./utils/RepositoryUtils";

// Platform-specific Firebase types and functions - use runtime detection
type QuerySnapshot = any;
type QueryDocumentSnapshot = any;

// Import modular Firestore functions for web
const getFirebaseModule = () => {
	if (Platform.OS === "web") {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		return require("../data/firebase/firebase.web");
	} else {
		// For native, we use React Native Firebase which has different API
		return null;
	}
};

/**
 * Firebase implementation of ExerciseRepo
 * Uses Firebase Firestore for data persistence with real-time updates
 */
export class FirebaseExerciseRepo implements IExerciseRepo {
	private static instance: FirebaseExerciseRepo;
	private initialized = false;

	private constructor() {
		this.ensureInitialized();
	}

	public static getInstance(): FirebaseExerciseRepo {
		if (!FirebaseExerciseRepo.instance) {
			FirebaseExerciseRepo.instance = new FirebaseExerciseRepo();
		}
		return FirebaseExerciseRepo.instance;
	}

	private ensureInitialized(): void {
		if (!this.initialized) {
			try {
				initializeFirebaseServices();

				// Validate that Firebase is actually ready
				const db = getDb();
				if (!db) {
					throw new Error("Firebase initialization completed but Firestore instance is not available");
				}

				this.initialized = true;
				RepositoryLogger.logSuccess("FirebaseExerciseRepo", "initialize");
			} catch (error: any) {
				RepositoryLogger.logError("FirebaseExerciseRepo", "initialize Firebase services", error);
				this.initialized = false; // Ensure we retry on next call
				throw error;
			}
		}
	}

	/**
	 * Add a new exercise to Firebase Firestore
	 */
	async addExercise(userId: string, exercise: ExerciseInput): Promise<void> {
		this.ensureInitialized();

		try {
			// Validate and sanitize input
			ExerciseValidator.validateExerciseInput(exercise);
			const sanitizedName = ExerciseValidator.sanitizeExerciseName(exercise.name);

			const db = getDb();
			if (!db) {
				throw new Error("Firebase Firestore instance is not available. Ensure Firebase is properly initialized.");
			}

			const newExercise = {
				name: sanitizedName,
				created_at: new Date().toISOString()
			};

			const path = RepositoryUtils.getExercisesCollectionPath(userId);

			if (Platform.OS === "web") {
				// Use modular SDK for web
				const firebaseModule = getFirebaseModule();
				if (!firebaseModule) {
					throw new Error("Firebase web module not available");
				}
				
				const { collection, addDoc } = firebaseModule;
				const exercisesCollection = collection(db, path);
				await addDoc(exercisesCollection, newExercise);
			} else {
				// Use React Native Firebase for native platforms
				const exercisesCollection = db.collection(path);
				await exercisesCollection.add(newExercise);
			}

			RepositoryLogger.logSuccess("FirebaseExerciseRepo", "addExercise");
		} catch (error: any) {
			RepositoryLogger.logError("FirebaseExerciseRepo", "add exercise", error);
			throw error;
		}
	}

	/**
	 * Get all exercises as an Observable
	 */
	getExercises(userId: string): Observable<Exercise[]> {
		this.ensureInitialized();

		const exercises$ = observable<Exercise[]>([]);

		try {
			const exercisesQuery = this.createExercisesQuery(userId);

			// Set up real-time listener
			const unsubscribe = exercisesQuery.onSnapshot((snapshot: QuerySnapshot) => {
				const exercises = this.processSnapshot(snapshot, userId);
				exercises$.set(exercises);
			});

			// Store unsubscribe function for cleanup
			(exercises$ as any)._unsubscribe = unsubscribe;

			RepositoryLogger.logSuccess("FirebaseExerciseRepo", "getExercises");
		} catch (error: any) {
			RepositoryLogger.logError("FirebaseExerciseRepo", "get exercises", error);
		}

		return exercises$;
	}

	/**
	 * Subscribe to real-time exercise updates
	 */
	subscribeToExercises(userId: string, callback: (exercises: Exercise[]) => void): () => void {
		this.ensureInitialized();

		try {
			const exercisesQuery = this.createExercisesQuery(userId);
			
			let unsubscribe: () => void;
			
			if (Platform.OS === "web") {
				// Use modular SDK for web
				const firebaseModule = getFirebaseModule();
				if (!firebaseModule) {
					throw new Error("Firebase web module not available");
				}
				
				const { onSnapshot } = firebaseModule;
				unsubscribe = onSnapshot(exercisesQuery, (snapshot: QuerySnapshot) => {
					const exercises = this.processSnapshot(snapshot, userId);
					callback(exercises);
				});
			} else {
				// Use React Native Firebase for native platforms
				unsubscribe = exercisesQuery.onSnapshot((snapshot: QuerySnapshot) => {
					const exercises = this.processSnapshot(snapshot, userId);
					callback(exercises);
				});
			}

			RepositoryLogger.logSuccess("FirebaseExerciseRepo", "subscribeToExercises");

			return unsubscribe;
		} catch (error: any) {
			RepositoryLogger.logError("FirebaseExerciseRepo", "subscribe to exercises", error);
			// Return no-op function on error
			return () => { };
		}
	}

	/**
	 * Delete an exercise from Firebase Firestore
	 */
	async deleteExercise(userId: string, exerciseId: string): Promise<void> {
		this.ensureInitialized();

		try {
			// Validate exerciseId
			RepositoryUtils.validateExerciseId(exerciseId);

			const db = getDb();
			if (!db) {
				throw new Error("Firebase Firestore instance is not available. Ensure Firebase is properly initialized.");
			}

			const path = RepositoryUtils.getExercisesCollectionPath(userId);

			if (Platform.OS === "web") {
				// Use modular SDK for web
				const firebaseModule = getFirebaseModule();
				if (!firebaseModule) {
					throw new Error("Firebase web module not available");
				}
				
				const { doc, deleteDoc } = firebaseModule;
				const exerciseDoc = doc(db, path, exerciseId);
				await deleteDoc(exerciseDoc);
			} else {
				// Use React Native Firebase for native platforms
				const exerciseDoc = db.collection(path).doc(exerciseId);
				await exerciseDoc.delete();
			}

			RepositoryLogger.logSuccess("FirebaseExerciseRepo", "deleteExercise");
		} catch (error: any) {
			RepositoryLogger.logError("FirebaseExerciseRepo", "delete exercise", error);
			throw error;
		}
	}


	/**
	 * Get a specific exercise by ID for a user
	 */
	async getExerciseById(exerciseId: string, userId: string): Promise<Exercise | undefined> {
		try {
			const exercises$ = this.getExercises(userId);
			const exercises = exercises$.get();
			return exercises.find(exercise => exercise.id === exerciseId);
		} catch (error: any) {
			RepositoryLogger.logError("FirebaseExerciseRepo", "get exercise by ID", error);
			return undefined;
		}
	}

	// Offline-first capabilities (Firebase doesn't directly support these, so we provide defaults)
	/**
	 * Check if the repository is currently syncing data
	 */
	isSyncing(): boolean {
		return false;
	}

	/**
	 * Check if the repository is currently online
	 */
	isOnline(): boolean {
		return navigator.onLine ?? true;
	}

	/**
	 * Get the count of pending changes that need to be synced
	 */
	getPendingChangesCount(): number {
		return 0;
	}

	/**
	 * Force synchronization of pending changes
	 */
	async forceSync(): Promise<void> {
		// Firebase handles sync automatically, no-op
		return Promise.resolve();
	}

	/**
	 * Check if there are any sync errors
	 */
	hasErrors(): boolean {
		return false;
	}

	/**
	 * Get the current error message if any
	 */
	getErrorMessage(): string | null {
		return null;
	}

	/**
	 * Create an exercises query for the given user
	 */
	private createExercisesQuery(userId: string) {
		const db = getDb();
		if (!db) {
			throw new Error("Firebase Firestore instance is not available. Ensure Firebase is properly initialized.");
		}
		
		const path = RepositoryUtils.getExercisesCollectionPath(userId);
		if (Platform.OS === "web") {
			// Use modular SDK for web
			const firebaseModule = getFirebaseModule();
			if (!firebaseModule) {
				throw new Error("Firebase web module not available");
			}
			
			const { collection, query, orderBy } = firebaseModule;
			const exercisesCollection = collection(db, path);
			return query(exercisesCollection, orderBy("created_at", "desc"));
		} else {
			// Use React Native Firebase for native platforms
			const exercisesCollection = db.collection(path);
			return exercisesCollection.orderBy("created_at", "desc");
		}
	}

	/**
	 * Process snapshot data and convert to Exercise array
	 */
	private processSnapshot(snapshot: QuerySnapshot, userId: string): Exercise[] {
		const exercises: Exercise[] = [];
		snapshot.forEach((doc: QueryDocumentSnapshot) => {
			const data = doc.data();
			if (RepositoryUtils.validateExerciseData(data)) {
				exercises.push({
					id: doc.id,
					name: data.name,
					user_id: userId,
					created_at: data.created_at
				});
			}
		});
		return exercises;
	}

}
