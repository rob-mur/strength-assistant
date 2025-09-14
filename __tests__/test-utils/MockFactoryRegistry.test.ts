/**
 * Test: MockFactoryRegistry - T012 Implementation
 * 
 * Validates that the MockFactoryRegistry provides single source of truth
 * for all mock factory operations with backend-agnostic strategies.
 */

import { MockFactoryRegistry, dualBackendRegistry, firebaseRegistry, supabaseRegistry } from '@/lib/test-utils/mocks/MockFactoryRegistry';

describe('MockFactoryRegistry - T012 Implementation', () => {
  
  describe('Backend-Agnostic Exercise Creation', () => {
    test('should create consistent exercise mocks across backends', () => {
      const firebaseExercise = firebaseRegistry.createExercise({ name: 'Firebase Exercise' });
      const supabaseExercise = supabaseRegistry.createExercise({ name: 'Supabase Exercise' });
      
      // Both should have required fields
      expect(firebaseExercise.id).toBeDefined();
      expect(firebaseExercise.name).toBe('Firebase Exercise');
      expect(firebaseExercise.user_id).toBeDefined();
      expect(firebaseExercise.created_at).toBeDefined();
      expect(typeof firebaseExercise.deleted).toBe('boolean');
      
      expect(supabaseExercise.id).toBeDefined();
      expect(supabaseExercise.name).toBe('Supabase Exercise');
      expect(supabaseExercise.user_id).toBeDefined();
      expect(supabaseExercise.created_at).toBeDefined();
      expect(typeof supabaseExercise.deleted).toBe('boolean');
      
      // Should have consistent structure
      expect(Object.keys(firebaseExercise).sort()).toEqual(Object.keys(supabaseExercise).sort());
    });
    
    test('should apply backend-specific normalization', () => {
      const supabaseExercise = supabaseRegistry.createExercise();
      const firebaseExercise = firebaseRegistry.createExercise();
      
      // Supabase should use UUID format
      expect(supabaseExercise.id).toMatch(/^[a-f0-9-]{36}$/);
      
      // Firebase would use different ID format in production
      expect(firebaseExercise.id).toBeDefined();
      expect(firebaseExercise.id.length).toBeGreaterThan(0);
    });
  });
  
  describe('Backend-Agnostic User Creation', () => {
    test('should create consistent authenticated users', () => {
      const email = 'test@example.com';
      const firebaseUser = firebaseRegistry.createAuthenticatedUser(email);
      const supabaseUser = supabaseRegistry.createAuthenticatedUser(email);
      
      // Both should be authenticated users with consistent properties
      expect(firebaseUser.email).toBe(email);
      expect(firebaseUser.isAnonymous).toBe(false);
      expect(firebaseUser.id).toBeDefined();
      expect(firebaseUser.createdAt).toBeDefined();
      
      expect(supabaseUser.email).toBe(email);
      expect(supabaseUser.isAnonymous).toBe(false);
      expect(supabaseUser.id).toBeDefined();
      expect(supabaseUser.createdAt).toBeDefined();
    });
    
    test('should handle anonymous users consistently', () => {
      const firebaseAnon = firebaseRegistry.createUser({ isAnonymous: true });
      const supabaseAnon = supabaseRegistry.createUser({ isAnonymous: true });
      
      expect(firebaseAnon.isAnonymous).toBe(true);
      expect(firebaseAnon.email).toBeUndefined(); // Anonymous users have undefined email
      expect(firebaseAnon.id).toBeDefined();
      expect(firebaseAnon.createdAt).toBeDefined();
      
      expect(supabaseAnon.isAnonymous).toBe(true);
      expect(supabaseAnon.email).toBeUndefined();
      expect(supabaseAnon.id).toBeDefined();
      expect(supabaseAnon.createdAt).toBeDefined();
      
      // Should have consistent structure
      expect(Object.keys(firebaseAnon).sort()).toEqual(Object.keys(supabaseAnon).sort());
    });
  });
  
  describe('Service Mock Strategies', () => {
    test('should provide Firebase service mocks', () => {
      const firebaseRegistry = new MockFactoryRegistry({ backendType: 'firebase' });
      const serviceMocks = firebaseRegistry.getServiceMocks();
      
      expect(serviceMocks).toBeDefined();
      expect(serviceMocks.auth).toBeDefined();
      expect(serviceMocks.firestore).toBeDefined();
    });
    
    test('should provide Supabase service mocks', () => {
      const supabaseRegistry = new MockFactoryRegistry({ backendType: 'supabase' });
      const serviceMocks = supabaseRegistry.getServiceMocks();
      
      expect(serviceMocks).toBeDefined();
      expect(serviceMocks.auth).toBeDefined();
      expect(serviceMocks.database).toBeDefined();
    });
    
    test('should provide dual backend service mocks', () => {
      const serviceMocks = dualBackendRegistry.getServiceMocks();
      
      expect(serviceMocks).toBeDefined();
      expect(serviceMocks.firebase).toBeDefined();
      expect(serviceMocks.supabase).toBeDefined();
      expect(serviceMocks.firebase.auth).toBeDefined();
      expect(serviceMocks.supabase.auth).toBeDefined();
    });
  });
  
  describe('Runtime Validation', () => {
    test('should validate exercise mocks and track statistics', () => {
      const registry = new MockFactoryRegistry({ 
        backendType: 'dual',
        performance: { enableMockValidation: true } 
      });
      
      // Create some exercises
      registry.createExercise({ name: 'Valid Exercise' });
      registry.createExercise({ name: 'Another Exercise' });
      
      const stats = registry.getStatistics();
      expect(stats.totalMocksCreated).toBeGreaterThanOrEqual(2);
      expect(stats.mocksByType['exercise']).toBeGreaterThanOrEqual(2);
      expect(stats.performanceMetrics.avgMockCreationTime).toBeGreaterThanOrEqual(0);
    });
    
    test('should handle validation disabled mode', () => {
      const registry = new MockFactoryRegistry({ 
        backendType: 'firebase',
        performance: { enableMockValidation: false } 
      });
      
      // Should still create mocks without validation overhead
      const exercise = registry.createExercise({ name: 'No Validation' });
      expect(exercise.name).toBe('No Validation');
      
      const stats = registry.getStatistics();
      expect(stats.totalMocksCreated).toBeGreaterThanOrEqual(1);
    });
  });
  
  describe('Configuration Management', () => {
    test('should allow configuration updates', () => {
      const registry = new MockFactoryRegistry({ backendType: 'firebase' });
      
      const initialConfig = registry.getConfiguration();
      expect(initialConfig.backendType).toBe('firebase');
      
      // Update configuration
      registry.updateConfiguration({ 
        backendType: 'supabase',
        performance: { enableMockValidation: false }
      });
      
      const updatedConfig = registry.getConfiguration();
      expect(updatedConfig.backendType).toBe('supabase');
    });
    
    test('should reset statistics correctly', () => {
      const registry = new MockFactoryRegistry();
      
      // Create some mocks
      registry.createExercise();
      registry.createUser();
      
      let stats = registry.getStatistics();
      expect(stats.totalMocksCreated).toBeGreaterThan(0);
      
      // Reset statistics
      registry.resetStatistics();
      
      stats = registry.getStatistics();
      expect(stats.totalMocksCreated).toBe(0);
      expect(Object.keys(stats.mocksByType)).toHaveLength(0);
    });
  });
  
  describe('React Native Mock Integration', () => {
    test('should provide React Native mocks', () => {
      const reactNativeMocks = dualBackendRegistry.getReactNativeMocks();
      
      expect(reactNativeMocks).toBeDefined();
      expect(reactNativeMocks.asyncStorage).toBeDefined();
      expect(reactNativeMocks.navigation).toBeDefined();
      
      // Test AsyncStorage mock functionality
      expect(reactNativeMocks.asyncStorage?.getItem).toBeDefined();
      expect(reactNativeMocks.asyncStorage?.setItem).toBeDefined();
      
      // Test Navigation mock functionality
      expect(reactNativeMocks.navigation?.navigate).toBeDefined();
      expect(reactNativeMocks.navigation?.goBack).toBeDefined();
    });
  });
});