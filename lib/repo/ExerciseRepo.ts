import firestore from '@react-native-firebase/firestore';
import { Exercise } from "../models/Exercise";


export class ExerciseRepo {

	addExercise = async (exercise: string): Promise<string> => {
		const testCollection = firestore().collection('Test');
		const doc = await testCollection.add({ name: exercise });
		return doc.id;
	};

	getExerciseById = async (id: string): Promise<Exercise | undefined> => {
		const testCollection = firestore().collection('Test');
		const data = await testCollection.doc(id).get().then((snap) => {
			const data = snap.data();
			if (data === undefined) {
				return undefined;
			}
			return data as Exercise;
		});
		return data;
	};

}
