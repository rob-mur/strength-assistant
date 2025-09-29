import { Redirect } from "expo-router";

// Only export storybook in development/non-production builds
const isProduction =
  process.env.EAS_BUILD_PROFILE === "production" ||
  process.env.NODE_ENV === "production";

const isChromeIntegrationTest = process.env.CHROME_TEST === "true";

// In production or integration tests, redirect to home
function ProductionStorybook() {
  return <Redirect href="/" />;
}

// In production or integration tests, redirect to home, otherwise use storybook
let StorybookScreen;

if (isProduction || isChromeIntegrationTest) {
  StorybookScreen = ProductionStorybook;
} else {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  StorybookScreen = require("../.rnstorybook").default;
}

export default StorybookScreen;
