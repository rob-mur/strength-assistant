# Research: Complete Firebase Removal

**Date**: 2025-09-19  
**Phase**: 0 - Research and Technical Analysis

## Overview

Analysis of Firebase usage patterns in the React Native/Expo strength training application to plan complete removal while maintaining Supabase functionality.

## Key Findings

### Firebase Components Identified

1. **Package Dependencies** (4 packages)
   - `@react-native-firebase/app: ^23.0.0`
   - `@react-native-firebase/auth: ^23.0.0`
   - `@react-native-firebase/firestore: ^23.0.0`
   - `firebase: ^12.1.0`

2. **Source Code Structure** (entire `lib/data/firebase/` directory)
   - 8 TypeScript files implementing Firebase services
   - Authentication (native/web), Firestore (native/web), storage, logging
   - 1 repository implementation: `FirebaseExerciseRepo.ts`

3. **Test Infrastructure** (3 critical files)
   - Mock factory for Firebase services
   - Jest setup with extensive Firebase mocks
   - Firebase-specific repository tests

4. **Configuration Files** (2 files)
   - `firebase.json` - Firebase project configuration
   - CI/CD environment variables and secrets

## Technical Decisions

### Decision: Factory Pattern Simplification

**Rationale**: Currently uses `ExerciseRepoFactory` with `USE_SUPABASE_DATA` environment variable to switch between Firebase and Supabase. After removal, factory becomes unnecessary complexity.
**Alternatives considered**: Keep factory for future backend flexibility vs. simplify to direct Supabase usage
**Chosen**: Simplify to direct Supabase usage per constitution principle of avoiding unnecessary patterns

### Decision: Logging Strategy

**Rationale**: Firebase has its own logger that's used throughout the app. Supabase integration needs equivalent logging.
**Alternatives considered**: Create unified logger vs. use Supabase logging directly
**Chosen**: Use existing logging infrastructure with Supabase, remove Firebase-specific logging

### Decision: Real-time Data Strategy

**Rationale**: Firebase provides real-time updates via onSnapshot. Supabase has equivalent real-time subscriptions.
**Alternatives considered**: Keep Firebase for real-time vs. fully migrate to Supabase real-time
**Chosen**: Fully migrate to Supabase real-time subscriptions (already implemented)

### Decision: Authentication Strategy

**Rationale**: Firebase auth is deeply integrated for both web and native platforms. Supabase auth provides equivalent functionality.
**Alternatives considered**: Keep Firebase auth only vs. full Supabase auth migration
**Chosen**: Full Supabase auth migration (already implemented and tested)

## Dependencies and Constraints

### Critical Dependencies

1. **ExerciseRepoFactory.ts** - Central switching logic between Firebase/Supabase
2. **Authentication flows** - Must maintain working auth on web and native
3. **Real-time subscriptions** - Must preserve real-time data updates
4. **Test infrastructure** - Must maintain test coverage after Firebase removal

### Environment Variables

- `USE_SUPABASE_DATA` - Currently controls Firebase vs Supabase switching
- Will be removed entirely after Firebase cleanup
- Default behavior changes from Firebase-first to Supabase-only

### Testing Constraints

- Must pass: `devbox run test` (Jest unit/integration tests)
- Must pass: Maestro integration tests in devbox
- Must maintain test coverage levels
- Must validate Supabase-only operation

## Removal Strategy

### Phase Approach

1. **Preparation**: Ensure Supabase implementation is complete and tested
2. **Package Removal**: Remove npm dependencies
3. **Source Code Cleanup**: Remove Firebase implementation files
4. **Test Updates**: Remove Firebase mocks and tests, update remaining tests
5. **Configuration Cleanup**: Remove Firebase config files and CI/CD references
6. **Factory Simplification**: Remove switching logic, use Supabase directly
7. **Validation**: Run full test suite and integration tests

### Risk Mitigation

- Incremental removal with testing at each step
- Preserve git history for easy rollback if needed
- Validate Supabase functionality before each removal step
- Maintain backward compatibility during transition

## Technical Context Resolution

**Language/Version**: TypeScript/JavaScript with React Native/Expo ✓  
**Primary Dependencies**: React Native, Expo, Legend State, Supabase ✓  
**Storage**: Supabase (PostgreSQL), Legend State for local state ✓  
**Testing**: Jest, React Native Testing Library, Maestro ✓  
**Target Platform**: iOS/Android mobile apps, Web (Expo) ✓  
**Performance Goals**: Maintain current app performance ✓  
**Constraints**: All tests must pass (devbox run test + Maestro) ✓  
**Scale/Scope**: 103 files with Firebase references identified ✓

## Next Steps

All technical unknowns have been resolved. Ready for Phase 1: Design & Contracts.
