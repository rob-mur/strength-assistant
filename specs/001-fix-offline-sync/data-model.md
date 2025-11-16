# Data Model: Fix Offline Sync

**Date**: 2025-10-30  
**Branch**: `001-fix-offline-sync`  
**Purpose**: Define data structures for offline sync functionality, sync status tracking, and conflict resolution

## Core Entities

### SyncStatus
Tracks synchronization state of local data with enhanced conflict detection.

**Fields**:
- `status`: `"pending" | "syncing" | "synced" | "failed" | "conflict"`
- `lastSyncAttempt`: `Date | null` - When sync was last attempted
- `lastSyncSuccess`: `Date | null` - When sync last succeeded  
- `retryCount`: `number` - Number of failed retry attempts
- `errorMessage`: `string | null` - Last sync error details
- `conflictVersion`: `any | null` - Server version causing conflict

**Validation Rules**:
- `retryCount` must be >= 0 and <= 5
- `status` transitions: pending → syncing → (synced | failed | conflict)
- `lastSyncSuccess` must be <= current time when set
- `conflictVersion` only present when status is "conflict"

**State Transitions**:
```
pending → syncing → synced (success)
pending → syncing → failed (retry < 5) → pending
pending → syncing → failed (retry = 5) → failed (permanent)
pending → syncing → conflict (server conflict detected)
```

### NetworkState  
Monitors online/offline connectivity status with quality detection.

**Fields**:
- `isOnline`: `boolean` - Basic connectivity status
- `isInternetReachable`: `boolean` - Can reach external servers
- `connectionType`: `"wifi" | "cellular" | "ethernet" | "none" | "unknown"`
- `effectiveType`: `"slow" | "moderate" | "fast" | "unknown"` - Connection quality
- `lastOnlineTime`: `Date | null` - When connection was last established
- `lastOfflineTime`: `Date | null` - When connection was last lost

**Validation Rules**:
- `isOnline` true requires `connectionType` !== "none"
- `isInternetReachable` true requires `isOnline` true
- `effectiveType` "unknown" when `connectionType` is "none"
- Timestamps must be valid Date objects or null

### SyncQueue
Manages pending operations with priority and batch optimization.

**Fields**:
- `id`: `string` - Unique queue entry identifier
- `operation`: `"create" | "update" | "delete"` - Type of operation
- `tableName`: `string` - Target database table
- `recordId`: `string` - Target record identifier
- `data`: `any` - Operation payload
- `priority`: `"critical" | "high" | "medium" | "low"` - Sync priority
- `createdAt`: `Date` - When operation was queued
- `attempts`: `number` - Number of sync attempts
- `lastAttemptAt`: `Date | null` - Last attempt timestamp
- `batchId`: `string | null` - Batch grouping identifier

**Validation Rules**:
- `attempts` must be >= 0 and <= 5
- `priority` determines batch ordering and retry behavior
- `batchId` groups related operations for atomic sync
- `lastAttemptAt` must be >= `createdAt` when set

**Priority Ordering**:
- Critical: Active workout data, user safety
- High: Recent workouts (last 7 days)  
- Medium: Historical workouts (last 30 days)
- Low: Older historical data

### SyncConflict
Represents conflicts between local and server data requiring resolution.

**Fields**:
- `id`: `string` - Unique conflict identifier
- `tableName`: `string` - Table where conflict occurred
- `recordId`: `string` - Conflicting record identifier
- `localVersion`: `any` - Local data version
- `serverVersion`: `any` - Server data version
- `conflictType`: `"concurrent_update" | "delete_conflict" | "schema_mismatch"`
- `detectedAt`: `Date` - When conflict was detected
- `resolvedAt`: `Date | null` - When conflict was resolved
- `resolution`: `"local_wins" | "server_wins" | "merged" | "manual" | null`
- `resolvedBy`: `"system" | "user" | null` - Who/what resolved conflict

**Validation Rules**:
- `resolvedAt` must be >= `detectedAt` when set
- `resolution` and `resolvedBy` must both be set or both null
- `conflictType` determines available resolution strategies
- Only one unresolved conflict per `tableName + recordId` combination

### ExerciseRecord (Enhanced)
Extended exercise entity with sync metadata for offline-first operation.

**Fields**:
- `id`: `string` - Unique exercise identifier
- `name`: `string` - Exercise name
- `userId`: `string` - Owner user identifier
- `createdAt`: `Date` - Creation timestamp
- `updatedAt`: `Date` - Last modification timestamp
- `deleted`: `boolean` - Soft delete flag
- `syncStatus`: `SyncStatus` - Sync state tracking
- `localOnlyUntil`: `Date | null` - Temporary local-only flag
- `conflictResolutionData`: `any | null` - Domain-specific conflict data

**Validation Rules**:
- `name` must be non-empty string
- `updatedAt` must be >= `createdAt`
- `syncStatus` required for all records
- `localOnlyUntil` used for temporary offline operations
- `deleted` records maintain sync status for proper cleanup

**Sync Behavior**:
- New records start with `syncStatus.status = "pending"`
- Successful sync updates `syncStatus.status = "synced"`
- Conflicts populate `syncStatus.conflictVersion`
- Deletions sync as `deleted: true` rather than hard delete

## Relationships

### SyncQueue → SyncStatus
- Each SyncQueue entry relates to one SyncStatus
- Multiple queue entries can target same record (updates)
- Queue processing updates corresponding SyncStatus

### SyncConflict → ExerciseRecord
- Each conflict links to specific exercise record
- Exercise.syncStatus references active conflicts
- Resolution updates both conflict and exercise records

### NetworkState → SyncQueue
- Network state changes trigger queue processing
- Connection quality affects batch sizing
- Offline state pauses queue processing

## Sync State Management

### Queue Processing Logic
```typescript
interface QueueProcessor {
  // Process batches by priority order
  processByPriority(): Promise<void>;
  
  // Adaptive batch sizing based on network conditions
  calculateBatchSize(networkState: NetworkState): number;
  
  // Retry failed operations with exponential backoff
  retryFailedOperations(): Promise<void>;
  
  // Handle conflicts during batch processing
  handleConflicts(conflicts: SyncConflict[]): Promise<void>;
}
```

### Conflict Resolution Strategies
```typescript
interface ConflictResolver {
  // Automatic resolution for simple cases
  autoResolve(conflict: SyncConflict): Promise<boolean>;
  
  // Domain-specific resolution for exercise data
  resolveExerciseConflict(
    local: ExerciseRecord, 
    server: ExerciseRecord
  ): Promise<ExerciseRecord>;
  
  // Queue conflicts requiring manual resolution
  queueManualResolution(conflict: SyncConflict): Promise<void>;
}
```

### Storage Requirements

**Local Storage (Legend State)**:
- All entities persist locally for offline operation
- Sync queue survives app restarts
- Network state cached for quick startup
- Conflict queue persists until resolved

**Cloud Storage (Supabase)**:
- Exercise records with full sync metadata
- Conflict resolution audit trail
- Real-time subscriptions for live updates
- Incremental sync using timestamps

This data model provides comprehensive offline sync capabilities with robust conflict detection, priority-based queuing, and domain-specific resolution strategies for exercise data.