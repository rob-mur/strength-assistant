# Current Error Analysis: APK Download Failure

**Date**: 2025-09-27  
**Feature**: 008-the-current-production  
**Phase**: T004 Documentation

## Root Cause Discovery

### Issue Summary

The production validation workflow fails with exit code 2 when using `gh release download latest --pattern "*.apk"`, but succeeds when using specific release tags like `gh release download v42 --pattern "*.apk"`.

### Test Results

#### T001: Environment Verification ✅

- GitHub CLI v2.76.2 installed and authenticated
- Token has repo scope access
- Authentication working correctly

#### T002: GitHub Release Assets ✅

- Release v42 exists and is published (not draft, not prerelease)
- Contains APK asset: `build_production.apk`
- GitHub API reports v42 as latest release

#### T003: APK Download Testing ⚠️

- **FAIL**: `gh release download latest --pattern "*.apk"` → "release not found"
- **SUCCESS**: `gh release download v42 --pattern "*.apk"` → 99MB valid APK downloaded
- **SUCCESS**: `gh api repos/:owner/:repo/releases/latest` → returns v42

## Root Cause Analysis

### Primary Issue: GitHub CLI `latest` Resolution

The GitHub CLI command `gh release download latest` fails to resolve the latest release, despite:

- v42 being the latest published release
- GitHub API correctly returning v42 as latest
- Release having proper metadata (published, not draft, not prerelease)

### Hypothesis

This appears to be a GitHub CLI bug or repository-specific issue where `latest` alias fails to resolve correctly, but specific tag names work properly.

### Evidence

1. **API Consistency**: `gh api repos/:owner/:repo/releases/latest` returns correct v42
2. **Metadata Correct**: `{"isDraft":false,"isPrerelease":false,"tagName":"v42"}`
3. **Download Success**: Specific tag `v42` downloads 99MB APK successfully
4. **CLI Inconsistency**: `latest` alias fails with "release not found"

## Systematic vs Transient Failure

This is a **systematic failure** because:

- Consistent failure across multiple attempts
- Not related to network connectivity or rate limiting
- Related to GitHub CLI release resolution logic
- Exit code 2 indicates "resource not found" not "network error"

## Impact on Current Workflow

The production-validation.yml workflow uses:

```yaml
gh release download latest --pattern "*.apk" --dir ./artifacts
```

This command fails systematically, causing the workflow to retry 3 times before exiting with code 2.

## Solution Strategy

### Option 1: Use GitHub API to Get Latest Tag

```bash
LATEST_TAG=$(gh api repos/:owner/:repo/releases/latest --jq '.tag_name')
gh release download "$LATEST_TAG" --pattern "*.apk" --dir ./artifacts
```

### Option 2: Use Release ID Instead of Tag

```bash
gh release download --pattern "*.apk" --dir ./artifacts  # Default behavior
```

### Option 3: Implement Better Error Detection

Add `gh release view latest` verification before download attempt to distinguish between:

- No releases exist
- Latest release exists but CLI can't resolve `latest` alias
- Latest release exists but contains no APK assets

## Recommended Fix

Implement **Option 1** with **Option 3** verification:

1. **Pre-flight check**: Verify release exists and contains APK assets
2. **API-based resolution**: Use GitHub API to get latest tag name
3. **Specific tag download**: Use resolved tag instead of `latest` alias
4. **No retry on systematic failures**: Exit code 2 should not trigger retries

This approach:

- ✅ Fixes the systematic CLI issue
- ✅ Provides better error diagnostics
- ✅ Maintains existing APK validation logic
- ✅ Follows constitutional principle of fixing root cause, not symptoms
