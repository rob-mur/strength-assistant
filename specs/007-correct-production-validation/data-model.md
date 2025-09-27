# Data Model: Correct Production Validation Workflow

## Entity Definitions

### GitHubWorkflow

**Purpose**: Represents a GitHub Actions workflow file and its execution behavior
**Attributes**:

- name: String (workflow display name)
- filename: String (YAML file in .github/workflows/)
- triggers: Array of trigger types (push, workflow_run, workflow_dispatch)
- jobs: Array of job definitions
- dependencies: Array of workflow names this workflow depends on

**Relationships**:

- Can trigger other workflows via workflow_run events
- Can be triggered by other workflows completing

### WorkflowTrigger

**Purpose**: Defines when and how a workflow executes
**Attributes**:

- type: Enum (push, workflow_run, workflow_dispatch, schedule)
- conditions: Object (branches, paths, workflow names)
- event_context: Object (contains triggering workflow information)

**State Transitions**:

- pending → running → completed (success/failure)

### ProductionValidationWorkflow

**Purpose**: Specific workflow that validates production deployments
**Attributes**:

- apk_source: String (GitHub release download URL)
- test_environment: String ("production")
- skip_data_cleanup: Boolean (true for anonymous user testing)
- validation_steps: Array of validation commands

**Dependencies**:

- Requires: Either "Build Production APK" OR "Terraform Deploy" completion
- Downloads: APK from GitHub release artifacts
- Executes: Maestro tests against production infrastructure

### WorkflowArtifact

**Purpose**: Represents files produced by workflow execution
**Attributes**:

- workflow_run_id: String
- artifact_type: Enum (apk, terraform_plan, test_results)
- download_url: String
- file_path: String
- checksum: String (for integrity validation)

**Validation Rules**:

- APK artifacts must have valid ZIP signature
- File size must exceed minimum threshold
- Download must complete within retry limits

## Workflow Execution Flow

### Current (Problematic) Flow

```
Terraform Deploy (only on infrastructure changes)
  ↓
Production Validation (conditional trigger)
  ↓
Download APK from GitHub Release
  ↓
Execute Maestro Tests
```

### Corrected Flow

```
Build Production APK (on any main push) ──┐
                                           ├─→ Production Validation
Terraform Deploy (on infrastructure) ─────┘
  ↓
Download APK from GitHub Release
  ↓
Execute Maestro Tests
```

### Validation Rules

1. **Trigger Condition**: Production validation MUST run if either prerequisite workflow completes successfully
2. **APK Availability**: Validation MUST verify APK exists in GitHub releases before proceeding
3. **Error Handling**: Validation MUST fail gracefully with clear error messages for missing dependencies
4. **Resource Isolation**: Each validation run MUST use fresh anonymous users (SKIP_DATA_CLEANUP=true)

## File Structure Changes

### Modified Files

- `.github/workflows/production-validation.yml`: Update workflow_run triggers
- Remove non-existent "Infrastructure Deploy" dependency

### Deleted Files

- `.github/workflows/test-production-validation.yml`: Remove debug workflow

### Preserved Functionality

- Manual triggering via workflow_dispatch
- APK download with retry logic and validation
- Maestro test execution
- Error reporting and notifications
