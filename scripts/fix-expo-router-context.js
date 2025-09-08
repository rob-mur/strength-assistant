#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Find all expo-router files that need patching
function findExpoRouterContextFiles() {
  const contextFiles = ['_ctx.web.js', '_ctx-html.js', '_ctx.js', 'build/onboard/Tutorial.js', 'build/onboard/createEntryFile.js'];
  const nodePaths = ['node_modules/expo-router', '../node_modules/expo-router'];
  const foundFiles = [];
  
  for (const nodePath of nodePaths) {
    for (const contextFile of contextFiles) {
      const fullPath = path.join(nodePath, contextFile);
      if (fs.existsSync(fullPath)) {
        foundFiles.push(fullPath);
      }
    }
    // If we found files in this node_modules, use those
    if (foundFiles.length > 0) {
      break;
    }
  }
  
  return foundFiles;
}

function patchExpoRouterContext() {
  const contextFiles = findExpoRouterContextFiles();
  if (contextFiles.length === 0) {
    console.log('⚠️  Could not find any expo-router context files to patch');
    return;
  }
  
  console.log(`📝 Found ${contextFiles.length} expo-router context files to patch...`);
  
  let totalPatched = 0;
  
  for (const contextPath of contextFiles) {
    console.log(`📝 Patching ${contextPath}...`);
    
    try {
      let content = fs.readFileSync(contextPath, 'utf8');
      
      // Replace process.env.EXPO_ROUTER_ABS_APP_ROOT with a static value
      const originalContent = content;
      content = content.replace(/process\.env\.EXPO_ROUTER_ABS_APP_ROOT/g, '"./app"');
      
      if (content !== originalContent) {
        fs.writeFileSync(contextPath, content, 'utf8');
        console.log(`✅ Successfully patched ${path.basename(contextPath)}`);
        totalPatched++;
      } else {
        console.log(`ℹ️  ${path.basename(contextPath)} already contains static values`);
      }
    } catch (error) {
      console.error(`❌ Failed to patch ${path.basename(contextPath)}:`, error.message);
    }
  }
  
  if (totalPatched > 0) {
    console.log(`🎉 Successfully patched ${totalPatched} expo-router context files`);
  } else {
    console.log('ℹ️  All context files were already up to date');
  }
}

// Run the patch
patchExpoRouterContext();