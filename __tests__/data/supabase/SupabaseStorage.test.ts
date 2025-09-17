import { SupabaseStorage } from '../../../lib/data/supabase/SupabaseStorage';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Mock the uuid library to generate a valid v4 UUID
jest.mock('uuid', () => ({
  v4: () => '12345678-1234-4234-8234-123456789012',
}));

// Mock the config
jest.mock('../../../lib/config/supabase-env', () => ({
  getSupabaseUrl: jest.fn(() => 'https://test.supabase.co'),
  getSupabaseEnvConfig: jest.fn(() => ({
    anonKey: 'test-anon-key',
    serviceKey: 'test-service-key'
  }))
}));

// Simple approach - create inline mock
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  is: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  single: jest.fn(),
  order: jest.fn().mockReturnThis(),
  auth: {
    getSession: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
  channel: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
  unsubscribe: jest.fn(),
};

// Mock the Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

describe('SupabaseStorage', () => {
  let storage: SupabaseStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Re-setup the chain after clearing mocks
    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.update.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.delete.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.is.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.neq.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.channel.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.on.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.order.mockReturnValue(mockSupabaseClient);
    
    storage = new SupabaseStorage();
  });

  it('should be defined', () => {
    expect(storage).toBeDefined();
  });

  describe('init', () => {
    it('should initialize session successfully', async () => {
      const mockSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          created_at: new Date().toISOString()
        }
      };
      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({ data: { session: mockSession }, error: null });

      await storage.init();

      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();
    });

    it('should handle initialization with no session', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });

      await storage.init();

      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockSupabaseClient.auth.getSession.mockRejectedValueOnce(new Error('Init failed'));

      await storage.init();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize session:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('createExercise', () => {
    it('should create an exercise successfully', async () => {
      const exerciseInput = { name: 'Test Exercise', userId: 'test-user' };
      const mockExerciseData = { id: '12345678-1234-4234-8234-123456789012', name: 'Test Exercise', user_id: 'test-user', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), sync_status: 'synced' };
      
      mockSupabaseClient.single.mockResolvedValueOnce({ data: mockExerciseData, error: null });

      const result = await storage.createExercise(exerciseInput);

      expect(result.name).toBe(exerciseInput.name);
      expect(result.userId).toBe(exerciseInput.userId);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('exercises');
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it('should throw an error if exercise creation fails', async () => {
      const exerciseInput = { name: 'Test Exercise', userId: 'test-user' };
      const errorMessage = 'Insert failed';
      
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: { message: errorMessage } });

      await expect(storage.createExercise(exerciseInput)).rejects.toThrow(`Failed to create exercise: ${errorMessage}`);
    });
  });

  describe('getExercises', () => {
    it('should retrieve exercises for a specific user', async () => {
      const userId = 'test-user';
      const mockExercises = [{ id: '12345678-1234-4234-8234-123456789012', name: 'Exercise 1', user_id: userId, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), sync_status: 'synced' }];
      
      mockSupabaseClient.order.mockResolvedValueOnce({ data: mockExercises, error: null });

      const result = await storage.getExercises(userId);

      expect(result.length).toBe(1);
      expect(result[0].userId).toBe(userId);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('exercises');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', userId);
    });

    it('should retrieve exercises for an anonymous user', async () => {
      const mockExercises = [{ id: '12345678-1234-4234-8234-123456789012', name: 'Exercise 1', user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), sync_status: 'synced' }];
      
      mockSupabaseClient.order.mockResolvedValueOnce({ data: mockExercises, error: null });

      const result = await storage.getExercises();

      expect(result.length).toBe(1);
      expect(result[0].userId).toBeUndefined();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('exercises');
      expect(mockSupabaseClient.is).toHaveBeenCalledWith('user_id', null);
    });

    it('should throw an error if retrieval fails', async () => {
      const errorMessage = 'Select failed';
      mockSupabaseClient.order.mockResolvedValueOnce({ data: null, error: { message: errorMessage } });

      await expect(storage.getExercises()).rejects.toThrow(`Failed to retrieve exercises: ${errorMessage}`);
    });
  });

  describe('updateExercise', () => {
    it('should update an exercise successfully', async () => {
      const exerciseId = '12345678-1234-4234-8234-123456789012';
      const updates = { name: 'Updated Exercise' };
      const existingExercise = { id: exerciseId, name: 'Old Exercise', user_id: 'test-user', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), sync_status: 'synced' };
      const updatedExercise = { ...existingExercise, ...updates };

      mockSupabaseClient.single.mockResolvedValueOnce({ data: existingExercise, error: null });
      mockSupabaseClient.single.mockResolvedValueOnce({ data: updatedExercise, error: null });

      const result = await storage.updateExercise(exerciseId, updates);

      expect(result.name).toBe(updates.name);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('exercises');
      expect(mockSupabaseClient.update).toHaveBeenCalled();
    });

    it('should throw an error if the exercise to update is not found', async () => {
      const exerciseId = '12345678-1234-4234-8234-123456789012';
      const updates = { name: 'Updated Exercise' };

      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

      await expect(storage.updateExercise(exerciseId, updates)).rejects.toThrow('Exercise not found');
    });

    it('should throw an error if the update fails', async () => {
      const exerciseId = '12345678-1234-4234-8234-123456789012';
      const updates = { name: 'Updated Exercise' };
      const existingExercise = { id: exerciseId, name: 'Old Exercise', user_id: 'test-user', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), sync_status: 'synced' };
      const errorMessage = 'Update failed';

      mockSupabaseClient.single.mockResolvedValueOnce({ data: existingExercise, error: null });
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: { message: errorMessage } });

      await expect(storage.updateExercise(exerciseId, updates)).rejects.toThrow(`Failed to update exercise: ${errorMessage}`);
    });
  });

  describe('deleteExercise', () => {
    it.skip('should delete an exercise successfully', async () => {
      const exerciseId = '12345678-1234-4234-8234-123456789012';
      const existingExercise = { id: exerciseId };

      mockSupabaseClient.single.mockResolvedValueOnce({ data: existingExercise, error: null });
      mockSupabaseClient.eq.mockResolvedValueOnce({ error: null });

      await storage.deleteExercise(exerciseId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('exercises');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
    });

    it.skip('should throw an error if the exercise to delete is not found', async () => {
      const exerciseId = '12345678-1234-4234-8234-123456789012';

      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

      await expect(storage.deleteExercise(exerciseId)).rejects.toThrow('Exercise not found');
    });

    it.skip('should throw an error if the delete operation fails', async () => {
      const exerciseId = '12345678-1234-4234-8234-123456789012';
      const existingExercise = { id: exerciseId };
      const errorMessage = 'Delete failed';

      mockSupabaseClient.single.mockResolvedValueOnce({ data: existingExercise, error: null });
      mockSupabaseClient.eq.mockResolvedValueOnce({ error: { message: errorMessage } });

      await expect(storage.deleteExercise(exerciseId)).rejects.toThrow(`Failed to delete exercise: ${errorMessage}`);
    });
  });

  // User Management Tests
  describe('getCurrentUser', () => {
    it('should return current user if already cached', async () => {
      // First sign in to cache a user
      const mockUser = { id: 'test-user', email: 'test@example.com', created_at: new Date().toISOString() };
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser, session: { user: mockUser } },
        error: null
      });
      
      await storage.signInWithEmail('test@example.com', 'password123');
      const result = await storage.getCurrentUser();
      
      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
    });

    it('should fetch user from session if not cached', async () => {
      const mockUser = { id: 'test-user', email: 'test@example.com', created_at: new Date().toISOString() };
      const mockSession = { user: mockUser };
      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({ data: { session: mockSession }, error: null });

      const result = await storage.getCurrentUser();

      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();
    });

    it('should return null if no session exists', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });

      const result = await storage.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('signInWithEmail', () => {
    it('should sign in successfully with valid credentials', async () => {
      const mockUser = { id: 'test-user', email: 'test@example.com', created_at: new Date().toISOString() };
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser, session: { user: mockUser } },
        error: null
      });

      const result = await storage.signInWithEmail('test@example.com', 'password123');

      expect(result.email).toBe('test@example.com');
      expect(result.isAnonymous).toBe(false);
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it.skip('should throw error if authentication fails', async () => {
      const errorMessage = 'Invalid login credentials';
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null },
        error: { message: errorMessage }
      });

      await expect(storage.signInWithEmail('test@example.com', 'wrongpassword'))
        .rejects.toThrow(`Sign in failed: ${errorMessage}`);
    });

    it('should throw error if no user is returned', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      await expect(storage.signInWithEmail('test@example.com', 'password123'))
        .rejects.toThrow('Sign in failed: No user returned');
    });
  });

  describe('signUpWithEmail', () => {
    it('should sign up successfully with valid credentials', async () => {
      const mockUser = { id: 'test-user', email: 'test@example.com', created_at: new Date().toISOString() };
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: mockUser, session: { user: mockUser } },
        error: null
      });

      const result = await storage.signUpWithEmail('test@example.com', 'password123');

      expect(result.email).toBe('test@example.com');
      expect(result.isAnonymous).toBe(false);
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should throw error if sign up fails', async () => {
      const errorMessage = 'User already registered';
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: null },
        error: { message: errorMessage }
      });

      await expect(storage.signUpWithEmail('test@example.com', 'password123'))
        .rejects.toThrow(`Sign up failed: ${errorMessage}`);
    });

    it('should throw error if no user is returned', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      await expect(storage.signUpWithEmail('test@example.com', 'password123'))
        .rejects.toThrow('Sign up failed: No user returned');
    });
  });

  describe('signInAnonymously', () => {
    it('should create anonymous user successfully', async () => {
      const result = await storage.signInAnonymously();

      expect(result.isAnonymous).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.email).toBeUndefined();
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValueOnce({ error: null });

      await storage.signOut();

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it('should throw error if sign out fails', async () => {
      const errorMessage = 'Sign out failed';
      mockSupabaseClient.auth.signOut.mockResolvedValueOnce({ error: { message: errorMessage } });

      await expect(storage.signOut()).rejects.toThrow(`Sign out failed: ${errorMessage}`);
    });
  });

  // Sync Management Tests
  describe('getPendingSyncRecords', () => {
    it.skip('should retrieve pending sync records successfully', async () => {
      const mockSyncRecords = [
        {
          record_id: 'test-record-1',
          record_type: 'exercise',
          operation: 'create',
          pending_since: new Date().toISOString(),
          retry_count: 0,
          last_error: null,
          next_retry_at: null
        }
      ];
      mockSupabaseClient.order.mockResolvedValueOnce({ data: mockSyncRecords, error: null });

      const result = await storage.getPendingSyncRecords();

      expect(Array.isArray(result)).toBe(true);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('sync_states');
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('pending_since', { ascending: true });
    });

    it('should throw error if retrieval fails', async () => {
      const errorMessage = 'Failed to fetch sync records';
      mockSupabaseClient.order.mockResolvedValueOnce({ data: null, error: { message: errorMessage } });

      await expect(storage.getPendingSyncRecords()).rejects.toThrow(`Failed to retrieve sync records: ${errorMessage}`);
    });
  });

  describe('markSyncComplete', () => {
    it('should mark sync as complete successfully', async () => {
      const recordId = 'test-record-1';
      mockSupabaseClient.eq.mockResolvedValueOnce({ error: null });

      await storage.markSyncComplete(recordId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('sync_states');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('record_id', recordId);
    });

    it('should throw error if marking sync complete fails', async () => {
      const recordId = 'test-record-1';
      const errorMessage = 'Delete failed';
      mockSupabaseClient.eq.mockResolvedValueOnce({ error: { message: errorMessage } });

      await expect(storage.markSyncComplete(recordId)).rejects.toThrow(`Failed to mark sync complete: ${errorMessage}`);
    });
  });

  describe('markSyncError', () => {
    it.skip('should update existing sync record with error', async () => {
      const recordId = 'test-record-1';
      const errorMessage = 'Network error';
      const existingSyncRecord = {
        record_id: recordId,
        record_type: 'exercise',
        operation: 'create',
        pending_since: new Date().toISOString(),
        retry_count: 0,
        last_error: null,
        next_retry_at: null
      };
      
      mockSupabaseClient.single.mockResolvedValueOnce({ data: existingSyncRecord, error: null });
      mockSupabaseClient.eq.mockResolvedValueOnce({ error: null });

      await storage.markSyncError(recordId, errorMessage);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('sync_states');
      expect(mockSupabaseClient.update).toHaveBeenCalled();
    });

    it.skip('should create new sync record if none exists', async () => {
      const recordId = 'test-record-1';
      const errorMessage = 'Network error';
      
      mockSupabaseClient.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });
      mockSupabaseClient.from.mockReturnThis();
      mockSupabaseClient.insert.mockResolvedValueOnce({ error: null });

      await storage.markSyncError(recordId, errorMessage);

      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it.skip('should throw error if update fails', async () => {
      const recordId = 'test-record-1';
      const errorMessage = 'Network error';
      const existingSyncRecord = {
        record_id: recordId,
        record_type: 'exercise',
        operation: 'create',
        pending_since: new Date().toISOString(),
        retry_count: 0,
        last_error: null,
        next_retry_at: null
      };
      
      mockSupabaseClient.single.mockResolvedValueOnce({ data: existingSyncRecord, error: null });
      mockSupabaseClient.eq.mockResolvedValueOnce({ error: { message: 'Update failed' } });

      await expect(storage.markSyncError(recordId, errorMessage)).rejects.toThrow('Failed to mark sync error: Update failed');
    });
  });

  // Real-time Subscription Tests
  describe('subscribeToExercises', () => {
    it('should subscribe to exercises changes for a user', () => {
      const userId = 'test-user';
      const callback = jest.fn();
      const mockUnsubscribe = jest.fn();
      
      mockSupabaseClient.subscribe.mockReturnValueOnce({ unsubscribe: mockUnsubscribe });

      const unsubscribe = storage.subscribeToExercises(userId, callback);

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('exercises_changes');
      expect(mockSupabaseClient.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exercises',
          filter: `user_id=eq.${userId}`
        },
        expect.any(Function)
      );
      expect(typeof unsubscribe).toBe('function');
    });

    it('should subscribe to exercises changes for anonymous user', () => {
      const callback = jest.fn();
      const mockUnsubscribe = jest.fn();
      
      mockSupabaseClient.subscribe.mockReturnValueOnce({ unsubscribe: mockUnsubscribe });

      const unsubscribe = storage.subscribeToExercises('', callback);

      expect(mockSupabaseClient.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exercises',
          filter: 'user_id=is.null'
        },
        expect.any(Function)
      );
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('subscribeToAuthState', () => {
    it('should subscribe to auth state changes', () => {
      const callback = jest.fn();
      const mockSubscription = { unsubscribe: jest.fn() };
      
      mockSupabaseClient.auth.onAuthStateChange.mockReturnValueOnce({ data: { subscription: mockSubscription } });

      const unsubscribe = storage.subscribeToAuthState(callback);

      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalledWith(expect.any(Function));
      expect(typeof unsubscribe).toBe('function');
    });
  });

  // Additional Methods Tests
  describe('linkEmailPassword', () => {
    it('should link email/password to anonymous user', async () => {
      // First sign in anonymously
      await storage.signInAnonymously();
      
      const mockUser = { id: 'test-user', email: 'test@example.com', created_at: new Date().toISOString() };
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: mockUser, session: { user: mockUser } },
        error: null
      });

      const result = await storage.linkEmailPassword('test@example.com', 'password123');

      expect(result.email).toBe('test@example.com');
      expect(result.isAnonymous).toBe(false);
    });

    it('should throw error if user is not anonymous', async () => {
      // Sign in as authenticated user first
      const mockUser = { id: 'test-user', email: 'existing@example.com', created_at: new Date().toISOString() };
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser, session: { user: mockUser } },
        error: null
      });
      await storage.signInWithEmail('existing@example.com', 'password123');

      await expect(storage.linkEmailPassword('test@example.com', 'password123'))
        .rejects.toThrow('Can only link email/password to anonymous users');
    });
  });

  describe('forceSessionExpiry', () => {
    it('should force session expiry', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValueOnce({ error: null });

      await storage.forceSessionExpiry();

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('clearAllData', () => {
    it('should clear all data in non-production environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      
      mockSupabaseClient.neq.mockResolvedValueOnce({ error: null });
      mockSupabaseClient.neq.mockResolvedValueOnce({ error: null });

      await storage.clearAllData();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('exercises');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('sync_states');
      expect(mockSupabaseClient.delete).toHaveBeenCalledTimes(2);
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should throw error in production environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await expect(storage.clearAllData()).rejects.toThrow('clearAllData is not available in production');
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});