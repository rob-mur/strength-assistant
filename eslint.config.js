// eslint.config.js
import expoConfig from "eslint-config-expo/flat.js";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import storybookPlugin from "eslint-plugin-storybook";
import jestPlugin from "eslint-plugin-jest";
import unusedImports from "eslint-plugin-unused-imports";
import testingLibraryPlugin from "eslint-plugin-testing-library";

export default [
  ...expoConfig,

  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: ["dist/*", "**/*.json"],
    plugins: {
      "unused-imports": unusedImports,
      storybook: storybookPlugin,
    },
    rules: {
      ...storybookPlugin.configs.recommended.rules,

      "no-unused-vars": "off", // Turn off base rule to avoid conflicts with unused-imports plugin
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: [
      "**/*.{spec,test}.{js,jsx,ts,tsx}",
      "**/__tests__/**/*.{js,jsx,ts,tsx}",
    ],
    plugins: {
      jest: jestPlugin,
      "testing-library": testingLibraryPlugin,
    },
    rules: {
      ...jestPlugin.configs.recommended.rules,
      ...testingLibraryPlugin.configs.react.rules,
    },
  },
  {
    files: ["lib/data/firebase/auth.web.ts"],
    rules: {
      "import/no-unresolved": "off", // Allow compat imports for Firebase auth
    },
  },
  eslintConfigPrettier,
];
