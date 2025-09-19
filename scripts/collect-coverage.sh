#!/usr/bin/env bash

set -e

# Change to project root directory (relative to scripts folder)
cd "$(dirname "$0")/.."

# Constitutional Compliance: TypeScript validation before coverage collection
echo "🔍 Constitutional Requirement: Validating TypeScript compilation before coverage collection..."
if ! npx tsc --noEmit; then
    echo "❌ TypeScript compilation failed - cannot proceed with coverage collection"
    exit 1
fi
echo "✅ TypeScript compilation successful - proceeding with coverage collection"

# Clean any existing coverage data to prevent conflicts
rm -rf coverage/ .nyc_output/ lcov.info 2>/dev/null || true

# Create coverage directory with proper permissions
mkdir -p coverage

# Run tests with coverage enabled (override jest.config.js setting)
echo "📊 Collecting test coverage for SonarQube analysis..."
if npm test -- --coverage --coverageReporters=lcov --coverageReporters=text-summary; then
    echo "✅ Coverage collection completed successfully"
    
    # Verify coverage files exist for SonarQube
    if [[ -f "coverage/lcov.info" ]]; then
        echo "✅ LCOV coverage report generated: coverage/lcov.info"
        ls -la coverage/
    else
        echo "⚠️ Warning: LCOV coverage report not found, but tests passed"
        ls -la coverage/ 2>/dev/null || echo "Coverage directory not found"
    fi
else
    echo "❌ Test execution with coverage failed"
    exit 1
fi

