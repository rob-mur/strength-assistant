# Implementation Plan: Email Verification Redirect Fix

**Branch**: `013-fix-signin-redirect` | **Date**: 2025-10-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-fix-signin-redirect/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

**Primary Requirement**: Fix broken email verification flow where Android users are redirected to non-existent webpage instead of returning to the app with verified account status.

**Technical Approach - SIMPLIFIED**: 
1. **NO WEB DEPLOYMENT REQUIRED** - Supabase already supports mobile deep linking out of the box
2. Update `signUp` call to include `emailRedirectTo: 'strengthassistant://auth/callback'`
3. Add simple deep link handler to process auth tokens from verification links
4. Configure Supabase Dashboard with mobile redirect URL
5. **Estimated implementation time: 5-10 minutes**

**Root Cause Identified**: The current `signUp` method in `SupabaseAuth.ts` (line 110-116) doesn't specify `emailRedirectTo`, so Supabase defaults to the website URL (`https://dev.strengthassistant.com`) which doesn't exist. This is a configuration issue, not an infrastructure problem.

## Technical Context

**Language/Version**: TypeScript/JavaScript with React Native/Expo SDK  
**Primary Dependencies**: React Native, Expo SDK, Supabase Auth (built-in deep linking), expo-linking  
**Storage**: Supabase (PostgreSQL) for user accounts and verification tokens (no changes needed)  
**Testing**: Jest + React Native Testing Library (unit), Maestro (integration) - no new testing needed  
**Target Platform**: Android mobile app (no additional infrastructure)  
**Project Type**: Mobile app configuration changes only  
**Performance Goals**: Immediate redirect (<1s), no additional performance concerns  
**Constraints**: 24-hour token expiration (Supabase default), URL scheme deep linking only  
**Scale/Scope**: Android app user base, leverages Supabase's existing global infrastructure

**Configuration Requirements**:
- Update Supabase Dashboard redirect URLs (2-minute task)
- Modify `signUp` method in `SupabaseAuth.ts` (1-line change)
- Add deep link handler in app root (5-line addition)
- No infrastructure deployment or Edge Functions needed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**TDD Approach**: ✅ Tests will be written before implementation (Maestro integration tests for end-to-end flow, Jest unit tests for components)

**Business Logic in lib/ Directory**: ✅ All redirect logic, deep linking, and verification handling will be implemented in lib/ directory

**Direct Framework Usage**: ✅ Using Supabase directly for auth, React Native for mobile, standard web frameworks for service

**Supabase-Only Backend**: ✅ Continuing to use Supabase for user management and verification tokens

**Simple Error Handling**: ✅ Will implement lightweight error logging consistent with existing SimpleErrorLogger system

**Infrastructure as Code**: ✅ Required by user input - will use infrastructure as code for web service deployment

**No Constitution Violations Detected** - Feature aligns with project principles and existing architecture patterns.

### Post-Design Constitution Re-check ✅

**TDD Approach**: ✅ Confirmed - Jest + Supertest for web service, Maestro for integration testing, all tests defined before implementation

**Business Logic in lib/ Directory**: ✅ Confirmed - Deep linking logic will be in lib/services/, verification utilities in lib/utils/verification/

**Direct Framework Usage**: ✅ Confirmed - Using React Native, Expo SDK, Supabase, and Express.js directly without unnecessary abstractions

**Supabase-Only Backend**: ✅ Confirmed - Continuing to use Supabase Auth for all authentication and verification token management

**Simple Error Handling**: ✅ Confirmed - Error handling will use existing SimpleErrorLogger patterns established in the project

**Infrastructure as Code**: ✅ Confirmed - Terraform for Supabase configuration (existing pattern), Supabase CLI for function deployment via GitHub Actions

**Mobile + Serverless Structure**: ✅ Confirmed - Architecture follows established patterns with clear separation between mobile app and Edge Function components

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# React Native/Expo Mobile App (existing)
app/                     # Expo Router screens
├── (tabs)/
├── _layout.tsx
└── error.ts

lib/                     # Business logic (existing + new)
├── data/supabase/       # Supabase integration
├── repo/                # Repository layer
├── hooks/               # React hooks
├── models/              # Data models
├── services/            # NEW: Deep linking service
└── utils/
    └── verification/    # NEW: Email verification utilities

# NEW: Supabase Edge Functions
supabase/
├── functions/
│   ├── verify-email/    # Email verification redirect function
│   │   ├── index.ts     # Main function logic
│   │   └── import_map.json
│   └── fallback/        # Web fallback pages function
│       ├── index.ts
│       └── static/      # HTML templates
├── config.toml          # Function configuration
└── migrations/          # Database migrations (if needed)

# Testing (existing + new)
__tests__/
├── integration/
│   └── maestro/         # NEW: Email verification flow tests
├── unit/
└── test-utils/
```

**Structure Decision**: Mobile + Serverless structure selected due to need for both Android app changes and new Supabase Edge Functions. Edge Functions are minimal and focused solely on email verification redirect logic, leveraging existing Supabase infrastructure.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations detected - this section is not applicable.*
