# Feature Specification: Optimize Android Build Pipeline

**Feature Branch**: `001-optimize-build-pipeline`  
**Created**: 2025-10-26  
**Status**: Draft  
**Input**: User description: "Don't build twice. Currently we build the android production APK two times which is a bit of a waste of resources. The one on Mr should already make a GitHub release but marked draft, and then on push to main and post terraform this release should be marked as production"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Single APK Build on MR Creation (Priority: P1)

Development team creates a merge request and the Android production APK is built once, creating a draft GitHub release that can be promoted later without rebuilding.

**Why this priority**: This delivers the core value of eliminating duplicate builds and is the foundation for the entire optimization.

**Independent Test**: Can be fully tested by creating an MR, verifying APK builds once, and confirming draft release creation with proper artifacts.

**Acceptance Scenarios**:

1. **Given** a merge request is created, **When** CI pipeline runs, **Then** Android APK is built exactly once and uploaded as draft GitHub release
2. **Given** APK build completes successfully, **When** draft release is created, **Then** release contains proper build artifacts and metadata

---

### User Story 2 - Release Promotion on Main Merge (Priority: P2)

When a merge request is approved and merged to main branch, the existing draft release is promoted to production status without rebuilding the APK.

**Why this priority**: This completes the optimization by eliminating the second build while maintaining the release workflow.

**Independent Test**: Can be tested by merging an MR with existing draft release and verifying promotion to production without triggering new build.

**Acceptance Scenarios**:

1. **Given** an MR with draft release is merged to main, **When** post-terraform workflows run, **Then** existing draft release is marked as production release
2. **Given** release promotion occurs, **When** production release is created, **Then** same build artifacts are used with updated release notes and tags

---

### User Story 3 - Build Failure Recovery (Priority: P3)

When APK build fails on MR or release promotion fails, the system provides clear feedback and recovery options without leaving orphaned releases or corrupted states.

**Why this priority**: Ensures reliability and maintainability of the optimized pipeline.

**Independent Test**: Can be tested by simulating build failures and verifying proper cleanup and error reporting.

**Acceptance Scenarios**:

1. **Given** APK build fails on MR, **When** failure occurs, **Then** no draft release is created and failure is clearly reported
2. **Given** release promotion fails, **When** error occurs, **Then** draft release remains unchanged and error is logged with recovery instructions

---

### Edge Cases

- What happens when terraform deployment fails after main merge but before release promotion?
- How does system handle concurrent MRs with different APK versions?
- What occurs if GitHub release API is temporarily unavailable during promotion?
- How are release artifacts preserved if promotion happens days/weeks after initial build?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: CI pipeline MUST build Android production APK exactly once per merge request
- **FR-002**: System MUST create GitHub draft release when APK build succeeds on MR
- **FR-003**: System MUST preserve build artifacts between MR creation and main merge
- **FR-004**: System MUST promote draft release to production status on successful main merge
- **FR-005**: System MUST maintain release metadata and build information during promotion
- **FR-006**: System MUST prevent duplicate APK builds for the same code change
- **FR-007**: System MUST provide clear status indicators for build and release states
- **FR-008**: System MUST handle build failures without creating partial releases
- **FR-009**: Pipeline MUST integrate with existing terraform deployment workflow
- **FR-010**: System MUST maintain audit trail of all build and release operations

### Key Entities

- **Build Artifact**: Android APK file with associated metadata, checksums, and build information
- **Draft Release**: GitHub release in draft state containing build artifacts and preliminary release notes
- **Production Release**: Published GitHub release marking official app version for distribution
- **Build Pipeline**: CI/CD workflow managing the build, test, and release process
- **Release Promotion**: Process of converting draft release to production without rebuilding

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Total build time for MR-to-production workflow reduces by at least 50%
- **SC-002**: CI/CD resource usage (compute time, storage) decreases by eliminating duplicate builds
- **SC-003**: Release promotion completes within 2 minutes of main merge completion
- **SC-004**: Build artifacts maintain integrity between draft and production release (identical checksums)
- **SC-005**: Zero instances of duplicate APK builds for the same commit hash
- **SC-006**: 100% of successful MR builds result in properly created draft releases
- **SC-007**: 95% of main merges successfully promote draft releases to production without manual intervention