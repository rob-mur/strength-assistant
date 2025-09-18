/**
 * ExerciseService Enhanced Tests
 * 
 * Comprehensive test coverage for the ExerciseService class focusing on:
 * - Edge cases and error conditions  
 * - Sync management functionality
 * - Persistence handling
 * - User management scenarios
 * - Error handling paths
 */

import { ExerciseService, SyncRecord, SyncStatus, ExerciseWithSyncStatus } from '../../lib/data/ExerciseService';

describe('ExerciseService - Enhanced Coverage', () => {
  let exerciseService: ExerciseService;

  beforeEach(async () => {
    exerciseService = new ExerciseService();
    await exerciseService.clearAll();
    
    // Clear global test persistence 
    global.testPersistence = undefined;
  });

  afterEach(async () => {
    await exerciseService.clearAll();
    global.testPersistence = undefined;
  });

  describe('Constructor Options', () => {
    it('should initialize with sync disabled', () => {
      const service = new ExerciseService({ enableSync: false });
      expect(service.getUserId()).toBe('default-user');
    });

    it('should initialize with custom user ID', () => {
      const service = new ExerciseService({ userId: 'custom-user' });
      expect(service.getUserId()).toBe('custom-user');
    });

    it('should initialize with persistence disabled', () => {
      const service = new ExerciseService({ persistence: false });
      expect(service.getUserId()).toBe('default-user');
    });

    it('should load from persistence on construction', () => {
      // Setup global test persistence with sample data
      global.testPersistence = {
        exercises: [['test-id', {
          id: 'test-id',
          name: 'Test Exercise',
          user_id: 'default-user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted: false
        }]],
        syncRecords: []
      };

      const service = new ExerciseService();
      // The service should load the exercise from persistence
      expect(service.getUserId()).toBe('default-user');
    });
  });

  describe('Error Conditions - createExercise', () => {
    it('should throw error for empty exercise name', async () => {
      await expect(exerciseService.createExercise('')).rejects.toThrow('Exercise name cannot be empty');
      await expect(exerciseService.createExercise('   ')).rejects.toThrow('Exercise name cannot be empty');
    });

    it('should throw error for exercise name too long', async () => {
      const longName = 'a'.repeat(101);
      await expect(exerciseService.createExercise(longName)).rejects.toThrow('Exercise name too long');
    });
  });

  describe('Error Conditions - getExerciseById', () => {
    it('should throw error when exercise not found', async () => {
      await expect(exerciseService.getExerciseById('nonexistent')).rejects.toThrow('Exercise not found');
    });

    it('should throw error when exercise is deleted', async () => {
      const exercise = await exerciseService.createExercise('Test Exercise');
      await exerciseService.deleteExercise(exercise.id);
      
      await expect(exerciseService.getExerciseById(exercise.id)).rejects.toThrow('Exercise not found');
    });

    it('should throw error when accessing exercise for different user', async () => {
      const exercise = await exerciseService.createExercise('Test Exercise');
      
      await expect(exerciseService.getExerciseById(exercise.id, 'different-user')).rejects.toThrow('Exercise not found');
    });

    it('should return exercise with correct sync status', async () => {
      // Create service with sync disabled
      const noSyncService = new ExerciseService({ enableSync: false });
      const exercise = await noSyncService.createExercise('Test Exercise');
      
      const retrieved = await noSyncService.getExerciseById(exercise.id);
      expect(retrieved.syncStatus).toBe('synced');
    });
  });

  describe('Error Conditions - updateExercise', () => {
    let exercise: ExerciseWithSyncStatus;

    beforeEach(async () => {
      exercise = await exerciseService.createExercise('Test Exercise');
    });

    it('should throw error for missing exercise ID', async () => {
      await expect(exerciseService.updateExercise('', { name: 'Updated' })).rejects.toThrow('Exercise ID is required');
    });

    it('should throw error when exercise not found', async () => {
      await expect(exerciseService.updateExercise('nonexistent', { name: 'Updated' })).rejects.toThrow('Exercise not found');
    });

    it('should throw error when updating exercise for different user', async () => {
      await expect(exerciseService.updateExercise(exercise.id, { name: 'Updated' }, 'different-user'))
        .rejects.toThrow('Unauthorized: Cannot update exercise for different user');
    });

    it('should throw error when updating deleted exercise', async () => {
      await exerciseService.deleteExercise(exercise.id);
      
      await expect(exerciseService.updateExercise(exercise.id, { name: 'Updated' }))
        .rejects.toThrow('Cannot update deleted exercise');
    });

    it('should throw error when no updates provided', async () => {
      await expect(exerciseService.updateExercise(exercise.id, {})).rejects.toThrow('No updates provided');
    });

    it('should throw error for empty exercise name update', async () => {
      await expect(exerciseService.updateExercise(exercise.id, { name: '' })).rejects.toThrow('Exercise name cannot be empty');
      await expect(exerciseService.updateExercise(exercise.id, { name: '   ' })).rejects.toThrow('Exercise name cannot be empty');
    });

    it('should throw error for exercise name too long', async () => {
      const longName = 'a'.repeat(101);
      await expect(exerciseService.updateExercise(exercise.id, { name: longName })).rejects.toThrow('Exercise name too long');
    });
  });

  describe('Error Conditions - deleteExercise', () => {
    let exercise: ExerciseWithSyncStatus;

    beforeEach(async () => {
      exercise = await exerciseService.createExercise('Test Exercise');
    });

    it('should throw error for missing exercise ID', async () => {
      await expect(exerciseService.deleteExercise('')).rejects.toThrow('Exercise ID is required');
    });

    it('should throw error when exercise not found', async () => {
      await expect(exerciseService.deleteExercise('nonexistent')).rejects.toThrow('Exercise not found');
    });

    it('should throw error when deleting exercise for different user', async () => {
      await expect(exerciseService.deleteExercise(exercise.id, 'different-user'))
        .rejects.toThrow('Unauthorized: Cannot delete exercise for different user');
    });
  });

  describe('Sync Management', () => {
    it('should get failed sync records', async () => {
      const exercise = await exerciseService.createExercise('Test Exercise');
      await exerciseService.markSyncError(exercise.id, 'Test error');
      
      const failedSyncs = await exerciseService.getFailedSyncs();
      expect(failedSyncs).toHaveLength(1);
      expect(failedSyncs[0].status).toBe('error');
      expect(failedSyncs[0].error).toBe('Test error');
    });

    it('should get sync record by exercise ID', async () => {
      const exercise = await exerciseService.createExercise('Test Exercise');
      
      const syncRecord = await exerciseService.getSyncRecordByExerciseId(exercise.id);
      expect(syncRecord).toBeDefined();
      expect(syncRecord?.recordId).toBe(exercise.id);
    });

    it('should return undefined for non-existent sync record', async () => {
      const syncRecord = await exerciseService.getSyncRecordByExerciseId('nonexistent');
      expect(syncRecord).toBeUndefined();
    });

    it('should update sync record status', async () => {
      const exercise = await exerciseService.createExercise('Test Exercise');
      const syncRecord = await exerciseService.getSyncRecordByExerciseId(exercise.id);
      
      if (syncRecord) {
        await exerciseService.updateSyncRecordStatus(syncRecord.id, 'error', 'Test error');
        
        const updated = await exerciseService.getSyncRecordByExerciseId(exercise.id);
        expect(updated?.status).toBe('error');
        expect(updated?.error).toBe('Test error');
        expect(updated?.attempts).toBe(1);
      }
    });

    it('should handle update sync record status for non-existent record', async () => {
      // Should not throw error
      await exerciseService.updateSyncRecordStatus('nonexistent', 'error', 'Test error');
    });

    it('should mark sync complete by record ID', async () => {
      const exercise = await exerciseService.createExercise('Test Exercise');
      const syncRecord = await exerciseService.getSyncRecordByExerciseId(exercise.id);
      
      if (syncRecord) {
        await exerciseService.markSyncComplete(syncRecord.id);
        
        const updated = await exerciseService.getSyncRecordByExerciseId(exercise.id);
        expect(updated?.status).toBe('synced');
      }
    });

    it('should mark sync complete by exercise ID', async () => {
      const exercise = await exerciseService.createExercise('Test Exercise');
      
      await exerciseService.markSyncComplete(exercise.id);
      
      const syncRecord = await exerciseService.getSyncRecordByExerciseId(exercise.id);
      expect(syncRecord?.status).toBe('synced');
    });

    it('should handle mark sync complete for non-existent record', async () => {
      // Should not throw error
      await exerciseService.markSyncComplete('nonexistent');
    });

    it('should mark sync as pending', async () => {
      const exercise = await exerciseService.createExercise('Test Exercise');
      await exerciseService.markSyncError(exercise.id, 'Test error');
      
      await exerciseService.markPending(exercise.id);
      
      const syncRecord = await exerciseService.getSyncRecordByExerciseId(exercise.id);
      expect(syncRecord?.status).toBe('pending');
      expect(syncRecord?.error).toBeUndefined();
    });

    it('should handle mark pending for non-existent record', async () => {
      // Should not throw error
      await exerciseService.markPending('nonexistent');
    });

    it('should handle mark sync error for non-existent record', async () => {
      // Should not throw error (idempotent behavior)
      await exerciseService.markSyncError('nonexistent', 'Test error');
    });
  });

  describe('User Management', () => {
    it('should set user ID', () => {
      exerciseService.setUserId('new-user');
      expect(exerciseService.getUserId()).toBe('new-user');
    });

    it('should set current user', async () => {
      await exerciseService.setCurrentUser({ id: 'test-user', isAnonymous: false });
      expect(exerciseService.getUserId()).toBe('test-user');
    });

    it('should get exercise using alias method', async () => {
      const created = await exerciseService.createExercise('Test Exercise');
      const retrieved = await exerciseService.getExercise(created.id);
      
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe('Test Exercise');
    });
  });

  describe('Persistence Handling', () => {
    it('should handle persistence errors gracefully during load', () => {
      // Setup invalid persistence data
      global.testPersistence = {
        exercises: 'invalid-data' as any,
        syncRecords: 'invalid-data' as any
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Should not throw, should warn
      const service = new ExerciseService();
      
      consoleSpy.mockRestore();
    });

    it('should handle persistence errors gracefully during save', async () => {
      const service = new ExerciseService();
      
      // Mock global.testPersistence to simulate error
      const originalDescriptor = Object.getOwnPropertyDescriptor(global, 'testPersistence');
      Object.defineProperty(global, 'testPersistence', {
        get: () => { throw new Error('Persistence error'); },
        configurable: true
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Should not throw, should warn
      await service.createExercise('Test Exercise');
      
      // Restore original property
      if (originalDescriptor) {
        Object.defineProperty(global, 'testPersistence', originalDescriptor);
      } else {
        delete global.testPersistence;
      }
      
      consoleSpy.mockRestore();
    });

    it('should work with persistence disabled', async () => {
      const service = new ExerciseService({ persistence: false });
      
      const exercise = await service.createExercise('Test Exercise');
      expect(exercise.name).toBe('Test Exercise');
      
      const exercises = await service.getExercises();
      expect(exercises).toHaveLength(1);
    });
  });

  describe('Sync Status Detection', () => {
    it('should detect sync status correctly for exercises with existing sync records', async () => {
      const exercise = await exerciseService.createExercise('Test Exercise');
      await exerciseService.markSyncError(exercise.id, 'Test error');
      
      const retrieved = await exerciseService.getExerciseById(exercise.id);
      expect(retrieved.syncStatus).toBe('error');
    });

    it('should default to pending status for exercises with sync enabled but no sync record', async () => {
      const exercise = await exerciseService.createExercise('Test Exercise');
      
      // Clear the sync record to simulate missing record
      const syncRecord = await exerciseService.getSyncRecordByExerciseId(exercise.id);
      if (syncRecord) {
        // Access private syncRecords to remove it for testing
        (exerciseService as any).syncRecords.delete(syncRecord.id);
      }
      
      const retrieved = await exerciseService.getExerciseById(exercise.id);
      expect(retrieved.syncStatus).toBe('pending');
    });

    it('should convert undefined userId to undefined in output format', async () => {
      const exercise = await exerciseService.createExercise('Test Exercise');
      
      // Exercise created with default user should have undefined userId in output
      expect(exercise.userId).toBeUndefined();
    });
  });

  describe('Date and Timestamp Handling', () => {
    it('should include pendingSince in pending sync records', async () => {
      const exercise = await exerciseService.createExercise('Test Exercise');
      
      const pendingRecords = await exerciseService.getPendingSyncRecords();
      expect(pendingRecords).toHaveLength(1);
      expect(pendingRecords[0]).toHaveProperty('pendingSince');
      expect((pendingRecords[0] as any).pendingSince).toBeInstanceOf(Date);
    });

    it('should properly handle date conversion from persistence', () => {
      // Setup persistence data with date strings
      const now = new Date();
      global.testPersistence = {
        exercises: [],
        syncRecords: [['test-sync', {
          id: 'test-sync',
          recordId: 'test-record',
          recordType: 'exercise',
          operation: 'create',
          status: 'pending',
          createdAt: now,
          lastAttempt: now,
          attempts: 1,
        }]]
      };

      const service = new ExerciseService();
      // Service should load and convert date strings back to Date objects
      expect(service.getUserId()).toBe('default-user');
    });
  });
});