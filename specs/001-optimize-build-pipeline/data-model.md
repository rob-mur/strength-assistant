# Data Model: CI/CD Pipeline Optimization

**Purpose**: Define data structures and state transitions for optimized Android build pipeline

## Core Entities

### Build Artifact
**Purpose**: Represents the compiled Android APK with associated metadata

**Fields**:
- `id`: Unique identifier for the build artifact
- `commit_hash`: Git commit SHA that produced this artifact
- `apk_path`: File path to the compiled APK
- `build_timestamp`: UTC timestamp when build completed
- `checksum_sha256`: SHA256 hash for integrity verification
- `size_bytes`: File size in bytes
- `version_code`: Android version code
- `version_name`: Human-readable version string
- `build_type`: Enum (debug, release, production)
- `build_metadata`: JSON object with additional build information

**Validation Rules**:
- `commit_hash` must be valid 40-character SHA
- `checksum_sha256` must be valid 64-character hex string
- `size_bytes` must be positive integer
- `build_type` must be one of allowed enum values

**State Transitions**:
1. Created → Validated (after checksum verification)
2. Validated → Attached (when attached to draft release)
3. Attached → Published (when release is promoted)

### Draft Release
**Purpose**: GitHub release in draft state containing build artifacts and preliminary release notes

**Fields**:
- `release_id`: GitHub release ID
- `tag_name`: Git tag for this release
- `release_name`: Human-readable release title
- `branch`: Source branch that triggered the release
- `commit_hash`: Git commit SHA for this release
- `created_timestamp`: UTC timestamp when draft was created
- `updated_timestamp`: UTC timestamp of last modification
- `artifact_ids`: Array of attached build artifact IDs
- `release_notes`: Markdown formatted release notes
- `is_prerelease`: Boolean flag for prerelease status

**Validation Rules**:
- `tag_name` must follow semver pattern (v1.2.3)
- `commit_hash` must match attached artifacts
- `artifact_ids` array must not be empty
- `release_notes` must be valid markdown

**State Transitions**:
1. Created → Artifact_Attached (when APK is uploaded)
2. Artifact_Attached → Ready_For_Promotion (when all artifacts attached)
3. Ready_For_Promotion → Promoting (during promotion process)
4. Promoting → Error (if promotion fails)

### Production Release
**Purpose**: Published GitHub release marking official app version for distribution

**Fields**:
- `release_id`: GitHub release ID (same as draft_release_id)
- `promoted_timestamp`: UTC timestamp when promoted from draft
- `promoted_by`: User or process that triggered promotion
- `terraform_deployment_id`: Associated terraform deployment ID
- `promotion_metadata`: JSON object with promotion details
- `distribution_status`: Enum (pending, distributed, failed)

**Validation Rules**:
- `promoted_timestamp` must be after draft creation timestamp
- `terraform_deployment_id` must exist and be successful
- All artifact checksums must match original draft release

**State Transitions**:
1. Promoted → Validating (integrity checks)
2. Validating → Active (ready for distribution)
3. Active → Superseded (when newer release is promoted)

### Build Pipeline
**Purpose**: CI/CD workflow state and execution tracking

**Fields**:
- `pipeline_id`: Unique pipeline execution identifier
- `trigger_type`: Enum (merge_request, main_merge, manual)
- `branch`: Source branch for this pipeline
- `commit_hash`: Git commit being processed
- `started_timestamp`: UTC timestamp when pipeline started
- `completed_timestamp`: UTC timestamp when pipeline completed
- `status`: Enum (running, success, failed, cancelled)
- `phase`: Enum (build, test, release, promote)
- `artifact_id`: Associated build artifact ID (if successful)
- `error_message`: Error description (if failed)

**Validation Rules**:
- `trigger_type` must be valid enum value
- `completed_timestamp` must be after `started_timestamp`
- `artifact_id` required when status is success
- `error_message` required when status is failed

**State Transitions**:
1. Started → Building (APK compilation phase)
2. Building → Testing (validation phase)
3. Testing → Releasing (draft release creation)
4. Releasing → Completed (success) or Failed (error)

### Release Promotion
**Purpose**: Process of converting draft release to production without rebuilding

**Fields**:
- `promotion_id`: Unique promotion process identifier
- `draft_release_id`: Source draft release being promoted
- `production_release_id`: Target production release ID
- `triggered_by`: User or automation that initiated promotion
- `started_timestamp`: UTC timestamp when promotion started
- `completed_timestamp`: UTC timestamp when promotion completed
- `validation_checks`: Array of validation steps performed
- `status`: Enum (pending, validating, promoting, completed, failed)
- `error_details`: Error information if promotion failed

**Validation Rules**:
- `draft_release_id` must exist and be in ready state
- `validation_checks` must all pass before promotion
- `error_details` required when status is failed

**State Transitions**:
1. Pending → Validating (artifact integrity checks)
2. Validating → Promoting (API calls to GitHub)
3. Promoting → Completed (success) or Failed (error)
4. Failed → Retrying (automatic retry logic)

## Relationships

### Build Artifact ↔ Draft Release
- **Type**: Many-to-One (multiple artifacts can belong to one draft release)
- **Constraint**: All artifacts in a release must have matching commit_hash

### Draft Release ↔ Production Release
- **Type**: One-to-One (each draft release can be promoted to exactly one production release)
- **Constraint**: Production release inherits all artifacts from draft release

### Build Pipeline ↔ Build Artifact
- **Type**: One-to-One (each successful pipeline produces exactly one artifact)
- **Constraint**: Pipeline must be successful to produce artifact

### Release Promotion ↔ Draft/Production Release
- **Type**: One-to-One (each promotion links one draft to one production release)
- **Constraint**: Draft release must be in ready state before promotion

## Data Flow

```
Merge Request → Build Pipeline → Build Artifact → Draft Release
                                      ↓
Main Merge → Terraform Deploy → Release Promotion → Production Release
```

## Integrity Constraints

1. **Artifact Consistency**: All artifacts in a release must have same commit_hash
2. **Checksum Immutability**: artifact checksums cannot change after creation
3. **Promotion Sequence**: Draft release must exist before production release
4. **Pipeline Atomicity**: Failed pipelines must not create partial artifacts/releases
5. **Temporal Ordering**: Production release timestamp > Draft release timestamp