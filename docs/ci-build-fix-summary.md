# CI Build Fix Summary

## Problem

The preview APK build was failing in CI with the error:

```
[EAGER_BUNDLE] Error: node_modules/expo-router/_ctx.android.js:Invalid call at line 2: process.env.EXPO_ROUTER_APP_ROOT
[EAGER_BUNDLE] First argument of `require.context` should be a string denoting the directory to require.
```

## Root Cause Analysis

1. **Changed approach from devbox to direct script calls**: We modified the android-build action to call `../../scripts/build.sh` directly instead of `devbox run build_production/build_preview`
2. **Missing devbox environment**: Direct script calls bypassed the devbox environment, which includes required environment variables like `EXPO_ROUTER_APP_ROOT`
3. **Expo version mismatch**: Packages were slightly outdated (`expo@53.0.22` instead of `~53.0.23`, `expo-router@5.1.5` instead of `~5.1.7`)

## Solution Applied

### 1. Reverted to devbox approach

**File**: `.github/actions/android-build/action.yml`

```yaml
# BEFORE (causing issues)
run: |
  if [ "${{ inputs.build-type }}" = "production" ]; then
    ../../scripts/build.sh production build_production.apk
  else
    ../../scripts/build.sh preview build_preview.apk
  fi

# AFTER (fixed)
run: |
  if [ "${{ inputs.build-type }}" = "production" ]; then
    devbox run build_production
  else
    devbox run build_preview
  fi
```

### 2. Maintained APK parameterization in devbox scripts

**File**: `devbox/android-build/devbox.json`

```json
{
  "shell": {
    "scripts": {
      "build_preview": ["../../scripts/build.sh preview build_preview.apk"],
      "build_production": [
        "../../scripts/build.sh production build_production.apk"
      ]
    }
  },
  "env": {
    "EXPO_ROUTER_APP_ROOT": "$PWD/../../app"
    // ... other env vars
  }
}
```

### 3. Updated expo packages

```bash
npx expo install expo@~53.0.23 expo-router@~5.1.7
```

## Why This Works

1. **devbox environment**: `devbox run` loads all environment variables from `devbox.json`, including `EXPO_ROUTER_APP_ROOT`
2. **Correct APK naming**: The devbox scripts call the build script with the correct APK name parameters
3. **Version compatibility**: Updated expo packages ensure compatibility and fix known issues

## Files Modified

- `.github/actions/android-build/action.yml` - Reverted to devbox run approach
- `devbox/android-build/devbox.json` - Already had correct scripts and environment
- `package.json` - Updated expo and expo-router versions

## Expected Results

✅ **Production builds**: Generate `build_production.apk`  
✅ **Preview builds**: Generate `build_preview.apk`  
✅ **Environment**: `EXPO_ROUTER_APP_ROOT` properly set to app directory  
✅ **Compatibility**: Expo versions aligned with SDK requirements

## Verification

The fix maintains both:

1. **APK parameterization**: Different workflows use different APK names
2. **Environment setup**: All required environment variables are loaded via devbox

## Key Lesson

When parameterizing existing systems, maintain the working environment setup (devbox) rather than bypassing it. The devbox environment provides essential setup that direct script calls miss.
