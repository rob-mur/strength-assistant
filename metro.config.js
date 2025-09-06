// CRITICAL: Set EXPO_ROUTER_APP_ROOT as early as possible for Metro
// This MUST be the very first thing that runs
process.env.EXPO_ROUTER_APP_ROOT = process.env.EXPO_ROUTER_APP_ROOT || './app';

// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Use custom transformer to handle EXPO_ROUTER_APP_ROOT at build time
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('./metro-transformer.js'),
};

const withStorybook = require("@storybook/react-native/metro/withStorybook");

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

module.exports = withStorybook(config, {
  enabled: process.env.WITH_STORYBOOK,
  onDisabledRemoveStorybook: true,
});
