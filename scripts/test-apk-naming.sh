#!/bin/bash
# T007: Integration test for APK naming validation (Scenario 2)
# This test MUST FAIL until the APK naming is correctly implemented

set -e

echo "🧪 Testing APK naming validation (Scenario 2)"

WORKFLOW_FILE=".github/workflows/production-deployment.yml"

# Test 1: Check workflow file exists
if [ ! -f "$WORKFLOW_FILE" ]; then
    echo "❌ FAIL: Workflow file $WORKFLOW_FILE does not exist"
    exit 1
fi

# Test 2: Check that build_production.apk is used (not build_preview.apk)
if grep -q "build_preview.apk" "$WORKFLOW_FILE"; then
    echo "❌ FAIL: Workflow still references 'build_preview.apk' - must use 'build_production.apk'"
    echo "Found references:"
    grep -n "build_preview.apk" "$WORKFLOW_FILE"
    exit 1
fi

# Test 3: Check that build_production.apk is explicitly referenced
if ! grep -q "build_production.apk" "$WORKFLOW_FILE"; then
    echo "❌ FAIL: Workflow does not reference 'build_production.apk'"
    exit 1
fi

# Test 4: Check APK filename output in build job
if ! grep -A20 "build-production-apk:" "$WORKFLOW_FILE" | grep -q "apk-filename.*build_production.apk"; then
    echo "❌ FAIL: build-production-apk job must output 'apk-filename: build_production.apk'"
    exit 1
fi

# Test 5: Check that validation job uses the correct APK filename
if ! grep -A100 "production-validation:" "$WORKFLOW_FILE" | grep -q "build-production-apk.outputs.apk-filename"; then
    echo "❌ FAIL: production-validation job must reference APK filename from build job outputs"
    exit 1
fi

# Test 6: Search for any hardcoded incorrect APK references in scripts (excluding test scripts)
SCRIPTS_DIR="scripts"
if [ -d "$SCRIPTS_DIR" ]; then
    # Exclude test scripts from this check as they validly reference the old name for testing
    PROBLEMATIC_FILES=$(find "$SCRIPTS_DIR" -name "*.sh" -not -name "test-*.sh" -exec grep -l "build_preview.apk" {} \; 2>/dev/null)
    if [ -n "$PROBLEMATIC_FILES" ]; then
        echo "❌ FAIL: Found 'build_preview.apk' references in non-test scripts:"
        echo "$PROBLEMATIC_FILES"
        exit 1
    fi
fi

# Test 7: Check that APK artifact naming is consistent
if ! grep -A50 "build-production-apk:" "$WORKFLOW_FILE" | grep -q "production.*apk"; then
    echo "❌ FAIL: APK artifact naming should include 'production' identifier"
    exit 1
fi

# Test 8: Verify GitHub release upload uses correct filename
if ! grep -A60 "build-production-apk:" "$WORKFLOW_FILE" | grep -q "Upload.*APK"; then
    echo "❌ FAIL: build-production-apk job missing APK upload step"
    exit 1
fi

# Test 9: Check validation job downloads correct APK
if ! grep -A100 "production-validation:" "$WORKFLOW_FILE" | grep -q "Download.*Production.*APK"; then
    echo "❌ FAIL: production-validation job must have step to download production APK"
    exit 1
fi

echo "✅ APK naming validation test passed"
exit 0