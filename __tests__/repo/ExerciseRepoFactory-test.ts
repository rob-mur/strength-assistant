import { ExerciseRepoFactory } from "@/lib/repo/ExerciseRepoFactory";
import { FirebaseExerciseRepo } from "@/lib/repo/FirebaseExerciseRepo";
import { SupabaseExerciseRepo } from "@/lib/repo/SupabaseExerciseRepo";

// Mock Expo Constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {}
    }
  }
}));

// Mock process.env
const originalEnv = process.env;

// Mock Firebase and Supabase implementations
jest.mock('@/lib/repo/FirebaseExerciseRepo');
jest.mock('@/lib/repo/SupabaseExerciseRepo');

describe('ExerciseRepoFactory', () => {
  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
    
    // Reset factory instances
    ExerciseRepoFactory.resetInstances();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getInstance', () => {
    test('returns Firebase implementation when USE_SUPABASE_DATA is false', () => {
      process.env.USE_SUPABASE_DATA = 'false';
      
      const repo = ExerciseRepoFactory.getInstance();
      
      expect(FirebaseExerciseRepo.getInstance).toHaveBeenCalled();
      expect(SupabaseExerciseRepo.getInstance).not.toHaveBeenCalled();
    });

    test('returns Firebase implementation when USE_SUPABASE_DATA is undefined', () => {
      delete process.env.USE_SUPABASE_DATA;
      
      const repo = ExerciseRepoFactory.getInstance();
      
      expect(FirebaseExerciseRepo.getInstance).toHaveBeenCalled();
      expect(SupabaseExerciseRepo.getInstance).not.toHaveBeenCalled();
    });

    test('returns Supabase implementation when USE_SUPABASE_DATA is true', () => {
      process.env.USE_SUPABASE_DATA = 'true';
      
      const repo = ExerciseRepoFactory.getInstance();
      
      expect(SupabaseExerciseRepo.getInstance).toHaveBeenCalled();
      expect(FirebaseExerciseRepo.getInstance).not.toHaveBeenCalled();
    });

    test('returns same Firebase instance on multiple calls', () => {
      process.env.USE_SUPABASE_DATA = 'false';
      
      const repo1 = ExerciseRepoFactory.getInstance();
      const repo2 = ExerciseRepoFactory.getInstance();
      
      // Should only call getInstance once due to caching
      expect(FirebaseExerciseRepo.getInstance).toHaveBeenCalledTimes(1);
    });

    test('returns same Supabase instance on multiple calls', () => {
      process.env.USE_SUPABASE_DATA = 'true';
      
      const repo1 = ExerciseRepoFactory.getInstance();
      const repo2 = ExerciseRepoFactory.getInstance();
      
      // Should only call getInstance once due to caching
      expect(SupabaseExerciseRepo.getInstance).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCurrentDataSource', () => {
    test('returns "firebase" when USE_SUPABASE_DATA is false', () => {
      process.env.USE_SUPABASE_DATA = 'false';
      
      expect(ExerciseRepoFactory.getCurrentDataSource()).toBe('firebase');
    });

    test('returns "firebase" when USE_SUPABASE_DATA is undefined', () => {
      delete process.env.USE_SUPABASE_DATA;
      
      expect(ExerciseRepoFactory.getCurrentDataSource()).toBe('firebase');
    });

    test('returns "supabase" when USE_SUPABASE_DATA is true', () => {
      process.env.USE_SUPABASE_DATA = 'true';
      
      expect(ExerciseRepoFactory.getCurrentDataSource()).toBe('supabase');
    });

    test('handles string case insensitivity', () => {
      process.env.USE_SUPABASE_DATA = 'TRUE';
      
      expect(ExerciseRepoFactory.getCurrentDataSource()).toBe('supabase');
    });

    test('treats non-"true" strings as false', () => {
      process.env.USE_SUPABASE_DATA = 'maybe';
      
      expect(ExerciseRepoFactory.getCurrentDataSource()).toBe('firebase');
    });
  });

  describe('resetInstances', () => {
    test('clears cached instances', () => {
      process.env.USE_SUPABASE_DATA = 'false';
      
      // Get instance to cache it
      ExerciseRepoFactory.getInstance();
      expect(FirebaseExerciseRepo.getInstance).toHaveBeenCalledTimes(1);
      
      // Reset and get again
      ExerciseRepoFactory.resetInstances();
      ExerciseRepoFactory.getInstance();
      expect(FirebaseExerciseRepo.getInstance).toHaveBeenCalledTimes(2);
    });
  });

  describe('Expo Constants integration', () => {
    test('prefers process.env over Expo Constants', () => {
      // Mock Expo Constants with one value
      const Constants = require('expo-constants').default;
      Constants.expoConfig.extra.useSupabaseData = true;
      
      // But set process.env to different value
      process.env.USE_SUPABASE_DATA = 'false';
      
      // Should use process.env value
      expect(ExerciseRepoFactory.getCurrentDataSource()).toBe('firebase');
    });

    test('falls back to Expo Constants when process.env not set', () => {
      // Clear process.env
      delete process.env.USE_SUPABASE_DATA;
      
      // Set Expo Constants value
      const Constants = require('expo-constants').default;
      Constants.expoConfig.extra.useSupabaseData = true;
      
      expect(ExerciseRepoFactory.getCurrentDataSource()).toBe('supabase');
    });
  });
});