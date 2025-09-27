# Tasks: Correct Production Validation Workflow

**Input**: Design documents from `/specs/007-correct-production-validation/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Extract: YAML 1.2 (GitHub Actions), existing workflow infrastructure
   → Structure: CI/CD infrastructure (single project scope)
2. Load design documents:
   → data-model.md: WorkflowTrigger, ProductionValidationWorkflow entities
   → contracts/: production-validation-fixed.yml (target workflow structure)
   → research.md: Remove non-existent dependencies, add Build Production APK trigger
3. Generate tasks by category:
   → Setup: workflow backup, validation
   → Tests: workflow structure verification
   → Core: update workflow triggers, remove bad dependencies
   → Integration: test workflow execution
   → Polish: verification, cleanup
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same workflow file = sequential (no [P])
   → Validation before modification
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → Workflow validated before changes?
   → Bad dependencies removed?
   → Contract workflow matches target?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **CI/CD workflows**: `.github/workflows/` at repository root
- **Workflow files**: YAML files in workflows directory
- Target files: `.github/workflows/production-validation.yml`, `.github/workflows/test-production-validation.yml`

## Phase 3.1: Setup & Validation

- [x] T001 [P] Backup current production validation workflow for rollback capability
- [x] T002 [P] Verify current workflow structure and identify non-existent dependencies
- [x] T003 [P] Validate contract workflow syntax (production-validation-fixed.yml)
- [x] T004 Check GitHub Actions workflow permissions and access

## Phase 3.2: Current State Analysis

- [x] T005 [P] Analyze current production-validation.yml for "Infrastructure Deploy" references
- [x] T006 [P] Identify current workflow_run triggers and missing dependencies
- [x] T007 [P] Document current workflow execution path and failure points
- [x] T008 Verify EXPO_TOKEN and other required environment variables

## Phase 3.3: Core Implementation

- [x] T009 Update workflow_run triggers in .github/workflows/production-validation.yml to include "Build Production APK"
- [x] T010 Remove "Infrastructure Deploy" dependency from .github/workflows/production-validation.yml
- [x] T011 Verify production validation workflow matches contract structure
- [x] T012 Remove obsolete debug workflow .github/workflows/test-production-validation.yml

## Phase 3.4: Integration Testing

- [x] T013 [P] Test workflow syntax validation locally using GitHub CLI
- [x] T014 [P] Verify workflow structure matches contract (production-validation-fixed.yml)
- [x] T015 Create test scenario for APK build triggering validation
- [x] T016 Create test scenario for terraform deployment triggering validation

## Phase 3.5: Validation & Verification

- [x] T017 [P] Execute quickstart Test Scenario 1: APK Build Triggers Production Validation
- [x] T018 [P] Execute quickstart Test Scenario 2: Terraform Deployment Triggers Production Validation
- [x] T019 [P] Execute quickstart Test Scenario 3: Manual Production Validation Trigger
- [x] T020 [P] Execute quickstart Test Scenario 4: Workflow Structure Verification
- [x] T021 [P] Execute quickstart Test Scenario 5: Error Handling Verification
- [x] T022 Verify production validation completes successfully without non-existent dependency errors

## Phase 3.6: Polish & Documentation

- [x] T023 [P] Update documentation with workflow changes
- [x] T024 [P] Document rollback procedure if issues arise
- [x] T025 [P] Verify no "Infrastructure Deploy" references remain in any workflow
- [x] T026 Confirm production validation workflow triggers correctly from both APK builds and terraform deployments
- [x] T027 Final verification that workflow failures due to non-existent dependencies are resolved

## Dependencies

- Setup and validation (T001-T004) before analysis (T005-T008)
- Analysis (T005-T008) before implementation (T009-T012)
- Implementation (T009-T012) before testing (T013-T016)
- Testing (T013-T016) before validation (T017-T022)
- Validation before polish (T023-T027)
- T009 blocks T010, T011, T012
- T010 blocks T015, T016, T022
- T009-T012 block all testing and validation tasks

## Parallel Example

```
# Launch T001-T003 together (different activities, no conflicts):
Task: "Backup current production validation workflow for rollback capability"
Task: "Verify current workflow structure and identify non-existent dependencies"
Task: "Validate contract workflow syntax (production-validation-fixed.yml)"

# Launch T005-T007 together (analysis tasks, read-only):
Task: "Analyze current production-validation.yml for Infrastructure Deploy references"
Task: "Identify current workflow_run triggers and missing dependencies"
Task: "Document current workflow execution path and failure points"

# Launch T017-T021 together (independent test scenarios):
Task: "Execute quickstart Test Scenario 1: APK Build Triggers Production Validation"
Task: "Execute quickstart Test Scenario 2: Terraform Deployment Triggers Production Validation"
Task: "Execute quickstart Test Scenario 3: Manual Production Validation Trigger"
Task: "Execute quickstart Test Scenario 4: Workflow Structure Verification"
Task: "Execute quickstart Test Scenario 5: Error Handling Verification"
```

## Notes

- [P] tasks = different files or independent activities, no dependencies
- Workflow modification tasks must run sequentially (T009-T012)
- Test locally using GitHub CLI before pushing workflow changes
- Keep backup of original workflow for rollback
- Focus on correcting triggers and removing non-existent dependencies

## Task Generation Rules

_Applied during main() execution_

1. **From Contracts**:
   - production-validation-fixed.yml → workflow syntax validation task T003, structure verification T014
2. **From Data Model**:
   - WorkflowTrigger → workflow trigger modification tasks T009-T010
   - ProductionValidationWorkflow → workflow structure verification T011
3. **From Quickstart Scenarios**:
   - Test Scenario 1 → T017 APK build trigger test
   - Test Scenario 2 → T018 terraform deployment trigger test
   - Test Scenario 3 → T019 manual trigger test
   - Test Scenario 4 → T020 workflow structure verification
   - Test Scenario 5 → T021 error handling verification

4. **Ordering**:
   - Setup → Analysis → Implementation → Testing → Validation → Polish
   - Workflow file modifications must be sequential
   - Testing and validation can be parallel where scenarios are independent

## Validation Checklist

_GATE: Checked by main() before returning_

- [x] All contracts have corresponding validation tasks (T003, T014)
- [x] All entities have implementation tasks (T009-T012, T022)
- [x] All validation comes before implementation (T001-T008 before T009-T012)
- [x] Parallel tasks truly independent (different scenarios or read-only analysis)
- [x] Each task specifies exact file path (.github/workflows/production-validation.yml)
- [x] No task modifies same file as another [P] task
- [x] All quickstart scenarios have corresponding test tasks (T017-T021)
