import { Platform } from 'react-native';

// ===== Native RN Firebase =====
import firestoreNative, {
	FirebaseFirestoreTypes as NativeTypes
} from '@react-native-firebase/firestore';

// ===== Web Firebase =====
import {
	initializeApp as initializeWebApp,
	FirebaseApp as WebApp
} from 'firebase/app';
import {
	getFirestore as getFirestoreWeb,
	connectFirestoreEmulator as connectFirestoreEmulatorWeb,
	Firestore as WebFirestore
} from 'firebase/firestore';

// ===== Types =====
type NativeDb = NativeTypes.Module;
type WebDb = WebFirestore;

let db: NativeDb | WebDb | undefined;
let initialized = false;

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

// ===== Init =====
export function initFirebase(): void {
	if (initialized) return;

	if (Platform.OS === 'web') {
		const app: WebApp = initializeWebApp(firebaseConfig);
		const firestore: WebDb = getFirestoreWeb(app);
		if (__DEV__) {
			connectFirestoreEmulatorWeb(firestore, 'localhost', 8080);
		}
		db = firestore;
	} else {
		const firestore: NativeDb = firestoreNative();
		if (__DEV__) {
			firestore.useEmulator('localhost', 8080);
		}
		db = firestore;
	}

	initialized = true;
}

// ===== Getters with overloads =====
export function getDb(): WebDb;
export function getDb(): NativeDb;
export function getDb(): WebDb | NativeDb {
	if (!initialized || !db) {
		throw new Error('Firebase not initialized. Call initFirebase() first.');
	}
	return db!;
}

