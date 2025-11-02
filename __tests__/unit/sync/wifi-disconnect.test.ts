/**
 * WiFi Disconnect Test - Focused test for offline sync bug
 * Purpose: Test the specific scenario where exercises created while WiFi is off 
 * are lost when the app restarts. This reproduces the exact bug reported.
 */

import NetInfo from '@react-native-community/netinfo';
import { ExerciseService } from '../../../lib/data/ExerciseService';
import { SyncManager } from '../../../lib/sync/SyncManager';

// Get access to NetInfo mock controls
const mockNetInfo = NetInfo as any;

describe('WiFi Disconnect - Core Bug Test', () => {
  let exerciseService: ExerciseService;
  let syncManager: SyncManager;

  beforeEach(async () => {
    // Clear any existing test data
    await mockNetInfo.__clearListeners();
    
    // Reset to online state
    mockNetInfo.__setMockState({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
    });

    // Create fresh sync manager
    syncManager = new SyncManager();
    await syncManager.reset();
    
    // Create fresh service instance
    exerciseService = new ExerciseService({
      userId: 'test-user',
      enableSync: true,
      persistence: true,
    });
    
    // Clear all data to start fresh
    await exerciseService.clearAll();
  });

  afterEach(async () => {
    if (syncManager) {
      await syncManager.reset();
      syncManager.destroy();
    }
    await mockNetInfo.__clearListeners();
  });

  it('should reproduce the bug: exercises lost after app restart when created offline', async () => {
    console.log('=== TEST START: WiFi Disconnect Bug Reproduction ===');
    
    // STEP 1: Start online, verify no exercises exist
    console.log('STEP 1: Verify clean state (online)');
    expect(mockNetInfo.__getMockState().isConnected).toBe(true);
    
    let exercises = await exerciseService.getExercises();
    expect(exercises).toHaveLength(0);
    console.log('✓ Clean state confirmed - no exercises exist');
    
    // STEP 2: Simulate WiFi disconnect
    console.log('STEP 2: Simulating WiFi disconnect');
    mockNetInfo.__setMockState({
      type: 'none',
      isConnected: false,
      isInternetReachable: false,
    });
    
    // Wait a moment for network state to propagate
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(mockNetInfo.__getMockState().isConnected).toBe(false);
    console.log('✓ WiFi disconnected - now in airplane mode');
    
    // STEP 3: Create exercises while offline (the critical scenario)
    console.log('STEP 3: Creating exercises while offline');
    const exercise1 = await exerciseService.createExercise('Offline Exercise 1');
    const exercise2 = await exerciseService.createExercise('Offline Exercise 2');
    
    expect(exercise1.name).toBe('Offline Exercise 1');
    expect(exercise2.name).toBe('Offline Exercise 2');
    expect(exercise1.syncStatus).toBe('pending'); // Should be pending sync
    console.log('✓ Created 2 exercises while offline');
    
    // Verify exercises exist locally immediately after creation
    exercises = await exerciseService.getExercises();
    expect(exercises).toHaveLength(2);
    expect(exercises.map(e => e.name)).toEqual(['Offline Exercise 1', 'Offline Exercise 2']);
    console.log('✓ Exercises visible locally while offline');
    
    // STEP 4: Simulate app restart (this is where the bug occurs)
    console.log('STEP 4: Simulating app restart while still offline');
    
    // Create new service instance to simulate app restart
    const restartedService = new ExerciseService({
      userId: 'test-user',
      enableSync: true,
      persistence: true,
    });
    
    // Check if exercises survived the restart
    const exercisesAfterRestart = await restartedService.getExercises();
    console.log(`Found ${exercisesAfterRestart.length} exercises after restart`);
    
    // This is the bug - exercises should persist but they don't
    console.log('🐛 BUG CHECK: Do exercises survive app restart while offline?');
    
    if (exercisesAfterRestart.length === 0) {
      console.log('❌ BUG REPRODUCED: Exercises were lost during restart!');
      console.log('   This is the exact bug we need to fix.');
      console.log('   Exercises created while offline should persist through app restart.');
      
      // This test should FAIL until the bug is fixed
      expect(exercisesAfterRestart).toHaveLength(2); // This will fail, reproducing the bug
      expect(exercisesAfterRestart.map(e => e.name)).toEqual(['Offline Exercise 1', 'Offline Exercise 2']);
    } else {
      console.log('✅ BUG FIXED: Exercises survived the restart!');
      expect(exercisesAfterRestart).toHaveLength(2);
      expect(exercisesAfterRestart.map(e => e.name)).toEqual(['Offline Exercise 1', 'Offline Exercise 2']);
    }
    
    // STEP 5: Reconnect WiFi and verify sync happens
    console.log('STEP 5: Reconnecting WiFi to test sync recovery');
    mockNetInfo.__setMockState({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
    });
    
    // Wait for sync to complete
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Exercises should still be there and now synced
    const exercisesAfterSync = await restartedService.getExercises();
    console.log(`Found ${exercisesAfterSync.length} exercises after reconnection`);
    
    if (exercisesAfterSync.length > 0) {
      console.log('✅ Exercises survived sync recovery');
      // They should now be synced (not pending)
      exercisesAfterSync.forEach(exercise => {
        console.log(`Exercise: ${exercise.name}, Sync Status: ${exercise.syncStatus}`);
      });
    }
    
    console.log('=== TEST END ===');
  });

  it('should verify that exercises created online persist through restart', async () => {
    console.log('=== CONTROL TEST: Online Exercise Persistence ===');
    
    // Ensure we're online
    expect(mockNetInfo.__getMockState().isConnected).toBe(true);
    
    // Create exercises while online
    await exerciseService.createExercise('Online Exercise 1');
    await exerciseService.createExercise('Online Exercise 2');
    
    let exercises = await exerciseService.getExercises();
    expect(exercises).toHaveLength(2);
    
    // Simulate app restart while online
    const restartedService = new ExerciseService({
      userId: 'test-user',
      enableSync: true,
      persistence: true,
    });
    
    const exercisesAfterRestart = await restartedService.getExercises();
    
    // Online exercises should always persist (this should work)
    expect(exercisesAfterRestart).toHaveLength(2);
    console.log('✅ Online exercises persist correctly through restart');
  });

  it('should test the specific queue persistence mechanism', async () => {
    console.log('=== QUEUE PERSISTENCE TEST ===');
    
    // Go offline
    mockNetInfo.__setMockState({
      type: 'none',
      isConnected: false,
      isInternetReachable: false,
    });
    
    // Create exercise (should be queued)
    await exerciseService.createExercise('Queue Test Exercise');
    
    // Check queue status
    const queueStatus = await syncManager.getQueueStatus();
    console.log(`Queue has ${queueStatus.totalPending} pending operations`);
    
    // The queue should have pending operations
    expect(queueStatus.totalPending).toBeGreaterThan(0);
    
    // Reset sync manager to simulate restart
    await syncManager.reset();
    
    // Create new sync manager instance
    const newSyncManager = new SyncManager();
    
    // Check if queue was restored
    const restoredQueueStatus = await newSyncManager.getQueueStatus();
    console.log(`Restored queue has ${restoredQueueStatus.totalPending} pending operations`);
    
    // This is the key test - queue should persist through restart
    expect(restoredQueueStatus.totalPending).toBeGreaterThan(0);
    
    console.log('✅ Queue persistence test complete');
  });
});