# Research: Production Server Testing Enhancement

**Date**: 2025-09-25 | **Feature**: 004-one-point-to

## Current State Analysis

### Existing CI/CD Infrastructure

**Current Build Process**:
- `build-production.yml` triggers after all tests pass on main branch
- Creates production APK using `.github/actions/android-build`
- Stores APK as GitHub release artifact with tag `v{run_number}`
- Uses devbox for consistent build environment

**Current Production Validation**:
- `production-validation.yml` triggers after terraform deployment
- **ISSUE**: Rebuilds production APK instead of reusing existing artifact
- Uses parameterized actions for Android build and Maestro testing
- Sets `SKIP_DATA_CLEANUP=true` for anonymous user handling

**Existing Reusable Actions**:
1. `.github/actions/android-build` - Parameterized APK building with devbox
2. `.github/actions/maestro-test` - Parameterized Maestro testing with devbox  
3. `.github/actions/setup-dev-environment` - Devbox environment setup

## Gap Analysis

### Problems Identified
1. **Duplicate APK Building**: Production validation rebuilds APK instead of reusing release artifact
2. **Artifact Management**: No clear mechanism to download and reuse existing release APK
3. **Workflow Timing**: Build happens correctly after tests pass, but validation doesn't reuse it

### Current vs Required Flow

**Current Flow**:
```
Tests Pass → Build APK → Create Release → Terraform Deploy → Rebuild APK → Maestro Tests
```

**Required Flow** (from spec):
```  
Tests Pass → Build APK → Create Release → Terraform Deploy → Download Release APK → Maestro Tests
```

## Technical Constraints

### Constitutional Compliance
- ✅ Uses devbox for local/CI consistency
- ✅ Anonymous users via SKIP_DATA_CLEANUP=true
- ✅ Progressive validation pattern maintained
- ✅ Infrastructure as code with parameterized actions

### Existing Dependencies
- GitHub Actions release artifacts (max 90 days retention)
- Devbox configurations in `devbox/android-build` and `devbox/android-testing`
- Maestro test flows in `.maestro/` directory
- Anonymous user flows already implemented

## Research Findings

### GitHub Release Artifact Access
- GitHub CLI (`gh release download`) can fetch release artifacts
- Release tags follow `v{run_number}` pattern
- APK files stored with original filename in release assets

### Maestro Integration
- Existing `.maestro/` flows work with anonymous users
- `SKIP_DATA_CLEANUP=true` prevents data cleanup scripts
- Tests designed to be "relatively fast" per spec requirements

### Devbox Environment
- `devbox/android-build/` contains production build scripts
- `devbox/android-testing/` contains Maestro testing environment
- Both use same base dependencies for consistency

## Implementation Strategy

### Approach: Modify Production Validation Workflow
Instead of creating new workflows, enhance existing `production-validation.yml`:

1. **Remove duplicate build step** - Replace android-build action with artifact download
2. **Add release artifact download** - Use GitHub CLI to fetch latest production APK
3. **Pass downloaded APK to Maestro** - Update maestro-test action call
4. **Maintain all existing parameters** - Keep SKIP_DATA_CLEANUP, devbox configs, etc.

### Reuse Strategy
- Keep existing parameterized actions unchanged
- Leverage GitHub's built-in release artifact system  
- Maintain devbox consistency across build and test environments
- Preserve anonymous user testing approach

## Complexity Assessment

**Low Complexity Enhancement**:
- Single workflow file modification
- No new infrastructure components
- Reuses all existing patterns and tools
- Maintains constitutional compliance
- No breaking changes to existing workflows

## Next Phase Requirements

**Phase 1 Design Needs**:
- Artifact download mechanism specification
- Error handling for missing releases
- APK path management between download and testing
- Validation that downloaded APK matches expected production build