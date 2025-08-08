import { Platform } from 'react-native';

// Mobile SDK
import firestoreMobile from '@react-native-firebase/firestore';

// Web SDK
import {
	initializeApp as initializeWebApp
} from 'firebase/app';
import {
	getFirestore as getFirestoreWeb,
	connectFirestoreEmulator as connectFirestoreEmulatorWeb
} from 'firebase/firestore';

let db: any;

if (Platform.OS === 'web') {
	const firebaseConfig = {
		apiKey: "AIzaSyALhajWDEhiAhJl0F_R5aB98fwUSgiHoos",
		authDomain: "strengthassistantdev.firebaseapp.com",
		projectId: "strengthassistantdev",
		storageBucket: "strengthassistantdev.firebasestorage.app",
		messagingSenderId: "969424335861",
		appId: "1:969424335861:web:395e0b79cf332b2e8b66bc",
		measurementId: "G-1DN9PL58HD",
		databaseURL: "dummy"
	};
	const app = initializeWebApp(firebaseConfig);
	db = getFirestoreWeb(app);
	if (__DEV__) {
		connectFirestoreEmulatorWeb(db, 'localhost', 8080);
	}
} else {
	db = firestoreMobile();
	if (__DEV__) {
		db.useEmulator('localhost', 8080); // RNFB native way
	}
}

export { db };
