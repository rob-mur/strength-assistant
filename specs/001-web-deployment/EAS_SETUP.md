# EAS Environment Variables Setup

This document explains how to configure EAS environment variables for web deployment to work properly.

## Required EAS Environment Variables

You need to set these environment variables in EAS for both `production` and `preview` environments:

```bash
# For production environment
eas env:set EXPO_PUBLIC_SUPABASE_URL="https://[your-project-ref].supabase.co" --environment production
eas env:set EXPO_PUBLIC_SUPABASE_ANON_KEY="[your-supabase-anon-key]" --environment production

# For preview environment (can use same production values for now)
eas env:set EXPO_PUBLIC_SUPABASE_URL="https://[your-project-ref].supabase.co" --environment preview  
eas env:set EXPO_PUBLIC_SUPABASE_ANON_KEY="[your-supabase-anon-key]" --environment preview
```

## How to Get Values

### Supabase URL
Format: `https://[PROJECT_REF].supabase.co`
- You can get the PROJECT_REF from your existing GitHub secret `SUPABASE_PROJECT_REF`
- Or from your Supabase dashboard URL

### Supabase Anon Key
- Go to your Supabase project dashboard
- Navigate to Settings → API
- Copy the "anon public" key (not the "service_role" key)

## Setup Commands

Replace the placeholders with your actual values:

```bash
# Login to EAS (if not already logged in)
npx eas-cli login

# Set production environment variables
eas env:set EXPO_PUBLIC_SUPABASE_URL="https://abcdefghijklmnopqrst.supabase.co" --environment production
eas env:set EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." --environment production

# Set preview environment variables (same values for now)
eas env:set EXPO_PUBLIC_SUPABASE_URL="https://abcdefghijklmnopqrst.supabase.co" --environment preview
eas env:set EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." --environment preview

# Verify environment variables are set
eas env:list --environment production
eas env:list --environment preview
```

## Verification

After setting up the environment variables, you can verify they're working by:

1. Creating a new commit to trigger the web deployment workflow
2. Checking the GitHub Actions logs for the "Setup EAS Environment Variables" step
3. Verifying the web preview loads without "Supabase service not initialized" errors

## Why This Approach?

- **Consistency**: Uses the same environment variable management as Android builds
- **Security**: Environment variables are managed securely through EAS
- **Reliability**: EAS handles environment variable injection properly for Expo projects
- **Maintainability**: Single source of truth for environment configuration