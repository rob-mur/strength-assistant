# Production Validation Setup Guide

This guide covers the setup of GitHub Actions secrets and environment variables required for production validation testing.

## Required GitHub Actions Secrets

### EAS (Expo Application Services) Configuration

1. **EXPO_TOKEN**
   - Description: Expo authentication token for EAS builds
   - How to obtain: Run `npx eas login` locally, then `npx eas whoami -t` to get token
   - Usage: Required for building production APKs

### Supabase Production Configuration

2. **EXPO_PUBLIC_SUPABASE_URL**
   - Description: Production Supabase project URL
   - Format: `https://your-project-id.supabase.co`
   - Usage: Production APK connects to actual production database

3. **EXPO_PUBLIC_SUPABASE_ANON_KEY**
   - Description: Production Supabase anonymous/public key
   - How to obtain: Supabase Dashboard → Settings → API → anon/public key
   - Usage: Required for anonymous user authentication in production

### Optional: Notification Integration

4. **GITHUB_TOKEN**
   - Description: GitHub token for creating notifications and deployment status
   - Default: Automatically provided by GitHub Actions
   - Permissions: Contents, Issues, Pull Requests

## Environment Variables Configuration

The following environment variables are automatically set by the workflow and EAS configuration:

### Production Build Environment

```bash
NODE_ENV=production
EXPO_PUBLIC_USE_SUPABASE=true
EXPO_PUBLIC_USE_EMULATOR=false
EXPO_PUBLIC_USE_SUPABASE_EMULATOR=false
USE_SUPABASE_DATA=true
SKIP_DATA_CLEANUP=true
```

## Setup Instructions

### 1. Configure EAS Secrets

Navigate to your EAS project settings and add the production Supabase configuration:

```bash
# Set EAS environment variables for production builds
npx eas env:set EXPO_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co" --environment production
npx eas env:set EXPO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key" --environment production
```

### 2. Configure GitHub Secrets

In your GitHub repository:

1. Go to Settings → Secrets and variables → Actions
2. Add the following repository secrets:
   - `EXPO_TOKEN`: Your Expo authentication token
   - `EXPO_PUBLIC_SUPABASE_URL`: Production Supabase URL (backup/override)
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Production Supabase anon key (backup/override)

### 3. Verify Configuration

Run the configuration verification:

```bash
# Test that secrets are properly configured
gh workflow run production-validation.yml \
  --field terraform_deployment_id="test-deployment-$(date +%s)"
```

## Security Considerations

### Supabase Anonymous Key

- The anonymous key is safe to expose in client applications
- It provides limited access based on Row Level Security policies
- Production RLS policies should restrict anonymous user access appropriately

### EAS Token

- Keep this token secure - it provides full access to your EAS projects
- Rotate regularly if compromised
- Use organization-level tokens for team projects

### Environment Separation

- Production validation uses actual production configuration
- Tests create anonymous users that don't affect real user data
- `SKIP_DATA_CLEANUP=true` ensures tests don't interfere with production cleanup

## Troubleshooting

### Common Issues

1. **EAS Build Fails**

   ```
   Error: Authentication token required
   ```

   - Solution: Verify `EXPO_TOKEN` secret is set correctly

2. **Supabase Connection Failed**

   ```
   Error: Invalid API key or URL
   ```

   - Solution: Check `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`

3. **Production Tests Fail**

   ```
   Error: Anonymous user creation failed
   ```

   - Solution: Verify Supabase RLS policies allow anonymous user creation

### Validation Commands

```bash
# Check GitHub secrets (will show if they exist, not values)
gh secret list

# Test EAS configuration
npx eas env:list --environment production

# Validate Supabase connection
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://your-project-id.supabase.co/rest/v1/"
```

## Next Steps

After configuration:

1. Run a test production validation workflow
2. Verify alerts and notifications work correctly
3. Test the deployment blocking mechanism
4. Update team documentation with access procedures
