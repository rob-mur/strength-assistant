// Metro transformer to handle TTY polyfill issues during web builds
const upstreamTransformer = require("metro-react-native-babel-transformer");

module.exports.transform = ({ src, filename, options, plugins }) => {
  // Handle debug package TTY issue in web builds
  if (filename.includes("node_modules/debug/src/node.js") && options.platform === "web") {
    // Replace process.stdout.isTTY calls with false for web builds
    src = src.replace(
      /process\.stdout\.isTTY/g,
      "false"
    );
    
    // Replace process.stderr.isTTY calls with false for web builds  
    src = src.replace(
      /process\.stderr\.isTTY/g,
      "false"
    );
    
    // Replace t.isatty calls with false for web builds
    src = src.replace(
      /t\.isatty\([^)]*\)/g,
      "false"
    );
  }
  
  return upstreamTransformer.transform({
    src,
    filename,
    options,
    plugins,
  });
};