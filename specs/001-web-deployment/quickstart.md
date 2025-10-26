# Quickstart: Web Build Deployment Pipeline

**Date**: 2025-10-25  
**Context**: Quick setup guide for web deployment infrastructure and CI/CD pipeline

## Prerequisites

Before implementing web deployment, ensure these requirements are met:

### Required Accounts and Access
- [ ] GitHub repository with Actions enabled
- [ ] Supabase project with API access
- [ ] Vercel account with project creation permissions
- [ ] Terraform installed locally (v1.0+)

### Required Secrets Configuration
Configure these secrets in GitHub repository settings:

```bash
# Supabase Integration
SUPABASE_ACCESS_TOKEN=sbp_[your-access-token]
SUPABASE_PROJECT_REF=[20-character-project-id]

# Vercel Integration  
VERCEL_ORG_ID=[your-organization-id]
VERCEL_PROJECT_ID=[vercel-project-id]
VERCEL_TOKEN=[vercel-deployment-token]
```

### Existing Infrastructure
- [ ] Current terraform configuration in `/terraform/` directory
- [ ] Existing GitHub Actions workflows in `.github/workflows/`
- [ ] Expo/React Native project with web build capability (`npm run build_web`)

## Implementation Phases

### Phase 1: Terraform Infrastructure (30 minutes)

1. **Add Vercel Terraform Provider**
   ```hcl
   # terraform/providers.tf
   terraform {
     required_providers {
       vercel = {
         source  = "vercel/vercel"
         version = "~> 0.15"
       }
     }
   }
   
   provider "vercel" {
     api_token = var.vercel_token
   }
   ```

2. **Create Vercel Project Configuration**
   ```hcl
   # terraform/web-hosting.tf
   resource "vercel_project" "web_app" {
     name      = "strength-assistant"
     framework = "create-react-app"
     
     build_command    = "npx expo export -p web"
     output_directory = "dist"
     
     environment = [
       {
         key    = "EXPO_PUBLIC_SUPABASE_URL"
         value  = supabase_settings.main.api.url
         target = ["production", "preview"]
       },
       {
         key    = "EXPO_PUBLIC_SUPABASE_ANON_KEY" 
         value  = supabase_settings.main.api.anon_key
         target = ["production", "preview"]
       }
     ]
   }
   ```

3. **Apply Terraform Changes**
   ```bash
   cd terraform/
   terraform plan
   terraform apply
   ```

### Phase 2: GitHub Actions Integration (45 minutes)

1. **Create Reusable Web Deployment Workflow**
   ```yaml
   # .github/workflows/web-deployment.yml
   name: Deploy Web Application
   
   on:
     workflow_call:
       inputs:
         environment:
           required: true
           type: string
         deployment_url:
           required: false
           type: string
       outputs:
         deployment_url:
           value: ${{ jobs.deploy.outputs.deployment_url }}
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       outputs:
         deployment_url: ${{ steps.deploy.outputs.deployment_url }}
       steps:
         - uses: actions/checkout@v4
         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '18'
             cache: 'npm'
         - run: npm ci
         - name: Build Expo Web
           run: npx expo export -p web
         - name: Deploy to Vercel
           id: deploy
           uses: amondnet/vercel-action@v25
           with:
             vercel-token: ${{ secrets.VERCEL_TOKEN }}
             vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
             vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
             working-directory: ./
   ```

2. **Modify Production Deployment Workflow**
   ```yaml
   # Add to .github/workflows/production-deployment.yml after terraform job
   
   web-deployment:
     name: Deploy Web Application
     needs: [terraform-deploy]
     uses: ./.github/workflows/web-deployment.yml
     with:
       environment: production
     secrets: inherit
   ```

3. **Modify PR Validation Workflow**
   ```yaml
   # Add to .github/workflows/pr-validation.yml
   
   web-preview:
     name: Deploy Web Preview
     uses: ./.github/workflows/web-deployment.yml
     with:
       environment: preview
     secrets: inherit
   ```

### Phase 3: Testing and Validation (15 minutes)

1. **Test Terraform Configuration**
   ```bash
   # Verify terraform outputs contain required values
   terraform output supabase_url
   terraform output vercel_project_id
   ```

2. **Test Web Build Locally**
   ```bash
   # Verify expo web build works
   npx expo export -p web
   ls -la dist/  # Should contain index.html and assets
   ```

3. **Create Test Pull Request**
   - Create small UI change in new branch
   - Open PR to trigger preview deployment
   - Verify preview URL is posted in PR comments
   - Test preview site functionality

4. **Test Production Deployment** 
   - Merge PR to main branch
   - Verify web deployment runs parallel to Android build
   - Check production URL serves latest changes

## Validation Checklist

### Infrastructure Validation
- [ ] Terraform apply completes without errors
- [ ] Vercel project created with correct configuration
- [ ] Environment variables properly injected
- [ ] Supabase authentication configured for web domain

### CI/CD Validation  
- [ ] PR creation triggers preview deployment
- [ ] Preview URL posted in PR comments within 5 minutes
- [ ] Main branch push triggers production deployment
- [ ] Web deployment runs parallel to Android build
- [ ] Failed deployment doesn't break existing workflows

### Functionality Validation
- [ ] Preview site loads and renders correctly
- [ ] Production site loads and renders correctly
- [ ] Authentication flow works on web platform
- [ ] Database connectivity functions properly
- [ ] All existing mobile features work on web

## Troubleshooting Common Issues

### Terraform Errors
```bash
# Provider authentication issues
export VERCEL_API_TOKEN="your-token-here"
terraform init -reconfigure

# Resource conflicts
terraform import vercel_project.web_app [existing-project-id]
```

### Build Failures
```bash
# Clear expo cache
npx expo export:clear

# Verify package.json web script
npm run build_web  # Should complete without errors
```

### Deployment Failures
```bash
# Check GitHub Actions logs for specific error
# Common issues:
# - Missing environment variables
# - Incorrect Vercel project configuration
# - Network timeouts during deployment
```

### Authentication Issues
```bash
# Verify Supabase URL allow list includes:
# - https://[your-domain].vercel.app
# - https://[custom-domain] (if configured)
# - https://localhost:3000 (for local development)
```

## Next Steps After Implementation

1. **Monitor Deployment Performance**
   - Track deployment times vs. 5-minute target
   - Monitor success rates vs. 95% target
   - Set up alerts for deployment failures

2. **Optimize Build Performance**
   - Implement build caching in GitHub Actions
   - Consider incremental deployments for large changes
   - Monitor bundle size and optimization opportunities

3. **Enhance Preview Features**
   - Add visual regression testing on preview deployments
   - Implement automatic preview deletion after PR merge
   - Consider adding deployment status badges to README

4. **Production Hardening**
   - Set up custom domain for production deployment
   - Implement blue-green deployment strategy
   - Add health checks and rollback capabilities

## Success Metrics

After successful implementation, you should achieve:
- **< 5 minutes**: PR preview deployment time
- **< 10 minutes**: Production deployment time  
- **95%**: Deployment success rate
- **Parallel execution**: Web and Android builds run simultaneously
- **Zero downtime**: Production deployments don't interrupt service