/**
 * StorageManager Enhanced Tests
 * 
 * Comprehensive test coverage for the StorageManager class focusing on:
 * - Backend switching based on feature flags
 * - Data validation and consistency checking
 * - User data migration functionality
 * - Error handling and edge cases
 * - Production safety measures
 */

import { StorageManager, FeatureFlags } from '../../lib/data/StorageManager';
import * as supabaseEnv from '../../lib/config/supabase-env';

// Mock the environment configuration
jest.mock('../../lib/config/supabase-env');

// Create comprehensive mock storage backends
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

const mockFirebaseBackend = {
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

jest.mock('../../lib/data/supabase/SupabaseStorage', () => ({
  SupabaseStorage: jest.fn(() => mockSupabaseBackend)
}));

jest.mock('../../lib/data/firebase/FirebaseStorage', () => ({
  FirebaseStorage: jest.fn(() => mockFirebaseBackend)
}));

const mockSupabaseEnv = supabaseEnv as jest.Mocked<typeof supabaseEnv>;

describe('StorageManager - Enhanced Functionality', () => {
  let storageManager: StorageManager;
  const originalConsole = console;
  const mockConsole = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear all mock functions for Supabase backend
    Object.values(mockSupabaseBackend).forEach((mockFn: any) => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockClear();
      }
    });
    // Clear all mock functions for Firebase backend
    Object.values(mockFirebaseBackend).forEach((mockFn: any) => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockClear();
      }
    });
    Object.assign(console, mockConsole);
  });

  afterEach(() => {
    Object.assign(console, originalConsole);
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with Supabase backend when feature flag is enabled', () => {
      mockSupabaseEnv.isSupabaseDataEnabled.mockReturnValue(true);
      
      storageManager = new StorageManager();
      
      expect(storageManager.getFeatureFlags()).toEqual({
        useSupabaseData: true
      });
    });

    it('should initialize with Firebase backend when feature flag is disabled', () => {
      mockSupabaseEnv.isSupabaseDataEnabled.mockReturnValue(false);
      
      storageManager = new StorageManager();
      
      expect(storageManager.getFeatureFlags()).toEqual({
        useSupabaseData: false
      });
    });

    it('should log initialization message in development', () => {
      const originalDev = __DEV__;
      (global as any).__DEV__ = true;
      
      mockSupabaseEnv.isSupabaseDataEnabled.mockReturnValue(true);
      storageManager = new StorageManager();
      
      expect(mockConsole.info).toHaveBeenCalledWith('🔄 StorageManager initialized with Supabase backend');
      
      (global as any).__DEV__ = originalDev;
    });

    it('should call init on async initialization', async () => {
      mockSupabaseEnv.isSupabaseDataEnabled.mockReturnValue(true);
      storageManager = new StorageManager();
      
      await expect(storageManager.init()).resolves.not.toThrow();
      expect(mockSupabaseBackend.init).toHaveBeenCalled();
    });
  });

  describe('Backend Selection', () => {
    it('should return correct active backend for Supabase', () => {
      mockSupabaseEnv.isSupabaseDataEnabled.mockReturnValue(true);
      storageManager = new StorageManager();
      
      const activeBackend = storageManager.getActiveStorageBackend();
      expect(activeBackend).toBe(mockSupabaseBackend);
    });

    it('should return correct active backend for Firebase', () => {
      mockSupabaseEnv.isSupabaseDataEnabled.mockReturnValue(false);
      storageManager = new StorageManager();
      
      const activeBackend = storageManager.getActiveStorageBackend();
      expect(activeBackend).toBe(mockFirebaseBackend);
    });

    it('should return same backend for auth as for storage', () => {
      mockSupabaseEnv.isSupabaseDataEnabled.mockReturnValue(true);
      storageManager = new StorageManager();
      
      const activeBackend = storageManager.getActiveStorageBackend();
      const authBackend = storageManager.getAuthBackend();
      
      expect(authBackend).toBe(activeBackend);
    });

    it('should return immutable feature flags copy', () => {
      mockSupabaseEnv.isSupabaseDataEnabled.mockReturnValue(true);
      storageManager = new StorageManager();
      
      const flags = storageManager.getFeatureFlags();
      expect(flags).toEqual({ useSupabaseData: true });
      
      // Modifying returned flags should not affect internal state
      flags.useSupabaseData = false;
      expect(storageManager.getFeatureFlags().useSupabaseData).toBe(true);
    });
  });

  describe('Backend Information', () => {
    it('should return correct backend info for Supabase', () => {
      mockSupabaseEnv.isSupabaseDataEnabled.mockReturnValue(true);
      storageManager = new StorageManager();
      
      const info = storageManager.getBackendInfo();
      
      expect(info).toEqual({
        active: 'Supabase',
        available: ['Firebase', 'Supabase']
      });
    });

    it('should return correct backend info for Firebase', () => {
      mockSupabaseEnv.isSupabaseDataEnabled.mockReturnValue(false);
      storageManager = new StorageManager();
      
      const info = storageManager.getBackendInfo();
      
      expect(info).toEqual({
        active: 'Firebase',
        available: ['Firebase', 'Supabase']
      });
    });
  });

  describe('Backend Switching (Development Only)', () => {
    beforeEach(() => {
      mockSupabaseEnv.isSupabaseDataEnabled.mockReturnValue(false);
      storageManager = new StorageManager();
      jest.replaceProperty(process.env, 'NODE_ENV', 'test');
    });

    it('should switch to Supabase backend', () => {
      const originalDev = __DEV__;
      (global as any).__DEV__ = true;
      
      storageManager.switchBackend(true);
      
      expect(storageManager.getFeatureFlags().useSupabaseData).toBe(true);
      expect(mockConsole.info).toHaveBeenCalledWith('🔄 Switched to Supabase backend');
      
      (global as any).__DEV__ = originalDev;
    });

    it('should switch to Firebase backend', () => {
      const originalDev = __DEV__;
      (global as any).__DEV__ = true;
      
      storageManager.switchBackend(true);
      storageManager.switchBackend(false);
      
      expect(storageManager.getFeatureFlags().useSupabaseData).toBe(false);
      expect(mockConsole.info).toHaveBeenLastCalledWith('🔄 Switched to Firebase backend');
      
      (global as any).__DEV__ = originalDev;
    });

    it('should throw error when switching backend in production', () => {
      jest.replaceProperty(process.env, 'NODE_ENV', 'production');
      
      expect(() => {
        storageManager.switchBackend(true);
      }).toThrow('Backend switching is not allowed in production');
    });
  });

  describe('Data Validation and Consistency', () => {
    beforeEach(() => {
      mockSupabaseEnv.isSupabaseDataEnabled.mockReturnValue(true);
      storageManager = new StorageManager();
    });

    it('should validate consistent user data across backends', async () => {
      const originalDev = __DEV__;
      (global as any).__DEV__ = true;
      
      // Mock consistent user data
      const mockUser = { id: '123', email: 'test@example.com', isAnonymous: false };
      mockSupabaseBackend.getCurrentUser.mockResolvedValue(mockUser);
      mockFirebaseBackend.getCurrentUser.mockResolvedValue(mockUser);
      
      // Mock consistent exercise data
      const mockExercises = [{ name: 'Push-ups', userId: '123' }, { name: 'Squats', userId: '123' }];
      mockSupabaseBackend.getExercises.mockResolvedValue(mockExercises);
      mockFirebaseBackend.getExercises.mockResolvedValue(mockExercises);
      
      const result = await storageManager.validateDataConsistency();
      
      expect(result.isConsistent).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(mockConsole.info).toHaveBeenCalledWith('✅ Data consistency validation passed');
      
      (global as any).__DEV__ = originalDev;
    });

    it('should detect user email mismatch', async () => {
      const originalDev = __DEV__;
      (global as any).__DEV__ = true;
      
      // Mock inconsistent user data
      mockSupabaseBackend.getCurrentUser.mockResolvedValue({ id: '123', email: 'user1@example.com', isAnonymous: false });
      mockFirebaseBackend.getCurrentUser.mockResolvedValue({ id: '123', email: 'user2@example.com', isAnonymous: false });
      
      // Mock exercise data
      mockSupabaseBackend.getExercises.mockResolvedValue([]);
      mockFirebaseBackend.getExercises.mockResolvedValue([]);
      
      const result = await storageManager.validateDataConsistency();
      
      expect(result.isConsistent).toBe(false);
      expect(result.errors).toContain('User email mismatch: Supabase(user1@example.com) vs Firebase(user2@example.com)');
      expect(mockConsole.warn).toHaveBeenCalledWith('⚠️ Data consistency issues detected:', expect.any(Array));
      
      (global as any).__DEV__ = originalDev;
    });

    it('should detect user anonymous status mismatch', async () => {
      // Mock inconsistent anonymous status
      mockSupabaseBackend.getCurrentUser.mockResolvedValue({ id: '123', email: null, isAnonymous: true });
      mockFirebaseBackend.getCurrentUser.mockResolvedValue({ id: '123', email: null, isAnonymous: false });
      
      mockSupabaseBackend.getExercises.mockResolvedValue([]);
      mockFirebaseBackend.getExercises.mockResolvedValue([]);
      
      const result = await storageManager.validateDataConsistency();
      
      expect(result.isConsistent).toBe(false);
      expect(result.errors).toContain('User anonymous status mismatch: Supabase(true) vs Firebase(false)');
    });

    it('should detect user presence mismatch', async () => {
      // Mock user presence mismatch
      mockSupabaseBackend.getCurrentUser.mockResolvedValue({ id: '123', email: 'test@example.com', isAnonymous: false });
      mockFirebaseBackend.getCurrentUser.mockResolvedValue(null);
      
      mockSupabaseBackend.getExercises.mockResolvedValue([]);
      mockFirebaseBackend.getExercises.mockResolvedValue([]);
      
      const result = await storageManager.validateDataConsistency();
      
      expect(result.isConsistent).toBe(false);
      expect(result.errors).toContain('User presence mismatch: Supabase(true) vs Firebase(false)');
    });

    it('should detect exercise count mismatch', async () => {
      // Mock consistent users
      const mockUser = { id: '123', email: 'test@example.com', isAnonymous: false };
      mockSupabaseBackend.getCurrentUser.mockResolvedValue(mockUser);
      mockFirebaseBackend.getCurrentUser.mockResolvedValue(mockUser);
      
      // Mock different exercise counts
      mockSupabaseBackend.getExercises.mockResolvedValue([{ name: 'Push-ups' }, { name: 'Squats' }]);
      mockFirebaseBackend.getExercises.mockResolvedValue([{ name: 'Push-ups' }]);
      
      const result = await storageManager.validateDataConsistency();
      
      expect(result.isConsistent).toBe(false);
      expect(result.errors).toContain('Exercise count mismatch: Supabase(2) vs Firebase(1)');
    });

    it('should detect missing exercises in Firebase', async () => {
      // Mock consistent users
      const mockUser = { id: '123', email: 'test@example.com', isAnonymous: false };
      mockSupabaseBackend.getCurrentUser.mockResolvedValue(mockUser);
      mockFirebaseBackend.getCurrentUser.mockResolvedValue(mockUser);
      
      // Mock different exercise names
      mockSupabaseBackend.getExercises.mockResolvedValue([{ name: 'Push-ups' }, { name: 'Squats' }]);
      mockFirebaseBackend.getExercises.mockResolvedValue([{ name: 'Push-ups' }]);
      
      const result = await storageManager.validateDataConsistency();
      
      expect(result.isConsistent).toBe(false);
      expect(result.errors).toContain('Exercise "Squats" exists in Supabase but not Firebase');
    });

    it('should detect missing exercises in Supabase', async () => {
      // Mock consistent users
      const mockUser = { id: '123', email: 'test@example.com', isAnonymous: false };
      mockSupabaseBackend.getCurrentUser.mockResolvedValue(mockUser);
      mockFirebaseBackend.getCurrentUser.mockResolvedValue(mockUser);
      
      // Mock different exercise names
      mockSupabaseBackend.getExercises.mockResolvedValue([{ name: 'Push-ups' }]);
      mockFirebaseBackend.getExercises.mockResolvedValue([{ name: 'Push-ups' }, { name: 'Deadlifts' }]);
      
      const result = await storageManager.validateDataConsistency();
      
      expect(result.isConsistent).toBe(false);
      expect(result.errors).toContain('Exercise "Deadlifts" exists in Firebase but not Supabase');
    });

    it('should handle validation errors gracefully', async () => {
      // Mock backends to throw errors
      mockSupabaseBackend.getCurrentUser.mockRejectedValue(new Error('Supabase connection error'));
      mockFirebaseBackend.getCurrentUser.mockRejectedValue(new Error('Firebase connection error'));
      
      const result = await storageManager.validateDataConsistency();
      expect(result).toHaveProperty('isConsistent');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.isConsistent).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('User Data Migration', () => {
    beforeEach(() => {
      mockSupabaseEnv.isSupabaseDataEnabled.mockReturnValue(true);
      storageManager = new StorageManager();
    });

    it('should successfully migrate user data', async () => {
      const originalDev = __DEV__;
      (global as any).__DEV__ = true;
      
      // Mock successful migration scenario
      const mockUser = { id: '123', email: 'test@example.com', isAnonymous: false };
      const mockExercises = [
        { name: 'Push-ups', userId: '123' },
        { name: 'Squats', userId: '123' }
      ];
      
      mockSupabaseBackend.getCurrentUser.mockResolvedValue(mockUser);
      mockSupabaseBackend.getExercises.mockResolvedValue(mockExercises);
      mockFirebaseBackend.createExercise.mockResolvedValue(undefined);
      
      await storageManager.migrateUserData(mockSupabaseBackend, mockFirebaseBackend);
      
      expect(mockSupabaseBackend.getCurrentUser).toHaveBeenCalled();
      expect(mockSupabaseBackend.getExercises).toHaveBeenCalledWith('123');
      expect(mockFirebaseBackend.createExercise).toHaveBeenCalledTimes(2);
      expect(mockFirebaseBackend.createExercise).toHaveBeenCalledWith({ name: 'Push-ups', userId: '123' });
      expect(mockFirebaseBackend.createExercise).toHaveBeenCalledWith({ name: 'Squats', userId: '123' });
      expect(mockConsole.info).toHaveBeenCalledWith('🔄 Migrating 2 exercises for user test@example.com');
      expect(mockConsole.info).toHaveBeenCalledWith('✅ User data migration completed successfully');
      
      (global as any).__DEV__ = originalDev;
    });

    it('should handle migration with anonymous user', async () => {
      const originalDev = __DEV__;
      (global as any).__DEV__ = true;
      
      // Mock anonymous user
      const mockUser = { id: '123', email: null, isAnonymous: true };
      const mockExercises = [{ name: 'Push-ups', userId: '123' }];
      
      mockSupabaseBackend.getCurrentUser.mockResolvedValue(mockUser);
      mockSupabaseBackend.getExercises.mockResolvedValue(mockExercises);
      mockFirebaseBackend.createExercise.mockResolvedValue(undefined);
      
      await storageManager.migrateUserData(mockSupabaseBackend, mockFirebaseBackend);
      
      expect(mockConsole.info).toHaveBeenCalledWith('🔄 Migrating 1 exercises for user anonymous');
      
      (global as any).__DEV__ = originalDev;
    });

    it('should skip exercises that already exist', async () => {
      const originalDev = __DEV__;
      (global as any).__DEV__ = true;
      
      const mockUser = { id: '123', email: 'test@example.com', isAnonymous: false };
      const mockExercises = [{ name: 'Push-ups', userId: '123' }];
      
      mockSupabaseBackend.getCurrentUser.mockResolvedValue(mockUser);
      mockSupabaseBackend.getExercises.mockResolvedValue(mockExercises);
      
      // Mock "already exists" error
      const alreadyExistsError = new Error('Exercise already exists');
      mockFirebaseBackend.createExercise.mockRejectedValue(alreadyExistsError);
      
      await storageManager.migrateUserData(mockSupabaseBackend, mockFirebaseBackend);
      
      expect(mockConsole.info).toHaveBeenCalledWith('✅ User data migration completed successfully');
      
      (global as any).__DEV__ = originalDev;
    });

    it('should handle migration errors during exercise creation', async () => {
      const originalDev = __DEV__;
      (global as any).__DEV__ = true;
      
      const mockUser = { id: '123', email: 'test@example.com', isAnonymous: false };
      const mockExercises = [{ name: 'Push-ups', userId: '123' }];
      
      mockSupabaseBackend.getCurrentUser.mockResolvedValue(mockUser);
      mockSupabaseBackend.getExercises.mockResolvedValue(mockExercises);
      
      // Mock general error during creation
      const creationError = new Error('Database connection failed');
      mockFirebaseBackend.createExercise.mockRejectedValue(creationError);
      
      await expect(storageManager.migrateUserData(mockSupabaseBackend, mockFirebaseBackend))
        .rejects.toThrow('User data migration failed: Database connection failed');
      
      expect(mockConsole.error).toHaveBeenCalledWith('❌', 'User data migration failed: Database connection failed');
      
      (global as any).__DEV__ = originalDev;
    });

    it('should handle migration errors gracefully', async () => {
      // Mock getCurrentUser to return null (no user found)
      mockSupabaseBackend.getCurrentUser.mockResolvedValue(null);
      
      // This should throw due to no user, but in a controlled way
      await expect(storageManager.migrateUserData(mockSupabaseBackend, mockFirebaseBackend))
        .rejects.toThrow('User data migration failed: No user found in source backend');
    });
  });

  describe('Production Safety', () => {
    it('should reject clearAllData in production', async () => {
      mockSupabaseEnv.isSupabaseDataEnabled.mockReturnValue(true);
      storageManager = new StorageManager();
      
      jest.replaceProperty(process.env, 'NODE_ENV', 'production');
      
      await expect(storageManager.clearAllData())
        .rejects.toThrow('clearAllData is not available in production');
    });

    it('should allow clearAllData in development', async () => {
      mockSupabaseEnv.isSupabaseDataEnabled.mockReturnValue(true);
      storageManager = new StorageManager();
      
      jest.replaceProperty(process.env, 'NODE_ENV', 'test');
      
      const originalDev = __DEV__;
      (global as any).__DEV__ = true;
      
      await expect(storageManager.clearAllData()).resolves.not.toThrow();
      expect(mockConsole.info).toHaveBeenCalledWith('🗑️ Cleared all data from both backends');
      
      (global as any).__DEV__ = originalDev;
    });
  });

  describe('Interface Compliance', () => {
    it('should implement all required methods', () => {
      mockSupabaseEnv.isSupabaseDataEnabled.mockReturnValue(true);
      storageManager = new StorageManager();
      
      expect(typeof storageManager.getActiveStorageBackend).toBe('function');
      expect(typeof storageManager.getAuthBackend).toBe('function');
      expect(typeof storageManager.validateDataConsistency).toBe('function');
      expect(typeof storageManager.migrateUserData).toBe('function');
      expect(typeof storageManager.getFeatureFlags).toBe('function');
      expect(typeof storageManager.getBackendInfo).toBe('function');
      expect(typeof storageManager.switchBackend).toBe('function');
      expect(typeof storageManager.clearAllData).toBe('function');
    });

    it('should have consistent return types', () => {
      mockSupabaseEnv.isSupabaseDataEnabled.mockReturnValue(true);
      storageManager = new StorageManager();
      
      const flags = storageManager.getFeatureFlags();
      expect(typeof flags).toBe('object');
      expect(typeof flags.useSupabaseData).toBe('boolean');
      
      const info = storageManager.getBackendInfo();
      expect(typeof info).toBe('object');
      expect(typeof info.active).toBe('string');
      expect(Array.isArray(info.available)).toBe(true);
    });
  });
});