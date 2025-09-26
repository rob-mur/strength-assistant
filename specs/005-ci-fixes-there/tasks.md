# Tasks: CI Pipeline Workflow Dependencies Fix

**Input**: Design documents from `/specs/005-ci-fixes-there/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Phase 3.1: Setup & Validation

- [x] T001 Validate GitHub Actions syntax for PR validation workflow contract
- [x] T002 [P] Validate GitHub Actions syntax for production build workflow contract
- [x] T003 [P] Backup existing workflow files before modification
- [x] T004 [P] Test workflow dependencies configuration locally using act

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T005 [P] Create test branch scenario for PR validation workflow testing
- [x] T006 [P] Create test scenarios for production build trigger validation
- [x] T007 [P] Create test scenarios for failure handling in PR workflows
- [x] T008 [P] Create manual workflow dispatch test scenarios

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [x] T009 [P] Implement PR validation workflow at .github/workflows/pr-validation.yml
- [x] T010 [P] Update production build workflow at .github/workflows/build-production.yml
- [x] T011 Archive Unit Tests workflow file (.github/workflows/Unit Tests.yml)
- [x] T012 Archive Integration Tests Android workflow file (.github/workflows/Integration Tests Android.yml)
- [x] T013 Archive Integration Tests Chrome workflow file (.github/workflows/Integration Tests Chrome.yml)
- [x] T014 Archive Claude code review workflow file (.github/workflows/claude-code-review.yml)

## Phase 3.4: Integration

- [x] T015 Configure branch protection rules for main branch requiring PR validation status checks
- [x] T016 Update SonarQube workflow to maintain both PR and push triggers at .github/workflows/SonarQube.yml
- [x] T017 Test workflow dependency resolution in PR validation workflow
- [x] T018 Verify production build no longer waits for PR-only workflows

## Phase 3.5: Validation & Testing

- [x] T019 [P] Execute quickstart Test Scenario 1: Pull Request Validation
- [x] T020 [P] Execute quickstart Test Scenario 2: Production Build Trigger
- [x] T021 [P] Execute quickstart Test Scenario 3: Manual Production Build
- [x] T022 [P] Execute quickstart Test Scenario 4: Failure Handling
- [x] T023 Validate that Claude review only runs after all PR tests succeed
- [x] T024 Validate that production builds trigger immediately on main push
- [x] T025 Test locally using devbox and GitHub CLI before CI validation

## Phase 3.6: Polish & Cleanup

- [x] T026 [P] Clean up workflow artifacts from archived workflow files
- [x] T027 [P] Update CLAUDE.md with completed CI fixes implementation
- [x] T028 [P] Document rollback procedure for CI workflow changes
- [x] T029 Verify all quickstart success criteria are met
- [x] T030 Final end-to-end validation of CI pipeline behavior
