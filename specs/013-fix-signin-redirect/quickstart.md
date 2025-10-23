# Quick Start: Email Verification Redirect Fix

**Feature**: 013-fix-signin-redirect  
**Estimated Setup Time**: 20-30 minutes  
**Prerequisites**: Supabase CLI, Terraform, existing Strength Assistant development environment

## Overview

This feature implements email verification redirects that properly route Android users back to the app instead of a broken webpage. It includes both mobile app deep linking and Supabase Edge Functions for platform detection and routing.

## Prerequisites Checklist

- [ ] Existing Strength Assistant development environment set up
- [ ] Supabase CLI installed and authenticated
- [ ] Terraform installed and configured (existing Supabase provider setup)
- [ ] Access to Supabase project settings
- [ ] Android development environment for testing
- [ ] Custom domain or subdomain available for Edge Functions

## Quick Setup (Development)

### 1. Mobile App Configuration

**Update app.json for deep linking:**

```json
{
  "expo": {
    "scheme": "strengthassistant",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "verify.yourdomain.com",
              "pathPrefix": "/verify-email"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        },
        {
          "action": "VIEW",
          "data": [
            {
              "scheme": "strengthassistant"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

**Install deep linking handler:**

```bash
# Create deep linking service
mkdir -p lib/services
cp templates/DeepLinkAuthHandler.ts lib/services/

# Update root layout
# Add deep link handler to app/_layout.tsx
```

### 2. Supabase Edge Functions Setup

**Initialize Supabase (if not already done):**

```bash
# Initialize Supabase in project root
supabase init

# Link to existing project
supabase link --project-ref your-project-ref
```

**Create Edge Function:**

```bash
# Create verify-email function
supabase functions new verify-email

# Create fallback function for web pages
supabase functions new fallback
```

**Create verification function:**

```typescript
// supabase/functions/verify-email/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  const userAgent = req.headers.get('user-agent') || '';
  
  if (!token) {
    return new Response('Missing token', { status: 400 });
  }
  
  // Validate token with Supabase
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );
  
  // Platform detection
  const isAndroid = userAgent.toLowerCase().includes('android');
  const redirectUrl = isAndroid 
    ? `strengthassistant://auth/verify?token=${token}&verified=true`
    : `https://verify.yourdomain.com/fallback?verified=true`;
    
  return new Response(null, {
    status: 302,
    headers: { "Location": redirectUrl }
  });
});
```

### 3. Supabase Configuration

**Update Supabase Auth settings:**

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add redirect URLs:
   ```
   http://localhost:54321/functions/v1/verify-email (development)
   https://verify.yourdomain.com/verify-email (production)
   strengthassistant://auth/verify (mobile)
   ```

3. Update email templates:
   - Go to Authentication → Email Templates  
   - Modify "Confirm signup" template to use custom redirect URL
   - Replace confirmation URL with: `https://verify.yourdomain.com/verify-email?token={{ .Token }}&type=signup`

### 4. Local Development

**Start development servers:**

```bash
# Terminal 1: Start mobile app
npm start

# Terminal 2: Start Supabase local development
supabase start

# Terminal 3: Serve Edge Functions locally
supabase functions serve --env-file .env.local

# Terminal 4: Deploy functions to local instance
supabase functions deploy verify-email --no-verify-jwt
```

**Test the flow:**

1. Create new account in mobile app
2. Check email for verification link
3. Click link and verify redirect works
4. Check that user lands on main dashboard with verified status

## Production Deployment

### 1. Infrastructure Setup

**Configure Terraform (Supabase settings):**

```bash
# Update existing Supabase Terraform configuration
cd terraform/

# Add custom domain configuration (if not supported by provider yet)
# This may need to be done via Supabase CLI currently
```

**Deploy Edge Functions:**

```bash
# Deploy to production
supabase functions deploy verify-email --project-ref your-project-ref
supabase functions deploy fallback --project-ref your-project-ref

# Verify deployment
curl https://your-project-ref.supabase.co/functions/v1/verify-email?token=test
```

### 2. Domain Configuration

**Set up DNS and SSL:**

```bash
# Create custom domain via Supabase CLI
supabase domains create verify.yourdomain.com --project-ref your-project-ref

# Activate domain (after DNS verification)
supabase domains activate --project-ref your-project-ref

# Update Supabase redirect URLs to production domain
# Update app.json with production domain
```

### 3. Verification

**Test complete flow:**

1. **Android App**: Create account → verify email → lands in app
2. **Web Browser**: Click verification link → lands on success page  
3. **App Not Installed**: Click link → web fallback page

## Troubleshooting

### Common Issues

**Deep links not working:**
- Verify app.json configuration
- Check Android intent filter syntax
- Test with `adb shell am start -W -a android.intent.action.VIEW -d "strengthassistant://auth/verify"`

**Edge Function errors:**
- Check Supabase function logs: `supabase functions logs verify-email`
- Verify environment variables are set in Supabase dashboard
- Test locally with `supabase functions serve`

**Supabase integration issues:**
- Verify redirect URLs are correctly configured
- Check that tokens are being passed correctly
- Test token validation with Supabase client

### Validation Commands

```bash
# Test deep linking (Android)
adb shell am start -W -a android.intent.action.VIEW -d "strengthassistant://auth/verify?token=test&verified=true"

# Test Edge Function
curl -I "https://verify.yourdomain.com/verify-email?token=test&type=signup"

# Test Supabase configuration
curl -X POST "https://your-project.supabase.co/auth/v1/signup" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'
```

## Development Tips

- Use Maestro tests for end-to-end verification flow testing
- Test with different Android user agents for platform detection
- Use Supabase local development for testing mobile deep links
- Monitor Supabase Edge Function costs and cold start performance
- Set up proper error tracking for production debugging

## Next Steps

After basic setup is working:

1. Implement comprehensive error handling
2. Add monitoring and alerting
3. Set up proper logging and analytics
4. Configure rate limiting and security measures
5. Add support for iOS (future enhancement)

For detailed implementation steps, see the full implementation plan in `plan.md`.