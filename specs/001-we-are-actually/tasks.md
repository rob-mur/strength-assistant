# Tasks: Jest Test Suite Repair & Constitutional Enhancement

**Branch**: `001-we-are-actually` | **Generated**: 2025-01-15 | **Source**: [plan.md](./plan.md)
**Input**: Design documents from `/home/rob/Documents/Github/strength-assistant/specs/001-we-are-actually/`
**Prerequisites**: research.md (required), data-model.md, contracts/, quickstart.md

## Critical Objective
**Primary Goal**: Fix all 80 failing Jest tests by implementing missing test infrastructure and enforcing constitutional compliance that prevents future test regressions.

## Execution Strategy
- **Emergency Infrastructure First**: Build missing TestDevice and mock factories to unblock tests
- **Constitutional Enforcement**: Implement governance to ensure `devbox run test` always passes
- **Systematic Repair**: Fix failing tests by category with dependency tracking
- **Parallel Tasks**: Marked with [P] can run simultaneously on different files
- **Quality Gate**: Each phase must achieve its success criteria before proceeding

## Task List

## Phase 1: Emergency Infrastructure Setup

### T001 - Constitutional Amendment for Test Governance
**Status**: pending  
**Estimated Duration**: 45 minutes  
**Priority**: Critical (blocks all commits until tests pass)
**Description**: Create constitutional amendment to enforce test passing requirements
**Path**: `CLAUDE.md` (constitutional requirement section)
**Dependencies**: None
**Acceptance Criteria**:
- Amend constitutional requirements to mandate `devbox run test` passes before any commit
- Define enforcement mechanisms (pre-commit hooks, CI blocking)
- Specify test infrastructure requirements and governance policies
- Document exemption process for emergency situations

### T002 [P] - Core Test Infrastructure Directory Setup
**Status**: pending  
**Estimated Duration**: 15 minutes  
**Description**: Create missing test infrastructure directory structure
**Path**: `lib/test-utils/` directory and subdirectories
**Dependencies**: None
**Acceptance Criteria**:
- Create `lib/test-utils/` directory
- Create subdirectories: `mocks/`, `builders/`, `fixtures/`
- Set up proper TypeScript module exports
- Initialize index.ts files for clean imports

### T003 [P] - TestDevice Core Implementation  
**Status**: pending  
**Estimated Duration**: 2 hours  
**Priority**: Critical (blocking 80 tests)
**Description**: Implement the missing TestDevice class that's blocking 80 tests
**Path**: `lib/test-utils/TestDevice.ts`
**Dependencies**: T002
**Interface**: Based on `contracts/test-infrastructure.ts`
**Acceptance Criteria**:
- Implement complete TestDevice interface with all required methods
- Support device simulation with network status control
- Implement authentication state management (anonymous/authenticated)
- Support exercise CRUD operations with sync status tracking
- Provide real-time subscription management
- Include proper cleanup and initialization methods

### T004 [P] - Mock Factory Collection Implementation
**Status**: pending  
**Estimated Duration**: 1.5 hours  
**Description**: Implement mock factories for exercise, user, sync state, and service mocks
**Path**: `lib/test-utils/mocks/MockFactoryCollection.ts`
**Dependencies**: T002
**Interface**: Based on `contracts/test-infrastructure.ts`
**Acceptance Criteria**:
- Implement ExerciseMockFactory, UserMockFactory, SyncStateMockFactory
- Implement AuthMockFactory and ServiceMockFactory
- Support deterministic test data generation
- Provide fluent API for test data creation
- Include performance test data generation capabilities

### T005 [P] - Test Data Builder Collection
**Status**: pending  
**Estimated Duration**: 1 hour  
**Description**: Implement test data builders for creating complex test scenarios
**Path**: `lib/test-utils/builders/TestDataBuilderCollection.ts`
**Dependencies**: T002
**Interface**: Based on `contracts/test-infrastructure.ts`
**Acceptance Criteria**:
- Implement ScenarioBuilder, ExerciseBuilder, UserBuilder, SyncDataBuilder
- Support fluent API pattern with method chaining
- Provide pre-built scenarios (anonymous, authenticated, multi-device)
- Include scenario validation and execution capabilities

## Phase 2: Jest Configuration and Mock Enhancement

### T006 - Enhanced Jest Configuration
**Status**: pending  
**Estimated Duration**: 45 minutes  
**Description**: Update Jest configuration to support React Native Expo and fix module resolution
**Path**: `jest.config.js`
**Dependencies**: T001-T005
**Acceptance Criteria**:
- Update transformIgnorePatterns to include all required modules (Supabase, Firebase, React Native)
- Configure proper setupFilesAfterEnv with test infrastructure initialization
- Integrate constitutional compliance validation in global setup
- Configure proper TypeScript support and module resolution
- Set coverage thresholds per constitutional requirements

### T007 [P] - Firebase Service Mocks
**Status**: pending  
**Estimated Duration**: 1 hour  
**Description**: Implement comprehensive Firebase service mocks
**Path**: `lib/test-utils/mocks/FirebaseServiceMocks.ts`
**Dependencies**: T004
**Acceptance Criteria**:
- Implement complete Firebase Auth mock with proper interface matching
- Implement Firestore mock with collection/document simulation
- Provide realistic async behavior and error simulation
- Support both authenticated and anonymous user scenarios
- Include proper TypeScript type definitions

### T008 [P] - Supabase Service Mocks
**Status**: pending  
**Estimated Duration**: 1 hour  
**Description**: Implement comprehensive Supabase service mocks
**Path**: `lib/test-utils/mocks/SupabaseServiceMocks.ts`
**Dependencies**: T004
**Requirements**: Fix `this.client.auth.getSession is not a function` errors
**Acceptance Criteria**:
- Implement complete Supabase client mock with proper auth interface
- Fix getSession() method and other missing auth methods
- Implement database mock with proper query simulation
- Support real-time subscription mocking
- Include proper error handling and session management

### T009 [P] - React Native Module Mocks
**Status**: pending  
**Estimated Duration**: 45 minutes  
**Description**: Implement React Native module mocks (AsyncStorage, navigation, etc.)
**Path**: `lib/test-utils/mocks/ReactNativeModuleMocks.ts`
**Dependencies**: T004
**Acceptance Criteria**:
- Implement AsyncStorage mock with persistent storage simulation
- Implement navigation mocks for React Navigation
- Mock other React Native modules used in tests
- Provide realistic async storage behavior
- Support test isolation and cleanup

## Phase 3: Test Infrastructure Integration

### T010 - Test Infrastructure Manager
**Status**: pending  
**Estimated Duration**: 1 hour  
**Description**: Implement the main orchestrator for test infrastructure
**Path**: `lib/test-utils/TestInfrastructureManager.ts`
**Dependencies**: T003, T004, T005
**Interface**: Based on `contracts/test-infrastructure.ts`
**Acceptance Criteria**:
- Implement complete TestInfrastructureManager interface
- Coordinate TestDevice creation and lifecycle management
- Manage mock factory and test data builder provisioning
- Provide infrastructure validation and cleanup capabilities
- Include proper error handling and resource management

### T011 - Test Failure Analysis System
**Status**: pending  
**Estimated Duration**: 1.5 hours  
**Description**: Implement systematic tracking and analysis of test failures
**Path**: `lib/test-utils/TestFailureTracker.ts`
**Dependencies**: T006
**Interface**: Based on `contracts/jest-validation.ts` and `contracts/test-repair.ts`
**Acceptance Criteria**:
- Catalog all 80 failing tests with detailed failure analysis
- Categorize failures (MISSING_INFRASTRUCTURE, MOCK_CONFIGURATION, etc.)
- Track repair status and dependencies between failing tests
- Provide repair strategy recommendations and effort estimation
- Generate repair progress reports and metrics

### T012 - Constitutional Test Validator
**Status**: pending  
**Estimated Duration**: 45 minutes  
**Description**: Implement constitutional compliance validation for test governance
**Path**: `lib/test-utils/ConstitutionalTestValidator.ts`
**Dependencies**: T001, T011
**Interface**: Based on `contracts/jest-validation.ts`
**Acceptance Criteria**:
- Validate test suite compliance with constitutional requirements
- Enforce test passing requirements before commits
- Provide detailed compliance reporting and violation detection
- Integrate with pre-commit hooks and CI/CD pipeline
- Support governance policy enforcement and exemption handling

## Phase 4: Test Repair Execution

### T013 - Fix Missing Infrastructure Tests (Category 1)
**Status**: pending  
**Estimated Duration**: 2 hours  
**Description**: Repair tests failing due to missing TestDevice and related utilities
**Affected Tests**: ~30 tests in integration/, contracts/ directories
**Dependencies**: T003, T010
**Acceptance Criteria**:
- Identify all tests failing due to missing TestDevice import
- Update test imports to use implemented TestDevice
- Validate that tests can instantiate and use TestDevice
- Ensure all TestDevice-dependent tests pass
- Document any additional infrastructure needs discovered

### T014 - Fix Jest Configuration Tests (Category 2)
**Status**: pending  
**Estimated Duration**: 1.5 hours  
**Description**: Repair tests failing due to Jest configuration and module resolution
**Affected Tests**: ~20 tests with module resolution errors
**Dependencies**: T006, T007-T009
**Acceptance Criteria**:
- Fix module resolution errors for Supabase, Firebase, React Native imports
- Update transformIgnorePatterns to handle all required dependencies
- Validate that all previously failing imports now resolve correctly
- Ensure test environment properly simulates React Native Expo environment
- Confirm all module resolution tests pass

### T015 - Fix Mock Implementation Tests (Category 3)
**Status**: pending  
**Estimated Duration**: 1.5 hours  
**Description**: Repair tests failing due to incomplete or incorrect mock implementations
**Affected Tests**: ~15 tests with mock-related failures
**Dependencies**: T007-T009
**Acceptance Criteria**:
- Fix Supabase auth.getSession() method implementation
- Complete Firebase and React Native mock implementations
- Validate mock behavior matches real service interfaces
- Ensure all mock-dependent tests pass with realistic behavior
- Update mock configurations based on actual test requirements

### T016 - Fix TypeScript Compilation Tests (Category 4)
**Status**: pending  
**Estimated Duration**: 1 hour  
**Description**: Repair tests failing due to TypeScript compilation errors
**Affected Tests**: ~10 tests with type safety issues
**Dependencies**: T012
**Acceptance Criteria**:
- Fix TypeScript compilation errors in test files
- Update type definitions for mock objects and test utilities
- Ensure strict TypeScript compliance across all test files
- Validate constitutional TypeScript requirements are met
- Confirm all TypeScript-related test failures are resolved

### T017 - Fix Constitutional Framework Tests (Category 5)
**Status**: pending  
**Estimated Duration**: 45 minutes  
**Description**: Repair tests failing due to constitutional testing framework requirements
**Affected Tests**: ~5 tests related to constitutional compliance
**Dependencies**: T001, T012
**Acceptance Criteria**:
- Implement constitutional testing framework integration
- Fix tests that validate constitutional compliance
- Ensure governance enforcement mechanisms work correctly
- Validate constitutional amendment functionality
- Confirm constitutional framework tests pass

## Phase 5: Validation and Governance

### T018 - Complete Test Suite Validation (CRITICAL GATE)
**Status**: pending  
**Estimated Duration**: 45 minutes  
**Description**: Validate that all 80 tests now pass consistently
**Path**: Validation across all test files
**Dependencies**: T013-T017
**Success Criteria**: `devbox run test` passes 100%
**Acceptance Criteria**:
- Execute full test suite and achieve 100% pass rate
- Validate test consistency across multiple runs
- Confirm no flaky or intermittent test failures
- Document any remaining issues or edge cases
- **MANDATORY**: Feature cannot complete until this passes

### T019 - Pre-commit Hook Implementation
**Status**: pending  
**Estimated Duration**: 30 minutes  
**Description**: Implement pre-commit hooks to prevent test regressions
**Path**: `.husky/pre-commit`, scripts/
**Dependencies**: T001, T018
**Acceptance Criteria**:
- Install and configure Husky pre-commit hooks
- Create pre-commit script that runs `devbox run test`
- Block commits when tests fail with clear error messaging
- Provide instructions for developers on fixing test failures
- Test pre-commit hook functionality with failing test scenario

### T020 - CI/CD Pipeline Integration
**Status**: pending  
**Estimated Duration**: 30 minutes  
**Description**: Configure CI/CD pipeline to enforce constitutional test requirements
**Path**: `.github/workflows/` or equivalent CI configuration
**Dependencies**: T019
**Acceptance Criteria**:
- Update CI pipeline to run `devbox run test` as mandatory step
- Block deployments and merges when tests fail
- Provide detailed test failure reporting in CI
- Configure proper test environment for CI execution
- Validate CI integration with test infrastructure

## Phase 6: Monitoring and Documentation

### T021 [P] - Test Infrastructure Documentation
**Status**: pending  
**Estimated Duration**: 45 minutes  
**Description**: Document the implemented test infrastructure and usage patterns
**Path**: `docs/testing-infrastructure.md`
**Dependencies**: T003-T005, T010
**Acceptance Criteria**:
- Document TestDevice usage patterns and API
- Provide examples of mock factory usage
- Document test data builder patterns
- Include troubleshooting guide for common test issues
- Create developer onboarding guide for test infrastructure

### T022 [P] - Constitutional Test Governance Documentation
**Status**: pending  
**Estimated Duration**: 30 minutes  
**Description**: Document the constitutional amendments and governance procedures
**Path**: `docs/constitutional-test-governance.md`
**Dependencies**: T001, T012
**Acceptance Criteria**:
- Document constitutional test requirements and rationale
- Explain enforcement mechanisms and compliance procedures
- Provide guidance on exemption process and emergency procedures
- Document governance framework and amendment process
- Include examples of constitutional compliance validation

### T023 [P] - Test Repair Runbook
**Status**: pending  
**Estimated Duration**: 30 minutes  
**Description**: Create operational runbook for systematic test repair
**Path**: `docs/test-repair-runbook.md`
**Dependencies**: T011
**Acceptance Criteria**:
- Document test failure analysis and categorization process
- Provide step-by-step repair procedures for each failure category
- Include troubleshooting guide for common test issues
- Document repair tracking and progress monitoring procedures
- Create template for future test failure analysis

## Dependencies and Execution Order

### Phase Dependencies
- **Phase 1 (T001-T005)** must complete before Phase 2 - Core infrastructure blocks everything
- **Phase 2 (T006-T009)** must complete before Phase 3 - Configuration and mocks needed for integration
- **T011** blocks T013-T017 - Need failure analysis before systematic repair
- **T018** blocks T019-T020 - Tests must pass before governance implementation
- **All implementation phases** must complete before Phase 6 documentation

### Critical Path
**T001 → T002 → T003 → T006 → T011 → T013 → T018 → T019**
This represents the minimum viable sequence to achieve constitutional compliance with passing tests.

### Parallel Execution Examples

#### Phase 1 Infrastructure (T002-T005)
```bash
# Can run in parallel - different files:
Task: "Core Test Infrastructure Directory Setup in lib/test-utils/"
Task: "TestDevice Core Implementation in lib/test-utils/TestDevice.ts"  
Task: "Mock Factory Collection in lib/test-utils/mocks/MockFactoryCollection.ts"
Task: "Test Data Builder Collection in lib/test-utils/builders/TestDataBuilderCollection.ts"
```

#### Phase 2 Mock Services (T007-T009)
```bash
# Can run in parallel - different mock files:
Task: "Firebase Service Mocks in lib/test-utils/mocks/FirebaseServiceMocks.ts"
Task: "Supabase Service Mocks in lib/test-utils/mocks/SupabaseServiceMocks.ts"
Task: "React Native Module Mocks in lib/test-utils/mocks/ReactNativeModuleMocks.ts"
```

#### Phase 6 Documentation (T021-T023)
```bash
# Can run in parallel - different documentation files:
Task: "Test Infrastructure Documentation in docs/testing-infrastructure.md"
Task: "Constitutional Test Governance Documentation in docs/constitutional-test-governance.md"
Task: "Test Repair Runbook in docs/test-repair-runbook.md"
```

## Quality Gates

### Constitutional Compliance Gate (All Phases)
- All implementations must align with constitutional test requirements
- `devbox run test` must pass before any commit can be made
- Pre-commit hooks must block failing test commits
- CI/CD pipeline must enforce test passing requirements

### Test Infrastructure Gate (Phase 1-3)
- TestDevice implementation must be complete and functional before test repairs
- Mock services must fully implement expected interfaces
- All test infrastructure must support both local and CI environments
- TypeScript compilation must succeed for all infrastructure components

### Test Repair Gate (Phase 4)
- Each category of test failures must be systematically addressed
- Repair validation must confirm tests pass consistently
- No test repair is complete until affected tests pass multiple runs
- **CRITICAL**: T018 must achieve 100% test pass rate (80/80 tests)

### Governance Implementation Gate (Phase 5)
- Pre-commit hooks must successfully block commits with failing tests
- CI/CD integration must enforce test requirements
- Constitutional compliance validation must be automated and functional

## Success Metrics

### Primary Success Criteria
- **`devbox run test` passes 100%** (80/80 tests passing)
- **Constitutional compliance enforced** (pre-commit hooks active)
- **CI/CD integration functional** (pipeline blocks on test failures)
- **Test infrastructure documented** (developer onboarding ready)

### Performance Requirements
- Test suite execution time < 5 minutes (acceptable for CI)
- Pre-commit validation < 30 seconds (acceptable for developer workflow)
- Infrastructure setup/teardown < 10 seconds per test
- Mock services response time < 100ms (realistic simulation)

### Maintenance Requirements
- Test failure analysis system operational
- Regression prevention monitoring active
- Documentation up-to-date and comprehensive
- Constitutional governance framework enforced

## Risk Mitigation

### High-Risk Dependencies
- **T003 (TestDevice)**: Critical path bottleneck - allocate senior developer
- **T006 (Jest Config)**: Complex configuration - validate thoroughly before proceeding
- **T018 (Test Validation)**: Final gate - must have contingency plan for partial failures

### Rollback Strategy
- **Configuration Changes**: Backup existing jest.config.js before modifications
- **Constitutional Changes**: Document current requirements before amendments
- **Infrastructure Changes**: Maintain ability to disable new infrastructure if needed

## Validation Checklist

*GATE: Must be verified before feature completion*

- [ ] All 80 tests pass consistently (`devbox run test`)
- [ ] Pre-commit hooks prevent failing test commits
- [ ] CI/CD pipeline blocks deployments on test failures
- [ ] TestDevice and mock infrastructure fully functional
- [ ] Constitutional test requirements documented and enforced
- [ ] Test failure analysis system operational
- [ ] Developer documentation complete and accurate
- [ ] Performance requirements met across all environments

## Notes

- **Constitutional Requirement**: All tests MUST pass before any commits
- **Infrastructure First**: Core test infrastructure blocks all test repairs
- **Systematic Approach**: Fix tests by failure category for maximum efficiency
- **Parallel Execution**: Marked [P] tasks can run concurrently for faster completion
- **Quality Gates**: Each phase has specific success criteria that must be met
- **Final Validation**: T018 is the mandatory gate - feature cannot complete until all tests pass

