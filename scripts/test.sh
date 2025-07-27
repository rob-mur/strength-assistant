#!/usr/bin/env bash

echo "# TypeScript Checks"
npx tsc

echo "# ESLint"
npm run lint

echo "# Formatting"
npm run format:check

echo "# Jest tests"
npx jest
