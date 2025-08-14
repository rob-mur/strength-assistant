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
		const exerciseCollection = collection(getDb(), this.collectionName);
		const doc = await addDoc(exerciseCollection, { name: exercise });
		return doc.id;
	}

	async getExerciseById(id: string): Promise<Exercise | undefined> {
		const docRef = doc(getDb(), this.collectionName, id);

		const data = await getDoc(docRef).then((snap) => {
			const data = snap.data();
			if (data === undefined) {
				return undefined;
			}
			if (!this.validateExerciseData(data)) {
				throw new Error("Invalid exercise data from Firestore");
			}
			return { id: snap.id, ...data } as Exercise;
		});
		return data;
	}

	async getExercises(): Promise<Exercise[]> {
		const querySnapshot = await getDocs(collection(getDb(), this.collectionName));
		return querySnapshot.docs.map((doc) => {
			const data = doc.data();
			if (!this.validateExerciseData(data)) {
				throw new Error(`Invalid exercise data from Firestore for doc ${doc.id}`);
			}
			return { id: doc.id, ...data } as Exercise;
		});
	}

	subscribeToExercises(callback: (exercises: Exercise[]) => void): Unsubscribe {
		const exerciseCollection = collection(getDb(), this.collectionName);
		const unsubscribe = onSnapshot(exerciseCollection, (querySnapshot) => {
			const exercises = querySnapshot.docs.map((doc) => {
				const data = doc.data();
				if (!this.validateExerciseData(data)) {
					throw new Error(`Invalid exercise data from Firestore for doc ${doc.id}`);
				}
				return { id: doc.id, ...data } as Exercise;
			});
			callback(exercises);
		});
		return unsubscribe;
	}
}
