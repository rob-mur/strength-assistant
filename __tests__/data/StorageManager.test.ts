/**
 * StorageManager Tests - Supabase Only
 *
 * Test coverage for the StorageManager class focusing on:
 * - Supabase backend integration
 * - Async initialization
 * - Feature flag access
 * - Error handling
 * - Production safety measures
 */

import { StorageManager, FeatureFlags } from "../../lib/data/StorageManager";
import * as supabaseEnv from "../../lib/config/supabase-env";

// Mock the environment configuration
jest.mock("../../lib/config/supabase-env");

// Create mock Supabase backend
const mockSupabaseBackend = {
  // Async initialization (Supabase specific)
  init: jest.fn(),

  // Exercise CRUD operations
  createExercise: jest.fn(),
  getExercises: jest.fn(),
  updateExercise: jest.fn(),
  deleteExercise: jest.fn(),

  // User management
  getCurrentUser: jest.fn(),
  signInWithEmail: jest.fn(),
  signUpWithEmail: jest.fn(),
  signInAnonymously: jest.fn(),
  signOut: jest.fn(),

  // Sync management
  getPendingSyncRecords: jest.fn(),
  markSyncComplete: jest.fn(),
  markSyncError: jest.fn(),

  // Real-time subscriptions
  subscribeToExercises: jest.fn(),
  subscribeToAuthState: jest.fn(),

  // Testing utilities
  clearAllData: jest.fn(),
};

jest.mock("../../lib/data/supabase/SupabaseStorage", () => ({
  SupabaseStorage: jest.fn(() => mockSupabaseBackend),
}));

const mockSupabaseEnv = supabaseEnv as jest.Mocked<typeof supabaseEnv>;

describe("StorageManager - Supabase Only", () => {
  let storageManager: StorageManager;
  const originalConsole = console;
  const mockConsole = {
    info: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock console for cleaner test output
    console.info = mockConsole.info;

    // Reset environment mocks
    mockSupabaseEnv.getSupabaseEnvConfig.mockReturnValue({
      url: "https://test.supabase.co",
      anonKey: "test-anon-key",
      emulatorHost: "127.0.0.1",
      emulatorPort: 54321,
      useEmulator: false,
    });

    storageManager = new StorageManager();
  });

  afterEach(() => {
    console.info = originalConsole.info;
  });

  describe("Initialization", () => {
    it("should initialize with Supabase backend only", () => {
      expect(mockConsole.info).toHaveBeenCalledWith(
        "🔄 StorageManager initialized with Supabase backend",
      );
    });

    it("should call Supabase init when init() is called", async () => {
      await storageManager.init();
      expect(mockSupabaseBackend.init).toHaveBeenCalled();
    });
  });

  describe("Backend Access", () => {
    it("should always return Supabase as active storage backend", () => {
      const backend = storageManager.getActiveStorageBackend();
      expect(backend).toBe(mockSupabaseBackend);
    });

    it("should always return Supabase as auth backend", () => {
      const authBackend = storageManager.getAuthBackend();
      expect(authBackend).toBe(mockSupabaseBackend);
    });

    it("should return correct backend info", () => {
      const info = storageManager.getBackendInfo();
      expect(info).toEqual({
        active: "Supabase",
        available: ["Supabase"],
      });
    });
  });

  describe("Data Management", () => {
    it("should clear all data from Supabase in non-production", async () => {
      process.env.NODE_ENV = "test";

      await storageManager.clearAllData();

      expect(mockSupabaseBackend.clearAllData).toHaveBeenCalled();
      expect(mockConsole.info).toHaveBeenCalledWith(
        "🗑️ Cleared all data from Supabase backend",
      );
    });

    it("should prevent clearing data in production", async () => {
      process.env.NODE_ENV = "production";

      await expect(storageManager.clearAllData()).rejects.toThrow(
        "clearAllData is not available in production",
      );

      expect(mockSupabaseBackend.clearAllData).not.toHaveBeenCalled();
    });
  });
});
