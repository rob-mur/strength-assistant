import { Platform } from "react-native";

let firebaseModule: any;

if (Platform.OS === "web") {
  firebaseModule = require("./firebase.web");
} else {
  firebaseModule = require("./firebase.native");
}

export const { initFirebase, getDb } = firebaseModule;
export * from Platform.OS === "web" ? "firebase/firestore" : "@react-native-firebase/firestore";

// Export auth functions following the same pattern
export * from "./auth";