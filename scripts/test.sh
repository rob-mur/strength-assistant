#!/usr/bin/env bash

# Constitutional Amendment v2.5.0: Binary Exit Code Enforcement
# This script MUST return exit code 1 if ANY component fails
set -e
set -o pipefail

# Change to project root directory (relative to scripts folder)
cd "$(dirname "$0")/.."

# Track overall success/failure for constitutional compliance
OVERALL_EXIT_CODE=0

echo "# Package Lock Validation"
# Check if package-lock.json is in sync with package.json
# This will fail if the lock file is out of sync
if ! npm ci --dry-run; then
    echo "❌ Package lock validation failed"
    OVERALL_EXIT_CODE=1
fi

echo "# TypeScript Checks"
if ! npx tsc; then
    echo "❌ TypeScript compilation failed"
    OVERALL_EXIT_CODE=1
fi

echo "# ESLint"
if ! npm run lint; then
    echo "❌ ESLint failed"
    OVERALL_EXIT_CODE=1
fi

echo "# Formatting"
if ! npm run format:check; then
    echo "❌ Formatting failed"
    OVERALL_EXIT_CODE=1
fi

echo "# Jest tests"
if ! npm test; then
    echo "❌ Jest tests failed"
    OVERALL_EXIT_CODE=1
fi

# Constitutional Amendment v2.5.0: Explicit exit code enforcement
if [ $OVERALL_EXIT_CODE -ne 0 ]; then
    echo ""
    echo "🚨 Constitutional Violation: Test suite failed (Amendment v2.5.0)"
    echo "Exit code: $OVERALL_EXIT_CODE (required: 0 for constitutional compliance)"
    exit $OVERALL_EXIT_CODE
fi

echo ""
echo "✅ All tests passed - Constitutional compliance achieved"
exit 0
