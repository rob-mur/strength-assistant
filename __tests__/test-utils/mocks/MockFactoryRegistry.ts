/**
 * Mock Factory Registry - Single Source of Truth
 * 
 * T012: Standardized mock factory consistency implementation per constitutional requirements.
 * Provides centralized registry for all mock factories with backend-agnostic strategies,
 * runtime validation, and consistent Exercise/User mock generation.
 * 
 * Evidence-based patterns applied from T008-T010 testing infrastructure work.
 */

import { MockFactoryCollectionImpl } from './MockFactoryCollection';
import type { 
  MockFactoryCollection
} from '../../../specs/001-we-are-actually/contracts/test-infrastructure';

import { Exercise } from '../../../lib/models/Exercise';
import { UserAccount } from '../../../lib/models/UserAccount';

/**
 * Backend-Agnostic Mock Strategy Configuration
 */
export interface BackendAgnosticConfig {
  /** Which backend to simulate: 'firebase' | 'supabase' | 'dual' */
  backendType: 'firebase' | 'supabase' | 'dual';
  
  /** Feature flag settings for dual backend testing */
  featureFlags?: {
    useSupabase?: boolean;
    enableCrossBackendValidation?: boolean;
  };
  
  /** Performance and reliability settings */
  performance?: {
    enableMockValidation?: boolean;
    logMockUsage?: boolean;
    strictTypeChecking?: boolean;
  };
}

/**
 * Mock Validation Results
 */
export interface MockValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  mockType: string;
  mockId?: string;
}

/**
 * Registry Statistics for Monitoring
 */
export interface RegistryStatistics {
  totalMocksCreated: number;
  mocksByType: Record<string, number>;
  validationFailures: number;
  lastValidationRun: Date;
  performanceMetrics: {
    avgMockCreationTime: number;
    avgValidationTime: number;
  };
}

/**
 * Mock Factory Registry Implementation
 * 
 * Single source of truth for all mock factory operations with:
 * - Backend-agnostic mock strategies
 * - Runtime mock validation
 * - Consistent Exercise/User mock generation
 * - Performance monitoring and statistics
 */
export class MockFactoryRegistry {
  private readonly _collection: MockFactoryCollection;
  private _config: BackendAgnosticConfig;
  private _statistics: RegistryStatistics;
  private _mockValidationEnabled: boolean = true;

  constructor(config: BackendAgnosticConfig = { backendType: 'dual' }) {
    this._collection = new MockFactoryCollectionImpl();
    this._config = { ...config };
    this._statistics = {
      totalMocksCreated: 0,
      mocksByType: {},
      validationFailures: 0,
      lastValidationRun: new Date(),
      performanceMetrics: {
        avgMockCreationTime: 0,
        avgValidationTime: 0
      }
    };
    
    // Apply performance configuration
    if (config.performance?.enableMockValidation === false) {
      this._mockValidationEnabled = false;
    }
  }

  // ==================== BACKEND-AGNOSTIC STRATEGIES ====================

  /**
   * Create exercise mock with backend-agnostic strategy
   * Ensures consistent structure regardless of Firebase vs Supabase backend
   */
  createExercise(overrides?: Partial<Exercise>): Exercise {
    const startTime = performance.now();
    
    try {
      const exercise = this._collection.exerciseFactory.createExercise(overrides);
      
      // Apply backend-specific normalization
      const normalizedExercise = this._normalizeExerciseForBackend(exercise);
      
      // Validate if enabled
      if (this._mockValidationEnabled) {
        const validation = this._validateExerciseMock(normalizedExercise);
        if (!validation.isValid) {
          this._statistics.validationFailures++;
          console.warn(`Exercise mock validation failed: ${validation.errors.join(', ')}`);
        }
      }
      
      this._updateStatistics('exercise', performance.now() - startTime);
      return normalizedExercise;
      
    } catch (error) {
      console.error('Exercise mock creation failed:', error);
      throw error;
    }
  }

  /**
   * Create user mock with backend-agnostic strategy
   * Handles both Firebase uid format and Supabase UUID format
   */
  createUser(overrides?: Partial<UserAccount>): UserAccount {
    const startTime = performance.now();
    
    try {
      const user = this._collection.userFactory.createUser(overrides);
      
      // Apply backend-specific user ID format
      const normalizedUser = this._normalizeUserForBackend(user);
      
      // Validate if enabled
      if (this._mockValidationEnabled) {
        const validation = this._validateUserMock(normalizedUser);
        if (!validation.isValid) {
          this._statistics.validationFailures++;
          console.warn(`User mock validation failed: ${validation.errors.join(', ')}`);
        }
      }
      
      this._updateStatistics('user', performance.now() - startTime);
      return normalizedUser;
      
    } catch (error) {
      console.error('User mock creation failed:', error);
      throw error;
    }
  }

  /**
   * Create authenticated user with consistent behavior across backends
   */
  createAuthenticatedUser(email: string, overrides?: Partial<UserAccount>): UserAccount {
    const startTime = performance.now();
    
    try {
      const user = this._collection.userFactory.createAuthenticatedUser(email, overrides);
      const normalizedUser = this._normalizeUserForBackend(user);
      
      // Ensure authentication fields are consistent
      const authenticatedUser: UserAccount = {
        ...normalizedUser,
        isAnonymous: false,
        email: email,
        // Add backend-specific authentication metadata
        ...this._getBackendAuthMetadata()
      };
      
      if (this._mockValidationEnabled) {
        const validation = this._validateUserMock(authenticatedUser);
        if (!validation.isValid) {
          this._statistics.validationFailures++;
          console.warn(`Authenticated user mock validation failed: ${validation.errors.join(', ')}`);
        }
      }
      
      this._updateStatistics('authenticated_user', performance.now() - startTime);
      return authenticatedUser;
      
    } catch (error) {
      console.error('Authenticated user mock creation failed:', error);
      throw error;
    }
  }

  // ==================== SERVICE MOCK STRATEGIES ====================

  /**
   * Get service mocks based on current backend configuration
   * Provides Firebase or Supabase mocks, or both for dual backend testing
   */
  getServiceMocks() {
    const { backendType } = this._config;
    
    switch (backendType) {
      case 'firebase':
        return this._collection.serviceFactory.createFirebaseMocks({
          auth: true,
          firestore: true,
          config: { enableLogging: false }
        });
        
      case 'supabase':
        return this._collection.serviceFactory.createSupabaseMocks({
          auth: true,
          database: true,
          config: { enableLogging: false }
        });
        
      case 'dual':
        return {
          firebase: this._collection.serviceFactory.createFirebaseMocks({
            auth: true,
            firestore: true,
            config: { enableLogging: false }
          }),
          supabase: this._collection.serviceFactory.createSupabaseMocks({
            auth: true,
            database: true,
            config: { enableLogging: false }
          })
        };
        
      default:
        throw new Error(`Unknown backend type: ${backendType}`);
    }
  }

  /**
   * Get React Native module mocks with consistent configuration
   */
  getReactNativeMocks() {
    return this._collection.serviceFactory.createReactNativeMocks({
      asyncStorage: true,
      navigation: true,
      config: { mockMode: 'full' }
    });
  }

  // ==================== RUNTIME VALIDATION ====================

  /**
   * Validate Exercise mock against production schema
   */
  private _validateExerciseMock(exercise: Exercise): MockValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Required fields validation
    if (!exercise.id) errors.push('Exercise ID is required');
    if (!exercise.name || exercise.name.trim() === '') errors.push('Exercise name is required');
    if (!exercise.user_id) errors.push('Exercise user_id is required');
    if (!exercise.created_at) errors.push('Exercise created_at is required');
    if (!exercise.updated_at) errors.push('Exercise updated_at is required');
    if (typeof exercise.deleted !== 'boolean') errors.push('Exercise deleted must be boolean');
    
    // Format validation
    if (exercise.created_at && !this._isValidISODate(exercise.created_at)) {
      errors.push('Exercise created_at must be valid ISO date string');
    }
    if (exercise.updated_at && !this._isValidISODate(exercise.updated_at)) {
      errors.push('Exercise updated_at must be valid ISO date string');
    }
    
    // Business logic validation
    if (exercise.name && exercise.name.length > 255) {
      warnings.push('Exercise name exceeds typical database limit');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      mockType: 'Exercise',
      mockId: exercise.id
    };
  }

  /**
   * Validate UserAccount mock against production schema
   */
  private _validateUserMock(user: UserAccount): MockValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Required fields validation
    if (!user.id) errors.push('User ID is required');
    if (typeof user.isAnonymous !== 'boolean') errors.push('User isAnonymous must be boolean');
    if (!user.createdAt) errors.push('User createdAt is required');
    
    // Conditional validation
    if (!user.isAnonymous && !user.email) {
      errors.push('Authenticated user must have email');
    }
    if (user.email && !this._isValidEmail(user.email)) {
      errors.push('User email must be valid email format');
    }
    
    // Backend-specific ID format validation
    if (this._config.backendType === 'firebase' && !/^[a-zA-Z0-9]{28}$/.exec(user.id)) {
      warnings.push('Firebase user ID typically follows 28-character format');
    }
    if (this._config.backendType === 'supabase' && !/^[a-f0-9-]{36}$/.exec(user.id)) {
      warnings.push('Supabase user ID typically follows UUID format');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      mockType: 'UserAccount',
      mockId: user.id
    };
  }

  // ==================== BACKEND NORMALIZATION ====================

  /**
   * Normalize exercise mock for current backend configuration
   */
  private _normalizeExerciseForBackend(exercise: Exercise): Exercise {
    const normalized = { ...exercise };
    
    // Ensure consistent timestamp format
    if (normalized.created_at && !this._isValidISODate(normalized.created_at)) {
      normalized.created_at = new Date().toISOString();
    }
    if (normalized.updated_at && !this._isValidISODate(normalized.updated_at)) {
      normalized.updated_at = new Date().toISOString();
    }
    
    // Backend-specific ID normalization
    if (this._config.backendType === 'supabase' && !normalized.id.includes('-')) {
      // Convert to UUID format for Supabase
      normalized.id = this._convertToUUID(normalized.id);
    }
    
    return normalized;
  }

  /**
   * Normalize user mock for current backend configuration
   */
  private _normalizeUserForBackend(user: UserAccount): UserAccount {
    const normalized = { ...user };
    
    // Backend-specific ID format
    if (this._config.backendType === 'firebase') {
      // Firebase typically uses 28-character alphanumeric IDs
      const firebaseIdRegex = /^[a-zA-Z0-9]{28}$/;
      if (!firebaseIdRegex.exec(normalized.id)) {
        normalized.id = this._generateFirebaseUID();
      }
    } else if (this._config.backendType === 'supabase') {
      // Supabase uses UUID format
      const supabaseIdRegex = /^[a-f0-9-]{36}$/;
      if (!supabaseIdRegex.exec(normalized.id)) {
        normalized.id = this._convertToUUID(normalized.id);
      }
    }
    
    // Ensure createdAt is properly formatted
    if (normalized.createdAt && !this._isValidISODate(normalized.createdAt.toString())) {
      normalized.createdAt = new Date();
    }
    
    return normalized;
  }

  /**
   * Get backend-specific authentication metadata
   */
  private _getBackendAuthMetadata(): Partial<UserAccount> {
  // All cases currently return empty objects, so we can simplify:
  return {};
  }

  // ==================== STATISTICS AND MONITORING ====================

  /**
   * Update registry statistics
   */
  private _updateStatistics(mockType: string, creationTime: number): void {
    this._statistics.totalMocksCreated++;
    this._statistics.mocksByType[mockType] = (this._statistics.mocksByType[mockType] || 0) + 1;
    
    // Update average creation time
    const currentAvg = this._statistics.performanceMetrics.avgMockCreationTime;
    const totalMocks = this._statistics.totalMocksCreated;
    this._statistics.performanceMetrics.avgMockCreationTime = 
      (currentAvg * (totalMocks - 1) + creationTime) / totalMocks;
  }

  /**
   * Get registry statistics for monitoring
   */
  getStatistics(): RegistryStatistics {
    return { ...this._statistics };
  }

  /**
   * Reset registry statistics
   */
  resetStatistics(): void {
    this._statistics = {
      totalMocksCreated: 0,
      mocksByType: {},
      validationFailures: 0,
      lastValidationRun: new Date(),
      performanceMetrics: {
        avgMockCreationTime: 0,
        avgValidationTime: 0
      }
    };
  }

  /**
   * Get current configuration
   */
  getConfiguration(): BackendAgnosticConfig {
    return { ...this._config };
  }

  /**
   * Update configuration (triggers re-initialization if needed)
   */
  updateConfiguration(config: Partial<BackendAgnosticConfig>): void {
    this._config = { ...this._config, ...config };
    
    // Update validation settings
    if (config.performance?.enableMockValidation !== undefined) {
      this._mockValidationEnabled = config.performance.enableMockValidation;
    }
  }

  // ==================== UTILITY METHODS ====================

  private _isValidISODate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && dateString.includes('T');
  }

  private _isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private _convertToUUID(input: string): string {
    // Simple UUID v4 generation based on input
    const hash = input.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (hash + Math.random() * 16) % 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  private _generateFirebaseUID(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 28; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// ==================== SINGLETON REGISTRY INSTANCES ====================

/**
 * Default registry instance for Firebase backend
 */
export const firebaseRegistry = new MockFactoryRegistry({
  backendType: 'firebase',
  performance: {
    enableMockValidation: true,
    logMockUsage: false,
    strictTypeChecking: true
  }
});

/**
 * Default registry instance for Supabase backend
 */
export const supabaseRegistry = new MockFactoryRegistry({
  backendType: 'supabase',
  performance: {
    enableMockValidation: true,
    logMockUsage: false,
    strictTypeChecking: true
  }
});

/**
 * Default registry instance for dual backend testing
 */
export const dualBackendRegistry = new MockFactoryRegistry({
  backendType: 'dual',
  featureFlags: {
    useSupabase: process.env.EXPO_PUBLIC_USE_SUPABASE === 'true',
    enableCrossBackendValidation: true
  },
  performance: {
    enableMockValidation: true,
    logMockUsage: true,
    strictTypeChecking: true
  }
});

/**
 * Get registry instance based on environment configuration
 */
export function getEnvironmentRegistry(): MockFactoryRegistry {
  const useSupabase = process.env.EXPO_PUBLIC_USE_SUPABASE === 'true';
  
  if (process.env.NODE_ENV === 'test') {
    // Use dual backend registry for comprehensive testing
    return dualBackendRegistry;
  } else if (useSupabase) {
    return supabaseRegistry;
  } else {
    return firebaseRegistry;
  }
}

export default MockFactoryRegistry;