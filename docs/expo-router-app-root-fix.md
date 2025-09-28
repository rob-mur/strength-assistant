# EXPO_ROUTER_APP_ROOT CI Fix Documentation

## Problem

The preview APK build was failing in CI with the error:

```
[EAGER_BUNDLE] Error: node_modules/expo-router/_ctx.android.js:Invalid call at line 2: process.env.EXPO_ROUTER_APP_ROOT
[EAGER_BUNDLE] First argument of `require.context` should be a string denoting the directory to require.
```

## Root Cause

The `EXPO_ROUTER_APP_ROOT` environment variable was not set in the CI environment, but was available locally. This caused the `expo export:embed` command to fail during the JavaScript bundling phase because `require.context` expects a string directory path, not `undefined`.

## Solution

Added the `EXPO_ROUTER_APP_ROOT` environment variable to the Android build action:

### File: `.github/actions/android-build/action.yml`

```yaml
- name: Build APK
  shell: bash
  working-directory: devbox/${{ inputs.devbox-config }}
  env:
    EXPO_ROUTER_APP_ROOT: ${{ github.workspace }}/app
  run: |
    # Build script calls...
```

### File: `devbox/android-build/devbox.json`

```json
{
  "env": {
    "EXPO_ROUTER_APP_ROOT": "$PWD/../../app"
    // ... other env vars
  }
}
```

## Verification

1. **Local Test**: Confirmed that setting `EXPO_ROUTER_APP_ROOT=$PWD/../../app` resolves to the correct app directory path
2. **Path Resolution**: Verified that the app directory exists and contains expected Expo Router files (`_layout.tsx`, `(tabs)` directory)
3. **Node.js Compatibility**: Tested that the path is accessible from Node.js context and contains expected structure

## Expected Result

After this fix, the CI build should:

1. ✅ Set `EXPO_ROUTER_APP_ROOT` to point to the app directory
2. ✅ Allow `expo export:embed` to successfully bundle JavaScript
3. ✅ Complete the APK build process without errors

## Files Modified

- `.github/actions/android-build/action.yml` - Added `EXPO_ROUTER_APP_ROOT` environment variable
- `devbox/android-build/devbox.json` - Added `EXPO_ROUTER_APP_ROOT` for consistency

## Testing

To test this fix locally:

```bash
cd devbox/android-build
export EXPO_ROUTER_APP_ROOT="$PWD/../../app"
echo $EXPO_ROUTER_APP_ROOT
ls -la "$EXPO_ROUTER_APP_ROOT"
```

The output should show the app directory contents with `_layout.tsx` and `(tabs)` directory.
