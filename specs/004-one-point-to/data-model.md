# Data Model: Production Server Testing Enhancement

**Feature**: 004-one-point-to | **Date**: 2025-09-25

## Overview

This enhancement primarily involves CI/CD workflow modifications rather than application data models. The "data" in this context refers to build artifacts, workflow parameters, and configuration state.

## Artifact Data Model

### Production APK Artifact

**GitHub Release Asset Structure**:

```yaml
release:
  tag_name: "v{run_number}" # e.g., "v123"
  name: "Release v{run_number}" # Human-readable name
  body: | # Release description
    Production build from commit {sha}
    Build successful: {status}
    Changes: {commit_message}
  assets:
    - name: "{artifact-name}.apk" # e.g., "production-release.apk"
      download_url: "github.com/owner/repo/releases/download/v{run_number}/{artifact}.apk"
      size: { bytes }
      content_type: "application/vnd.android.package-archive"
```

**Required Properties**:

- `tag_name`: Unique identifier for release (v{run_number} format)
- `asset_name`: APK filename in release assets
- `download_url`: Direct download link for artifact
- `creation_timestamp`: When release was created
- `commit_sha`: Git commit that triggered the build

### Workflow State Data

**Build Workflow State**:

```yaml
build_workflow:
  status: "completed" | "in_progress" | "failed"
  conclusion: "success" | "failure"
  run_number: integer              # Used for release tagging
  commit_sha: string              # Git commit identifier
  artifact_outputs:
    apk_path: string              # Path to built APK
    build_successful: boolean     # Build completion status
```

**Validation Workflow State**:

```yaml
validation_workflow:
  inputs:
    terraform_deployment_id: string # Deployment identifier
  artifact_sources:
    apk_download_url: string # GitHub release download URL
    apk_local_path: string # Local path after download
  test_results:
    tests_passed: boolean # Maestro test outcome
    test_output: string # Test execution logs
```

## Configuration Data

### Environment Variables

```yaml
environment_config:
  SKIP_DATA_CLEANUP: "true" # Preserve anonymous user approach
  NODE_ENV: "production" # Production environment indicator
  GITHUB_TOKEN: string # For release artifact access
```

### Devbox Configuration References

```yaml
devbox_configs:
  android_testing: # Testing environment
    path: "devbox/android-testing"
    purpose: "Maestro test execution environment"
  android_build: # Build environment (not used in validation)
    path: "devbox/android-build"
    purpose: "APK compilation environment"
```

## Data Flow

### Release Artifact Lifecycle

```
1. Build Workflow Creates Release:
   - APK built using devbox/android-build
   - Release created with tag v{run_number}
   - APK uploaded as release asset

2. Validation Workflow Downloads Release:
   - Identifies latest/target release by tag
   - Downloads APK asset using GitHub CLI
   - Stores APK at local path for testing

3. Maestro Testing Consumes APK:
   - Reads APK from local download path
   - Executes test flows against production endpoints
   - Returns test results and logs
```

### Error State Handling

```yaml
error_conditions:
  no_release_found:
    condition: "No GitHub release exists for current commit"
    action: "Fail validation with clear error message"

  download_failed:
    condition: "GitHub CLI cannot download release asset"
    action: "Retry once, then fail with network diagnostic info"

  apk_corrupted:
    condition: "Downloaded APK fails basic validation"
    action: "Fail validation, suggest rebuild"

  tests_failed:
    condition: "Maestro tests return non-zero exit code"
    action: "Alert team, block frontend deployment"
```

## Integration Points

### GitHub Actions Integration

```yaml
action_interfaces:
  github_cli:
    input: "release tag or 'latest'"
    output: "downloaded APK path"
    error_handling: "Network retry logic"

  maestro_test_action:
    input: "APK path, test environment config"
    output: "test results, logs"
    unchanged: "Existing parameterization preserved"
```

### Constitutional Compliance

- **Anonymous Users**: No persistent data, fresh users per test run
- **Local Testing**: Artifact download testable with `gh` CLI locally
- **Infrastructure as Code**: All configuration in version-controlled YAML
- **Progressive Validation**: Artifact creation → download → testing sequence maintained
