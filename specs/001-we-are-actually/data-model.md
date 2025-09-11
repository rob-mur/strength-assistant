# Data Model: TypeScript Testing Infrastructure & Constitution Enhancement

## 🚨 Critical Testing Infrastructure Requirements

All TypeScript and testing configurations must enforce strict validation:
- **TypeScript Compilation**: Must succeed before any test execution (`devbox run test`)
- **Pre-commit Validation**: TypeScript errors must be caught before commit
- **Constitutional Compliance**: Testing requirements must be constitutionally mandated
- **Multi-layered Enforcement**: IDE, pre-commit, and CI validation layers

## ✅ Enhanced Testability Requirements

All data models and configurations must support:
- **TypeScript Strict Mode**: No implicit any types, strict null checks enabled
- **Contract Testable**: Interfaces must be implementable with proper TypeScript types
- **Integration Testable**: Configuration must work across development and CI environments  
- **`devbox run test` Guaranteed Success**: All implementations must pass comprehensive validation pipeline

## Core Entities for TypeScript Testing Infrastructure

### TypeScript Configuration Entity
**Purpose**: Centralized TypeScript compiler configuration for consistent validation
**Fields**:
- `compilerOptions`: object (TypeScript compiler settings)
  - `strict`: boolean (required: true)
  - `noImplicitAny`: boolean (required: true)  
  - `noImplicitReturns`: boolean (required: true)
  - `skipLibCheck`: boolean (required: false for thorough checking)
- `include`: string[] (files/patterns to compile)
- `exclude`: string[] (files/patterns to ignore)

**Validation Rules**:
- Strict mode must be enabled
- No implicit any types allowed  
- All included files must compile without errors

### Pre-commit Hook Configuration Entity
**Purpose**: Git hook configuration to validate TypeScript before commits
**Fields**:
- `hookType`: "pre-commit" (fixed value)
- `commands`: ValidationCommand[]
- `exitOnFailure`: boolean (required: true)

**Validation Rules**:
- Must execute TypeScript compilation before allowing commit
- Must fail commit if compilation errors exist

### Constitutional Amendment Entity
**Purpose**: Formal update to project constitution for TypeScript requirements
**Fields**:
- `section`: "Testing (NON-NEGOTIABLE)"
- `requirements`: string[] (new constitutional requirements)
- `prohibitions`: string[] (newly forbidden actions)
- `version`: string (constitutional version number)

**State Transitions**:
- Draft → Review → Approved → Enacted

## Legacy Entities (Maintained for Original Feature)

### Exercise Record
**Purpose**: Represents user's workout and exercise data
**Fields**:
- `id`: string (UUID, primary key)
- `name`: string (exercise name, required)
- `createdAt`: timestamp (creation time)
- `updatedAt`: timestamp (last modification time)
- `userId`: string (user identifier, nullable for anonymous users)
- `syncStatus`: enum ['pending', 'synced', 'error'] (sync state tracking)

**Validation Rules**:
- `name` must be non-empty string, max 255 characters
- `id` must be valid UUID format
- `createdAt` and `updatedAt` must be valid timestamps
- `updatedAt` must be >= `createdAt`

**State Transitions**:
- Creation: syncStatus starts as 'pending'
- Successful sync: 'pending' → 'synced'
- Sync failure: 'pending' → 'error'
- Local modification of synced record: 'synced' → 'pending'

### User Account
**Purpose**: Identity for cross-device synchronization
**Fields**:
- `id`: string (UUID, primary key)
- `email`: string (nullable, for email/password auth)
- `isAnonymous`: boolean (true for anonymous users)
- `createdAt`: timestamp
- `lastSyncAt`: timestamp (last successful sync)

**Validation Rules**:
- `email` must be valid email format when provided
- `isAnonymous` and `email` are mutually exclusive (email implies non-anonymous)

### Sync State Tracking
**Purpose**: Track synchronization status and pending changes
**Fields**:
- `recordId`: string (foreign key to Exercise Record)
- `recordType`: string ('exercise' for future extensibility)
- `operation`: enum ['create', 'update', 'delete']
- `pendingSince`: timestamp (when change was queued)
- `attempts`: number (retry counter)
- `lastError`: string (nullable, last sync error message)

**Business Rules**:
- Maximum 5 retry attempts before marking as failed
- Retry backoff: 1s, 5s, 30s, 2m, 10m
- Successful sync removes record from sync state table

## Relationships

```
User Account (1) ←→ (many) Exercise Records
User Account (1) ←→ (many) Sync State Tracking
Exercise Records (1) ←→ (0-1) Sync State Tracking
```

## Storage Implementation

### Local Storage (Legend State)
- Automatic persistence to device storage
- Optimistic updates for immediate UI feedback  
- Background sync queue management
- Conflict resolution with last-write-wins strategy

### Cloud Storage (Supabase)
- PostgreSQL tables matching entity structure
- Row-level security for user data isolation
- Real-time subscriptions for cross-device sync
- Automatic timestamp management with triggers

## Migration Schema

### Feature Flag Control
- `useSupabaseStorage`: boolean flag controlling storage backend
- `useSupabaseAuth`: boolean flag controlling authentication backend
- `migrationPhase`: enum ['firebase', 'dual-write', 'supabase', 'cleanup']

### Data Consistency Validation
- Checksum comparison between Firebase and Supabase
- Record count validation across backends
- User-specific data integrity checks
- Automated consistency reporting