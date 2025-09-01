# Supabase Terraform Infrastructure

This directory contains Terraform configuration for managing Supabase infrastructure as code.

## Setup

1. Copy the example variables file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Fill in your Supabase project details in `terraform.tfvars`:
   - `supabase_project_ref`: Your project reference from Supabase dashboard
   - `supabase_access_token`: Generate from Supabase dashboard > Settings > Access Tokens

## Usage

### Initialize Terraform
```bash
cd terraform
terraform init
```

### Plan changes
```bash
terraform plan
```

### Apply changes
```bash
terraform apply
```

### Destroy infrastructure
```bash
terraform destroy
```

## Resources Managed

- **Exercises Table**: Main table for storing exercise data
- **RLS Policies**: Row-level security for user isolation
- **Indexes**: Performance optimization for user queries

## GitHub Integration

The Terraform configuration is automatically applied via GitHub Actions when changes are pushed to the main branch. See `.github/workflows/terraform-supabase.yml` for the workflow configuration.

## Required Secrets

Configure these secrets in your GitHub repository:
- `SUPABASE_ACCESS_TOKEN`: Your Supabase access token
- `SUPABASE_PROJECT_REF`: Your Supabase project reference ID