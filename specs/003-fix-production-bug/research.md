# Research: Production Authentication Bug Investigation

## Overview

Investigation into production APK authentication failures and establishment of pre-release testing infrastructure to prevent similar issues.

## Research Tasks Completed

### 1. Root Cause Analysis: Production URL Configuration

**Problem**: Production APK using emulator URL `http://127.0.0.1:54321` instead of live Supabase server

**Decision**: Implement environment-specific configuration that switches between emulator and production URLs based on build type

**Rationale**: 
- Error logs show Supabase client initializing with local emulator URL in production
- Environment variables not properly configured for production builds
- Need conditional logic to detect production vs development builds

**Alternatives considered**:
- Hard-coding production URLs (rejected: not flexible for staging)
- Single configuration file (rejected: security concerns for production keys)

### 2. Authentication Session Persistence

**Problem**: `AuthSessionMissingError` suggests session storage differs between dev and production

**Decision**: Investigate session storage mechanisms and ensure consistent behavior across build types

**Rationale**:
- Session management works in development but fails in production
- May be related to storage permissions or encryption differences
- AsyncStorage or SecureStore configuration might differ

**Alternatives considered**:
- Disabling session persistence (rejected: poor UX)
- Using only local anonymous users (rejected: doesn't solve real auth)

### 3. Network Configuration & SSL Certificates

**Problem**: `AuthRetryableFetchError: Network request failed` in production builds

**Decision**: Research network security policies and certificate configurations for production builds

**Rationale**:
- Production builds may have different network security requirements
- SSL certificate pinning or network security configs might block Supabase connections
- Need to ensure production APK can reach external Supabase servers

**Alternatives considered**:
- Disabling network security (rejected: security risk)
- Using only local fallbacks (rejected: defeats purpose of cloud backend)

### 4. Pre-Release Testing Infrastructure

**Problem**: Need automated testing to catch auth issues before release

**Decision**: Implement production build validation pipeline with real Supabase testing

**Rationale**:
- Manual testing insufficient to catch production-only issues
- Need automated validation against actual Supabase environments
- Should test both authentication flows and fallback mechanisms

**Alternatives considered**:
- Manual testing only (rejected: unreliable)
- Mock-based testing (rejected: wouldn't catch this issue)

### 5. Environment Variable Management

**Problem**: Environment configuration not properly handling production scenarios

**Decision**: Review and standardize environment variable handling for all build types

**Rationale**:
- Current logs show undefined environment variables in production
- Need clear separation between development, staging, and production configs
- Must ensure sensitive credentials don't leak to development builds

**Alternatives considered**:
- Single environment configuration (rejected: security concerns)
- Runtime configuration fetching (rejected: complexity)

## Key Findings

1. **Primary Issue**: Environment configuration management failure causing production APKs to use development URLs
2. **Secondary Issue**: Session persistence mechanisms differ between build types
3. **Testing Gap**: No validation of production builds against real backend services
4. **Infrastructure Need**: Pre-release testing pipeline to validate authentication flows

## Next Steps

Phase 1 will design:
- Environment configuration system for proper URL switching
- Session management consistency across build types  
- Pre-release testing pipeline with real Supabase validation
- Error reporting improvements for production debugging

## Configuration Requirements Identified

- EXPO_PUBLIC_SUPABASE_URL: Must switch based on build type
- EXPO_PUBLIC_SUPABASE_ANON_KEY: Production vs development keys
- Session storage: Consistent mechanism across all builds
- Network configuration: Production APK network permissions
- Logging: Enhanced error context for production issues