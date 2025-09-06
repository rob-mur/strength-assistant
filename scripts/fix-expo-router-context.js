#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Find the expo-router _ctx.web.js file and patch it
function findExpoRouterContext() {
  const possiblePaths = [
    'node_modules/expo-router/_ctx.web.js',
    '../node_modules/expo-router/_ctx.web.js'
  ];
  
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      return possiblePath;
    }
  }
  return null;
}

function patchExpoRouterContext() {
  const contextPath = findExpoRouterContext();
  if (!contextPath) {
    console.log('⚠️  Could not find expo-router _ctx.web.js file to patch');
    return;
  }
  
  console.log(`📝 Patching ${contextPath} to use static app root...`);
  
  try {
    let content = fs.readFileSync(contextPath, 'utf8');
    
    // Replace process.env.EXPO_ROUTER_APP_ROOT with a static value
    const originalContent = content;
    content = content.replace(/process\.env\.EXPO_ROUTER_APP_ROOT/g, '"./app"');
    
    if (content !== originalContent) {
      fs.writeFileSync(contextPath, content, 'utf8');
      console.log('✅ Successfully patched expo-router context file');
    } else {
      console.log('ℹ️  No changes needed - file already contains static values');
    }
  } catch (error) {
    console.error('❌ Failed to patch expo-router context:', error.message);
  }
}

// Run the patch
patchExpoRouterContext();