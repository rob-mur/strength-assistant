# Quickstart: Production Server Testing Enhancement

**Feature**: 004-one-point-to | **Branch**: `004-one-point-to`

## Overview

Modify the production validation workflow to reuse existing GitHub release artifacts instead of rebuilding the production APK, reducing build time and ensuring consistency between builds and validation tests.

## Prerequisites

- Existing GitHub release artifacts created by `build-production.yml`
- GitHub CLI (`gh`) available in GitHub Actions environment
- Maestro testing environment configured in `devbox/android-testing`
- Production infrastructure deployed via terraform

## Implementation Steps

### Step 1: Modify Production Validation Workflow

**File**: `.github/workflows/production-validation.yml`

**Change**: Replace APK build step with artifact download

**Before**:
```yaml
- name: Build Production APK
  uses: ./.github/actions/android-build
  with:
    build-type: production
    devbox-config: android-build
    artifact-name: production-apk
  id: build-apk
```

**After** (Implemented with comprehensive error handling):
```yaml
- name: Download Production APK
  shell: bash
  run: |
    # Create artifacts directory
    mkdir -p ./artifacts
    
    # Check if any releases exist
    if ! gh release list --limit 1 >/dev/null 2>&1; then
      echo "::error title=No GitHub Releases Found::No GitHub releases exist for this repository. Check if build-production workflow completed successfully."
      exit 1
    fi
    
    # Download with retry logic (3 attempts, exponential backoff)
    MAX_RETRIES=3
    RETRY_COUNT=0
    DOWNLOAD_SUCCESS=false
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$DOWNLOAD_SUCCESS" = false ]; do
      RETRY_COUNT=$((RETRY_COUNT + 1))
      echo "📥 APK download attempt $RETRY_COUNT of $MAX_RETRIES..."
      
      if gh release download latest --pattern "*.apk" --dir ./artifacts 2>/dev/null; then
        DOWNLOAD_SUCCESS=true
        echo "✅ APK download succeeded on attempt $RETRY_COUNT"
      else
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
          DELAY=$((2 ** $RETRY_COUNT))
          echo "::warning::Download attempt $RETRY_COUNT failed. Retrying in ${DELAY} seconds..."
          sleep $DELAY
        fi
      fi
    done
    
    if [ "$DOWNLOAD_SUCCESS" = false ]; then
      echo "::error title=APK Download Failed::Failed to download APK after $MAX_RETRIES attempts."
      exit 2
    fi
    
    # Validate APK file integrity and format
    APK_FILE=$(ls ./artifacts/*.apk 2>/dev/null | head -1)
    if [ ! -f "$APK_FILE" ] || [ ! -s "$APK_FILE" ]; then
      echo "::error title=No Valid APK Found::No valid APK files in release assets."
      exit 3
    fi
    
    # Validate APK format (ZIP signature check)
    APK_HEADER=$(head -c 4 "$APK_FILE" | od -An -tx1 | tr -d ' ')
    if [ "$APK_HEADER" != "504b0304" ]; then
      echo "::error title=Invalid APK Format::Downloaded file is not a valid APK."
      exit 5
    fi
    
    echo "✅ Successfully downloaded and validated APK: $APK_FILE"
    echo "📁 File size: $(stat -c%s "$APK_FILE") bytes"
    echo "apk-path=$APK_FILE" >> $GITHUB_OUTPUT
    echo "build-successful=true" >> $GITHUB_OUTPUT
  id: download-apk
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Step 2: Update Maestro Test Action Reference

**Change**: Update APK path reference

**Before**:
```yaml
- name: Run Maestro Tests Against Production
  uses: ./.github/actions/maestro-test
  with:
    apk-path: production-apk
```

**After**:
```yaml
- name: Run Maestro Tests Against Production
  uses: ./.github/actions/maestro-test
  with:
    apk-path: ${{ steps.download-apk.outputs.apk-path }}
```

### Step 3: Update Success/Failure References

**Change**: Update step references in result processing

**Before**:
```yaml
echo "Build successful: ${{ steps.build-apk.outputs.build-successful }}"
```

**After**:
```yaml
echo "APK download successful: ${{ steps.download-apk.outputs.build-successful }}"
```

## Local Testing

### Automated Test Script
The implementation includes a comprehensive local test script:

```bash
# Run the automated test script
./scripts/test-release-download.sh
```

This script tests:
- GitHub CLI authentication
- Release existence detection
- APK download with retry logic
- File validation (format, size, integrity)
- Output variable simulation

### Manual Verification
```bash
# Test GitHub authentication
gh auth status

# Check available releases
gh release list --limit 5

# Test APK download (if releases exist)
gh release download latest --pattern "*.apk" --dir ./test-download
ls -la ./test-download/

# Clean up
rm -rf ./test-download/
```

### Workflow Testing with Act
```bash
# Install act (GitHub Actions local runner)
# On macOS: brew install act
# On Linux: curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Test the production validation workflow locally
act workflow_dispatch -W .github/workflows/production-validation.yml --input terraform_deployment_id=local-test
```

## Validation Checklist

- [x] Production validation workflow downloads APK instead of building
- [x] Downloaded APK path correctly passed to Maestro testing  
- [x] Comprehensive error handling for missing releases, download failures, and corruption
- [x] Success/failure notifications updated with artifact-specific error context
- [x] Retry logic implemented with exponential backoff (3 attempts)
- [x] APK format validation (ZIP signature verification)
- [x] Local test script created for verification (`scripts/test-release-download.sh`)
- [x] Constitutional compliance maintained (anonymous users via SKIP_DATA_CLEANUP)
- [x] Enhanced failure notifications with investigation steps

## Error Scenarios

### No Release Available
```bash
# Simulate missing release
gh release delete latest  # Don't actually run this!
# Workflow should fail with clear error message
```

### APK Missing from Release
```bash
# Check release contents
gh release view latest
# Should show APK file in assets list
```

### Download Failure
```bash
# Test network connectivity
curl -I https://api.github.com
# GitHub CLI should handle network errors gracefully
```

## Rollback Plan

If issues arise, revert by restoring the original build step:

1. Replace download step with original android-build action
2. Restore original APK path reference
3. Update step references back to build-apk
4. Commit revert and trigger validation workflow

## Next Steps

After successful implementation:
1. Monitor production validation runs for performance improvements
2. Validate build time reduction from eliminating duplicate APK creation
3. Confirm artifact consistency between build and validation phases