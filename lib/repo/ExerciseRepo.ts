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

	private constructor() { }

	public static getInstance(): ExerciseRepo {
		if (!ExerciseRepo.instance) {
			ExerciseRepo.instance = new ExerciseRepo();
		}
		return ExerciseRepo.instance;
	}

	async addExercise(exercise: string): Promise<string> {
		const testCollection = collection(getDb(), "Test");
		const doc = await addDoc(testCollection, { name: exercise });
		return doc.id;
	}

	async getExerciseById(id: string): Promise<Exercise | undefined> {
		const docRef = doc(getDb(), "Test", id);

		const data = await getDoc(docRef).then((snap) => {
			const data = snap.data();
			if (data === undefined) {
				return undefined;
			}
			return data as Exercise;
		});
		return data;
	}

	async getExercises(): Promise<Exercise[]> {
		const querySnapshot = await getDocs(collection(getDb(), "Test"));
		return querySnapshot.docs.map(
			(doc) => ({ id: doc.id, ...doc.data() }) as Exercise,
		);
	}

	subscribeToExercises(callback: (exercises: Exercise[]) => void): Unsubscribe {
		const testCollection = collection(getDb(), "Test");
		const unsubscribe = onSnapshot(testCollection, (querySnapshot) => {
			const exercises = querySnapshot.docs.map(
				(doc) => ({ id: doc.id, ...doc.data() }) as Exercise,
			);
			callback(exercises);
		});
		return unsubscribe;
	}
}
