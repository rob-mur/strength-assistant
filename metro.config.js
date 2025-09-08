// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const withStorybook = require("@storybook/react-native/metro/withStorybook");

const fs = require("fs");
const path = require("path");

// Configure Metro to handle symbolication errors gracefully
const originalReadFileSync = require('fs').readFileSync;
require('fs').readFileSync = function(filename, options) {
  try {
    return originalReadFileSync.call(this, filename, options);
  } catch (error) {
    // If trying to read 'unknown' file for symbolication, return empty content
    if (filename && filename.includes('unknown') && error.code === 'ENOENT') {
      return '';
    }
    throw error;
  }
};

// Configure symbolication middleware for Chrome test compatibility
config.server = config.server || {};
config.server.enhanceMiddleware = (middleware, server) => {
  return (req, res, next) => {
    // Handle symbolication requests more robustly
    if (req.url && (req.url.includes('/symbolicate') || req.url.includes('/source-map'))) {
      if (process.env.CHROME_TEST === 'true' || process.env.CI === 'true') {
        // Block all symbolication requests in test environment
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ stack: [] }));
        return;
      }
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
