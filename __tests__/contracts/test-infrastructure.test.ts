/**
 * Contract Test: Test Infrastructure Interface
 *
 * Validates that the TestDevice class and related infrastructure components
 * implement the required interfaces for multi-device testing scenarios.
 *
 * This test ensures the TestDevice implementation conforms to the contract
 * defined in specs/001-we-are-actually/contracts/test-infrastructure.ts
 */

import { TestDevice } from "../test-utils/TestDevice";
import MockFactoryCollectionImpl from "../test-utils/mocks/MockFactoryCollection";
import TestDataBuilderCollectionImpl from "../test-utils/builders/TestDataBuilderCollection";
import type {
  TestDevice as TestDeviceInterface,
  TestInfrastructureManager,
  MockFactoryCollection as MockFactoryInterface,
  TestDataBuilderCollection as TestDataBuilderInterface,
  TestAuthenticationState,
  NetworkSimulationConfig,
  SyncStatus,
  SyncOperation,
  TestDeviceState,
} from "../../specs/001-we-are-actually/contracts/test-infrastructure";

describe("Test Infrastructure Contract Compliance", () => {
  describe("TestDevice Interface Compliance", () => {
    let testDevice: TestDevice;

    beforeEach(async () => {
      testDevice = new TestDevice("test-device");
      await testDevice.init();
    });

    afterEach(async () => {
      await testDevice.cleanup();
    });

    it("should implement all required readonly properties", () => {
      // Required readonly properties from interface
      expect(typeof testDevice.deviceId).toBe("string");
      expect(typeof testDevice.deviceName).toBe("string");
      expect(typeof testDevice.initialized).toBe("boolean");
      expect(typeof testDevice.networkStatus).toBe("boolean");
      expect(typeof testDevice.authState).toBe("object");

      // Device should be initialized
      expect(testDevice.initialized).toBe(true);
      expect(testDevice.deviceName).toBe("test-device");
    });

    it("should implement initialization and cleanup methods", async () => {
      const newDevice = new TestDevice("cleanup-test");

      // Should not be initialized initially
      expect(newDevice.initialized).toBe(false);

      // Should initialize successfully
      await expect(newDevice.init()).resolves.not.toThrow();
      expect(newDevice.initialized).toBe(true);

      // Should cleanup successfully
      await expect(newDevice.cleanup()).resolves.not.toThrow();
    });

    it("should implement network control methods", async () => {
      // Default network status should be online
      expect(testDevice.networkStatus).toBe(true);

      // Should be able to set offline
      await expect(testDevice.setNetworkStatus(false)).resolves.not.toThrow();
      expect(testDevice.networkStatus).toBe(false);

      // Should be able to set back online
      await expect(testDevice.setNetworkStatus(true)).resolves.not.toThrow();
      expect(testDevice.networkStatus).toBe(true);
    });

    it("should implement network simulation methods", async () => {
      const networkConfig: NetworkSimulationConfig = {
        latencyMs: 100,
        failureRate: 0.1,
        intermittentConnectivity: true,
      };

      // Should enable network simulation
      await expect(
        testDevice.simulateNetworkIssues(true, networkConfig),
      ).resolves.not.toThrow();

      // Should disable network simulation
      await expect(
        testDevice.simulateNetworkIssues(false),
      ).resolves.not.toThrow();
    });

    it("should implement authentication methods", async () => {
      const testEmail = "test@example.com";
      const testPassword = "testpassword123";

      // Should implement signUp
      await expect(
        testDevice.signUp(testEmail, testPassword),
      ).resolves.toBeDefined();

      // Should implement signOut
      await expect(testDevice.signOut()).resolves.not.toThrow();

      // Should implement signIn
      await expect(
        testDevice.signIn(testEmail, testPassword),
      ).resolves.toBeDefined();

      // Should implement signOutAll
      await expect(testDevice.signOutAll()).resolves.not.toThrow();
    });

    it("should implement exercise CRUD methods", async () => {
      const exerciseName = "Test Exercise";

      // Should implement addExercise
      const exercise = await testDevice.addExercise(exerciseName);
      expect(exercise).toBeDefined();
      expect(exercise.name).toBe(exerciseName);
      expect(typeof exercise.id).toBe("string");

      // Should implement getExercises
      const exercises = await testDevice.getExercises();
      expect(Array.isArray(exercises)).toBe(true);
      expect(exercises.length).toBeGreaterThan(0);

      // Should implement getExercise
      const retrievedExercise = await testDevice.getExercise(exercise.id);
      expect(retrievedExercise).not.toBeNull();
      expect(retrievedExercise?.id).toBe(exercise.id);

      // Should implement updateExercise
      const newName = "Updated Exercise";
      const updatedExercise = await testDevice.updateExercise(
        exercise.id,
        newName,
      );
      expect(updatedExercise.name).toBe(newName);

      // Should implement deleteExercise
      await expect(
        testDevice.deleteExercise(exercise.id),
      ).resolves.not.toThrow();

      // Exercise should be deleted
      const deletedExercise = await testDevice.getExercise(exercise.id);
      expect(deletedExercise).toBeNull();
    });

    it("should implement sync status methods", async () => {
      const exercise = await testDevice.addExercise("Sync Test Exercise");

      // Should implement getSyncStatus
      const syncStatus = await testDevice.getSyncStatus(exercise.id);
      expect(typeof syncStatus).toBe("string");
      expect(["pending", "synced", "error", "retrying"]).toContain(syncStatus);

      // Should implement waitForSyncComplete
      await expect(testDevice.waitForSyncComplete(1000)).resolves.not.toThrow();

      // Should implement retryFailedSyncs
      await expect(testDevice.retryFailedSyncs()).resolves.not.toThrow();

      // Should implement getPendingSyncOperations
      const pendingOps = await testDevice.getPendingSyncOperations();
      expect(Array.isArray(pendingOps)).toBe(true);
    });

    it("should implement real-time subscription methods", async () => {
      let callbackInvoked = false;
      let receivedExercises: any[] = [];

      const unsubscribe = testDevice.subscribeToExerciseChanges((exercises) => {
        callbackInvoked = true;
        receivedExercises = exercises;
      });

      // Should return unsubscribe function
      expect(typeof unsubscribe).toBe("function");

      // Add exercise to trigger callback
      await testDevice.addExercise("Subscription Test");

      // Allow some time for callback
      await testDevice.waitFor(50);

      // Cleanup subscription
      unsubscribe();

      // Should have called callback
      expect(callbackInvoked).toBe(true);
      expect(Array.isArray(receivedExercises)).toBe(true);
    });

    it("should implement utility methods", async () => {
      // Should implement waitFor
      const startTime = Date.now();
      await testDevice.waitFor(50);
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(45); // Allow some tolerance

      // Should implement getDeviceState
      const deviceState = testDevice.getDeviceState();
      expect(deviceState).toBeDefined();
      expect(deviceState.device).toBeDefined();
      expect(deviceState.network).toBeDefined();
      expect(deviceState.auth).toBeDefined();
      expect(deviceState.data).toBeDefined();
      expect(deviceState.sync).toBeDefined();
    });

    it("should maintain type safety for all return types", async () => {
      // Test return type conformance
      const exercise = await testDevice.addExercise("Type Test");
      expect(exercise).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
      });

      const exercises = await testDevice.getExercises();
      expect(Array.isArray(exercises)).toBe(true);

      const syncStatus = await testDevice.getSyncStatus(exercise.id);
      expect(["pending", "synced", "error", "retrying"]).toContain(syncStatus);

      const pendingOps = await testDevice.getPendingSyncOperations();
      expect(Array.isArray(pendingOps)).toBe(true);

      const deviceState = testDevice.getDeviceState();
      expect(deviceState).toMatchObject({
        device: expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          initialized: expect.any(Boolean),
        }),
        network: expect.objectContaining({
          online: expect.any(Boolean),
          simulatingIssues: expect.any(Boolean),
        }),
        auth: expect.any(Object),
        data: expect.objectContaining({
          exercises: expect.any(Array),
          pendingSyncOperations: expect.any(Array),
        }),
        sync: expect.objectContaining({
          inProgress: expect.any(Boolean),
        }),
      });
    });
  });

  describe("MockFactoryCollection Interface Compliance", () => {
    let mockFactory: MockFactoryCollectionImpl;

    beforeEach(() => {
      mockFactory = new MockFactoryCollectionImpl();
    });

    it("should implement all required factory properties", () => {
      expect(mockFactory.exerciseFactory).toBeDefined();
      expect(mockFactory.userFactory).toBeDefined();
      expect(mockFactory.syncStateFactory).toBeDefined();
      expect(mockFactory.authFactory).toBeDefined();
      expect(mockFactory.serviceFactory).toBeDefined();
    });

    it("should create valid exercises through exerciseFactory", () => {
      const exercise = mockFactory.exerciseFactory.createExercise();
      expect(exercise).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
      });

      const exercises = mockFactory.exerciseFactory.createExercises(3, "Test");
      expect(exercises).toHaveLength(3);
      expect(exercises[0].name).toContain("Test");
    });

    it("should create valid users through userFactory", () => {
      const user = mockFactory.userFactory.createUser();
      expect(user).toBeDefined();

      const anonymousUser = mockFactory.userFactory.createAnonymousUser();
      expect(anonymousUser).toBeDefined();

      const authUser =
        mockFactory.userFactory.createAuthenticatedUser("test@example.com");
      expect(authUser).toBeDefined();
    });

    it("should create valid sync states through syncStateFactory", () => {
      const syncState = mockFactory.syncStateFactory.createSyncState(
        "create",
        "pending",
      );
      expect(syncState).toBeDefined();
      expect(syncState.operation).toBe("create");
      expect(syncState.status).toBe("pending");

      const pendingOps =
        mockFactory.syncStateFactory.createPendingSyncOperations(2);
      expect(pendingOps).toHaveLength(2);
    });
  });

  describe("TestDataBuilderCollection Interface Compliance", () => {
    let builderCollection: TestDataBuilderCollectionImpl;

    beforeEach(() => {
      builderCollection = new TestDataBuilderCollectionImpl();
    });

    it("should implement all required builder properties", () => {
      expect(builderCollection.scenarioBuilder).toBeDefined();
      expect(builderCollection.exerciseBuilder).toBeDefined();
      expect(builderCollection.userBuilder).toBeDefined();
      expect(builderCollection.syncBuilder).toBeDefined();
    });

    it("should build valid exercises through exerciseBuilder", () => {
      const exercise = builderCollection.exerciseBuilder
        .withName("Builder Test")
        .withId("test-id")
        .build();

      expect(exercise.name).toBe("Builder Test");
      expect(exercise.id).toBe("test-id");
    });

    it("should build valid users through userBuilder", () => {
      const user = builderCollection.userBuilder
        .withEmail("builder@example.com")
        .withId("builder-user-id")
        .build();

      expect(user).toBeDefined();
    });

    it("should create valid scenarios through scenarioBuilder", () => {
      const anonymousScenario =
        builderCollection.scenarioBuilder.anonymousUserScenario();
      expect(anonymousScenario).toBeDefined();
      expect(anonymousScenario.name).toBeDefined();
      expect(anonymousScenario.description).toBeDefined();

      const authScenario =
        builderCollection.scenarioBuilder.authenticatedUserScenario(
          "test@example.com",
        );
      expect(authScenario).toBeDefined();

      const multiDeviceScenario =
        builderCollection.scenarioBuilder.multiDeviceSyncScenario(
          2,
          "test@example.com",
        );
      expect(multiDeviceScenario).toBeDefined();
    });
  });

  describe("Integration: Infrastructure Components Working Together", () => {
    it("should allow TestDevice to work with mock factories", async () => {
      const mockFactory = new MockFactoryCollectionImpl();
      const testDevice = new TestDevice("integration-test");
      await testDevice.init();

      // Create mock exercise using factory
      const mockExercise = mockFactory.exerciseFactory.createExercise({
        name: "Mock Integration",
      });

      // Add similar exercise through device
      const deviceExercise = await testDevice.addExercise("Device Integration");

      // Both should be valid exercises
      expect(mockExercise.name).toBe("Mock Integration");
      expect(deviceExercise.name).toBe("Device Integration");

      await testDevice.cleanup();
    });

    it("should allow TestDevice to work with data builders", async () => {
      const builderCollection = new TestDataBuilderCollectionImpl();
      const testDevice = new TestDevice("builder-integration");
      await testDevice.init();

      // Create exercise using builder
      const builtExercise = builderCollection.exerciseBuilder
        .withName("Built Exercise")
        .build();

      // Create exercise using device
      const deviceExercise = await testDevice.addExercise("Device Exercise");

      // Both should have expected structure
      expect(builtExercise.name).toBe("Built Exercise");
      expect(deviceExercise.name).toBe("Device Exercise");
      expect(typeof builtExercise.id).toBe("string");
      expect(typeof deviceExercise.id).toBe("string");

      await testDevice.cleanup();
    });

    it("should support complex multi-device scenarios", async () => {
      const builderCollection = new TestDataBuilderCollectionImpl();
      const scenario =
        builderCollection.scenarioBuilder.multiDeviceSyncScenario(
          2,
          "multi@example.com",
        );

      // Create devices based on scenario
      const device1 = new TestDevice("device-1");
      const device2 = new TestDevice("device-2");

      await device1.init();
      await device2.init();

      // Both devices should be operational
      expect(device1.initialized).toBe(true);
      expect(device2.initialized).toBe(true);
      expect(device1.networkStatus).toBe(true);
      expect(device2.networkStatus).toBe(true);

      // Should be able to perform operations on both
      await device1.addExercise("Device 1 Exercise");
      await device2.addExercise("Device 2 Exercise");

      const device1Exercises = await device1.getExercises();
      const device2Exercises = await device2.getExercises();

      expect(device1Exercises.length).toBeGreaterThan(0);
      expect(device2Exercises.length).toBeGreaterThan(0);

      await device1.cleanup();
      await device2.cleanup();
    });
  });
});
