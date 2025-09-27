# Quickstart: Correct Production Validation Workflow

## Validation Steps

This quickstart validates that the production validation workflow corrections work correctly by testing both APK build and terraform deployment triggering scenarios.

### Prerequisites

- GitHub repository with current production validation workflow
- EXPO_TOKEN secret properly configured
- build-production workflow operational
- terraform-deploy workflow operational (for infrastructure changes)

### Test Scenario 1: APK Build Triggers Production Validation

1. **Create test change (no infrastructure)**:

   ```bash
   git checkout -b test-validation-apk-trigger
   echo "// Test change for APK trigger - $(date)" >> lib/test-validation-trigger.ts
   git add . && git commit -m "test: validate production validation triggers after APK build"
   ```

2. **Merge to main**:

   ```bash
   # Create PR and merge to main via GitHub UI or:
   git checkout main
   git merge test-validation-apk-trigger
   git push origin main
   ```

3. **Verify automatic triggering**:
   - Check that `Build Production APK` workflow completes successfully
   - Verify `Production Validation` triggers automatically after APK build completion
   - Confirm validation does NOT wait for terraform deployment
   - Verify APK download and Maestro tests execute successfully

4. **Expected outcomes**:
   - ✅ Production validation triggers after APK build completes
   - ✅ No dependency on terraform deployment workflow
   - ✅ APK download succeeds from GitHub release
   - ✅ Maestro tests execute against production infrastructure

### Test Scenario 2: Terraform Deployment Triggers Production Validation

1. **Create infrastructure change**:

   ```bash
   git checkout -b test-validation-terraform-trigger
   echo "# Test terraform change - $(date)" >> terraform/test-change.tf
   git add . && git commit -m "test: validate production validation triggers after terraform deploy"
   ```

2. **Merge to main**:

   ```bash
   git checkout main
   git merge test-validation-terraform-trigger
   git push origin main
   ```

3. **Verify terraform and validation flow**:
   - Check that `Terraform Deploy` workflow completes successfully
   - Verify `Production Validation` triggers automatically after terraform completion
   - Confirm validation uses most recent APK from GitHub release
   - Verify complete production validation execution

4. **Expected outcomes**:
   - ✅ Production validation triggers after terraform deployment
   - ✅ Validation downloads APK from latest GitHub release
   - ✅ Tests execute successfully against updated infrastructure

### Test Scenario 3: Manual Production Validation Trigger

1. **Trigger manual validation**:

   ```bash
   gh workflow run "Production Validation" --field terraform_deployment_id="manual-test-$(date +%s)"
   ```

2. **Verify manual execution**:
   - Check that workflow runs immediately when manually triggered
   - Confirm APK download and test execution works identically
   - Verify terraform_deployment_id parameter is used in notifications

3. **Expected outcomes**:
   - ✅ Manual workflow dispatch works immediately
   - ✅ Same validation steps execute as automatic triggers
   - ✅ Custom deployment ID appears in success/failure notifications

### Test Scenario 4: Workflow Structure Verification

1. **Verify corrected workflow structure**:

   ```bash
   # Check workflow trigger configuration
   grep -A 5 "workflow_run:" .github/workflows/production-validation.yml

   # Verify correct workflow dependencies
   grep "workflows:" .github/workflows/production-validation.yml

   # Confirm no references to non-existent jobs
   grep -q "Infrastructure Deploy" .github/workflows/production-validation.yml && echo "❌ Still references non-existent workflow" || echo "✅ No references to Infrastructure Deploy"
   ```

2. **Verify debug workflow removal**:

   ```bash
   # Check that debug workflow is removed
   ls .github/workflows/test-production-validation.yml 2>/dev/null && echo "❌ Debug workflow still exists" || echo "✅ Debug workflow removed"
   ```

3. **Expected outcomes**:
   - ✅ Workflow triggers include both "Build Production APK" and "Terraform Deploy"
   - ✅ No references to non-existent "Infrastructure Deploy" workflow
   - ✅ Debug workflow test-production-validation.yml is removed

### Test Scenario 5: Error Handling Verification

1. **Test missing APK scenario**:
   - Manually trigger validation before any APK build has run
   - Verify graceful error handling with clear error messages
   - Confirm retry logic and error reporting work correctly

2. **Test workflow failure scenarios**:
   - Verify validation doesn't trigger when Build Production APK fails
   - Confirm appropriate conditional execution based on workflow success

3. **Expected outcomes**:
   - ✅ Clear error messages when APK unavailable
   - ✅ No validation execution when prerequisite workflows fail
   - ✅ Proper error reporting and investigation steps provided

### Success Criteria

All test scenarios must pass with the following behaviors:

- Production validation triggers after APK build completion (regardless of infrastructure changes)
- Production validation triggers after terraform deployment completion
- No waiting for terraform when only APK changes occur
- No references to non-existent "Infrastructure Deploy" workflow
- Debug workflow test-production-validation.yml is removed
- Manual triggering continues to work via workflow_dispatch
- APK download and Maestro test execution preserved

### Rollback Plan

If the corrections cause issues:

1. Restore original workflow structure: `git revert <commit-hash>`
2. Re-add any required dependencies if validation fails
3. Restore debug workflow if needed for troubleshooting
4. Push revert to main branch to restore working state
