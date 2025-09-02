import { Exercise, ExerciseInput, ExerciseValidator } from "../models/Exercise";
import { IExerciseRepo } from "./IExerciseRepo";
import { observable, Observable } from "@legendapp/state";
import {
	getDb,
	collection,
	doc,
	getDoc,
	getDocs,
	addDoc,
	deleteDoc,
	onSnapshot,
} from "@/lib/data/firebase";
import { logger } from "@/lib/data/firebase/logger";

type Unsubscribe = () => void;

export class ExerciseRepo implements IExerciseRepo {
	private static instance: ExerciseRepo;

	private constructor() { }

	public static getInstance(): ExerciseRepo {
		if (!ExerciseRepo.instance) {
			ExerciseRepo.instance = new ExerciseRepo();
		}
		return ExerciseRepo.instance;
	}

	private getExercisesCollectionPath(uid: string): string {
		return `users/${uid}/exercises`;
	}

	private validateExerciseData(data: unknown): data is Exercise {
		return (
			data != null &&
			typeof data === "object" &&
			"name" in data &&
			typeof data.name === "string"
		);
	}

	private getLogContext(operation: string) {
		return {
			service: "ExerciseRepo",
			platform: "React Native",
			operation
		};
	}

	private logDebug(message: string, operation: string): void {
		logger.debug(`[ExerciseRepo] ${message}`, this.getLogContext(operation));
	}

	private logError(message: string, operation: string): void {
		logger.error(`[ExerciseRepo] ${message}`, this.getLogContext(operation));
	}

	private logWarn(message: string, operation: string): void {
		logger.warn(`[ExerciseRepo] ${message}`, this.getLogContext(operation));
	}

	async addExercise(userId: string, exercise: ExerciseInput): Promise<void> {
		const startTime = Date.now();
		this.logDebug(`Adding exercise: "${exercise.name}" for user: ${userId}`, "add_exercise");
		
		try {
			// Validate and sanitize input
			ExerciseValidator.validateExerciseInput(exercise);
			const sanitizedName = ExerciseValidator.sanitizeExerciseName(exercise.name);
			
			// Validate userId
			if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
				throw new Error('Valid userId is required');
			}
			
			const exerciseCollection = collection(getDb(), this.getExercisesCollectionPath(userId));
			await addDoc(exerciseCollection, { name: sanitizedName });
			const duration = Date.now() - startTime;
			this.logDebug(`Successfully added exercise "${sanitizedName}" for user: ${userId} (${duration}ms)`, "add_exercise");
		} catch (error) {
			const duration = Date.now() - startTime;
			this.logError(`Failed to add exercise "${exercise.name}" for user: ${userId} after ${duration}ms`, "add_exercise");
			throw error;
		}
	}

	async getExerciseById(id: string, uid: string): Promise<Exercise | undefined> {
		const startTime = Date.now();
		this.logDebug(`Getting exercise by ID: ${id} for user: ${uid}`, "get_exercise_by_id");
		
		try {
			const docRef = doc(getDb(), this.getExercisesCollectionPath(uid), id);

			const data = await getDoc(docRef).then((snap) => {
				const data = snap.data();
				if (data === undefined) {
					this.logDebug(`Exercise with ID ${id} not found for user: ${uid}`, "get_exercise_by_id");
					return undefined;
				}
				if (!this.validateExerciseData(data)) {
					this.logError(`Invalid exercise data for ID ${id} for user: ${uid}`, "get_exercise_by_id");
					throw new Error("Invalid exercise data from Firestore");
				}
				return {
					id: snap.id,
					name: data.name,
					user_id: uid,
					created_at: new Date().toISOString()
				} as Exercise;
			});
			
			const duration = Date.now() - startTime;
			if (data) {
				this.logDebug(`Successfully retrieved exercise "${data.name}" (ID: ${id}) for user: ${uid} (${duration}ms)`, "get_exercise_by_id");
			} else {
				this.logDebug(`Exercise with ID ${id} not found for user: ${uid} (${duration}ms)`, "get_exercise_by_id");
			}
			return data;
		} catch (error) {
			const duration = Date.now() - startTime;
			this.logError(`Failed to get exercise by ID ${id} for user: ${uid} after ${duration}ms`, "get_exercise_by_id");
			throw error;
		}
	}

	getExercises(userId: string): Observable<Exercise[]> {
		const exercises$ = observable<Exercise[]>([]);
		
		this.logDebug(`Setting up reactive observable for exercises for user: ${userId}`, "get_exercises");
		
		// Set up real-time subscription that feeds the observable
		this.subscribeToExercises(userId, (exercises) => {
			exercises$.set(exercises);
		});
		
		return exercises$;
	}


	async deleteExercise(userId: string, exerciseId: string): Promise<void> {
		const startTime = Date.now();
		this.logDebug(`Deleting exercise with ID: ${exerciseId} for user: ${userId}`, "delete_exercise");
		
		try {
			// Validate inputs
			if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
				throw new Error('Valid userId is required');
			}
			if (!exerciseId || typeof exerciseId !== 'string' || exerciseId.trim().length === 0) {
				throw new Error('Valid exerciseId is required');
			}
			
			const docRef = doc(getDb(), this.getExercisesCollectionPath(userId), exerciseId);
			await deleteDoc(docRef);
			
			const duration = Date.now() - startTime;
			this.logDebug(`Successfully deleted exercise with ID: ${exerciseId} for user: ${userId} (${duration}ms)`, "delete_exercise");
		} catch (error) {
			const duration = Date.now() - startTime;
			this.logError(`Failed to delete exercise with ID: ${exerciseId} for user: ${userId} after ${duration}ms`, "delete_exercise");
			throw error;
		}
	}

	subscribeToExercises(uid: string, callback: (exercises: Exercise[]) => void): Unsubscribe {
		this.logDebug(`Setting up real-time subscription to exercises for user: ${uid}`, "subscribe_exercises");
		
		const exerciseCollection = collection(getDb(), this.getExercisesCollectionPath(uid));
		const unsubscribe = onSnapshot(
			exerciseCollection, 
			(querySnapshot) => {
				const startTime = Date.now();
				this.logDebug(`Real-time update received for user: ${uid}`, "subscribe_exercises");
				
				try {
					const exercises = querySnapshot.docs.map((doc) => {
						const data = doc.data();
						if (!this.validateExerciseData(data)) {
							this.logError(`Invalid exercise data in subscription for doc ${doc.id} for user: ${uid}`, "subscribe_exercises");
							throw new Error(`Invalid exercise data from Firestore for doc ${doc.id}`);
						}
						return {
							id: doc.id,
							name: data.name,
							user_id: uid,
							created_at: new Date().toISOString()
						} as Exercise;
					});
					
					const duration = Date.now() - startTime;
					this.logDebug(`Processed ${exercises.length} exercises from real-time update for user: ${uid} (${duration}ms)`, "subscribe_exercises");
					callback(exercises);
				} catch (error) {
					const duration = Date.now() - startTime;
					this.logError(`Error processing real-time update for user: ${uid} after ${duration}ms`, "subscribe_exercises");
					throw error;
				}
			},
			(error) => {
				this.logError(`Real-time subscription error for user: ${uid}`, "subscribe_exercises");
				this.logWarn(`Real-time subscription failed for user: ${uid}, data may not be current`, "subscribe_exercises");
			}
		);
		
		this.logDebug(`Real-time subscription established for user: ${uid}`, "subscribe_exercises");
		return () => {
			this.logDebug(`Unsubscribing from real-time updates for user: ${uid}`, "subscribe_exercises");
			unsubscribe();
		};
	}
}
