import { ExerciseRepoFactory } from '@/lib/repo/ExerciseRepoFactory';

// Mock the repository implementations
jest.mock('@/lib/repo/FirebaseExerciseRepo', () => ({
	FirebaseExerciseRepo: {
		getInstance: jest.fn().mockReturnValue({ type: 'firebase' })
	}
}));

jest.mock('@/lib/repo/SupabaseExerciseRepo', () => ({
	SupabaseExerciseRepo: {
		getInstance: jest.fn().mockReturnValue({ type: 'supabase' })
	}
}));

// Mock Expo Constants
jest.mock('expo-constants', () => ({
	default: {
		expoConfig: {
			extra: {}
		}
	}
}));

describe('ExerciseRepoFactory - Environment Variable Handling', () => {
	const originalEnv = process.env;

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

	describe('Dynamic environment variable changes', () => {
		test('switches from Firebase to Supabase when env var changes', () => {
			// Start with Firebase
			process.env.USE_SUPABASE_DATA = 'false';
			const firebaseInstance = ExerciseRepoFactory.getInstance();
			expect((firebaseInstance as any).type).toBe('firebase');

			// Reset factory to simulate environment change
			ExerciseRepoFactory.resetInstances();

			// Change to Supabase
			process.env.USE_SUPABASE_DATA = 'true';
			const supabaseInstance = ExerciseRepoFactory.getInstance();
			expect((supabaseInstance as any).type).toBe('supabase');
		});

		test('switches from Supabase to Firebase when env var changes', () => {
			// Start with Supabase
			process.env.USE_SUPABASE_DATA = 'true';
			const supabaseInstance = ExerciseRepoFactory.getInstance();
			expect((supabaseInstance as any).type).toBe('supabase');

			// Reset factory to simulate environment change
			ExerciseRepoFactory.resetInstances();

			// Change to Firebase
			process.env.USE_SUPABASE_DATA = 'false';
			const firebaseInstance = ExerciseRepoFactory.getInstance();
			expect((firebaseInstance as any).type).toBe('firebase');
		});

		test('handles undefined to true transition', () => {
			// Start with undefined (defaults to Firebase)
			delete process.env.USE_SUPABASE_DATA;
			const firebaseInstance = ExerciseRepoFactory.getInstance();
			expect((firebaseInstance as any).type).toBe('firebase');

			// Reset factory and change to true
			ExerciseRepoFactory.resetInstances();
			process.env.USE_SUPABASE_DATA = 'true';
			const supabaseInstance = ExerciseRepoFactory.getInstance();
			expect((supabaseInstance as any).type).toBe('supabase');
		});

		test('handles true to undefined transition', () => {
			// Start with true
			process.env.USE_SUPABASE_DATA = 'true';
			const supabaseInstance = ExerciseRepoFactory.getInstance();
			expect((supabaseInstance as any).type).toBe('supabase');

			// Reset factory and remove env var
			ExerciseRepoFactory.resetInstances();
			delete process.env.USE_SUPABASE_DATA;
			const firebaseInstance = ExerciseRepoFactory.getInstance();
			expect((firebaseInstance as any).type).toBe('firebase');
		});
	});

	describe('getCurrentDataSource with environment changes', () => {
		test('reflects environment variable changes', () => {
			// Start with Firebase
			process.env.USE_SUPABASE_DATA = 'false';
			expect(ExerciseRepoFactory.getCurrentDataSource()).toBe('firebase');

			// Change to Supabase (without resetting instances)
			process.env.USE_SUPABASE_DATA = 'true';
			expect(ExerciseRepoFactory.getCurrentDataSource()).toBe('supabase');

			// Change back to Firebase
			process.env.USE_SUPABASE_DATA = 'false';
			expect(ExerciseRepoFactory.getCurrentDataSource()).toBe('firebase');

			// Test undefined
			delete process.env.USE_SUPABASE_DATA;
			expect(ExerciseRepoFactory.getCurrentDataSource()).toBe('firebase');
		});
	});

	describe('Edge cases and error conditions', () => {
		test('handles malformed environment variable values', () => {
			const testCases = [
				'TRUE',    // uppercase should work
				'True',    // mixed case should work  
				'false',   // lowercase false
				'FALSE',   // uppercase false
				'yes',     // non-boolean string should default to false
				'no',      // non-boolean string should default to false
				'1',       // numeric string should default to false
				'0',       // numeric string should default to false
				'',        // empty string should default to false
			];

			testCases.forEach((value) => {
				ExerciseRepoFactory.resetInstances();
				process.env.USE_SUPABASE_DATA = value;
				
				const expectedResult = value.toLowerCase() === 'true' ? 'supabase' : 'firebase';
				expect(ExerciseRepoFactory.getCurrentDataSource()).toBe(expectedResult);
			});
		});

		test('prefers process.env over Expo Constants when both are set', () => {
			// Set Expo Constants to use Supabase
			const Constants = require('expo-constants').default;
			Constants.expoConfig.extra.useSupabaseData = true;

			// Set process.env to use Firebase
			process.env.USE_SUPABASE_DATA = 'false';

			// Should prefer process.env
			expect(ExerciseRepoFactory.getCurrentDataSource()).toBe('firebase');
		});

		test('falls back to Expo Constants when process.env is undefined', () => {
			// Remove process.env
			delete process.env.USE_SUPABASE_DATA;

			// Set Expo Constants to use Supabase
			const Constants = require('expo-constants').default;
			Constants.expoConfig.extra.useSupabaseData = true;

			// Should use Expo Constants
			expect(ExerciseRepoFactory.getCurrentDataSource()).toBe('supabase');
		});

		test('handles missing Expo Constants gracefully', () => {
			// Remove process.env
			delete process.env.USE_SUPABASE_DATA;

			// Clear Expo Constants
			const Constants = require('expo-constants').default;
			Constants.expoConfig.extra = {};

			// Should default to Firebase
			expect(ExerciseRepoFactory.getCurrentDataSource()).toBe('firebase');
		});
	});

	describe('Dynamic require behavior', () => {
		test('handles Expo Constants require errors', () => {
			// Mock require to throw an error
			const originalRequire = require;
			const mockRequire = jest.fn().mockImplementation((module: string) => {
				if (module === 'expo-constants') {
					throw new Error('Module not found');
				}
				return originalRequire(module);
			});

			// Replace global require temporarily
			(global as any).require = mockRequire;

			// Remove process.env to force Expo Constants fallback
			delete process.env.USE_SUPABASE_DATA;

			try {
				// Should handle error gracefully and default to Firebase
				expect(ExerciseRepoFactory.getCurrentDataSource()).toBe('firebase');
			} finally {
				// Restore original require
				(global as any).require = originalRequire;
			}
		});
	});
});