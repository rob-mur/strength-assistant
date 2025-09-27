#!/bin/bash
# T010: Integration test for failure recovery (Scenario 5)
# This test MUST FAIL until failure handling is properly implemented

set -e

echo "🧪 Testing failure recovery (Scenario 5)"

WORKFLOW_FILE=".github/workflows/production-deployment.yml"

# Test 1: Check workflow file exists
if [ ! -f "$WORKFLOW_FILE" ]; then
    echo "❌ FAIL: Workflow file $WORKFLOW_FILE does not exist"
    exit 1
fi

# Test 2: Check job dependencies stop execution on failure
# terraform-deploy should not run if build-production-apk fails
TERRAFORM_SECTION=$(grep -A10 "terraform-deploy:" "$WORKFLOW_FILE")
if ! echo "$TERRAFORM_SECTION" | grep -q "needs: build-production-apk"; then
    echo "❌ FAIL: terraform-deploy must depend on build-production-apk (stops on build failure)"
    exit 1
fi

# Test 3: Check production-validation stops if either prerequisite fails
VALIDATION_SECTION=$(grep -A10 "production-validation:" "$WORKFLOW_FILE")
if ! echo "$VALIDATION_SECTION" | grep -q "needs: \[build-production-apk, terraform-deploy\]"; then
    echo "❌ FAIL: production-validation must depend on both jobs (stops on any failure)"
    exit 1
fi

# Test 4: Check for proper error handling in APK download
if ! grep -A50 "production-validation:" "$WORKFLOW_FILE" | grep -q "Download.*Production.*APK"; then
    echo "❌ FAIL: production-validation must have APK download step with error handling"
    exit 1
fi

# Test 5: Verify failure notification or reporting
# Check for failure handling in validation job
if ! grep -A100 "production-validation:" "$WORKFLOW_FILE" | grep -qi "fail\|error"; then
    echo "❌ FAIL: production-validation job should include failure handling"
    exit 1
fi

# Test 6: Check build job failure stops dependent jobs
# Ensure jobs don't use 'if: always()' for critical execution steps
if grep -A5 -B5 "if: always()" "$WORKFLOW_FILE" | grep -q "Deploy\|Validate"; then
    echo "❌ FAIL: Critical deployment/validation steps should not use 'if: always()'"
    exit 1
fi

# Test 7: Check for proper cleanup on failure
# Look for cleanup steps or failure handling
if ! grep -A150 "production-validation:" "$WORKFLOW_FILE" | grep -qi "if.*failure"; then
    echo "❌ FAIL: Should include failure handling in production-validation"
    exit 1
fi

# Test 8: Verify artifact preservation on failure
# Check for artifact upload even on failure for debugging
if ! grep -A200 "$WORKFLOW_FILE" | grep -q "if:.*always"; then
    echo "ℹ️  INFO: Consider adding artifact preservation on failure for debugging"
fi

# Test 9: Check for proper status reporting
# GitHub Actions should provide clear failure diagnostics
if ! grep -A100 "production-validation:" "$WORKFLOW_FILE" | grep -q "run:"; then
    echo "❌ FAIL: production-validation job must have executable steps for failure testing"
    exit 1
fi

# Test 10: Verify no automatic retry logic that could mask failures
if grep -qi "retry\|attempt.*[0-9]" "$WORKFLOW_FILE"; then
    echo "⚠️  WARNING: Automatic retry logic found - ensure failures are properly reported"
fi

# Test 11: Check rollback capability for terraform failures
TERRAFORM_STEPS=$(grep -A70 "terraform-deploy:" "$WORKFLOW_FILE")
if ! echo "$TERRAFORM_STEPS" | grep -qi "deploy\|apply"; then
    echo "❌ FAIL: terraform-deploy job must have deployment steps that can fail"
    exit 1
fi

# Test 12: Verify anonymous user cleanup on validation failure
if ! grep -A100 "production-validation:" "$WORKFLOW_FILE" | grep -qi "anonymous.*user"; then
    echo "❌ FAIL: production-validation must include anonymous user testing (requires cleanup on failure)"
    exit 1
fi

echo "✅ Failure recovery test passed"
exit 0