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

type Unsubscribe = () => void;

export class ExerciseRepo {
	private static instance: ExerciseRepo;
	private readonly collectionName = "exercises"; // Made configurable and more appropriate name

	private constructor() { }

	public static getInstance(): ExerciseRepo {
		if (!ExerciseRepo.instance) {
			ExerciseRepo.instance = new ExerciseRepo();
		}
		return ExerciseRepo.instance;
	}

	private validateExerciseData(data: unknown): data is Exercise {
		return (
			data != null &&
			typeof data === "object" &&
			"name" in data &&
			typeof data.name === "string"
		);
	}

	async addExercise(exercise: string): Promise<string> {
		const startTime = Date.now();
		console.log(`[ExerciseRepo] Adding exercise: "${exercise}"`);
		
		try {
			const exerciseCollection = collection(getDb(), this.collectionName);
			const doc = await addDoc(exerciseCollection, { name: exercise });
			const duration = Date.now() - startTime;
			console.log(`[ExerciseRepo] Successfully added exercise "${exercise}" with ID: ${doc.id} (${duration}ms)`);
			return doc.id;
		} catch (error) {
			const duration = Date.now() - startTime;
			console.error(`[ExerciseRepo] Failed to add exercise "${exercise}" after ${duration}ms:`, error);
			throw error;
		}
	}

	async getExerciseById(id: string): Promise<Exercise | undefined> {
		const startTime = Date.now();
		console.log(`[ExerciseRepo] Getting exercise by ID: ${id}`);
		
		try {
			const docRef = doc(getDb(), this.collectionName, id);

			const data = await getDoc(docRef).then((snap) => {
				const data = snap.data();
				if (data === undefined) {
					console.log(`[ExerciseRepo] Exercise with ID ${id} not found`);
					return undefined;
				}
				if (!this.validateExerciseData(data)) {
					console.error(`[ExerciseRepo] Invalid exercise data for ID ${id}:`, data);
					throw new Error("Invalid exercise data from Firestore");
				}
				return { id: snap.id, ...data } as Exercise;
			});
			
			const duration = Date.now() - startTime;
			if (data) {
				console.log(`[ExerciseRepo] Successfully retrieved exercise "${data.name}" (ID: ${id}) (${duration}ms)`);
			} else {
				console.log(`[ExerciseRepo] Exercise with ID ${id} not found (${duration}ms)`);
			}
			return data;
		} catch (error) {
			const duration = Date.now() - startTime;
			console.error(`[ExerciseRepo] Failed to get exercise by ID ${id} after ${duration}ms:`, error);
			throw error;
		}
	}

	async getExercises(): Promise<Exercise[]> {
		const startTime = Date.now();
		console.log("[ExerciseRepo] Getting all exercises");
		
		try {
			const querySnapshot = await getDocs(collection(getDb(), this.collectionName));
			const exercises = querySnapshot.docs.map((doc) => {
				const data = doc.data();
				if (!this.validateExerciseData(data)) {
					console.error(`[ExerciseRepo] Invalid exercise data for doc ${doc.id}:`, data);
					throw new Error(`Invalid exercise data from Firestore for doc ${doc.id}`);
				}
				return { id: doc.id, ...data } as Exercise;
			});
			
			const duration = Date.now() - startTime;
			console.log(`[ExerciseRepo] Successfully retrieved ${exercises.length} exercises (${duration}ms)`);
			return exercises;
		} catch (error) {
			const duration = Date.now() - startTime;
			console.error(`[ExerciseRepo] Failed to get exercises after ${duration}ms:`, error);
			throw error;
		}
	}

	subscribeToExercises(callback: (exercises: Exercise[]) => void): Unsubscribe {
		console.log("[ExerciseRepo] Setting up real-time subscription to exercises");
		
		const exerciseCollection = collection(getDb(), this.collectionName);
		const unsubscribe = onSnapshot(
			exerciseCollection, 
			(querySnapshot) => {
				const startTime = Date.now();
				console.log("[ExerciseRepo] Real-time update received");
				
				try {
					const exercises = querySnapshot.docs.map((doc) => {
						const data = doc.data();
						if (!this.validateExerciseData(data)) {
							console.error(`[ExerciseRepo] Invalid exercise data in subscription for doc ${doc.id}:`, data);
							throw new Error(`Invalid exercise data from Firestore for doc ${doc.id}`);
						}
						return { id: doc.id, ...data } as Exercise;
					});
					
					const duration = Date.now() - startTime;
					console.log(`[ExerciseRepo] Processed ${exercises.length} exercises from real-time update (${duration}ms)`);
					callback(exercises);
				} catch (error) {
					const duration = Date.now() - startTime;
					console.error(`[ExerciseRepo] Error processing real-time update after ${duration}ms:`, error);
					throw error;
				}
			},
			(error) => {
				console.error("[ExerciseRepo] Real-time subscription error:", error);
				console.warn("[ExerciseRepo] Real-time subscription failed, data may not be current");
			}
		);
		
		console.log("[ExerciseRepo] Real-time subscription established");
		return () => {
			console.log("[ExerciseRepo] Unsubscribing from real-time updates");
			unsubscribe();
		};
	}
}
