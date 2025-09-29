import { Redirect } from "expo-router";

// Only export storybook in development/non-production builds
const isProduction =
  process.env.EAS_BUILD_PROFILE === "production" ||
  process.env.NODE_ENV === "production";

// In production, redirect to home, otherwise use storybook
const StorybookScreen = isProduction
  ? function ProductionStorybook() {
      return <Redirect href="/" />;
    }
  : require("../.rnstorybook").default;

export default StorybookScreen;
