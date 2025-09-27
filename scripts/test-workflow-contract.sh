#!/bin/bash
# T004: Contract validation test for unified-deployment-workflow.yml structure
# This test MUST FAIL until the unified workflow is implemented

set -e

echo "🧪 Testing unified-deployment-workflow.yml contract compliance"

WORKFLOW_FILE=".github/workflows/production-deployment.yml"

# Test 1: Check if unified workflow file exists
if [ ! -f "$WORKFLOW_FILE" ]; then
    echo "❌ FAIL: Unified workflow file $WORKFLOW_FILE does not exist"
    exit 1
fi

# Test 2: Validate basic YAML structure
if ! yamllint "$WORKFLOW_FILE" 2>/dev/null; then
    echo "❌ FAIL: Workflow file has invalid YAML syntax"
    exit 1
fi

# Test 3: Check workflow name
WORKFLOW_NAME=$(grep "^name:" "$WORKFLOW_FILE" | sed 's/name: *//' | tr -d '"')
if [ "$WORKFLOW_NAME" != "Production Deployment" ]; then
    echo "❌ FAIL: Expected workflow name 'Production Deployment', got '$WORKFLOW_NAME'"
    exit 1
fi

# Test 4: Check trigger configuration
if ! grep -q "branches: \[main\]" "$WORKFLOW_FILE"; then
    echo "❌ FAIL: Workflow must be triggered by push to main branch"
    exit 1
fi

# Test 5: Check concurrency configuration
if ! grep -q "group: production-deployment" "$WORKFLOW_FILE"; then
    echo "❌ FAIL: Missing concurrency group 'production-deployment'"
    exit 1
fi

if ! grep -q "cancel-in-progress: true" "$WORKFLOW_FILE"; then
    echo "❌ FAIL: Missing 'cancel-in-progress: true' for deployment cancellation"
    exit 1
fi

# Test 6: Check required jobs exist
REQUIRED_JOBS=("build-production-apk" "terraform-deploy" "production-validation")
for job in "${REQUIRED_JOBS[@]}"; do
    if ! grep -q "^  $job:" "$WORKFLOW_FILE"; then
        echo "❌ FAIL: Required job '$job' not found in workflow"
        exit 1
    fi
done

# Test 7: Check job dependencies
if ! grep -A5 "terraform-deploy:" "$WORKFLOW_FILE" | grep -q "needs: build-production-apk"; then
    echo "❌ FAIL: terraform-deploy job must depend on build-production-apk"
    exit 1
fi

if ! grep -A5 "production-validation:" "$WORKFLOW_FILE" | grep -q "needs: \[build-production-apk, terraform-deploy\]"; then
    echo "❌ FAIL: production-validation job must depend on both build-production-apk and terraform-deploy"
    exit 1
fi

# Test 8: Check APK naming consistency
if ! grep -q "build_production.apk" "$WORKFLOW_FILE"; then
    echo "❌ FAIL: Workflow must use 'build_production.apk' filename (not build_preview.apk)"
    exit 1
fi

# Test 9: Check artifact outputs
if ! grep -A10 "build-production-apk:" "$WORKFLOW_FILE" | grep -q "outputs:"; then
    echo "❌ FAIL: build-production-apk job must define outputs for artifact sharing"
    exit 1
fi

echo "✅ All unified-deployment-workflow.yml contract tests passed"
exit 0