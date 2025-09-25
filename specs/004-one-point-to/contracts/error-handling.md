# Error Handling Contract

**Feature**: 004-one-point-to | **Date**: 2025-09-25

## Contract: Error Detection and Recovery

### GitHub CLI Download Errors

**Error: Release Not Found**
```yaml
detection:
  github_cli_exit_code: 1
  stderr_pattern: "release not found"
  
response:
  log_level: ERROR
  message: "No GitHub release found for validation. Check if build-production workflow completed."
  action: FAIL_WORKFLOW
  
recovery_options:
  manual_trigger: "Run build-production workflow manually if needed"
  skip_validation: "Use workflow_dispatch to skip validation if acceptable"
```

**Error: Asset Not Found in Release**
```yaml
detection:
  downloaded_files: []
  pattern_match_result: "no files"
  
response:
  log_level: ERROR  
  message: "APK asset missing from release. Verify build-production workflow uploaded APK."
  action: FAIL_WORKFLOW
  
recovery_options:
  re_run_build: "Trigger build-production workflow to recreate release with APK"
  manual_upload: "Manually add APK to existing release if available"
```

**Error: Network/API Failure**
```yaml
detection:
  github_cli_exit_code: [22, 6, 7]  # HTTP, DNS, connection errors
  retry_attempts: 3
  
response:
  log_level: WARN
  message: "GitHub API temporarily unavailable. Retrying..."
  action: RETRY_WITH_BACKOFF
  
fallback:
  after_max_retries:
    log_level: ERROR
    message: "GitHub API consistently unavailable. Cannot download production APK."
    action: FAIL_WORKFLOW
```

### APK Validation Errors

**Error: Corrupted Download**
```yaml
detection:
  file_size: 0
  file_extension_missing: ".apk"
  android_package_validation: false
  
response:
  log_level: ERROR
  message: "Downloaded APK appears corrupted or invalid"
  action: FAIL_WORKFLOW
  diagnostics:
    - "File size: {actual_size} bytes"
    - "Expected APK signature: {signature_check}"
```

**Error: Maestro Cannot Access APK**
```yaml
detection:
  maestro_exit_code: [1, 2]
  error_pattern: "APK not found|invalid package"
  
response:
  log_level: ERROR
  message: "Maestro cannot process downloaded APK"
  action: FAIL_WORKFLOW
  diagnostics:
    - "APK path: {apk_path}"
    - "File exists: {file_exists}"
    - "File permissions: {permissions}"
```

## Contract: Production Test Failure Handling

### Anonymous User Creation Failures
```yaml
detection:
  maestro_log_pattern: "user creation failed|authentication error"
  
response:
  log_level: ERROR
  message: "Anonymous user creation failed against production endpoints"
  action: FAIL_WORKFLOW
  investigation_steps:
    - "Check production server authentication endpoints"
    - "Verify SKIP_DATA_CLEANUP=true is respected"
    - "Validate production server accepts anonymous registration"
```

### Production Server Connectivity Issues
```yaml
detection:
  maestro_log_pattern: "connection refused|timeout|DNS resolution failed"
  
response:
  log_level: ERROR
  message: "Cannot connect to production server during validation"
  action: FAIL_WORKFLOW
  investigation_steps:
    - "Verify terraform deployment completed successfully"
    - "Check production server health endpoints"
    - "Validate network connectivity from GitHub Actions runners"
```

### Test Flow Execution Failures
```yaml
detection:
  maestro_exit_code: [3, 4, 5]  # Test execution errors
  
response:
  log_level: ERROR
  message: "Maestro test flows failed against production infrastructure"
  action: FAIL_WORKFLOW
  notification:
    title: "Production Validation Failed"
    body: |
      Production validation against deployment {terraform_deployment_id} failed.
      Manual intervention required before frontend deployment.
      
      Check logs and artifacts for failure details.
      Frontend deployment is blocked pending investigation.
```

## Contract: Notification and Alerting

### Team Alert Requirements
```yaml
failure_notifications:
  github_issue:
    auto_create: true
    title: "Production Validation Failure - {date}"
    assignees: ["devops-team"]
    labels: ["production", "urgent", "validation-failure"]
  
  workflow_annotations:
    error_summary: "::error title=Production Validation Failed::{error_message}"
    blocking_notice: "::error::Frontend deployment blocked pending manual review"
  
  slack_integration:
    webhook_url: "{SLACK_WEBHOOK_URL}"
    channel: "#production-alerts"
    message: |
      🚨 Production validation failed for deployment {deployment_id}
      Workflow: {workflow_url}
      Manual intervention required before proceeding with frontend deployment.
```

### Success Confirmation
```yaml
success_notifications:
  workflow_annotations:
    success_summary: "::notice title=Production Validation Passed::Validation completed successfully"
    deployment_clearance: "::notice::Frontend deployment approved with confidence"
  
  deployment_gate:
    status: "PASSED"
    message: "Production infrastructure validated successfully"
    next_steps: "Frontend deployment can proceed"
```

## Contract: Constitutional Compliance in Error Handling

### Local Testing Requirement
```bash
# Error conditions must be reproducible locally
gh auth status                    # Verify authentication
gh release download nonexistent   # Test error handling
echo $?                          # Should return non-zero

# Maestro error simulation  
maestro test nonexistent.apk     # Test APK not found error
echo $?                          # Should return non-zero
```

### TDD Approach for Error Handling
```yaml
test_requirements:
  - "Write tests that verify each error condition triggers correct response"
  - "Validate error messages are actionable for developers"
  - "Ensure error states don't leave workflow in inconsistent state"
  - "Test recovery procedures work as documented"
```