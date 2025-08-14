#!/usr/bin/env bash

set -e

echo "# Package Lock Validation"
# Check if package-lock.json is in sync with package.json
# This will fail if the lock file is out of sync
npm install --dry-run --package-lock-only

echo "# TypeScript Checks"
npx tsc

echo "# ESLint"
npm run lint

echo "# Formatting"
npm run format:check > /dev/null

echo "# Jest tests"
npx jest
