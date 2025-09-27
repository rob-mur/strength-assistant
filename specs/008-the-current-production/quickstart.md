# Quickstart: APK Download Validation Testing

**Feature**: Fix Production APK Download Failure  
**Phase**: 1 (Design & Contracts)  
**Date**: 2025-09-27

## Local Testing Scenarios

### Scenario 1: Verify GitHub Release Assets

**Purpose**: Confirm that APK files are uploaded to GitHub releases

**Prerequisites**:

- GitHub CLI installed and authenticated (`gh auth status`)
- Access to strength-assistant repository
- GITHUB_TOKEN with read permissions

**Test Steps**:

```bash
# Navigate to project directory
cd /home/rob/Documents/Github/strength-assistant

# Check if any releases exist
gh release list --limit 5

# Expected: Should show recent releases with APK assets
# If empty: Problem is in build-production workflow (no releases created)

# View latest release details
gh release view latest

# Expected: Should show assets including *.apk files
# If no APK assets: Problem is APK upload in build workflow
```

**Success Criteria**:

- ✅ At least one release exists
- ✅ Latest release contains APK asset
- ✅ APK asset name matches `*.apk` pattern

**Failure Diagnosis**:

- No releases → Build workflow not creating releases
- Release exists but no APK → APK upload step failing
- APK exists with wrong name → Naming convention mismatch

### Scenario 2: Test APK Download Process

**Purpose**: Verify APK can be downloaded using GitHub CLI

**Prerequisites**:

- Scenario 1 completed successfully
- Write permissions in current directory

**Test Steps**:

```bash
# Create temporary test directory
mkdir -p ./test-artifacts
cd ./test-artifacts

# Attempt APK download (mimics workflow)
gh release download latest --pattern "*.apk" --dir .

# Check download results
ls -la *.apk 2>/dev/null || echo "No APK files downloaded"

# Verify file integrity
for apk in *.apk; do
  if [ -f "$apk" ]; then
    echo "File: $apk"
    echo "Size: $(stat -c%s "$apk") bytes"
    echo "Format: $(head -c 4 "$apk" | od -An -tx1 | tr -d ' ')"
  fi
done

# Cleanup
cd ..
rm -rf ./test-artifacts
```

**Success Criteria**:

- ✅ APK file downloads without errors (exit code 0)
- ✅ File size > 1MB (indicates real application, not empty file)
- ✅ File format starts with `504b0304` (valid ZIP/APK signature)

**Failure Diagnosis**:

- Exit code 2 → Permission denied or file not found
- Empty file → Corrupted upload or download
- Wrong format → File corruption or wrong file type

### Scenario 3: Test Production Validation Workflow Locally

**Purpose**: Execute production validation workflow steps locally using devbox

**Prerequisites**:

- Scenarios 1-2 completed successfully
- devbox installed and configured
- Android testing environment available

**Test Steps**:

```bash
# Set up environment variables (matching workflow)
export SKIP_DATA_CLEANUP=true
export TEST_ENVIRONMENT=production
export NODE_ENV=production

# Navigate to testing directory
cd devbox/android-testing

# Verify devbox environment
devbox version
devbox shell --dry-run

# Download APK (as workflow does)
mkdir -p ../../artifacts
gh release download latest --pattern "*.apk" --dir ../../artifacts

# Set APK path for testing
export APK_PATH=$(ls ../../artifacts/*.apk | head -1)
echo "Testing with APK: $APK_PATH"

# Execute integration test (as workflow does)
devbox run integration_test_android

# Check test results
echo "Test execution completed with exit code: $?"
```

**Success Criteria**:

- ✅ Devbox environment loads without errors
- ✅ APK download completes successfully
- ✅ Integration tests execute without environment errors
- ✅ Test results match expected production validation behavior

**Failure Diagnosis**:

- Devbox errors → Environment configuration issues
- APK download fails → Revisit scenarios 1-2
- Integration test errors → Maestro or testing infrastructure issues

### Scenario 4: Error Condition Testing

**Purpose**: Verify error handling for common failure scenarios

**Prerequisites**:

- Working GitHub CLI authentication
- Understanding of expected error patterns

**Test Steps**:

#### Test 4a: No Releases Scenario

```bash
# Test against repository with no releases (or temporarily rename)
# This should fail with exit code 1
gh release list --repo some-empty-repo/no-releases 2>/dev/null || echo "Expected: No releases found"
```

#### Test 4b: Permission Denied Scenario

```bash
# Test with invalid token (should fail with exit code 2)
GITHUB_TOKEN="invalid-token" gh release download latest --pattern "*.apk" 2>/dev/null || echo "Expected: Permission denied"
```

#### Test 4c: No APK Assets Scenario

```bash
# Download from release without APK files
# Create test release with non-APK assets for this test
gh release download latest --pattern "*.nonexistent" 2>/dev/null || echo "Expected: No matching files"
```

**Success Criteria**:

- ✅ Each error scenario produces appropriate exit codes
- ✅ Error messages are clear and actionable
- ✅ No false positives (success when should fail)

## CI/CD Integration Testing

### GitHub Actions Workflow Test

**Purpose**: Verify production-validation.yml workflow against current repository state

**Prerequisites**:

- Push access to test branch
- GitHub Actions enabled
- Understanding of workflow trigger conditions

**Test Steps**:

```bash
# Trigger workflow manually to test current implementation
gh workflow run production-validation.yml --field terraform_deployment_id="test-$(date +%s)"

# Monitor workflow execution
gh run list --workflow=production-validation.yml --limit=1

# Check workflow status and logs
LATEST_RUN=$(gh run list --workflow=production-validation.yml --limit=1 --json databaseId --jq '.[0].databaseId')
gh run view $LATEST_RUN
gh run view $LATEST_RUN --log
```

**Success Criteria**:

- ✅ Workflow triggers without configuration errors
- ✅ APK download step completes successfully
- ✅ Maestro tests execute without infrastructure failures
- ✅ Overall workflow completes with expected status

## Environment Validation

### Required Tools Check

**Purpose**: Ensure all required tools are available and properly configured

**Test Steps**:

```bash
# Check GitHub CLI
gh --version && gh auth status

# Check devbox
devbox version

# Check local environment
echo "Working directory: $(pwd)"
echo "GITHUB_TOKEN set: ${GITHUB_TOKEN:+yes}"
echo "Node environment: ${NODE_ENV:-not set}"

# Check repository state
git status
git branch --show-current
```

**Success Criteria**:

- ✅ All tools report expected versions
- ✅ Authentication is valid and has necessary permissions
- ✅ Repository is in clean state on appropriate branch

## Performance Validation

### Download Speed Test

**Purpose**: Verify APK download completes within reasonable time limits

**Test Steps**:

```bash
# Time the download process
time gh release download latest --pattern "*.apk" --dir ./speed-test-artifacts

# Check results
ls -la ./speed-test-artifacts/*.apk
rm -rf ./speed-test-artifacts
```

**Success Criteria**:

- ✅ Download completes within 2 minutes
- ✅ No timeout errors
- ✅ File integrity maintained despite speed requirements

## Troubleshooting Guide

### Common Issues and Solutions

1. **"No releases found"**
   - Verify build-production workflow has run successfully
   - Check repository release tab in GitHub web UI
   - Confirm workflow permissions for release creation

2. **"Permission denied" (exit code 2)**
   - Check GITHUB_TOKEN has contents:read permission
   - Verify authentication: `gh auth status`
   - Test with different token or re-authenticate

3. **"No APK files downloaded"**
   - Verify APK was uploaded in build workflow
   - Check asset naming matches `*.apk` pattern
   - Confirm release is published (not draft)

4. **"File corrupted or wrong format"**
   - Re-run build workflow to regenerate APK
   - Check build logs for APK creation errors
   - Verify network connectivity during download

5. **"Integration tests fail"**
   - Check devbox environment configuration
   - Verify Maestro is properly installed
   - Confirm production infrastructure accessibility

This quickstart provides comprehensive testing scenarios to validate the APK download fix before implementing changes to the production validation workflow.
