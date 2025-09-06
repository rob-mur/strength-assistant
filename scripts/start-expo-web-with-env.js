#!/usr/bin/env node

// Ensure EXPO_ROUTER_APP_ROOT is set before any Metro processing
process.env.EXPO_ROUTER_APP_ROOT = process.env.EXPO_ROUTER_APP_ROOT || './app';

// Force the environment variable to be available to all child processes
const originalSpawn = require('child_process').spawn;
require('child_process').spawn = function(command, args, options) {
  if (options && options.env) {
    options.env.EXPO_ROUTER_APP_ROOT = process.env.EXPO_ROUTER_APP_ROOT;
  } else if (options) {
    options.env = { ...process.env, EXPO_ROUTER_APP_ROOT: process.env.EXPO_ROUTER_APP_ROOT };
  } else {
    options = { env: { ...process.env, EXPO_ROUTER_APP_ROOT: process.env.EXPO_ROUTER_APP_ROOT } };
  }
  return originalSpawn.call(this, command, args, options);
};

// Now require and run expo CLI
const { Command } = require('@expo/cli');

// Parse command line arguments
const args = process.argv.slice(2);
console.log('Starting Expo with EXPO_ROUTER_APP_ROOT:', process.env.EXPO_ROUTER_APP_ROOT);

// Start expo with the provided arguments
const command = new Command();
command.start(args).catch(error => {
  console.error('Failed to start Expo:', error);
  process.exit(1);
});