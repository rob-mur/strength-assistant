# Quick Start: CI/CD Pipeline Optimization

**Purpose**: Get started with the optimized Android build pipeline that eliminates duplicate builds

## Overview

This feature optimizes the existing CI/CD pipeline to:
1. Build Android APK once on merge request creation
2. Create draft GitHub release with the build artifact
3. Promote draft to production release on main merge (without rebuilding)
4. Integrate with existing Terraform deployment workflow

## Prerequisites

- Existing GitHub Actions workflow for Android builds
- GitHub repository with appropriate permissions
- Terraform deployment process already configured
- EAS Build setup for mobile app compilation

## Implementation Steps

### Phase 1: Modify MR Build Workflow

1. **Update existing workflow** (`.github/workflows/build-on-mr.yml`):
   ```yaml
   # Add after successful APK build
   - name: Create Draft Release
     uses: softprops/action-gh-release@v2
     with:
       tag_name: v${{ github.run_number }}
       name: Release v${{ github.run_number }}
       draft: true
       files: |
         build/outputs/apk/release/*.apk
         checksums.txt
     env:
       GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
   ```

2. **Extract build scripts** to `.github/scripts/`:
   - `build-apk.sh` - APK compilation logic
   - `create-draft.sh` - Draft release creation
   - `validate-artifacts.sh` - Artifact integrity checks

### Phase 2: Add Main Merge Promotion

1. **Create new workflow** (`.github/workflows/promote-on-main.yml`):
   ```yaml
   name: Promote Release
   on:
     push:
       branches: [main]
   
   jobs:
     promote:
       runs-on: ubuntu-latest
       steps:
         - name: Find Latest Draft Release
           run: |
             # Find draft release for current commit
             RELEASE_ID=$(gh api repos/${{ github.repository }}/releases \
               --jq '.[] | select(.draft==true and .tag_name | contains("${{ github.sha }}")) | .id')
             echo "RELEASE_ID=$RELEASE_ID" >> $GITHUB_ENV
   
         - name: Promote to Production
           run: |
             gh api repos/${{ github.repository }}/releases/${{ env.RELEASE_ID }} \
               -X PATCH -f draft=false
   ```

### Phase 3: Integration with Terraform

1. **Modify terraform workflow** to trigger after successful deployment:
   ```yaml
   # Add to existing terraform workflow
   - name: Trigger Release Promotion
     if: success()
     uses: ./.github/workflows/promote-on-main.yml
   ```

2. **Add terraform deployment validation** before promotion:
   ```bash
   # Verify terraform deployment succeeded
   terraform output deployment_status | grep "success"
   ```

## Testing Strategy

### Unit Tests
```bash
# Test build scripts
./tests/scripts/test-pipeline-scripts.sh

# Validate workflow YAML
github/super-linter .github/workflows/
```

### Integration Tests
```bash
# Test complete workflow on feature branch
git checkout -b test/pipeline-optimization
git push origin test/pipeline-optimization
# Verify draft release creation

# Test promotion workflow
git checkout main
git merge test/pipeline-optimization
git push origin main
# Verify release promotion
```

### Validation Checklist
- [ ] APK builds exactly once per MR
- [ ] Draft release created with correct artifacts
- [ ] Artifact checksums match between draft and production
- [ ] Release promotion completes within 2 minutes
- [ ] Terraform integration works without disruption
- [ ] Error scenarios handled gracefully

## Configuration

### Environment Variables
```yaml
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Required for release API
  # No additional secrets needed - uses existing permissions
```

### Concurrency Control
```yaml
concurrency:
  group: release-${{ github.ref }}
  cancel-in-progress: false  # Don't cancel release workflows
```

## Monitoring and Observability

### Success Metrics
- Build time reduction: Target 50% decrease
- Resource usage: Monitor CI/CD compute time savings
- Release promotion time: <2 minutes target
- Error rate: <5% for automated promotions

### Logging
- Draft release creation events
- Artifact upload confirmations
- Release promotion status
- Terraform integration checkpoints

### Alerts
- Failed draft release creation
- Artifact integrity validation failures
- Release promotion timeouts
- Terraform deployment failures

## Troubleshooting

### Common Issues

**Draft release not created**:
```bash
# Check workflow logs for GitHub API errors
gh run list --workflow="build-on-mr.yml"
gh run view [RUN_ID] --log
```

**Release promotion fails**:
```bash
# Verify draft release exists
gh release list --draft

# Check artifact integrity
gh release view [TAG] --json assets
```

**Terraform integration issues**:
```bash
# Verify terraform output
terraform output deployment_status

# Check workflow dependencies
gh run list --workflow="terraform-deploy.yml"
```

### Recovery Procedures

**Manual release promotion**:
```bash
# Find draft release ID
RELEASE_ID=$(gh release list --draft --json id,tagName --jq '.[] | select(.tagName=="v1.2.3") | .id')

# Promote manually
gh api repos/$GITHUB_REPOSITORY/releases/$RELEASE_ID -X PATCH -f draft=false
```

**Rollback failed promotion**:
```bash
# Create new draft from same commit
gh release create v1.2.3-rollback --draft --target [COMMIT_SHA]
```

## Performance Impact

### Expected Improvements
- **Build Time**: 50% reduction in total MR-to-production time
- **Resource Usage**: Eliminate duplicate APK compilation
- **Developer Experience**: Faster feedback, clearer release status

### Resource Requirements
- **Storage**: GitHub release storage for APK artifacts
- **API Calls**: ~5 GitHub API calls per release cycle
- **Compute**: No additional compute for promotion (API-only operation)

## Next Steps

1. **Phase 1**: Implement MR build optimization
2. **Phase 2**: Add main merge promotion
3. **Phase 3**: Integrate with terraform workflow
4. **Phase 4**: Add monitoring and alerting
5. **Phase 5**: Optimize for multiple concurrent MRs

## Support

For implementation questions or issues:
- Check workflow logs in GitHub Actions
- Review API rate limits and permissions
- Validate artifact checksums and integrity
- Test in feature branch before main deployment