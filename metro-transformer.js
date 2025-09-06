const upstreamTransformer = require('@expo/metro-config/build/transform-worker/metro-transform-worker');

// Ensure EXPO_ROUTER_APP_ROOT is available for transformation
if (!process.env.EXPO_ROUTER_APP_ROOT) {
  process.env.EXPO_ROUTER_APP_ROOT = './app';
}

module.exports = {
  ...upstreamTransformer,
  transform: function(src, filename, options) {
    // For expo-router context files, pre-process to replace environment variables
    if (filename.includes('expo-router/_ctx.web.js') || filename.includes('expo-router\\_ctx.web.js')) {
      // Replace process.env.EXPO_ROUTER_APP_ROOT with the actual value
      const appRoot = process.env.EXPO_ROUTER_APP_ROOT || './app';
      src = src.replace(/process\.env\.EXPO_ROUTER_APP_ROOT/g, `"${appRoot}"`);
    }
    
    return upstreamTransformer.transform(src, filename, options);
  },
};