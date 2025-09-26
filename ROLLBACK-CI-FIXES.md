# Rollback Procedure: CI Pipeline Workflow Dependencies Fix

## Quick Rollback Commands

If the CI workflow changes cause issues, execute these commands to restore the original state:

```bash
# 1. Restore archived workflow files
cp archived-workflows/Unit\ Tests.yml.archive .github/workflows/Unit\ Tests.yml
cp archived-workflows/Integration\ Tests\ Android.yml.archive .github/workflows/Integration\ Tests\ Android.yml
cp archived-workflows/Integration\ Tests\ Chrome.yml.archive .github/workflows/Integration\ Tests\ Chrome.yml
cp archived-workflows/claude-code-review.yml.archive .github/workflows/claude-code-review.yml

# 2. Remove new PR validation workflow
rm .github/workflows/pr-validation.yml

# 3. Restore original production build workflow from backup
git checkout HEAD~1 -- .github/workflows/build-production.yml

# 4. Commit rollback changes
git add .github/workflows/
git commit -m "rollback: restore original CI workflow configuration"
git push origin 005-ci-fixes-there
```

## Detailed Rollback Steps

### Step 1: Restore Individual Test Workflows

- Unit Tests workflow → `.github/workflows/Unit Tests.yml`
- Integration Tests Android → `.github/workflows/Integration Tests Android.yml`
- Integration Tests Chrome → `.github/workflows/Integration Tests Chrome.yml`
- Claude Code Review → `.github/workflows/claude-code-review.yml`

### Step 2: Remove Consolidated Workflow

- Delete `.github/workflows/pr-validation.yml`

### Step 3: Restore Original Production Build

- Restore workflow_run triggers for production builds
- Remove the new validation step

### Step 4: Verify Rollback

```bash
# Check that all original workflows are restored
ls -la .github/workflows/
gh workflow list

# Verify production build waits for workflow_run again
grep -A 10 "workflow_run:" .github/workflows/build-production.yml
```

## What Gets Restored

**Before Fix (Original State)**:

- Individual workflows: Unit Tests, Integration Tests Android, Integration Tests Chrome, Claude Code Review
- Production build uses `workflow_run` triggers
- Claude review runs independently, not waiting for tests

**After Rollback**:

- All individual workflows active again
- Production build waits for workflow_run events
- Returns to original CI pipeline behavior

## Branch Protection Adjustment

If branch protection rules were updated to require the new "PR Validation" status check:

1. Go to GitHub repository settings → Branches → main branch rules
2. Remove "PR Validation / claude-review" from required status checks
3. Add back individual workflow checks as needed

## Verification After Rollback

1. **Create test PR**: Verify individual workflows run separately
2. **Check production build**: Should wait for workflow_run events again
3. **Verify Claude review**: Runs independently without waiting for tests

## Backup Location

Original workflow files are preserved in `archived-workflows/` directory:

- `Unit Tests.yml.archive`
- `Integration Tests Android.yml.archive`
- `Integration Tests Chrome.yml.archive`
- `claude-code-review.yml.archive`

## Emergency Contact

If rollback fails or causes additional issues:

1. Create GitHub issue describing the problem
2. Mention the rollback attempt and current state
3. Include error messages from workflow runs
