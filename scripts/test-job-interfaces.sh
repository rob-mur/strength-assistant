#!/bin/bash
# T005: Contract validation test for job-interfaces.yml compliance
# This test MUST FAIL until the jobs are properly implemented with correct interfaces

set -e

echo "🧪 Testing job-interfaces.yml contract compliance"

WORKFLOW_FILE=".github/workflows/production-deployment.yml"

# Test 1: Check if workflow file exists
if [ ! -f "$WORKFLOW_FILE" ]; then
    echo "❌ FAIL: Workflow file $WORKFLOW_FILE does not exist"
    exit 1
fi

# Test 2: Build-production-apk job interface validation
echo "📦 Testing build-production-apk job interface..."

# Check required outputs
if ! grep -A20 "build-production-apk:" "$WORKFLOW_FILE" | grep -q "apk-artifact-name:"; then
    echo "❌ FAIL: build-production-apk job missing 'apk-artifact-name' output"
    exit 1
fi

if ! grep -A20 "build-production-apk:" "$WORKFLOW_FILE" | grep -q "apk-filename: build_production.apk"; then
    echo "❌ FAIL: build-production-apk job must output 'apk-filename: build_production.apk'"
    exit 1
fi

# Check GitHub release upload step
if ! grep -A30 "build-production-apk:" "$WORKFLOW_FILE" | grep -q "Upload.*APK.*Artifact"; then
    echo "❌ FAIL: build-production-apk job missing APK upload step"
    exit 1
fi

# Test 3: Terraform-deploy job interface validation
echo "🏗️ Testing terraform-deploy job interface..."

# Check required outputs
if ! grep -A20 "terraform-deploy:" "$WORKFLOW_FILE" | grep -q "deployment-id:"; then
    echo "❌ FAIL: terraform-deploy job missing 'deployment-id' output"
    exit 1
fi

if ! grep -A20 "terraform-deploy:" "$WORKFLOW_FILE" | grep -q "infrastructure-url:"; then
    echo "❌ FAIL: terraform-deploy job missing 'infrastructure-url' output"
    exit 1
fi

# Check dependency on build job
if ! grep -A5 "terraform-deploy:" "$WORKFLOW_FILE" | grep -q "needs: build-production-apk"; then
    echo "❌ FAIL: terraform-deploy job must depend on build-production-apk"
    exit 1
fi

# Test 4: Production-validation job interface validation
echo "🔍 Testing production-validation job interface..."

# Check dependency on both jobs
if ! grep -A5 "production-validation:" "$WORKFLOW_FILE" | grep -q "needs: \[build-production-apk, terraform-deploy\]"; then
    echo "❌ FAIL: production-validation job must depend on both build-production-apk and terraform-deploy"
    exit 1
fi

# Check APK download step
if ! grep -A100 "production-validation:" "$WORKFLOW_FILE" | grep -q "Download.*Production.*APK"; then
    echo "❌ FAIL: production-validation job missing APK download step"
    exit 1
fi

# Check environment variables from terraform job
if ! grep -A100 "production-validation:" "$WORKFLOW_FILE" | grep -q "INFRASTRUCTURE_URL:.*terraform-deploy"; then
    echo "❌ FAIL: production-validation job missing INFRASTRUCTURE_URL from terraform-deploy outputs"
    exit 1
fi

if ! grep -A100 "production-validation:" "$WORKFLOW_FILE" | grep -q "DEPLOYMENT_ID:.*terraform-deploy"; then
    echo "❌ FAIL: production-validation job missing DEPLOYMENT_ID from terraform-deploy outputs"
    exit 1
fi

# Test 5: Artifact sharing validation
echo "📋 Testing artifact sharing between jobs..."

# Check APK filename reference in validation job
if ! grep -A100 "production-validation:" "$WORKFLOW_FILE" | grep -q "build-production-apk.outputs.apk-filename"; then
    echo "❌ FAIL: production-validation job must reference apk-filename from build job"
    exit 1
fi

# Test 6: Anonymous user testing validation
echo "👤 Testing anonymous user testing configuration..."

if ! grep -A100 "production-validation:" "$WORKFLOW_FILE" | grep -q "anonymous.*user"; then
    echo "❌ FAIL: production-validation job must include anonymous user testing"
    exit 1
fi

echo "✅ All job-interfaces.yml contract tests passed"
exit 0