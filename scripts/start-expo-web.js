#!/usr/bin/env node

// Pre-launch script to ensure EXPO_ROUTER_APP_ROOT is set before any Metro processing
process.env.EXPO_ROUTER_APP_ROOT = process.env.EXPO_ROUTER_APP_ROOT || './app';

console.log('🚀 Starting Expo web server with EXPO_ROUTER_APP_ROOT:', process.env.EXPO_ROUTER_APP_ROOT);

// Import and run expo start
const { spawn } = require('child_process');
const path = require('path');

// Launch expo start with web flag and port
const expo = spawn('npx', ['expo', 'start', '--web', '--port', '8081'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    EXPO_ROUTER_APP_ROOT: './app'
  },
  cwd: path.resolve(__dirname, '..')
});

expo.on('close', (code) => {
  process.exit(code);
});

expo.on('error', (error) => {
  console.error('Failed to start Expo:', error);
  process.exit(1);
});