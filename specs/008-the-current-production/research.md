# Research: APK Download Failure Analysis

**Feature**: Fix Production APK Download Failure  
**Phase**: 0 (Research & Investigation)  
**Date**: 2025-09-27

## Research Objectives

Extract and resolve all NEEDS CLARIFICATION items from Technical Context:

- APK download systematic failure patterns
- GitHub CLI error code 2 root causes
- GitHub Release asset access requirements
- Retry logic effectiveness analysis

## Findings

### 1. GitHub CLI Download Patterns

**Research Question**: Why does `gh release download latest --pattern "*.apk"` fail with exit code 2?

**Decision**: Exit code 2 indicates GitHub CLI cannot find matching assets or lacks permissions
**Rationale**:

- Exit code 2 in GitHub CLI typically means "no matching files found" or "permission denied"
- Systematic failure across all 3 retry attempts suggests persistent issue, not transient network failure
- Pattern `*.apk` requires exact filename matching in GitHub release assets

**Alternatives Considered**:

- Network connectivity issues → Rejected: would show different error patterns
- Rate limiting → Rejected: would typically show HTTP 429 errors, not exit code 2
- Transient failures → Rejected: consistent failure across retries indicates systematic issue

### 2. GitHub Release Asset Access Requirements

**Research Question**: What permissions and conditions are needed for `gh release download`?

**Decision**: Requires read access to repository and release assets must exist with correct naming
**Rationale**:

- GITHUB_TOKEN needs `contents: read` permission for release assets
- APK files must be uploaded to GitHub release as assets (not just built)
- Asset filename must match the pattern `*.apk` exactly
- Release must be published (not draft) for download access

**Alternatives Considered**:

- Using different download methods → GitHub API directly has similar requirements
- Downloading from workflow artifacts → Time-limited and requires different API

### 3. APK Build vs Release Upload Workflow

**Research Question**: Is the APK being successfully uploaded to GitHub releases?

**Decision**: Need to verify build-production.yml actually uploads APK to release assets
**Rationale**:

- Error pattern suggests APK files are not present in release assets
- Build success doesn't guarantee release upload success
- Common CI/CD issue: builds succeed but artifact upload fails silently

**Alternatives Considered**:

- Assuming upload works → Rejected: error evidence suggests otherwise
- Using artifact download instead → Time-limited, not suitable for production validation

### 4. Error Handling and Retry Logic Analysis

**Research Question**: Is the current retry logic appropriate for exit code 2 failures?

**Decision**: Retry logic is inappropriate for systematic failures (exit code 2)
**Rationale**:

- Exit code 2 indicates persistent condition (missing files/permissions)
- Exponential backoff (2s, 4s) won't resolve file existence or permission issues
- Retries are useful for network issues (timeouts, 5xx errors) but not for 404/403 scenarios

**Alternatives Considered**:

- Increasing retry attempts → Won't fix root cause
- Different backoff strategy → Still won't resolve missing assets
- Immediate failure on exit code 2 → Better approach for this error type

### 5. GitHub Release Asset Verification Strategy

**Research Question**: How can we verify APK exists before attempting download?

**Decision**: Use `gh release view` to list assets before download attempt
**Rationale**:

- Provides clear diagnostic information about available assets
- Separates "no release" from "no APK in release" scenarios
- Enables better error messages for troubleshooting

**Alternatives Considered**:

- Direct download with error handling → Current approach, provides poor diagnostics
- GitHub API calls → More complex, similar information available via CLI

## Technical Dependencies Best Practices

### GitHub CLI Usage

- **Best Practice**: Always verify asset existence before download
- **Best Practice**: Use specific error handling for different exit codes
- **Best Practice**: Provide detailed error messages for troubleshooting

### CI/CD Artifact Management

- **Best Practice**: Verify upload success in build workflows
- **Best Practice**: Use consistent naming patterns for assets
- **Best Practice**: Separate build/upload from download/validate concerns

### Error Handling Patterns

- **Best Practice**: Don't retry systematic failures (permission/missing file issues)
- **Best Practice**: Provide actionable error messages with investigation steps
- **Best Practice**: Use appropriate exit codes for different failure types

## Integration Patterns

### GitHub Actions Workflow Integration

- **Pattern**: Use step outputs for success/failure communication
- **Pattern**: Separate download validation from test execution
- **Pattern**: Provide comprehensive error context for debugging

### Release Asset Management

- **Pattern**: Verify asset upload success in build workflows
- **Pattern**: Use consistent asset naming conventions
- **Pattern**: Include asset metadata (size, checksum) for validation

## Resolution Summary

All NEEDS CLARIFICATION items have been resolved through research:

1. **Exit code 2 meaning**: Missing assets or permission issues (not network failures)
2. **GitHub CLI requirements**: Proper permissions and existing assets with correct naming
3. **Retry logic appropriateness**: Not suitable for systematic failures
4. **Root cause diagnosis**: Need to verify APK upload to GitHub releases
5. **Error handling strategy**: Immediate verification before download attempts

## Next Steps

Phase 1 can proceed with:

- Data model for GitHub Release and APK entities
- Contracts for APK verification and download operations
- Quickstart scenarios for testing APK download workflows
