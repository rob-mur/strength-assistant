# Quickstart: Authentication Bug Fix & Testing

## Prerequisites

- Node.js and npm installed
- React Native/Expo development environment
- Access to Supabase project credentials
- Android emulator or physical device for testing

## Quick Validation (5 minutes)

### 1. Test Current Authentication Flow

```bash
# Start the app in development mode
npm start

# In another terminal, check auth configuration
npm run lint
npm run typecheck
```

**Expected**: App should start and show authentication working in development

### 2. Build and Test Production APK

```bash
# Build production APK
npx expo build:android --type apk

# Run production auth validation tests
npm test -- __tests__/integration/production-auth.test.ts
```

**Expected**: Tests should FAIL initially (this is the bug we're fixing)

### 3. Verify Environment Configuration

```bash
# Check environment variables
echo $EXPO_PUBLIC_SUPABASE_URL
echo $EXPO_PUBLIC_SUPABASE_ANON_KEY

# Run environment validation
npm run validate-env
```

**Expected**: Should show configuration issues for production builds

## Full Integration Test (15 minutes)

### 1. Install Dependencies

```bash
npm install
npm run setup-test-env
```

### 2. Run Pre-Release Test Suite

```bash
# Run all authentication tests
npm test -- __tests__/integration/auth-*.test.ts

# Run production build validation
npm run test:production-build

# Run Maestro integration tests against production build
devbox run maestro-test -- .maestro/auth/production-auth-flow.yml
```

### 3. Validate Fix Implementation

```bash
# Test environment switching
npm run test:env-switching

# Test session persistence
npm run test:session-persistence

# Test network error handling
npm run test:network-errors
```

## Success Criteria

✅ **Environment Configuration**: Production builds use correct Supabase URLs  
✅ **Authentication Flow**: Anonymous auth works in production APK  
✅ **Session Persistence**: Sessions maintained across app restarts  
✅ **Error Handling**: Network failures handled gracefully  
✅ **Pre-Release Testing**: Automated tests catch configuration issues  

## Common Issues & Solutions

### Issue: "AuthRetryableFetchError: Network request failed"

**Cause**: Production APK using development URLs  
**Solution**: Check environment configuration in build settings

```bash
# Debug environment loading
npm run debug:env-config
```

### Issue: "AuthSessionMissingError: Auth session missing!"

**Cause**: Session storage not working in production  
**Solution**: Verify session persistence configuration

```bash
# Test session storage
npm run test:session-storage
```

### Issue: Tests pass but production still fails

**Cause**: Test environment differs from actual production build  
**Solution**: Run tests against actual APK file

```bash
# Test against built APK
npm run test:apk-validation
```

## Next Steps

After quickstart validation:

1. **If tests fail**: Use error logs to identify specific configuration issues
2. **If tests pass**: Proceed with implementation of fixes identified in research
3. **For ongoing development**: Set up pre-commit hooks to run production validation

## Files Created/Modified

This quickstart will help validate:

- `lib/config/environment.ts` - Environment configuration
- `lib/data/supabase/auth.ts` - Authentication implementation  
- `__tests__/integration/production-auth.test.ts` - Production validation tests
- `.github/workflows/pre-release-validation.yml` - CI/CD integration

## Support

If issues persist:
1. Check logs: `npx expo logs --platform android`
2. Review environment: `npm run debug:full-config`
3. Test network connectivity: `npm run test:network`