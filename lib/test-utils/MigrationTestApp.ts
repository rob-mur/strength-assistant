/**
 * MigrationTestApp Implementation
 * 
 * Specialized test application for testing Firebase to Supabase migration
 * with feature flag switching. Extends TestApp with migration-specific
 * functionality and backend validation.
 */

import { TestApp } from './TestApp';
import { Exercise } from '../models/Exercise';

/**
 * MigrationTestApp class for migration testing
 * 
 * Provides specialized functionality for testing feature flag switching
 * between Firebase and Supabase backends during migration.
 */
export class MigrationTestApp extends TestApp {
  private currentBackend: 'firebase' | 'supabase' = 'firebase';
  private migrationInProgress: boolean = false;
  private dataConsistencyCheck: boolean = true;

  constructor(deviceName: string = 'MigrationTest-Device') {
    super(deviceName);
  }

  // Migration-specific lifecycle
  async initWithBackend(backend: 'firebase' | 'supabase'): Promise<void> {
    await this.setBackend(backend);
    await this.init();
  }

  // Backend Management
  async setBackend(backend: 'firebase' | 'supabase'): Promise<void> {
    if (this.migrationInProgress) {
      throw new Error('Cannot switch backend during migration');
    }

    // Simulate feature flag environment variable change
    const originalEnv = process.env.USE_SUPABASE_DATA;
    
    if (backend === 'supabase') {
      process.env.USE_SUPABASE_DATA = 'true';
    } else {
      process.env.USE_SUPABASE_DATA = 'false';
    }

    this.currentBackend = backend;
    
    // Simulate backend switch delay
    await this.waitFor(100);
  }

  async getCurrentBackend(): Promise<'firebase' | 'supabase'> {
    return this.currentBackend;
  }

  // Migration Operations
  async startMigration(): Promise<void> {
    if (this.migrationInProgress) {
      throw new Error('Migration already in progress');
    }

    this.migrationInProgress = true;
    
    // Simulate migration initialization
    await this.waitFor(200);
  }

  async completeMigration(): Promise<void> {
    if (!this.migrationInProgress) {
      throw new Error('No migration in progress');
    }

    this.migrationInProgress = false;
    
    // Simulate migration completion
    await this.waitFor(300);
  }

  async abortMigration(): Promise<void> {
    if (!this.migrationInProgress) {
      throw new Error('No migration in progress');
    }

    this.migrationInProgress = false;
    
    // Simulate migration abort and rollback
    await this.waitFor(250);
  }

  async isMigrationInProgress(): Promise<boolean> {
    return this.migrationInProgress;
  }

  // Data Consistency Validation
  async validateDataConsistency(): Promise<{
    isConsistent: boolean;
    errors: string[];
    totalRecords: number;
    inconsistentRecords: number;
  }> {
    if (this.migrationInProgress) {
      throw new Error('Cannot validate consistency during migration');
    }

    // Simulate data consistency check
    await this.waitFor(500);

    // Get exercises from both backends (simulated)
    const exercises = await this.getExercises();
    const totalRecords = exercises.length;
    
    // Simulate consistency validation
    const inconsistentRecords = Math.floor(totalRecords * 0.05); // 5% inconsistency rate for testing
    const errors: string[] = [];
    
    if (inconsistentRecords > 0) {
      errors.push(`Found ${inconsistentRecords} inconsistent records`);
      errors.push('Timestamp mismatches detected');
      if (inconsistentRecords > totalRecords * 0.1) {
        errors.push('High inconsistency rate - migration may have failed');
      }
    }

    return {
      isConsistent: inconsistentRecords === 0,
      errors,
      totalRecords,
      inconsistentRecords
    };
  }

  async enableDataConsistencyChecks(enabled: boolean): Promise<void> {
    this.dataConsistencyCheck = enabled;
  }

  // Migration-specific Exercise Operations
  async addExerciseWithBackendValidation(name: string): Promise<{
    exercise: Exercise;
    backend: 'firebase' | 'supabase';
    syncStatus: string;
  }> {
    const exercise = await this.addExercise(name);
    const backend = this.currentBackend;
    const syncStatus = await this.getSyncStatus(exercise.id);
    
    return {
      exercise,
      backend,
      syncStatus: syncStatus as string
    };
  }

  async migrateExercise(exerciseId: string): Promise<{
    success: boolean;
    fromBackend: 'firebase' | 'supabase';
    toBackend: 'firebase' | 'supabase';
    error?: string;
  }> {
    const fromBackend = this.currentBackend;
    const toBackend = fromBackend === 'firebase' ? 'supabase' : 'firebase';
    
    try {
      // Simulate exercise migration
      await this.waitFor(300);
      
      // Get exercise data from source
      const exercise = await this.getExercise(exerciseId);
      if (!exercise) {
        throw new Error('Exercise not found');
      }
      
      // Simulate migration process
      const success = Math.random() > 0.1; // 90% success rate
      
      if (!success) {
        throw new Error('Migration failed due to network timeout');
      }
      
      return {
        success: true,
        fromBackend,
        toBackend
      };
    } catch (error) {
      return {
        success: false,
        fromBackend,
        toBackend,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Feature Flag Testing
  async testFeatureFlagSwitch(): Promise<{
    beforeBackend: 'firebase' | 'supabase';
    afterBackend: 'firebase' | 'supabase';
    switchTime: number;
    dataPreserved: boolean;
  }> {
    const beforeBackend = this.currentBackend;
    const exercisesBefore = await this.getExercises();
    
    const startTime = Date.now();
    
    // Switch to opposite backend
    const newBackend = beforeBackend === 'firebase' ? 'supabase' : 'firebase';
    await this.setBackend(newBackend);
    
    const switchTime = Date.now() - startTime;
    const exercisesAfter = await this.getExercises();
    
    // Check if data is preserved (in real implementation, data might differ)
    const dataPreserved = exercisesBefore.length === exercisesAfter.length;
    
    return {
      beforeBackend,
      afterBackend: this.currentBackend,
      switchTime,
      dataPreserved
    };
  }

  async simulateFeatureFlagFailure(): Promise<void> {
    // Simulate feature flag service failure
    delete process.env.USE_SUPABASE_DATA;
    
    // This should cause the system to fall back to default backend
    await this.waitFor(100);
  }

  // Performance Testing
  async benchmarkBackendPerformance(operations: number = 10): Promise<{
    backend: 'firebase' | 'supabase';
    averageCreateTime: number;
    averageReadTime: number;
    averageUpdateTime: number;
    averageDeleteTime: number;
    totalOperations: number;
  }> {
    const results = {
      backend: this.currentBackend,
      totalOperations: operations,
      averageCreateTime: 0,
      averageReadTime: 0,
      averageUpdateTime: 0,
      averageDeleteTime: 0
    };

    const createTimes: number[] = [];
    const readTimes: number[] = [];
    const updateTimes: number[] = [];
    const deleteTimes: number[] = [];

    for (let i = 0; i < operations; i++) {
      // Create operation
      const createStart = Date.now();
      const exercise = await this.addExercise(`Benchmark Exercise ${i}`);
      createTimes.push(Date.now() - createStart);

      // Read operation
      const readStart = Date.now();
      await this.getExercise(exercise.id);
      readTimes.push(Date.now() - readStart);

      // Update operation
      const updateStart = Date.now();
      await this.updateExercise(exercise.id, `Updated Exercise ${i}`);
      updateTimes.push(Date.now() - updateStart);

      // Delete operation
      const deleteStart = Date.now();
      await this.deleteExercise(exercise.id);
      deleteTimes.push(Date.now() - deleteStart);
    }

    results.averageCreateTime = createTimes.reduce((a, b) => a + b, 0) / createTimes.length;
    results.averageReadTime = readTimes.reduce((a, b) => a + b, 0) / readTimes.length;
    results.averageUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
    results.averageDeleteTime = deleteTimes.reduce((a, b) => a + b, 0) / deleteTimes.length;

    return results;
  }

  // Migration State
  async getMigrationState(): Promise<{
    currentBackend: 'firebase' | 'supabase';
    migrationInProgress: boolean;
    dataConsistencyEnabled: boolean;
    featureFlagValue: string | undefined;
    app: any;
    device: any;
  }> {
    const appState = await this.getAppState();
    
    return {
      currentBackend: this.currentBackend,
      migrationInProgress: this.migrationInProgress,
      dataConsistencyEnabled: this.dataConsistencyCheck,
      featureFlagValue: process.env.USE_SUPABASE_DATA,
      app: appState.app,
      device: appState.device
    };
  }

  // Cleanup with backend reset
  async cleanup(): Promise<void> {
    // Reset feature flag to default
    process.env.USE_SUPABASE_DATA = 'false';
    this.currentBackend = 'firebase';
    this.migrationInProgress = false;
    this.dataConsistencyCheck = true;
    
    await super.cleanup();
  }
}

// Export for tests
export default MigrationTestApp;