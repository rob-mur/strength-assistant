# Alert Integration Contract

**Contract**: Define alerting and notification behavior for production validation failures
**Purpose**: Ensure team is notified and frontend deployment is blocked on validation failure

## Alert Trigger Contract

### Success Scenario

- All Maestro flows pass (exit code 0)
- Production validation job succeeds
- No alerts sent
- Frontend deployment can proceed (when implemented)

### Failure Scenario

- Any Maestro flow fails (non-zero exit code)
- Production validation job fails
- Alert notifications sent immediately
- Frontend deployment blocked

## Alert Content Contract

### Required Information

```json
{
  "event": "Production Validation Failed",
  "timestamp": "2025-09-24T10:30:00Z",
  "terraformDeploymentId": "deploy-12345",
  "githubJobUrl": "https://github.com/repo/actions/runs/12345",
  "failedFlows": [
    {
      "flowName": "add-exercise-and-see-it-in-list.yml",
      "exitCode": 1,
      "error": "Assertion failed: expected element 'exercise-list' to be visible"
    }
  ],
  "artifactUrls": [
    "https://github.com/repo/actions/runs/12345/artifacts/screenshots"
  ],
  "nextSteps": [
    "Review production validation logs",
    "Check if infrastructure rollback is needed",
    "Investigate failed assertions"
  ]
}
```

### Alert Channels

- **Primary**: GitHub Actions job failure notification
- **Secondary**: Slack/email notifications (configured per team preferences)
- **Escalation**: Manual review required for rollback decision

## Blocking Contract

### Frontend Deployment Gate

- Production validation failure prevents frontend deployment
- No automatic frontend deployment until:
  - Issue resolved and validation re-run succeeds, OR
  - Manual override with explicit acknowledgment of risk

### Manual Intervention Points

1. **Review Phase**: Team reviews failure logs and artifacts
2. **Decision Phase**: Determine if infrastructure rollback needed
3. **Action Phase**: Execute rollback OR fix forward OR accept risk

### Override Mechanism

- Manual GitHub Actions approval for frontend deployment
- Explicit acknowledgment of production validation failure
- Audit trail of override decision and rationale

## Integration Points

### With GitHub Actions

```yaml
- name: Send Failure Alert
  if: failure()
  uses: ./.github/actions/send-alert
  with:
    event: production-validation-failed
    job-url: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
    terraform-deployment-id: ${{ github.event.inputs.terraform_deployment_id }}
```

### With Slack/Email

- Webhook integration for immediate notifications
- Rich formatting with links to logs and artifacts
- @channel mention for critical production failures

### With Future Frontend Deployment

- Check for production validation success before deploying frontend
- Block deployment pipeline step if validation failed
- Require manual approval workflow for overrides

## Response Workflow Contract

### Immediate Response (0-15 minutes)

1. Alert received by on-call team
2. Logs and artifacts reviewed
3. Initial impact assessment

### Investigation Phase (15-60 minutes)

1. Determine root cause (infrastructure vs application)
2. Assess rollback necessity
3. Plan corrective action

### Resolution Phase (60+ minutes)

1. Execute chosen resolution (rollback/fix/accept)
2. Re-run validation if changes made
3. Update team on resolution

## Metrics and Monitoring

### Success Metrics

- Production validation pass rate
- Time to resolution for failures
- False positive rate (failures not requiring rollback)

### Alert Quality Metrics

- Alert fatigue (too frequent/noisy)
- Time to response
- Actionability of alert content

**Contract Status**: COMPLETE - Defines alerting and blocking behavior for failures
