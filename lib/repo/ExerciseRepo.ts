import { Exercise } from "../models/Exercise";
import { getDb } from '@/app/initialise_firebase';
import { collection, doc, addDoc, getDoc } from "firebase/firestore";

export class ExerciseRepo {

	addExercise = async (exercise: string): Promise<string> => {
		const testCollection = collection(getDb(), 'Test');
		const doc = await addDoc(testCollection, { name: exercise })
		return doc.id;
	};

	getExerciseById = async (id: string): Promise<Exercise | undefined> => {
		const docRef = doc(getDb(), 'Test', id);

		const data = await getDoc(docRef).then((snap) => {
			const data = snap.data();
			if (data === undefined) {
				return undefined;
			}
			return data as Exercise;
		});
		return data;
	};

}
