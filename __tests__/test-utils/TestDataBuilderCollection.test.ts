/**
 * Test: TestDataBuilderCollection - T014 Implementation Validation
 * 
 * Validates the minimal fixes applied to TestDataBuilderCollection:
 * - Exercise updated_at field consistency
 * - Proper sync field handling
 * - TypeScript safety improvements
 */

import { TestDataBuilderCollectionImpl } from '@/lib/test-utils/builders/TestDataBuilderCollection';

describe('TestDataBuilderCollection - T014 Implementation', () => {
  let collection: TestDataBuilderCollectionImpl;

  beforeEach(() => {
    collection = new TestDataBuilderCollectionImpl();
  });

  describe('Exercise Builder Improvements', () => {
    test('should create exercises with consistent updated_at field', () => {
      const exercise = collection.createExerciseBuilder()
        .withName('Test Exercise')
        .withUserId('test-user-id')
        .build();

      // Both created_at and updated_at should be defined and valid ISO strings
      expect(exercise.created_at).toBeDefined();
      expect(exercise.updated_at).toBeDefined();
      expect(() => new Date(exercise.created_at)).not.toThrow();
      expect(() => new Date(exercise.updated_at)).not.toThrow();
      
      // updated_at should default to same time as created_at when not specified
      expect(exercise.updated_at).toBe(exercise.created_at);
    });

    test('should handle explicit timestamps correctly', () => {
      const createdDate = new Date('2023-01-01T00:00:00Z');
      const updatedDate = new Date('2023-01-02T00:00:00Z');
      
      const exercise = collection.createExerciseBuilder()
        .withName('Timestamped Exercise')
        .withTimestamps(createdDate, updatedDate)
        .build();

      expect(exercise.created_at).toBe(createdDate.toISOString());
      expect(exercise.updated_at).toBe(updatedDate.toISOString());
      expect(exercise.updated_at).not.toBe(exercise.created_at);
    });

    test('should default updated_at when only created_at provided', () => {
      const createdDate = new Date('2023-01-01T00:00:00Z');
      
      const exercise = collection.createExerciseBuilder()
        .withName('Single Timestamp Exercise')
        .withTimestamps(createdDate)
        .build();

      expect(exercise.created_at).toBe(createdDate.toISOString());
      expect(exercise.updated_at).toBe(createdDate.toISOString());
    });

    test('should store sync status metadata with proper typing', () => {
      const exercise = collection.createExerciseBuilder()
        .withName('Sync Status Exercise')
        .withSyncStatus('synced')
        .build();

      // Verify sync status is stored (as metadata)
      expect((exercise as any).syncStatus).toBe('synced');
      
      // Verify core Exercise fields are still present
      expect(exercise.id).toBeDefined();
      expect(exercise.name).toBe('Sync Status Exercise');
      expect(exercise.created_at).toBeDefined();
      expect(exercise.updated_at).toBeDefined();
    });
  });

  describe('Data Structure Validation', () => {
    test('should create exercises that match production schema', () => {
      const exercise = collection.createExerciseBuilder()
        .withName('Schema Validation Exercise')
        .withUserId('schema-test-user')
        .build();

      // Verify all required Exercise fields are present
      expect(exercise).toMatchObject({
        id: expect.any(String),
        name: 'Schema Validation Exercise',
        user_id: 'schema-test-user',
        created_at: expect.any(String),
        updated_at: expect.any(String),
        deleted: expect.any(Boolean)
      });

      // Verify ISO date format
      expect(exercise.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(exercise.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should maintain consistency with default values', () => {
      const exercise = collection.createExerciseBuilder().build();

      // Default values should be consistent and valid
      expect(exercise.name).toBe('Default Exercise');
      expect(exercise.user_id).toBe('default-user');
      expect(exercise.deleted).toBe(false);
      expect(exercise.created_at).toBe(exercise.updated_at);
    });
  });

  describe('Builder Pattern Fluency', () => {
    test('should support method chaining', () => {
      const exercise = collection.createExerciseBuilder()
        .withName('Chained Exercise')
        .withId('chain-test-id')
        .withUserId('chain-user')
        .withSyncStatus('pending')
        .build();

      expect(exercise.name).toBe('Chained Exercise');
      expect(exercise.id).toBe('chain-test-id');
      expect(exercise.user_id).toBe('chain-user');
      expect((exercise as any).syncStatus).toBe('pending');
    });

    test('should create fresh builders for each call', () => {
      const builder1 = collection.createExerciseBuilder().withName('Exercise 1');
      const builder2 = collection.createExerciseBuilder().withName('Exercise 2');
      
      const exercise1 = builder1.build();
      const exercise2 = builder2.build();
      
      expect(exercise1.name).toBe('Exercise 1');
      expect(exercise2.name).toBe('Exercise 2');
      expect(exercise1.id).not.toBe(exercise2.id);
    });
  });

  describe('Cross-Backend Compatibility', () => {
    test('should create exercises compatible with both Firebase and Supabase', () => {
      const exercise = collection.createExerciseBuilder()
        .withName('Cross-Backend Exercise')
        .build();

      // Should have all required fields for both backends
      expect(exercise.id).toBeDefined(); // UUID for Supabase, any string for Firebase
      expect(exercise.user_id).toBeDefined(); // Required by both
      expect(exercise.created_at).toBeDefined(); // Timestamp format works for both
      expect(exercise.updated_at).toBeDefined(); // Sync tracking field
      expect(typeof exercise.deleted).toBe('boolean'); // Boolean flag
      
      // Verify timestamp format is ISO string (works for both backends)
      expect(typeof exercise.created_at).toBe('string');
      expect(typeof exercise.updated_at).toBe('string');
    });
  });
});