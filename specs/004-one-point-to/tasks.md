# Tasks: Production Server Testing Enhancement

**Input**: Design documents from `/specs/004-one-point-to/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript/JavaScript with React Native/Expo, Maestro, GitHub Actions
   → Libraries: Maestro (test automation), existing CI/CD pipeline
   → Structure: CI/CD pipeline enhancement (no new app structure)
2. Load design documents:
   → data-model.md: GitHub Actions job metadata, Maestro flow results (no new models needed)
   → contracts/: github-actions-workflow.yml, maestro-execution.md, alert-integration.md
   → research.md: APK-based approach, post-infrastructure timing, manual intervention
   → quickstart.md: 5-minute setup, test scenarios, validation checklist
3. Generate tasks by category:
   → Setup: GitHub Actions workflow, environment variables, script modifications
   → Tests: Workflow validation, Maestro flow integration testing
   → Core: No complex core implementation needed - leverage existing infrastructure
   → Integration: APK build configuration, cleanup script modification, alerting
   → Polish: Documentation updates, troubleshooting guides
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Configuration before testing
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **GitHub Actions**: `.github/workflows/` for workflow files
- **Scripts**: `scripts/` for shell scripts and utilities
- **React Native/Expo**: Existing project structure, no modifications needed
- Paths follow existing React Native/Expo project structure from CLAUDE.md

## Phase 3.1: Setup
- [ ] T001 [P] Create GitHub Actions production validation workflow in .github/workflows/production-validation.yml
- [ ] T002 [P] Create script to modify cleanup behavior in scripts/production-test-setup.sh
- [ ] T003 [P] Configure environment variables for production validation context

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST validate workflow behavior before implementation**
- [ ] T004 [P] Create workflow validation test to verify production-validation.yml syntax and structure
- [ ] T005 [P] Create script test to verify SKIP_DATA_CLEANUP environment variable handling in scripts/test-cleanup-script.sh
- [ ] T006 [P] Create integration test for APK build with production configuration in scripts/test-production-apk-build.sh
- [ ] T007 [P] Create validation test for Maestro flow execution with production settings in scripts/test-maestro-production.sh

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T008 [P] Implement GitHub Actions workflow with APK build, Maestro execution, and alerting in .github/workflows/production-validation.yml
- [ ] T009 [P] Implement production test setup script with SKIP_DATA_CLEANUP handling in scripts/production-test-setup.sh
- [ ] T010 [P] Modify existing cleanup scripts to respect SKIP_DATA_CLEANUP environment variable
- [ ] T011 Configure production APK build process to use actual production endpoints and certificates
- [ ] T012 Implement alert notification system for production validation failures

## Phase 3.4: Integration
- [ ] T013 Integrate production validation workflow trigger with terraform deployment completion
- [ ] T014 Configure GitHub Actions secrets and environment variables for production access
- [ ] T015 Set up artifact collection for Maestro screenshots and execution logs
- [ ] T016 Implement frontend deployment blocking mechanism based on production validation results

## Phase 3.5: Polish
- [ ] T017 [P] Create troubleshooting documentation for common production validation issues in docs/production-validation-troubleshooting.md
- [ ] T018 [P] Update CLAUDE.md with production validation commands and workflow information
- [ ] T019 [P] Create manual testing checklist based on quickstart scenarios in docs/production-validation-manual-test.md
- [ ] T020 Performance validation: ensure production tests complete within reasonable timeframes
- [ ] T021 Create rollback procedures documentation for production validation failures

## Dependencies
- Setup (T001-T003) before tests (T004-T007)
- Tests (T004-T007) before implementation (T008-T012)
- T008 (workflow) blocks T013, T015, T016
- T010 (cleanup scripts) requires T009 (setup script) for testing
- Implementation (T008-T012) before integration (T013-T016)
- Integration complete before polish (T017-T021)

## Parallel Example
```
# Launch T001-T003 together (setup):
Task: "Create GitHub Actions production validation workflow in .github/workflows/production-validation.yml"
Task: "Create script to modify cleanup behavior in scripts/production-test-setup.sh"
Task: "Configure environment variables for production validation context"

# Launch T004-T007 together (tests):
Task: "Create workflow validation test to verify production-validation.yml syntax and structure"
Task: "Create script test to verify SKIP_DATA_CLEANUP environment variable handling in scripts/test-cleanup-script.sh"
Task: "Create integration test for APK build with production configuration in scripts/test-production-apk-build.sh"
Task: "Create validation test for Maestro flow execution with production settings in scripts/test-maestro-production.sh"

# Launch T008-T010 together (core implementation):
Task: "Implement GitHub Actions workflow with APK build, Maestro execution, and alerting in .github/workflows/production-validation.yml"
Task: "Implement production test setup script with SKIP_DATA_CLEANUP handling in scripts/production-test-setup.sh"
Task: "Modify existing cleanup scripts to respect SKIP_DATA_CLEANUP environment variable"

# Launch T017-T019 together (documentation):
Task: "Create troubleshooting documentation for common production validation issues in docs/production-validation-troubleshooting.md"
Task: "Update CLAUDE.md with production validation commands and workflow information"
Task: "Create manual testing checklist based on quickstart scenarios in docs/production-validation-manual-test.md"
```

## Notes
- [P] tasks = different files, no dependencies
- Focus on configuration and integration, not complex service development
- Leverages existing Maestro flows without modification
- Uses GitHub Actions native features for job management
- SKIP_DATA_CLEANUP environment variable is key modification
- No new data models or services required
- Manual intervention pattern for production failures

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - github-actions-workflow.yml → GitHub Actions workflow implementation (T008)
   - maestro-execution.md → Maestro flow integration and testing (T007, T011)
   - alert-integration.md → Alert system implementation (T012, T016)
   
2. **From Data Model**:
   - No complex data models needed - uses GitHub Actions native job metadata
   - Environment configuration → script and variable setup (T002, T003, T009)
   
3. **From Research Decisions**:
   - APK-based approach → APK build configuration (T011)
   - Post-infrastructure timing → terraform integration (T013)
   - Manual intervention → alerting and blocking (T012, T016)
   
4. **From Quickstart Scenarios**:
   - 5-minute setup → workflow and script creation (T001, T002)
   - Test scenarios → validation tests (T004-T007)
   - Troubleshooting → documentation (T017, T019)

5. **Ordering**:
   - Setup → Tests → Implementation → Integration → Polish
   - Configuration before validation
   - Workflow setup before integration with terraform
   - Documentation last

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding implementation tasks (T008, T011, T012)
- [x] No complex data models required (GitHub Actions handles job metadata)
- [x] All tests come before implementation (T004-T007 before T008-T012)
- [x] Parallel tasks truly independent (different files, no shared dependencies)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] APK-based approach properly reflected in tasks
- [x] Maestro flow reuse strategy implemented
- [x] Manual intervention and alerting covered