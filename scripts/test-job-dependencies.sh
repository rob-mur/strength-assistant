#!/bin/bash
# T008: Integration test for job dependency validation (Scenario 3)
# This test MUST FAIL until job dependencies are properly configured

set -e

echo "🧪 Testing job dependency validation (Scenario 3)"

WORKFLOW_FILE=".github/workflows/production-deployment.yml"

# Test 1: Check workflow file exists
if [ ! -f "$WORKFLOW_FILE" ]; then
    echo "❌ FAIL: Workflow file $WORKFLOW_FILE does not exist"
    exit 1
fi

# Test 2: Check terraform-deploy depends on build-production-apk
TERRAFORM_SECTION=$(grep -A10 "terraform-deploy:" "$WORKFLOW_FILE")
if ! echo "$TERRAFORM_SECTION" | grep -q "needs: build-production-apk"; then
    echo "❌ FAIL: terraform-deploy job must have 'needs: build-production-apk'"
    echo "Found terraform-deploy section:"
    echo "$TERRAFORM_SECTION"
    exit 1
fi

# Test 3: Check production-validation depends on both jobs
VALIDATION_SECTION=$(grep -A10 "production-validation:" "$WORKFLOW_FILE")
if ! echo "$VALIDATION_SECTION" | grep -q "needs: \[build-production-apk, terraform-deploy\]"; then
    echo "❌ FAIL: production-validation job must have 'needs: [build-production-apk, terraform-deploy]'"
    echo "Found production-validation section:"
    echo "$VALIDATION_SECTION"
    exit 1
fi

# Test 4: Check build job has no dependencies (runs first)
BUILD_SECTION=$(grep -A10 "build-production-apk:" "$WORKFLOW_FILE")
if echo "$BUILD_SECTION" | grep -q "needs:"; then
    echo "❌ FAIL: build-production-apk job should not have dependencies (must run first)"
    exit 1
fi

# Test 5: Verify artifact sharing configuration
# Check build job outputs
if ! grep -A20 "build-production-apk:" "$WORKFLOW_FILE" | grep -q "outputs:"; then
    echo "❌ FAIL: build-production-apk job must define outputs for artifact sharing"
    exit 1
fi

# Test 6: Check terraform job outputs
if ! grep -A20 "terraform-deploy:" "$WORKFLOW_FILE" | grep -q "outputs:"; then
    echo "❌ FAIL: terraform-deploy job must define outputs for deployment metadata"
    exit 1
fi

# Test 7: Verify validation job consumes outputs
if ! grep -A100 "production-validation:" "$WORKFLOW_FILE" | grep -q "terraform-deploy.outputs"; then
    echo "❌ FAIL: production-validation job must reference terraform-deploy outputs"
    exit 1
fi

if ! grep -A100 "production-validation:" "$WORKFLOW_FILE" | grep -q "build-production-apk.outputs"; then
    echo "❌ FAIL: production-validation job must reference build-production-apk outputs"
    exit 1
fi

# Test 8: Check for proper job sequencing in workflow structure
# Extract job order from workflow file (looking only in jobs section)
JOBS_ORDER=$(sed -n '/^jobs:/,/^[a-zA-Z]/{/^  [a-zA-Z-]*:/{s/:.*$//;s/^  //;p}}' "$WORKFLOW_FILE" | tr '\n' ' ' | sed 's/ $//')
EXPECTED_ORDER="build-production-apk terraform-deploy production-validation"

if [ "$JOBS_ORDER" != "$EXPECTED_ORDER" ]; then
    echo "❌ FAIL: Jobs not in correct order"
    echo "Expected: $EXPECTED_ORDER"
    echo "Found: $JOBS_ORDER"
    exit 1
fi

# Test 9: Check that all jobs run on ubuntu-latest (consistency)
JOB_SECTIONS=$(grep -A5 "runs-on:" "$WORKFLOW_FILE")
if ! echo "$JOB_SECTIONS" | grep -q "ubuntu-latest"; then
    echo "❌ FAIL: All jobs should run on ubuntu-latest for consistency"
    exit 1
fi

echo "✅ Job dependency validation test passed"
exit 0