# Data Model: Local First Storage with Backup

## ✅ Testability Requirements

All data models must be designed for comprehensive testing:
- **Unit Testable**: Models must have pure validation functions that can be tested in isolation
- **Contract Testable**: Interfaces must be implementable by both Firebase and Supabase backends
- **Integration Testable**: Models must work with both local Legend State and cloud sync
- **`devbox run test` Compliance**: All model implementations must pass TypeScript, ESLint, and Jest validation

## Core Entities

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