// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Remove custom transformer - use default Metro transformer

// Configure web polyfills to prevent Node.js module issues
if (config.resolver.alias) {
  config.resolver.alias = {
    ...config.resolver.alias,
    // Disable TTY module for web builds - prevents debug package errors
    tty: false,
    // Use browser-compatible process polyfill
    process: require.resolve("process/browser"),
    // Disable util module for web builds
    util: false,
  };
} else {
  config.resolver.alias = {
    tty: false,
    process: require.resolve("process/browser"),
    util: false,
  };
}

// Ensure proper platform resolution for web builds
config.resolver.platforms = ["web", "native", "ios", "android"];
config.resolver.mainFields = ["browser", "module", "main"];

const fs = require("fs");
const path = require("path");

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const moduleFolder = moduleName.substring(2);
  const webFileName = `${moduleFolder}/${path.basename(moduleFolder)}.web.ts`;
  const nativeFileName = `${moduleFolder}/${path.basename(moduleFolder)}.native.ts`;
  if (moduleName.startsWith("@/") && fs.existsSync(webFileName)) {
    if (!fs.existsSync(nativeFileName)) {
      throw Error(`Expected native file for ${moduleFolder}`);
    }
    const fileName = platform === "web" ? webFileName : nativeFileName;
    return {
      filePath: `${process.cwd()}/${fileName}`,
      type: "sourceFile",
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

// Exclude Storybook from production builds
const isProduction =
  process.env.EAS_BUILD_PROFILE === "production" ||
  process.env.NODE_ENV === "production";

if (isProduction) {
  // Add resolver to exclude all storybook-related files and modules
  const storybookExclusions = [
    /.*\.stories\.(js|jsx|ts|tsx)$/,
    /.*storybook.*/,
    /@storybook\/.*/,
  ];

  // Use blacklistRE for older Metro versions
  if (config.resolver.blacklistRE) {
    config.resolver.blacklistRE.push(...storybookExclusions);
  } else {
    config.resolver.blacklistRE = storybookExclusions;
  }

  // Use blockList for newer Metro versions
  if (Array.isArray(config.resolver.blockList)) {
    config.resolver.blockList.push(...storybookExclusions);
  } else {
    config.resolver.blockList = storybookExclusions;
  }

  module.exports = config;
} else if (process.env.WITH_STORYBOOK) {
  const withStorybook = require("@storybook/react-native/metro/withStorybook");
  module.exports = withStorybook(config, {
    enabled: true,
    onDisabledRemoveStorybook: true,
  });
} else {
  module.exports = config;
}
