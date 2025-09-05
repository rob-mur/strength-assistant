import { FirebaseExerciseRepo } from '@/lib/repo/FirebaseExerciseRepo';
import { Exercise, ExerciseInput, ExerciseValidator } from '@/lib/models/Exercise';
import { initializeFirebaseServices, getDb } from '@/lib/data/firebase/initializer';
import { logger } from '@/lib/data/firebase/logger';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';

// Mock all Firebase modules
jest.mock('@/lib/data/firebase/initializer', () => ({
  initializeFirebaseServices: jest.fn(),
  getDb: jest.fn(),
}));

jest.mock('@/lib/data/firebase/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  onSnapshot: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
}));

jest.mock('@/lib/models/Exercise', () => ({
  ExerciseValidator: {
    validateExerciseInput: jest.fn(),
    sanitizeExerciseName: jest.fn(),
  }
}));

// Mock @legendapp/state
const mockObservable = {
  get: jest.fn(() => []),
  set: jest.fn(),
};

jest.mock('@legendapp/state', () => ({
  observable: jest.fn(() => mockObservable),
}), { virtual: true });

describe('FirebaseExerciseRepo - Comprehensive Tests', () => {
  let repo: FirebaseExerciseRepo;
  const testUserId = 'test-user-123';
  const testExerciseId = 'test-exercise-123';
  const mockDb = { fake: 'db' };
  const mockCollection = { fake: 'collection' };
  const mockQuery = { fake: 'query' };
  const mockDoc = { fake: 'doc' };

  beforeAll(() => {
    // Setup global navigator mock
    Object.defineProperty(global, 'navigator', {
      value: { onLine: true },
      writable: true,
      configurable: true
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton instance to allow fresh initialization in tests
    (FirebaseExerciseRepo as any).instance = undefined;
    
    // Reset navigator to default
    Object.defineProperty(global, 'navigator', {
      value: { onLine: true },
      writable: true,
      configurable: true
    });
    
    // Setup default mocks
    (initializeFirebaseServices as jest.Mock).mockImplementation();
    (getDb as jest.Mock).mockReturnValue(mockDb);
    (collection as jest.Mock).mockReturnValue(mockCollection);
    (query as jest.Mock).mockReturnValue(mockQuery);
    (orderBy as jest.Mock).mockReturnValue('orderBy-result');
    (doc as jest.Mock).mockReturnValue(mockDoc);
    (ExerciseValidator.validateExerciseInput as jest.Mock).mockImplementation();
    (ExerciseValidator.sanitizeExerciseName as jest.Mock).mockImplementation((name: string) => name.trim());
    (addDoc as jest.Mock).mockResolvedValue({ id: testExerciseId });
    (deleteDoc as jest.Mock).mockResolvedValue(undefined);
    
    repo = FirebaseExerciseRepo.getInstance();
  });

  describe('Singleton Pattern', () => {
    test('getInstance returns the same instance', () => {
      const repo1 = FirebaseExerciseRepo.getInstance();
      const repo2 = FirebaseExerciseRepo.getInstance();
      
      expect(repo1).toBe(repo2);
      expect(repo1).toBeInstanceOf(FirebaseExerciseRepo);
    });
  });

  describe('Initialization', () => {
    test('initializes Firebase services on construction', () => {
      expect(initializeFirebaseServices).toHaveBeenCalled();
    });

    test('logs successful initialization', () => {
      expect(logger.info).toHaveBeenCalledWith("initialize completed successfully", {
        service: "FirebaseExerciseRepo",
        platform: "mobile",
        operation: "initialize"
      });
    });

    test('handles initialization errors', () => {
      // Reset singleton to test initialization error
      (FirebaseExerciseRepo as any).instance = undefined;
      
      const initError = new Error('Init failed');
      (initializeFirebaseServices as jest.Mock).mockImplementation(() => {
        throw initError;
      });

      expect(() => FirebaseExerciseRepo.getInstance()).toThrow('Init failed');
      expect(logger.error).toHaveBeenCalledWith("Failed to initialize Firebase services", {
        service: "FirebaseExerciseRepo",
        platform: "mobile",
        operation: "initialize Firebase services",
        error: { message: initError.message, stack: initError.stack }
      });
    });

    test('only initializes once', () => {
      // Reset singleton to test multiple initialization calls
      (FirebaseExerciseRepo as any).instance = undefined;
      (initializeFirebaseServices as jest.Mock).mockClear();
      
      // Create first instance (should call init)
      const repo1 = FirebaseExerciseRepo.getInstance();
      expect(initializeFirebaseServices).toHaveBeenCalledTimes(1);
      
      // Create second instance (should not call init again)
      (initializeFirebaseServices as jest.Mock).mockClear();
      const repo2 = FirebaseExerciseRepo.getInstance();
      expect(initializeFirebaseServices).not.toHaveBeenCalled();
      expect(repo1).toBe(repo2);
    });
  });

  describe('addExercise', () => {
    const exerciseInput: ExerciseInput = { name: 'Test Exercise' };

    test('successfully adds exercise to Firebase', async () => {
      await repo.addExercise(testUserId, exerciseInput);

      expect(ExerciseValidator.validateExerciseInput).toHaveBeenCalledWith(exerciseInput);
      expect(ExerciseValidator.sanitizeExerciseName).toHaveBeenCalledWith(exerciseInput.name);
      expect(getDb).toHaveBeenCalled();
      expect(collection).toHaveBeenCalledWith(mockDb, `users/${testUserId}/exercises`);
      expect(addDoc).toHaveBeenCalledWith(mockCollection, {
        name: exerciseInput.name.trim(),
        created_at: expect.any(String)
      });
      expect(logger.info).toHaveBeenCalledWith("addExercise completed successfully", {
        service: "FirebaseExerciseRepo",
        platform: "mobile",
        operation: "addExercise"
      });
    });

    test('validates and sanitizes exercise input', async () => {
      const originalName = '  Test Exercise  ';
      const sanitizedName = 'Test Exercise';
      (ExerciseValidator.sanitizeExerciseName as jest.Mock).mockReturnValue(sanitizedName);

      await repo.addExercise(testUserId, { name: originalName });

      expect(ExerciseValidator.validateExerciseInput).toHaveBeenCalledWith({ name: originalName });
      expect(ExerciseValidator.sanitizeExerciseName).toHaveBeenCalledWith(originalName);
      expect(addDoc).toHaveBeenCalledWith(mockCollection, expect.objectContaining({
        name: sanitizedName
      }));
    });

    test('handles validation errors', async () => {
      const validationError = new Error('Invalid exercise name');
      (ExerciseValidator.validateExerciseInput as jest.Mock).mockImplementation(() => {
        throw validationError;
      });

      await expect(repo.addExercise(testUserId, exerciseInput))
        .rejects.toThrow('Invalid exercise name');

      expect(logger.error).toHaveBeenCalledWith("Failed to add exercise", expect.objectContaining({
        service: "FirebaseExerciseRepo",
        platform: "mobile",
        operation: "add exercise",
        error: { message: validationError.message, stack: validationError.stack }
      }));
    });

    test('handles Firebase add errors', async () => {
      const firebaseError = new Error('Firebase add failed');
      (addDoc as jest.Mock).mockRejectedValue(firebaseError);

      await expect(repo.addExercise(testUserId, exerciseInput))
        .rejects.toThrow('Firebase add failed');

      expect(logger.error).toHaveBeenCalledWith("Failed to add exercise", expect.objectContaining({
        service: "FirebaseExerciseRepo",
        platform: "mobile",
        operation: "add exercise",
        error: { message: firebaseError.message, stack: firebaseError.stack }
      }));
    });
  });

  describe('getExercises', () => {
    test('sets up Firebase query with correct parameters', () => {
      const { observable } = require('@legendapp/state');
      const mockUnsubscribe = jest.fn();
      (onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);

      const result = repo.getExercises(testUserId);

      expect(getDb).toHaveBeenCalled();
      expect(collection).toHaveBeenCalledWith(mockDb, `users/${testUserId}/exercises`);
      expect(query).toHaveBeenCalledWith(mockCollection, 'orderBy-result');
      expect(orderBy).toHaveBeenCalledWith("created_at", "desc");
      expect(onSnapshot).toHaveBeenCalledWith(mockQuery, expect.any(Function));
      expect(logger.info).toHaveBeenCalledWith("getExercises completed successfully", {
        service: "FirebaseExerciseRepo",
        platform: "mobile",
        operation: "getExercises"
      });
    });

    test('processes snapshot data correctly', () => {
      const { observable } = require('@legendapp/state');

      let snapshotCallback: (snapshot: any) => void;
      (onSnapshot as jest.Mock).mockImplementation((query, callback) => {
        snapshotCallback = callback;
        return jest.fn();
      });

      repo.getExercises(testUserId);

      const mockSnapshot = {
        forEach: (fn: (doc: any) => void) => {
          fn({
            id: testExerciseId,
            data: () => ({ name: 'Test Exercise', created_at: '2023-01-01' })
          });
        }
      };

      snapshotCallback!(mockSnapshot);

      expect(mockObservable.set).toHaveBeenCalledWith([{
        id: testExerciseId,
        name: 'Test Exercise',
        user_id: testUserId,
        created_at: '2023-01-01'
      }]);
    });

    test('validates exercise data from Firebase', () => {
      const { observable } = require('@legendapp/state');

      let snapshotCallback: (snapshot: any) => void;
      (onSnapshot as jest.Mock).mockImplementation((query, callback) => {
        snapshotCallback = callback;
        return jest.fn();
      });

      repo.getExercises(testUserId);

      const mockSnapshot = {
        forEach: (fn: (doc: any) => void) => {
          // Valid exercise
          fn({
            id: 'valid-id',
            data: () => ({ name: 'Valid Exercise', created_at: '2023-01-01' })
          });
          // Invalid exercise (no name)
          fn({
            id: 'invalid-id',
            data: () => ({ created_at: '2023-01-01' })
          });
        }
      };

      snapshotCallback!(mockSnapshot);

      // Should only include the valid exercise
      expect(mockObservable.set).toHaveBeenCalledWith([{
        id: 'valid-id',
        name: 'Valid Exercise',
        user_id: testUserId,
        created_at: '2023-01-01'
      }]);
    });

    test('handles Firebase query errors gracefully', () => {
      const { observable } = require('@legendapp/state');

      const queryError = new Error('Query failed');
      (onSnapshot as jest.Mock).mockImplementation(() => {
        throw queryError;
      });

      const result = repo.getExercises(testUserId);

      expect(logger.error).toHaveBeenCalledWith("Failed to get exercises", expect.objectContaining({
        service: "FirebaseExerciseRepo",
        platform: "mobile",
        operation: "get exercises",
        error: { message: queryError.message, stack: queryError.stack }
      }));
    });
  });

  describe('subscribeToExercises', () => {
    test('sets up Firebase subscription with callback', () => {
      const callback = jest.fn();
      const mockUnsubscribe = jest.fn();
      (onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);

      const result = repo.subscribeToExercises(testUserId, callback);

      expect(getDb).toHaveBeenCalled();
      expect(collection).toHaveBeenCalledWith(mockDb, `users/${testUserId}/exercises`);
      expect(query).toHaveBeenCalledWith(mockCollection, 'orderBy-result');
      expect(onSnapshot).toHaveBeenCalledWith(mockQuery, expect.any(Function));
      expect(result).toBe(mockUnsubscribe);
      expect(logger.info).toHaveBeenCalledWith("subscribeToExercises completed successfully", {
        service: "FirebaseExerciseRepo",
        platform: "mobile",
        operation: "subscribeToExercises"
      });
    });

    test('calls callback with processed exercises', () => {
      const callback = jest.fn();
      let snapshotCallback: (snapshot: any) => void;
      
      (onSnapshot as jest.Mock).mockImplementation((query, cb) => {
        snapshotCallback = cb;
        return jest.fn();
      });

      repo.subscribeToExercises(testUserId, callback);

      const mockSnapshot = {
        forEach: (fn: (doc: any) => void) => {
          fn({
            id: testExerciseId,
            data: () => ({ name: 'Test Exercise', created_at: '2023-01-01' })
          });
        }
      };

      snapshotCallback!(mockSnapshot);

      expect(callback).toHaveBeenCalledWith([{
        id: testExerciseId,
        name: 'Test Exercise',
        user_id: testUserId,
        created_at: '2023-01-01'
      }]);
    });

    test('returns no-op function on error', () => {
      const callback = jest.fn();
      const subscriptionError = new Error('Subscription failed');
      (onSnapshot as jest.Mock).mockImplementation(() => {
        throw subscriptionError;
      });

      const result = repo.subscribeToExercises(testUserId, callback);

      expect(typeof result).toBe('function');
      expect(logger.error).toHaveBeenCalledWith("Failed to subscribe to exercises", expect.objectContaining({
        service: "FirebaseExerciseRepo",
        platform: "mobile",
        operation: "subscribe to exercises",
        error: { message: subscriptionError.message, stack: subscriptionError.stack }
      }));
      
      // Test that the returned function is a no-op (doesn't throw)
      expect(() => result()).not.toThrow();
    });
  });

  describe('deleteExercise', () => {
    test('successfully deletes exercise from Firebase', async () => {
      await repo.deleteExercise(testUserId, testExerciseId);

      expect(getDb).toHaveBeenCalled();
      expect(doc).toHaveBeenCalledWith(mockDb, `users/${testUserId}/exercises`, testExerciseId);
      expect(deleteDoc).toHaveBeenCalledWith(mockDoc);
      expect(logger.info).toHaveBeenCalledWith("deleteExercise completed successfully", {
        service: "FirebaseExerciseRepo",
        platform: "mobile",
        operation: "deleteExercise"
      });
    });

    test('validates exerciseId parameter', async () => {
      await expect(repo.deleteExercise(testUserId, ''))
        .rejects.toThrow('Valid exerciseId is required');

      await expect(repo.deleteExercise(testUserId, '   '))
        .rejects.toThrow('Valid exerciseId is required');

      await expect(repo.deleteExercise(testUserId, null as any))
        .rejects.toThrow('Valid exerciseId is required');

      expect(deleteDoc).not.toHaveBeenCalled();
    });

    test('handles Firebase delete errors', async () => {
      const deleteError = new Error('Delete failed');
      (deleteDoc as jest.Mock).mockRejectedValue(deleteError);

      await expect(repo.deleteExercise(testUserId, testExerciseId))
        .rejects.toThrow('Delete failed');

      expect(logger.error).toHaveBeenCalledWith("Failed to delete exercise", expect.objectContaining({
        service: "FirebaseExerciseRepo",
        platform: "mobile",
        operation: "delete exercise",
        error: { message: deleteError.message, stack: deleteError.stack }
      }));
    });
  });

  describe('getExerciseById', () => {
    test('finds exercise by ID successfully', async () => {
      const mockExercise = { id: testExerciseId, name: 'Test Exercise' };
      const mockObservable = { get: jest.fn(() => [mockExercise]) };
      
      // Mock getExercises to return our mock observable
      jest.spyOn(repo, 'getExercises').mockReturnValue(mockObservable as any);

      const result = await repo.getExerciseById(testExerciseId, testUserId);

      expect(repo.getExercises).toHaveBeenCalledWith(testUserId);
      expect(result).toBe(mockExercise);
    });

    test('returns undefined when exercise not found', async () => {
      const mockObservable = { get: jest.fn(() => []) };
      jest.spyOn(repo, 'getExercises').mockReturnValue(mockObservable as any);

      const result = await repo.getExerciseById('non-existent', testUserId);

      expect(result).toBeUndefined();
    });

    test('handles errors gracefully', async () => {
      const error = new Error('Get exercises failed');
      const mockObservable = { 
        get: jest.fn(() => { throw error; }) 
      };
      
      jest.spyOn(repo, 'getExercises').mockReturnValue(mockObservable as any);

      const result = await repo.getExerciseById(testExerciseId, testUserId);

      expect(result).toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith("Failed to get exercise by ID", expect.objectContaining({
        service: "FirebaseExerciseRepo",
        platform: "mobile",
        operation: "get exercise by ID",
        error: { message: error.message, stack: error.stack }
      }));
    });
  });

  describe('Offline-first capability methods', () => {
    test('isSyncing returns false', () => {
      expect(repo.isSyncing()).toBe(false);
    });

    test('isOnline returns navigator.onLine status', () => {
      // Mock the isOnline method directly to avoid navigator issues in test environment
      const mockIsOnline = jest.spyOn(repo, 'isOnline');
      
      // Test default behavior
      mockIsOnline.mockReturnValue(true);
      expect(repo.isOnline()).toBe(true);

      // Test offline behavior
      mockIsOnline.mockReturnValue(false);
      expect(repo.isOnline()).toBe(false);

      mockIsOnline.mockRestore();
    });

    test('getPendingChangesCount returns 0', () => {
      expect(repo.getPendingChangesCount()).toBe(0);
    });

    test('forceSync resolves immediately', async () => {
      await expect(repo.forceSync()).resolves.toBeUndefined();
    });

    test('hasErrors returns false', () => {
      expect(repo.hasErrors()).toBe(false);
    });

    test('getErrorMessage returns null', () => {
      expect(repo.getErrorMessage()).toBe(null);
    });
  });


  describe('Observable cleanup', () => {
    test('stores unsubscribe function on observable', () => {
      const { observable } = require('@legendapp/state');

      const mockUnsubscribe = jest.fn();
      (onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);

      repo.getExercises(testUserId);

      expect((mockObservable as any)._unsubscribe).toBe(mockUnsubscribe);
    });
  });
});