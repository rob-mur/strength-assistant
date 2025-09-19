import { Platform } from "react-native";
import { view } from "./storybook.requires";

// Use platform-specific AsyncStorage
const getAsyncStorage = () => {
  if (Platform.OS === "web") {
    // Use web-compatible storage to avoid "window is not defined" errors
    return require("../lib/utils/asyncStorage.web").default;
  } else {
    return require("@react-native-async-storage/async-storage").default;
  }
};

const AsyncStorage = getAsyncStorage();

const StorybookUIRoot = view.getStorybookUI({
  storage: {
    getItem: AsyncStorage.getItem,
    setItem: AsyncStorage.setItem,
  },
});

export default StorybookUIRoot;
