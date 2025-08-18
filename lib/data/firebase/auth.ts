import { Platform } from "react-native";

let authModule: any;

if (Platform.OS === "web") {
  authModule = require("./auth.web");
} else {
  authModule = require("./auth.native");
}

export const {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  getCurrentUser,
  onAuthStateChanged,
} = authModule;

// Export User type from web implementation as default since both platforms expose the same interface
export type { User } from "./auth.web";