# Data Model: Firebase Removal

**Date**: 2025-09-19  
**Phase**: 1 - Design & Contracts

## Overview

Data model and entities involved in Firebase removal process. This removal operation does not create new data entities but removes existing Firebase-related entities while preserving Supabase data structures.

## Entities to Remove

### Firebase Package Dependencies

**Definition**: npm package dependencies that provide Firebase functionality
**Attributes**:

- Package name (string): `@react-native-firebase/app`, `@react-native-firebase/auth`, etc.
- Version (string): Currently pinned versions
- Type (enum): dependencies vs devDependencies
  **Relationships**: Referenced by package.json, imported by source files
  **Validation Rules**: Must be completely removed from package.json
  **State Transitions**: Installed → Removed

### Firebase Source Modules

**Definition**: TypeScript/JavaScript files implementing Firebase services
**Attributes**:

- File path (string): Absolute path to .ts/.js file
- Module type (enum): auth, firestore, storage, logger, repository
- Platform (enum): native, web, shared
  **Relationships**: Import/export relationships with other modules
  **Validation Rules**: All imports of these modules must be removed first
  **State Transitions**: Exists → Removed

### Firebase Configuration Files

**Definition**: JSON and configuration files for Firebase project setup
**Attributes**:

- File path (string): firebase.json, google-services.json, etc.
- Configuration type (enum): project, android, ios, web
  **Relationships**: Referenced by build tools and CI/CD
  **Validation Rules**: Must not break build process when removed
  **State Transitions**: Configured → Removed

### Firebase Test Infrastructure

**Definition**: Mock implementations and test utilities for Firebase services
**Attributes**:

- File path (string): Path to test file or mock
- Test type (enum): unit, integration, mock, setup
- Coverage area (string): Which Firebase service being tested
  **Relationships**: Dependencies on Firebase source modules
  **Validation Rules**: Removal must not break remaining Supabase tests
  **State Transitions**: Active → Removed

### Firebase Environment Variables

**Definition**: Configuration variables controlling Firebase vs Supabase usage
**Attributes**:

- Variable name (string): USE_SUPABASE_DATA, FIREBASE_CONFIG, etc.
- Default value (string): Current default value
- Scope (enum): build-time, runtime, CI/CD
  **Relationships**: Used by factory pattern and configuration
  **Validation Rules**: Removal must not break application startup
  **State Transitions**: Firebase-controlled → Supabase-only

## Preserved Entities

### Supabase Implementation

**Definition**: Existing Supabase services and repositories that will become the only data backend
**Status**: Keep unchanged - already implemented and tested
**Validation**: Must continue working after Firebase removal

### Application Data Model

**Definition**: Exercise records, user data, and business logic entities
**Status**: Keep unchanged - abstracted above backend implementation
**Validation**: Must continue working with Supabase-only backend

### Test Coverage

**Definition**: Unit and integration tests for business logic and Supabase functionality
**Status**: Keep and maintain - only remove Firebase-specific tests
**Validation**: Must maintain current coverage levels

## Data Migration Requirements

### No Data Migration Required

- Firebase and Supabase operate independently
- No data exists in Firebase that needs migration
- Application already uses Supabase as primary backend
- Firebase removal is purely code cleanup

### Configuration Migration

- Build tools must work without Firebase dependencies
- Environment variables must default to Supabase-only operation
- CI/CD pipelines must function without Firebase secrets

## Validation Rules

### Removal Completeness

- Zero references to Firebase packages in source code
- Zero imports of Firebase modules
- Zero Firebase configuration files
- Zero Firebase environment variables

### Functional Preservation

- All existing features continue working
- Authentication flows work on all platforms
- Real-time data updates continue working
- Test suite passes completely

### Performance Maintenance

- Application startup time unchanged
- Data operation performance unchanged
- Build time should improve (fewer dependencies)

## State Transitions

```
Firebase Components:
[Installed & Active] → [Dependencies Removed] → [Source Removed] → [Tests Updated] → [Config Cleaned] → [Completely Removed]

Supabase Components:
[Alternative Backend] → [Only Backend] → [Direct Usage]

Application:
[Dual Backend] → [Supabase Only]
```

## Relationships and Dependencies

### Critical Dependencies

1. **ExerciseRepoFactory** → Controls backend selection
2. **Authentication hooks** → Must use Supabase auth only
3. **Data synchronization** → Must use Supabase real-time only
4. **Logging infrastructure** → Must use Supabase logging only

### Removal Order

1. Package imports and references
2. Source code files and modules
3. Test infrastructure and mocks
4. Configuration files
5. Environment variables and factory logic
