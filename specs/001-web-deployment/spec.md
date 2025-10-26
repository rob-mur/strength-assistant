# Feature Specification: Web Build Deployment Pipeline

**Feature Branch**: `001-web-deployment`  
**Created**: 2025-10-25  
**Status**: Draft  
**Input**: User description: "Currently we only build the android app and only use the Chrome build for testing. I'd like to also deploy the Chrome build. On PR this should be an ephemeral deployment (still pointing to prod DB for now) so that I can see new UI changes in advance. Then on push to main it should do the production web deployment, in parallel with the Android build, but after the terraform deploy. All website infra should be hosted in supabase and controlled with terraform"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ephemeral PR Preview Deployment (Priority: P1)

As a developer, I want to create a pull request and automatically get a preview URL where I can test the web version of my changes before merging, so that I can validate UI changes without deploying to production.

**Why this priority**: This provides immediate value for development workflow and quality assurance. It allows developers to share preview links with stakeholders and catch issues early.

**Independent Test**: Can be fully tested by creating a PR with UI changes, waiting for deployment, and accessing the generated preview URL to verify the changes are visible and functional.

**Acceptance Scenarios**:

1. **Given** I create a pull request with UI changes, **When** the CI pipeline runs, **Then** an ephemeral preview deployment is created and a URL is provided in the PR comments
2. **Given** an ephemeral deployment exists, **When** I access the preview URL, **Then** I can see my UI changes reflected in the web application
3. **Given** a PR is closed or merged, **When** the cleanup process runs, **Then** the ephemeral deployment is removed to save resources

---

### User Story 2 - Production Web Deployment (Priority: P2)

As a developer, when I push changes to the main branch, I want the web application to be automatically deployed to production alongside the Android build, so that users can access the latest version of the app through both mobile and web channels.

**Why this priority**: This enables the web platform for production use and ensures both Android and web stay in sync with releases.

**Independent Test**: Can be fully tested by merging changes to main, verifying the deployment pipeline runs after terraform, and confirming the production web URL shows the latest changes.

**Acceptance Scenarios**:

1. **Given** changes are pushed to main branch, **When** terraform deployment completes successfully, **Then** web deployment automatically starts in parallel with Android build
2. **Given** web deployment completes, **When** I access the production web URL, **Then** the latest application version is available with full functionality
3. **Given** either web or Android deployment fails, **When** the pipeline runs, **Then** the failure is reported and does not block the other deployment

---

### User Story 3 - Infrastructure as Code Management (Priority: P3)

As a developer, I want all web hosting infrastructure to be managed through terraform and hosted on Supabase, so that infrastructure changes are version controlled and deployments are reproducible.

**Why this priority**: This ensures infrastructure consistency and enables proper DevOps practices, though it's less critical for immediate functionality.

**Independent Test**: Can be fully tested by making infrastructure changes through terraform, applying them, and verifying the web deployment infrastructure is properly configured.

**Acceptance Scenarios**:

1. **Given** infrastructure changes are needed, **When** I modify terraform configuration, **Then** web hosting resources are properly provisioned in Supabase
2. **Given** terraform configuration exists, **When** a new environment needs to be created, **Then** infrastructure can be reproduced consistently
3. **Given** infrastructure is managed by terraform, **When** changes are applied, **Then** existing deployments continue to function without interruption

---

### Edge Cases

- What happens when terraform deployment fails but web deployment is triggered?
- How does the system handle concurrent PR deployments for the same branch?
- What happens when Supabase hosting reaches resource limits?
- How does the system handle deployment failures during production releases?
- What happens when ephemeral deployments aren't cleaned up properly?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST create ephemeral web deployments for every pull request that triggers CI/CD pipeline
- **FR-002**: System MUST provide a publicly accessible preview URL for each ephemeral deployment
- **FR-003**: System MUST automatically comment on pull requests with the ephemeral deployment URL once available
- **FR-004**: System MUST clean up ephemeral deployments when pull requests are closed or merged
- **FR-005**: System MUST deploy to production web hosting when changes are pushed to main branch
- **FR-006**: System MUST ensure production web deployment only starts after terraform deployment completes successfully
- **FR-007**: System MUST run production web deployment in parallel with Android build process
- **FR-008**: System MUST use Supabase as the hosting platform for all web deployments
- **FR-009**: System MUST manage all web infrastructure through terraform configuration
- **FR-010**: System MUST connect both ephemeral and production web deployments to the production database
- **FR-011**: System MUST provide deployment status feedback in CI/CD pipeline logs
- **FR-012**: System MUST handle deployment failures gracefully without blocking other processes

### Key Entities

- **Ephemeral Deployment**: Temporary web hosting instance created for PR previews, includes unique URL, deployment timestamp, and PR association
- **Production Web Deployment**: Primary web hosting instance serving the latest main branch version, includes deployment history and health status
- **Terraform Infrastructure**: Version-controlled infrastructure configuration defining Supabase hosting resources, networking, and deployment pipelines
- **Deployment Pipeline**: CI/CD workflow orchestrating build, test, and deployment processes for both ephemeral and production environments

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can access a working preview URL within 5 minutes of creating a pull request
- **SC-002**: Production web deployment completes within 10 minutes of main branch push
- **SC-003**: 95% of ephemeral deployments are successfully created without manual intervention
- **SC-004**: 99% of production web deployments complete successfully
- **SC-005**: Web deployment pipeline reduces manual testing time by 50% through automated preview environments
- **SC-006**: Zero production outages caused by web deployment pipeline failures
- **SC-007**: 100% of web infrastructure changes are applied through terraform (no manual configuration)
- **SC-008**: Ephemeral deployment cleanup success rate of 98% (no resource leaks)

## Assumptions

- Existing CI/CD pipeline can be extended to support web deployments
- Supabase provides sufficient hosting capabilities for the application requirements
- Production database can handle additional connections from web deployments
- Terraform provider for Supabase supports required hosting features
- Web build process (Chrome build) already produces deployable artifacts
- Current authentication system works seamlessly with web platform