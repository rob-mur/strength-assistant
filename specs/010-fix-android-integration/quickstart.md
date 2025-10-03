# Quickstart: Android Integration Test Bug Fix

## Overview

This quickstart validates the fix for Android integration test false positive reporting and underlying test failures. It covers both the exit code handling fix and environment variable configuration.

## Prerequisites

- Devbox environment setup
- Android emulator or device available
- Access to EAS CLI and environment variable management
- Supabase local development environment running

## Quick Validation Steps

### 1. Verify Local Environment

```bash
# Ensure devbox environment is active
devbox shell

# Verify Supabase is running locally
curl -f http://127.0.0.1:54321/health
# Should return 200 OK

# For Android emulator testing
curl -f http://10.0.2.2:54321/health
# Should return 200 OK from emulator perspective
```

### 2. Test Exit Code Fix (Critical)

```bash
# Navigate to project root
cd /path/to/strength-assistant

# Run integration tests and verify proper exit code handling
devbox run maestro-test

# Expected behavior:
# - Passing tests should report success=true, exit-code=0
# - Failing tests should report success=false, exit-code=1
# - Script errors should report success=false, exit-code=2
```

### 3. Validate Environment Variables

```bash
# Check current EAS environment variables for production
eas env:list --profile production

# Required variables should be present:
# - EXPO_PUBLIC_SUPABASE_URL
# - EXPO_PUBLIC_SUPABASE_ANON_KEY
# - EXPO_PUBLIC_USE_SUPABASE
# - EXPO_PUBLIC_USE_EMULATOR

# Check devbox environment for development
echo $EXPO_PUBLIC_SUPABASE_URL
echo $EXPO_PUBLIC_USE_EMULATOR
```

### 4. Build and Test Cycle

```bash
# Test development build
devbox run build:android:development
devbox run test:android

# Test preview build
devbox run build:android:preview
devbox run test:android

# Test production build (requires EAS environment variables)
eas build --platform android --profile production --wait
# Download APK and test with:
devbox run test:android:production
```

## Validation Scenarios

### Scenario 1: Successful Test Execution

**Setup**: Working app build with all features functional

**Execute**:
```bash
devbox run maestro-test
```

**Expected Results**:
- All Maestro tests pass
- Script exits with code 0
- GitHub Action outputs: `success=true`
- Debug artifacts collected
- No error messages in logs

### Scenario 2: Test Failure Detection

**Setup**: Introduce a deliberate failure (e.g., break Supabase connection)

**Execute**:
```bash
# Temporarily disable Supabase
export EXPO_PUBLIC_USE_SUPABASE=false
devbox run build:android:development
devbox run maestro-test
```

**Expected Results**:
- Maestro tests fail (unable to connect to backend)
- Script exits with code 1
- GitHub Action outputs: `success=false`
- Debug artifacts show connection errors
- Clear error messages indicating failure cause

### Scenario 3: Environment Variable Validation

**Setup**: Missing or incorrect environment variables

**Execute**:
```bash
# Test with missing Supabase URL
unset EXPO_PUBLIC_SUPABASE_URL
devbox run build:android:development
```

**Expected Results**:
- Build fails with clear error message
- Missing environment variable identified
- Build does not proceed with invalid configuration

### Scenario 4: Production Environment Test

**Setup**: Production build with EAS environment variables

**Execute**:
```bash
# Verify EAS environment variables are set
eas env:list --profile production

# Build production APK
eas build --platform android --profile production --wait

# Test production APK
npm run test:production-build
```

**Expected Results**:
- Production build uses correct Supabase production URL
- Tests pass against production environment
- No emulator configuration used
- HTTPS-only communication enforced

## Troubleshooting

### Issue: Tests Pass But Should Fail

**Check**:
1. Verify GitHub Action exit code handling is fixed
2. Check if test execution script properly propagates exit codes
3. Ensure Maestro tests are actually running against the APK

**Debug**:
```bash
# Run tests with verbose logging
DEBUG=1 devbox run maestro-test

# Check GitHub Action logs for exit code values
# Look for: "success=true" vs "success=false"
```

### Issue: Environment Variable Problems

**Check**:
1. EAS environment variables for production profile
2. Devbox configuration for development/preview
3. Android emulator networking (10.0.2.2)

**Debug**:
```bash
# Validate environment loading
devbox run validate-env

# Check Supabase connectivity
curl -v http://10.0.2.2:54321/health
```

### Issue: Test Execution Failures

**Check**:
1. Android emulator state and connectivity
2. APK installation and app permissions
3. Supabase service availability

**Debug**:
```bash
# Collect full debug artifacts
devbox run maestro-test --debug

# Check artifacts in: ./test-artifacts/
# Review: screenshots, logs, ui-dumps, videos
```

## Success Criteria Checklist

- [ ] **Exit Code Fix**: Failed tests properly report `success=false`
- [ ] **Environment Variables**: Production builds use EAS configuration
- [ ] **Local Testing**: Development builds use devbox configuration
- [ ] **Android Networking**: Emulator properly connects to host Supabase (10.0.2.2)
- [ ] **CI Integration**: GitHub Actions receive correct success/failure indicators
- [ ] **Production Validation**: Production builds work with production Supabase
- [ ] **Debug Artifacts**: Comprehensive debugging information collected
- [ ] **Error Messages**: Clear, actionable error messages for all failure modes

## Performance Expectations

- **Test Execution Time**: < 5 minutes for full test suite
- **Build Time**: < 10 minutes for any profile
- **Environment Startup**: < 2 minutes for Supabase local setup
- **Error Detection**: < 30 seconds to identify and report test failures

## Security Validation

- [ ] **Production**: HTTPS-only communication enforced
- [ ] **Development**: Cleartext traffic allowed only for local testing
- [ ] **Secrets**: No secrets exposed in logs or debug artifacts
- [ ] **Isolation**: Anonymous user testing maintains data isolation

## Rollback Plan

If issues are detected:

1. **Immediate**: Revert GitHub Action changes to previous version
2. **Short-term**: Restore previous EAS environment variable configuration
3. **Long-term**: Review and fix issues identified in validation

**Rollback Commands**:
```bash
# Revert GitHub Action changes
git checkout HEAD~1 .github/actions/maestro-test/action.yml

# Restore EAS environment variables
eas env:set EXPO_PUBLIC_SUPABASE_URL="<previous_value>" --profile production
```