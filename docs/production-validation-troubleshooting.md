# Production Validation Troubleshooting Guide

This guide covers common issues encountered during production validation testing and their solutions.

## Quick Diagnostics

### Check Validation Status
```bash
# Check recent production validation runs
gh run list --workflow=production-validation.yml --limit=5

# View detailed logs for specific run
gh run view <run-id> --log
```

### Manual Validation Test
```bash
# Trigger manual validation
gh workflow run production-validation.yml \
  --field terraform_deployment_id="manual-test-$(date +%s)"
```

## Common Issues

### 1. APK Build Failures

#### Issue: EAS Authentication Failed
```
Error: Authentication token required for EAS builds
```

**Diagnosis:**
- Missing or invalid `EXPO_TOKEN` secret
- Token expired or revoked

**Solution:**
```bash
# Generate new Expo token
npx eas login
npx eas whoami -t

# Update GitHub secret
gh secret set EXPO_TOKEN --body "YOUR_NEW_TOKEN"
```

#### Issue: Production Configuration Missing
```
Error: Missing required environment variables
```

**Diagnosis:**
- Production Supabase credentials not configured in EAS
- Environment variables not set for production profile

**Solution:**
```bash
# Set production environment variables in EAS
npx eas env:set EXPO_PUBLIC_SUPABASE_URL="https://your-project.supabase.co" --environment production
npx eas env:set EXPO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key" --environment production
```

### 2. Maestro Test Failures

#### Issue: Emulator Not Starting
```
Error: Failed to start Android emulator
```

**Diagnosis:**
- GitHub Actions runner resource limitations
- Android emulator configuration issues

**Solution:**
1. Check emulator configuration in workflow:
   ```yaml
   - uses: reactivecircus/android-emulator-runner@v2
     with:
       api-level: 29
       target: default
       arch: x86_64
       profile: Nexus 6
   ```

2. Add emulator startup verification:
   ```bash
   adb wait-for-device
   adb shell getprop sys.boot_completed
   ```

#### Issue: APK Installation Failed
```
Error: Failed to install APK on emulator
```

**Diagnosis:**
- APK build path incorrect
- Emulator storage full
- Architecture mismatch

**Solution:**
```bash
# Verify APK exists and get correct path
find . -name "*.apk" -type f
ls -la build/

# Clear emulator storage
adb shell pm clear com.jimmy_solutions.strength_assistant
```

#### Issue: Maestro Flow Execution Failed
```
Error: Maestro test timed out or failed to find element
```

**Diagnosis:**
- Production server connectivity issues
- App not fully loaded
- UI elements changed

**Solution:**
1. Check Maestro flow files for environment-specific selectors
2. Add longer waits for production server responses:
   ```yaml
   - waitForAnimationToEnd:
       timeout: 10000
   ```

3. Verify production server is accessible from GitHub Actions:
   ```bash
   curl -I https://your-production-server.com/api/health
   ```

### 3. Production Server Issues

#### Issue: Supabase Connection Failed
```
Error: Invalid API key or connection refused
```

**Diagnosis:**
- Production Supabase project URL incorrect
- Anonymous key expired or wrong
- Network connectivity issues

**Solution:**
```bash
# Test Supabase connection
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://your-project-id.supabase.co/rest/v1/"

# Check project status in Supabase dashboard
# Verify API keys match between EAS and GitHub secrets
```

#### Issue: Anonymous User Creation Failed
```
Error: Failed to create anonymous user
```

**Diagnosis:**
- Row Level Security (RLS) policies too restrictive
- Anonymous authentication disabled
- Database schema changes

**Solution:**
1. Check RLS policies in Supabase:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'user_accounts';
   ```

2. Verify anonymous authentication is enabled:
   - Supabase Dashboard → Authentication → Settings
   - Check "Enable anonymous sign-ins"

3. Test anonymous user creation manually:
   ```javascript
   const { data, error } = await supabase.auth.signInAnonymously()
   console.log(data, error)
   ```

### 4. Workflow Trigger Issues

#### Issue: Workflow Not Triggering After Terraform
```
Production validation not starting after terraform deployment
```

**Diagnosis:**
- Terraform workflow name mismatch
- Branch restrictions
- Workflow permissions

**Solution:**
1. Check terraform workflow name:
   ```yaml
   workflow_run:
     workflows: ["Terraform Deploy", "Infrastructure Deploy"]
     types: [completed]
     branches: [main, master]
   ```

2. Verify terraform workflow conclusion:
   ```bash
   gh run list --workflow="terraform-deploy.yml" --limit=1 --json conclusion
   ```

3. Check workflow permissions in repository settings

#### Issue: Deployment Gate Blocking Valid Deployments
```
Deployment blocked despite successful validation
```

**Diagnosis:**
- Validation status check logic error
- Stale validation check too restrictive
- GitHub CLI permissions

**Solution:**
1. Check recent validation status:
   ```bash
   gh run list --workflow=production-validation.yml --limit=1 --json conclusion,createdAt
   ```

2. Adjust stale validation time window if needed:
   ```bash
   # Current: 24 hours for production
   # Consider: 48 hours or environment-specific timeouts
   ```

### 5. Performance Issues

#### Issue: Validation Takes Too Long
```
Workflow times out after 30 minutes
```

**Diagnosis:**
- Slow APK build process
- Emulator startup delays
- Network connectivity issues

**Solution:**
1. Optimize APK build:
   ```yaml
   # Use local builds instead of cloud builds
   - run: npx eas build --platform android --profile production --local
   ```

2. Pre-warm emulator:
   ```yaml
   - name: Pre-warm emulator
     run: |
       echo "no" | avdmanager create avd -n test -k "system-images;android-29;default;x86_64"
       emulator -avd test -no-window -no-audio &
       adb wait-for-device
   ```

3. Parallel test execution:
   ```yaml
   # Run multiple Maestro flows in parallel if possible
   strategy:
     matrix:
       test: [add-exercise, record-workout]
   ```

## Monitoring and Alerts

### Set Up Notifications
```bash
# GitHub CLI notifications for workflow failures
gh api repos/:owner/:repo/hooks --method POST --field name=web \
  --field config[url]="https://your-webhook-url.com" \
  --field events[]="workflow_run"
```

### Health Check Dashboard
Create a simple dashboard to monitor production validation:

```bash
#!/bin/bash
# production-validation-health.sh

echo "🏥 Production Validation Health Check"
echo "======================================"

# Check recent runs
echo "📊 Recent validation runs:"
gh run list --workflow=production-validation.yml --limit=5 --json status,conclusion,createdAt

# Check deployment gate status
echo "🚪 Deployment gate status:"
gh run list --workflow=deployment-gate.yml --limit=3 --json status,conclusion

# Check production server health
echo "🌐 Production server health:"
curl -s -o /dev/null -w "%{http_code}" https://your-production-server.com/api/health
```

## Emergency Procedures

### Manual Override for Critical Fixes
If production validation is blocking critical fixes:

1. **Temporary bypass** (use sparingly):
   ```bash
   # Create manual deployment without validation gate
   gh workflow run frontend-deployment.yml --field skip_validation=true
   ```

2. **Emergency deployment approval**:
   ```bash
   # Mark validation as manually approved
   gh run create-check --name="production-validation-manual-override" \
     --status=completed --conclusion=success
   ```

3. **Post-emergency validation**:
   ```bash
   # Run validation after emergency deployment
   gh workflow run production-validation.yml \
     --field terraform_deployment_id="post-emergency-validation"
   ```

## Getting Help

### Debug Information to Collect
When reporting issues, include:

1. GitHub run ID and logs
2. Maestro test artifacts (screenshots, logs)
3. Production server status
4. Recent terraform deployment details
5. Environment configuration (sanitized)

### Escalation Process
1. Check this troubleshooting guide
2. Review GitHub Actions logs and artifacts
3. Test individual components manually
4. Contact DevOps team with debug information
5. Consider emergency bypass if critical