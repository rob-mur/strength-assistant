import { Platform } from "react-native";

let firebaseModule: any;

if (Platform.OS === "web") {
	firebaseModule = require("./firebase.web");
} else {
	firebaseModule = require("./firebase.native");
}

// Re-export the Firebase initialization function
export const initFirebase = firebaseModule.initFirebase;
export const getDb = firebaseModule.getDb;