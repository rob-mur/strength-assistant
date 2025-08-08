import { initializeApp } from '@react-native-firebase/app';
import { Platform } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// web requires dynamic initialization on web prior to using firebase
if (Platform.OS === 'web') {
	const firebaseConfig = {
		apiKey: "AIzaSyALhajWDEhiAhJl0F_R5aB98fwUSgiHoos",
		authDomain: "strengthassistantdev.firebaseapp.com",
		projectId: "strengthassistantdev",
		storageBucket: "strengthassistantdev.firebasestorage.app",
		messagingSenderId: "969424335861",
		appId: "1:969424335861:web:395e0b79cf332b2e8b66bc",
		measurementId: "G-1DN9PL58HD"
	};
	initializeApp(firebaseConfig);
}

if (__DEV__) {
	firestore().useEmulator('localhost', 8080);
	auth().useEmulator('http://localhost:9099')
}
