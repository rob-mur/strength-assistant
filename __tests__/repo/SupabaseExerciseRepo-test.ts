import { SupabaseExerciseRepo } from '@/lib/repo/SupabaseExerciseRepo';
import { Exercise, ExerciseInput, ExerciseValidator } from '@/lib/models/Exercise';
import { supabaseClient } from '@/lib/data/supabase/SupabaseClient';
import { exercises$, user$ } from '@/lib/data/store';
import { syncExerciseToSupabase, deleteExerciseFromSupabase, syncHelpers } from '@/lib/data/sync/syncConfig';

// Mock all external dependencies
jest.mock('@/lib/data/supabase/SupabaseClient');
jest.mock('@/lib/data/store', () => ({
  exercises$: {
    get: jest.fn(),
    set: jest.fn(),
  },
  user$: {
    get: jest.fn(),
  },
}));
jest.mock('@/lib/data/sync/syncConfig');
jest.mock('@/lib/models/Exercise');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123'),
}));

// Mock @legendapp/state
jest.mock('@legendapp/state', () => ({
  Observable: jest.fn(),
  observe: jest.fn(),
  computed: jest.fn(),
}), { virtual: true });

describe('SupabaseExerciseRepo', () => {
  let repo: SupabaseExerciseRepo;
  const testUserId = 'test-user-123';
  const testExerciseId = 'test-exercise-123';
  const testExercise: Exercise = {
    id: testExerciseId,
    name: 'Test Exercise',
    user_id: testUserId,
    created_at: '2023-01-01T00:00:00.000Z'
  };

  const mockUser = { id: testUserId, email: 'test@example.com' };
  const mockExercises = [testExercise];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    (supabaseClient.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (exercises$.get as jest.Mock).mockReturnValue(mockExercises);
    (exercises$.set as jest.Mock).mockImplementation();
    (user$.get as jest.Mock).mockReturnValue(mockUser);
    (ExerciseValidator.validateExerciseInput as jest.Mock).mockImplementation();
    (ExerciseValidator.sanitizeExerciseName as jest.Mock).mockImplementation((name: string) => name.trim());
    (syncExerciseToSupabase as jest.Mock).mockResolvedValue(undefined);
    (deleteExerciseFromSupabase as jest.Mock).mockResolvedValue(undefined);
    
    // Mock syncHelpers
    (syncHelpers.isSyncing as jest.Mock).mockReturnValue(false);
    (syncHelpers.isOnline as jest.Mock).mockReturnValue(true);
    (syncHelpers.getPendingChangesCount as jest.Mock).mockReturnValue(0);
    (syncHelpers.forceSync as jest.Mock).mockResolvedValue(undefined);
    (syncHelpers.hasErrors as jest.Mock).mockReturnValue(false);
    (syncHelpers.getErrorMessage as jest.Mock).mockReturnValue(null);

    repo = SupabaseExerciseRepo.getInstance();
  });

  describe('Singleton Pattern', () => {
    test('getInstance returns the same instance', () => {
      const repo1 = SupabaseExerciseRepo.getInstance();
      const repo2 = SupabaseExerciseRepo.getInstance();
      
      expect(repo1).toBe(repo2);
      expect(repo1).toBeInstanceOf(SupabaseExerciseRepo);
    });
  });

  describe('addExercise', () => {
    const exerciseInput: ExerciseInput = { name: 'Test Exercise' };

    test('successfully adds exercise with optimistic updates', async () => {
      await repo.addExercise(testUserId, exerciseInput);

      expect(ExerciseValidator.validateExerciseInput).toHaveBeenCalledWith(exerciseInput);
      expect(ExerciseValidator.sanitizeExerciseName).toHaveBeenCalledWith(exerciseInput.name);
      expect(supabaseClient.getCurrentUser).toHaveBeenCalled();
      expect(exercises$.get).toHaveBeenCalled();
      expect(exercises$.set).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'test-uuid-123',
            name: exerciseInput.name.trim(),
            user_id: testUserId
          })
        ])
      );
      expect(syncExerciseToSupabase).toHaveBeenCalled();
    });

    test('throws error when user not authenticated', async () => {
      (supabaseClient.getCurrentUser as jest.Mock).mockResolvedValue(null);

      await expect(repo.addExercise(testUserId, exerciseInput))
        .rejects.toThrow('User not authenticated with Supabase');
    });

    test('throws error when user ID mismatch', async () => {
      (supabaseClient.getCurrentUser as jest.Mock).mockResolvedValue({ id: 'different-user' });

      await expect(repo.addExercise(testUserId, exerciseInput))
        .rejects.toThrow('User ID mismatch');
    });

    test('validates exercise input', async () => {
      const validationError = new Error('Invalid exercise name');
      (ExerciseValidator.validateExerciseInput as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await expect(repo.addExercise(testUserId, exerciseInput))
        .rejects.toThrow('Invalid exercise name');
    });

    test('rolls back optimistic update on sync failure', async () => {
      const syncError = new Error('Sync failed');
      (syncExerciseToSupabase as jest.Mock).mockRejectedValue(syncError);

      const originalExercises = [{ id: 'existing', name: 'Existing' }];
      (exercises$.get as jest.Mock).mockReturnValue(originalExercises);

      await expect(repo.addExercise(testUserId, exerciseInput))
        .rejects.toThrow('Sync failed');

      // Should roll back to original state
      expect(exercises$.set).toHaveBeenCalledWith(originalExercises);
    });

    test('handles user ID consistency check when userId is empty', async () => {
      await repo.addExercise('', exerciseInput);
      
      // Should not throw error when empty userId is provided
      expect(supabaseClient.getCurrentUser).toHaveBeenCalled();
      expect(syncExerciseToSupabase).toHaveBeenCalled();
    });
  });

  describe('getExerciseById', () => {
    test('returns exercise when found', async () => {
      const result = await repo.getExerciseById(testExerciseId, testUserId);

      expect(exercises$.get).toHaveBeenCalled();
      expect(result).toEqual(testExercise);
    });

    test('returns undefined when exercise not found', async () => {
      (exercises$.get as jest.Mock).mockReturnValue([]);

      const result = await repo.getExerciseById('non-existent', testUserId);

      expect(result).toBeUndefined();
    });

    test('filters exercises by user_id', async () => {
      const otherUserExercise = { ...testExercise, id: 'other', user_id: 'other-user' };
      (exercises$.get as jest.Mock).mockReturnValue([testExercise, otherUserExercise]);

      const result = await repo.getExerciseById(testExerciseId, testUserId);

      expect(result).toEqual(testExercise);
    });
  });

  describe('getExercises', () => {
    test('returns computed observable filtered by current user', () => {
      const computed = require('@legendapp/state').computed;
      const mockObservable = { subscribe: jest.fn() };
      computed.mockReturnValue(mockObservable);

      const result = repo.getExercises(testUserId);

      expect(computed).toHaveBeenCalled();
      expect(result).toBe(mockObservable);
    });

    test('computed function filters exercises by current user', () => {
      const computed = require('@legendapp/state').computed;
      let computedFunction: () => Exercise[];

      computed.mockImplementation((fn: () => Exercise[]) => {
        computedFunction = fn;
        return { subscribe: jest.fn() };
      });

      repo.getExercises(testUserId);

      // Test the computed function
      const result = computedFunction!();
      expect(user$.get).toHaveBeenCalled();
      expect(exercises$.get).toHaveBeenCalled();
      expect(result).toEqual(mockExercises);
    });

    test('returns empty array when no current user', () => {
      const computed = require('@legendapp/state').computed;
      let computedFunction: () => Exercise[];

      computed.mockImplementation((fn: () => Exercise[]) => {
        computedFunction = fn;
        return { subscribe: jest.fn() };
      });

      (user$.get as jest.Mock).mockReturnValue(null);

      repo.getExercises(testUserId);

      const result = computedFunction!();
      expect(result).toEqual([]);
    });
  });

  describe('deleteExercise', () => {
    test('successfully deletes exercise with optimistic update', async () => {
      await repo.deleteExercise(testUserId, testExerciseId);

      expect(supabaseClient.getCurrentUser).toHaveBeenCalled();
      expect(exercises$.get).toHaveBeenCalled();
      expect(exercises$.set).toHaveBeenCalledWith([]);
      expect(deleteExerciseFromSupabase).toHaveBeenCalledWith(testExerciseId, testUserId);
    });

    test('validates exerciseId parameter', async () => {
      await expect(repo.deleteExercise(testUserId, ''))
        .rejects.toThrow('Valid exerciseId is required');

      await expect(repo.deleteExercise(testUserId, '   '))
        .rejects.toThrow('Valid exerciseId is required');

      await expect(repo.deleteExercise(testUserId, null as any))
        .rejects.toThrow('Valid exerciseId is required');
    });

    test('throws error when user not authenticated', async () => {
      (supabaseClient.getCurrentUser as jest.Mock).mockResolvedValue(null);

      await expect(repo.deleteExercise(testUserId, testExerciseId))
        .rejects.toThrow('User not authenticated with Supabase');
    });

    test('throws error when user ID mismatch', async () => {
      (supabaseClient.getCurrentUser as jest.Mock).mockResolvedValue({ id: 'different-user' });

      await expect(repo.deleteExercise(testUserId, testExerciseId))
        .rejects.toThrow('User ID mismatch');
    });

    test('rolls back optimistic update on sync failure', async () => {
      const syncError = new Error('Delete sync failed');
      (deleteExerciseFromSupabase as jest.Mock).mockRejectedValue(syncError);

      await expect(repo.deleteExercise(testUserId, testExerciseId))
        .rejects.toThrow('Delete sync failed');

      // Should roll back to original state
      expect(exercises$.set).toHaveBeenCalledWith(mockExercises);
    });

    test('only deletes exercises matching both exerciseId and user_id', async () => {
      const otherUserExercise = { ...testExercise, id: testExerciseId, user_id: 'other-user' };
      const userExercises = [testExercise, otherUserExercise];
      (exercises$.get as jest.Mock).mockReturnValue(userExercises);

      await repo.deleteExercise(testUserId, testExerciseId);

      // Should only remove the exercise for the current user
      expect(exercises$.set).toHaveBeenCalledWith([otherUserExercise]);
    });
  });

  describe('subscribeToExercises', () => {
    test('sets up observable subscription with user filtering', () => {
      const observe = require('@legendapp/state').observe;
      const mockUnsubscribe = jest.fn();
      const callback = jest.fn();

      observe.mockReturnValue(mockUnsubscribe);

      const result = repo.subscribeToExercises(testUserId, callback);

      expect(observe).toHaveBeenCalled();
      expect(result).toBe(mockUnsubscribe);
    });

    test('observe function calls callback with filtered exercises', () => {
      const observe = require('@legendapp/state').observe;
      let observeFunction: () => void;

      observe.mockImplementation((fn: () => void) => {
        observeFunction = fn;
        return jest.fn();
      });

      const callback = jest.fn();
      repo.subscribeToExercises(testUserId, callback);

      observeFunction!();

      expect(user$.get).toHaveBeenCalled();
      expect(exercises$.get).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(mockExercises);
    });

    test('calls callback with empty array when no current user', () => {
      const observe = require('@legendapp/state').observe;
      let observeFunction: () => void;

      observe.mockImplementation((fn: () => void) => {
        observeFunction = fn;
        return jest.fn();
      });

      (user$.get as jest.Mock).mockReturnValue(null);
      const callback = jest.fn();
      
      repo.subscribeToExercises(testUserId, callback);
      observeFunction!();

      expect(callback).toHaveBeenCalledWith([]);
    });
  });

  describe('Offline-first capabilities', () => {
    test('isSyncing delegates to syncHelpers', () => {
      const result = repo.isSyncing();
      
      expect(syncHelpers.isSyncing).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    test('isOnline delegates to syncHelpers', () => {
      const result = repo.isOnline();
      
      expect(syncHelpers.isOnline).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('getPendingChangesCount delegates to syncHelpers', () => {
      const result = repo.getPendingChangesCount();
      
      expect(syncHelpers.getPendingChangesCount).toHaveBeenCalled();
      expect(result).toBe(0);
    });

    test('forceSync delegates to syncHelpers', async () => {
      await repo.forceSync();
      
      expect(syncHelpers.forceSync).toHaveBeenCalled();
    });

    test('hasErrors delegates to syncHelpers', () => {
      const result = repo.hasErrors();
      
      expect(syncHelpers.hasErrors).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    test('getErrorMessage delegates to syncHelpers', () => {
      const result = repo.getErrorMessage();
      
      expect(syncHelpers.getErrorMessage).toHaveBeenCalled();
      expect(result).toBe(null);
    });

    test('getErrorMessage returns null when syncHelpers returns undefined', () => {
      (syncHelpers.getErrorMessage as jest.Mock).mockReturnValue(undefined);
      
      const result = repo.getErrorMessage();
      
      expect(result).toBe(null);
    });
  });

  describe('Legacy methods for backwards compatibility', () => {
    test('getExercisesCollectionPath returns correct path', () => {
      // Access private method through prototype for testing
      const getExercisesCollectionPath = (SupabaseExerciseRepo.prototype as any).getExercisesCollectionPath;
      const boundMethod = getExercisesCollectionPath.bind(repo);

      expect(boundMethod(testUserId)).toBe(`users/${testUserId}/exercises`);
      expect(boundMethod('another-user')).toBe('users/another-user/exercises');
    });

    test('validateExerciseData correctly validates exercise data', () => {
      // Access private method through prototype for testing
      const validateExerciseData = (SupabaseExerciseRepo.prototype as any).validateExerciseData;
      const boundMethod = validateExerciseData.bind(repo);

      // Valid data
      expect(boundMethod({ name: 'Push-ups' })).toBe(true);
      expect(boundMethod({ name: 'Squats', id: 'test-id' })).toBe(true);

      // Invalid data
      expect(boundMethod(null)).toBe(false);
      expect(boundMethod(undefined)).toBe(false);
      expect(boundMethod('string')).toBe(false);
      expect(boundMethod(123)).toBe(false);
      expect(boundMethod({})).toBe(false);
      expect(boundMethod({ name: 123 })).toBe(false);
      expect(boundMethod({ name: '' })).toBe(false);
      expect(boundMethod({ name: '   ' })).toBe(false);
    });
  });

  describe('Error handling', () => {
    test('addExercise logs and re-throws errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');
      
      (supabaseClient.getCurrentUser as jest.Mock).mockRejectedValue(error);

      await expect(repo.addExercise(testUserId, { name: 'Test' }))
        .rejects.toThrow('Test error');

      expect(consoleError).toHaveBeenCalledWith('Failed to add exercise:', error);
      consoleError.mockRestore();
    });

    test('deleteExercise logs and re-throws errors', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');
      
      (supabaseClient.getCurrentUser as jest.Mock).mockRejectedValue(error);

      await expect(repo.deleteExercise(testUserId, testExerciseId))
        .rejects.toThrow('Test error');

      expect(consoleError).toHaveBeenCalledWith('Failed to delete exercise:', error);
      consoleError.mockRestore();
    });
  });

  describe('Console logging', () => {
    test('addExercise includes console.log statements', async () => {
      const consoleLog = jest.spyOn(console, 'log').mockImplementation();

      await repo.addExercise(testUserId, { name: 'Test' });

      expect(consoleLog).toHaveBeenCalledWith("About to parse exercise");
      expect(consoleLog).toHaveBeenCalledWith("About to get user");
      expect(consoleLog).toHaveBeenCalledWith("About to get current exercise state");
      expect(consoleLog).toHaveBeenCalledWith("About to try and sync");
      
      consoleLog.mockRestore();
    });

    test('sync failure logs rollback message', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const syncError = new Error('Sync failed');
      (syncExerciseToSupabase as jest.Mock).mockRejectedValue(syncError);

      await expect(repo.addExercise(testUserId, { name: 'Test' }))
        .rejects.toThrow('Sync failed');

      expect(consoleError).toHaveBeenCalledWith('Sync failed, rolled back optimistic update:', syncError);
      consoleError.mockRestore();
    });

    test('delete sync failure logs rollback message', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const syncError = new Error('Delete sync failed');
      (deleteExerciseFromSupabase as jest.Mock).mockRejectedValue(syncError);

      await expect(repo.deleteExercise(testUserId, testExerciseId))
        .rejects.toThrow('Delete sync failed');

      expect(consoleError).toHaveBeenCalledWith('Delete sync failed, rolled back optimistic update:', syncError);
      consoleError.mockRestore();
    });
  });
});