import { Exercise } from "../models/Exercise";
import {
	getDb,
	collection,
	doc,
	getDoc,
	getDocs,
	addDoc,
	onSnapshot,
} from "@/lib/data/firebase";
import { logger } from "@/lib/data/firebase/logger";

type Unsubscribe = () => void;

export class ExerciseRepo {
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

	async addExercise(exercise: string, uid: string): Promise<string> {
		const startTime = Date.now();
		this.logDebug(`Adding exercise: "${exercise}" for user: ${uid}`, "add_exercise");
		
		try {
			const exerciseCollection = collection(getDb(), this.getExercisesCollectionPath(uid));
			const doc = await addDoc(exerciseCollection, { name: exercise });
			const duration = Date.now() - startTime;
			this.logDebug(`Successfully added exercise "${exercise}" with ID: ${doc.id} for user: ${uid} (${duration}ms)`, "add_exercise");
			return doc.id;
		} catch (error) {
			const duration = Date.now() - startTime;
			this.logError(`Failed to add exercise "${exercise}" for user: ${uid} after ${duration}ms`, "add_exercise");
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
				return { id: snap.id, ...data } as Exercise;
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

	async getExercises(uid: string): Promise<Exercise[]> {
		const startTime = Date.now();
		this.logDebug(`Getting all exercises for user: ${uid}`, "get_all_exercises");
		
		try {
			const querySnapshot = await getDocs(collection(getDb(), this.getExercisesCollectionPath(uid)));
			const exercises = querySnapshot.docs.map((doc) => {
				const data = doc.data();
				if (!this.validateExerciseData(data)) {
					this.logError(`Invalid exercise data for doc ${doc.id} for user: ${uid}`, "get_all_exercises");
					throw new Error(`Invalid exercise data from Firestore for doc ${doc.id}`);
				}
				return { id: doc.id, ...data } as Exercise;
			});
			
			const duration = Date.now() - startTime;
			this.logDebug(`Successfully retrieved ${exercises.length} exercises for user: ${uid} (${duration}ms)`, "get_all_exercises");
			return exercises;
		} catch (error) {
			const duration = Date.now() - startTime;
			this.logError(`Failed to get exercises for user: ${uid} after ${duration}ms`, "get_all_exercises");
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
						return { id: doc.id, ...data } as Exercise;
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
