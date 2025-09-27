#!/bin/bash
# T006: Integration test for basic workflow execution (Scenario 1)
# This test MUST FAIL until the unified workflow is properly implemented

set -e

echo "🧪 Testing basic workflow execution (Scenario 1)"

WORKFLOW_NAME="Production Deployment"

# Test 1: Check if unified workflow can be found by GitHub CLI
if ! gh workflow list | grep -q "$WORKFLOW_NAME"; then
    echo "❌ FAIL: Workflow '$WORKFLOW_NAME' not found in repository"
    echo "Available workflows:"
    gh workflow list
    exit 1
fi

# Test 2: Check workflow file structure for main branch trigger
WORKFLOW_FILE=".github/workflows/production-deployment.yml"
if [ ! -f "$WORKFLOW_FILE" ]; then
    echo "❌ FAIL: Workflow file $WORKFLOW_FILE does not exist"
    exit 1
fi

# Test 3: Verify workflow triggers on push to main
if ! grep -A5 "^on:" "$WORKFLOW_FILE" | grep -q "branches:.*main"; then
    echo "❌ FAIL: Workflow must trigger on push to main branch"
    exit 1
fi

# Test 4: Check that workflow has exactly 3 jobs in correct sequence
JOB_COUNT=$(grep "^  [a-zA-Z-]*:" "$WORKFLOW_FILE" | grep -v "^  #" | wc -l)
if [ "$JOB_COUNT" -ne 3 ]; then
    echo "❌ FAIL: Expected 3 jobs, found $JOB_COUNT"
    exit 1
fi

# Test 5: Verify job order and dependencies
JOBS=$(grep "^  [a-zA-Z-]*:" "$WORKFLOW_FILE" | sed 's/:.*$//' | sed 's/^  //')
EXPECTED_JOBS=("build-production-apk" "terraform-deploy" "production-validation")

JOB_ARRAY=($JOBS)
for i in "${!EXPECTED_JOBS[@]}"; do
    if [ "${JOB_ARRAY[$i]}" != "${EXPECTED_JOBS[$i]}" ]; then
        echo "❌ FAIL: Job $((i+1)) should be '${EXPECTED_JOBS[$i]}', found '${JOB_ARRAY[$i]}'"
        exit 1
    fi
done

# Test 6: Check that no separate workflows exist for the same functionality
CONFLICTING_WORKFLOWS=("build-production.yml" "terraform-deploy.yml" "production-validation.yml")
for workflow in "${CONFLICTING_WORKFLOWS[@]}"; do
    if [ -f ".github/workflows/$workflow" ]; then
        echo "❌ FAIL: Conflicting workflow $workflow still exists - should be removed/disabled"
        exit 1
    fi
done

# Test 7: Validate YAML syntax
if ! yamllint "$WORKFLOW_FILE" 2>/dev/null; then
    echo "❌ FAIL: Workflow file has invalid YAML syntax"
    exit 1
fi

# Test 8: Check workflow can be viewed by GitHub CLI
if ! gh workflow view "$WORKFLOW_NAME" >/dev/null 2>&1; then
    echo "❌ FAIL: Cannot view workflow '$WORKFLOW_NAME' via GitHub CLI"
    exit 1
fi

echo "✅ Basic workflow execution test passed"
exit 0