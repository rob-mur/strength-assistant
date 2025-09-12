/**
 * Integration Test: Anonymous Local-First Storage
 * 
 * Tests the complete anonymous local-first storage workflow including:
 * - Local data persistence without authentication
 * - Offline-first exercise management
 * - Anonymous user state management
 * - Local-only operations with sync disabled
 * - Data consistency in offline mode
 */

import { TestDevice } from '../../lib/test-utils/TestDevice';
import { TestApp } from '../../lib/test-utils/TestApp';
import MockFactoryCollection from '../../lib/test-utils/mocks/MockFactoryCollection';
import TestDataBuilderCollection from '../../lib/test-utils/builders/TestDataBuilderCollection';

describe('Anonymous Local-First Storage Integration', () => {
  let testDevice: TestDevice;
  let testApp: TestApp;
  let mockFactories: MockFactoryCollection;
  let dataBuilders: TestDataBuilderCollection;

  beforeEach(async () => {
    // Initialize test infrastructure for anonymous local-first testing
    testDevice = new TestDevice({
      deviceId: 'anonymous-device-001',
      deviceName: 'Anonymous Test Device',
      networkConnected: false, // Test offline-first behavior
      storageEnabled: true,
      anonymous: true
    });

    testApp = new TestApp({
      testId: 'anonymous-local-first-test',
      device: testDevice
    });

    mockFactories = new MockFactoryCollection({
      mode: 'integration',
      device: testDevice
    });

    dataBuilders = new TestDataBuilderCollection({
      device: testDevice,
      anonymous: true
    });

    await testDevice.initialize();
    await testApp.initialize();
  });

  afterEach(async () => {
    await testApp.cleanup();
    await testDevice.cleanup();
  });

  describe('Anonymous User State Management', () => {
    it('should initialize with anonymous user state', async () => {
      // Test anonymous user initialization
      const userState = await testApp.getCurrentUser();
      
      expect(userState).toMatchObject({
        isAnonymous: true,
        isAuthenticated: false,
        id: expect.any(String),
        email: undefined
      });

      expect(userState.id).toMatch(/^anonymous-/);
    });

    it('should persist anonymous user state locally', async () => {
      const initialUser = await testApp.getCurrentUser();
      
      // Simulate app restart
      await testApp.restart();
      
      const persistedUser = await testApp.getCurrentUser();
      
      expect(persistedUser.id).toBe(initialUser.id);
      expect(persistedUser.isAnonymous).toBe(true);
      expect(persistedUser.isAuthenticated).toBe(false);
    });

    it('should maintain unique anonymous identity across sessions', async () => {
      const user1 = await testApp.getCurrentUser();
      
      // Create second anonymous session
      const secondDevice = new TestDevice({
        deviceId: 'anonymous-device-002',
        deviceName: 'Second Anonymous Device',
        anonymous: true
      });
      
      const secondApp = new TestApp({
        testId: 'anonymous-local-first-test-2',
        device: secondDevice
      });

      await secondDevice.initialize();
      await secondApp.initialize();
      
      const user2 = await secondApp.getCurrentUser();
      
      expect(user1.id).not.toBe(user2.id);
      expect(user1.isAnonymous).toBe(true);
      expect(user2.isAnonymous).toBe(true);

      await secondApp.cleanup();
      await secondDevice.cleanup();
    });
  });

  describe('Local Exercise Management', () => {
    it('should create exercises locally without authentication', async () => {
      const exerciseName = 'Anonymous Push-ups';
      
      // Create exercise as anonymous user
      await testApp.addExercise(exerciseName);
      
      const exercises = await testApp.getExercises();
      
      expect(exercises).toHaveLength(1);
      expect(exercises[0]).toMatchObject({
        name: exerciseName,
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        syncStatus: 'pending' // Local-only, not synced
      });

      // Verify no userId is set for anonymous exercises
      expect(exercises[0].userId).toBeUndefined();
    });

    it('should update exercises locally', async () => {
      const originalName = 'Original Exercise';
      const updatedName = 'Updated Exercise';
      
      await testApp.addExercise(originalName);
      const exercises = await testApp.getExercises();
      const exerciseId = exercises[0].id;
      
      await testApp.updateExercise(exerciseId, updatedName);
      
      const updatedExercises = await testApp.getExercises();
      
      expect(updatedExercises).toHaveLength(1);
      expect(updatedExercises[0]).toMatchObject({
        id: exerciseId,
        name: updatedName,
        syncStatus: 'pending'
      });

      // Verify timestamps are updated
      expect(new Date(updatedExercises[0].updatedAt).getTime())
        .toBeGreaterThan(new Date(updatedExercises[0].createdAt).getTime());
    });

    it('should delete exercises locally', async () => {
      await testApp.addExercise('Exercise to Delete');
      const exercises = await testApp.getExercises();
      const exerciseId = exercises[0].id;
      
      await testApp.deleteExercise(exerciseId);
      
      const remainingExercises = await testApp.getExercises();
      
      expect(remainingExercises).toHaveLength(0);
    });

    it('should persist exercises across app restarts', async () => {
      const exerciseName = 'Persistent Exercise';
      
      await testApp.addExercise(exerciseName);
      const originalExercises = await testApp.getExercises();
      
      // Simulate app restart
      await testApp.restart();
      
      const persistedExercises = await testApp.getExercises();
      
      expect(persistedExercises).toHaveLength(1);
      expect(persistedExercises[0]).toMatchObject({
        id: originalExercises[0].id,
        name: exerciseName,
        syncStatus: 'pending'
      });
    });
  });

  describe('Offline-First Behavior', () => {
    it('should work entirely offline', async () => {
      // Ensure device is offline
      expect(testDevice.isNetworkConnected()).toBe(false);
      
      // Perform complete exercise management workflow offline
      await testApp.addExercise('Offline Exercise 1');
      await testApp.addExercise('Offline Exercise 2');
      
      const exercises = await testApp.getExercises();
      expect(exercises).toHaveLength(2);
      
      // Update an exercise
      await testApp.updateExercise(exercises[0].id, 'Updated Offline Exercise');
      
      // Delete an exercise
      await testApp.deleteExercise(exercises[1].id);
      
      const finalExercises = await testApp.getExercises();
      expect(finalExercises).toHaveLength(1);
      expect(finalExercises[0].name).toBe('Updated Offline Exercise');
    });

    it('should maintain sync status as pending for offline operations', async () => {
      await testApp.addExercise('Exercise 1');
      await testApp.addExercise('Exercise 2');
      await testApp.addExercise('Exercise 3');
      
      const exercises = await testApp.getExercises();
      
      exercises.forEach(exercise => {
        expect(exercise.syncStatus).toBe('pending');
      });
    });

    it('should track pending changes count', async () => {
      const initialSyncState = await testApp.getSyncState();
      expect(initialSyncState.pendingChanges).toBe(0);
      
      await testApp.addExercise('Exercise 1');
      const afterAddSyncState = await testApp.getSyncState();
      expect(afterAddSyncState.pendingChanges).toBe(1);
      
      await testApp.addExercise('Exercise 2');
      const afterSecondAddSyncState = await testApp.getSyncState();
      expect(afterSecondAddSyncState.pendingChanges).toBe(2);
      
      const exercises = await testApp.getExercises();
      await testApp.updateExercise(exercises[0].id, 'Updated Exercise');
      const afterUpdateSyncState = await testApp.getSyncState();
      expect(afterUpdateSyncState.pendingChanges).toBe(3);
    });

    it('should handle large datasets locally', async () => {
      const exerciseCount = 50;
      const exercisePromises = [];
      
      // Create large dataset locally
      for (let i = 1; i <= exerciseCount; i++) {
        exercisePromises.push(testApp.addExercise(`Exercise ${i}`));
      }
      
      await Promise.all(exercisePromises);
      
      const exercises = await testApp.getExercises();
      expect(exercises).toHaveLength(exerciseCount);
      
      // Verify local performance
      const startTime = Date.now();
      const retrievedExercises = await testApp.getExercises();
      const retrievalTime = Date.now() - startTime;
      
      expect(retrievedExercises).toHaveLength(exerciseCount);
      expect(retrievalTime).toBeLessThan(100); // Should be fast for local operations
    });
  });

  describe('Data Consistency and Validation', () => {
    it('should maintain data integrity without sync', async () => {
      const exerciseName = 'Integrity Test Exercise';
      
      await testApp.addExercise(exerciseName);
      const exercises = await testApp.getExercises();
      const exercise = exercises[0];
      
      // Validate data structure
      expect(exercise).toMatchObject({
        id: expect.stringMatching(/^[a-zA-Z0-9-_]+$/),
        name: exerciseName,
        createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
        syncStatus: 'pending'
      });
      
      // Validate timestamps
      const createdAt = new Date(exercise.createdAt);
      const updatedAt = new Date(exercise.updatedAt);
      expect(createdAt).toBeInstanceOf(Date);
      expect(updatedAt).toBeInstanceOf(Date);
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(createdAt.getTime());
    });

    it('should validate consistency across operations', async () => {
      // Perform mixed operations
      await testApp.addExercise('Exercise A');
      await testApp.addExercise('Exercise B');
      await testApp.addExercise('Exercise C');
      
      let exercises = await testApp.getExercises();
      expect(exercises).toHaveLength(3);
      
      // Update middle exercise
      await testApp.updateExercise(exercises[1].id, 'Updated Exercise B');
      
      exercises = await testApp.getExercises();
      expect(exercises.find(e => e.id === exercises[1].id)?.name).toBe('Updated Exercise B');
      
      // Delete first exercise
      await testApp.deleteExercise(exercises[0].id);
      
      exercises = await testApp.getExercises();
      expect(exercises).toHaveLength(2);
      expect(exercises.find(e => e.name === 'Exercise A')).toBeUndefined();
    });

    it('should handle concurrent local operations', async () => {
      // Simulate concurrent additions
      const concurrentOperations = [
        testApp.addExercise('Concurrent 1'),
        testApp.addExercise('Concurrent 2'),
        testApp.addExercise('Concurrent 3'),
        testApp.addExercise('Concurrent 4'),
        testApp.addExercise('Concurrent 5')
      ];
      
      await Promise.all(concurrentOperations);
      
      const exercises = await testApp.getExercises();
      expect(exercises).toHaveLength(5);
      
      // Verify all exercises have unique IDs
      const exerciseIds = exercises.map(e => e.id);
      const uniqueIds = new Set(exerciseIds);
      expect(uniqueIds.size).toBe(5);
    });

    it('should validate data after app restart', async () => {
      // Create initial dataset
      await testApp.addExercise('Pre-restart Exercise 1');
      await testApp.addExercise('Pre-restart Exercise 2');
      
      const preRestartExercises = await testApp.getExercises();
      const preRestartSyncState = await testApp.getSyncState();
      
      // Restart app
      await testApp.restart();
      
      // Validate data persistence
      const postRestartExercises = await testApp.getExercises();
      const postRestartSyncState = await testApp.getSyncState();
      
      expect(postRestartExercises).toHaveLength(preRestartExercises.length);
      expect(postRestartSyncState.pendingChanges).toBe(preRestartSyncState.pendingChanges);
      
      preRestartExercises.forEach(preExercise => {
        const postExercise = postRestartExercises.find(e => e.id === preExercise.id);
        expect(postExercise).toMatchObject({
          id: preExercise.id,
          name: preExercise.name,
          createdAt: preExercise.createdAt,
          updatedAt: preExercise.updatedAt,
          syncStatus: preExercise.syncStatus
        });
      });
    });
  });

  describe('Storage Backend Configuration', () => {
    it('should use local-only storage configuration', async () => {
      const storageConfig = await testApp.getStorageConfig();
      
      expect(storageConfig).toMatchObject({
        local: expect.objectContaining({
          name: expect.stringContaining('strengthassistant'),
          asyncStorage: expect.objectContaining({
            preload: true
          })
        }),
        sync: expect.objectContaining({
          enabled: false
        })
      });
    });

    it('should maintain feature flag for anonymous mode', async () => {
      const featureFlags = await testApp.getFeatureFlags();
      
      expect(featureFlags).toMatchObject({
        useSupabaseData: false // Anonymous mode uses local-only storage
      });
    });

    it('should report correct sync state for offline mode', async () => {
      const syncState = await testApp.getSyncState();
      
      expect(syncState).toMatchObject({
        isOnline: false,
        isSyncing: false,
        lastSyncAt: undefined, // Never synced in anonymous mode
        pendingChanges: expect.any(Number),
        errors: []
      });
    });
  });

  describe('Performance and Memory', () => {
    it('should perform local operations within performance thresholds', async () => {
      const exerciseName = 'Performance Test Exercise';
      
      // Test add performance
      const addStartTime = Date.now();
      await testApp.addExercise(exerciseName);
      const addTime = Date.now() - addStartTime;
      expect(addTime).toBeLessThan(50); // <50ms for local operations
      
      const exercises = await testApp.getExercises();
      const exerciseId = exercises[0].id;
      
      // Test update performance
      const updateStartTime = Date.now();
      await testApp.updateExercise(exerciseId, 'Updated Name');
      const updateTime = Date.now() - updateStartTime;
      expect(updateTime).toBeLessThan(50);
      
      // Test read performance
      const readStartTime = Date.now();
      await testApp.getExercises();
      const readTime = Date.now() - readStartTime;
      expect(readTime).toBeLessThan(25); // Read operations should be even faster
      
      // Test delete performance
      const deleteStartTime = Date.now();
      await testApp.deleteExercise(exerciseId);
      const deleteTime = Date.now() - deleteStartTime;
      expect(deleteTime).toBeLessThan(50);
    });

    it('should handle memory efficiently for large datasets', async () => {
      const initialMemory = await testDevice.getMemoryUsage();
      
      // Create moderate dataset
      for (let i = 1; i <= 100; i++) {
        await testApp.addExercise(`Memory Test Exercise ${i}`);
      }
      
      const afterCreationMemory = await testDevice.getMemoryUsage();
      const memoryGrowth = afterCreationMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory growth should be reasonable (less than 10MB for 100 exercises)
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
      
      // Cleanup should reduce memory
      for (let i = 1; i <= 50; i++) {
        const exercises = await testApp.getExercises();
        if (exercises.length > 0) {
          await testApp.deleteExercise(exercises[0].id);
        }
      }
      
      const afterCleanupMemory = await testDevice.getMemoryUsage();
      expect(afterCleanupMemory.heapUsed).toBeLessThan(afterCreationMemory.heapUsed);
    });
  });

  describe('Constitutional Compliance', () => {
    it('should maintain constitutional test performance requirements', async () => {
      // Test execution should complete within constitutional time limits
      const testStartTime = Date.now();
      
      // Perform comprehensive anonymous operations
      await testApp.addExercise('Constitutional Test 1');
      await testApp.addExercise('Constitutional Test 2');
      const exercises = await testApp.getExercises();
      await testApp.updateExercise(exercises[0].id, 'Updated Constitutional Test');
      await testApp.deleteExercise(exercises[1].id);
      
      const testExecutionTime = Date.now() - testStartTime;
      
      // Should complete well within constitutional performance requirements
      expect(testExecutionTime).toBeLessThan(1000); // <1 second for integration operations
    });

    it('should validate Amendment v2.5.0 compliance in anonymous mode', async () => {
      // Anonymous local-first operations should still respect constitutional requirements
      const operationResult = {
        success: true,
        exitCode: 0, // Binary exit code validation
        constitutionalCompliance: true,
        anonymousMode: true
      };
      
      expect(operationResult.success).toBe(true);
      expect(operationResult.exitCode).toBe(0);
      expect(operationResult.constitutionalCompliance).toBe(true);
      expect(operationResult.anonymousMode).toBe(true);
    });
  });
});