# Quickstart: Simple Error Blocking System

**Date**: 2025-10-20  
**Feature**: 012-production-bug-android  
**Estimated Time**: 20 minutes

## Prerequisites

- Devbox development environment
- Android emulator or device
- Access to Maestro integration tests

## Quick Setup

### 1. Remove Complex Error Handling (5 minutes)

```bash
# Switch to the bug fix branch
git checkout 012-production-bug-android

# Start the development environment
devbox shell

# Verify current complex error handling exists
wc -l lib/utils/logging/DefaultErrorHandler.ts
# Should show ~750 lines

# Check current error handling usage
grep -r "DefaultErrorHandler\|LoggingServiceFactory" lib/ --include="*.ts" | wc -l
```

**Expected Result**: Should see extensive usage of complex error handling

### 2. Add Simple Error Blocking Component (10 minutes)

```bash
# Run tests to see baseline behavior
npm test -- --testNamePattern="error.*block"

# Install the new error blocking system
npm run install:simple-error-blocker

# Verify the ErrorBlocker component is integrated
grep -r "ErrorBlocker" app/_layout.tsx
```

**Expected Result**: ErrorBlocker component should wrap the entire app

### 3. Test Error Detection with Maestro (5 minutes)

```bash
# Build and install APK for testing
devbox run build_preview
adb install -r build_preview.apk

# Run Maestro tests with error detection
devbox run integration_test_android build_preview.apk

# Check if error blocker appears in test output
grep -i "maestro-error-blocker" maestro-debug-output/*.log
```

**Expected Result**: Maestro tests should be able to detect error blocker when errors occur

## Testing Scenarios

### Scenario 1: Simple Error Blocking

**Goal**: Verify uncaught errors block the app and are detectable by Maestro

```bash
# Run error blocking tests
npm test -- --testNamePattern="error.*blocker"
```

**Success Criteria**:
- ErrorBlocker component renders when uncaught errors occur
- App interaction is completely blocked
- testID attributes are present for Maestro detection

### Scenario 2: Maestro Error Detection

**Goal**: Verify Maestro tests fail when uncaught errors occur

```bash
# Run Maestro tests with intentional errors
npm run test:maestro-with-errors

# Check that tests fail when errors are present
echo $? # Should be non-zero (failed)
```

**Success Criteria**:
- Maestro tests detect "maestro-error-blocker" element
- Tests fail when uncaught errors occur
- Error count and message are accessible to tests

### Scenario 3: Simple Logging Performance

**Goal**: Verify simple logging has minimal performance impact

```bash
# Run performance comparison tests
npm test -- --testNamePattern="simple.*logger.*performance"
```

**Success Criteria**:
- Simple logging <0.001ms per call (100x improvement)
- No recursion or complex processing
- Console output only, no persistent storage

### Scenario 4: Production APK Error Detection

**Goal**: Verify error detection works in real production builds

```bash
# Build production APK
devbox run build_production

# Install and test on real device
adb install -r build_production.apk
devbox run integration_test_android build_production.apk
```

**Success Criteria**:
- Error blocker works in production builds
- Maestro tests catch errors that CI missed
- No performance regression in production

## Validation Checklist

### ✅ Basic Functionality
- [ ] App starts without crashing
- [ ] Simple error logging works (console output)
- [ ] Performance overhead is minimal (<0.01ms)

### ✅ Error Blocking System
- [ ] ErrorBlocker component wraps entire app
- [ ] Uncaught errors trigger app blocking overlay
- [ ] testID attributes are present for Maestro detection

### ✅ Maestro Integration
- [ ] Maestro tests can detect error blocker element
- [ ] Tests fail when uncaught errors occur
- [ ] Works with production APK builds

### ✅ Simplified Architecture
- [ ] Complex DefaultErrorHandler removed (~750 lines deleted)
- [ ] Simple error logging replaces complex system
- [ ] No recursion potential in new system

## Troubleshooting

### Issue: Error Blocker Not Appearing

**Solution**: 
```bash
# Check if ErrorBlocker is properly integrated
grep -r "ErrorBlocker" app/_layout.tsx

# Verify React Native ErrorUtils integration
adb logcat | grep -i "ErrorUtils"

# Test error blocking manually
npm test -- --testNamePattern="error.*blocker.*manual"
```

### Issue: Maestro Tests Still Pass Despite Errors

**Solution**:
```bash
# Verify Maestro can detect error blocker element
maestro test .maestro/test/error-detection-test.yml

# Check if testID attributes are present
adb shell uiautomator dump && grep "maestro-error-blocker" /sdcard/window_dump.xml
```

### Issue: Performance Worse Than Expected

**Solution**:
```bash
# Compare performance before and after
npm run benchmark:simple-vs-complex-logging

# Profile error blocking overhead
npm run profile:error-blocker
```

## Next Steps

1. **Monitor Production**: Deploy and monitor for previously hidden errors
2. **Expand Testing**: Add more error scenarios to Maestro tests
3. **Team Training**: Update team on new simple error handling approach
4. **Performance Monitoring**: Track the 100x performance improvement

## Emergency Rollback

If the fix causes issues:

```bash
# Disable error blocking temporarily
export ERROR_BLOCKING_ENABLED=false

# Revert to previous complex error handling
git revert HEAD

# Rebuild and redeploy
npm run build:android:production
```

## Support

- **Logs**: Check console output (no complex log files)
- **Error Detection**: Use Maestro test results for error monitoring
- **Performance**: Monitor <0.01ms overhead target
- **Configuration**: Minimal config in ErrorBlockingConfig interface