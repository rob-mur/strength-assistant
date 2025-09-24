# Quickstart: Production Server Testing Enhancement

**Feature**: 004-one-point-to  
**Approach**: Simple APK-based production validation after terraform deployment

## Prerequisites

- Terraform deployment pipeline working
- React Native/Expo APK build system configured
- Existing Maestro test flows in `.maestro/` directory
- GitHub Actions runner with Maestro installed
- Production server endpoints accessible

## Quick Setup (5 minutes)

### 1. Create Parameterized GitHub Actions

First, create the reusable Android Build action `.github/actions/android-build/action.yml`:

```yaml
name: 'Android Build Action'
description: 'Build Android APK using devbox'
inputs:
  build-type:
    description: 'Build type: preview or production'
    required: true
  devbox-config:
    description: 'Devbox configuration directory'
    required: true
  artifact-name:
    description: 'APK artifact name'
    required: true
outputs:
  apk-path:
    description: 'Path to built APK'
    value: ${{ steps.build.outputs.apk-path }}

runs:
  using: composite
  steps:
    - name: Setup dev environment
      uses: ./.github/actions/setup-dev-environment
      with:
        devbox-config: ${{ inputs.devbox-config }}
    - name: Build APK
      shell: bash
      working-directory: devbox/${{ inputs.devbox-config }}
      run: devbox run build_${{ inputs.build-type }}
      id: build
    - name: Upload APK
      uses: actions/upload-artifact@v4
      with:
        name: ${{ inputs.artifact-name }}
        path: ${{ steps.build.outputs.apk-path }}
```

Next, create the reusable Maestro Test action `.github/actions/maestro-test/action.yml`:

```yaml
name: 'Maestro Test Action'
description: 'Run Maestro tests using devbox'
inputs:
  apk-path:
    description: 'APK artifact name'
    required: true
  test-environment:
    description: 'Test environment: integration or production'
    required: true
  skip-data-cleanup:
    description: 'Skip data cleanup'
    required: false
    default: 'false'
  devbox-config:
    description: 'Devbox test configuration'
    required: true

runs:
  using: composite
  steps:
    - name: Download APK
      uses: actions/download-artifact@v4
      with:
        name: ${{ inputs.apk-path }}
    - name: Setup test environment
      uses: ./.github/actions/setup-dev-environment
      with:
        devbox-config: ${{ inputs.devbox-config }}
    - name: Run tests
      shell: bash
      working-directory: devbox/${{ inputs.devbox-config }}
      env:
        SKIP_DATA_CLEANUP: ${{ inputs.skip-data-cleanup }}
      run: devbox run integration_test_android
```

Finally, create the main workflow `.github/workflows/production-validation.yml`:

```yaml
name: Production Validation

on:
  workflow_dispatch:
    inputs:
      terraform_deployment_id:
        description: "Terraform deployment ID"
        required: true

jobs:
  validate-production:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Production APK
        uses: ./.github/actions/android-build
        with:
          build-type: production
          devbox-config: android-build
          artifact-name: production-apk
        id: build
      
      - name: Run Production Tests
        uses: ./.github/actions/maestro-test
        with:
          apk-path: production-apk
          test-environment: production
          skip-data-cleanup: true
          devbox-config: android-testing
```

### 2. Modify Cleanup Script

Update your emulator/device clearing script to respect `SKIP_DATA_CLEANUP`:

```bash
#!/bin/bash
# In scripts/clear-emulator.sh or similar

if [ "$SKIP_DATA_CLEANUP" = "true" ]; then
  echo "SKIP_DATA_CLEANUP=true - Skipping cleanup for production validation"
  exit 0
fi

echo "Performing normal data cleanup..."
# Your existing cleanup logic here
```

### 3. Configure Pipeline Stage

```yaml
# Add to your CI/CD pipeline configuration
production_validation:
  stage: production-test
  dependencies:
    - unit_tests
    - integration_tests
    - security_scan
  script:
    - echo "Starting production validation..."
    - ./scripts/run-production-tests.sh
  only:
    - main
    - release/*
  when: on_success
```

**Expected**: Pipeline stage configured but not yet executable

## Full Integration Test (30 minutes)

### 1. Create Production Test Script

```bash
# Create the production test runner script
cat > scripts/run-production-tests.sh << 'EOF'
#!/bin/bash
set -e

# Configuration
PRODUCTION_SERVER="https://your-production-server.com"
TEST_RUN_ID="${CI_PIPELINE_ID}-${CI_COMMIT_SHORT_SHA}"
MAESTRO_FLOWS=(".maestro/critical-flow.yaml" ".maestro/user-journey.yaml")

# Create anonymous user for testing
echo "Creating anonymous user for test run: $TEST_RUN_ID"
USER_RESPONSE=$(curl -s -X POST "$PRODUCTION_SERVER/api/users/anonymous" \
  -H "Content-Type: application/json" \
  -d "{\"testRunId\": \"$TEST_RUN_ID\"}")

USER_ID=$(echo $USER_RESPONSE | jq -r '.userId')
echo "Created anonymous user: $USER_ID"

# Run Maestro flows against production
echo "Running Maestro flows against production..."
for flow in "${MAESTRO_FLOWS[@]}"; do
  echo "Executing flow: $flow"
  MAESTRO_SERVER_URL="$PRODUCTION_SERVER" \
  MAESTRO_USER_ID="$USER_ID" \
    maestro test "$flow" || exit 1
done

echo "Production validation completed successfully"
EOF

chmod +x scripts/run-production-tests.sh
```

### 2. Test Production Validation Manually

```bash
# Set test environment variables
export CI_PIPELINE_ID="manual-test-$(date +%s)"
export CI_COMMIT_SHORT_SHA="$(git rev-parse --short HEAD)"

# Run production validation
./scripts/run-production-tests.sh
```

**Expected**: Script creates anonymous user and runs Maestro flows successfully

### 3. Verify Pipeline Integration

```bash
# Trigger pipeline with all stages
git add .
git commit -m "Add production validation stage"
git push origin feature-branch

# Monitor pipeline execution
# Check that production validation only runs after other stages pass
```

**Expected**: Pipeline executes production validation as final stage

## Success Criteria

✅ **Pipeline Integration**: Production validation runs only after all other stages pass  
✅ **Anonymous Users**: Fresh anonymous users created for each test run  
✅ **Maestro Execution**: Existing Maestro flows execute against production server  
✅ **Error Handling**: Failed production tests block deployment with clear errors  
✅ **Performance**: Tests complete within reasonable timeframes

## Common Issues & Solutions

### Issue: "Failed to create anonymous user"

**Cause**: Production server not configured for anonymous user creation  
**Solution**: Verify production API endpoints and authentication

```bash
# Debug anonymous user creation
curl -v -X POST https://your-production-server.com/api/users/anonymous \
  -H "Content-Type: application/json" \
  -d '{"testRunId": "debug-test"}'
```

### Issue: "Maestro flows fail against production"

**Cause**: Environment differences between staging and production  
**Solution**: Check production-specific configuration

```bash
# Compare environment configurations
echo "Staging URL: $STAGING_SERVER_URL"
echo "Production URL: $PRODUCTION_SERVER_URL"

# Test specific production endpoints
curl -I "$PRODUCTION_SERVER_URL/api/health"
```

### Issue: "Production validation runs when other tests fail"

**Cause**: Pipeline dependency configuration incorrect  
**Solution**: Verify stage dependencies and conditions

```yaml
production_validation:
  dependencies:
    - unit_tests
    - integration_tests
    - security_scan
  when: on_success # Only run when all dependencies pass
```

## Next Steps

After quickstart validation:

1. **If tests pass**: Integration successful, ready for production deployment
2. **If tests fail**: Use error logs to identify production-specific configuration issues
3. **For ongoing development**: Set up monitoring for production validation metrics

## Files Created/Modified

This quickstart validates:

- `scripts/run-production-tests.sh` - Production test execution script
- Pipeline configuration with production validation stage
- Maestro flow execution against production endpoints
- Anonymous user creation and management

## Support

If issues persist:

1. Check pipeline logs for specific error messages
2. Verify production server connectivity and API endpoints
3. Test Maestro flows individually: `maestro test specific-flow.yaml`
4. Validate anonymous user creation: `curl -X POST .../api/users/anonymous`
