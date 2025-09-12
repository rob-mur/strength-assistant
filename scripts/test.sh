#!/usr/bin/env bash

# Constitutional Amendment v2.5.0: Binary Exit Code Enforcement
# This script MUST return exit code 0 for complete success or non-zero for ANY failure

set -e  # Exit immediately on any command failure
set -o pipefail  # Ensure pipeline failures are caught


# Change to project root directory (relative to scripts folder)
cd "$(dirname "$0")/.."

echo "=== Constitutional Test Execution ==="
echo "Amendment v2.5.0: Binary exit code enforcement active"
echo

# Function to track failures
track_failure() {
    local phase="$1"
    local exit_code="$2"
    if [ "$exit_code" -ne 0 ]; then
        echo "❌ FAILURE in $phase (exit code: $exit_code)"
	exit 1
    else
        echo "✅ SUCCESS in $phase"
    fi
}

echo "# Package Lock Validation"
# T003a Performance: Skip npm ci dry-run for speed (assume packages are up to date)
# Note: Only run npm ci if package-lock.json is newer than node_modules
if [ "package-lock.json" -nt "node_modules" ]; then
  echo "Running npm ci (package-lock newer than node_modules)"
  npm ci --dry-run
  track_failure "Package Lock Validation" $?
else
  echo "Skipping npm ci dry-run (node_modules up to date)"
fi
echo

echo "# TypeScript Compilation Check"
npx tsc --noEmit
track_failure "TypeScript Compilation" $?
echo

echo "# ESLint Code Quality"
npm run lint
track_failure "ESLint" $?
echo

echo "# Code Formatting Check"
npm run format:check > /dev/null
track_failure "Code Formatting" $?
echo

echo "# Jest Test Suite"
npx jest
track_failure "Jest Tests" $?
echo
