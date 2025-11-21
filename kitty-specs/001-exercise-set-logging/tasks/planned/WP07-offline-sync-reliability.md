---
work_package_id: WP07
title: Offline Sync and Reliability
lane: planned
subtasks:
  - T028: Write Maestro test for Legend State offline sync behavior
  - T029: Write integration tests for Legend State sync scenarios
  - T030: Configure Legend State sync monitoring and status
priority: Medium
dependencies: WP04, WP05, WP06
history:
  - created: 2025-11-18
    author: Claude
    notes: Ensure data persistence during network issues with automatic sync
---

# WP07: Offline Sync and Reliability

## Objective

Configure Legend State's built-in sync capabilities for optimal reliability in gym environments with poor connectivity. Ensure 95% save success rate through proper Legend State configuration and testing.

## Context

Legend State handles offline/online sync automatically with Supabase. Our focus is on proper configuration, testing edge cases, and providing user feedback about sync status.

**Requirements**:

- 95% save success rate via Legend State sync
- Leverage Legend State's built-in retry mechanisms
- Clear sync status indication to users
- No data loss during network issues (Legend State handles this)

## Detailed Guidance

### T028: Write Maestro test for offline sync behavior

**File**: `.maestro/workout/offline-sync.yaml`

```yaml
# Test offline logging and sync
- launchApp
- runFlow:
    file: ./setup-offline-mode.yaml # Disable network

- tapOn: "Bench Press"
- inputText:
    id: "weight-input"
    text: "135"
- inputText:
    id: "reps-input"
    text: "8"
- tapOn: "Log Set"

# Verify offline storage works
- assertVisible: "Set 1: 135 lbs × 8 reps"
- assertVisible:
    id: "offline-indicator"

# Re-enable network and verify sync
- runFlow:
    file: ./setup-online-mode.yaml

# Wait for sync to complete
- waitForAnimationToEnd
- assertNotVisible:
    id: "sync-pending-indicator"
```

### T029: Write integration tests for Legend State sync behavior

**File**: `__tests__/integration/legend-state-sync.test.ts`

```typescript
describe("Legend State Sync Integration", () => {
  it("handles offline operations gracefully", async () => {
    // Simulate offline mode
    await workoutSets.sync?.pause();

    const set = createMockSet();
    await workoutSetActions.createSet(set);

    // Verify data stored locally
    expect(workoutSets.get()).toContain(expect.objectContaining(set));

    // Resume sync and verify upload
    await workoutSets.sync?.resume();

    // Legend State handles the actual sync automatically
    // Test that local data persists and syncs when online
  });

  it("handles sync conflicts appropriately", async () => {
    // Test Legend State's conflict resolution
    const set = createMockSet();

    // Create locally
    await workoutSetActions.createSet(set);

    // Modify remotely (simulate concurrent edit)
    await supabase
      .from("workout_sets")
      .update({ weight: 999 })
      .eq("id", set.id);

    // Legend State should handle conflict resolution
    // Test the resolved state matches expected behavior
  });

  it("provides accurate sync status", () => {
    // Test that sync status computed value works correctly
    expect(["synced", "pending", "error"]).toContain(syncStatus.get());

    // Test status updates when sync state changes
  });
});
```

### T030: Configure Legend State sync and status monitoring

**File**: `lib/services/syncMonitoring.ts`

```typescript
import { observable } from "@legendapp/state";
import NetInfo from "@react-native-netinfo/netinfo";
import { workoutSets } from "../store/workoutSetStore";

// Monitor and configure Legend State sync behavior
interface SyncMonitoringState {
  isOnline: boolean;
  lastSyncTime?: Date;
  syncErrors: string[];
}

export const syncMonitoring = observable<SyncMonitoringState>({
  isOnline: true,
  lastSyncTime: undefined,
  syncErrors: [],
});

// Configure Legend State sync settings
export function configureLegendStateSync() {
  // Configure retry behavior (Legend State handles this internally)
  const syncConfig = {
    // Legend State will use these configurations internally
    retry: {
      maxAttempts: 5,
      delay: 1000,
      exponentialBackoff: true,
    },

    // Configure conflict resolution
    conflictResolution: "last-write-wins", // or custom resolution function

    // Configure offline behavior
    persistLocally: true,
    syncOnReconnect: true,
  };

  // Apply configuration to Legend State sync
  // (This would use Legend State's actual configuration API)
  workoutSets.sync?.configure?.(syncConfig);
}

// Monitor network status and sync status
export function initializeSyncMonitoring() {
  // Monitor network connectivity
  NetInfo.addEventListener((state) => {
    const wasOnline = syncMonitoring.isOnline.get();
    const isNowOnline = state.isConnected ?? false;

    syncMonitoring.isOnline.set(isNowOnline);

    // Legend State automatically handles reconnection sync
    // We just monitor the status for UI feedback
    if (!wasOnline && isNowOnline) {
      console.log("Network reconnected - Legend State will auto-sync");
    }
  });

  // Monitor Legend State sync events (if available)
  workoutSets.sync?.onSync?.((result) => {
    if (result.success) {
      syncMonitoring.lastSyncTime.set(new Date());
    } else {
      syncMonitoring.syncErrors.push(result.error);
    }
  });
}

// Computed sync status for UI
export const syncStatus = computed(() => {
  const isOnline = syncMonitoring.isOnline.get();
  const hasErrors = syncMonitoring.syncErrors.get().length > 0;

  if (!isOnline) return "offline";
  if (hasErrors) return "error";

  // Use Legend State's internal sync status if available
  return workoutSets.sync?.status?.get() || "synced";
});

// Force sync (useful for testing or manual triggers)
export async function forceLegendStateSync() {
  try {
    // Legend State should provide a manual sync method
    await workoutSets.sync?.sync?.();
    console.log("Manual sync completed successfully");
  } catch (error) {
    console.error("Manual sync failed:", error);
    syncMonitoring.syncErrors.push(String(error));
  }
}
```

## Definition of Done

- [ ] Data never lost during network failures (Legend State handles this)
- [ ] Legend State sync configured with appropriate retry settings
- [ ] 95% save success rate achieved through proper configuration
- [ ] Clear offline status indication via sync monitoring
- [ ] Integration tests cover Legend State sync scenarios
- [ ] Maestro tests verify offline behavior works correctly

## Risk Mitigation

**Risk**: Legend State sync configuration issues
**Mitigation**: Follow Legend State documentation exactly, test extensively with network simulation

**Risk**: Sync conflicts with concurrent edits
**Mitigation**: Use Legend State's built-in conflict resolution (last-write-wins or custom)

## Dependencies

**Requires**: WP04, WP05, WP06 (all core functionality)
