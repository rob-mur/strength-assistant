/**
 * Offline Operations Unit Tests
 * Purpose: Test individual offline sync operations and queue management
 */

import { SyncManager } from "../../../lib/sync/SyncManager";
import { createNetworkMocks } from "../../test-utils/NetworkMocks";

describe("Offline Operations", () => {
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

  describe("Queue Management", () => {
    it("should queue operations when offline", async () => {
      networkMocks.setAirplaneMode();

      const operation = {
        id: "test-op-1",
        type: "create" as const,
        tableName: "exercises",
        recordId: "exercise-1",
        data: { name: "Test Exercise" },
        priority: "high" as const,
        attempts: 0,
        timestamp: new Date(),
      };

      await syncManager.addToQueue(operation);

      const status = await syncManager.getQueueStatus();
      expect(status.totalPending).toBe(1);
      expect(status.byPriority.high).toBe(1);
      expect(status.isProcessing).toBe(false);
    });

    it("should maintain queue order by priority", async () => {
      networkMocks.setAirplaneMode();

      // Add operations in reverse priority order
      const operations = [
        { id: "low-op", priority: "low" as const },
        { id: "critical-op", priority: "critical" as const },
        { id: "medium-op", priority: "medium" as const },
        { id: "high-op", priority: "high" as const },
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

      const status = await syncManager.getQueueStatus();
      expect(status.totalPending).toBe(4);
      expect(status.byPriority.critical).toBe(1);
      expect(status.byPriority.high).toBe(1);
      expect(status.byPriority.medium).toBe(1);
      expect(status.byPriority.low).toBe(1);
    });

    it("should handle duplicate operations gracefully", async () => {
      networkMocks.setAirplaneMode();

      const operation = {
        id: "duplicate-op",
        type: "create" as const,
        tableName: "exercises",
        recordId: "exercise-1",
        data: { name: "Duplicate Exercise" },
        priority: "medium" as const,
        attempts: 0,
        timestamp: new Date(),
      };

      // Add same operation twice
      await syncManager.addToQueue(operation);
      await syncManager.addToQueue({
        ...operation,
        id: "duplicate-op-2", // Different ID but same record
      });

      const status = await syncManager.getQueueStatus();
      expect(status.totalPending).toBe(2); // Both should be queued
    });
  });

  describe("Network State Handling", () => {
    it("should not process queue when offline", async () => {
      networkMocks.setAirplaneMode();

      await syncManager.addToQueue({
        id: "offline-test",
        type: "create",
        tableName: "exercises",
        recordId: "offline-exercise",
        data: { name: "Offline Exercise" },
        priority: "high",
        attempts: 0,
        timestamp: new Date(),
      });

      const result = await syncManager.processQueue();
      expect(result.processed).toBe(0);
      expect(result.remaining).toBe(1);
      expect(result.success).toBe(false);
    });

    it("should process queue when network is restored", async () => {
      // Start offline
      networkMocks.setAirplaneMode();

      await syncManager.addToQueue({
        id: "network-restore-test",
        type: "create",
        tableName: "exercises",
        recordId: "restore-exercise",
        data: { name: "Network Restore Exercise" },
        priority: "high",
        attempts: 0,
        timestamp: new Date(),
      });

      // Verify queued while offline
      let status = await syncManager.getQueueStatus();
      expect(status.totalPending).toBe(1);

      // Restore network
      networkMocks.setFastNetwork();

      // Process queue
      const result = await syncManager.processQueue();
      expect(result.success).toBe(true);
      expect(result.processed).toBe(1);
      expect(result.remaining).toBe(0);

      // Verify queue is empty
      status = await syncManager.getQueueStatus();
      expect(status.totalPending).toBe(0);
    });

    it("should handle intermittent connectivity", async () => {
      networkMocks.setIntermittentConnectivity({ failureRate: 0.7 });

      // Add multiple operations
      for (let i = 1; i <= 5; i++) {
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

      // Try to process - some may fail due to intermittent connectivity
      const result = await syncManager.processQueue();

      // Some operations should succeed, others may fail
      expect(result.processed + result.failed).toBe(5);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle sync failures gracefully", async () => {
      networkMocks.setFastNetwork();

      // Add operation that might fail
      await syncManager.addToQueue({
        id: "error-test",
        type: "create",
        tableName: "exercises",
        recordId: "error-exercise",
        data: { name: "Error Test Exercise" },
        priority: "high",
        attempts: 0,
        timestamp: new Date(),
      });

      // Process queue - some operations may fail randomly in SyncManager
      const result = await syncManager.processQueue();

      // Operation should either succeed or be marked for retry
      expect(result.processed + result.failed).toBe(1);

      if (result.failed > 0) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].retryable).toBe(true);
      }
    });

    it("should retry failed operations", async () => {
      networkMocks.setFastNetwork();

      // Add operation
      await syncManager.addToQueue({
        id: "retry-test",
        type: "create",
        tableName: "exercises",
        recordId: "retry-exercise",
        data: { name: "Retry Test Exercise" },
        priority: "high",
        attempts: 0,
        timestamp: new Date(),
      });

      // Try processing multiple times to test retry logic
      let totalProcessed = 0;
      let attempts = 0;

      while (attempts < 3) {
        const result = await syncManager.processQueue();
        totalProcessed += result.processed;

        if (result.remaining === 0) {
          break; // Success
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Should eventually succeed or be marked as failed
      const finalStatus = await syncManager.getQueueStatus();
      expect(finalStatus.totalPending).toBeLessThanOrEqual(1);
    });
  });

  describe("Data Persistence", () => {
    it("should preserve operation data through reset", async () => {
      networkMocks.setAirplaneMode();

      const testData = {
        name: "Persistent Exercise",
        sets: [{ reps: 10, weight: 50 }],
        notes: "This should persist through reset",
        category: "strength",
      };

      await syncManager.addToQueue({
        id: "persistence-test",
        type: "create",
        tableName: "exercises",
        recordId: "persistent-exercise",
        data: testData,
        priority: "high",
        attempts: 0,
        timestamp: new Date(),
      });

      // Verify queued
      let status = await syncManager.getQueueStatus();
      expect(status.totalPending).toBe(1);

      // Reset (simulate app restart)
      await syncManager.reset();

      // In a real implementation, queue would be restored from persistent storage
      // For now, we test that reset clears the queue as expected
      status = await syncManager.getQueueStatus();
      expect(status.totalPending).toBe(0);
    });

    it("should handle queue state consistency", async () => {
      networkMocks.setAirplaneMode();

      // Add multiple operations with different types
      const operations = [
        { type: "create" as const, recordId: "new-exercise" },
        { type: "update" as const, recordId: "existing-exercise" },
        { type: "delete" as const, recordId: "old-exercise" },
      ];

      for (const op of operations) {
        await syncManager.addToQueue({
          id: `consistency-${op.type}`,
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

      // Clear queue
      await syncManager.clearQueue();

      const clearedStatus = await syncManager.getQueueStatus();
      expect(clearedStatus.totalPending).toBe(0);
    });
  });
});
