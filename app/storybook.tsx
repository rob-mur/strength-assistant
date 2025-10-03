import { Redirect } from "expo-router";

// Only use storybook when explicitly enabled
const isStorybookEnabled = process.env.WITH_STORYBOOK === "true";

// If storybook is not enabled, redirect to home
const StorybookScreen = isStorybookEnabled
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("../.rnstorybook").default
  : function DisabledStorybook() {
      return <Redirect href="/" />;
    };

export default StorybookScreen;
