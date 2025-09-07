// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const withStorybook = require("@storybook/react-native/metro/withStorybook");

const fs = require("fs");
const path = require("path");

// Completely disable symbolication for Chrome test environment
if (process.env.CHROME_TEST === 'true' || process.env.CI === 'true') {
  // Disable symbolication entirely to prevent <anonymous> file errors
  config.symbolicateLocation = () => [];
  
  // Override server middleware to reject all symbolication requests
  config.server = config.server || {};
  config.server.enhanceMiddleware = (middleware, server) => {
    return (req, res, next) => {
      if (req.url && req.url.includes('/symbolicate')) {
        // Return empty result immediately without processing
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ stack: [] }));
        return;
      }
      return middleware(req, res, next);
    };
  };
} else {
  // Configure normal symbolication for development
  config.symbolicateLocation = (stackTrace) => {
    return stackTrace.filter((frame) => {
      return frame.file !== '<anonymous>' && !frame.file?.includes('<anonymous>');
    });
  };
}

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
