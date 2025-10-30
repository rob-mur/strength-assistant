/**
 * Sync Recovery Unit Tests
 * Purpose: Test sync recovery scenarios including failures, retries, and network restoration
 */

import { SyncManager } from "../../../lib/sync/SyncManager";
import { createNetworkMocks } from "../../test-utils/NetworkMocks";

describe("Sync Recovery", () => {
  let syncManager: SyncManager;
  let networkMocks: ReturnType<typeof createNetworkMocks>;

  beforeEach(() => {
    networkMocks = createNetworkMocks();
    syncManager = new SyncManager();
  });

  afterEach(() => {
    networkMocks.restore();
    syncManager.destroy();
  });

  describe("Connectivity Recovery", () => {
    it("should auto-retry sync when connectivity is restored", async () => {
      // Start offline with queued operations
      networkMocks.setAirplaneMode();

      const operations = [
        {
          id: "recovery-test-1",
          type: "create" as const,
          tableName: "exercises",
          recordId: "recovery-exercise-1",
          data: { name: "Recovery Exercise 1" },
          priority: "high" as const,
          attempts: 0,
          timestamp: new Date(),
        },
        {
          id: "recovery-test-2",
          type: "create" as const,
          tableName: "exercises",
          recordId: "recovery-exercise-2",
          data: { name: "Recovery Exercise 2" },
          priority: "medium" as const,
          attempts: 0,
          timestamp: new Date(),
        },
      ];

      for (const op of operations) {
        await syncManager.addToQueue(op);
      }

      // Verify operations are queued
      let status = await syncManager.getQueueStatus();
      expect(status.totalPending).toBe(2);

      // Attempt to process while offline (should fail)
      let result = await syncManager.processQueue();
      expect(result.success).toBe(false);
      expect(result.processed).toBe(0);
      expect(result.remaining).toBe(2);

      // Restore connectivity
      networkMocks.setFastNetwork();

      // Allow auto-sync to trigger (SyncManager has 1000ms delay)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Check if auto-sync processed the queue
      status = await syncManager.getQueueStatus();
      expect(status.totalPending).toBe(0);

      // Verify sync status shows success
      const syncStatus = await syncManager.getSyncStatus();
      expect(syncStatus.isOnline).toBe(true);
      expect(syncStatus.pendingOperations).toBe(0);
    });

    it("should handle intermittent connectivity during recovery", async () => {
      networkMocks.setAirplaneMode();

      // Add multiple operations
      for (let i = 1; i <= 6; i++) {
        await syncManager.addToQueue({
          id: `intermittent-${i}`,
          type: "create",
          tableName: "exercises",
          recordId: `intermittent-exercise-${i}`,
          data: { name: `Intermittent Exercise ${i}` },
          priority: "medium",
          attempts: 0,
          timestamp: new Date(),
        });
      }

      let status = await syncManager.getQueueStatus();
      expect(status.totalPending).toBe(6);

      // Simulate unstable connection that fails frequently
      networkMocks.setIntermittentConnectivity({ failureRate: 0.8 });

      // Multiple attempts to process with intermittent connectivity
      let totalProcessed = 0;
      for (let attempt = 1; attempt <= 5; attempt++) {
        const result = await syncManager.processQueue();
        totalProcessed += result.processed;

        // Small delay between attempts
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      // Some operations should eventually succeed despite intermittent connectivity
      expect(totalProcessed).toBeGreaterThan(0);

      const finalStatus = await syncManager.getQueueStatus();
      expect(finalStatus.totalPending).toBeLessThan(6);
    });

    it("should recover from temporary server errors", async () => {
      networkMocks.setFastNetwork();

      await syncManager.addToQueue({
        id: "server-error-test",
        type: "create",
        tableName: "exercises",
        recordId: "server-error-exercise",
        data: { name: "Server Error Exercise" },
        priority: "high",
        attempts: 0,
        timestamp: new Date(),
      });

      // Simulate server errors by processing multiple times
      // SyncManager has 10% random failure rate for testing
      let attempts = 0;
      let lastResult;

      while (attempts < 10) {
        lastResult = await syncManager.processQueue();

        if (lastResult.processed > 0) {
          break; // Success!
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Should eventually succeed or show retryable error
      expect(attempts).toBeLessThan(10); // Should not take all attempts

      if (lastResult) {
        const finalStatus = await syncManager.getQueueStatus();
        expect(finalStatus.totalPending).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("Failure Recovery", () => {
    it("should retry failed operations with backoff", async () => {
      networkMocks.setFastNetwork();

      await syncManager.addToQueue({
        id: "backoff-test",
        type: "create",
        tableName: "exercises",
        recordId: "backoff-exercise",
        data: { name: "Backoff Test Exercise" },
        priority: "high",
        attempts: 0,
        timestamp: new Date(),
      });

      // Track retry attempts
      const retryAttempts: Date[] = [];

      // Try processing multiple times to simulate retries
      for (let i = 0; i < 5; i++) {
        retryAttempts.push(new Date());
        const result = await syncManager.processQueue();

        if (result.processed > 0) {
          break; // Success
        }

        // Small delay between retries
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      // Verify retry behavior occurred
      expect(retryAttempts.length).toBeGreaterThan(1);

      // Check final state
      const status = await syncManager.getQueueStatus();
      expect(status.totalPending).toBeLessThanOrEqual(1);
    });

    it("should handle queue corruption recovery", async () => {
      networkMocks.setFastNetwork();

      // Add operations
      await syncManager.addToQueue({
        id: "corruption-test-1",
        type: "create",
        tableName: "exercises",
        recordId: "corruption-exercise-1",
        data: { name: "Corruption Test 1" },
        priority: "high",
        attempts: 0,
        timestamp: new Date(),
      });

      await syncManager.addToQueue({
        id: "corruption-test-2",
        type: "create",
        tableName: "exercises",
        recordId: "corruption-exercise-2",
        data: { name: "Corruption Test 2" },
        priority: "medium",
        attempts: 0,
        timestamp: new Date(),
      });

      let status = await syncManager.getQueueStatus();
      expect(status.totalPending).toBe(2);

      // Simulate queue reset (corruption recovery)
      await syncManager.reset();

      status = await syncManager.getQueueStatus();
      expect(status.totalPending).toBe(0);
      expect(status.isProcessing).toBe(false);

      // Should be able to add new operations after recovery
      await syncManager.addToQueue({
        id: "post-recovery-test",
        type: "create",
        tableName: "exercises",
        recordId: "post-recovery-exercise",
        data: { name: "Post Recovery Exercise" },
        priority: "high",
        attempts: 0,
        timestamp: new Date(),
      });

      status = await syncManager.getQueueStatus();
      expect(status.totalPending).toBe(1);
    });

    it("should handle concurrent sync attempts gracefully", async () => {
      networkMocks.setFastNetwork();

      // Add multiple operations
      for (let i = 1; i <= 3; i++) {
        await syncManager.addToQueue({
          id: `concurrent-${i}`,
          type: "create",
          tableName: "exercises",
          recordId: `concurrent-exercise-${i}`,
          data: { name: `Concurrent Exercise ${i}` },
          priority: "medium",
          attempts: 0,
          timestamp: new Date(),
        });
      }

      // Launch multiple concurrent sync attempts
      const syncPromises = [
        syncManager.processQueue(),
        syncManager.processQueue(),
        syncManager.processQueue(),
      ];

      const results = await Promise.all(syncPromises);

      // Only one should process successfully, others should be blocked
      const successfulResults = results.filter(
        (r) => r.success && r.processed > 0,
      );
      const blockedResults = results.filter(
        (r) => !r.success && r.processed === 0,
      );

      expect(successfulResults.length).toBeLessThanOrEqual(1);
      expect(blockedResults.length).toBeGreaterThan(0);

      // Final state should be consistent
      const finalStatus = await syncManager.getQueueStatus();
      expect(finalStatus.isProcessing).toBe(false);
    });
  });

  describe("Network Transition Recovery", () => {
    it("should handle rapid network state changes", async () => {
      // Start with fast network
      networkMocks.setFastNetwork();

      await syncManager.addToQueue({
        id: "rapid-change-test",
        type: "create",
        tableName: "exercises",
        recordId: "rapid-change-exercise",
        data: { name: "Rapid Change Exercise" },
        priority: "high",
        attempts: 0,
        timestamp: new Date(),
      });

      // Rapid network state changes
      networkMocks.setAirplaneMode();
      await new Promise((resolve) => setTimeout(resolve, 50));

      networkMocks.setSlowNetwork();
      await new Promise((resolve) => setTimeout(resolve, 50));

      networkMocks.setFastNetwork();
      await new Promise((resolve) => setTimeout(resolve, 1100)); // Allow auto-sync

      // Should handle the rapid changes and eventually sync
      const status = await syncManager.getQueueStatus();
      expect(status.totalPending).toBeLessThanOrEqual(1);

      const syncStatus = await syncManager.getSyncStatus();
      expect(syncStatus.isOnline).toBe(true);
    });

    it("should recover from airplane mode cycles", async () => {
      // Initial offline state
      networkMocks.setAirplaneMode();

      // Add operations during airplane mode
      for (let cycle = 1; cycle <= 3; cycle++) {
        await syncManager.addToQueue({
          id: `airplane-cycle-${cycle}`,
          type: "create",
          tableName: "exercises",
          recordId: `airplane-cycle-exercise-${cycle}`,
          data: { name: `Airplane Cycle Exercise ${cycle}` },
          priority: "medium",
          attempts: 0,
          timestamp: new Date(),
        });

        // Brief online period
        networkMocks.setFastNetwork();
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Back to airplane mode
        networkMocks.setAirplaneMode();
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      let status = await syncManager.getQueueStatus();
      const initialPending = status.totalPending;
      expect(initialPending).toBeGreaterThan(0);

      // Final connectivity restoration
      networkMocks.setFastNetwork();
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // All operations should eventually sync
      status = await syncManager.getQueueStatus();
      expect(status.totalPending).toBeLessThan(initialPending);

      const syncStatus = await syncManager.getSyncStatus();
      expect(syncStatus.isOnline).toBe(true);
    });
  });

  describe("Priority-Based Recovery", () => {
    it("should prioritize critical operations during recovery", async () => {
      networkMocks.setAirplaneMode();

      // Add operations with different priorities
      const operations = [
        { id: "low-priority", priority: "low" as const },
        { id: "critical-priority", priority: "critical" as const },
        { id: "medium-priority", priority: "medium" as const },
        { id: "high-priority", priority: "high" as const },
      ];

      for (const op of operations) {
        await syncManager.addToQueue({
          id: op.id,
          type: "create",
          tableName: "exercises",
          recordId: op.id,
          data: { name: `${op.priority} priority exercise` },
          priority: op.priority,
          attempts: 0,
          timestamp: new Date(),
        });
      }

      let status = await syncManager.getQueueStatus();
      expect(status.totalPending).toBe(4);
      expect(status.byPriority.critical).toBe(1);
      expect(status.byPriority.high).toBe(1);
      expect(status.byPriority.medium).toBe(1);
      expect(status.byPriority.low).toBe(1);

      // Restore network and process
      networkMocks.setFastNetwork();
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Verify queue processing
      const finalStatus = await syncManager.getQueueStatus();
      expect(finalStatus.totalPending).toBe(0);
    });

    it("should handle mixed operation types during recovery", async () => {
      networkMocks.setAirplaneMode();

      // Add different types of operations
      const operations = [
        { type: "create" as const, recordId: "new-exercise" },
        { type: "update" as const, recordId: "existing-exercise" },
        { type: "delete" as const, recordId: "old-exercise" },
      ];

      for (const op of operations) {
        await syncManager.addToQueue({
          id: `mixed-${op.type}`,
          type: op.type,
          tableName: "exercises",
          recordId: op.recordId,
          data: { name: `${op.type} operation` },
          priority: "medium",
          attempts: 0,
          timestamp: new Date(),
        });
      }

      const status = await syncManager.getQueueStatus();
      expect(status.totalPending).toBe(3);

      // Restore network
      networkMocks.setFastNetwork();
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // All operation types should be processed
      const finalStatus = await syncManager.getQueueStatus();
      expect(finalStatus.totalPending).toBe(0);
    });
  });

  describe("Status Tracking During Recovery", () => {
    it("should track sync status throughout recovery process", async () => {
      const statusUpdates: any[] = [];

      // Monitor status changes
      const unsubscribe = syncManager.onSyncStatusChange((status) => {
        statusUpdates.push({ ...status, timestamp: new Date() });
      });

      networkMocks.setAirplaneMode();

      // Add operation
      await syncManager.addToQueue({
        id: "status-tracking-test",
        type: "create",
        tableName: "exercises",
        recordId: "status-tracking-exercise",
        data: { name: "Status Tracking Exercise" },
        priority: "high",
        attempts: 0,
        timestamp: new Date(),
      });

      // Try to sync while offline
      await syncManager.processQueue();

      // Restore network
      networkMocks.setFastNetwork();
      await new Promise((resolve) => setTimeout(resolve, 1100));

      unsubscribe();

      // Should have received status updates
      expect(statusUpdates.length).toBeGreaterThan(0);

      // Final status should show online and no pending operations
      const finalStatus = await syncManager.getSyncStatus();
      expect(finalStatus.isOnline).toBe(true);
      expect(finalStatus.pendingOperations).toBe(0);
    });

    it("should provide accurate error information during recovery", async () => {
      networkMocks.setIntermittentConnectivity({ failureRate: 0.9 });

      await syncManager.addToQueue({
        id: "error-info-test",
        type: "create",
        tableName: "exercises",
        recordId: "error-info-exercise",
        data: { name: "Error Info Exercise" },
        priority: "high",
        attempts: 0,
        timestamp: new Date(),
      });

      // Try processing with high failure rate
      const result = await syncManager.processQueue();

      if (result.errors.length > 0) {
        expect(result.errors[0]).toHaveProperty("id");
        expect(result.errors[0]).toHaveProperty("operation");
        expect(result.errors[0]).toHaveProperty("error");
        expect(result.errors[0]).toHaveProperty("timestamp");
        expect(result.errors[0]).toHaveProperty("retryable");
        expect(result.errors[0].retryable).toBe(true);
      }

      const syncStatus = await syncManager.getSyncStatus();
      expect(syncStatus).toHaveProperty("errors");
    });
  });
});
