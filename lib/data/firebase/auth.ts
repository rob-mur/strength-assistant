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

export type { User } from Platform.OS === "web" ? "./auth.web" : "./auth.native";