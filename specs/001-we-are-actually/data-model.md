# Data Model: Local First Storage with Backup

## 🚨 Critical Requirements

All data model changes must support:
- **Local-First Architecture**: All data operations immediate on device
- **Automatic Cloud Sync**: Background synchronization when online
- **Sequential Processing**: Memory-safe implementation within 32GB limit
- **Constitutional Compliance**: All tests must pass before any commit
- **Migration Safety**: Zero data loss during Firebase to Supabase migration

## ✅ Enhanced Test Infrastructure Requirements

All test entities and configurations must support:
- **TypeScript Strict Mode**: Full type safety in test infrastructure
- **Mock-First Development**: Complete mock implementations before real functionality
- **Incremental Repair**: Systematic approach to fixing test failures
- **Constitutional Governance**: Formal governance to prevent future test regressions

## Core Entities for Local-First Storage Migration

### Exercise Entity (Enhanced)
**Purpose**: Primary data model with local-first and sync capabilities
**Fields**:
- `id`: string (unique identifier, consistent across devices)
- `name`: string (exercise name, user-defined)
- `createdAt`: timestamp (local creation time)
- `updatedAt`: timestamp (last modification time)
- `syncedAt`: timestamp (last successful sync to cloud)
- `syncStatus`: SyncStatus (current sync state)
- `deviceOrigin`: string (device ID where created)
- `userId`: string | null (user ID if authenticated, null for anonymous)

**Validation Rules**:
- `id` must be globally unique (UUID v4)
- `name` cannot be empty
- `updatedAt` must be >= `createdAt`
- `syncedAt` should be <= `updatedAt`

**State Transitions**:
- Creation: syncStatus = 'pending'
- Successful sync: syncStatus = 'synced', syncedAt = current time
- Failed sync: syncStatus = 'error'
- Offline edit: syncStatus = 'pending', updatedAt = current time

### User Account Entity
**Purpose**: User authentication and cross-device synchronization
**Fields**:
- `id`: string (unique user identifier)
- `email`: string (authentication email)
- `isAnonymous`: boolean (anonymous vs authenticated user)
- `createdAt`: timestamp (account creation time)
- `devices`: DeviceInfo[] (registered devices)
- `syncPreferences`: SyncPreferences (user sync settings)

**Validation Rules**:
- `email` must be valid format for authenticated users
- `isAnonymous` users have limited cross-device sync
- At least one device must be registered

### Sync Operation Entity
**Purpose**: Track sync operations and conflict resolution
**Fields**:
- `id`: string (unique operation identifier)
- `entityType`: string ('exercise', 'user')
- `entityId`: string (ID of entity being synced)
- `operation`: SyncOperationType ('create', 'update', 'delete')
- `localData`: any (local version of data)
- `remoteData`: any (remote version of data, if conflict)
- `status`: SyncOperationStatus ('pending', 'success', 'error', 'conflict')
- `retryCount`: number (number of retry attempts)
- `lastAttempt`: timestamp (last sync attempt time)
- `resolvedAt`: timestamp (when conflict was resolved)
- `resolutionStrategy`: ConflictResolutionStrategy ('last-write-wins', 'manual')

**Validation Rules**:
- `retryCount` must be >= 0 and <= max retry limit
- `resolvedAt` must be set when status is 'success'
- `remoteData` required when status is 'conflict'

### Device Info Entity
**Purpose**: Track devices for multi-device sync
**Fields**:
- `deviceId`: string (unique device identifier)
- `deviceName`: string (user-friendly device name)
- `platform`: Platform ('ios', 'android', 'web')
- `lastSeen`: timestamp (last activity time)
- `isActive`: boolean (currently active device)
- `syncEnabled`: boolean (sync allowed on this device)

### Sync Status Enum
**Values**:
- `pending`: Local changes need to be synced
- `synced`: Data is synchronized with cloud
- `error`: Sync failed, retry needed
- `conflict`: Conflict detected, resolution needed

### Conflict Resolution Strategy Enum
**Values**:
- `last-write-wins`: Use most recent timestamp
- `manual`: Require user intervention

