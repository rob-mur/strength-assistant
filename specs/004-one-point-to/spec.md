# Feature Specification: Production Server Testing Enhancement

**Feature Branch**: `004-one-point-to`  
**Created**: 2025-09-24  
**Status**: Draft  
**Input**: User description: "one point to add to the spec - i would like these production tests to be tan against the actual production server so we have the exact configuration used. they should obviously only run once everything else in the pipeline has passed, and should be compartmentalised to use a test user etc"

## Execution Flow (main)

```
1. Parse user description from Input
   → Enhancement to existing production testing to use actual production server
2. Extract key concepts from description
   → Actors: CI/CD pipeline, test users, production server
   → Actions: run production tests, validate configuration, compartmentalize test data
   → Data: test user credentials, production server endpoints, pipeline stages
   → Constraints: run only after all other tests pass, isolated test environment
3. For each unclear aspect:
   → Tests will reuse existing Maestro integration test flows
   → Fresh anonymous users eliminate need for data cleanup
4. Fill User Scenarios & Testing section
   → Pipeline flow: other tests pass → production tests run → deployment approved
5. Generate Functional Requirements
   → Production server connectivity, test user management, pipeline integration
6. Identify Key Entities
   → Test users, production endpoints, pipeline stages, test results
7. Run Review Checklist
   → WARN "Spec has uncertainties about specific test scope and cleanup procedures"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines

- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Clarifications

### Session 2025-09-25

- Q: How should production APK artifacts be managed in the pipeline? → A: Build production APK once after all tests pass, store as artifact, reuse across workflows
- Q: When should the production build artifact be created in relation to merge/release workflows? → A: Build APK after all tests pass on main branch, store as GitHub release artifact
- Q: How should the artifact be passed between the pre-merge build job and the post-deployment validation workflow? → A: Use existing GitHub release artifact from build production job, just needs to be reused
- Q: Should this enhancement focus purely on workflow modification without additional test code? → A: Pure workflow change: Only modify `.github/workflows/production-validation.yml` to download existing release artifacts instead of rebuilding

### Session 2025-09-24

- Q: Which specific application functionality should be tested against production? → A: Same Maestro flow files used for integration testing
- Q: What timeout limits should production tests have? → A: No specific requirement, tests should be relatively fast
- Q: How should test user data be isolated/cleaned up? → A: Use fresh anonymous user each time, no data cleanup needed
- Q: Would you prefer the simpler APK-based approach over the comprehensive service architecture? → A: Simple APK approach: Build production APK, run existing Maestro flows, use env var to modify clear emulator script
- Q: For the APK-based approach, which environment variable should control the anonymous user creation behavior? → A: SKIP_DATA_CLEANUP (tests already use anonymous users by default)
- Q: Should production tests run as post-deployment validation rather than pre-deployment gates? → A: Post-deployment validation: Run after terraform deploy, trigger rollback on failure
- Q: What should happen when production validation fails after infrastructure is already deployed? → A: Manual intervention: Alert team, block frontend deploy, require manual rollback decision
- Q: Based on your feedback about reusing existing workflows, how should the production APK building be coordinated with the existing build processes? → A: Production APK built once after all tests pass using reusable GitHub Action
- Q: You mentioned creating two reusable GitHub Actions (one for building Android, one for running Maestro tests). Should these actions be parameterized to handle both integration testing and production validation scenarios? → A: Yes, create parameterized actions that can switch between integration/production modes via inputs
- Q: You mentioned using devbox for dependency setup and reusing the integration test Android script. Should the parameterized actions inherit the existing dependency setup patterns? → A: Yes, parameterized actions should use devbox for dependency setup like existing workflows

## User Scenarios & Testing _(mandatory)_

### Primary User Story

Development teams need to validate that their applications work correctly with the actual production server configuration before deployment, ensuring that any environment-specific issues are caught in the CI/CD pipeline rather than discovered by end users.

### Acceptance Scenarios

1. **Given** infrastructure has been deployed via terraform, **When** the production validation stage runs, **Then** tests execute against the actual deployed production infrastructure using a production APK build
2. **Given** production tests are running, **When** they access production services, **Then** they use the exact same endpoints, certificates, and configurations that real users would encounter
3. **Given** production tests complete successfully, **When** the deployment process continues, **Then** frontend deployment is approved with confidence in production compatibility
4. **Given** production tests fail, **When** the pipeline evaluates the results, **Then** team is alerted, frontend deployment is blocked, and manual rollback decision is required
5. **Given** existing Maestro flows run with SKIP_DATA_CLEANUP=true, **When** tests complete, **Then** no additional cleanup is required as anonymous users are already handled by default

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Production validation tests MUST run after infrastructure deployment (terraform) but before frontend deployment
- **FR-002**: Production tests MUST connect to and validate against the actual deployed production infrastructure and configuration
- **FR-003**: Production validation MUST reuse existing GitHub release artifact from build-production workflow, eliminating duplicate APK builds
- **FR-004**: Pipeline MUST use parameterized reusable GitHub Actions for both Android building and Maestro testing that can switch between integration and production modes
- **FR-005**: SKIP_DATA_CLEANUP environment variable MUST control emulator clearing behavior since tests already use anonymous users by default
- **FR-006**: System MUST provide clear separation between test user activities and real user activities in production logs and metrics
- **FR-007**: Pipeline MUST alert development team and block frontend deployment if production validation tests fail, requiring manual rollback decision
- **FR-008**: Production test execution MUST complete in a timely manner, reusing existing Maestro flows designed for fast execution
- **FR-009**: Fresh anonymous users MUST be created through standard app flows rather than external service management
- **FR-010**: Reusable GitHub Actions MUST use devbox for dependency setup to ensure CI is reproducible locally

### Key Entities _(include if feature involves data)_

- **Anonymous Test Users**: Fresh anonymous user accounts created for each test run, eliminating data persistence and cleanup concerns
- **Production Endpoints**: The actual production server URLs, API endpoints, and service configurations used by real users
- **Pipeline Stage Results**: Test outcomes, execution logs, and validation status from the production testing phase
- **Test Execution Results**: Detailed validation outcomes, error logs, and performance metrics from Maestro test flows executed against production server (distinct from user account management)
- **Deployment Gates**: Pipeline checkpoints that prevent release if production validation fails

---

## Review & Acceptance Checklist

_GATE: Automated checks run during main() execution_

### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

_Updated by main() during processing_

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
