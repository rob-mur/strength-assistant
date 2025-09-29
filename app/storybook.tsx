import { Redirect } from "expo-router";

// Only export storybook in development/non-production builds
const isProduction =
  process.env.EAS_BUILD_PROFILE === "production" ||
  process.env.NODE_ENV === "production";

const isChromeIntegrationTest = process.env.CHROME_TEST === "true";

// In production or integration tests, redirect to home, otherwise use storybook
const StorybookScreen = isProduction || isChromeIntegrationTest
  ? function ProductionStorybook() {
      return <Redirect href="/" />;
    }
  : require("../.rnstorybook").default;

export default StorybookScreen;
