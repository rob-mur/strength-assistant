# Production Workflow Troubleshooting Guide

This guide helps troubleshoot issues with the unified production deployment workflow that consolidates APK building, infrastructure deployment, and production validation.

## Overview

The unified workflow (`production-deployment.yml`) replaces three separate workflows:

- `build-production.yml` (archived)
- `terraform-deploy.yml` (archived)
- `production-validation.yml` (archived)

## Common Issues

### 1. Workflow Not Found

**Symptoms:**

- GitHub CLI can't find "Production Deployment" workflow
- Workflow doesn't appear in GitHub Actions UI

**Diagnosis:**

```bash
gh workflow list
ls -la .github/workflows/production-deployment.yml
```

**Solutions:**

- Ensure workflow file exists at `.github/workflows/production-deployment.yml`
- Commit and push workflow file to main branch
- Check workflow syntax: `yamllint .github/workflows/production-deployment.yml`

### 2. APK Naming Issues

**Symptoms:**

- Production validation fails with "APK not found"
- Tests looking for wrong APK filename

**Diagnosis:**

```bash
# Check for incorrect APK references
grep -r "build_preview.apk" .github/workflows/
grep -r "build_preview.apk" scripts/
```

**Solutions:**

- Replace all `build_preview.apk` references with `build_production.apk`
- Update integration test scripts
- Verify APK output configuration in build job

### 3. Job Dependencies Failing

**Symptoms:**

- Jobs running in wrong order
- Jobs starting before prerequisites complete
- Validation job can't find outputs from previous jobs

**Diagnosis:**

```bash
# Verify job dependencies
grep -A10 "needs:" .github/workflows/production-deployment.yml
```

**Expected Structure:**

```yaml
terraform-deploy:
  needs: build-production-apk

production-validation:
  needs: [build-production-apk, terraform-deploy]
```

### 4. Concurrency Issues

**Symptoms:**

- Multiple deployments running simultaneously
- Deployments not cancelling on new pushes

**Diagnosis:**

```bash
# Check concurrency configuration
grep -A3 "concurrency:" .github/workflows/production-deployment.yml
```

**Expected Configuration:**

```yaml
concurrency:
  group: production-deployment
  cancel-in-progress: true
```

### 5. Artifact Sharing Problems

**Symptoms:**

- APK download fails in validation job
- Missing deployment metadata

**Diagnosis:**

```bash
# Check job outputs
grep -A10 "outputs:" .github/workflows/production-deployment.yml
```

**Solutions:**

- Verify build job defines `apk-filename` and `apk-path` outputs
- Check terraform job defines `deployment-id` and `infrastructure-url` outputs
- Ensure validation job references outputs correctly

### 6. GitHub Release Issues

**Symptoms:**

- APK upload to release fails
- Release creation errors

**Diagnosis:**

```bash
# Check recent releases
gh release list --limit=5
```

**Solutions:**

- Verify `GITHUB_TOKEN` has write permissions
- Check release tag naming convention
- Ensure APK file exists before upload

## Debugging Commands

### Workflow Status

```bash
# List all workflows
gh workflow list

# View recent runs
gh run list --workflow="production-deployment.yml" --limit=10

# Watch current run
gh run watch

# View detailed logs
gh run view <run-id> --log
```

### Local Testing

```bash
# Validate workflow syntax
yamllint .github/workflows/production-deployment.yml

# Test contract compliance
bash scripts/test-workflow-contract.sh
bash scripts/test-job-interfaces.sh

# Test scenario compliance
bash scripts/test-basic-workflow.sh
bash scripts/test-apk-naming.sh
bash scripts/test-job-dependencies.sh
bash scripts/test-concurrency.sh
bash scripts/test-failure-recovery.sh

# Monitor deployment status
bash scripts/monitor-deployment.sh
```

### Manual Workflow Execution

```bash
# Trigger workflow manually
gh workflow run "Production Deployment"

# Cancel running workflow
gh run cancel <run-id>
```

## Recovery Procedures

### Rollback to Separate Workflows

If the unified workflow has critical issues:

1. **Restore archived workflows:**

```bash
cp archived-workflows-009/build-production.yml.archived .github/workflows/build-production.yml
cp archived-workflows-009/terraform-deploy.yml.archived .github/workflows/terraform-deploy.yml
cp archived-workflows-009/production-validation.yml.archived .github/workflows/production-validation.yml
```

2. **Disable unified workflow:**

```bash
mv .github/workflows/production-deployment.yml .github/workflows/production-deployment.yml.disabled
```

3. **Commit changes:**

```bash
git add .github/workflows/
git commit -m "rollback: restore separate workflows temporarily"
git push origin main
```

### Fix and Re-enable

1. **Fix issues in unified workflow**
2. **Test locally:**

```bash
bash scripts/test-workflow-contract.sh
bash scripts/test-job-interfaces.sh
```

3. **Re-enable:**

```bash
mv .github/workflows/production-deployment.yml.disabled .github/workflows/production-deployment.yml
rm .github/workflows/build-production.yml
rm .github/workflows/terraform-deploy.yml
rm .github/workflows/production-validation.yml
```

## Performance Monitoring

### Key Metrics

- Workflow execution time (target: < 15 minutes)
- Job success rates (target: > 95%)
- APK download success rate (target: 100%)
- Concurrency effectiveness (no parallel runs)

### Monitoring Script

```bash
# Basic monitoring
bash scripts/monitor-deployment.sh

# Continuous monitoring
bash scripts/monitor-deployment.sh --watch
```

## Support Escalation

### Collect Diagnostic Information

Before escalating issues:

1. **Workflow logs:**

```bash
gh run view <run-id> --log > workflow-logs.txt
```

2. **Environment details:**

```bash
gh auth status
git status
git log --oneline -5
```

3. **Configuration verification:**

```bash
yamllint .github/workflows/production-deployment.yml
cat .github/workflows/production-deployment.yml
```

### Issue Templates

**APK Issues:**

- Workflow run ID:
- Expected APK name: build_production.apk
- Actual error message:
- Release tag checked:

**Job Dependency Issues:**

- Workflow run ID:
- Job that failed to start:
- Expected dependency:
- Actual job outputs:

**Concurrency Issues:**

- Multiple run IDs:
- Expected behavior: cancel previous
- Actual behavior:
- Time between commits:
