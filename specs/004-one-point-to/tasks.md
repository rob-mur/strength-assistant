# Tasks: Production Server Testing Enhancement

**Input**: Design documents from `/specs/004-one-point-to/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓), quickstart.md (✓)

## Summary

Pure workflow modification: Update `.github/workflows/production-validation.yml` to download existing GitHub release artifacts instead of rebuilding APK. This eliminates duplicate builds while maintaining constitutional compliance with devbox, anonymous users, and infrastructure as code principles.

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup & Verification

- [x] T001 Verify current production validation workflow structure at `.github/workflows/production-validation.yml`
- [x] T002 Confirm GitHub CLI availability for artifact download in GitHub Actions environment
- [x] T003 Check existing build-production workflow creates GitHub release artifacts correctly

## Phase 3.2: Core Workflow Modification

- [x] T004 Replace APK build step with GitHub release artifact download in `.github/workflows/production-validation.yml`
- [x] T005 Update Maestro test action APK path reference to use downloaded artifact path in `.github/workflows/production-validation.yml`
- [x] T006 Update success/failure result processing step references in `.github/workflows/production-validation.yml`
- [x] T007 Add comprehensive error handling for missing releases and download failures in `.github/workflows/production-validation.yml`

## Phase 3.3: Error Handling & Resilience

- [x] T008 Implement retry logic for GitHub API failures in `.github/workflows/production-validation.yml`
- [x] T009 Add APK validation after download to detect corruption in `.github/workflows/production-validation.yml`
- [x] T010 Update workflow failure notifications with artifact-specific error context in `.github/workflows/production-validation.yml`

## Phase 3.4: Local Testing & Documentation

- [x] T011 [P] Create local test script for GitHub CLI release download in `scripts/test-release-download.sh`
- [x] T012 Test workflow changes locally using act (GitHub Actions local runner)
- [x] T013 [P] Update quickstart.md with final implementation details and verification steps
- [x] T014 [P] Add workflow comments explaining artifact reuse approach in `.github/workflows/production-validation.yml`

## Phase 3.5: Validation & Completion

- [ ] T015 Test production validation workflow end-to-end with actual GitHub release
- [ ] T016 Verify anonymous user testing behavior remains unchanged (SKIP_DATA_CLEANUP preservation)
- [ ] T017 [P] Update CLAUDE.md with implementation completion and lessons learned
- [ ] T018 Commit implementation with constitutional compliance verification

## Dependencies

### Critical Path
- Setup (T001-T003) before workflow modification (T004-T007)
- Core modification (T004-T007) before error handling (T008-T010)  
- Error handling complete before local testing (T011-T014)
- Local validation before final testing (T015-T018)

### Parallel Opportunities
- **T011, T013-T014**: Documentation and local scripts can be created independently
- **T017**: CLAUDE.md update independent of other tasks

## Implementation Details

### T004: Replace APK Build Step
```yaml
# REMOVE:
- name: Build Production APK
  uses: ./.github/actions/android-build
  with:
    build-type: production
    devbox-config: android-build
    artifact-name: production-apk
  id: build-apk

# REPLACE WITH:
- name: Download Production APK
  shell: bash
  run: |
    gh release download latest --pattern "*.apk" --dir ./artifacts
    APK_FILE=$(ls ./artifacts/*.apk | head -1)
    
    if [ ! -f "$APK_FILE" ]; then
      echo "::error::No APK found in release artifacts"
      exit 1
    fi
    
    echo "Downloaded APK: $APK_FILE"
    echo "apk-path=$APK_FILE" >> $GITHUB_OUTPUT
    echo "build-successful=true" >> $GITHUB_OUTPUT
  id: download-apk
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### T005: Update APK Path Reference
```yaml
# CHANGE:
- name: Run Maestro Tests Against Production
  uses: ./.github/actions/maestro-test
  with:
    apk-path: production-apk

# TO:
- name: Run Maestro Tests Against Production
  uses: ./.github/actions/maestro-test
  with:
    apk-path: ${{ steps.download-apk.outputs.apk-path }}
```

### T006: Update Result Processing
```yaml
# CHANGE:
echo "Build successful: ${{ steps.build-apk.outputs.build-successful }}"

# TO:
echo "APK download successful: ${{ steps.download-apk.outputs.build-successful }}"
```

## Constitutional Compliance Verification

- **Local Testing First**: T012 ensures workflow changes testable via act locally
- **Infrastructure as Code**: All changes in version-controlled `.github/workflows/`  
- **Anonymous User Testing**: T016 validates SKIP_DATA_CLEANUP behavior preserved
- **Progressive Validation**: T015 confirms production validation maintains pipeline integrity

## Task Generation Rationale

1. **From Clarifications**: 
   - "Pure workflow change" → Focus only on `.github/workflows/production-validation.yml`
   - No test code, no application changes, no new dependencies

2. **From Quickstart**:
   - Implementation steps → T004-T006 (core workflow modifications)
   - Local testing approach → T011-T012 (validation)

3. **From Plan Technical Context**:
   - GitHub Actions + devbox consistency → T012 (local testing with act)
   - Constitutional compliance → T016 (verify anonymous user behavior)

## Notes

- Single workflow file modification keeps complexity minimal
- All tasks target the same file (`.github/workflows/production-validation.yml`) so must run sequentially for T004-T010
- [P] tasks target different files for true parallelism  
- Local testing with act maintains constitutional "Local Testing First" principle
- No JavaScript/TypeScript code needed - pure CI/CD infrastructure change