# Quick Start: Fix Offline Sync

**Branch**: `001-fix-offline-sync`  
**Date**: 2025-10-30  
**Prerequisites**: Test-first development approach - implement tests before production code

## Overview

This feature fixes broken offline-first sync between Legend State and Supabase where exercises created offline are lost on app restart. Implementation follows strict TDD: write failing tests first, then implement the fix.

## Test-First Implementation Sequence

### Phase 1: Implement Critical Test (MUST FAIL FIRST)

The exact bug scenario from the feature spec must be tested first:

```typescript
// __tests__/integration/offline-sync/critical-bug-test.ts
import { CRITICAL_BUG_TEST_SPEC } from '@/specs/001-fix-offline-sync/contracts/offline-sync-test.spec';

describe('Critical Bug: Exercises Lost After Offline Usage', () => {
  it('should NOT lose exercises after airplane mode workflow', async () => {
    const syncManager = new SyncManager(); // This will fail initially
    await CRITICAL_BUG_TEST_SPEC.testExactBugScenario(syncManager);
  });
});
```

**Expected Result**: ❌ Test should FAIL because SyncManager doesn't exist yet

### Phase 2: Implement Test Infrastructure

Create the testing foundation that can catch offline sync bugs:

```bash
# 1. Create test utilities
mkdir -p __tests__/unit/sync
mkdir -p __tests__/integration/offline-sync
mkdir -p __tests__/test-utils

# 2. Implement network mocking
cp /path/to/specs/001-fix-offline-sync/contracts/sync-manager-contract.ts lib/contracts/
npm install --save-dev @types/jest

# 3. Run tests to confirm they fail
npm test -- --testPathPattern="offline-sync"
```

### Phase 3: Minimal SyncManager Implementation

Create the minimal SyncManager that makes tests pass:

```typescript
// lib/sync/SyncManager.ts
import { SyncManagerContract } from '@/lib/contracts/sync-manager-contract';

export class SyncManager implements SyncManagerContract {
  private queue: QueuedOperation[] = [];
  private networkState: NetworkState = { isOnline: true, isInternetReachable: true, connectionType: "wifi", effectiveType: "fast" };
  
  // Implement each method to pass the tests
  async addToQueue(operation: QueuedOperation): Promise<void> {
    this.queue.push(operation);
  }
  
  async processQueue(): Promise<QueueProcessResult> {
    // Minimal implementation - expand based on test requirements
    const processed = this.networkState.isOnline ? this.queue.length : 0;
    if (this.networkState.isOnline) {
      this.queue = [];
    }
    
    return {
      success: true,
      processed,
      failed: 0,
      remaining: this.queue.length,
      conflicts: [],
      errors: []
    };
  }
  
  // ... implement other methods to pass tests
}
```

### Phase 4: Integration with Legend State

Connect SyncManager to existing Legend State configuration:

```typescript
// lib/data/legend-state/sync-config.ts
import { SyncManager } from '@/lib/sync/SyncManager';

const syncManager = new SyncManager();

export const exerciseStoreWithSync = observable({
  exercises: {} as Record<string, Exercise>,
  
  // Add sync operations to Legend State reactions
  addExercise: (exercise: Exercise) => {
    // Add to local state immediately
    exerciseStore.exercises[exercise.id].set(exercise);
    
    // Queue for sync
    syncManager.addToQueue({
      id: `create-${exercise.id}`,
      type: "create",
      tableName: "exercises",
      recordId: exercise.id,
      data: exercise,
      priority: "high",
      attempts: 0,
      timestamp: new Date()
    });
  }
});
```

## Development Workflow

### 1. Test-Driven Development Cycle

```bash
# Red: Write failing test
npm test -- --testPathPattern="critical-bug-test" # Should fail

# Green: Implement minimal code to pass test  
# (Add minimal SyncManager implementation)
npm test -- --testPathPattern="critical-bug-test" # Should pass

# Refactor: Improve implementation while keeping tests green
npm test -- --watch # Continuous testing during refactoring
```

### 2. Verification Commands

```bash
# Run specific offline sync tests
npm test -- --testPathPattern="offline-sync"

# Run Maestro integration tests (after implementation)
devbox run maestro-test -- __tests__/integration/offline-sync-scenarios.maestro

# Validate production build (critical for Android)
npm run test:production-build

# Full test suite
devbox run test
```

### 3. Network Simulation Testing

```bash
# Test offline scenarios with Maestro
maestro test __tests__/integration/offline-sync/airplane-mode.maestro

# Test intermittent connectivity
maestro test __tests__/integration/offline-sync/unstable-network.maestro

# Test extended offline periods  
maestro test __tests__/integration/offline-sync/extended-offline.maestro
```

## Implementation Checklist

### Must Implement First (TDD)
- [ ] Critical bug test that recreates exact scenario from spec
- [ ] Network state mocking utilities
- [ ] SyncManager contract and test specification
- [ ] Basic queue management tests
- [ ] App restart simulation tests

### Core Sync Functionality
- [ ] SyncManager service with queue management
- [ ] Network state monitoring and adaptation
- [ ] Offline operation queuing
- [ ] Batch processing with adaptive sizing
- [ ] Retry mechanism with exponential backoff

### Legend State Integration
- [ ] Enhanced sync configuration for exercises
- [ ] Observable reactions to network state changes
- [ ] Local persistence through app restarts
- [ ] Sync status tracking in store state

### Conflict Resolution
- [ ] Conflict detection during sync operations
- [ ] Domain-specific resolution rules for exercise data
- [ ] Manual conflict resolution UI components
- [ ] Automatic resolution for simple cases

### Performance & Monitoring
- [ ] Adaptive batch sizing based on network conditions
- [ ] Sync performance monitoring and metrics
- [ ] Error logging and debugging utilities
- [ ] Background sync optimization

## Success Verification

### The Critical Test Must Pass
```typescript
// This exact scenario from the spec must work flawlessly:
// 1. Turn on airplane mode ✅
// 2. Add exercises ✅  
// 3. Turn back on internet ✅
// 4. Exercises sync to cloud ✅
// 5. App restart ✅
// 6. Exercises remain available ✅ (This was failing before)
```

### Performance Targets
- Offline operations complete in <100ms
- Sync recovery in <30 seconds after connectivity restoration  
- Zero data loss in 100% of test scenarios
- Works reliably on production Android builds

### Test Coverage Requirements
- All offline sync scenarios covered by integration tests
- Real-world network conditions simulated in test suite
- App restart scenarios validated
- Conflict resolution workflows tested

## Troubleshooting

### Common Test Failures
1. **"SyncManager not found"** - Implement basic SyncManager class first
2. **"Network mocking not working"** - Check navigator.onLine mock setup
3. **"Queue not persisting"** - Verify Legend State local storage configuration
4. **"Sync not triggering"** - Check network state change handlers

### Debug Commands
```bash
# Check Legend State persistence
npm run debug:legend-state

# Monitor sync queue status
npm run debug:sync-queue

# Test network state changes
npm run debug:network-simulation
```

This quick start ensures the critical offline sync bug is fixed through rigorous test-first development, preventing regression and ensuring reliable offline-first functionality.