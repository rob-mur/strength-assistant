# Research: Correct Production Validation Workflow

## Current State Analysis

### Existing Workflow Dependencies

**Current Issue**: Production validation workflow only triggers after terraform deploy, but terraform deploy only runs when infrastructure files change. This creates a gap where APK builds don't trigger validation unless infrastructure changes.

**Current Triggers in production-validation.yml**:

```yaml
workflow_run:
  workflows: ["Terraform Deploy", "Infrastructure Deploy"]
  types: [completed]
  branches: [main]
```

**Problem**: "Infrastructure Deploy" workflow doesn't exist, causing dependency failures.

### Desired Behavior Research

**Decision**: Use `workflow_run` triggers for both "Build Production APK" and "Terraform Deploy" workflows
**Rationale**: GitHub Actions `workflow_run` supports multiple workflow triggers, allowing validation to run after either workflow completes
**Alternatives considered**:

- Single trigger: Would miss either APK builds or terraform deployments
- Workflow dispatch only: Would require manual triggering, reducing automation

### GitHub Actions Workflow_run Best Practices

**Decision**: Implement conditional execution based on which workflow triggered the validation
**Rationale**: Allows single workflow to handle both APK build completion and terraform deployment scenarios
**Alternatives considered**:

- Separate workflows: Would duplicate validation logic and increase maintenance
- Polling: Unreliable and inefficient compared to event-driven triggers

### Workflow File Cleanup

**Decision**: Remove test-production-validation.yml debug workflow
**Rationale**: Debug workflows clutter the repository and can confuse CI/CD pipeline understanding
**Alternatives considered**:

- Keep but disable: Still creates confusion about active workflows
- Rename to indicate test: Better to remove entirely if no longer needed

## Implementation Strategy

### Trigger Configuration

Use GitHub Actions `workflow_run` with multiple workflows:

```yaml
workflow_run:
  workflows: ["Build Production APK", "Terraform Deploy"]
  types: [completed]
  branches: [main]
```

This ensures production validation runs after either:

1. Production APK build completes (regardless of infrastructure changes)
2. Terraform deployment completes (when infrastructure changes occur)

### Dependency Removal

Remove references to non-existent "Infrastructure Deploy" workflow to prevent workflow execution failures.

### File Management

Delete obsolete debug workflow to maintain clean CI/CD environment.

## Technical Considerations

### Workflow Execution Context

GitHub Actions `workflow_run` provides context about the triggering workflow through `github.event.workflow_run` object, allowing conditional logic based on which workflow triggered validation.

### Resource Efficiency

Multiple triggers don't increase resource usage - validation only runs once per triggering event, not redundantly for both triggers.

### Backward Compatibility

Changes maintain existing manual trigger capability via `workflow_dispatch` for debugging and testing purposes.
