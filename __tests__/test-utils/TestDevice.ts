/**
 * TestDevice Implementation
 *
 * Critical test infrastructure class that was missing and blocking 80 failing tests.
 * Provides device simulation for multi-device testing scenarios with full authentication,
 * exercise CRUD operations, sync status tracking, and real-time subscription management.
 */

import { v4 as uuidv4 } from "uuid";
import { Exercise } from "../../lib/models/Exercise";
import {
  UserAccount,
  createAnonymousUser,
  createAuthenticatedUser,
} from "../../lib/models/UserAccount";
import type {
  TestAuthenticationState,
  NetworkSimulationConfig,
  SyncStatus,
  SyncOperation,
  TestDeviceState,
} from "../../specs/001-we-are-actually/contracts/test-infrastructure";

// Exercise contract format for integration tests
interface ExerciseContractFormat {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  userId?: string;
}

export interface TestDeviceOptions {
  deviceId?: string;
  deviceName?: string;
  networkConnected?: boolean;
  storageEnabled?: boolean;
  anonymous?: boolean;
}

/**
 * TestDevice class implementing the full contract interface
 *
 * This class was identified as the primary blocker for test failures.
 * It simulates a device for testing cross-device sync, authentication,
 * and exercise management scenarios.
 */
export class TestDevice {
  private readonly _deviceId: string;
  private readonly _deviceName: string;
  private _initialized: boolean = false;
  private _networkStatus: boolean = true;
  private _authState: TestAuthenticationState;
  private _exercises: Exercise[] = [];
  private _syncQueue: SyncOperation[] = [];
  private readonly _subscriptions: Set<(exercises: Exercise[]) => void> =
    new Set();
  private _networkSimulation: {
    enabled: boolean;
    latencyMs: number;
    failureRate: number;
    intermittentConnectivity: boolean;
  } = {
    enabled: false,
    latencyMs: 0,
    failureRate: 0,
    intermittentConnectivity: false,
  };

  constructor(options: TestDeviceOptions | string) {
    if (typeof options === "string") {
      // Legacy string constructor
      this._deviceId = uuidv4();
      this._deviceName = options;
      this._networkStatus = true;
    } else {
      // New options constructor
      this._deviceId = options.deviceId || uuidv4();
      this._deviceName = options.deviceName || "TestDevice";
      this._networkStatus = options.networkConnected ?? true;
    }

    this._authState = {
      authenticated: false,
      currentUser: undefined,
      session: undefined,
    };

    // Set up anonymous user if specified
    if (typeof options === "object" && options.anonymous) {
      const anonymousUser = createAnonymousUser();
      this._authState.currentUser = anonymousUser;
      this._authState.authenticated = false; // Anonymous users are not authenticated
    }
  }

  // Readonly Properties
  get deviceId(): string {
    return this._deviceId;
  }

  get deviceName(): string {
    return this._deviceName;
  }

  get initialized(): boolean {
    return this._initialized;
  }

  get networkStatus(): boolean {
    return this._networkStatus;
  }

  get authState(): TestAuthenticationState {
    return { ...this._authState };
  }

  // Core Device Lifecycle
  async init(): Promise<void> {
    if (this._initialized) {
      throw new Error("TestDevice is already initialized");
    }

    // Reset state to clean baseline
    this._exercises = [];
    this._syncQueue = [];
    this._subscriptions.clear();

    // Preserve anonymous user if it was set in constructor, otherwise reset auth state
    if (!this._authState.currentUser?.isAnonymous) {
      this._authState = {
        authenticated: false,
        currentUser: undefined,
        session: undefined,
      };
    }
    // Note: Don't override _networkStatus here - preserve constructor setting
    this._networkSimulation.enabled = false;

    this._initialized = true;

    // Simulate initialization delay
    await this._simulateNetworkDelay();
  }

  async cleanup(): Promise<void> {
    if (!this._initialized) {
      return; // Already cleaned up or never initialized
    }

    // Sign out all users
    await this.signOutAll();

    // Clear all data
    this._exercises = [];
    this._syncQueue = [];

    // Clean up subscriptions
    this._subscriptions.clear();

    // Reset network simulation
    this._networkSimulation = {
      enabled: false,
      latencyMs: 0,
      failureRate: 0,
      intermittentConnectivity: false,
    };

    this._initialized = false;

    // Simulate cleanup delay
    await this._simulateNetworkDelay();
  }

  // Network Simulation
  async setNetworkStatus(online: boolean): Promise<void> {
    this._ensureInitialized();
    this._networkStatus = online;

    // If going offline, mark pending sync operations
    if (!online) {
      this._syncQueue.forEach((op) => {
        if (op.status === "pending") {
          op.status = "error";
          op.lastError = "Network offline";
        }
      });
    }

    await this._simulateNetworkDelay();
  }

  async simulateNetworkIssues(
    enabled: boolean,
    config?: NetworkSimulationConfig,
  ): Promise<void> {
    this._ensureInitialized();

    this._networkSimulation.enabled = enabled;
    if (enabled && config) {
      this._networkSimulation.latencyMs = config.latencyMs || 100;
      this._networkSimulation.failureRate = config.failureRate || 0.1;
      this._networkSimulation.intermittentConnectivity =
        config.intermittentConnectivity || false;
    }

    await this._simulateNetworkDelay();
  }

  isNetworkConnected(): boolean {
    return this._networkStatus;
  }

  // Authentication Methods
  private async doAuth(email: string): Promise<UserAccount> {
    this._ensureInitialized();
    this._ensureNetworkConnected();
    await this._simulateNetworkDelay();
    this._simulateNetworkFailure();
    const user = createAuthenticatedUser(email);
    this._authState = {
      authenticated: true,
      currentUser: user,
      session: {
        sessionId: uuidv4(),
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        accessToken: `access_${uuidv4()}`,
        refreshToken: `refresh_${uuidv4()}`,
      },
    };
    return user;
  }

  async signUp(email: string, _password: string): Promise<UserAccount> {
    return this.doAuth(email);
  }

  async signIn(email: string, _password: string): Promise<UserAccount> {
    return this.doAuth(email);
  }

  async signOut(): Promise<void> {
    this._ensureInitialized();

    // Simulate sign out delay
    await this._simulateNetworkDelay();

    // Reset to anonymous state
    this._authState = {
      authenticated: false,
      currentUser: createAnonymousUser(),
      session: undefined,
    };
  }

  async signOutAll(): Promise<void> {
    this._ensureInitialized();

    // Simulate sign out all delay
    await this._simulateNetworkDelay();

    // Reset to completely unauthenticated state
    this._authState = {
      authenticated: false,
      currentUser: undefined,
      session: undefined,
    };

    // Clear user-specific data
    this._exercises = [];
    this._syncQueue = [];
  }

  // Exercise CRUD Operations
  async addExercise(name: string): Promise<ExerciseContractFormat> {
    this._ensureInitialized();

    // Simulate add delay
    await this._simulateNetworkDelay();

    const exercise: Exercise = {
      id: uuidv4(),
      name: name.trim(),
      user_id:
        this._authState.currentUser && "id" in this._authState.currentUser
          ? (this._authState.currentUser as { id: string }).id
          : "anonymous",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted: false,
    };

    this._exercises.push(exercise);

    // Add to sync queue for local-first behavior (will sync when network available)
    this._addToSyncQueue("create", exercise.id, "exercise", exercise);

    // Notify subscribers
    this._notifySubscribers();

    // Transform to contract format expected by integration tests
    return this._transformExerciseToContractFormat(exercise);
  }

  async updateExercise(
    id: string,
    name: string,
  ): Promise<ExerciseContractFormat> {
    this._ensureInitialized();

    // Simulate update delay
    await this._simulateNetworkDelay();

    const exerciseIndex = this._exercises.findIndex((e) => e.id === id);
    if (exerciseIndex === -1) {
      throw new Error(`Exercise with id ${id} not found`);
    }

    const updatedExercise = {
      ...this._exercises[exerciseIndex],
      name: name.trim(),
      updated_at: new Date().toISOString(), // Update timestamp
    };

    this._exercises[exerciseIndex] = updatedExercise;

    // Add to sync queue for local-first behavior (will sync when network available)
    this._addToSyncQueue(
      "update",
      updatedExercise.id,
      "exercise",
      updatedExercise,
    );

    // Notify subscribers
    this._notifySubscribers();

    // Transform to contract format expected by integration tests
    return this._transformExerciseToContractFormat(updatedExercise);
  }

  async deleteExercise(id: string): Promise<void> {
    this._ensureInitialized();

    // Simulate delete delay
    await this._simulateNetworkDelay();

    const exerciseIndex = this._exercises.findIndex((e) => e.id === id);
    if (exerciseIndex === -1) {
      throw new Error(`Exercise with id ${id} not found`);
    }

    this._exercises.splice(exerciseIndex, 1);

    // Add to sync queue for local-first behavior (will sync when network available)
    this._addToSyncQueue("delete", id, "exercise", null);

    // Notify subscribers
    this._notifySubscribers();
  }

  async getExercises(): Promise<ExerciseContractFormat[]> {
    this._ensureInitialized();

    // Simulate get delay
    await this._simulateNetworkDelay();

    // Transform all exercises to contract format
    return this._exercises.map((exercise) =>
      this._transformExerciseToContractFormat(exercise),
    );
  }

  async getExercise(id: string): Promise<ExerciseContractFormat | null> {
    this._ensureInitialized();

    // Simulate get delay
    await this._simulateNetworkDelay();

    const exercise = this._exercises.find((e) => e.id === id);
    return exercise ? this._transformExerciseToContractFormat(exercise) : null;
  }

  // Sync Operations
  async getSyncStatus(exerciseId: string): Promise<SyncStatus> {
    this._ensureInitialized();

    // Find most recent sync operation for this exercise
    const syncOps = this._syncQueue.filter((op) => op.recordId === exerciseId);
    const sortedSyncOps =
      typeof syncOps.toSorted === "function"
        ? syncOps.toSorted(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          )
        : [...syncOps].sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          );
    const syncOp = sortedSyncOps[0];

    if (!syncOp) {
      return "synced"; // No pending operations
    }

    return syncOp.status;
  }

  async waitForSyncComplete(timeoutMs: number = 10000): Promise<void> {
    this._ensureInitialized();

    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const pendingOps = this._syncQueue.filter(
        (op) => op.status === "pending" || op.status === "retrying",
      );

      if (pendingOps.length === 0) {
        return; // All sync operations complete
      }

      await this.waitFor(100); // Check every 100ms
    }

    throw new Error("Timeout waiting for sync to complete");
  }

  subscribeToExerciseChanges(
    callback: (exercises: Exercise[]) => void,
  ): () => void {
    this._ensureInitialized();

    this._subscriptions.add(callback);

    // Return unsubscribe function
    return () => {
      this._subscriptions.delete(callback);
    };
  }

  async retryFailedSyncs(): Promise<void> {
    this._ensureInitialized();

    if (!this._networkStatus) {
      throw new Error("Cannot retry syncs while offline");
    }

    // Find failed sync operations and retry them
    const failedOps = this._syncQueue.filter((op) => op.status === "error");

    for (const op of failedOps) {
      op.status = "retrying";
      op.retryCount += 1;
      op.lastAttemptAt = new Date();

      // Simulate retry delay
      await this._simulateNetworkDelay();

      // Simulate retry success/failure
      if (Math.random() < 0.8) {
        // 80% success rate for retries
        op.status = "synced";
      } else {
        op.status = "error";
        op.lastError = "Retry failed";
      }
    }
  }

  async getPendingSyncOperations(): Promise<SyncOperation[]> {
    this._ensureInitialized();

    return this._syncQueue.filter(
      (op) => op.status === "pending" || op.status === "retrying",
    );
  }

  // Utility Methods
  async waitFor(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getDeviceState(): TestDeviceState {
    return {
      device: {
        id: this._deviceId,
        name: this._deviceName,
        initialized: this._initialized,
      },
      network: {
        online: this._networkStatus,
        simulatingIssues: this._networkSimulation.enabled,
      },
      auth: this._authState,
      data: {
        exercises: [...this._exercises],
        pendingSyncOperations: [...this._syncQueue],
      },
      sync: {
        inProgress: this._syncQueue.some(
          (op) => op.status === "pending" || op.status === "retrying",
        ),
        lastSyncAt: this._getLastSyncTime(),
        failedOperations: this._syncQueue.filter((op) => op.status === "error")
          .length,
      },
    };
  }

  async getMemoryUsage(): Promise<{
    heapUsed: number;
    heapTotal: number;
    rss?: number;
  }> {
    // Simulate memory usage for testing
    // In real implementation, this would use process.memoryUsage()
    const baseMemory = 50 * 1024 * 1024; // 50MB base
    const exerciseMemory = this._exercises.length * 1024; // ~1KB per exercise
    const syncMemory = this._syncQueue.length * 512; // ~512B per sync operation

    const heapUsed = baseMemory + exerciseMemory + syncMemory;
    const heapTotal = heapUsed * 1.5; // Simulate heap overhead

    return {
      heapUsed,
      heapTotal,
      rss: heapTotal * 1.2,
    };
  }

  // Private Helper Methods
  private _ensureInitialized(): void {
    if (!this._initialized) {
      throw new Error(
        "TestDevice must be initialized before use. Call init() first.",
      );
    }
  }

  private _ensureNetworkConnected(): void {
    if (!this._networkStatus) {
      throw new Error("Network is offline. Cannot perform network operations.");
    }
  }

  private async _simulateNetworkDelay(): Promise<void> {
    if (!this._networkSimulation.enabled) {
      return;
    }

    const delay = this._networkSimulation.latencyMs || 0;
    if (delay > 0) {
      await this.waitFor(delay);
    }
  }

  private _simulateNetworkFailure(): void {
    if (!this._networkSimulation.enabled) {
      return;
    }

    if (Math.random() < this._networkSimulation.failureRate) {
      throw new Error("Simulated network failure");
    }
  }

  private _addToSyncQueue(
    operation: "create" | "update" | "delete",
    recordId: string,
    recordType: string,
    data: Exercise | null,
  ): void {
    const syncOperation: SyncOperation = {
      id: uuidv4(),
      type: operation,
      recordId,
      recordType,
      data,
      status: "pending",
      retryCount: 0,
      createdAt: new Date(),
      lastAttemptAt: new Date(),
    };

    this._syncQueue.push(syncOperation);

    // Simulate async sync processing
    setTimeout(() => {
      const op = this._syncQueue.find((o) => o.id === syncOperation.id);
      if (op && op.status === "pending") {
        if (this._networkStatus && Math.random() < 0.9) {
          // 90% success rate
          op.status = "synced";
        } else {
          op.status = "error";
          op.lastError = this._networkStatus
            ? "Server error"
            : "Network offline";
        }
      }
    }, 500); // Simulate 500ms sync delay
  }

  private _notifySubscribers(): void {
    const exercises = [...this._exercises];
    this._subscriptions.forEach((callback) => {
      try {
        callback(exercises);
      } catch (error) {
        console.error("Error in exercise change subscription callback:", error);
      }
    });
  }

  private _getLastSyncTime(): Date | undefined {
    const syncedOps = this._syncQueue.filter((op) => op.status === "synced");
    if (syncedOps.length === 0) {
      return undefined;
    }

    const sortedSyncedOps =
      typeof syncedOps.toSorted === "function"
        ? syncedOps.toSorted(
            (a, b) => b.lastAttemptAt!.getTime() - a.lastAttemptAt!.getTime(),
          )
        : [...syncedOps].sort(
            (a, b) => b.lastAttemptAt!.getTime() - a.lastAttemptAt!.getTime(),
          );
    return sortedSyncedOps[0].lastAttemptAt!;
  }

  // Sync State Methods
  getPendingSyncCount(): number {
    return this._syncQueue.filter((op) => op.status === "pending").length;
  }

  /**
   * Transform Exercise object to contract format expected by integration tests
   */
  private _transformExerciseToContractFormat(
    exercise: Exercise,
  ): ExerciseContractFormat {
    // Determine sync status based on sync queue
    let syncStatus: SyncStatus = "synced";

    const syncOps = this._syncQueue.filter((op) => op.recordId === exercise.id);
    let sortedSyncOps;
    if (typeof syncOps.toSorted === "function") {
      sortedSyncOps = syncOps.toSorted(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    } else {
      sortedSyncOps = [...syncOps];
      sortedSyncOps.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    }
    const syncOp = sortedSyncOps[0]; // Most recent

    if (syncOp) {
      syncStatus = syncOp.status;
    } else if (!this._authState.authenticated || !this._networkStatus) {
      // If offline or anonymous, exercises are locally pending
      syncStatus = "pending";
    }

    // Transform to contract format
    return {
      id: exercise.id,
      name: exercise.name,
      createdAt: exercise.created_at, // ISO string format expected by tests
      updatedAt: exercise.updated_at, // ISO string format expected by tests
      syncStatus,
      // userId should be undefined for anonymous users per test expectations
      userId:
        (this._authState.currentUser &&
          "isAnonymous" in this._authState.currentUser &&
          (this._authState.currentUser as { isAnonymous: boolean })
            .isAnonymous) ||
        exercise.user_id === "anonymous"
          ? undefined
          : exercise.user_id,
    };
  }
}

// Export for tests
export default TestDevice;
