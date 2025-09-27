# Tasks: Fix Production APK Download Failure

**Input**: Design documents from `/specs/008-the-current-production/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Target Files

- `.github/workflows/production-validation.yml` (main workflow fix)
- Local testing scripts for validation
- Error handling improvements

## Phase 3.1: Setup & Validation

- [x] T001 Verify local environment has GitHub CLI and proper authentication
- [x] T002 [P] Test current APK download failure locally using quickstart Scenario 1
- [x] T003 [P] Test current APK download failure locally using quickstart Scenario 2
- [x] T004 Document current error patterns and root cause analysis

## Phase 3.2: Current State Analysis

- [x] T005 [P] Validate GitHub release verification contract requirements in `.github/workflows/production-validation.yml:44-52`
- [x] T006 [P] Analyze APK download operation contract against current implementation in `.github/workflows/production-validation.yml:54-84`
- [x] T007 [P] Review retry logic effectiveness for exit code 2 scenarios in `.github/workflows/production-validation.yml:59-73`
- [x] T008 Identify specific systematic failure points vs transient failure handling

## Phase 3.3: Core Implementation

- [x] T009 Add GitHub release asset verification before download attempt in `.github/workflows/production-validation.yml`
- [x] T010 Implement systematic error detection (exit code 2) with no retry logic in `.github/workflows/production-validation.yml`
- [x] T011 Add APK asset enumeration using `gh release view latest` in `.github/workflows/production-validation.yml`
- [x] T012 Update error messages with specific troubleshooting steps for each failure scenario

## Phase 3.4: Integration Testing

- [x] T013 [P] Test workflow changes using quickstart Scenario 3 (local devbox validation)
- [x] T014 [P] Test error condition handling using quickstart Scenario 4 (error scenarios)
- [x] T015 Validate production-validation-workflow contract compliance
- [x] T016 Test workflow trigger and environment variable handling

## Phase 3.5: Validation & Verification

- [x] T017 [P] Execute quickstart Scenario 1: GitHub release asset verification
- [x] T018 [P] Execute quickstart Scenario 2: APK download process validation
- [x] T019 [P] Execute quickstart Scenario 3: Production validation workflow testing
- [x] T020 [P] Execute quickstart Scenario 4: Error condition testing
- [x] T021 Test GitHub Actions workflow execution with `gh workflow run production-validation.yml`
- [x] T022 Verify workflow logs show improved error diagnostics and no unnecessary retries

## Phase 3.6: Polish & Documentation

- [x] T023 [P] Update CLAUDE.md with APK download fix completion
- [x] T024 [P] Document troubleshooting improvements in workflow comments
- [x] T025 [P] Verify constitutional compliance (Local Testing First, CI/CD Infrastructure as Code)
- [x] T026 Validate that systematic failures (exit code 2) no longer trigger retries
- [x] T027 Final integration test using production validation workflow end-to-end

## Dependencies

### Critical Path

- T001-T004 (Setup) before T005-T008 (Analysis)
- T005-T008 (Analysis) before T009-T012 (Implementation)
- T009-T012 (Implementation) before T013-T016 (Integration Testing)
- T017-T022 (Validation) requires T009-T012 completion
- T023-T027 (Polish) requires all previous phases

### Parallel Execution Opportunities

- T002, T003 can run in parallel (different quickstart scenarios)
- T005, T006, T007 can run in parallel (different contract validations)
- T013, T014 can run in parallel (different testing approaches)
- T017, T018, T019, T020 can run in parallel (different quickstart scenarios)
- T023, T024, T025 can run in parallel (different documentation tasks)

## Parallel Example

```bash
# Launch T017-T020 together (quickstart validation):
Task: "Execute quickstart Scenario 1: GitHub release asset verification"
Task: "Execute quickstart Scenario 2: APK download process validation"
Task: "Execute quickstart Scenario 3: Production validation workflow testing"
Task: "Execute quickstart Scenario 4: Error condition testing"
```

## Key Implementation Notes

### Contract-Based Tasks

- **T005**: github-release-verification.yml contract validation
- **T006**: apk-download-operation.yml contract validation
- **T015**: production-validation-workflow.yml contract compliance

### Entity-Based Tasks

- **GitHub Release**: T009 (asset verification), T011 (enumeration)
- **APK Asset**: T010 (download logic), T012 (error handling)
- **Download Operation**: T010 (systematic error detection)
- **Validation Result**: T012 (error messages), T022 (diagnostics)

### Research-Based Tasks

- **T008**: Apply research findings on exit code 2 meaning
- **T010**: Implement research decision on retry logic inappropriateness
- **T026**: Validate research conclusion about systematic vs transient failures

## Success Criteria

1. **Systematic Error Detection**: Exit code 2 failures identified without retry attempts
2. **Asset Verification**: GitHub release assets verified before download
3. **Improved Diagnostics**: Clear error messages with specific troubleshooting steps
4. **Constitutional Compliance**: All changes testable locally using devbox
5. **Workflow Reliability**: Production validation succeeds when APK assets exist

## Notes

- All workflow changes to single file: `.github/workflows/production-validation.yml`
- Test locally using GitHub CLI and devbox before CI submission
- Focus on systematic failure detection rather than retry optimization
- Maintain existing anonymous user testing approach (SKIP_DATA_CLEANUP=true)
- Preserve existing APK integrity validation logic
