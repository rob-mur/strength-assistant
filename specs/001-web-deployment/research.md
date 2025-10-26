# Research: Web Build Deployment Pipeline

**Date**: 2025-10-25  
**Context**: Implementing web deployment for React Native/Expo application with ephemeral PR previews and production deployments

## Critical Finding: Supabase Hosting Limitation

**Decision**: Use external hosting platform instead of Supabase for web deployment  
**Rationale**: Supabase does not provide static web hosting capabilities. After comprehensive research, Supabase confirmed they do not plan to provide static hosting beyond basic HTML content serving, as "there are already some great platforms for website hosting."  
**Alternatives considered**: 
- Supabase direct hosting (not available)
- Vercel (selected for integration simplicity)
- Netlify (good alternative)
- EAS Hosting (Expo-specific but more complex)

## Hosting Platform Selection

**Decision**: Use Vercel for both ephemeral and production web deployments  
**Rationale**: 
- Seamless GitHub integration for PR previews
- Built-in support for React/Next.js applications
- Terraform provider available for infrastructure as code
- Automatic environment variable management
- Superior performance for static React applications
**Alternatives considered**:
- Netlify: Similar features but less React-optimized
- EAS Hosting: Expo-specific but requires additional CLI setup
- AWS S3/CloudFront: Too complex for current requirements

## Infrastructure Management Strategy

**Decision**: Hybrid terraform approach - Supabase backend + Vercel hosting  
**Rationale**: 
- Supabase terraform provider manages database, auth, and API configuration
- Vercel terraform provider manages web hosting and custom domains
- Maintains single infrastructure-as-code workflow
- Enables environment synchronization between backend and frontend
**Alternatives considered**:
- Manual Vercel configuration (violates IaC requirement)
- AWS-only solution (unnecessary complexity)
- GitHub Actions only (no infrastructure versioning)

## Environment Variable Strategy

**Decision**: Terraform-managed environment variables with GitHub Actions injection  
**Rationale**:
- Terraform outputs Supabase branch URLs and keys
- GitHub Actions injects these into Vercel deployment environment
- Maintains security and automation requirements
- Enables per-PR environment isolation
**Alternatives considered**:
- Static environment variables (no PR isolation)
- Manual environment management (not scalable)
- Supabase CLI only (doesn't integrate with hosting)

## CI/CD Pipeline Architecture

**Decision**: Extended GitHub Actions with Vercel integration  
**Rationale**:
- Leverages existing production-deployment.yml workflow
- Adds web deployment job that runs parallel to Android build
- Maintains terraform dependency ordering
- Uses GitHub deployment environments for PR previews
**Alternatives considered**:
- Separate CI/CD system (unnecessary complexity)
- Webhook-based deployments (less reliable)
- Manual deployment process (violates automation requirement)

## Database Connection Strategy

**Decision**: All web deployments connect to production database as specified  
**Rationale**:
- User requirement to point to prod DB for now
- Simplifies initial implementation
- Maintains data consistency across platforms
- Future migration to separate environments remains possible
**Alternatives considered**:
- Separate staging database (not requested by user)
- Local database for previews (not practical for sharing)

## Preview URL Generation

**Decision**: GitHub PR comment integration with Vercel deployment URLs  
**Rationale**:
- Automatic PR commenting via GitHub Actions
- Vercel provides unique URLs for each deployment
- Direct integration with existing PR workflow
- No additional URL management required
**Alternatives considered**:
- Custom URL shortener (unnecessary complexity)
- Branch-based subdomain strategy (requires custom domain setup)

## Cleanup Strategy

**Decision**: Automatic cleanup via GitHub PR close events  
**Rationale**:
- GitHub Actions trigger on PR close/merge events
- Vercel automatically removes deployments after 30 days
- Supabase branches can be programmatically deleted
- Minimizes resource costs and management overhead
**Alternatives considered**:
- Manual cleanup (not scalable)
- Time-based cleanup only (resource waste)
- Permanent preview deployments (cost prohibitive)

## Implementation Order

**Decision**: Terraform infrastructure first, then CI/CD pipeline  
**Rationale**:
- Infrastructure must exist before deployments can succeed
- Terraform changes require careful testing
- Enables incremental rollout of web deployment features
- Maintains existing Android deployment stability
**Alternatives considered**:
- Parallel implementation (higher risk of conflicts)
- CI/CD first (would fail without infrastructure)

## Security Considerations

**Decision**: Environment-specific Supabase keys with web-optimized auth configuration  
**Rationale**:
- Each environment (preview/production) gets unique Supabase keys
- Web deployment includes session detection and persistence settings
- Maintains existing RLS policies and auth flows
- No additional security changes required for initial implementation
**Alternatives considered**:
- Shared keys across environments (security risk)
- Custom auth implementation (unnecessary complexity)
- API proxy layer (adds latency and complexity)

## Summary of Technology Decisions

| Component | Technology | Justification |
|-----------|------------|---------------|
| Web Hosting | Vercel | GitHub integration, React optimization, terraform support |
| Backend IaC | Supabase Terraform Provider | Existing investment, comprehensive API management |
| Frontend IaC | Vercel Terraform Provider | Infrastructure as code compliance |
| CI/CD | GitHub Actions (extended) | Existing pipeline, parallel deployment capability |
| Environment Management | Terraform + GitHub Actions | Automated environment variable injection |
| Database Strategy | Production DB (all environments) | User requirement, simplifies initial rollout |
| Preview URLs | Vercel automatic + GitHub comments | Minimal custom development required |
| Cleanup | GitHub event-driven | Automatic resource management |