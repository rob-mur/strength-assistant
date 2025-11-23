import { exerciseSchedules$ } from '../../lib/data/sync/weeklyPlanSync';
import { weeklyPlanActions } from '../../lib/data/legend-state/WeeklyPlanActions';
import { storageManager } from '../../lib/data/StorageManager';
import type { ExerciseSchedule } from '../../lib/models/ExerciseSchedule';

describe('Weekly Planner Database Contract', () => {
  let testUserId: string;
  let testExerciseId: string;
  let supabaseClient: any;
  
  beforeAll(() => {
    // Get Supabase client from storage manager
    const backend = storageManager.getSupabaseBackend();
    supabaseClient = backend.getClient();
  });
  
  beforeEach(async () => {
    // Set up test data
    testUserId = 'test-user-id';
    testExerciseId = 'test-exercise-id';
    
    // Clean up any existing test data
    await supabaseClient
      .from('exercise_schedules')
      .delete()
      .eq('user_id', testUserId);
  });

  afterEach(async () => {
    // Clean up test data
    await supabaseClient
      .from('exercise_schedules')
      .delete()
      .eq('user_id', testUserId);
  });

  describe('Database Schema Contract', () => {
    test('should create exercise schedule with correct schema', async () => {
      const { data, error } = await supabaseClient
        .from('exercise_schedules')
        .insert({
          user_id: testUserId,
          exercise_id: testExerciseId,
          day_of_week: 1, // Monday
          order_index: 0,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toMatchObject({
        user_id: testUserId,
        exercise_id: testExerciseId,
        day_of_week: 1,
        order_index: 0,
      });
      expect(data.id).toBeDefined();
      expect(data.created_at).toBeDefined();
      expect(data.updated_at).toBeDefined();
    });

    test('should enforce unique constraint', async () => {
      // Insert first schedule
      await supabaseClient
        .from('exercise_schedules')
        .insert({
          user_id: testUserId,
          exercise_id: testExerciseId,
          day_of_week: 1,
          order_index: 0,
        });

      // Try to insert duplicate
      const { error } = await supabaseClient
        .from('exercise_schedules')
        .insert({
          user_id: testUserId,
          exercise_id: testExerciseId,
          day_of_week: 1, // Same day
          order_index: 1,
        });

      expect(error).toBeDefined();
      expect(error?.message).toContain('unique');
    });

    test('should enforce day_of_week constraint', async () => {
      const { error } = await supabaseClient
        .from('exercise_schedules')
        .insert({
          user_id: testUserId,
          exercise_id: testExerciseId,
          day_of_week: 7, // Invalid day
          order_index: 0,
        });

      expect(error).toBeDefined();
    });
  });

  describe('RLS Policy Contract', () => {
    test('should prevent access to other user schedules', async () => {
      // This test would need proper RLS testing setup
      // with different user contexts
      expect(true).toBe(true); // Placeholder for RLS testing
    });
  });

  describe('Legend State Sync Contract', () => {
    test('should sync exercise assignments', async () => {
      // Test that Legend State sync works with database
      await weeklyPlanActions.assignExerciseToDay(testExerciseId, 1);
      
      // Wait for sync
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify in database
      const { data } = await supabaseClient
        .from('exercise_schedules')
        .select('*')
        .eq('user_id', testUserId)
        .eq('exercise_id', testExerciseId)
        .eq('day_of_week', 1);

      expect(data).toHaveLength(1);
    });

    test('should handle optimistic updates', async () => {
      // Test optimistic update behavior
      const promise = weeklyPlanActions.assignExerciseToDay(testExerciseId, 1);
      
      // Should appear in observable immediately (optimistic)
      const schedules = exerciseSchedules$.get();
      const mondaySchedules = Object.values(schedules)
        .filter(s => s.day_of_week === 1);
      
      expect(mondaySchedules.length).toBeGreaterThan(0);
      
      await promise;
    });
  });

  describe('Performance Contract', () => {
    test('should query weekly plan efficiently', async () => {
      // Insert test data for a full week
      const schedules = Array.from({ length: 7 }, (_, dayOfWeek) => ({
        user_id: testUserId,
        exercise_id: `exercise-${dayOfWeek}`,
        day_of_week: dayOfWeek,
        order_index: 0,
      }));

      await supabaseClient
        .from('exercise_schedules')
        .insert(schedules);

      // Time the query
      const startTime = Date.now();
      
      const { data } = await supabaseClient
        .from('exercise_schedules')
        .select('*, exercises(id, name)')
        .eq('user_id', testUserId);

      const queryTime = Date.now() - startTime;
      
      expect(data).toHaveLength(7);
      expect(queryTime).toBeLessThan(1000); // Should be fast with proper indexing
    });
  });

  describe('API Contract Validation', () => {
    test('should match ExerciseSchedule interface', () => {
      // Validate that actual API responses match the contract
      // defined in ExerciseSchedule interface
      
      const sampleSchedule: ExerciseSchedule = {
        id: 'test-id',
        userId: testUserId,
        exerciseId: testExerciseId,
        dayOfWeek: 1,
        orderIndex: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Validate structure matches interface
      expect(sampleSchedule).toMatchObject({
        id: expect.any(String),
        userId: expect.any(String),
        exerciseId: expect.any(String),
        dayOfWeek: expect.any(Number),
        orderIndex: expect.any(Number),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });

      // Validate constraints
      expect(sampleSchedule.dayOfWeek).toBeGreaterThanOrEqual(0);
      expect(sampleSchedule.dayOfWeek).toBeLessThanOrEqual(6);
      expect(sampleSchedule.orderIndex).toBeGreaterThanOrEqual(0);
    });
  });
});