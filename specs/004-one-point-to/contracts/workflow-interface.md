# Workflow Interface Contract

**Feature**: 004-one-point-to | **Date**: 2025-09-25

## Contract: GitHub Release Artifact Download

### Input Interface
```yaml
inputs:
  release_tag: string              # "latest" or "v{run_number}" format
  repository: string               # "owner/repo" format
  asset_pattern: string            # Glob pattern to match APK filename
```

### Output Interface
```yaml
outputs:
  apk_path: string                 # Local filesystem path to downloaded APK
  download_successful: boolean     # Download completion status
  release_info:
    tag_name: string               # Actual release tag used
    commit_sha: string             # Git commit for the release
    created_at: timestamp          # Release creation time
```

### Error Conditions
```yaml
errors:
  RELEASE_NOT_FOUND:
    code: 404
    message: "No release found matching {release_tag}"
    action: "Check if build workflow completed successfully"
  
  ASSET_NOT_FOUND:
    code: 404  
    message: "No APK asset found in release {tag_name}"
    action: "Verify APK was uploaded to release"
  
  DOWNLOAD_FAILED:
    code: 500
    message: "Failed to download asset after {retry_count} attempts"
    action: "Check network connectivity and GitHub API status"
```

## Contract: Production Validation Workflow Modification

### Current Interface (to be modified)
```yaml
# REMOVE: Build APK step
- name: Build Production APK
  uses: ./.github/actions/android-build
  # ... parameters
```

### New Interface (replacement)
```yaml
# REPLACE WITH: Download APK step  
- name: Download Production APK
  shell: bash
  run: |
    gh release download latest --pattern "*.apk" --dir ./artifacts
    APK_FILE=$(ls ./artifacts/*.apk | head -1)
    echo "apk-path=$APK_FILE" >> $GITHUB_OUTPUT
  id: download-apk
```

### Updated Maestro Test Action Call
```yaml
# MODIFIED: Pass downloaded APK path instead of built path
- name: Run Maestro Tests Against Production
  uses: ./.github/actions/maestro-test
  with:
    apk-path: ${{ steps.download-apk.outputs.apk-path }}  # Changed from build output
    test-environment: production
    skip-data-cleanup: true
    devbox-config: android-testing
```

## Contract: Backward Compatibility

### Preservation Requirements
- **Environment Variables**: All existing env vars (SKIP_DATA_CLEANUP, NODE_ENV) preserved
- **Action Parameters**: Maestro test action inputs unchanged except APK path source
- **Error Handling**: Existing failure notification patterns maintained
- **Devbox Integration**: android-testing devbox configuration usage preserved

### Breaking Change Mitigation
```yaml
fallback_strategy:
  if_download_fails:
    action: "Log warning and proceed with existing build step"
    rationale: "Allows graceful degradation during transition"
  
  if_no_release_available:
    action: "Skip validation with clear notification"
    rationale: "Prevents blocking deployments during initial setup"
```

## Contract: Local Testing Interface

### Developer Testing Requirements
```bash
# Local validation of APK download mechanism
gh auth login                     # Authenticate with GitHub
gh release download latest --pattern "*.apk" --dir ./test-artifacts
ls -la ./test-artifacts/         # Verify APK downloaded successfully
```

### Constitutional Compliance Verification
```bash
# Test devbox environment setup
cd devbox/android-testing
devbox shell                     # Enter testing environment
# Verify Maestro can access downloaded APK
maestro test ../../test-artifacts/*.apk ../../.maestro/web/
```