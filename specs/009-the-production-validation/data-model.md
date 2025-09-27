# Data Model: Production Workflow Consolidation

**Feature**: Consolidate Production Deployment Workflows  
**Phase**: 1 (Design & Contracts)  
**Date**: 2025-09-27

## Core Entities

### Unified Deployment Workflow

**Purpose**: Single GitHub Actions workflow that orchestrates all production deployment activities

**Attributes**:
- **name**: Workflow identifier (e.g., "Production Deployment")
- **trigger**: Push to main branch event
- **concurrency_group**: Identifier for managing concurrent executions
- **cancel_in_progress**: Boolean to cancel running workflows on new triggers
- **timeout**: No automatic timeout (runs until completion)
- **status**: Current execution state (pending, running, completed, failed, cancelled)

**Validation Rules**:
- Must be triggered only by push to main branch
- Concurrency group must prevent parallel executions
- Cancel in-progress must be enabled for new push handling
- All jobs must have explicit dependencies defined

**State Transitions**:
- Pending → Running (when triggered)
- Running → Completed (all jobs succeed)
- Running → Failed (any job fails)
- Running → Cancelled (new push or manual cancellation)

### Production APK Build Job

**Purpose**: Builds and uploads the production-ready APK with correct naming

**Attributes**:
- **job_id**: Unique identifier within workflow (build-production-apk)
- **apk_filename**: Output filename (build_production.apk)
- **artifact_name**: GitHub Actions artifact name for job output
- **upload_path**: GitHub release location for APK storage
- **build_config**: Production build configuration
- **dependencies**: No job dependencies (runs first)

**Validation Rules**:
- APK filename must be build_production.apk (not build_preview.apk)
- Artifact must be uploaded to GitHub release
- Build configuration must target production environment
- Output must pass APK integrity validation

**File Naming Convention**:
- Production APK: build_production.apk
- Artifact name: production-apk-${{ github.sha }}
- Release tag: Semantic versioning (e.g., v1.2.3)

### Terraform Deployment Job

**Purpose**: Deploys infrastructure changes to production environment

**Attributes**:
- **job_id**: Unique identifier within workflow (terraform-deploy)
- **workspace**: Terraform workspace for production environment
- **state_backend**: Remote state storage location
- **deployment_id**: Unique identifier for deployment tracking
- **dependencies**: Requires build-production-apk job completion
- **rollback_capability**: Boolean indicating rollback support

**Validation Rules**:
- Must wait for APK build completion before starting
- Terraform state must be consistent and locked during execution
- Deployment ID must be unique for tracking purposes
- Must validate infrastructure changes before applying

**State Management**:
- Remote state backend for consistency
- State locking during deployment operations
- Rollback plan generation for failure scenarios

### Production Validation Job

**Purpose**: Tests the deployed system using the production APK

**Attributes**:
- **job_id**: Unique identifier within workflow (production-validation)
- **test_apk**: Reference to build_production.apk from build job
- **test_environment**: Production infrastructure endpoint
- **test_user_strategy**: Anonymous user creation approach
- **dependencies**: Requires both build and deploy job completion
- **validation_scope**: Integration tests, smoke tests, end-to-end validation

**Validation Rules**:
- Must use build_production.apk (downloaded from build job artifacts)
- Must test against actual deployed infrastructure
- Must use anonymous users for test isolation
- Must complete all validation tests before marking workflow success

**Testing Strategy**:
- Anonymous user creation through standard app flows
- Integration tests against production infrastructure
- APK validation using Maestro testing framework

### Job Dependencies

**Purpose**: Relationships that ensure proper sequencing and failure handling

**Attributes**:
- **dependent_job**: Job that depends on another (terraform-deploy, production-validation)
- **required_job**: Job that must complete first (build-production-apk, terraform-deploy)
- **dependency_type**: Sequential execution requirement
- **failure_strategy**: Stop dependent jobs on prerequisite failure
- **artifact_sharing**: Mechanism for passing outputs between jobs

**Validation Rules**:
- Dependencies must form a directed acyclic graph (no cycles)
- Failure in any job must stop dependent jobs
- Artifacts must be available for dependent job consumption
- Dependency chain: build → deploy → validate

**Dependency Chain**:
```
build-production-apk (no dependencies)
├── terraform-deploy (needs: build-production-apk)
└── production-validation (needs: [build-production-apk, terraform-deploy])
```

### Workflow Artifacts

**Purpose**: APK files, terraform state, and validation results passed between jobs

**Attributes**:
- **artifact_type**: Type of artifact (apk, terraform-plan, test-results)
- **source_job**: Job that produces the artifact
- **consumer_jobs**: Jobs that consume the artifact
- **storage_location**: GitHub Actions artifact storage or GitHub releases
- **retention_period**: How long artifact is available
- **access_permissions**: Who can download the artifact

**Validation Rules**:
- Artifacts must be available when consumer jobs execute
- APK artifacts must maintain file integrity between jobs
- Test results must be preserved for debugging and auditing
- Terraform plans must be consistent between planning and application

**Artifact Flow**:
- build-production-apk → produces APK artifact → consumed by production-validation
- terraform-deploy → produces deployment state → consumed by production-validation
- production-validation → produces test results → consumed by notification systems

### Deployment Cancellation

**Purpose**: Mechanism to terminate running deployments when new commits are pushed

**Attributes**:
- **cancellation_trigger**: New push to main branch
- **affected_jobs**: All running jobs in the workflow
- **cleanup_strategy**: How to handle partial deployment state
- **notification_strategy**: How to communicate cancellation
- **rollback_requirement**: Whether rollback is needed

**Validation Rules**:
- Must cancel all running jobs when new push occurs
- Must clean up partial deployment artifacts
- Must preserve deployment history for debugging
- Must notify stakeholders of cancellation

**Cancellation Behavior**:
- GitHub Actions concurrency group handles automatic cancellation
- In-progress Terraform operations are safely interrupted
- Partial deployments are rolled back if necessary
- New workflow starts immediately with latest commit

## Entity Relationships

```
Unified Deployment Workflow (1) --> (3) Job Entities
Production APK Build Job (1) --> (1+) Workflow Artifacts
Terraform Deployment Job (1) --> (1+) Workflow Artifacts  
Production Validation Job (1) --> (1+) Workflow Artifacts
Job Dependencies (1) --> (2) Job Entities (source and target)
Deployment Cancellation (1) --> (1) Unified Deployment Workflow
```

## Data Flow

1. **Trigger Event**: Push to main branch triggers unified workflow
2. **Concurrency Check**: Cancel any running deployment workflows
3. **Build Phase**: Execute APK build job, upload artifacts to GitHub release
4. **Deploy Phase**: Execute Terraform deployment using production configuration
5. **Validate Phase**: Execute production validation using build_production.apk
6. **Completion**: Mark workflow complete and notify stakeholders

## Error Scenarios

### Build Job Failure
- **Entity State**: Build job fails, dependent jobs do not execute
- **Artifact Impact**: No APK artifact available for subsequent jobs
- **Workflow State**: Entire workflow marked as failed

### Deployment Job Failure
- **Entity State**: Terraform deployment fails, validation job does not execute
- **Infrastructure Impact**: Partial deployment state may require rollback
- **Workflow State**: Workflow fails but APK artifact remains available

### Validation Job Failure
- **Entity State**: Production validation fails, workflow marked as failed
- **Infrastructure Impact**: Deployment complete but validation concerns raised
- **Workflow State**: Requires investigation before considering deployment successful

### Concurrent Push Cancellation
- **Entity State**: New push cancels running workflow, starts fresh workflow
- **Artifact Impact**: In-progress artifacts may be incomplete
- **Infrastructure Impact**: Partial deployments handled by cleanup procedures

## Integration Points

### GitHub Actions Features
- Workflow concurrency groups for cancellation management
- Job dependencies using `needs` keyword
- Artifact upload/download for inter-job communication
- Release upload for persistent APK storage

### External Systems
- GitHub Releases for APK artifact storage
- Terraform state backend for infrastructure state
- Maestro testing framework for validation
- devbox for local testing and validation