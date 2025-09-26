# Tasks: Remove Invalid Validation Step from Production Build

**Input**: Design documents from `/specs/006-fix-ci-issue/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Extract: YAML 1.2 (GitHub Actions), existing workflow infrastructure
   → Structure: CI/CD infrastructure (single project scope)
2. Load design documents:
   → data-model.md: ProductionBuildWorkflow, WorkflowJob, GitHubRelease entities
   → contracts/: production-build-fixed.yml (target workflow structure)
   → research.md: Remove validate-main job and dependency strategy
3. Generate tasks by category:
   → Setup: workflow backup, validation
   → Tests: workflow structure verification
   → Core: remove validate-main job, update build job
   → Integration: test workflow execution
   → Polish: verification, documentation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same workflow file = sequential (no [P])
   → Validation before modification
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → Workflow validated before changes?
   → Invalid validation job removed?
   → Build job dependency updated?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **CI/CD workflows**: `.github/workflows/` at repository root
- **Workflow files**: YAML files in workflows directory
- Target file: `.github/workflows/build-production.yml`

## Phase 3.1: Setup & Validation

- [x] T001 [P] Backup current production build workflow for rollback capability
- [x] T002 [P] Verify current workflow structure and identify validate-main job
- [x] T003 [P] Validate contract workflow syntax (production-build-fixed.yml)
- [x] T004 Check GitHub Actions workflow permissions and access

## Phase 3.2: Current State Analysis

- [x] T005 [P] Analyze current build-production.yml for validate-main job definition
- [x] T006 [P] Identify build job dependency on validate-main
- [x] T007 [P] Document current workflow execution path and failure points
- [x] T008 Verify EXPO_TOKEN and other required environment variables

## Phase 3.3: Core Implementation

- [ ] T009 Remove validate-main job from .github/workflows/build-production.yml
- [ ] T010 Remove "needs: validate-main" dependency from build job in .github/workflows/build-production.yml
- [ ] T011 Verify build job runs directly without validation gate
- [ ] T012 Ensure all required environment variables and permissions are preserved

## Phase 3.4: Integration Testing

- [ ] T013 [P] Test workflow syntax validation locally using GitHub CLI
- [ ] T014 [P] Verify workflow structure matches contract (production-build-fixed.yml)
- [ ] T015 Create test scenario for automatic production build trigger
- [ ] T016 Test manual production build trigger via workflow_dispatch

## Phase 3.5: Validation & Verification

- [ ] T017 [P] Execute quickstart Test Scenario 1: Automatic Production Build Trigger
- [ ] T018 [P] Execute quickstart Test Scenario 2: Manual Production Build Trigger
- [ ] T019 [P] Execute quickstart Test Scenario 3: Workflow Structure Verification
- [ ] T020 [P] Execute quickstart Test Scenario 4: Error Resolution Verification
- [ ] T021 Verify production build completes successfully without validation errors
- [ ] T022 Confirm GitHub release creation with APK attachment works correctly

## Phase 3.6: Polish & Documentation

- [ ] T023 [P] Update documentation with workflow changes
- [ ] T024 [P] Document rollback procedure if issues arise
- [ ] T025 [P] Verify no validate-main references remain in workflow
- [ ] T026 Confirm production build workflow matches original simple structure
- [ ] T027 Final verification that build failures due to typecheck command are resolved

## Dependencies

- Setup and validation (T001-T004) before analysis (T005-T008)
- Analysis (T005-T008) before implementation (T009-T012)
- Implementation (T009-T012) before testing (T013-T016)
- Testing (T013-T016) before validation (T017-T022)
- Validation before polish (T023-T027)
- T009 blocks T010, T011, T012
- T010 blocks T015, T016, T021
- T009-T012 block all testing and validation tasks

## Parallel Example

```
# Launch T001-T003 together (different activities, no conflicts):
Task: "Backup current production build workflow for rollback capability"
Task: "Verify current workflow structure and identify validate-main job"
Task: "Validate contract workflow syntax (production-build-fixed.yml)"

# Launch T005-T007 together (analysis tasks, read-only):
Task: "Analyze current build-production.yml for validate-main job definition"
Task: "Identify build job dependency on validate-main"
Task: "Document current workflow execution path and failure points"

# Launch T017-T020 together (independent test scenarios):
Task: "Execute quickstart Test Scenario 1: Automatic Production Build Trigger"
Task: "Execute quickstart Test Scenario 2: Manual Production Build Trigger"
Task: "Execute quickstart Test Scenario 3: Workflow Structure Verification"
Task: "Execute quickstart Test Scenario 4: Error Resolution Verification"
```

## Notes

- [P] tasks = different files or independent activities, no dependencies
- Workflow modification tasks must run sequentially (T009-T012)
- Test locally using GitHub CLI before pushing workflow changes
- Keep backup of original workflow for rollback
- Focus on removing unwanted validation, not adding functionality

## Task Generation Rules

_Applied during main() execution_

1. **From Contracts**:
   - production-build-fixed.yml → workflow syntax validation task T003, structure verification T014
2. **From Data Model**:
   - ProductionBuildWorkflow → workflow modification tasks T009-T012
   - WorkflowJob → job dependency update T010
   - GitHubRelease → release verification T022
3. **From Quickstart Scenarios**:
   - Test Scenario 1 → T017 automatic build trigger test
   - Test Scenario 2 → T018 manual build trigger test
   - Test Scenario 3 → T019 workflow structure verification
   - Test Scenario 4 → T020 error resolution verification

4. **Ordering**:
   - Setup → Analysis → Implementation → Testing → Validation → Polish
   - Workflow file modifications must be sequential
   - Testing and validation can be parallel where scenarios are independent

## Validation Checklist

_GATE: Checked by main() before returning_

- [x] All contracts have corresponding validation tasks (T003, T014)
- [x] All entities have implementation tasks (T009-T012, T021-T022)
- [x] All validation comes before implementation (T001-T008 before T009-T012)
- [x] Parallel tasks truly independent (different scenarios or read-only analysis)
- [x] Each task specifies exact file path (.github/workflows/build-production.yml)
- [x] No task modifies same file as another [P] task
- [x] All quickstart scenarios have corresponding test tasks (T017-T020)
