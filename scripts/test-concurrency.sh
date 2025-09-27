#!/bin/bash
# T009: Integration test for concurrency handling (Scenario 4)
# This test MUST FAIL until concurrency configuration is properly implemented

set -e

echo "🧪 Testing concurrency handling (Scenario 4)"

WORKFLOW_FILE=".github/workflows/production-deployment.yml"

# Test 1: Check workflow file exists
if [ ! -f "$WORKFLOW_FILE" ]; then
    echo "❌ FAIL: Workflow file $WORKFLOW_FILE does not exist"
    exit 1
fi

# Test 2: Check concurrency group is defined
if ! grep -q "^concurrency:" "$WORKFLOW_FILE"; then
    echo "❌ FAIL: Workflow missing 'concurrency:' configuration"
    exit 1
fi

# Test 3: Check concurrency group name
if ! grep -A2 "^concurrency:" "$WORKFLOW_FILE" | grep -q "group: production-deployment"; then
    echo "❌ FAIL: Concurrency group must be 'production-deployment'"
    echo "Found concurrency section:"
    grep -A3 "^concurrency:" "$WORKFLOW_FILE"
    exit 1
fi

# Test 4: Check cancel-in-progress is enabled
if ! grep -A3 "^concurrency:" "$WORKFLOW_FILE" | grep -q "cancel-in-progress: true"; then
    echo "❌ FAIL: Must have 'cancel-in-progress: true' for deployment cancellation"
    echo "Found concurrency section:"
    grep -A3 "^concurrency:" "$WORKFLOW_FILE"
    exit 1
fi

# Test 5: Check workflow triggers on push to main (required for concurrency testing)
if ! grep -A5 "^on:" "$WORKFLOW_FILE" | grep -q "branches:.*main"; then
    echo "❌ FAIL: Workflow must trigger on push to main for concurrency testing"
    exit 1
fi

# Test 6: Verify no conflicting concurrency groups in other workflows
WORKFLOW_DIR=".github/workflows"
if [ -d "$WORKFLOW_DIR" ]; then
    # Check other production-related workflows don't conflict
    OTHER_WORKFLOWS=$(find "$WORKFLOW_DIR" -name "*.yml" -not -name "production-deployment.yml")
    for workflow in $OTHER_WORKFLOWS; do
        if grep -q "group: production-deployment" "$workflow" 2>/dev/null; then
            echo "❌ FAIL: Conflicting concurrency group in $workflow"
            exit 1
        fi
    done
fi

# Test 7: Check that old separate workflows are disabled/removed
CONFLICTING_FILES=("build-production.yml" "terraform-deploy.yml" "production-validation.yml")
for file in "${CONFLICTING_FILES[@]}"; do
    if [ -f ".github/workflows/$file" ]; then
        echo "❌ FAIL: Conflicting workflow $file still active - should be removed to prevent concurrency issues"
        exit 1
    fi
done

# Test 8: Verify GitHub CLI can see the workflow for concurrency testing
WORKFLOW_NAME="Production Deployment"
if ! gh workflow list | grep -q "$WORKFLOW_NAME"; then
    echo "ℹ️  INFO: Workflow '$WORKFLOW_NAME' not yet visible in GitHub CLI (requires commit/push)"
    # Check workflow name in file instead
    if ! grep -q "name: $WORKFLOW_NAME" "$WORKFLOW_FILE"; then
        echo "❌ FAIL: Workflow name '$WORKFLOW_NAME' not found in workflow file"
        exit 1
    fi
fi

# Test 9: Check no timeout configuration (allows operations to run until completion)
if grep -q "timeout-minutes:" "$WORKFLOW_FILE"; then
    echo "❌ FAIL: Workflow should not have timeout-minutes (operations run until completion)"
    exit 1
fi

# Test 10: Verify workflow can handle manual cancellation
if ! grep -q "workflow_dispatch" "$WORKFLOW_FILE"; then
    echo "ℹ️  INFO: Consider adding workflow_dispatch for manual testing of concurrency behavior"
fi

echo "✅ Concurrency handling test passed"
exit 0