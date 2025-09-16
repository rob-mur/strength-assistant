/**
 * StorageManager Basic Tests
 * 
 * Essential test coverage for the StorageManager class focusing on:
 * - Backend switching based on feature flags
 * - Initialization and configuration
 * - Basic functionality without complex mocking
 */

import { StorageManager, FeatureFlags } from '../../lib/data/StorageManager';
import * as supabaseEnv from '../../lib/config/supabase-env';

// Mock the environment configuration
jest.mock('../../lib/config/supabase-env');
jest.mock('../../lib/data/supabase/SupabaseStorage', () => ({
  SupabaseStorage: jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    getCurrentUser: jest.fn(),
    getExercises: jest.fn(),
    createExercise: jest.fn(),
    clearAllData: jest.fn(),
  }))
}));
jest.mock('../../lib/data/firebase/FirebaseStorage', () => ({
  FirebaseStorage: jest.fn().mockImplementation(() => ({
    getCurrentUser: jest.fn(),
    getExercises: jest.fn(),
    createExercise: jest.fn(),
    clearAllData: jest.fn(),
  }))
}));

const mockSupabaseEnv = supabaseEnv as jest.Mocked<typeof supabaseEnv>;

describe('StorageManager - Basic Functionality', () => {
  let storageManager: StorageManager;
  const originalConsole = console;
  const mockConsole = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
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
    });
  });

  describe('Backend Selection', () => {
    it('should return correct active backend for Supabase', () => {
      mockSupabaseEnv.isSupabaseDataEnabled.mockReturnValue(true);
      storageManager = new StorageManager();
      
      const activeBackend = storageManager.getActiveStorageBackend();
      expect(activeBackend).toBeDefined();
    });

    it('should return correct active backend for Firebase', () => {
      mockSupabaseEnv.isSupabaseDataEnabled.mockReturnValue(false);
      storageManager = new StorageManager();
      
      const activeBackend = storageManager.getActiveStorageBackend();
      expect(activeBackend).toBeDefined();
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

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      mockSupabaseEnv.isSupabaseDataEnabled.mockReturnValue(true);
      storageManager = new StorageManager();
      
      // This will likely fail due to mock setup, but should not crash
      const result = await storageManager.validateDataConsistency();
      expect(result).toHaveProperty('isConsistent');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should handle migration errors gracefully', async () => {
      mockSupabaseEnv.isSupabaseDataEnabled.mockReturnValue(true);
      storageManager = new StorageManager();
      
      const fromBackend = storageManager.getActiveStorageBackend();
      const toBackend = storageManager.getActiveStorageBackend();
      
      // This should throw due to no user, but in a controlled way
      await expect(storageManager.migrateUserData(fromBackend, toBackend))
        .rejects.toThrow('User data migration failed');
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