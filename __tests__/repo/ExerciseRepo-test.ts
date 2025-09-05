import { ExerciseRepo } from '@/lib/repo/ExerciseRepo';
import { ExerciseRepoFactory } from '@/lib/repo/ExerciseRepoFactory';
import { IExerciseRepo } from '@/lib/repo/IExerciseRepo';
import { Exercise, ExerciseInput } from '@/lib/models/Exercise';

// Mock ExerciseRepoFactory
jest.mock('@/lib/repo/ExerciseRepoFactory');

// Mock all dependencies that are imported by the factory
jest.mock('@legendapp/state', () => ({
  observable: jest.fn(),
  observe: jest.fn(),
  computed: jest.fn(),
}), { virtual: true });

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

jest.mock('@/lib/data/supabase/SupabaseClient', () => ({
  supabaseClient: {
    getCurrentUser: jest.fn(),
  }
}));

jest.mock('@/lib/data/store', () => ({
  exercises$: {
    get: jest.fn(),
    set: jest.fn(),
  },
  user$: {
    get: jest.fn(),
  },
}));

jest.mock('@/lib/data/sync/syncConfig', () => ({
  syncExerciseToSupabase: jest.fn(),
  deleteExerciseFromSupabase: jest.fn(),
  syncHelpers: {
    isSyncing: jest.fn(),
    isOnline: jest.fn(),
    getPendingChangesCount: jest.fn(),
    forceSync: jest.fn(),
    hasErrors: jest.fn(),
    getErrorMessage: jest.fn(),
  }
}));

jest.mock('@/lib/models/Exercise', () => ({
  ExerciseValidator: {
    validateExerciseInput: jest.fn(),
    sanitizeExerciseName: jest.fn(),
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

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

describe('ExerciseRepo', () => {
  let mockDelegate: jest.Mocked<IExerciseRepo>;
  const testUserId = 'test-user-123';
  const testExerciseId = 'test-exercise-123';
  const testExercise: Exercise = {
    id: testExerciseId,
    name: 'Test Exercise',
    user_id: testUserId,
    created_at: '2023-01-01T00:00:00.000Z'
  };
  const testExerciseInput: ExerciseInput = { name: 'Test Exercise' };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock delegate with all required methods
    mockDelegate = {
      addExercise: jest.fn(),
      getExercises: jest.fn(),
      deleteExercise: jest.fn(),
      getExerciseById: jest.fn(),
      subscribeToExercises: jest.fn(),
      isSyncing: jest.fn(),
      isOnline: jest.fn(),
      getPendingChangesCount: jest.fn(),
      forceSync: jest.fn(),
      hasErrors: jest.fn(),
      getErrorMessage: jest.fn(),
    };

    // Mock ExerciseRepoFactory to return our mock delegate
    (ExerciseRepoFactory.getInstance as jest.Mock).mockReturnValue(mockDelegate);
    
    // Reset singleton instance to ensure fresh initialization
    (ExerciseRepo as any).instance = undefined;
  });

  describe('Singleton Pattern', () => {
    test('getInstance returns the same instance', () => {
      const repo1 = ExerciseRepo.getInstance();
      const repo2 = ExerciseRepo.getInstance();
      
      expect(repo1).toBe(repo2);
      expect(repo1).toBeInstanceOf(ExerciseRepo);
    });

    test('initializes delegate on construction', () => {
      ExerciseRepo.getInstance();
      
      expect(ExerciseRepoFactory.getInstance).toHaveBeenCalled();
    });
  });

  describe('Delegation Methods', () => {
    let repo: ExerciseRepo;

    beforeEach(() => {
      repo = ExerciseRepo.getInstance();
    });

    test('addExercise delegates to underlying implementation', async () => {
      mockDelegate.addExercise.mockResolvedValue();

      await repo.addExercise(testUserId, testExerciseInput);

      expect(mockDelegate.addExercise).toHaveBeenCalledWith(testUserId, testExerciseInput);
    });

    test('getExercises delegates to underlying implementation', () => {
      const mockObservable = { get: jest.fn(), set: jest.fn() };
      mockDelegate.getExercises.mockReturnValue(mockObservable as any);

      const result = repo.getExercises(testUserId);

      expect(mockDelegate.getExercises).toHaveBeenCalledWith(testUserId);
      expect(result).toBe(mockObservable);
    });

    test('deleteExercise delegates to underlying implementation', async () => {
      mockDelegate.deleteExercise.mockResolvedValue();

      await repo.deleteExercise(testUserId, testExerciseId);

      expect(mockDelegate.deleteExercise).toHaveBeenCalledWith(testUserId, testExerciseId);
    });

    test('getExerciseById delegates to underlying implementation', async () => {
      mockDelegate.getExerciseById.mockResolvedValue(testExercise);

      const result = await repo.getExerciseById(testExerciseId, testUserId);

      expect(mockDelegate.getExerciseById).toHaveBeenCalledWith(testExerciseId, testUserId);
      expect(result).toBe(testExercise);
    });

    test('subscribeToExercises delegates to underlying implementation', () => {
      const callback = jest.fn();
      const mockUnsubscribe = jest.fn();
      mockDelegate.subscribeToExercises.mockReturnValue(mockUnsubscribe);

      const result = repo.subscribeToExercises(testUserId, callback);

      expect(mockDelegate.subscribeToExercises).toHaveBeenCalledWith(testUserId, callback);
      expect(result).toBe(mockUnsubscribe);
    });

    test('isSyncing delegates to underlying implementation', () => {
      mockDelegate.isSyncing.mockReturnValue(true);

      const result = repo.isSyncing();

      expect(mockDelegate.isSyncing).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('isOnline delegates to underlying implementation', () => {
      mockDelegate.isOnline.mockReturnValue(false);

      const result = repo.isOnline();

      expect(mockDelegate.isOnline).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    test('getPendingChangesCount delegates to underlying implementation', () => {
      mockDelegate.getPendingChangesCount.mockReturnValue(5);

      const result = repo.getPendingChangesCount();

      expect(mockDelegate.getPendingChangesCount).toHaveBeenCalled();
      expect(result).toBe(5);
    });

    test('forceSync delegates to underlying implementation', async () => {
      mockDelegate.forceSync.mockResolvedValue();

      await repo.forceSync();

      expect(mockDelegate.forceSync).toHaveBeenCalled();
    });

    test('hasErrors delegates to underlying implementation', () => {
      mockDelegate.hasErrors.mockReturnValue(true);

      const result = repo.hasErrors();

      expect(mockDelegate.hasErrors).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('getErrorMessage delegates to underlying implementation', () => {
      const errorMessage = 'Test error message';
      mockDelegate.getErrorMessage.mockReturnValue(errorMessage);

      const result = repo.getErrorMessage();

      expect(mockDelegate.getErrorMessage).toHaveBeenCalled();
      expect(result).toBe(errorMessage);
    });
  });

  describe('Delegate Refreshing', () => {
    test('creates delegate during initialization', () => {
      // The beforeEach already creates an instance which calls the factory
      // Since we clear mocks in beforeEach, we need to check after getInstance call
      const callCountBefore = (ExerciseRepoFactory.getInstance as jest.Mock).mock.calls.length;
      
      // Reset singleton and create new instance to trigger factory call
      (ExerciseRepo as any).instance = undefined;
      const repo1 = ExerciseRepo.getInstance();
      
      const callCountAfter = (ExerciseRepoFactory.getInstance as jest.Mock).mock.calls.length;
      expect(callCountAfter).toBeGreaterThan(callCountBefore);
      
      // Verify singleton behavior
      const repo2 = ExerciseRepo.getInstance();
      expect(repo1).toBe(repo2);
    });
  });

  describe('Error Handling', () => {
    let repo: ExerciseRepo;

    beforeEach(() => {
      repo = ExerciseRepo.getInstance();
    });

    test('propagates errors from delegate addExercise', async () => {
      const error = new Error('Add exercise failed');
      mockDelegate.addExercise.mockRejectedValue(error);

      await expect(repo.addExercise(testUserId, testExerciseInput))
        .rejects.toThrow('Add exercise failed');
    });

    test('propagates errors from delegate deleteExercise', async () => {
      const error = new Error('Delete exercise failed');
      mockDelegate.deleteExercise.mockRejectedValue(error);

      await expect(repo.deleteExercise(testUserId, testExerciseId))
        .rejects.toThrow('Delete exercise failed');
    });

    test('propagates errors from delegate getExerciseById', async () => {
      const error = new Error('Get exercise failed');
      mockDelegate.getExerciseById.mockRejectedValue(error);

      await expect(repo.getExerciseById(testExerciseId, testUserId))
        .rejects.toThrow('Get exercise failed');
    });

    test('propagates errors from delegate forceSync', async () => {
      const error = new Error('Force sync failed');
      mockDelegate.forceSync.mockRejectedValue(error);

      await expect(repo.forceSync())
        .rejects.toThrow('Force sync failed');
    });
  });
});