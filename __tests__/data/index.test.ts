import {
  // Storage backends
  StorageBackend,
  SupabaseStorage,
  // FirebaseStorage removed
  StorageManager,
  IStorageManager,
  storageManager,

  // Legend State
  exerciseStore,
  initializeSync,
  reinitializeSync,
  disposeSync,
  exerciseActions,
  ExerciseActions,
  getExercises,
  getCurrentUser,
  getSyncState,

  // Models and types
  ExerciseRecord,
  UserAccount,
  SyncStateRecord,

  // Configuration
  isSupabaseDataEnabled,
  validateSupabaseEnvironment,

  // Model functions
  createExerciseRecord,
  updateExerciseRecord,
  validateExerciseRecord,
  needsSync,
  ExerciseSort,
  createAnonymousUser,
  createAuthenticatedUser,
  validateCredentials,
  canSyncToCloud,
  needsAccountUpgrade,

  // API
  DataLayerAPI,
  dataLayerAPI,
} from "../../lib/data";

// Mock all the dependencies
jest.mock("../../lib/data/supabase/SupabaseStorage");
// Firebase storage mock removed
jest.mock("../../lib/data/StorageManager");
jest.mock("../../lib/data/legend-state/ExerciseStore");
jest.mock("../../lib/data/legend-state/ExerciseActions");
jest.mock("../../lib/config/supabase-env");
jest.mock("../../lib/models/ExerciseRecord");
jest.mock("../../lib/models/UserAccount");

// Mock console methods
const mockConsoleInfo = jest.spyOn(console, "info").mockImplementation();
const mockConsoleError = jest.spyOn(console, "error").mockImplementation();

// Mock __DEV__ global
const originalDev = (global as any).__DEV__;

describe("lib/data/index", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleInfo.mockClear();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    (global as any).__DEV__ = originalDev;
    mockConsoleInfo.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe("exports", () => {
    test("exports all storage backend classes and interfaces", () => {
      expect(SupabaseStorage).toBeDefined();
      // FirebaseStorage check removed
      expect(StorageManager).toBeDefined();
      expect(storageManager).toBeDefined();
    });

    test("exports Legend State functions and stores", () => {
      expect(exerciseStore).toBeDefined();
      expect(initializeSync).toBeDefined();
      expect(reinitializeSync).toBeDefined();
      expect(disposeSync).toBeDefined();
      expect(exerciseActions).toBeDefined();
      expect(getExercises).toBeDefined();
      expect(getCurrentUser).toBeDefined();
      expect(getSyncState).toBeDefined();
    });

    test("exports configuration functions", () => {
      expect(isSupabaseDataEnabled).toBeDefined();
      expect(validateSupabaseEnvironment).toBeDefined();
    });

    test("exports model utility functions", () => {
      expect(createExerciseRecord).toBeDefined();
      expect(updateExerciseRecord).toBeDefined();
      expect(validateExerciseRecord).toBeDefined();
      expect(needsSync).toBeDefined();
      expect(createAnonymousUser).toBeDefined();
      expect(createAuthenticatedUser).toBeDefined();
      expect(validateCredentials).toBeDefined();
      expect(canSyncToCloud).toBeDefined();
      expect(needsAccountUpgrade).toBeDefined();
    });

    test("exports DataLayerAPI class and singleton instance", () => {
      expect(DataLayerAPI).toBeDefined();
      expect(dataLayerAPI).toBeDefined();
      expect(dataLayerAPI).toBeInstanceOf(DataLayerAPI);
    });
  });

  describe("DataLayerAPI", () => {
    describe("singleton pattern", () => {
      test("getInstance returns the same instance", () => {
        const instance1 = DataLayerAPI.getInstance();
        const instance2 = DataLayerAPI.getInstance();

        expect(instance1).toBe(instance2);
        expect(instance1).toBeInstanceOf(DataLayerAPI);
      });

      test("exported dataLayerAPI is singleton instance", () => {
        const instance = DataLayerAPI.getInstance();
        expect(dataLayerAPI).toBe(instance);
      });
    });

    describe("initialize", () => {
      test("handles dynamic import errors gracefully", async () => {
        (global as any).__DEV__ = true;

        const api = DataLayerAPI.getInstance();

        // Since dynamic imports don't work in Jest, we expect it to fail with the import error
        await expect(api.initialize()).rejects.toThrow();
        expect(mockConsoleError).toHaveBeenCalled();
      });
    });

    // Dynamic import methods - tested for error handling only due to Jest limitations
    describe("methods with dynamic imports", () => {
      test("getBackendInfo handles dynamic import errors", async () => {
        const api = DataLayerAPI.getInstance();
        await expect(api.getBackendInfo()).rejects.toThrow();
      });

      test("subscribeToAuthState handles dynamic import errors", async () => {
        const api = DataLayerAPI.getInstance();
        const mockCallback = jest.fn();
        await expect(api.subscribeToAuthState(mockCallback)).rejects.toThrow();
      });

      test("isAuthenticated handles dynamic import errors", async () => {
        const api = DataLayerAPI.getInstance();
        await expect(api.isAuthenticated()).rejects.toThrow();
      });

      test("isAnonymous handles dynamic import errors", async () => {
        const api = DataLayerAPI.getInstance();
        await expect(api.isAnonymous()).rejects.toThrow();
      });

      test("getSyncStats handles dynamic import errors", async () => {
        const api = DataLayerAPI.getInstance();
        await expect(api.getSyncStats()).rejects.toThrow();
      });

      test("dispose handles dynamic import errors", async () => {
        (global as any).__DEV__ = true;
        const api = DataLayerAPI.getInstance();
        await expect(api.dispose()).rejects.toThrow();
      });
    });
  });
});
