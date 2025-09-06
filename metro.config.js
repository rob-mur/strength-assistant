// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const withStorybook = require("@storybook/react-native/metro/withStorybook");

const fs = require("fs");
const path = require("path");

// Configure custom symbolicate to handle anonymous files gracefully
config.symbolicateLocation = (stackTrace) => {
  return stackTrace.filter((frame) => {
    // Filter out frames with <anonymous> filenames that cause Metro errors
    return frame.file !== '<anonymous>' && !frame.file?.includes('<anonymous>');
  });
};

// Add server configuration to handle symbolication errors gracefully
config.server = config.server || {};
config.server.enhanceMiddleware = (middleware, server) => {
  return (req, res, next) => {
    // Handle symbolication requests that might fail with <anonymous> files
    if (req.url && req.url.includes('/symbolicate')) {
      const originalSend = res.send;
      res.send = function(data) {
        try {
          if (typeof data === 'string' && data.includes('<anonymous>')) {
            // Return empty symbolication result instead of failing
            const emptyResult = JSON.stringify({ stack: [] });
            return originalSend.call(this, emptyResult);
          }
        } catch (error) {
          console.warn('Symbolication middleware error:', error);
        }
        return originalSend.call(this, data);
      };
    }
    return middleware(req, res, next);
  };
};

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
