const path = require('path');

module.exports = {
  resolve: {
    fallback: {
      // Completely disable TTY to prevent debug package from trying to access process.stdout.isTTY
      "tty": false,
      // Use browser-compatible process implementation
      "process": require.resolve("process/browser"),
      // Disable other Node.js modules that may cause issues in web builds
      "util": false,
      "fs": false,
      "path": false,
      "os": false,
      "crypto": false,
    }
  },
  plugins: [
    new (require('webpack')).ProvidePlugin({
      process: 'process/browser',
    }),
  ],
  // Define global variables to prevent undefined errors in web environment
  define: {
    'process.stdout': JSON.stringify({}),
    'process.stdout.isTTY': JSON.stringify(false),
  }
};