# Data Model: Web Build Deployment Pipeline

**Date**: 2025-10-25  
**Context**: Data entities and relationships for web deployment infrastructure

## Core Entities

### 1. Deployment Environment

Represents a deployment target environment (production or ephemeral).

**Attributes**:
- `environment_id`: Unique identifier (string)
- `environment_type`: "production" | "ephemeral"
- `branch_name`: Git branch associated with deployment
- `supabase_project_ref`: Supabase project reference
- `supabase_url`: Generated Supabase API URL
- `supabase_anon_key`: Environment-specific anonymous key
- `vercel_project_id`: Vercel project identifier
- `vercel_deployment_url`: Generated web deployment URL
- `created_at`: Environment creation timestamp
- `status`: "active" | "pending" | "failed" | "destroyed"

**Validation Rules**:
- `environment_id` must be unique across all environments
- `environment_type` determines lifecycle (ephemeral auto-destroyed, production persistent)
- `branch_name` required for ephemeral, "main" for production
- All Supabase fields must be valid when `status` is "active"

**State Transitions**:
```
pending → active (successful deployment)
pending → failed (deployment failure)
active → destroyed (cleanup completed)
failed → destroyed (cleanup after failure)
```

### 2. Deployment Pipeline

Represents a CI/CD pipeline execution for web deployment.

**Attributes**:
- `pipeline_id`: Unique execution identifier (string)
- `trigger_type`: "pull_request" | "push_to_main" | "manual"
- `trigger_ref`: Git commit SHA or PR number
- `environment_id`: Target deployment environment
- `terraform_job_id`: GitHub Actions terraform job identifier
- `web_deploy_job_id`: GitHub Actions web deployment job identifier
- `started_at`: Pipeline start timestamp
- `completed_at`: Pipeline completion timestamp (nullable)
- `status`: "pending" | "running" | "succeeded" | "failed" | "cancelled"
- `artifacts`: JSON object containing build artifacts info

**Validation Rules**:
- `pipeline_id` must be unique across all executions
- `trigger_ref` must be valid Git SHA or PR number format
- `terraform_job_id` required when `trigger_type` is "push_to_main"
- `completed_at` required when `status` is terminal (succeeded/failed/cancelled)

**State Transitions**:
```
pending → running (pipeline execution starts)
running → succeeded (all jobs complete successfully)
running → failed (any job fails)
running → cancelled (manual cancellation)
```

### 3. Infrastructure Resource

Represents a terraform-managed infrastructure component.

**Attributes**:
- `resource_id`: Terraform resource identifier (string)
- `resource_type`: "supabase_project" | "supabase_branch" | "vercel_project" | "vercel_domain"
- `environment_id`: Associated deployment environment
- `terraform_state`: JSON object containing terraform state info
- `configuration`: JSON object containing resource configuration
- `created_at`: Resource creation timestamp
- `last_updated`: Last terraform apply timestamp
- `status`: "planned" | "creating" | "active" | "updating" | "destroying" | "destroyed"

**Validation Rules**:
- `resource_id` must match terraform resource naming conventions
- `resource_type` determines required fields in `configuration`
- `terraform_state` must be valid terraform state format
- `last_updated` required when `status` changes

**State Transitions**:
```
planned → creating (terraform apply starts)
creating → active (resource creation complete)
active → updating (terraform changes applied)
active → destroying (terraform destroy starts)
destroying → destroyed (resource cleanup complete)
```

### 4. Deployment Artifact

Represents a build artifact generated during deployment.

**Attributes**:
- `artifact_id`: Unique artifact identifier (string)
- `pipeline_id`: Associated pipeline execution
- `artifact_type`: "expo_web_build" | "terraform_plan" | "deployment_logs"
- `file_path`: Storage path or URL to artifact
- `file_size`: Artifact size in bytes
- `checksum`: File integrity checksum (SHA256)
- `created_at`: Artifact generation timestamp
- `expires_at`: Artifact expiration timestamp (nullable)
- `metadata`: JSON object containing artifact-specific metadata

**Validation Rules**:
- `artifact_id` must be unique across all artifacts
- `file_path` must be accessible URL or valid storage path
- `checksum` required for integrity verification
- `expires_at` required for ephemeral artifacts, null for production

## Entity Relationships

### Environment → Pipeline (1:N)
- One environment can have multiple pipeline executions
- Ephemeral environments typically have one pipeline
- Production environment has multiple pipelines over time

### Pipeline → Artifact (1:N)
- One pipeline execution generates multiple artifacts
- Artifacts include build outputs, logs, and terraform plans
- Artifact lifecycle tied to pipeline retention policy

### Environment → Infrastructure Resource (1:N)
- One environment consists of multiple terraform resources
- Resource dependencies managed through terraform configuration
- Resource lifecycle follows environment lifecycle

### Pipeline → Infrastructure Resource (N:N)
- Pipelines can modify multiple infrastructure resources
- Infrastructure resources can be affected by multiple pipelines
- Relationship tracked through terraform state changes

## Data Storage Strategy

### GitHub Actions Context
Pipeline and artifact metadata stored as:
- GitHub Actions job outputs
- Workflow run artifacts
- Environment variables
- Repository secrets

### Terraform State
Infrastructure resource state managed via:
- Terraform state files (stored in backend)
- Resource outputs and variables
- Terraform workspace isolation

### Vercel Integration
Deployment information retrieved via:
- Vercel API responses
- Deployment webhooks
- Project configuration

### Supabase Integration
Environment configuration managed through:
- Supabase Management API
- Project and branch metadata
- Authentication configuration

## Environment Variable Schema

### Production Environment
```json
{
  "EXPO_PUBLIC_SUPABASE_URL": "https://[project-ref].supabase.co",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "[production-anon-key]",
  "EXPO_PUBLIC_ENVIRONMENT": "production",
  "EXPO_PUBLIC_WEB_URL": "https://app.strengthassistant.com"
}
```

### Ephemeral Environment
```json
{
  "EXPO_PUBLIC_SUPABASE_URL": "https://[project-ref].supabase.co",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY": "[production-anon-key]",
  "EXPO_PUBLIC_ENVIRONMENT": "preview",
  "EXPO_PUBLIC_WEB_URL": "https://[deployment-hash].vercel.app",
  "EXPO_PUBLIC_PR_NUMBER": "[pr-number]"
}
```

## Data Lifecycle Management

### Ephemeral Data
- Automatically cleaned up when PR is closed/merged
- 30-day maximum retention regardless of PR status
- Artifacts expire after 7 days for storage optimization

### Production Data
- Persistent until explicitly destroyed
- Terraform state maintained indefinitely
- Artifacts retained according to compliance requirements

### Backup and Recovery
- Terraform state backed up to remote backend
- Critical configuration stored in repository
- Infrastructure recreatable from configuration