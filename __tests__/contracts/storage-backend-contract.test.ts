/**
 * Contract Test: StorageBackend Interface
 * 
 * This test ensures that any StorageBackend implementation (Firebase or Supabase)
 * conforms to the expected interface and behavior.
 * 
 * CRITICAL: This test MUST fail initially - implementations don't exist yet.
 */

import { StorageBackend } from '../../lib/data/supabase/SupabaseStorage';
import type { ExerciseRecord } from '../../lib/models/ExerciseRecord';
import type { UserAccount } from '../../lib/models/UserAccount';
import type { SyncStateRecord } from '../../lib/models/SyncStateRecord';

describe('StorageBackend Contract', () => {
  let storageBackend: StorageBackend;

  beforeEach(() => {
    // Import and instantiate SupabaseStorage
    const { SupabaseStorage } = require('../../lib/data/supabase/SupabaseStorage');
    storageBackend = new SupabaseStorage();
  });

  afterEach(async () => {
    // Cleanup any test data
    if (storageBackend.signOut) {
      await storageBackend.signOut();
    }
  });

  describe('Exercise CRUD Operations', () => {
    it('should create an exercise with required fields', async () => {
      const exerciseData = {
        name: 'Test Exercise'
      };

      const result = await storageBackend.createExercise(exerciseData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Exercise');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.syncStatus).toBe('pending');
    });

    it('should retrieve exercises for a user', async () => {
      const userId = 'test-user-id';
      
      const exercises = await storageBackend.getExercises(userId);

      expect(Array.isArray(exercises)).toBe(true);
      // Each exercise should conform to ExerciseRecord interface
      exercises.forEach(exercise => {
        expect(exercise.id).toBeDefined();
        expect(exercise.name).toBeDefined();
        expect(exercise.createdAt).toBeInstanceOf(Date);
        expect(exercise.updatedAt).toBeInstanceOf(Date);
        expect(['pending', 'synced', 'error']).toContain(exercise.syncStatus);
      });
    });

    it('should retrieve exercises for anonymous users (no userId)', async () => {
      const exercises = await storageBackend.getExercises();

      expect(Array.isArray(exercises)).toBe(true);
    });

    it('should update an exercise', async () => {
      // First create an exercise
      const exerciseData = { name: 'Original Name' };
      const created = await storageBackend.createExercise(exerciseData);

      // Add sufficient delay to ensure timestamp precision
      await new Promise(resolve => setTimeout(resolve, 15));

      // Then update it
      const updated = await storageBackend.updateExercise(created.id, {
        name: 'Updated Name'
      });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe('Updated Name');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
      expect(updated.syncStatus).toBe('pending');
    });

    it('should delete an exercise', async () => {
      // First create an exercise
      const exerciseData = { name: 'To Be Deleted' };
      const created = await storageBackend.createExercise(exerciseData);

      // Then delete it
      await expect(storageBackend.deleteExercise(created.id)).resolves.not.toThrow();

      // Verify it's no longer in the list
      const exercises = await storageBackend.getExercises();
      expect(exercises.find(ex => ex.id === created.id)).toBeUndefined();
    });
  });

  describe('User Management', () => {
    it('should return null when no user is authenticated', async () => {
      const user = await storageBackend.getCurrentUser();
      expect(user).toBeNull();
    });

    it('should sign in with email and password', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const user = await storageBackend.signInWithEmail(email, password);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.isAnonymous).toBe(false);
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should sign up with email and password', async () => {
      const email = 'newuser@example.com';
      const password = 'password123';

      const user = await storageBackend.signUpWithEmail(email, password);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.isAnonymous).toBe(false);
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should sign in anonymously', async () => {
      const user = await storageBackend.signInAnonymously();

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBeUndefined();
      expect(user.isAnonymous).toBe(true);
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should sign out', async () => {
      // First sign in
      await storageBackend.signInAnonymously();
      
      // Then sign out
      await expect(storageBackend.signOut()).resolves.not.toThrow();
      
      // Verify user is null after sign out
      const user = await storageBackend.getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe.skip('Sync Management', () => {
    it('should get pending sync records', async () => {
      const syncRecords = await storageBackend.getPendingSyncRecords();

      expect(Array.isArray(syncRecords)).toBe(true);
      syncRecords.forEach(record => {
        expect(record.recordId).toBeDefined();
        expect(record.recordType).toBeDefined();
        expect(['create', 'update', 'delete']).toContain(record.operation);
        expect(record.pendingSince).toBeInstanceOf(Date);
        expect(typeof record.attempts).toBe('number');
      });
    });

    it('should mark sync as complete', async () => {
      const recordId = 'test-record-id';
      
      await expect(storageBackend.markSyncComplete(recordId)).resolves.not.toThrow();
    });

    it('should mark sync error', async () => {
      const recordId = 'test-record-id';
      const error = 'Test sync error';
      
      await expect(storageBackend.markSyncError(recordId, error)).resolves.not.toThrow();
    });
  });

  describe('Real-time Subscriptions', () => {
    it('should subscribe to exercises', async () => {
      const userId = 'test-user-id';
      const callback = jest.fn();

      const unsubscribe = storageBackend.subscribeToExercises(userId, callback);

      expect(typeof unsubscribe).toBe('function');
      
      // Cleanup
      unsubscribe();
    });

    it('should subscribe to auth state', async () => {
      const callback = jest.fn();

      const unsubscribe = storageBackend.subscribeToAuthState(callback);

      expect(typeof unsubscribe).toBe('function');
      
      // Cleanup
      unsubscribe();
    });
  });
});