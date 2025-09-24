# Tasks: Production Server Testing Enhancement

**Input**: Design documents from `/specs/004-one-point-to/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Extract: GitHub Actions, devbox, Maestro, production validation workflow
2. Load optional design documents:
   → contracts/: Android build action, Maestro test action, production workflow
   → quickstart.md: Setup and validation scenarios
3. Generate tasks by category:
   → Setup: GitHub Actions structure, devbox integration
   → Tests: Action validation, workflow testing
   → Core: Parameterized actions implementation
   → Integration: Workflow orchestration, existing workflow updates
   → Polish: Local testing, cleanup, documentation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Mobile project**: GitHub Actions in `.github/`, workflows, composite actions
- This project uses devbox configurations in `devbox/` directories
- All paths relative to repository root

## Phase 3.1: Setup

- [ ] T001 [P] Create GitHub Actions android-build composite action directory structure `.github/actions/android-build/`
- [ ] T002 [P] Create GitHub Actions maestro-test composite action directory structure `.github/actions/maestro-test/`
- [ ] T003 Verify existing devbox configurations in `devbox/android-build/` and `devbox/android-testing/`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [ ] T004 [P] Test android-build action locally using `devbox run build_preview` and `devbox run build_production` in `devbox/android-build/`
- [ ] T005 [P] Test maestro-test action locally using `devbox run integration_test_android` in `devbox/android-testing/`
- [ ] T006 [P] Create workflow test for production validation workflow in `.github/workflows/test-production-validation.yml`
- [ ] T007 Validate existing integration tests still work with SKIP_DATA_CLEANUP=true environment variable

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [ ] T008 [P] Implement Android Build composite action in `.github/actions/android-build/action.yml`
- [ ] T009 [P] Implement Maestro Test composite action in `.github/actions/maestro-test/action.yml`  
- [ ] T010 Create production validation workflow in `.github/workflows/production-validation.yml`
- [ ] T011 Update existing integration test workflow to use new parameterized android-build action
- [ ] T012 Update existing integration test workflow to use new parameterized maestro-test action

## Phase 3.4: Integration

- [ ] T013 Update production build workflow in `.github/workflows/build-production.yml` to run after all tests pass
- [ ] T014 Configure production validation workflow triggers after terraform deployment
- [ ] T015 Ensure production validation workflow fails properly (GitHub will automatically send email notifications on job failure)
- [ ] T016 Remove example deployment gate workflow per user feedback
- [ ] T017 Remove frontend deployment example workflow per user feedback

## Phase 3.5: Polish

- [ ] T018 [P] Test all parameterized actions locally using devbox before CI validation
- [ ] T019 [P] Create integration test scenario validating parameterized actions work for both integration and production modes
- [ ] T020 [P] Update documentation in `README.md` or relevant docs about new parameterized actions
- [ ] T021 Verify production APK reuse pattern works (build once, test multiple times)
- [ ] T023 Run quickstart validation scenarios from `quickstart.md`

## Dependencies

- Setup (T001-T003) before tests (T004-T007)
- Tests (T004-T007) before implementation (T008-T012)
- T008 blocks T011 (android-build action needed for integration workflow update)
- T009 blocks T012 (maestro-test action needed for integration workflow update)
- T008, T009 block T010 (production workflow needs both actions)
- Implementation (T008-T012) before integration (T013-T017)
- Integration before polish (T018-T021, T023)
- Local testing (T018) before CI submission

## Parallel Example

```
# Launch T001-T002 together:
Task: "Create GitHub Actions android-build composite action directory structure `.github/actions/android-build/`"
Task: "Create GitHub Actions maestro-test composite action directory structure `.github/actions/maestro-test/`"

# Launch T004-T006 together:
Task: "Test android-build action locally using `devbox run build_preview` and `devbox run build_production` in `devbox/android-build/`"
Task: "Test maestro-test action locally using `devbox run integration_test_android` in `devbox/android-testing/`"
Task: "Create workflow test for production validation workflow in `.github/workflows/test-production-validation.yml`"

# Launch T008-T009 together:
Task: "Implement Android Build composite action in `.github/actions/android-build/action.yml`"
Task: "Implement Maestro Test composite action in `.github/actions/maestro-test/action.yml`"
```

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Test locally using devbox before pushing to CI
- All actions must use devbox for consistent dependency management
- Commit after each task
- Avoid: vague tasks, same file conflicts

## Task Generation Rules

_Applied during main() execution_

1. **From Contracts**:
   - android-build-action.yml → T008 implementation task
   - maestro-test-action.yml → T009 implementation task  
   - github-actions-workflow.yml → T010 production workflow task
2. **From Existing Infrastructure**:
   - Update integration workflows → T011, T012 integration tasks
   - Production build workflow → T013 orchestration task
3. **From User Feedback**:
   - Remove unnecessary examples → T016, T017 cleanup tasks
   - Local testing mandate → T004, T005, T018 local validation tasks

## Ordering

- Setup → Tests → Implementation → Integration → Polish
- Parameterized actions before workflows that use them
- Local testing before CI submission (constitutional requirement)

## Validation Checklist

_GATE: Checked by main() before returning_

- [x] All contracts have corresponding implementation tasks
- [x] All local testing tasks include devbox usage
- [x] All tests come before implementation
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Local testing tasks included per constitutional requirement