// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintConfigPrettier = require("eslint-config-prettier/flat");
// const unusedImport = require("eslint-plugin-unused-imports");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    // plugins: {
    //   "unused-imports": unusedImports,
    // },
    // rules: {
    //   "no-unused-vars": "error",
    //   "unused-imports/no-unused-imports": "error",
    //   "unused-imports/no-unused-vars": [
    //     "warn",
    //     {
    //       vars: "all",
    //       varsIgnorePattern: "^_",
    //       args: "after-used",
    //       argsIgnorePattern: "^_",
    //     },
    // ],
    // },
  },
  eslintConfigPrettier,
]);
