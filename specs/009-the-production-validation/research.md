# Research: Production Workflow Consolidation

**Feature**: Consolidate Production Deployment Workflows  
**Phase**: 0 (Research & Investigation)  
**Date**: 2025-09-27

## Research Objectives

Analyze the current production deployment workflow structure and identify the technical requirements for consolidating separate workflows into a unified deployment pipeline.

## Findings

### 1. Current Workflow Analysis

**Research Question**: What are the current separate workflows and their interdependencies?

**Decision**: Three separate workflows need consolidation: Build Production APK, Terraform Deploy, and Production Validation
**Rationale**: 
- Current complexity creates coordination issues between workflows
- Multiple trigger points lead to inconsistent deployment states
- Workflow dependencies are implicit rather than explicit
- Failure handling is distributed across separate processes

**Alternatives Considered**:
- Keep separate workflows with better coordination → Rejected: adds complexity without solving root issues
- Partial consolidation (2 of 3 workflows) → Rejected: still leaves coordination gaps
- Complete consolidation → Selected: provides unified control and clear dependencies

### 2. APK Naming Issue Investigation

**Research Question**: Why does production validation fail with incorrect APK filename?

**Decision**: Production validation scripts are hardcoded to look for build_preview.apk instead of build_production.apk
**Rationale**:
- Build workflow produces build_production.apk for production releases
- Validation workflow expects build_preview.apk (likely copied from preview/staging scripts)
- Mismatch causes systematic validation failures in production pipeline
- Filename standardization needed across all production workflows

**Alternatives Considered**:
- Change build output to build_preview.apk → Rejected: breaks consistency with production naming
- Use dynamic filename detection → Rejected: adds complexity without solving root issue
- Standardize on build_production.apk → Selected: maintains clear production naming convention

### 3. Job Dependency Management

**Research Question**: How should job dependencies be structured in the unified workflow?

**Decision**: Sequential job execution with explicit dependencies: build → deploy → validate
**Rationale**:
- APK must be built before deployment infrastructure changes
- Infrastructure must be deployed before validation can test against it
- Clear failure points prevent partial deployment states
- Each job has distinct success/failure criteria

**Alternatives Considered**:
- Parallel execution where possible → Rejected: dependencies require sequential execution
- Manual approval gates → Rejected: adds friction to automated deployment
- Conditional execution based on changes → Rejected: increases complexity

### 4. Concurrency Handling Strategy

**Research Question**: How should concurrent pushes to main be handled during active deployments?

**Decision**: Cancel running deployment and start fresh with latest commit (clarified in specification)
**Rationale**:
- Ensures latest code changes are always deployed
- Prevents resource conflicts from simultaneous deployments
- Simplifies state management (no queuing complexity)
- Fast feedback for developers on latest changes

**Alternatives Considered**:
- Queue deployments → Rejected: can lead to long delays
- Block new pushes → Rejected: impedes development velocity
- Parallel deployments → Rejected: resource conflicts and state management complexity

### 5. Timeout and Resource Management

**Research Question**: What timeout and resource constraints should apply?

**Decision**: No automatic timeouts, operations run until completion or manual cancellation (clarified in specification)
**Rationale**:
- Complex infrastructure changes may require variable time
- Automatic timeouts can interrupt legitimate long-running operations
- Manual oversight preferred for production deployment decisions
- Cancellation available through new push triggers

**Alternatives Considered**:
- Fixed timeouts per job → Rejected: may interrupt legitimate operations
- Variable timeouts → Rejected: adds configuration complexity
- No timeout with manual controls → Selected: provides maximum flexibility

## Technical Dependencies Best Practices

### GitHub Actions Workflow Design
- **Best Practice**: Use job dependencies with `needs` keyword for explicit sequencing
- **Best Practice**: Share artifacts between jobs using `upload-artifact` and `download-artifact`
- **Best Practice**: Use consistent naming conventions for workflow artifacts

### APK Build and Deployment
- **Best Practice**: Standardize APK naming across all environments and workflows
- **Best Practice**: Validate APK integrity before deployment and testing
- **Best Practice**: Use GitHub releases for artifact storage and retrieval

### Infrastructure as Code
- **Best Practice**: Maintain Terraform state consistency across deployments
- **Best Practice**: Use workspace isolation for different deployment stages
- **Best Practice**: Validate infrastructure changes before application deployment

## Integration Patterns

### Workflow Consolidation
- **Pattern**: Single workflow file with multiple jobs and explicit dependencies
- **Pattern**: Artifact passing between jobs for consistency
- **Pattern**: Centralized failure handling and notification

### Cancellation and Concurrency
- **Pattern**: Use GitHub Actions concurrency groups to manage concurrent runs
- **Pattern**: Cancel in-progress workflows when new commits are pushed
- **Pattern**: Preserve workflow history for debugging and rollback scenarios

## Resolution Summary

All technical requirements have been identified and resolved:

1. **Workflow Structure**: Single workflow with three sequential jobs
2. **APK Naming**: Standardize on build_production.apk filename
3. **Job Dependencies**: Explicit dependencies with artifact sharing
4. **Concurrency**: Cancel-and-restart strategy for new pushes
5. **Timeouts**: No automatic timeouts, manual control preferred

## Next Steps

Phase 1 can proceed with:
- Data model for workflow entities and job relationships
- Contracts for unified workflow structure and job interfaces
- Quickstart scenarios for testing consolidated workflow behavior