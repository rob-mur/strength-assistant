# Tasks: Consolidate Production Deployment Workflows

**Input**: Design documents from `/specs/009-the-production-validation/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Tech stack: YAML 1.2 (GitHub Actions), Bash scripting
   → Libraries: GitHub Actions, Terraform, devbox, Maestro
   → Structure: CI/CD infrastructure consolidation
2. Load design documents:
   → data-model.md: 7 entities → workflow/job tasks
   → contracts/: 2 files → contract validation tasks
   → quickstart.md: 5 scenarios → validation tests
3. Generate tasks by category:
   → Setup: workflow validation, local testing setup
   → Tests: contract validation, scenario testing
   → Core: unified workflow implementation
   → Integration: artifact sharing, job dependencies
   → Polish: documentation, cleanup
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Workflow components = sequential dependencies
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph for job sequencing
7. Create parallel execution examples
8. Validate task completeness
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **CI/CD Project**: `.github/workflows/`, `scripts/` at repository root
- All paths are absolute from repository root
- Workflow files follow GitHub Actions conventions

## Phase 3.1: Setup

- [x] T001 Validate current workflow structure and identify existing workflows to replace
- [x] T002 Setup local testing environment with devbox and GitHub CLI authentication
- [x] T003 [P] Configure workflow validation tools (yamllint, GitHub CLI workflow validation)

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T004 [P] Contract validation test for unified-deployment-workflow.yml structure in scripts/test-workflow-contract.sh
- [x] T005 [P] Contract validation test for job-interfaces.yml compliance in scripts/test-job-interfaces.sh
- [x] T006 [P] Integration test for basic workflow execution (Scenario 1) in scripts/test-basic-workflow.sh
- [x] T007 [P] Integration test for APK naming validation (Scenario 2) in scripts/test-apk-naming.sh
- [x] T008 [P] Integration test for job dependency validation (Scenario 3) in scripts/test-job-dependencies.sh
- [x] T009 [P] Integration test for concurrency handling (Scenario 4) in scripts/test-concurrency.sh
- [x] T010 [P] Integration test for failure recovery (Scenario 5) in scripts/test-failure-recovery.sh

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [x] T011 Create unified production deployment workflow in .github/workflows/production-deployment.yml
- [x] T012 Implement build-production-apk job with correct APK naming and GitHub release upload
- [x] T013 Implement terraform-deploy job with proper dependencies and output generation
- [x] T014 Implement production-validation job with APK download and anonymous user testing
- [x] T015 Configure workflow concurrency group for deployment cancellation
- [x] T016 Setup job dependencies and artifact sharing between build, deploy, and validation jobs
- [x] T017 Remove or disable existing separate workflow files that are being consolidated

## Phase 3.4: Integration

- [x] T018 Verify APK artifact sharing from build job to validation job works correctly
- [x] T019 Test terraform deployment metadata passing to validation job
- [x] T020 Validate workflow cancellation behavior on concurrent pushes to main
- [x] T021 Test failure handling and dependent job cancellation on job failures
- [x] T022 Verify anonymous user testing integration in production validation job

## Phase 3.5: Polish

- [x] T023 [P] Create workflow monitoring script for deployment status in scripts/monitor-deployment.sh
- [x] T024 [P] Add workflow troubleshooting documentation in docs/production-workflow-troubleshooting.md
- [x] T025 [P] Update project documentation to reflect new unified workflow in README.md
- [x] T026 Test locally using devbox and GitHub CLI before submitting PR
- [x] T027 Run complete quickstart validation scenarios
- [x] T028 Clean up any temporary test files and workflows used during development

## Dependencies

- Setup (T001-T003) before everything
- Tests (T004-T010) before implementation (T011-T017)
- T011 (unified workflow) blocks T012-T014 (individual job implementation)
- T015-T016 (workflow configuration) depend on T011-T014 completion
- T017 (cleanup old workflows) must be after T011-T016 are working
- Integration (T018-T022) requires core implementation complete
- Polish (T023-T028) requires all integration testing complete

## Parallel Example

```
# Launch contract validation tests together (T004-T005):
Task: "Contract validation test for unified-deployment-workflow.yml structure in scripts/test-workflow-contract.sh"
Task: "Contract validation test for job-interfaces.yml compliance in scripts/test-job-interfaces.sh"

# Launch integration scenario tests together (T006-T010):
Task: "Integration test for basic workflow execution (Scenario 1) in scripts/test-basic-workflow.sh"
Task: "Integration test for APK naming validation (Scenario 2) in scripts/test-apk-naming.sh"
Task: "Integration test for job dependency validation (Scenario 3) in scripts/test-job-dependencies.sh"
Task: "Integration test for concurrency handling (Scenario 4) in scripts/test-concurrency.sh"
Task: "Integration test for failure recovery (Scenario 5) in scripts/test-failure-recovery.sh"
```

## Notes

- [P] tasks = different files, no dependencies
- Verify workflow validation tests fail before implementing unified workflow
- Test locally using devbox and GitHub CLI before pushing to CI
- Commit after each major task (per job implementation)
- Focus on constitutional compliance: local testing first, progressive validation

## Task Generation Rules

_Applied during main() execution_

1. **From Contracts**:
   - unified-deployment-workflow.yml → workflow implementation task (T011)
   - job-interfaces.yml → job implementation tasks (T012-T014)
   - Each contract → validation test task [P] (T004-T005)

2. **From Data Model**:
   - Unified Deployment Workflow → workflow creation task (T011)
   - Production APK Build Job → build job task (T012)
   - Terraform Deployment Job → deploy job task (T013)
   - Production Validation Job → validation job task (T014)
   - Job Dependencies → dependency configuration task (T016)
   - Workflow Artifacts → artifact sharing task (T018)
   - Deployment Cancellation → concurrency configuration task (T015)

3. **From Quickstart Scenarios**:
   - Scenario 1 (Basic Workflow) → integration test (T006)
   - Scenario 2 (APK Naming) → integration test (T007)
   - Scenario 3 (Job Dependencies) → integration test (T008)
   - Scenario 4 (Concurrency) → integration test (T009)
   - Scenario 5 (Failure Recovery) → integration test (T010)

4. **Ordering**:
   - Setup → Tests → Unified Workflow → Individual Jobs → Configuration → Integration → Polish
   - Job dependencies require workflow foundation first
   - Integration tests require complete implementation

## Validation Checklist

_GATE: Checked before implementation_

- [x] All contracts have corresponding validation tests (T004-T005)
- [x] All entities have implementation tasks (T011-T016)
- [x] All tests come before implementation (T004-T010 before T011-T017)
- [x] Parallel tasks truly independent (different files/components)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Constitutional principles preserved (local testing, TDD, progressive validation)
- [x] APK naming issue specifically addressed (T007, T012, T014)
- [x] Workflow consolidation properly sequenced (T011 foundation, T012-T014 jobs, T017 cleanup)