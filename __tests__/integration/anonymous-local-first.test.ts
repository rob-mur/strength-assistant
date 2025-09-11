/**
 * Integration Test: Anonymous User Local-First Experience
 * 
 * This test validates the complete user journey for anonymous users,
 * ensuring local-first behavior with immediate responses.
 * 
 * Based on quickstart.md Scenario 1.
 * 
 * CRITICAL: This test MUST fail initially - integrations don't exist yet.
 */

describe('Anonymous User Local-First Experience', () => {
  let app: any;

  beforeEach(async () => {
    // This will fail initially - App integration doesn't exist yet
    const { TestApp } = require('../../lib/test-utils/TestApp');
    app = new TestApp();
    
    // Start offline
    await app.setNetworkStatus(false);
    await app.signOutAll(); // Ensure anonymous state
  });

  afterEach(async () => {
    await app.cleanup();
  });

  describe('Offline Exercise Creation', () => {
    it('should create exercises immediately without network', async () => {
      // Verify we're offline
      expect(await app.isOnline()).toBe(false);

      const startTime = Date.now();
      
      // Navigate to exercise creation
      await app.navigateToExerciseCreation();
      
      // Add first exercise
      await app.addExercise('Push-ups');
      const pushupCreateTime = Date.now() - startTime;
      
      // Should be immediate (< 50ms for local-first)
      expect(pushupCreateTime).toBeLessThan(50);
      
      // Verify immediate UI update
      const exerciseList = await app.getExerciseList();
      expect(exerciseList).toContain('Push-ups');
      expect(exerciseList).toHaveLength(1);

      // Add second exercise
      await app.addExercise('Squats');
      const secondCreateTime = Date.now() - startTime;
      expect(secondCreateTime - pushupCreateTime).toBeLessThan(50);

      // Verify both exercises visible
      const updatedList = await app.getExerciseList();
      expect(updatedList).toContain('Push-ups');
      expect(updatedList).toContain('Squats');
      expect(updatedList).toHaveLength(2);
    });

    it('should show no loading states during offline operations', async () => {
      await app.navigateToExerciseCreation();
      
      const loadingStatesBefore = await app.getLoadingStates();
      
      await app.addExercise('Test Exercise');
      
      const loadingStatesDuring = await app.getLoadingStates();
      
      // No loading indicators should be shown for local operations
      expect(loadingStatesBefore.exerciseCreation).toBe(false);
      expect(loadingStatesDuring.exerciseCreation).toBe(false);
    });
  });

  describe('Data Persistence Across App Restarts', () => {
    it('should persist exercises after killing and restarting app', async () => {
      // Create test data
      await app.navigateToExerciseCreation();
      await app.addExercise('Push-ups');
      await app.addExercise('Squats');

      // Verify data exists
      let exerciseList = await app.getExerciseList();
      expect(exerciseList).toHaveLength(2);

      // Simulate app kill and restart
      await app.kill();
      await app.restart();
      
      // Verify data still exists
      await app.navigateToExerciseList();
      exerciseList = await app.getExerciseList();
      
      expect(exerciseList).toContain('Push-ups');
      expect(exerciseList).toContain('Squats');
      expect(exerciseList).toHaveLength(2);
    });

    it('should maintain data integrity after multiple restarts', async () => {
      // Create initial data
      await app.addExercise('Exercise 1');
      
      // Restart and add more
      await app.restart();
      await app.addExercise('Exercise 2');
      
      // Restart and verify all data
      await app.restart();
      const exerciseList = await app.getExerciseList();
      
      expect(exerciseList).toContain('Exercise 1');
      expect(exerciseList).toContain('Exercise 2');
      expect(exerciseList).toHaveLength(2);
    });
  });

  describe('Sync Status for Anonymous Users', () => {
    beforeEach(async () => {
      await app.addExercise('Test Exercise');
    });

    it('should show sync status when going online', async () => {
      // Verify we start offline
      expect(await app.isOnline()).toBe(false);
      
      // Go online
      await app.setNetworkStatus(true);
      expect(await app.isOnline()).toBe(true);

      // Verify sync status icon appears
      const syncStatusIcon = await app.getSyncStatusIcon();
      expect(syncStatusIcon).toBeDefined();
      expect(syncStatusIcon.isVisible).toBe(true);
    });

    it('should keep exercises local-only for anonymous users', async () => {
      // Go online
      await app.setNetworkStatus(true);

      // Wait for any potential sync attempts
      await app.waitFor(2000);

      // For anonymous users, exercises should remain local only
      const exerciseList = await app.getExerciseList();
      expect(exerciseList).toContain('Test Exercise');

      // Verify no cloud sync occurred (exercises still pending or local-only)
      const syncStatus = await app.getExerciseSyncStatus('Test Exercise');
      expect(syncStatus).not.toBe('synced');
    });

    it('should handle network status changes gracefully', async () => {
      // Start online
      await app.setNetworkStatus(true);
      await app.addExercise('Online Exercise');

      // Go offline
      await app.setNetworkStatus(false);
      await app.addExercise('Offline Exercise');

      // Back online
      await app.setNetworkStatus(true);
      
      // Both exercises should be available
      const exerciseList = await app.getExerciseList();
      expect(exerciseList).toContain('Online Exercise');
      expect(exerciseList).toContain('Offline Exercise');
      expect(exerciseList).toHaveLength(3); // Including the one from beforeEach
    });
  });

  describe('Performance Requirements', () => {
    it('should meet local-first performance targets', async () => {
      const performanceMetrics = {
        exerciseCreation: [] as number[],
        exerciseListLoad: [] as number[],
        exerciseUpdate: [] as number[],
        exerciseDelete: [] as number[]
      };

      // Test exercise creation performance
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        await app.addExercise(`Exercise ${i}`);
        const endTime = performance.now();
        performanceMetrics.exerciseCreation.push(endTime - startTime);
      }

      // Test list load performance
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        await app.getExerciseList();
        const endTime = performance.now();
        performanceMetrics.exerciseListLoad.push(endTime - startTime);
      }

      // Verify performance targets
      const avgCreationTime = performanceMetrics.exerciseCreation.reduce((a, b) => a + b) / 5;
      const avgListLoadTime = performanceMetrics.exerciseListLoad.reduce((a, b) => a + b) / 5;

      expect(avgCreationTime).toBeLessThan(50); // < 50ms for creation
      expect(avgListLoadTime).toBeLessThan(100); // < 100ms for list load
    });

    it('should handle large numbers of exercises efficiently', async () => {
      // Create 100 exercises
      const createStartTime = performance.now();
      for (let i = 0; i < 100; i++) {
        await app.addExercise(`Exercise ${i}`);
      }
      const createEndTime = performance.now();

      // Load all exercises
      const loadStartTime = performance.now();
      const exerciseList = await app.getExerciseList();
      const loadEndTime = performance.now();

      // Verify all exercises are there
      expect(exerciseList).toHaveLength(100);

      // Performance should remain reasonable
      const avgCreateTime = (createEndTime - createStartTime) / 100;
      const loadTime = loadEndTime - loadStartTime;

      expect(avgCreateTime).toBeLessThan(50); // Still fast per exercise
      expect(loadTime).toBeLessThan(500); // Still fast to load all
    });
  });

  describe('UI Responsiveness', () => {
    it('should provide immediate UI feedback for all operations', async () => {
      await app.navigateToExerciseCreation();

      // Create exercise and verify immediate UI update
      const beforeCreate = await app.getExerciseList();
      await app.addExercise('Immediate Test');
      const afterCreate = await app.getExerciseList();

      expect(afterCreate.length).toBe(beforeCreate.length + 1);
      expect(afterCreate).toContain('Immediate Test');

      // Update exercise and verify immediate UI update
      await app.updateExercise('Immediate Test', 'Updated Test');
      const afterUpdate = await app.getExerciseList();
      
      expect(afterUpdate).not.toContain('Immediate Test');
      expect(afterUpdate).toContain('Updated Test');

      // Delete exercise and verify immediate UI update
      await app.deleteExercise('Updated Test');
      const afterDelete = await app.getExerciseList();
      
      expect(afterDelete).not.toContain('Updated Test');
    });

    it('should never block UI during background operations', async () => {
      // Start a background operation (if any)
      await app.setNetworkStatus(true);

      // UI should remain responsive during any background sync
      const startTime = performance.now();
      await app.addExercise('Responsive Test');
      const uiResponseTime = performance.now() - startTime;

      expect(uiResponseTime).toBeLessThan(50);

      // Navigation should be immediate
      const navStartTime = performance.now();
      await app.navigateToExerciseList();
      const navTime = performance.now() - navStartTime;

      expect(navTime).toBeLessThan(100);
    });
  });
});