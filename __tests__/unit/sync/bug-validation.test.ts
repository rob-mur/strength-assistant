/**
 * Bug Validation Test - Verify the bug is actually fixed by testing against broken behavior
 * Purpose: Create a test that demonstrates the bug would occur without our fix
 */

import NetInfo from '@react-native-community/netinfo';
import { ExerciseService } from '../../../lib/data/ExerciseService';

// Get access to NetInfo mock controls
const mockNetInfo = NetInfo as any;

// Mock ExerciseService that simulates the old broken behavior (no persistence)
class BrokenExerciseService extends ExerciseService {
  constructor(options: any) {
    super({ ...options, persistence: false }); // Disable persistence to simulate old bug
  }
  
  // Override to simulate old broken loadFromPersistence that doesn't work
  private async loadFromPersistence(): Promise<void> {
    // Simulate old behavior - no actual persistence loading
    return;
  }
  
  private async saveToPersistence(): Promise<void> {
    // Simulate old behavior - no actual persistence saving
    return;
  }
}

describe('Bug Validation - Verify Fix Works', () => {
  beforeEach(async () => {
    // Clear any existing test data
    await mockNetInfo.__clearListeners();
    
    // Reset to online state
    mockNetInfo.__setMockState({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
    });
  });

  afterEach(async () => {
    await mockNetInfo.__clearListeners();
  });

  it('should demonstrate the bug exists with broken implementation', async () => {
    console.log('=== BUG DEMONSTRATION: Testing broken behavior ===');
    
    // Use the broken service that doesn't persist
    const brokenService = new BrokenExerciseService({
      userId: 'test-user',
      enableSync: true,
      persistence: false, // This simulates the old broken behavior
    });
    
    await brokenService.clearAll();
    
    // Go offline
    mockNetInfo.__setMockState({
      type: 'none',
      isConnected: false,
      isInternetReachable: false,
    });
    
    // Create exercises while offline
    await brokenService.createExercise('Broken Service Exercise 1');
    await brokenService.createExercise('Broken Service Exercise 2');
    
    let exercises = await brokenService.getExercises();
    expect(exercises).toHaveLength(2);
    console.log('✓ Exercises exist in broken service before restart');
    
    // Simulate app restart with broken service (should lose data)
    const restartedBrokenService = new BrokenExerciseService({
      userId: 'test-user',
      enableSync: true,
      persistence: false,
    });
    
    const exercisesAfterRestart = await restartedBrokenService.getExercises();
    console.log(`Broken service has ${exercisesAfterRestart.length} exercises after restart`);
    
    // This should fail - broken service loses data
    expect(exercisesAfterRestart).toHaveLength(0);
    console.log('✅ Confirmed: Broken implementation loses exercises after restart');
  });

  it('should show the fix works with real implementation', async () => {
    console.log('=== FIX VERIFICATION: Testing fixed behavior ===');
    
    // Use the real fixed service
    const fixedService = new ExerciseService({
      userId: 'test-user',
      enableSync: true,
      persistence: true, // This is our fix
    });
    
    await fixedService.clearAll();
    
    // Go offline
    mockNetInfo.__setMockState({
      type: 'none',
      isConnected: false,
      isInternetReachable: false,
    });
    
    // Create exercises while offline
    await fixedService.createExercise('Fixed Service Exercise 1');
    await fixedService.createExercise('Fixed Service Exercise 2');
    
    let exercises = await fixedService.getExercises();
    expect(exercises).toHaveLength(2);
    console.log('✓ Exercises exist in fixed service before restart');
    
    // Simulate app restart with fixed service (should preserve data)
    const restartedFixedService = new ExerciseService({
      userId: 'test-user',
      enableSync: true,
      persistence: true,
    });
    
    const exercisesAfterRestart = await restartedFixedService.getExercises();
    console.log(`Fixed service has ${exercisesAfterRestart.length} exercises after restart`);
    
    // This should pass - fixed service preserves data
    expect(exercisesAfterRestart).toHaveLength(2);
    expect(exercisesAfterRestart.map(e => e.name)).toEqual(['Fixed Service Exercise 1', 'Fixed Service Exercise 2']);
    console.log('✅ Confirmed: Fixed implementation preserves exercises after restart');
  });

  it('should test the specific async storage persistence mechanism', async () => {
    console.log('=== PERSISTENCE MECHANISM TEST ===');
    
    // Check that AsyncStorage actually contains our data
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    
    // Clear storage first
    await AsyncStorage.clear();
    
    const service = new ExerciseService({
      userId: 'test-user',
      enableSync: true,
      persistence: true,
    });
    
    await service.clearAll();
    
    // Create an exercise
    await service.createExercise('Persistence Test Exercise');
    
    // Check if something was written to AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    console.log('AsyncStorage keys after creating exercise:', keys);
    
    // Should have some sync-related data in storage
    const syncKeys = keys.filter(key => key.includes('sync') || key.includes('queue'));
    console.log('Sync-related keys:', syncKeys);
    
    // The persistence should have created storage entries
    expect(keys.length).toBeGreaterThan(0);
    console.log('✅ AsyncStorage persistence is working');
  });
});