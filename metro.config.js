// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Remove custom transformer - use default Metro transformer

// Configure polyfills to prevent Node.js module issues in React Native
const nodeModuleAliases = {
  // Disable Node.js modules that don't work in React Native
  tty: false,
  fs: false,
  os: false,
  path: false,
  crypto: false,
  stream: false,
  util: false,
  buffer: false,
  events: false,
  assert: false,
  constants: false,
  // Use browser-compatible process polyfill
  process: require.resolve("process/browser"),
};

if (config.resolver.alias) {
  config.resolver.alias = {
    ...config.resolver.alias,
    ...nodeModuleAliases,
  };
} else {
  config.resolver.alias = nodeModuleAliases;
}

// Ensure proper platform resolution for web builds
config.resolver.platforms = ["web", "native", "ios", "android"];
config.resolver.mainFields = ["browser", "module", "main"];

// Add platform extensions for better resolution
config.resolver.platformExtensions = [
  "native.js",
  "native.ts",
  "native.tsx",
  "web.js",
  "web.ts",
  "web.tsx",
];

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

// Only include Storybook when explicitly requested
if (process.env.WITH_STORYBOOK === "true") {
  const withStorybook = require("@storybook/react-native/metro/withStorybook");
  module.exports = withStorybook(config, {
    enabled: true,
    onDisabledRemoveStorybook: true,
  });
} else {
  // Exclude Storybook by default to avoid Node.js dependencies
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
}
