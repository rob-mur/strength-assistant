# APK Parameterization Documentation

## Overview

The build and test scripts have been parameterized to support different APK naming conventions for integration vs production contexts.

## Changes Made

### 1. Build Script (`scripts/build.sh`)

- **Already supported parameters**: `./scripts/build.sh <profile> [output_name]`
- **Examples**:
  - `./scripts/build.sh preview build_preview.apk`
  - `./scripts/build.sh production build_production.apk`

### 2. Integration Test Script (`scripts/integration_test_android.sh`)

- **Added APK parameter**: `./scripts/integration_test_android.sh <apk_filename>`
- **Error handling**: Validates APK file exists before proceeding
- **Examples**:
  - `./scripts/integration_test_android.sh build_preview.apk`
  - `./scripts/integration_test_android.sh build_production.apk`

### 3. Android Build Action (`.github/actions/android-build/action.yml`)

- **Updated to use parameterized script calls**:
  - Production: `../../scripts/build.sh production build_production.apk`
  - Preview: `../../scripts/build.sh preview build_preview.apk`

### 4. Maestro Test Action (`.github/actions/maestro-test/action.yml`)

- **Updated to pass APK filename to test script**:
  - Extracts filename from `apk-path` input
  - Calls: `../../scripts/integration_test_android.sh "$APK_FILENAME"`

### 5. Workflows

#### Production Deployment (`.github/workflows/production-deployment.yml`)

- **Triggers**: Push to main branch
- **APK**: Uses `build_production.apk`
- **Jobs**: Build → Deploy → Validate
- **Testing**: Anonymous users with `skip-data-cleanup: true`

#### Integration Testing (`.github/workflows/integration-testing.yml`)

- **Triggers**: Pull requests to main
- **APK**: Uses `build_preview.apk`
- **Jobs**: Build → Test
- **Testing**: Clean environment with `skip-data-cleanup: false`

### 6. Devbox Configurations

#### Android Build (`devbox/android-build/devbox.json`)

- `build_preview`: `../../scripts/build.sh preview build_preview.apk`
- `build_production`: `../../scripts/build.sh production build_production.apk`

#### Android Testing (`devbox/android-testing/devbox.json`)

- `integration_test_android`: `../../scripts/integration_test_android.sh build_preview.apk`
- `integration_test_android_production`: `../../scripts/integration_test_android.sh build_production.apk`

## Usage

### Local Development

```bash
# Build preview APK for integration testing
./scripts/build.sh preview build_preview.apk

# Build production APK for production validation
./scripts/build.sh production build_production.apk

# Run integration tests with preview APK
./scripts/integration_test_android.sh build_preview.apk

# Run integration tests with production APK
./scripts/integration_test_android.sh build_production.apk
```

### Workflow Context

| Context      | APK Name               | Workflow                    | Script Call                                        |
| ------------ | ---------------------- | --------------------------- | -------------------------------------------------- |
| Pull Request | `build_preview.apk`    | `integration-testing.yml`   | `integration_test_android.sh build_preview.apk`    |
| Production   | `build_production.apk` | `production-deployment.yml` | `integration_test_android.sh build_production.apk` |

## Validation

### Script Validation

```bash
# Test build script parameters
./scripts/build.sh --help

# Test integration script parameter validation
./scripts/integration_test_android.sh nonexistent.apk
# Should output: ❌ APK file not found: nonexistent.apk

# Test with valid APK
echo "test" > test.apk
./scripts/integration_test_android.sh test.apk
rm test.apk
```

### Workflow Validation

```bash
# Check YAML syntax
yamllint .github/workflows/production-deployment.yml
yamllint .github/workflows/integration-testing.yml

# List workflows
gh workflow list

# Check workflow files exist
ls -la .github/workflows/
```

## Benefits

1. **Clear Separation**: Integration tests use `build_preview.apk`, production uses `build_production.apk`
2. **Flexible Scripts**: Both build and test scripts accept parameters for different contexts
3. **Workflow Specific**: Each workflow hardcodes the appropriate APK name for its context
4. **Error Handling**: Integration test script validates APK file exists before proceeding
5. **Backward Compatible**: Existing devbox commands still work with new parameterized approach

## Troubleshooting

### Common Issues

**Wrong APK name in tests**:

- Check workflow uses correct `apk-path` parameter
- Verify Maestro test action extracts filename correctly
- Ensure integration test script receives the right parameter

**Build script not found**:

- Verify script paths are relative to repository root
- Check devbox working directory matches script location

**APK file not found**:

- Ensure APK is built before test script runs
- Check artifact download completed successfully
- Verify APK filename matches expected name

### Debug Commands

```bash
# Check script parameters
./scripts/build.sh production build_test.apk
ls -la build_test.apk

# Test integration script error handling
./scripts/integration_test_android.sh missing.apk

# Validate workflow syntax
yamllint .github/workflows/*.yml
```
