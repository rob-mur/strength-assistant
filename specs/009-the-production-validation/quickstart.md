# Quickstart: Production Workflow Consolidation Testing

**Feature**: Consolidate Production Deployment Workflows  
**Target**: Unified workflow replacing 3 separate workflows  
**Validation**: Push to main triggers single workflow with proper APK naming

## Prerequisites

- devbox environment active
- GitHub CLI authenticated
- Access to repository main branch
- Terraform workspace configured for production

## Test Scenarios

### Scenario 1: Basic Workflow Execution

**Objective**: Verify unified workflow executes all jobs in correct sequence

```bash
# 1. Create test branch from main
git checkout main
git pull origin main
git checkout -b test-unified-workflow

# 2. Make a minimal change to trigger workflow
echo "# Test unified workflow" >> test-workflow.md
git add test-workflow.md
git commit -m "test: trigger unified production workflow"

# 3. Push to main to trigger workflow
git checkout main
git merge test-unified-workflow
git push origin main

# 4. Monitor workflow execution
gh run list --workflow="production-deployment" --limit=1
gh run watch

# 5. Verify job sequence
# Expected: build-production-apk → terraform-deploy → production-validation
```

**Success Criteria**:
- Single workflow triggered by push to main
- Three jobs execute in sequential order
- No separate workflows running concurrently

### Scenario 2: APK Naming Validation

**Objective**: Confirm production validation uses build_production.apk (not build_preview.apk)

```bash
# 1. Trigger workflow (from Scenario 1)
gh run list --workflow="production-deployment" --limit=1

# 2. Download workflow logs
gh run download <run-id>

# 3. Verify APK naming in logs
grep -r "build_production.apk" downloaded-logs/
grep -r "build_preview.apk" downloaded-logs/

# 4. Check artifact naming
gh release list --limit=1
gh release view <latest-release> | grep "build_production.apk"
```

**Success Criteria**:
- build_production.apk appears in validation job logs
- build_preview.apk does NOT appear in validation job logs
- GitHub release contains build_production.apk artifact

### Scenario 3: Job Dependency Validation

**Objective**: Verify proper job sequencing and failure handling

```bash
# 1. Monitor live workflow execution
gh run watch --exit-status

# 2. Check job dependencies in workflow file
cat .github/workflows/production-deployment.yml | grep -A 5 "needs:"

# 3. Verify artifact sharing between jobs
# Check that validation job downloads APK from build job
gh run view <run-id> --log | grep -A 10 "Download.*APK"
```

**Success Criteria**:
- terraform-deploy job waits for build-production-apk completion
- production-validation job waits for both previous jobs
- Artifacts properly shared between jobs

### Scenario 4: Concurrency Handling

**Objective**: Test workflow cancellation on concurrent pushes

```bash
# 1. Start first workflow
echo "# First change" >> test-concurrency-1.md
git add test-concurrency-1.md
git commit -m "test: first concurrent workflow"
git push origin main

# 2. Immediately start second workflow
echo "# Second change" >> test-concurrency-2.md
git add test-concurrency-2.md
git commit -m "test: second concurrent workflow"
git push origin main

# 3. Check workflow cancellation
gh run list --workflow="production-deployment" --limit=5
# Should see first workflow cancelled, second workflow running
```

**Success Criteria**:
- First workflow gets cancelled status
- Second workflow starts and runs to completion
- Only one workflow runs at a time

### Scenario 5: Failure Recovery

**Objective**: Test workflow behavior when jobs fail

```bash
# This scenario requires temporarily modifying workflow to simulate failure
# In a test environment, you would:

# 1. Create a test version that fails at terraform-deploy
# 2. Verify production-validation does not execute
# 3. Check that failure notifications are sent
# 4. Confirm workflow stops at point of failure

# For quickstart, check recent failed runs:
gh run list --workflow="production-deployment" --status=failure --limit=3
```

**Success Criteria**:
- Failed job stops execution of dependent jobs
- Clear failure reporting in GitHub Actions UI
- Proper cleanup of partial deployment state

## Validation Commands

### Local Testing (devbox)

```bash
# Validate workflow syntax locally
devbox run lint-workflows
# or
yamllint .github/workflows/production-deployment.yml

# Test workflow components locally
devbox run test-apk-build
devbox run test-terraform-validate
devbox run test-production-validation
```

### Production Validation

```bash
# Check current workflow status
gh run list --workflow="production-deployment" --limit=5

# Verify APK availability
gh release list --limit=1
gh release download <latest-release> build_production.apk

# Test APK integrity
file build_production.apk
# Should output: Android application package

# Check deployment status
gh run view <latest-run-id> --log | grep -E "(SUCCESS|FAILURE|CANCELLED)"
```

## Expected Results

After successful implementation:

1. **Single Workflow**: Only one workflow file handles all production deployment
2. **Correct APK Naming**: build_production.apk used consistently throughout
3. **Sequential Execution**: Jobs run in order: build → deploy → validate
4. **Proper Dependencies**: Each job waits for required prerequisites
5. **Concurrency Control**: New pushes cancel running deployments
6. **Failure Handling**: Job failures stop dependent jobs appropriately

## Troubleshooting

### Common Issues

**Multiple workflows still running**:
- Check if old workflow files still exist in `.github/workflows/`
- Verify workflow names don't conflict

**APK naming mismatch**:
- Search codebase for hardcoded "build_preview.apk" references
- Update all references to "build_production.apk"

**Job dependencies not working**:
- Verify `needs:` syntax in workflow YAML
- Check that job names match exactly

**Concurrent workflows not cancelling**:
- Verify `concurrency` group configuration
- Check `cancel-in-progress: true` setting

### Debug Commands

```bash
# Check all GitHub Actions workflows
ls -la .github/workflows/

# Validate YAML syntax
yamllint .github/workflows/*.yml

# Search for APK filename references
rg "build_.*\.apk" --type yaml

# Check recent workflow runs
gh run list --limit=10
```

## Cleanup

```bash
# Remove test branches
git branch -d test-unified-workflow

# Remove test files
rm -f test-workflow.md test-concurrency-*.md
git add -A
git commit -m "cleanup: remove workflow test files"
git push origin main
```