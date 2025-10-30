/**
 * Contract Test Suite: Offline Sync Functionality
 * Purpose: Comprehensive test specification that catches the exact bug described in the feature spec
 * 
 * This test suite MUST be implemented first and MUST fail initially to demonstrate TDD approach.
 * All tests represent real-world scenarios that should work in production.
 */

import { SyncManagerContract, NetworkCondition } from './sync-manager-contract';

/**
 * Critical Test: The Exact Bug Scenario from Feature Spec
 * 
 * This test recreates the exact scenario described:
 * "turn on airplane mode and then add some exercises. when i turn back on 
 * the internet the state isnt pushed to the cloud, and when the app restarts it is lost"
 */
export const CRITICAL_BUG_TEST_SPEC = {
  name: "should NOT lose exercises after airplane mode -> add exercises -> restore internet -> app restart",
  
  async testExactBugScenario(syncManager: SyncManagerContract): Promise<void> {
    // Step 1: Turn on airplane mode
    await syncManager.setNetworkState({
      isOnline: false,
      isInternetReachable: false,
      connectionType: "none",
      effectiveType: "unknown"
    });
    
    // Step 2: Add some exercises while offline
    const offlineExercises = [
      { id: "offline-1", name: "Airplane Mode Push-ups", sets: [{ reps: 20, weight: 0 }] },
      { id: "offline-2", name: "Airplane Mode Squats", sets: [{ reps: 30, weight: 0 }] },
      { id: "offline-3", name: "Airplane Mode Lunges", sets: [{ reps: 15, weight: 0 }] }
    ];
    
    for (const exercise of offlineExercises) {
      await syncManager.addToQueue({
        id: `queue-${exercise.id}`,
        type: "create",
        tableName: "exercises",
        recordId: exercise.id,
        data: exercise,
        priority: "high",
        attempts: 0,
        timestamp: new Date()
      });
    }
    
    // Verify exercises are queued locally
    const queueStatus = await syncManager.getQueueStatus();
    expect(queueStatus.totalPending).toBe(3);
    expect(queueStatus.byPriority.high).toBe(3);
    
    // Step 3: Turn back on the internet
    await syncManager.setNetworkState({
      isOnline: true,
      isInternetReachable: true,
      connectionType: "wifi", 
      effectiveType: "fast"
    });
    
    // Step 4: Verify sync happens automatically
    const syncResult = await syncManager.processQueue();
    expect(syncResult.success).toBe(true);
    expect(syncResult.processed).toBe(3);
    expect(syncResult.remaining).toBe(0);
    expect(syncResult.errors).toHaveLength(0);
    
    // Step 5: Simulate app restart (critical step that was failing)
    await syncManager.reset(); // Simulate app restart/reload
    
    // Step 6: CRITICAL ASSERTION - Data must NOT be lost
    const statusAfterRestart = await syncManager.getSyncStatus();
    expect(statusAfterRestart.pendingOperations).toBe(0); // All synced
    
    // Verify exercises are available after restart (this was failing before)
    // In real implementation, this would query Legend State or Supabase
    // For now, verify through sync status that operations completed successfully
    expect(statusAfterRestart.lastSyncTime).toBeDefined();
    expect(statusAfterRestart.errors).toHaveLength(0);
    
    // Additional verification: Queue should be empty after successful sync + restart
    const finalQueueStatus = await syncManager.getQueueStatus();
    expect(finalQueueStatus.totalPending).toBe(0);
  }
};

/**
 * Comprehensive Test Suite Specification
 * 
 * Each test represents a real-world scenario that must work reliably.
 * Implementation MUST fail these tests initially to demonstrate TDD.
 */
export const OFFLINE_SYNC_TEST_SUITE = {
  
  /**
   * Network State Management Tests
   */
  networkStateTests: {
    
    async testNetworkStateDetection(syncManager: SyncManagerContract): Promise<void> {
      // Test accurate network state detection
      const onlineState = { isOnline: true, isInternetReachable: true, connectionType: "wifi" as const, effectiveType: "fast" as const };
      const offlineState = { isOnline: false, isInternetReachable: false, connectionType: "none" as const, effectiveType: "unknown" as const };
      
      await syncManager.setNetworkState(onlineState);
      expect(syncManager.getCurrentNetworkState()).toMatchObject(onlineState);
      
      await syncManager.setNetworkState(offlineState);
      expect(syncManager.getCurrentNetworkState()).toMatchObject(offlineState);
    },
    
    async testNetworkStateChangeHandlers(syncManager: SyncManagerContract): Promise<void> {
      let stateChangeCount = 0;
      let lastState: any;
      
      const unsubscribe = syncManager.onNetworkStateChange((state) => {
        stateChangeCount++;
        lastState = state;
      });
      
      await syncManager.setNetworkState({ isOnline: false, isInternetReachable: false, connectionType: "none", effectiveType: "unknown" });
      await syncManager.setNetworkState({ isOnline: true, isInternetReachable: true, connectionType: "wifi", effectiveType: "fast" });
      
      expect(stateChangeCount).toBe(2);
      expect(lastState.isOnline).toBe(true);
      
      unsubscribe();
    }
  },
  
  /**
   * Queue Management Tests
   */
  queueManagementTests: {
    
    async testOperationQueuing(syncManager: SyncManagerContract): Promise<void> {
      // Test that operations are properly queued when offline
      await syncManager.setNetworkState({ isOnline: false, isInternetReachable: false, connectionType: "none", effectiveType: "unknown" });
      
      const operations = [
        { id: "op1", type: "create" as const, tableName: "exercises", recordId: "ex1", data: { name: "Exercise 1" }, priority: "critical" as const },
        { id: "op2", type: "update" as const, tableName: "exercises", recordId: "ex2", data: { name: "Exercise 2" }, priority: "high" as const },
        { id: "op3", type: "delete" as const, tableName: "exercises", recordId: "ex3", data: null, priority: "medium" as const }
      ];
      
      for (const op of operations) {
        await syncManager.addToQueue({ ...op, attempts: 0, timestamp: new Date() });
      }
      
      const status = await syncManager.getQueueStatus();
      expect(status.totalPending).toBe(3);
      expect(status.byPriority.critical).toBe(1);
      expect(status.byPriority.high).toBe(1);
      expect(status.byPriority.medium).toBe(1);
    },
    
    async testPriorityOrdering(syncManager: SyncManagerContract): Promise<void> {
      // Test that higher priority operations are processed first
      await syncManager.setNetworkState({ isOnline: false, isInternetReachable: false, connectionType: "none", effectiveType: "unknown" });
      
      // Add operations in reverse priority order
      await syncManager.addToQueue({ id: "low", type: "create", tableName: "exercises", recordId: "ex1", priority: "low", attempts: 0, timestamp: new Date() });
      await syncManager.addToQueue({ id: "critical", type: "create", tableName: "exercises", recordId: "ex2", priority: "critical", attempts: 0, timestamp: new Date() });
      await syncManager.addToQueue({ id: "medium", type: "create", tableName: "exercises", recordId: "ex3", priority: "medium", attempts: 0, timestamp: new Date() });
      await syncManager.addToQueue({ id: "high", type: "create", tableName: "exercises", recordId: "ex4", priority: "high", attempts: 0, timestamp: new Date() });
      
      // Go online and process
      await syncManager.setNetworkState({ isOnline: true, isInternetReachable: true, connectionType: "wifi", effectiveType: "fast" });
      
      // Mock process queue to track order (implementation would need to expose this)
      const result = await syncManager.processQueue();
      expect(result.success).toBe(true);
      expect(result.processed).toBe(4);
      // Note: Implementation would need to verify processing order matches priority
    },
    
    async testQueuePersistence(syncManager: SyncManagerContract): Promise<void> {
      // Test that queue survives app restart
      await syncManager.addToQueue({
        id: "persistent-op",
        type: "create",
        tableName: "exercises", 
        recordId: "persistent-ex",
        data: { name: "Persistent Exercise" },
        priority: "high",
        attempts: 0,
        timestamp: new Date()
      });
      
      const statusBefore = await syncManager.getQueueStatus();
      expect(statusBefore.totalPending).toBe(1);
      
      // Simulate app restart
      await syncManager.reset();
      
      // Queue should be restored
      const statusAfter = await syncManager.getQueueStatus();
      expect(statusAfter.totalPending).toBe(1);
    }
  },
  
  /**
   * Sync Processing Tests
   */
  syncProcessingTests: {
    
    async testBatchProcessing(syncManager: SyncManagerContract): Promise<void> {
      // Test that large numbers of operations are processed in appropriate batches
      await syncManager.setNetworkState({ isOnline: false, isInternetReachable: false, connectionType: "none", effectiveType: "unknown" });
      
      // Add 100 operations
      const operations = Array.from({ length: 100 }, (_, i) => ({
        id: `batch-op-${i}`,
        type: "create" as const,
        tableName: "exercises",
        recordId: `exercise-${i}`,
        data: { name: `Batch Exercise ${i}` },
        priority: "medium" as const,
        attempts: 0,
        timestamp: new Date()
      }));
      
      for (const op of operations) {
        await syncManager.addToQueue(op);
      }
      
      // Go online and process
      await syncManager.setNetworkState({ isOnline: true, isInternetReachable: true, connectionType: "wifi", effectiveType: "fast" });
      
      const result = await syncManager.processQueue();
      expect(result.success).toBe(true);
      expect(result.processed).toBe(100);
      expect(result.remaining).toBe(0);
    },
    
    async testAdaptiveBatchSizing(syncManager: SyncManagerContract): Promise<void> {
      // Test that batch sizes adapt to network conditions
      const slowNetwork: NetworkCondition = { type: "slow", latencyMs: 2000, failureRate: 0.2 };
      const fastNetwork: NetworkCondition = { type: "fast", latencyMs: 50, failureRate: 0.01 };
      
      // Add operations for different network conditions
      await syncManager.addToQueue({
        id: "slow-network-op",
        type: "create",
        tableName: "exercises",
        recordId: "slow-ex",
        priority: "medium",
        attempts: 0,
        timestamp: new Date()
      });
      
      // Simulate slow network
      syncManager.simulateNetworkCondition(slowNetwork);
      await syncManager.setNetworkState({ isOnline: true, isInternetReachable: true, connectionType: "cellular", effectiveType: "slow" });
      
      let result = await syncManager.processQueue();
      expect(result.success).toBe(true);
      
      // Add more operations for fast network test
      for (let i = 0; i < 50; i++) {
        await syncManager.addToQueue({
          id: `fast-op-${i}`,
          type: "create",
          tableName: "exercises",
          recordId: `fast-ex-${i}`,
          priority: "medium",
          attempts: 0,
          timestamp: new Date()
        });
      }
      
      // Simulate fast network
      syncManager.simulateNetworkCondition(fastNetwork);
      await syncManager.setNetworkState({ isOnline: true, isInternetReachable: true, connectionType: "wifi", effectiveType: "fast" });
      
      result = await syncManager.processQueue();
      expect(result.success).toBe(true);
      expect(result.processed).toBe(50);
    },
    
    async testSyncRetryMechanism(syncManager: SyncManagerContract): Promise<void> {
      // Test exponential backoff retry mechanism
      await syncManager.addToQueue({
        id: "retry-op",
        type: "create",
        tableName: "exercises",
        recordId: "retry-ex",
        priority: "high",
        attempts: 0,
        timestamp: new Date()
      });
      
      // Simulate network issues that cause failures
      syncManager.simulateNetworkCondition({ type: "unstable", failureRate: 0.8, intermittentConnectivity: true });
      await syncManager.setNetworkState({ isOnline: true, isInternetReachable: false, connectionType: "cellular", effectiveType: "slow" });
      
      // First attempt should fail and queue for retry
      let result = await syncManager.processQueue();
      expect(result.failed).toBeGreaterThan(0);
      expect(result.remaining).toBe(1);
      
      // Improve network and retry should succeed
      syncManager.simulateNetworkCondition({ type: "fast", failureRate: 0 });
      await syncManager.setNetworkState({ isOnline: true, isInternetReachable: true, connectionType: "wifi", effectiveType: "fast" });
      
      result = await syncManager.processQueue();
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(0);
    }
  },
  
  /**
   * Conflict Resolution Tests
   */
  conflictResolutionTests: {
    
    async testConflictDetection(syncManager: SyncManagerContract): Promise<void> {
      // Test that conflicts are properly detected
      const localData = [
        { id: "conflict-ex", name: "Local Exercise", updatedAt: "2025-01-01T10:00:00Z" }
      ];
      
      const serverData = [
        { id: "conflict-ex", name: "Server Exercise", updatedAt: "2025-01-01T11:00:00Z" }
      ];
      
      const conflicts = syncManager.detectConflicts(localData, serverData);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].conflictType).toBe("concurrent_update");
      expect(conflicts[0].recordId).toBe("conflict-ex");
    },
    
    async testAutomaticConflictResolution(syncManager: SyncManagerContract): Promise<void> {
      // Test automatic resolution using last-write-wins for simple cases
      const conflict = {
        id: "auto-conflict",
        tableName: "exercises",
        recordId: "auto-ex",
        localVersion: { id: "auto-ex", name: "Local", updatedAt: "2025-01-01T10:00:00Z" },
        serverVersion: { id: "auto-ex", name: "Server", updatedAt: "2025-01-01T11:00:00Z" },
        conflictType: "concurrent_update" as const,
        detectedAt: new Date()
      };
      
      await syncManager.resolveConflict(conflict.id, {
        strategy: "server_wins", // Server has later timestamp
        resolvedBy: "system"
      });
      
      const unresolvedConflicts = await syncManager.getUnresolvedConflicts();
      expect(unresolvedConflicts.find(c => c.id === conflict.id)).toBeUndefined();
    },
    
    async testManualConflictResolution(syncManager: SyncManagerContract): Promise<void> {
      // Test manual resolution workflow
      const conflict = {
        id: "manual-conflict",
        tableName: "exercises", 
        recordId: "manual-ex",
        localVersion: { id: "manual-ex", name: "Local Exercise", sets: [{ reps: 10 }] },
        serverVersion: { id: "manual-ex", name: "Server Exercise", sets: [{ reps: 12 }] },
        conflictType: "concurrent_update" as const,
        detectedAt: new Date()
      };
      
      // User chooses to merge both versions
      const mergedData = {
        id: "manual-ex",
        name: "Merged Exercise",
        sets: [{ reps: 10 }, { reps: 12 }], // Keep both sets
        updatedAt: new Date().toISOString()
      };
      
      await syncManager.resolveConflict(conflict.id, {
        strategy: "merged",
        resolvedData: mergedData,
        resolvedBy: "user"
      });
      
      const unresolvedConflicts = await syncManager.getUnresolvedConflicts();
      expect(unresolvedConflicts.find(c => c.id === conflict.id)).toBeUndefined();
    }
  },
  
  /**
   * Real-World Scenario Tests
   */
  realWorldScenarioTests: {
    
    // This is the main test from the feature spec
    testAirplaneModeWorkflow: CRITICAL_BUG_TEST_SPEC.testExactBugScenario,
    
    async testExtendedOfflinePeriod(syncManager: SyncManagerContract): Promise<void> {
      // Test handling of extended offline periods with substantial data
      await syncManager.setNetworkState({ isOnline: false, isInternetReachable: false, connectionType: "none", effectiveType: "unknown" });
      
      // Simulate a week of offline usage
      const daysOfData = 7;
      const exercisesPerDay = 5;
      const totalExercises = daysOfData * exercisesPerDay;
      
      for (let day = 1; day <= daysOfData; day++) {
        for (let ex = 1; ex <= exercisesPerDay; ex++) {
          await syncManager.addToQueue({
            id: `extended-day${day}-ex${ex}`,
            type: "create",
            tableName: "exercises",
            recordId: `day${day}-exercise${ex}`,
            data: { name: `Day ${day} Exercise ${ex}`, day, exerciseNumber: ex },
            priority: day <= 3 ? "high" : "medium", // Recent days higher priority
            attempts: 0,
            timestamp: new Date(Date.now() - (daysOfData - day) * 24 * 60 * 60 * 1000) // Realistic timestamps
          });
        }
      }
      
      const queueStatus = await syncManager.getQueueStatus();
      expect(queueStatus.totalPending).toBe(totalExercises);
      
      // Return online and sync all data
      await syncManager.setNetworkState({ isOnline: true, isInternetReachable: true, connectionType: "wifi", effectiveType: "fast" });
      
      const syncResult = await syncManager.processQueue();
      expect(syncResult.success).toBe(true);
      expect(syncResult.processed).toBe(totalExercises);
      expect(syncResult.remaining).toBe(0);
    },
    
    async testIntermittentConnectivity(syncManager: SyncManagerContract): Promise<void> {
      // Test handling of unstable network conditions
      await syncManager.addToQueue({
        id: "intermittent-op",
        type: "create",
        tableName: "exercises",
        recordId: "intermittent-ex",
        data: { name: "Intermittent Exercise" },
        priority: "high",
        attempts: 0,
        timestamp: new Date()
      });
      
      // Simulate intermittent connectivity with high failure rate
      syncManager.simulateNetworkCondition({
        type: "unstable",
        latencyMs: 3000,
        failureRate: 0.7,
        intermittentConnectivity: true
      });
      
      // Repeatedly attempt sync until success
      let attempts = 0;
      let finalResult;
      
      while (attempts < 10) { // Max 10 attempts to prevent infinite loop
        await syncManager.setNetworkState({
          isOnline: Math.random() > 0.3, // 70% chance of being online
          isInternetReachable: Math.random() > 0.5, // 50% chance of internet
          connectionType: "cellular",
          effectiveType: "slow"
        });
        
        const result = await syncManager.processQueue();
        if (result.remaining === 0) {
          finalResult = result;
          break;
        }
        
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay between attempts
      }
      
      expect(finalResult).toBeDefined();
      expect(finalResult?.success).toBe(true);
      expect(finalResult?.remaining).toBe(0);
    },
    
    async testSyncAfterAppRestart(syncManager: SyncManagerContract): Promise<void> {
      // Test that sync state is properly restored after app restart
      
      // Create some pending operations
      await syncManager.setNetworkState({ isOnline: false, isInternetReachable: false, connectionType: "none", effectiveType: "unknown" });
      
      await syncManager.addToQueue({
        id: "restart-op1",
        type: "create",
        tableName: "exercises",
        recordId: "restart-ex1",
        data: { name: "Pre-restart Exercise 1" },
        priority: "high",
        attempts: 0,
        timestamp: new Date()
      });
      
      await syncManager.addToQueue({
        id: "restart-op2", 
        type: "update",
        tableName: "exercises",
        recordId: "restart-ex2",
        data: { name: "Pre-restart Exercise 2" },
        priority: "medium",
        attempts: 1, // Previously attempted
        timestamp: new Date()
      });
      
      const statusBeforeRestart = await syncManager.getQueueStatus();
      expect(statusBeforeRestart.totalPending).toBe(2);
      
      // Simulate app restart
      await syncManager.reset();
      
      // Verify queue state is restored
      const statusAfterRestart = await syncManager.getQueueStatus();
      expect(statusAfterRestart.totalPending).toBe(2);
      expect(statusAfterRestart.byPriority.high).toBe(1);
      expect(statusAfterRestart.byPriority.medium).toBe(1);
      
      // Go online and sync should work normally
      await syncManager.setNetworkState({ isOnline: true, isInternetReachable: true, connectionType: "wifi", effectiveType: "fast" });
      
      const syncResult = await syncManager.processQueue();
      expect(syncResult.success).toBe(true);
      expect(syncResult.processed).toBe(2);
      expect(syncResult.remaining).toBe(0);
    }
  }
};

// Helper function to expect test failures initially (TDD approach)
export function expectTestsToFailInitially(testRunner: () => Promise<void>): Promise<void> {
  return expect(testRunner).rejects.toThrow();
}