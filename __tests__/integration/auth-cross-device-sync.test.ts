/**
 * Integration Test: Authenticated Cross-Device Sync
 * 
 * This test validates the complete user journey for authenticated users
 * with data synchronization across multiple devices.
 * 
 * Based on quickstart.md Scenario 2.
 * 
 * CRITICAL: This test MUST fail initially - implementations don't exist yet.
 */

describe('Authenticated Cross-Device Sync', () => {
  let deviceA: any;
  let deviceB: any;
  const testEmail = 'crossdevice@example.com';
  const testPassword = 'securepassword123';

  beforeEach(async () => {
    // This will fail initially - TestDevice doesn't exist yet
    const { TestDevice } = require('../../lib/test-utils/TestDevice');
    
    deviceA = new TestDevice('Device-A');
    deviceB = new TestDevice('Device-B');
    
    await deviceA.init();
    await deviceB.init();
    
    // Ensure clean state
    await deviceA.signOutAll();
    await deviceB.signOutAll();
    await deviceA.setNetworkStatus(true);
    await deviceB.setNetworkStatus(true);
  });

  afterEach(async () => {
    await deviceA.cleanup();
    await deviceB.cleanup();
  });

  describe('Account Creation and Authentication', () => {
    it('should create account and sync exercises to cloud', async () => {
      // Create account on Device A
      const user = await deviceA.signUp(testEmail, testPassword);
      
      expect(user.email).toBe(testEmail);
      expect(user.isAnonymous).toBe(false);
      expect(user.id).toBeDefined();

      // Add exercises on Device A
      await deviceA.addExercise('Bench Press');
      await deviceA.addExercise('Deadlift');

      // Wait for sync to complete
      await deviceA.waitForSyncComplete();

      // Verify sync status
      const exercisesA = await deviceA.getExercises();
      expect(exercisesA).toHaveLength(2);
      
      const syncStatuses = await Promise.all(
        exercisesA.map(exercise => deviceA.getSyncStatus(exercise.id))
      );
      
      syncStatuses.forEach(status => {
        expect(status).toBe('synced');
      });
    });

    it('should handle sign up validation errors', async () => {
      // Invalid email
      await expect(deviceA.signUp('invalid-email', testPassword))
        .rejects.toThrow(/email/i);

      // Weak password
      await expect(deviceA.signUp(testEmail, '123'))
        .rejects.toThrow(/password/i);

      // Existing email
      await deviceA.signUp(testEmail, testPassword);
      
      await expect(deviceB.signUp(testEmail, testPassword))
        .rejects.toThrow(/already exists/i);
    });
  });

  describe('Cross-Device Data Consistency', () => {
    beforeEach(async () => {
      // Set up authenticated user on Device A with test data
      await deviceA.signUp(testEmail, testPassword);
      await deviceA.addExercise('Bench Press');
      await deviceA.addExercise('Deadlift');
      await deviceA.waitForSyncComplete();
    });

    it('should sync data when signing in on new device', async () => {
      // Sign in on Device B
      const userB = await deviceB.signIn(testEmail, testPassword);
      
      expect(userB.email).toBe(testEmail);
      expect(userB.isAnonymous).toBe(false);

      // Wait for initial data sync
      await deviceB.waitForSyncComplete();

      // Verify data consistency
      const exercisesB = await deviceB.getExercises();
      const exercisesA = await deviceA.getExercises();

      expect(exercisesB).toHaveLength(2);
      expect(exercisesB.map(e => e.name)).toContain('Bench Press');
      expect(exercisesB.map(e => e.name)).toContain('Deadlift');

      // IDs should match across devices
      const benchPressA = exercisesA.find(e => e.name === 'Bench Press');
      const benchPressB = exercisesB.find(e => e.name === 'Bench Press');
      
      expect(benchPressA?.id).toBe(benchPressB?.id);
    });

    it('should sync real-time changes between devices', async (done) => {
      // Sign in on Device B
      await deviceB.signIn(testEmail, testPassword);
      await deviceB.waitForSyncComplete();

      // Set up real-time sync listener on Device B
      let changeCount = 0;
      const unsubscribe = deviceB.subscribeToExerciseChanges((exercises) => {
        changeCount++;
        
        if (changeCount === 2) { // Initial load + new exercise
          expect(exercises).toHaveLength(3);
          expect(exercises.map(e => e.name)).toContain('Incline Bench Press');
          unsubscribe();
          done();
        }
      });

      // Add exercise on Device A after a short delay
      setTimeout(async () => {
        await deviceA.addExercise('Incline Bench Press');
      }, 100);
    });

    it('should handle conflict resolution with last-write-wins', async () => {
      // Sign in on Device B
      await deviceB.signIn(testEmail, testPassword);
      await deviceB.waitForSyncComplete();

      // Get the same exercise on both devices
      const exercisesA = await deviceA.getExercises();
      const benchPressId = exercisesA.find(e => e.name === 'Bench Press')?.id;
      expect(benchPressId).toBeDefined();

      // Simultaneous updates on both devices
      const updateTimeA = new Date();
      await deviceA.updateExercise(benchPressId!, 'Bench Press - Device A');
      
      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const updateTimeB = new Date();
      await deviceB.updateExercise(benchPressId!, 'Bench Press - Device B');

      // Wait for sync resolution
      await deviceA.waitForSyncComplete();
      await deviceB.waitForSyncComplete();

      // Last write wins (Device B should win due to later timestamp)
      const finalExercisesA = await deviceA.getExercises();
      const finalExercisesB = await deviceB.getExercises();
      
      const finalNameA = finalExercisesA.find(e => e.id === benchPressId)?.name;
      const finalNameB = finalExercisesB.find(e => e.id === benchPressId)?.name;

      expect(finalNameA).toBe('Bench Press - Device B');
      expect(finalNameB).toBe('Bench Press - Device B');
    });
  });

  describe('Offline-Online Synchronization', () => {
    beforeEach(async () => {
      await deviceA.signUp(testEmail, testPassword);
      await deviceA.addExercise('Initial Exercise');
      await deviceA.waitForSyncComplete();
    });

    it('should sync offline changes when coming back online', async () => {
      // Sign in on Device B
      await deviceB.signIn(testEmail, testPassword);
      await deviceB.waitForSyncComplete();

      // Go offline on Device A
      await deviceA.setNetworkStatus(false);
      
      // Make changes while offline
      await deviceA.addExercise('Offline Exercise 1');
      await deviceA.addExercise('Offline Exercise 2');
      await deviceA.updateExercise(
        (await deviceA.getExercises())[0].id,
        'Updated While Offline'
      );

      // Verify changes are local on Device A
      const offlineExercises = await deviceA.getExercises();
      expect(offlineExercises).toHaveLength(3);
      expect(offlineExercises.map(e => e.name)).toContain('Offline Exercise 1');
      expect(offlineExercises.map(e => e.name)).toContain('Updated While Offline');

      // Device B should not see changes yet
      const deviceBExercises = await deviceB.getExercises();
      expect(deviceBExercises).toHaveLength(1);

      // Go back online on Device A
      await deviceA.setNetworkStatus(true);
      await deviceA.waitForSyncComplete();

      // Device B should now see the changes
      await deviceB.waitForSyncComplete();
      const syncedExercises = await deviceB.getExercises();
      
      expect(syncedExercises).toHaveLength(3);
      expect(syncedExercises.map(e => e.name)).toContain('Offline Exercise 1');
      expect(syncedExercises.map(e => e.name)).toContain('Offline Exercise 2');
      expect(syncedExercises.map(e => e.name)).toContain('Updated While Offline');
    });

    it('should handle partial sync failures gracefully', async () => {
      await deviceB.signIn(testEmail, testPassword);
      await deviceB.waitForSyncComplete();

      // Simulate network issues during sync
      await deviceA.simulateNetworkIssues(true);
      
      // Add exercises that will fail to sync
      await deviceA.addExercise('Will Fail Sync 1');
      await deviceA.addExercise('Will Fail Sync 2');

      // Wait for sync attempts and failures
      await deviceA.waitFor(3000);

      // Verify exercises are marked as error
      const exercises = await deviceA.getExercises();
      const failedExercises = exercises.filter(e => 
        e.name.includes('Will Fail') && e.syncStatus === 'error'
      );
      
      expect(failedExercises).toHaveLength(2);

      // Fix network and verify retry
      await deviceA.simulateNetworkIssues(false);
      await deviceA.retryFailedSyncs();
      await deviceA.waitForSyncComplete();

      // Now Device B should see the exercises
      await deviceB.waitForSyncComplete();
      const syncedExercises = await deviceB.getExercises();
      
      expect(syncedExercises.map(e => e.name)).toContain('Will Fail Sync 1');
      expect(syncedExercises.map(e => e.name)).toContain('Will Fail Sync 2');
    });
  });

  describe('Multi-Device Scenarios', () => {
    let deviceC: any;

    beforeEach(async () => {
      const { TestDevice } = require('../../lib/test-utils/TestDevice');
      deviceC = new TestDevice('Device-C');
      await deviceC.init();

      // Set up user with data
      await deviceA.signUp(testEmail, testPassword);
      await deviceA.addExercise('Shared Exercise 1');
      await deviceA.addExercise('Shared Exercise 2');
      await deviceA.waitForSyncComplete();
    });

    afterEach(async () => {
      await deviceC.cleanup();
    });

    it('should maintain consistency across three devices', async () => {
      // Sign in on all devices
      await deviceB.signIn(testEmail, testPassword);
      await deviceC.signIn(testEmail, testPassword);

      await Promise.all([
        deviceB.waitForSyncComplete(),
        deviceC.waitForSyncComplete()
      ]);

      // Verify initial consistency
      const [exercisesA, exercisesB, exercisesC] = await Promise.all([
        deviceA.getExercises(),
        deviceB.getExercises(),
        deviceC.getExercises()
      ]);

      expect(exercisesA).toHaveLength(2);
      expect(exercisesB).toHaveLength(2);
      expect(exercisesC).toHaveLength(2);

      // Make changes on different devices
      await deviceA.addExercise('From Device A');
      await deviceB.addExercise('From Device B');
      await deviceC.addExercise('From Device C');

      // Wait for all syncs
      await Promise.all([
        deviceA.waitForSyncComplete(),
        deviceB.waitForSyncComplete(),
        deviceC.waitForSyncComplete()
      ]);

      // Verify final consistency
      const [finalA, finalB, finalC] = await Promise.all([
        deviceA.getExercises(),
        deviceB.getExercises(),
        deviceC.getExercises()
      ]);

      expect(finalA).toHaveLength(5);
      expect(finalB).toHaveLength(5);
      expect(finalC).toHaveLength(5);

      // All devices should have all exercises
      ['From Device A', 'From Device B', 'From Device C'].forEach(name => {
        expect(finalA.map(e => e.name)).toContain(name);
        expect(finalB.map(e => e.name)).toContain(name);
        expect(finalC.map(e => e.name)).toContain(name);
      });
    });

    it('should handle device going offline and coming back', async () => {
      await deviceB.signIn(testEmail, testPassword);
      await deviceC.signIn(testEmail, testPassword);
      
      await Promise.all([
        deviceB.waitForSyncComplete(),
        deviceC.waitForSyncComplete()
      ]);

      // Device B goes offline
      await deviceB.setNetworkStatus(false);

      // Device A and C make changes
      await deviceA.addExercise('While B Offline - A');
      await deviceC.addExercise('While B Offline - C');

      await deviceA.waitForSyncComplete();
      await deviceC.waitForSyncComplete();

      // Device B makes offline changes
      await deviceB.addExercise('Offline on B');

      // Device B comes back online
      await deviceB.setNetworkStatus(true);
      await deviceB.waitForSyncComplete();

      // All devices should be consistent
      const [finalA, finalB, finalC] = await Promise.all([
        deviceA.getExercises(),
        deviceB.getExercises(),
        deviceC.getExercises()
      ]);

      expect(finalA).toHaveLength(5);
      expect(finalB).toHaveLength(5);
      expect(finalC).toHaveLength(5);

      ['While B Offline - A', 'While B Offline - C', 'Offline on B'].forEach(name => {
        expect(finalA.map(e => e.name)).toContain(name);
        expect(finalB.map(e => e.name)).toContain(name);
        expect(finalC.map(e => e.name)).toContain(name);
      });
    });
  });

  describe('Performance Under Load', () => {
    beforeEach(async () => {
      await deviceA.signUp(testEmail, testPassword);
    });

    it('should maintain performance with many exercises syncing', async () => {
      // Create many exercises on Device A
      const exerciseNames = Array.from({ length: 50 }, (_, i) => `Exercise ${i + 1}`);
      
      const startTime = performance.now();
      
      for (const name of exerciseNames) {
        await deviceA.addExercise(name);
      }
      
      const createTime = performance.now() - startTime;
      const avgCreateTime = createTime / exerciseNames.length;
      
      expect(avgCreateTime).toBeLessThan(50); // Still fast per exercise

      // Wait for sync
      await deviceA.waitForSyncComplete();

      // Sign in on Device B and measure sync time
      const syncStartTime = performance.now();
      await deviceB.signIn(testEmail, testPassword);
      await deviceB.waitForSyncComplete();
      const syncTime = performance.now() - syncStartTime;

      // Verify all data synced
      const exercisesB = await deviceB.getExercises();
      expect(exercisesB).toHaveLength(50);

      // Sync should complete within reasonable time
      expect(syncTime).toBeLessThan(5000); // 5 seconds for 50 exercises
    });
  });
});