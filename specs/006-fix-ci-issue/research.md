# Phase 0 Research: Remove Invalid Validation Step from Production Build

## Problem Analysis

**Decision**: Remove the "validate-main" job from build-production.yml workflow
**Rationale**: The validation step was added without request and references commands (typecheck, lint) that don't exist in this project, causing production builds to fail
**Alternatives considered**:

- Fixing the commands instead of removing validation (rejected - commands not needed for production builds)
- Keeping validation but removing problematic commands (rejected - validation not part of original requirements)

## Current Production Build Workflow Analysis

**Current State**: build-production.yml contains a "validate-main" job that runs:

- `devbox run test`
- `devbox run typecheck`
- `devbox run lint`

**Issue**: `typecheck` and potentially `lint` commands are not available in this project's devbox configuration

**Original Purpose**: Production build should only build APK and create GitHub release

## GitHub Actions Workflow Best Practices

**Decision**: Restore workflow to single-purpose: build and release
**Rationale**: Production builds should be focused and not duplicate validation that should happen in PR workflows
**Alternatives considered**:

- Adding the missing commands (rejected - scope creep beyond original requirements)
- Making validation optional (rejected - adds complexity without value)

## Rollback Strategy

**Decision**: Remove the entire "validate-main" job and its dependency
**Rationale**: Clean revert to original functionality without introducing partial fixes
**Implementation**:

1. Remove "validate-main" job definition
2. Remove "needs: validate-main" dependency from build job
3. Restore direct triggering without validation gate

This approach ensures the production build workflow returns to its core purpose of building and releasing APK files when code is pushed to main branch.
