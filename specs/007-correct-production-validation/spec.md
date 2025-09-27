# Feature Specification: Correct Production Validation Workflow

**Feature Branch**: `007-correct-production-validation`  
**Created**: 2025-09-27  
**Status**: Draft  
**Input**: User description: "correct production validation: currently, the github axtions workflow production validation only runs after terraform deploy, but terrafotm deploy only runs when infrastructure changes. i want to run production validation once the production apk has been built and (if required) the terraform has been deployed. this means if theres no change to terraform the productuon validation should fire after the production apk is built. secondly, the production validation job seems to depend also on a job called \"infrastructure Deploy\" that doesnt exist, so this should be removed. finally, there is an old debug workflow called test-production-validation that should be removed"

## Execution Flow (main)

```
1. Parse user description from Input
   → Production validation workflow dependency issues identified
2. Extract key concepts from description
   → Identify: workflow triggers, job dependencies, cleanup requirements
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → Clear user flow: production builds trigger validation appropriately
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

## Clarifications

### Session 2025-09-27

- Q: When both APK build and terraform deployment complete simultaneously, should production validation run once or twice? → A: Run validation once, but terraform deploy should wait for a successful APK build
- Q: What should happen when production validation fails after a successful APK build? → A: Job can simply fail and the devs will see this, no action required at this stage

---

## User Scenarios & Testing

### Primary User Story

As a developer pushing changes to the main branch, I want production validation to run automatically after the production APK is built, regardless of whether infrastructure changes occurred, so that I can be confident that the production deployment is working correctly without unnecessary delays or dependencies on infrastructure deployment workflows.

### Acceptance Scenarios

1. **Given** a commit is pushed to main with only application code changes, **When** the production APK build completes successfully, **Then** production validation should trigger automatically using the built APK
2. **Given** a commit is pushed to main with infrastructure changes, **When** the production APK build completes successfully and terraform deployment completes successfully, **Then** production validation should trigger once after both are complete, with terraform deployment waiting for APK build success
3. **Given** no infrastructure changes are present, **When** production APK build completes, **Then** production validation should not wait for terraform deployment
4. **Given** the production validation workflow references a non-existent job, **When** the workflow attempts to run, **Then** it should fail due to missing dependency
5. **Given** an old debug workflow exists in the repository, **When** reviewing workflows, **Then** the debug workflow should be removed to avoid confusion and maintenance overhead

### Edge Cases

- What happens when production APK build fails but terraform deployment succeeds?
- How does system handle when both APK build and terraform deployment are needed but one fails?
- What occurs when production validation is manually triggered without recent APK build or terraform deployment?

## Requirements

### Functional Requirements

- **FR-001**: Production validation workflow MUST trigger automatically after production APK build completes successfully
- **FR-002**: Production validation workflow MUST trigger automatically after terraform deployment completes successfully (when infrastructure changes are present), with terraform deployment waiting for successful APK build completion
- **FR-003**: Production validation workflow MUST trigger after production APK build even when no terraform deployment is required
- **FR-004**: Production validation workflow MUST NOT depend on non-existent jobs (e.g., "Infrastructure Deploy")
- **FR-005**: System MUST remove the old debug workflow "test-production-validation" from the repository
- **FR-006**: Production validation MUST use the APK from the completed production build workflow
- **FR-007**: Production validation MUST support manual triggering via workflow_dispatch for debugging purposes
- **FR-008**: Production validation MUST maintain current functionality of downloading APK from GitHub releases
- **FR-009**: Production validation MUST preserve current test execution and reporting mechanisms
- **FR-010**: Production validation workflow MUST fail visibly to developers when validation tests fail, with no additional automated remediation required

### Key Entities

- **Production Build Workflow**: Builds production APK and creates GitHub release
- **Terraform Deploy Workflow**: Deploys infrastructure changes when terraform files are modified, waits for successful APK build before proceeding
- **Production Validation Workflow**: Downloads APK and runs tests against production infrastructure
- **GitHub Release**: Contains the production APK that validation workflow downloads and tests

---

## Review & Acceptance Checklist

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

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
