# Research: Email Verification Redirect Fix

**Feature**: 013-fix-signin-redirect  
**Date**: 2025-10-22  
**Purpose**: Resolve technical unknowns and research best practices for implementation

## Research Tasks

### 1. Web Service Testing Framework
**Status**: NEEDS RESEARCH  
**Question**: What testing framework should be used for the new web service component?

### 2. Hosting/Deployment Platform  
**Status**: NEEDS RESEARCH  
**Question**: What hosting platform should be used for the web service deployment with infrastructure as code?

### 3. Domain Structure
**Status**: NEEDS RESEARCH  
**Question**: What domain/subdomain structure is available or preferred for the web service?

### 4. Android Deep Linking Best Practices
**Status**: NEEDS RESEARCH  
**Question**: What are the best practices for implementing deep linking in React Native/Expo for email verification flows?

### 5. Supabase Auth Configuration  
**Status**: NEEDS RESEARCH
**Question**: How to configure Supabase Auth for custom redirect URLs and platform-specific routing?

## Research Findings

### 1. Edge Function Testing Framework
**Status**: RESOLVED  
**Decision**: Deno Test with Supabase CLI  
**Rationale**: Native testing for Deno runtime used by Edge Functions, built-in Supabase CLI testing support, can still use Jest for integration tests  
**Alternatives considered**: Jest + Supertest (doesn't match Deno runtime), Vitest (modern but not Deno-native)  
**Implementation**: Use `deno test` for function unit tests, Jest + Maestro for integration testing

### 2. Hosting/Deployment Platform  
**Status**: RESOLVED  
**Decision**: Supabase Edge Functions  
**Rationale**: Keeps everything in existing Supabase ecosystem, simpler deployment, automatic SSL management, competitive pricing ($2/million vs $3.70/million), no API Gateway complexity  
**Alternatives considered**: AWS Lambda (more complex infrastructure), Google Cloud Run (different ecosystem), Vercel (limited IaC)  
**Infrastructure tooling**: Terraform for Supabase project settings (continue existing pattern), Supabase CLI for function deployment

### 3. Android Deep Linking Best Practices
**Status**: RESOLVED  
**Decision**: Hybrid approach using Android App Links with URL scheme fallback  
**Rationale**: App Links provide verified domain association and automatic app opening for security, URL scheme provides fallback compatibility  
**Alternatives considered**: URL schemes only (security risks), App Links only (no fallback), third-party services (external dependency)  
**Implementation**: Configure app.json with intent filters, set up domain verification, create deep link auth handler in lib/services/

### 4. Supabase Auth Configuration  
**Status**: RESOLVED  
**Decision**: Hybrid approach with custom email templates and platform-specific redirect URLs  
**Rationale**: Maintains Supabase security model while enabling platform-specific routing, supports cross-device verification  
**Alternatives considered**: Default Supabase flow (limited customization), server-side token handling (complex), magic links only (security concerns)  
**Configuration**: Custom email templates, multiple redirect URLs, PKCE flow for mobile security

### 5. Domain Structure (INFERRED)
**Status**: NEEDS CLARIFICATION  
**Question**: Specific domain/subdomain to use for web service  
**Recommendation**: Use subdomain like `auth.yourdomain.com` or `verify.yourdomain.com` for clear separation of concerns

## Technology Stack Summary

**Edge Functions**: TypeScript with Deno runtime  
**Hosting**: Supabase Edge Functions with custom domain  
**IaC**: Terraform for Supabase project settings, CLI for function deployment  
**Testing**: Deno Test for functions, Jest + Maestro for integration  
**Mobile Deep Linking**: Android App Links + URL scheme fallback  
**Authentication**: Supabase Auth with custom redirect configuration

## Infrastructure as Code Approach

**Terraform Responsibilities**:
- Supabase project configuration and auth settings (continue existing pattern)
- Basic project settings and API configuration
- Database schema and migrations (if needed)

**Supabase CLI Responsibilities**:
- Edge Function code deployment and configuration
- Custom domain setup and SSL certificate management  
- Environment variables and secrets management
- Local development and testing

**Hybrid Workflow**:
1. Terraform manages infrastructure configuration 
2. GitHub Actions uses Supabase CLI for function deployment
3. Version control for both Terraform configs and function code
4. Maintains consistency with existing project patterns