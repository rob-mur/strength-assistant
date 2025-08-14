// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const withStorybook = require("@storybook/react-native/metro/withStorybook");

const fs = require("fs");
const path = require("path");

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "android" || platform === "ios") {
    const moduleFolder = moduleName.substring(2);
    const webFileName = `${moduleFolder}/${path.basename(moduleFolder)}.web.ts`;
    const nativeFileName = `${moduleFolder}/${path.basename(moduleFolder)}.native.ts`;
    if (moduleName.startsWith("@/") && fs.existsSync(webFileName)) {
      if (!fs.existsSync(nativeFileName)) {
        throw Error(`Expected native file for ${moduleFolder}`);
      }
      return {
        filePath: `${process.cwd()}/${nativeFileName}`,
        type: "sourceFile",
      };
    }

    return context.resolveRequest(context, moduleName, platform);
  }
};

module.exports = withStorybook(config, {
  enabled: process.env.WITH_STORYBOOK,
  onDisabledRemoveStorybook: true,
});
