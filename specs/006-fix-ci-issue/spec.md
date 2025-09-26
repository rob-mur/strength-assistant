# Feature Specification: Remove Invalid Validation Step from Production Build

**Feature Branch**: `006-fix-ci-issue`  
**Created**: 2025-09-26  
**Status**: Draft  
**Input**: User description: "fix ci issue where in the last feature a \"validate main\" step was added to the build production apk job which is referencing the command typecheck which we dont use in this project and so fails. these changes werent asked for amd so should be reverted, building the production apk should only be doing that"

## User Scenarios & Testing

### Primary User Story

As a project maintainer, I need the production build workflow to execute successfully without failing on validation steps that reference commands not available in this project, so that APK releases can be created when code is merged to the main branch.

### Acceptance Scenarios

1. **Given** code is pushed to the main branch, **When** the production build workflow triggers, **Then** it should build the APK successfully without running unsupported validation commands
2. **Given** a manual production build is triggered via workflow dispatch, **When** the workflow executes, **Then** it should complete successfully and create a GitHub release with the APK
3. **Given** the production build workflow runs, **When** it encounters the current validation step, **Then** it should not fail due to missing typecheck command

### Edge Cases

- What happens when the production build is triggered immediately after a merge to main?
- How does the system handle concurrent manual and automatic production builds?

## Requirements

### Functional Requirements

- **FR-001**: Production build workflow MUST execute without validation steps that reference unsupported commands (typecheck)
- **FR-002**: Production build workflow MUST focus solely on building and releasing the production APK
- **FR-003**: Production build workflow MUST complete successfully when triggered by push to main branch
- **FR-004**: Production build workflow MUST complete successfully when triggered by manual workflow dispatch
- **FR-005**: Production build workflow MUST maintain the core functionality of creating GitHub releases with APK artifacts
- **FR-006**: Production build workflow MUST not include validation steps that were not part of the original requirements

### Key Entities

- **Production Build Workflow**: The GitHub Actions workflow responsible for building production APKs and creating releases
- **APK Artifact**: The Android application package file generated during the build process
- **GitHub Release**: The release entry created with the APK as an attached file

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

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed
