/**
 * Unit Tests: Legend State Store Operations
 *
 * Purpose: Test workout set store functionality, sync behavior, and computed values
 * Coverage: CRUD operations, session management, form defaults, sync status
 */

import { 
  workoutSets, 
  sessionStore, 
  workoutSetActions, 
  formDefaults, 
  currentSessionSets, 
  sessionStats, 
  syncStatus,
  initializeWorkoutSetStore 
} from '../../lib/store/workoutSetStore';
import { WorkoutSet, CreateWorkoutSetRequest } from '../../lib/models/WorkoutSet';

// Mock Supabase client for testing
const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn()
  },
  channel: jest.fn()
};

// Mock data factory
const createMockWorkoutSet = (overrides: Partial<WorkoutSet> = {}): WorkoutSet => ({
  id: `mock-id-${Date.now()}-${Math.random()}`,
  exercise_id: 'exercise-123',
  user_id: 'user-456',
  session_date: '2025-11-19',
  weight: 135,
  repetitions: 8,
  rpe: 7.5,
  set_order: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

const createMockSetRequest = (overrides: Partial<CreateWorkoutSetRequest> = {}): CreateWorkoutSetRequest => ({
  exercise_id: 'exercise-123',
  weight: 135,
  repetitions: 8,
  rpe: 7.5,
  session_date: '2025-11-19',
  ...overrides
});

// Mock Legend State methods for testing
jest.mock('@legendapp/state', () => ({
  observable: jest.fn((initialValue) => {
    const value = { current: initialValue };
    return {
      get: () => value.current,
      set: (newValue: any) => { value.current = newValue; },
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      sync: {
        start: jest.fn(),
        stop: jest.fn(),
        sync: jest.fn(),
        get: () => ({ pending: false, error: null, lastSync: Date.now() })
      }
    };
  }),
  syncedCrud: jest.fn((config) => ({
    get: jest.fn(() => ({})),
    create: config.create || jest.fn(),
    update: config.update || jest.fn(),
    delete: config.delete || jest.fn(),
    sync: {
      start: jest.fn(),
      stop: jest.fn(),
      sync: jest.fn(),
      get: () => ({ pending: false, error: null, lastSync: Date.now() })
    }
  })),
  computed: jest.fn((fn) => ({
    get: fn
  }))
}));

// Mock Supabase client
jest.mock('../../lib/data/supabase/supabase', () => ({
  getSupabaseClient: () => mockSupabaseClient
}));

describe('workoutSetStore', () => {
  const mockSet = createMockWorkoutSet();
  const mockSetRequest = createMockSetRequest();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset session store to clean state
    sessionStore.currentSession.set({
      date: '2025-11-19',
      exerciseId: '',
      lastSet: undefined
    });
    sessionStore.formDefaults.set({ weight: 0, repetitions: 0 });
    sessionStore.ui.set({ isSubmitting: false, lastSubmissionTime: undefined });
  });

  describe('session state management', () => {
    it('initializes with clean session state', () => {
      const session = sessionStore.currentSession.get();
      expect(session.date).toBe('2025-11-19');
      expect(session.exerciseId).toBe('');
      expect(session.lastSet).toBeUndefined();
    });

    it('updates form defaults when last set changes', () => {
      const testSet = createMockWorkoutSet({ weight: 150, repetitions: 10 });
      sessionStore.currentSession.lastSet.set(testSet);
      
      const defaults = formDefaults.get();
      expect(defaults).toEqual({
        weight: 150,
        repetitions: 10
      });
    });

    it('provides zero defaults when no last set', () => {
      sessionStore.currentSession.lastSet.set(undefined);
      sessionStore.formDefaults.set({ weight: 0, repetitions: 0 });
      
      const defaults = formDefaults.get();
      expect(defaults).toEqual({
        weight: 0,
        repetitions: 0
      });
    });

    it('tracks UI submission state', () => {
      expect(sessionStore.ui.isSubmitting.get()).toBe(false);
      
      sessionStore.ui.isSubmitting.set(true);
      expect(sessionStore.ui.isSubmitting.get()).toBe(true);
      
      sessionStore.ui.isSubmitting.set(false);
      expect(sessionStore.ui.isSubmitting.get()).toBe(false);
    });
  });

  describe('workout set actions', () => {
    describe('createSet', () => {
      it('creates a new set and updates session state', async () => {
        // Mock successful Supabase response
        const mockQuery = {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockSet, error: null })
        };
        mockSupabaseClient.from.mockReturnValue(mockQuery);
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'user-456' } }
        });

        // Mock workoutSets.create to return the mock set
        workoutSets.create = jest.fn().mockResolvedValue(mockSet);

        const result = await workoutSetActions.createSet(mockSetRequest);

        expect(result).toEqual(mockSet);
        
        // Verify session state updated
        const lastSet = sessionStore.currentSession.lastSet.get();
        expect(lastSet).toEqual({
          weight: mockSet.weight,
          repetitions: mockSet.repetitions,
          rpe: mockSet.rpe
        });
        
        // Verify form defaults updated (excluding RPE)
        const defaults = sessionStore.formDefaults.get();
        expect(defaults).toEqual({
          weight: mockSet.weight,
          repetitions: mockSet.repetitions
        });
      });

      it('handles creation errors gracefully', async () => {
        workoutSets.create = jest.fn().mockRejectedValue(new Error('Network error'));

        await expect(workoutSetActions.createSet(mockSetRequest))
          .rejects.toThrow('Network error');
          
        // Verify UI state is reset even on error
        expect(sessionStore.ui.isSubmitting.get()).toBe(false);
      });

      it('tracks submission timing', async () => {
        workoutSets.create = jest.fn().mockResolvedValue(mockSet);
        
        const beforeTime = Date.now();
        await workoutSetActions.createSet(mockSetRequest);
        const afterTime = Date.now();
        
        const submissionTime = sessionStore.ui.lastSubmissionTime.get();
        expect(submissionTime).toBeGreaterThanOrEqual(beforeTime);
        expect(submissionTime).toBeLessThanOrEqual(afterTime);
      });
    });

    describe('updateSet', () => {
      it('updates a set and maintains session consistency', async () => {
        const updatedSet = { ...mockSet, weight: 140, repetitions: 10 };
        workoutSets.update = jest.fn().mockResolvedValue(updatedSet);
        
        // Set the mock set as last set first
        sessionStore.currentSession.lastSet.set(mockSet);
        
        const result = await workoutSetActions.updateSet(mockSet.id, { 
          weight: 140, 
          repetitions: 10 
        });

        expect(result).toEqual(updatedSet);
        expect(workoutSets.update).toHaveBeenCalledWith({ 
          id: mockSet.id, 
          changes: { weight: 140, repetitions: 10 } 
        });
      });

      it('handles update errors gracefully', async () => {
        workoutSets.update = jest.fn().mockRejectedValue(new Error('Update failed'));

        await expect(workoutSetActions.updateSet('invalid-id', { weight: 200 }))
          .rejects.toThrow('Update failed');
          
        expect(sessionStore.ui.isSubmitting.get()).toBe(false);
      });
    });

    describe('deleteSet', () => {
      it('deletes a set and cleans up session state', async () => {
        workoutSets.delete = jest.fn().mockResolvedValue({ id: mockSet.id });
        
        // Set mock set as last set
        sessionStore.currentSession.lastSet.set(mockSet);
        
        await workoutSetActions.deleteSet(mockSet.id);

        expect(workoutSets.delete).toHaveBeenCalledWith(mockSet.id);
        
        // Verify session state cleared
        const lastSet = sessionStore.currentSession.lastSet.get();
        expect(lastSet).toBeUndefined();
      });

      it('resets form defaults after deleting last set', async () => {
        workoutSets.delete = jest.fn().mockResolvedValue({ id: mockSet.id });
        
        // Mock currentSessionSets to return empty array
        const mockCurrentSessionSets = [];
        jest.spyOn(workoutSetActions, 'getSessionSets').mockReturnValue(mockCurrentSessionSets);
        
        sessionStore.currentSession.lastSet.set(mockSet);
        
        await workoutSetActions.deleteSet(mockSet.id);
        
        const defaults = sessionStore.formDefaults.get();
        expect(defaults).toEqual({ weight: 0, repetitions: 0 });
      });
    });

    describe('setCurrentSession', () => {
      it('sets session context and loads existing sets', () => {
        const mockSessionSets = [
          createMockWorkoutSet({ weight: 135, repetitions: 8, set_order: 1 }),
          createMockWorkoutSet({ weight: 140, repetitions: 6, set_order: 2 })
        ];
        
        jest.spyOn(workoutSetActions, 'getSessionSets').mockReturnValue(mockSessionSets);
        
        workoutSetActions.setCurrentSession('exercise-123', '2025-11-19');
        
        const session = sessionStore.currentSession.get();
        expect(session.exerciseId).toBe('exercise-123');
        expect(session.date).toBe('2025-11-19');
        
        // Should set last set to the final set from the session
        const lastSet = session.lastSet;
        expect(lastSet).toEqual({
          weight: 140,
          repetitions: 6,
          rpe: mockSessionSets[1].rpe
        });
      });

      it('uses today as default date', () => {
        const today = new Date().toISOString().split('T')[0];
        
        workoutSetActions.setCurrentSession('exercise-123');
        
        const session = sessionStore.currentSession.get();
        expect(session.date).toBe(today);
      });
    });
  });

  describe('computed values', () => {
    describe('currentSessionSets', () => {
      it('filters sets by current session', () => {
        // Mock workoutSets to return test data
        const mockSets = {
          'set1': createMockWorkoutSet({ 
            exercise_id: 'exercise-123', 
            session_date: '2025-11-19', 
            set_order: 1 
          }),
          'set2': createMockWorkoutSet({ 
            exercise_id: 'exercise-456', 
            session_date: '2025-11-19', 
            set_order: 1 
          }),
          'set3': createMockWorkoutSet({ 
            exercise_id: 'exercise-123', 
            session_date: '2025-11-18', 
            set_order: 1 
          }),
          'set4': createMockWorkoutSet({ 
            exercise_id: 'exercise-123', 
            session_date: '2025-11-19', 
            set_order: 2 
          })
        };
        
        workoutSets.get = jest.fn().mockReturnValue(mockSets);
        
        sessionStore.currentSession.set({
          exerciseId: 'exercise-123',
          date: '2025-11-19',
          lastSet: undefined
        });
        
        const sessionSets = currentSessionSets.get();
        
        expect(sessionSets).toHaveLength(2);
        expect(sessionSets[0].set_order).toBe(1);
        expect(sessionSets[1].set_order).toBe(2);
      });

      it('returns empty array when no session context', () => {
        sessionStore.currentSession.set({
          exerciseId: '',
          date: '2025-11-19',
          lastSet: undefined
        });
        
        const sessionSets = currentSessionSets.get();
        expect(sessionSets).toEqual([]);
      });
    });

    describe('sessionStats', () => {
      it('calculates session statistics correctly', () => {
        const mockSessionSets = [
          createMockWorkoutSet({ weight: 100, repetitions: 10, rpe: 7.0 }),
          createMockWorkoutSet({ weight: 105, repetitions: 8, rpe: 8.0 }),
          createMockWorkoutSet({ weight: 110, repetitions: 6, rpe: 9.0 })
        ];
        
        // Mock currentSessionSets
        jest.spyOn(currentSessionSets, 'get').mockReturnValue(mockSessionSets);
        
        const stats = sessionStats.get();
        
        expect(stats.totalSets).toBe(3);
        expect(stats.totalVolume).toBe(100*10 + 105*8 + 110*6); // 1000 + 840 + 660 = 2500
        expect(stats.averageRPE).toBe((7.0 + 8.0 + 9.0) / 3); // 8.0
        expect(stats.exercisesPerformed).toBe(1); // All same exercise
      });

      it('handles empty session gracefully', () => {
        jest.spyOn(currentSessionSets, 'get').mockReturnValue([]);
        
        const stats = sessionStats.get();
        
        expect(stats.totalSets).toBe(0);
        expect(stats.totalVolume).toBe(0);
        expect(stats.averageRPE).toBe(0);
        expect(stats.exercisesPerformed).toBe(0);
      });
    });

    describe('syncStatus', () => {
      it('reports sync status correctly', () => {
        // Mock sync state
        workoutSets.sync = {
          get: () => ({
            pending: false,
            error: null,
            lastSync: 1234567890,
            numPendingGets: 0
          })
        };
        
        const status = syncStatus.get();
        
        expect(status.isSynced).toBe(true);
        expect(status.isPending).toBe(false);
        expect(status.hasError).toBe(false);
        expect(status.lastSyncTime).toBe(1234567890);
        expect(status.pendingCount).toBe(0);
      });

      it('detects pending sync operations', () => {
        workoutSets.sync = {
          get: () => ({
            pending: true,
            error: null,
            lastSync: 1234567890,
            numPendingGets: 2
          })
        };
        
        const status = syncStatus.get();
        
        expect(status.isSynced).toBe(false);
        expect(status.isPending).toBe(true);
        expect(status.pendingCount).toBe(2);
      });
    });
  });

  describe('store initialization', () => {
    it('initializes and returns cleanup function', () => {
      const cleanup = initializeWorkoutSetStore();
      
      expect(typeof cleanup).toBe('function');
      
      // Should be able to call cleanup without errors
      expect(() => cleanup()).not.toThrow();
    });

    it('starts sync on initialization', () => {
      const startSyncSpy = jest.spyOn(workoutSets.sync, 'start');
      
      initializeWorkoutSetStore();
      
      expect(startSyncSpy).toHaveBeenCalled();
    });
  });

  describe('data consistency', () => {
    it('maintains set order consistency', () => {
      const sets = [
        createMockWorkoutSet({ set_order: 3 }),
        createMockWorkoutSet({ set_order: 1 }),
        createMockWorkoutSet({ set_order: 2 })
      ];
      
      const sorted = workoutSetActions.getSessionSets('exercise-123', '2025-11-19');
      jest.spyOn(workoutSets, 'get').mockReturnValue(
        sets.reduce((acc, set) => ({ ...acc, [set.id]: set }), {})
      );
      
      // The getSessionSets should sort by set_order
      expect(sorted[0]?.set_order).toBeLessThanOrEqual(sorted[1]?.set_order || 0);
    });

    it('handles RPE exclusion from defaults correctly', () => {
      const setWithRPE = createMockWorkoutSet({ 
        weight: 135, 
        repetitions: 8, 
        rpe: 9.5 
      });
      
      sessionStore.currentSession.lastSet.set(setWithRPE);
      
      const defaults = formDefaults.get();
      
      // Should include weight and reps but not RPE
      expect(defaults.weight).toBe(135);
      expect(defaults.repetitions).toBe(8);
      expect(defaults).not.toHaveProperty('rpe');
    });
  });

  describe('error handling', () => {
    it('maintains UI state consistency during errors', async () => {
      workoutSets.create = jest.fn().mockRejectedValue(new Error('Network error'));
      
      expect(sessionStore.ui.isSubmitting.get()).toBe(false);
      
      try {
        await workoutSetActions.createSet(mockSetRequest);
      } catch {
        // Expected to fail
      }
      
      // UI state should be reset even after error
      expect(sessionStore.ui.isSubmitting.get()).toBe(false);
    });

    it('preserves data integrity during failed operations', async () => {
      const originalLastSet = createMockWorkoutSet({ weight: 100 });
      sessionStore.currentSession.lastSet.set(originalLastSet);
      
      workoutSets.update = jest.fn().mockRejectedValue(new Error('Update failed'));
      
      try {
        await workoutSetActions.updateSet('invalid-id', { weight: 200 });
      } catch {
        // Expected to fail
      }
      
      // Last set should remain unchanged
      const lastSet = sessionStore.currentSession.lastSet.get();
      expect(lastSet?.weight).toBe(100);
    });
  });
});