#!/usr/bin/env bash

set -e

echo "# TypeScript Checks"
npx tsc

echo "# ESLint"
npm run lint

echo "# Formatting"
npm run format:check > /dev/null

echo "# Jest tests"
npx jest
