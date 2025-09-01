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

	async addExercise(exercise: string, uid: string): Promise<string> {
		const startTime = Date.now();
		logger.debug(`[ExerciseRepo] Adding exercise: "${exercise}" for user: ${uid}`, {
			service: "ExerciseRepo",
			platform: "React Native",
			operation: "add_exercise"
		});
		
		try {
			const exerciseCollection = collection(getDb(), this.getExercisesCollectionPath(uid));
			const doc = await addDoc(exerciseCollection, { name: exercise });
			const duration = Date.now() - startTime;
			logger.debug(`[ExerciseRepo] Successfully added exercise "${exercise}" with ID: ${doc.id} for user: ${uid} (${duration}ms)`, {
				service: "ExerciseRepo",
				platform: "React Native",
				operation: "add_exercise"
			});
			return doc.id;
		} catch (error) {
			const duration = Date.now() - startTime;
			console.error(`[ExerciseRepo] Failed to add exercise "${exercise}" for user: ${uid} after ${duration}ms:`, error);
			throw error;
		}
	}

	async getExerciseById(id: string, uid: string): Promise<Exercise | undefined> {
		const startTime = Date.now();
		logger.debug(`[ExerciseRepo] Getting exercise by ID: ${id} for user: ${uid}`, {
			service: "ExerciseRepo",
			platform: "React Native",
			operation: "get_exercise_by_id"
		});
		
		try {
			const docRef = doc(getDb(), this.getExercisesCollectionPath(uid), id);

			const data = await getDoc(docRef).then((snap) => {
				const data = snap.data();
				if (data === undefined) {
					logger.debug(`[ExerciseRepo] Exercise with ID ${id} not found for user: ${uid}`, {
						service: "ExerciseRepo",
						platform: "React Native",
						operation: "get_exercise_by_id"
					});
					return undefined;
				}
				if (!this.validateExerciseData(data)) {
					console.error(`[ExerciseRepo] Invalid exercise data for ID ${id} for user: ${uid}:`, data);
					throw new Error("Invalid exercise data from Firestore");
				}
				return { id: snap.id, ...data } as Exercise;
			});
			
			const duration = Date.now() - startTime;
			if (data) {
				logger.debug(`[ExerciseRepo] Successfully retrieved exercise "${data.name}" (ID: ${id}) for user: ${uid} (${duration}ms)`, {
				service: "ExerciseRepo",
				platform: "React Native",
				operation: "get_exercise_by_id"
			});
			} else {
				logger.debug(`[ExerciseRepo] Exercise with ID ${id} not found for user: ${uid} (${duration}ms)`, {
				service: "ExerciseRepo",
				platform: "React Native",
				operation: "get_exercise_by_id"
			});
			}
			return data;
		} catch (error) {
			const duration = Date.now() - startTime;
			console.error(`[ExerciseRepo] Failed to get exercise by ID ${id} for user: ${uid} after ${duration}ms:`, error);
			throw error;
		}
	}

	async getExercises(uid: string): Promise<Exercise[]> {
		const startTime = Date.now();
		logger.debug(`[ExerciseRepo] Getting all exercises for user: ${uid}`, {
			service: "ExerciseRepo",
			platform: "React Native",
			operation: "get_all_exercises"
		});
		
		try {
			const querySnapshot = await getDocs(collection(getDb(), this.getExercisesCollectionPath(uid)));
			const exercises = querySnapshot.docs.map((doc) => {
				const data = doc.data();
				if (!this.validateExerciseData(data)) {
					console.error(`[ExerciseRepo] Invalid exercise data for doc ${doc.id} for user: ${uid}:`, data);
					throw new Error(`Invalid exercise data from Firestore for doc ${doc.id}`);
				}
				return { id: doc.id, ...data } as Exercise;
			});
			
			const duration = Date.now() - startTime;
			logger.debug(`[ExerciseRepo] Successfully retrieved ${exercises.length} exercises for user: ${uid} (${duration}ms)`, {
				service: "ExerciseRepo",
				platform: "React Native",
				operation: "get_all_exercises"
			});
			return exercises;
		} catch (error) {
			const duration = Date.now() - startTime;
			console.error(`[ExerciseRepo] Failed to get exercises for user: ${uid} after ${duration}ms:`, error);
			throw error;
		}
	}

	subscribeToExercises(uid: string, callback: (exercises: Exercise[]) => void): Unsubscribe {
		logger.debug(`[ExerciseRepo] Setting up real-time subscription to exercises for user: ${uid}`, {
			service: "ExerciseRepo",
			platform: "React Native",
			operation: "subscribe_exercises"
		});
		
		const exerciseCollection = collection(getDb(), this.getExercisesCollectionPath(uid));
		const unsubscribe = onSnapshot(
			exerciseCollection, 
			(querySnapshot) => {
				const startTime = Date.now();
				logger.debug(`[ExerciseRepo] Real-time update received for user: ${uid}`, {
					service: "ExerciseRepo",
					platform: "React Native",
					operation: "subscribe_exercises"
				});
				
				try {
					const exercises = querySnapshot.docs.map((doc) => {
						const data = doc.data();
						if (!this.validateExerciseData(data)) {
							console.error(`[ExerciseRepo] Invalid exercise data in subscription for doc ${doc.id} for user: ${uid}:`, data);
							throw new Error(`Invalid exercise data from Firestore for doc ${doc.id}`);
						}
						return { id: doc.id, ...data } as Exercise;
					});
					
					const duration = Date.now() - startTime;
					logger.debug(`[ExerciseRepo] Processed ${exercises.length} exercises from real-time update for user: ${uid} (${duration}ms)`, {
						service: "ExerciseRepo",
						platform: "React Native",
						operation: "subscribe_exercises"
					});
					callback(exercises);
				} catch (error) {
					const duration = Date.now() - startTime;
					console.error(`[ExerciseRepo] Error processing real-time update for user: ${uid} after ${duration}ms:`, error);
					throw error;
				}
			},
			(error) => {
				console.error(`[ExerciseRepo] Real-time subscription error for user: ${uid}:`, error);
				console.warn(`[ExerciseRepo] Real-time subscription failed for user: ${uid}, data may not be current`);
			}
		);
		
		logger.debug(`[ExerciseRepo] Real-time subscription established for user: ${uid}`, {
			service: "ExerciseRepo",
			platform: "React Native",
			operation: "subscribe_exercises"
		});
		return () => {
			logger.debug(`[ExerciseRepo] Unsubscribing from real-time updates for user: ${uid}`, {
				service: "ExerciseRepo",
				platform: "React Native",
				operation: "subscribe_exercises"
			});
			unsubscribe();
		};
	}
}
