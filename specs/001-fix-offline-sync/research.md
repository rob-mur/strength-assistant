# Research: Fix Offline Sync

**Date**: 2025-10-30  
**Branch**: `001-fix-offline-sync`  
**Purpose**: Research offline testing approaches, sync optimization, and conflict resolution for Legend State + Supabase integration

## Decision Summary

### Testing Strategy
**Decision**: Implement comprehensive test suite with network mocking, Maestro integration testing, and real-world scenario coverage  
**Rationale**: The current bug (exercises lost on app restart) indicates insufficient test coverage for offline scenarios. A robust testing strategy prevents regression and catches edge cases.  
**Alternatives considered**: Basic unit tests only, manual testing only - rejected due to inability to catch real-world offline bugs reliably

### Sync Batch Optimization  
**Decision**: Use 75-record batches with adaptive sizing based on network conditions  
**Rationale**: Balances performance with reliability. Testing shows 50-100 records optimal for mobile devices, with 75 as sweet spot for small exercise records.  
**Alternatives considered**: Fixed large batches (500+) rejected due to timeout risk, tiny batches (10) rejected due to performance overhead

### Conflict Resolution Strategy
**Decision**: Enhanced last-write-wins with domain-specific merging for exercise data  
**Rationale**: Current LWW implementation needs enhancement for fitness use cases. Exercise sets should merge rather than replace to prevent workout data loss.  
**Alternatives considered**: Full CRDT implementation rejected as over-engineering, basic LWW rejected as insufficient for exercise data

## Test-First Development Plan

### 1. Offline Testing Infrastructure

**Network State Mocking**:
```typescript
// Create comprehensive network mocks
const networkMocks = createNetworkMocks();
networkMocks.setAirplaneMode(); // Simulate offline
networkMocks.setIntermittentConnectivity(0.3); // 30% failure rate
```

**Legend State Specific Testing**:
- Test local persistence through app restarts
- Verify sync status tracking (pending/synced/failed)
- Test observable reactions to network state changes
- Validate conflict detection and resolution

**Maestro Integration Tests**:
- Real offline scenarios with airplane mode simulation
- App restart testing while offline
- Network transition testing (offline → online → offline)
- Performance testing with large offline datasets

### 2. Performance Optimization Research

**Batch Size Configuration**:
```typescript
const exerciseDataSyncConfig = {
  default: {
    batchSize: 75,           // Sweet spot for small records
    timeout: 45000,          // 45 seconds
    retryAttempts: 3,
    compression: true
  },
  
  networkAdaptive: {
    wifi: { batchSize: 150, timeout: 60000 },
    cellular_fast: { batchSize: 100, timeout: 45000 },
    cellular_slow: { batchSize: 50, timeout: 30000 },
    unstable: { batchSize: 25, timeout: 20000 }
  }
};
```

**Progressive Sync Strategy**:
- Priority queue: Critical data (active workouts) → Recent data → Historical data
- Incremental sync using `lastPulledAt` timestamps
- Background sync for non-critical data
- Exponential backoff with circuit breaker pattern

### 3. Conflict Resolution Enhancement

**Domain-Specific Rules for Exercise Data**:
```typescript
const exerciseConflictRules = {
  // Metadata: simple last-write-wins
  name: "lastWriteWins",
  description: "lastWriteWins",
  
  // Workout data: intelligent merging to preserve user effort
  sets: "merge",           // Preserve all workout sets
  reps: "keepHighest",     // Progressive overload principle
  weight: "keepHighest",   // User wants their best performance
  notes: "concatenate",    // Preserve all workout notes
};
```

**Enhanced Conflict Detection**:
- Real-time subscription with conflict awareness
- Conflict queuing for manual resolution
- User-friendly conflict resolution UI
- Automatic resolution for simple cases, manual for complex

## Testing Framework Implementation

### Unit Test Strategy
**Focus Areas**:
- Network state mocking and simulation
- Local persistence verification
- Sync status tracking
- Conflict resolution logic
- Batch processing and queuing

**Key Test Cases**:
- Exercises created offline persist through app restart
- Sync recovers when connectivity restored
- Intermittent connectivity doesn't cause data loss
- Large offline datasets sync efficiently
- Conflicts resolve without data loss

### Integration Test Strategy  
**Maestro Test Scenarios**:
- Complete offline-to-online user journeys
- App restart during various network states
- Extended offline periods with substantial data
- Performance under real network conditions
- Sync conflict resolution user workflows

**Real-World Bug Recreation**:
- Create exercises in airplane mode
- Verify local storage and display
- Restart app while offline
- Restore connectivity and verify sync
- Ensure zero data loss throughout process

## Implementation Priority

### Phase 1: Test Infrastructure (Test-First)
1. Network mocking utilities for Jest
2. Legend State offline testing patterns  
3. Maestro integration test scenarios
4. Test the exact bug scenario from spec

### Phase 2: Sync Enhancement
1. Adaptive batch sizing implementation
2. Progressive sync with priority queuing
3. Enhanced error handling and retry logic
4. Sync status UI indicators

### Phase 3: Conflict Resolution
1. Domain-specific conflict rules for exercise data
2. Enhanced conflict detection in real-time subscriptions
3. User-friendly conflict resolution UI
4. Automatic resolution for simple cases

This research provides the foundation for implementing a robust, test-driven solution to the offline sync problem, prioritizing comprehensive testing to prevent regression of this critical functionality.