# Production Rollback Procedures

This document outlines rollback procedures when production validation fails after infrastructure deployment, requiring manual intervention to restore service.

## Overview

Production validation runs **after** terraform infrastructure deployment but **before** frontend deployment. When validation fails, infrastructure has already been deployed but may have issues requiring rollback.

## Decision Matrix

### When Production Validation Fails

| Scenario                                              | Action                              | Reason                                              |
| ----------------------------------------------------- | ----------------------------------- | --------------------------------------------------- |
| Infrastructure issue (network, certificates, etc.)    | **Infrastructure Rollback**         | Fix underlying infrastructure problem               |
| Application issue (API changes, data migration, etc.) | **Application Fix + Re-validation** | Application code can be fixed without infra changes |
| Test environment issue (emulator, Maestro, CI)        | **Re-run Validation**               | Issue is with validation process, not production    |
| Production data issue (database, user accounts)       | **Data Fix + Re-validation**        | Address data layer problems                         |

## Rollback Procedures

### 1. Infrastructure Rollback

**Use when:** Infrastructure deployment caused production validation failure

**Steps:**

```bash
# 1. Assess impact
gh run view <failed-validation-run-id> --log
curl -I https://production-server.com/api/health

# 2. Terraform rollback
cd terraform/
terraform plan -destroy -target=<specific-resources>  # Target specific resources if possible
terraform apply -destroy -target=<specific-resources>

# Or full rollback:
terraform apply -var="rollback_to_previous=true"

# 3. Verify rollback
curl -I https://production-server.com/api/health
gh workflow run production-validation.yml --field terraform_deployment_id="rollback-verification-$(date +%s)"

# 4. Document incident
gh issue create --title "Production Rollback: $(date)" --body "..."
```

### 2. Application Fix and Re-validation

**Use when:** Application code issues cause validation failure

**Steps:**

```bash
# 1. Identify application issue
gh run view <failed-validation-run-id> --log
# Review Maestro screenshots and error logs

# 2. Create hotfix
git checkout -b hotfix/production-validation-fix
# Make minimal code changes to fix validation issue
git commit -m "hotfix: fix production validation issue"
git push origin hotfix/production-validation-fix

# 3. Deploy hotfix (without full CI/CD pipeline)
# For Supabase: Database migrations or configuration changes
supabase db push  # If database changes needed

# For API: Direct deployment if possible
# Or use emergency deployment process

# 4. Re-run validation
gh workflow run production-validation.yml --field terraform_deployment_id="hotfix-$(date +%s)"

# 5. If validation passes, proceed with normal frontend deployment
```

### 3. Re-run Validation (Test Environment Issues)

**Use when:** Validation failure is due to testing infrastructure, not production

**Steps:**

```bash
# 1. Check if it's a test environment issue
# Common signs:
# - GitHub Actions runner issues
# - Android emulator failures
# - Maestro CLI issues
# - Network timeouts in CI environment

# 2. Wait and retry (often resolves runner issues)
sleep 300  # Wait 5 minutes
gh workflow run production-validation.yml --field terraform_deployment_id="retry-$(date +%s)"

# 3. If still failing, check test infrastructure
gh run list --workflow=production-validation.yml --limit=5 --json conclusion
# Look for patterns indicating systemic test issues

# 4. Manual validation as backup
# Follow manual testing checklist in docs/production-validation-manual-test.md
```

### 4. Data Fix and Re-validation

**Use when:** Database or data layer issues prevent validation

**Steps:**

```bash
# 1. Identify data issue
# Review Supabase logs during validation failure
# Check for:
# - RLS policy issues
# - Anonymous user creation failures
# - Database connectivity problems

# 2. Fix data layer issues
# Example: Update RLS policies
supabase sql --file fix-rls-policies.sql

# Example: Clear problematic test data
supabase sql --query "DELETE FROM user_accounts WHERE email LIKE '%@anonymous.test'"

# 3. Verify fix manually
curl -H "apikey: $SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
     -X POST \
     "https://your-project.supabase.co/auth/v1/signup" \
     -d '{"email":"test@anonymous.test","password":"testpass123"}'

# 4. Re-run validation
gh workflow run production-validation.yml --field terraform_deployment_id="datafix-$(date +%s)"
```

## Emergency Override Procedures

### When Immediate Deployment is Critical

**⚠️ Use only for critical security fixes or major outages**

```bash
# 1. Document emergency override decision
gh issue create --title "EMERGENCY OVERRIDE: $(date)" \
  --body "Production validation bypassed due to: [REASON]

  Authorized by: [NAME]
  Risk assessment: [ASSESSMENT]
  Post-deployment validation plan: [PLAN]"

# 2. Manual deployment bypass
# Modify deployment workflow to skip validation gate temporarily
export EMERGENCY_OVERRIDE=true
gh workflow run frontend-deployment.yml --field skip_validation=true

# 3. Post-deployment validation
# After emergency deployment, run validation to verify system health
gh workflow run production-validation.yml --field terraform_deployment_id="post-emergency-$(date +%s)"

# 4. Follow up
# Address root cause of validation failure
# Update procedures to prevent similar emergencies
```

## Communication Protocols

### Internal Team Notification

```bash
# Use during rollback procedures
scripts/production-alert.sh "rollback-$(date +%s)" "rollback_initiated"
```

### Stakeholder Communication

**Template for rollback notifications:**

```
Subject: Production Deployment Rollback - [DATE]

Status: Infrastructure rollback in progress
Reason: Production validation failure - [BRIEF DESCRIPTION]
Impact: [USER-FACING IMPACT]
ETA: [ESTIMATED RESOLUTION TIME]

Actions taken:
1. Production validation failed at [TIME]
2. Infrastructure rollback initiated at [TIME]
3. [SPECIFIC ROLLBACK ACTIONS]

Next steps:
1. [IMMEDIATE ACTIONS]
2. [ROOT CAUSE INVESTIGATION]
3. [PREVENTION MEASURES]

Updates will be provided every 30 minutes.
```

## Post-Incident Procedures

### After Successful Rollback

1. **Document the incident:**

   ```bash
   gh issue create --title "Production Rollback Post-Mortem" \
     --body "Incident: [DESCRIPTION]
     Root cause: [ANALYSIS]
     Resolution: [ACTIONS TAKEN]
     Lessons learned: [IMPROVEMENTS]
     Action items: [FOLLOW-UP TASKS]"
   ```

2. **Update monitoring:**
   - Add alerts for similar failure patterns
   - Improve validation test coverage
   - Update rollback automation

3. **Team review:**
   - Conduct post-mortem meeting
   - Update procedures based on lessons learned
   - Practice rollback procedures during lower-risk periods

### Rollback Quality Checklist

After any rollback procedure, verify:

- [ ] Production services are responding correctly
- [ ] User authentication is working
- [ ] Database connections are stable
- [ ] Monitoring systems show healthy metrics
- [ ] No user data was lost or corrupted
- [ ] Frontend deployment is properly blocked/allowed
- [ ] Team has been notified of resolution

## Prevention Measures

### Reduce Rollback Risk

1. **Enhanced validation:**
   - Add pre-deployment infrastructure tests
   - Improve Maestro test coverage
   - Add production connectivity checks

2. **Staged deployments:**
   - Blue-green deployment strategy
   - Canary releases for infrastructure changes
   - Feature flags for application changes

3. **Better monitoring:**
   - Real-time infrastructure health checks
   - Automated alerting before validation runs
   - Production metric baselines

### Rollback Automation

Consider implementing automated rollback for common scenarios:

```bash
# Example: Automated rollback trigger
if [ "$VALIDATION_FAILURE_TYPE" = "infrastructure" ]; then
  if [ "$AUTO_ROLLBACK_ENABLED" = "true" ]; then
    echo "Initiating automated infrastructure rollback"
    ./scripts/automated-rollback.sh "$DEPLOYMENT_ID"
  fi
fi
```

## Contact Information

**Escalation during rollback procedures:**

- Primary on-call: [CONTACT]
- DevOps team: [CONTACT]
- Engineering lead: [CONTACT]
- Emergency contact: [CONTACT]

**Resources:**

- Infrastructure status: [DASHBOARD_URL]
- Production monitoring: [MONITORING_URL]
- Incident management: [INCIDENT_TOOL_URL]
