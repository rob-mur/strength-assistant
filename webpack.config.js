const path = require('path');

module.exports = {
  resolve: {
    fallback: {
      "tty": false,
      "process": require.resolve("process/browser"),
      "util": false,
      "fs": false
    }
  },
  plugins: [
    new (require('webpack')).ProvidePlugin({
      process: 'process/browser',
    }),
  ]
};