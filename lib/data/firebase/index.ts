// Platform-aware Firebase export
// This will export the appropriate Firebase implementation based on the platform

import { Platform } from "react-native";

if (Platform.OS === "web") {
  // Web platform uses standard Firebase SDK
  export * from "./firebase.web";
} else {
  // Native platforms use React Native Firebase
  export * from "./firebase.native";
}