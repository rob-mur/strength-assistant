#!/usr/bin/env bash

set -e

# Change to project root directory (relative to scripts folder)
cd "$(dirname "$0")/.."

echo "# Package Lock Validation"
# Check if package-lock.json is in sync with package.json
# This will fail if the lock file is out of sync
npm ci --dry-run

echo "# TypeScript Checks"
npx tsc

echo "# ESLint"
npm run lint

echo "# Formatting"
npm run format:check > /dev/null

echo "# Jest tests"
npx jest
