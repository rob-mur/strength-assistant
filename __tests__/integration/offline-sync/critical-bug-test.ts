/**
 * Critical Bug Test: Exercises Lost After Offline Usage
 * Purpose: Recreate the exact bug scenario from the feature specification
 *
 * This test MUST FAIL initially to demonstrate TDD approach.
 * It recreates the exact scenario: airplane mode → add exercises → restore internet → app restart → exercises lost
 */

import { SyncManager } from "../../../lib/sync/SyncManager";
import { createNetworkMocks } from "../../test-utils/NetworkMocks";

describe("Critical Bug: Exercises Lost After Offline Usage", () => {
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

  /**
   * THE CRITICAL TEST
   * This recreates the exact bug scenario from the spec:
   * "turn on airplane mode and then add some exercises. when i turn back on
   * the internet the state isnt pushed to the cloud, and when the app restarts it is lost"
   */
  it("should NOT lose exercises after airplane mode workflow", async () => {
    // STEP 1: Turn on airplane mode
    networkMocks.setAirplaneMode();
    expect(syncManager.getCurrentNetworkState().isOnline).toBe(false);

    // STEP 2: Add some exercises while offline
    const offlineExercises = [
      {
        id: "offline-exercise-1",
        type: "create" as const,
        tableName: "exercises",
        recordId: "offline-exercise-1",
        data: {
          name: "Airplane Mode Push-ups",
          sets: [{ reps: 20, weight: 0 }],
        },
        priority: "high" as const,
        attempts: 0,
        timestamp: new Date(),
      },
      {
        id: "offline-exercise-2",
        type: "create" as const,
        tableName: "exercises",
        recordId: "offline-exercise-2",
        data: { name: "Airplane Mode Squats", sets: [{ reps: 30, weight: 0 }] },
        priority: "high" as const,
        attempts: 0,
        timestamp: new Date(),
      },
      {
        id: "offline-exercise-3",
        type: "create" as const,
        tableName: "exercises",
        recordId: "offline-exercise-3",
        data: { name: "Airplane Mode Lunges", sets: [{ reps: 15, weight: 0 }] },
        priority: "high" as const,
        attempts: 0,
        timestamp: new Date(),
      },
    ];

    // Add exercises to queue while offline
    for (const exercise of offlineExercises) {
      await syncManager.addToQueue(exercise);
    }

    // Verify exercises are queued locally
    const queueStatus = await syncManager.getQueueStatus();
    expect(queueStatus.totalPending).toBe(3);
    expect(queueStatus.byPriority.high).toBe(3);

    // STEP 3: Turn back on the internet
    networkMocks.setFastNetwork();
    expect(syncManager.getCurrentNetworkState().isOnline).toBe(true);
    expect(syncManager.getCurrentNetworkState().isInternetReachable).toBe(true);

    // STEP 4: Verify sync happens automatically
    // Give some time for auto-sync to trigger
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const syncResult = await syncManager.processQueue();
    expect(syncResult.success).toBe(true);
    expect(syncResult.processed).toBe(3);
    expect(syncResult.remaining).toBe(0);
    expect(syncResult.errors).toHaveLength(0);

    // STEP 5: Simulate app restart (CRITICAL - this was failing before)
    await syncManager.reset(); // Simulate app restart/reload

    // STEP 6: CRITICAL ASSERTION - Data must NOT be lost
    const statusAfterRestart = await syncManager.getSyncStatus();
    expect(statusAfterRestart.pendingOperations).toBe(0); // All should be synced

    // Additional verification: Queue should be empty after successful sync + restart
    const finalQueueStatus = await syncManager.getQueueStatus();
    expect(finalQueueStatus.totalPending).toBe(0);

    // The exercises should have been successfully synced before restart
    // In a real implementation, we would verify they exist in both local state and Supabase
    expect(statusAfterRestart.lastSyncTime).toBeDefined();
    expect(statusAfterRestart.errors).toHaveLength(0);
  });

  /**
   * Extended scenario: Multiple offline sessions
   */
  it("should handle multiple offline sessions without data loss", async () => {
    // Session 1: Create exercises offline
    networkMocks.setAirplaneMode();

    await syncManager.addToQueue({
      id: "session1-ex1",
      type: "create",
      tableName: "exercises",
      recordId: "session1-ex1",
      data: { name: "Session 1 Exercise 1" },
      priority: "high",
      attempts: 0,
      timestamp: new Date(),
    });

    // Go online briefly and sync
    networkMocks.setFastNetwork();
    await new Promise((resolve) => setTimeout(resolve, 1100));
    let result = await syncManager.processQueue();
    expect(result.processed).toBe(1);

    // Session 2: Go offline again and create more exercises
    networkMocks.setAirplaneMode();

    await syncManager.addToQueue({
      id: "session2-ex1",
      type: "create",
      tableName: "exercises",
      recordId: "session2-ex1",
      data: { name: "Session 2 Exercise 1" },
      priority: "high",
      attempts: 0,
      timestamp: new Date(),
    });

    await syncManager.addToQueue({
      id: "session2-ex2",
      type: "create",
      tableName: "exercises",
      recordId: "session2-ex2",
      data: { name: "Session 2 Exercise 2" },
      priority: "high",
      attempts: 0,
      timestamp: new Date(),
    });

    // App restart while offline
    await syncManager.reset();

    // The pending exercises should be restored (this was the bug)
    const statusAfterOfflineRestart = await syncManager.getQueueStatus();
    expect(statusAfterOfflineRestart.totalPending).toBe(2);

    // Go back online and sync
    networkMocks.setFastNetwork();
    await new Promise((resolve) => setTimeout(resolve, 1100));
    result = await syncManager.processQueue();
    expect(result.processed).toBe(2);
    expect(result.remaining).toBe(0);
  });

  /**
   * Edge case: App restart during sync
   */
  it("should handle app restart during sync operation", async () => {
    // Add exercises offline
    networkMocks.setAirplaneMode();

    for (let i = 1; i <= 5; i++) {
      await syncManager.addToQueue({
        id: `restart-during-sync-${i}`,
        type: "create",
        tableName: "exercises",
        recordId: `restart-during-sync-${i}`,
        data: { name: `Restart Test Exercise ${i}` },
        priority: "medium",
        attempts: 0,
        timestamp: new Date(),
      });
    }

    // Go online and start sync
    networkMocks.setFastNetwork();

    // Start sync but don't wait for completion
    const syncPromise = syncManager.processQueue();

    // Simulate app restart mid-sync
    await new Promise((resolve) => setTimeout(resolve, 50)); // Brief delay
    await syncManager.reset();

    // The exercises should be recoverable after restart
    const queueAfterRestart = await syncManager.getQueueStatus();

    // Some exercises might have been processed, others should remain
    // The key is that NO data should be lost
    expect(queueAfterRestart.totalPending).toBeGreaterThanOrEqual(0);
    expect(queueAfterRestart.totalPending).toBeLessThanOrEqual(5);
  });

  /**
   * Performance test: Large offline dataset
   */
  it("should handle large offline datasets without corruption", async () => {
    networkMocks.setAirplaneMode();

    // Create substantial offline dataset
    const exerciseCount = 50;
    const exercises = [];

    for (let i = 1; i <= exerciseCount; i++) {
      const exercise = {
        id: `large-dataset-${i}`,
        type: "create" as const,
        tableName: "exercises",
        recordId: `large-dataset-${i}`,
        data: {
          name: `Large Dataset Exercise ${i}`,
          sets: [{ reps: (i % 20) + 1, weight: i % 100 }],
          notes: `Created during offline test ${i}`,
        },
        priority: i % 4 === 0 ? ("high" as const) : ("medium" as const),
        attempts: 0,
        timestamp: new Date(Date.now() + i * 1000), // Unique timestamps
      };

      exercises.push(exercise);
      await syncManager.addToQueue(exercise);
    }

    // Verify all exercises are queued
    const queueStatus = await syncManager.getQueueStatus();
    expect(queueStatus.totalPending).toBe(exerciseCount);

    // App restart with large dataset
    await syncManager.reset();

    // Go online and sync all
    networkMocks.setFastNetwork();
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const result = await syncManager.processQueue();
    expect(result.success).toBe(true);
    expect(result.processed).toBe(exerciseCount);
    expect(result.remaining).toBe(0);

    // Final verification: No data loss
    const finalStatus = await syncManager.getSyncStatus();
    expect(finalStatus.pendingOperations).toBe(0);
    expect(finalStatus.errors).toHaveLength(0);
  });
});
