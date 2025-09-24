# Production Validation Manual Testing Checklist

This checklist covers manual testing scenarios for the production validation system to ensure it works correctly before relying on automated processes.

## Prerequisites

### Environment Setup

- [ ] GitHub repository access with Actions permissions
- [ ] EAS CLI installed and authenticated
- [ ] GitHub CLI (`gh`) installed and authenticated
- [ ] Access to production Supabase project
- [ ] Terraform deployment environment access

### Configuration Validation

- [ ] `EXPO_TOKEN` secret configured in GitHub repository
- [ ] Production Supabase URL and anon key set in EAS environment
- [ ] Production Supabase URL and anon key set in GitHub secrets (backup)
- [ ] Terraform deployment workflow exists and is functional

## Test Scenarios

### 1. Manual Production Validation Trigger

**Objective:** Verify that production validation can be triggered manually and executes correctly.

**Steps:**

1. Trigger manual production validation:

   ```bash
   gh workflow run production-validation.yml \
     --field terraform_deployment_id="manual-test-$(date +%s)"
   ```

2. Monitor workflow execution:
   ```bash
   gh run list --workflow=production-validation.yml --limit=1
   gh run view --log  # Use the run ID from above
   ```

**Expected Results:**

- [ ] Workflow starts successfully
- [ ] APK builds with production configuration
- [ ] Android emulator starts and APK installs
- [ ] Maestro flows execute against production server
- [ ] Anonymous users are created successfully
- [ ] Test results are collected as artifacts
- [ ] Appropriate alerts are sent based on test outcome

**Failure Investigation:**

- Check GitHub Actions logs for specific error messages
- Review artifacts for Maestro screenshots and execution logs
- Verify production server connectivity and response times

### 2. Post-Terraform Automatic Trigger

**Objective:** Verify that production validation triggers automatically after successful terraform deployment.

**Steps:**

1. Deploy infrastructure via terraform (or simulate completion):

   ```bash
   # This would typically be done through your terraform workflow
   # For testing, you can manually complete a terraform workflow
   ```

2. Verify automatic trigger:
   ```bash
   # Check if production validation started automatically
   gh run list --workflow=production-validation.yml --limit=3
   ```

**Expected Results:**

- [ ] Production validation starts automatically after terraform completion
- [ ] Deployment ID is correctly extracted from terraform workflow
- [ ] Validation follows same success criteria as manual trigger

### 3. Deployment Gate Functionality

**Objective:** Verify that the deployment gate correctly blocks or approves deployments based on validation status.

**Steps:**

1. Test with successful validation:

   ```bash
   # Ensure recent validation passed, then test deployment gate
   gh workflow run deployment-gate.yml \
     --field deployment_type="frontend" \
     --field deployment_environment="production"
   ```

2. Test with failed validation:
   ```bash
   # After a validation failure, test that deployment is blocked
   gh workflow run deployment-gate.yml \
     --field deployment_type="frontend" \
     --field deployment_environment="production"
   ```

**Expected Results:**

- [ ] ✅ Recent successful validation → deployment approved
- [ ] ❌ Failed validation → deployment blocked with clear message
- [ ] ⏰ Stale validation (>24h for production) → deployment blocked
- [ ] 🔄 In-progress validation → deployment blocked with waiting message

### 4. Alert System Testing

**Objective:** Verify that alerts are sent correctly for different validation outcomes.

**Steps:**

1. Test success alert:

   ```bash
   # After successful validation, check alert output
   scripts/production-alert.sh "test-deployment-123" "passed"
   ```

2. Test failure alert:

   ```bash
   scripts/production-alert.sh "test-deployment-123" "failed"
   ```

3. Test timeout alert:
   ```bash
   scripts/production-alert.sh "test-deployment-123" "timeout"
   ```

**Expected Results:**

- [ ] Success alerts contain deployment approval message
- [ ] Failure alerts contain manual intervention instructions
- [ ] Timeout alerts contain investigation guidance
- [ ] GitHub Actions outputs are set correctly for downstream jobs

### 5. Production Server Integration

**Objective:** Verify that tests run against actual production infrastructure and create anonymous users correctly.

**Steps:**

1. Check production server connectivity:

   ```bash
   curl -I https://your-production-server.com/api/health
   ```

2. Verify anonymous user creation in production:

   ```bash
   # Check Supabase logs during validation for anonymous user creation
   # Monitor production database for temporary test users
   ```

3. Confirm data isolation:
   ```bash
   # Verify that test data doesn't interfere with real user data
   # Check that SKIP_DATA_CLEANUP=true is respected
   ```

**Expected Results:**

- [ ] Tests connect to actual production Supabase instance
- [ ] Anonymous users are created successfully
- [ ] Test data is properly isolated from real users
- [ ] No cleanup is performed (anonymous users handled automatically)

### 6. Performance Validation

**Objective:** Ensure production validation completes within reasonable timeframes.

**Steps:**

1. Monitor validation execution time:

   ```bash
   # Record start and end times of validation workflow
   # Typical expectation: 15-25 minutes total
   ```

2. Break down timing by phase:
   - APK build: ~5-10 minutes
   - Emulator setup: ~3-5 minutes
   - Maestro execution: ~5-10 minutes
   - Cleanup and reporting: ~2-3 minutes

**Expected Results:**

- [ ] Total execution time under 30 minutes (workflow timeout)
- [ ] APK build completes successfully within 10 minutes
- [ ] Maestro tests complete within 10 minutes
- [ ] No timeout-related failures

### 7. Error Scenarios Testing

**Objective:** Verify proper error handling and reporting for common failure modes.

**Test Cases:**

#### 7.1 APK Build Failure

```bash
# Temporarily break EAS token or configuration
# Verify failure is detected and reported clearly
```

#### 7.2 Production Server Unavailable

```bash
# Test during production maintenance window or simulate network issues
# Verify appropriate timeout and retry behavior
```

#### 7.3 Maestro Flow Changes

```bash
# Test with outdated Maestro flows that might fail against production
# Verify clear error reporting and artifact collection
```

**Expected Results:**

- [ ] Clear error messages for different failure types
- [ ] Appropriate alerts and notifications sent
- [ ] Artifacts collected for debugging
- [ ] Deployment properly blocked after failures

## Acceptance Criteria

### Functional Requirements

- [ ] Manual trigger works consistently
- [ ] Automatic trigger after terraform deployment works
- [ ] Deployment gate correctly blocks/approves based on validation status
- [ ] Alerts provide actionable information
- [ ] Production server integration works without affecting real users
- [ ] Performance meets timing requirements

### Non-Functional Requirements

- [ ] Error messages are clear and actionable
- [ ] Artifacts are properly collected for debugging
- [ ] Security: no production secrets exposed in logs
- [ ] Reliability: consistent behavior across multiple runs

### Documentation and Usability

- [ ] Setup documentation is accurate and complete
- [ ] Troubleshooting guide covers observed issues
- [ ] Commands in CLAUDE.md work as documented
- [ ] Manual procedures are clearly documented

## Sign-off

**Tested by:** **\*\***\_\_\_**\*\***  
**Date:** **\*\***\_\_\_**\*\***  
**Environment:** **\*\***\_\_\_**\*\***

**Issues Found:**

- [ ] None - ready for production use
- [ ] Minor issues documented, addressed, or accepted
- [ ] Major issues require resolution before production use

**Additional Notes:**
_Space for any additional observations or recommendations_
