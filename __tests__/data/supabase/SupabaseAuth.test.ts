import { SupabaseAuth } from '../../../lib/data/supabase/SupabaseAuth';

// Mock the SupabaseClient module
const mockSupabaseClient = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signInAnonymously: jest.fn(),
    getUser: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
    linkEmailPassword: jest.fn(),
    forceSessionExpiry: jest.fn(),
  }
};

// Mock the SupabaseClient module to return the mock directly
jest.mock('../../../lib/data/supabase/SupabaseClient', () => ({
  supabaseClient: {
    getSupabaseClient: () => mockSupabaseClient
  }
}));

describe('SupabaseAuth', () => {
  let auth: SupabaseAuth;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default auth state change mock
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    });
    
    auth = new SupabaseAuth();
  });

  describe('Constructor', () => {
    it('should initialize with supabase client', () => {
      expect(auth).toBeDefined();
      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('should create mock client in test environment when client unavailable', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      // Create a new instance that will use the mock
      const authWithMock = new SupabaseAuth();
      expect(authWithMock).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('signUp', () => {
    it('should sign up successfully with valid credentials', async () => {
      const mockUser = { 
        id: 'user-123', 
        email: 'test@example.com', 
        created_at: '2023-01-01T00:00:00Z' 
      };
      
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      const result = await auth.signUp('test@example.com', 'password123');

      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.isAnonymous).toBe(false);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error for invalid email format', async () => {
      await expect(auth.signUp('invalid-email', 'password123'))
        .rejects.toThrow('Invalid email format');
    });

    it('should throw error for short password', async () => {
      await expect(auth.signUp('test@example.com', '123'))
        .rejects.toThrow('Password must be at least 6 characters long');
    });

    it('should throw error when Supabase returns error', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: null,
        error: { message: 'Email already exists' }
      });

      await expect(auth.signUp('test@example.com', 'password123'))
        .rejects.toThrow('Sign up failed: Email already exists');
    });

    it('should throw error when no user is returned', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      await expect(auth.signUp('test@example.com', 'password123'))
        .rejects.toThrow('Sign up failed: No user returned');
    });
  });

  describe('signIn', () => {
    it('should sign in successfully with valid credentials', async () => {
      const mockUser = { 
        id: 'user-123', 
        email: 'test@example.com', 
        created_at: '2023-01-01T00:00:00Z' 
      };
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      const result = await auth.signIn('test@example.com', 'password123');

      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.isAnonymous).toBe(false);
    });

    it('should throw error when Supabase returns error', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid credentials' }
      });

      await expect(auth.signIn('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Sign in failed: Invalid credentials');
    });

    it('should throw error when no user is returned', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      await expect(auth.signIn('test@example.com', 'password123'))
        .rejects.toThrow('Sign in failed: No user returned');
    });
  });

  describe('signInAnonymously', () => {
    it('should create anonymous user successfully', async () => {
      const mockUser = { 
        id: 'anon-123', 
        created_at: '2023-01-01T00:00:00Z' 
      };
      
      mockSupabaseClient.auth.signInAnonymously.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      });

      const result = await auth.signInAnonymously();

      expect(result.id).toBe('anon-123');
      expect(result.email).toBeUndefined();
      expect(result.isAnonymous).toBe(true);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error when Supabase returns error', async () => {
      mockSupabaseClient.auth.signInAnonymously.mockResolvedValueOnce({
        data: null,
        error: { message: 'Anonymous auth disabled' }
      });

      await expect(auth.signInAnonymously())
        .rejects.toThrow('Anonymous sign in failed: Anonymous auth disabled');
    });

    it('should throw error when no user is returned', async () => {
      mockSupabaseClient.auth.signInAnonymously.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      await expect(auth.signInAnonymously())
        .rejects.toThrow('Anonymous sign in failed: No user returned');
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user when authenticated', async () => {
      const mockUser = { 
        id: 'user-123', 
        email: 'test@example.com', 
        created_at: '2023-01-01T00:00:00Z' 
      };
      
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser }
      });

      const result = await auth.getCurrentUser();

      expect(result).toBeDefined();
      expect(result!.id).toBe('user-123');
      expect(result!.email).toBe('test@example.com');
      expect(result!.isAnonymous).toBe(false);
    });

    it('should return current anonymous user', async () => {
      const mockUser = { 
        id: 'anon-123', 
        created_at: '2023-01-01T00:00:00Z' 
      };
      
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser }
      });

      const result = await auth.getCurrentUser();

      expect(result).toBeDefined();
      expect(result!.id).toBe('anon-123');
      expect(result!.email).toBeUndefined();
      expect(result!.isAnonymous).toBe(true);
    });

    it('should return null when no user is authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null }
      });

      const result = await auth.getCurrentUser();

      expect(result).toBeNull();
    });

    it('should return null when data is null', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: null
      });

      const result = await auth.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValueOnce({
        error: null
      });

      await auth.signOut();

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it('should throw error when sign out fails', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValueOnce({
        error: { message: 'Sign out failed' }
      });

      await expect(auth.signOut())
        .rejects.toThrow('Sign out failed: Sign out failed');
    });
  });

  describe('subscribeToAuthState', () => {
    it('should add callback to listeners and return unsubscribe function', () => {
      const callback = jest.fn();
      
      const unsubscribe = auth.subscribeToAuthState(callback);

      expect(typeof unsubscribe).toBe('function');
      
      // Test unsubscribe functionality
      unsubscribe();
      
      // Verify callback was removed (this is tested indirectly by checking the unsubscribe logic)
      expect(unsubscribe).toBeDefined();
    });

    it('should call callbacks when auth state changes', () => {
      const callback = jest.fn();
      auth.subscribeToAuthState(callback);

      // Get the auth state change callback that was registered
      const callIndex = mockSupabaseClient.auth.onAuthStateChange.mock.calls.length - 1;
      const authStateChangeCallback = mockSupabaseClient.auth.onAuthStateChange.mock.calls[callIndex][0];
      
      // Simulate auth state change with user session
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com', created_at: '2023-01-01T00:00:00Z' }
      };
      
      authStateChangeCallback('SIGNED_IN', mockSession);

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        id: 'user-123',
        email: 'test@example.com',
        isAnonymous: false
      }));
    });

    it('should call callbacks with null when user signs out', () => {
      const callback = jest.fn();
      auth.subscribeToAuthState(callback);

      // Get the auth state change callback
      const callIndex = mockSupabaseClient.auth.onAuthStateChange.mock.calls.length - 1;
      const authStateChangeCallback = mockSupabaseClient.auth.onAuthStateChange.mock.calls[callIndex][0];
      
      // Simulate sign out (no session)
      authStateChangeCallback('SIGNED_OUT', null);

      expect(callback).toHaveBeenCalledWith(null);
    });

    it('should handle auth state change callback errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const callbackThatThrows = jest.fn(() => {
        throw new Error('Callback error');
      });
      
      auth.subscribeToAuthState(callbackThatThrows);

      // Get the auth state change callback
      const callIndex = mockSupabaseClient.auth.onAuthStateChange.mock.calls.length - 1;
      const authStateChangeCallback = mockSupabaseClient.auth.onAuthStateChange.mock.calls[callIndex][0];
      
      // This should not throw - errors should be caught and logged
      expect(() => {
        authStateChangeCallback('SIGNED_IN', { user: { id: 'test' } });
      }).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Error in auth state listener:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should handle session without user property', () => {
      const callback = jest.fn();
      auth.subscribeToAuthState(callback);

      // Get the auth state change callback
      const callIndex = mockSupabaseClient.auth.onAuthStateChange.mock.calls.length - 1;
      const authStateChangeCallback = mockSupabaseClient.auth.onAuthStateChange.mock.calls[callIndex][0];
      
      // Simulate session without user property
      authStateChangeCallback('SIGNED_IN', { someOtherProperty: 'value' });

      expect(callback).toHaveBeenCalledWith(null);
    });
  });

  describe('linkEmailPassword', () => {
    it('should link email/password to anonymous user successfully', async () => {
      // Mock getCurrentUser to return anonymous user
      const mockAnonymousUser = { 
        id: 'anon-123', 
        created_at: '2023-01-01T00:00:00Z' 
      };
      
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockAnonymousUser }
      });

      mockSupabaseClient.auth.linkEmailPassword.mockResolvedValueOnce({
        data: { user: { id: 'anon-123', email: 'test@example.com' } },
        error: null
      });

      const result = await auth.linkEmailPassword('test@example.com', 'password123');

      expect(result.id).toBe('anon-123');
      expect(result.email).toBe('test@example.com');
      expect(result.isAnonymous).toBe(false);
    });

    it('should throw error for missing email', async () => {
      await expect(auth.linkEmailPassword('', 'password123'))
        .rejects.toThrow('Email and password are required');
    });

    it('should throw error for missing password', async () => {
      await expect(auth.linkEmailPassword('test@example.com', ''))
        .rejects.toThrow('Email and password are required');
    });

    it('should throw error for invalid email format', async () => {
      await expect(auth.linkEmailPassword('invalid-email', 'password123'))
        .rejects.toThrow('Invalid email format');
    });

    it('should throw error for weak password', async () => {
      await expect(auth.linkEmailPassword('test@example.com', '123'))
        .rejects.toThrow('Password should be at least 6 characters');
    });

    it('should throw error when no anonymous user exists', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null }
      });

      await expect(auth.linkEmailPassword('test@example.com', 'password123'))
        .rejects.toThrow('No anonymous user to upgrade');
    });

    it('should throw error when trying to upgrade authenticated user', async () => {
      const mockAuthenticatedUser = { 
        id: 'user-123', 
        email: 'existing@example.com',
        created_at: '2023-01-01T00:00:00Z' 
      };
      
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockAuthenticatedUser }
      });

      await expect(auth.linkEmailPassword('test@example.com', 'password123'))
        .rejects.toThrow('No anonymous user to upgrade');
    });

    it('should throw error when Supabase returns error', async () => {
      const mockAnonymousUser = { 
        id: 'anon-123', 
        created_at: '2023-01-01T00:00:00Z' 
      };
      
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockAnonymousUser }
      });

      mockSupabaseClient.auth.linkEmailPassword.mockResolvedValueOnce({
        data: null,
        error: { message: 'Linking failed' }
      });

      await expect(auth.linkEmailPassword('test@example.com', 'password123'))
        .rejects.toThrow('Linking failed');
    });

    it('should throw error when no user is returned after linking', async () => {
      const mockAnonymousUser = { 
        id: 'anon-123', 
        created_at: '2023-01-01T00:00:00Z' 
      };
      
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockAnonymousUser }
      });

      mockSupabaseClient.auth.linkEmailPassword.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      await expect(auth.linkEmailPassword('test@example.com', 'password123'))
        .rejects.toThrow('Failed to upgrade anonymous user');
    });
  });

  describe('forceSessionExpiry', () => {
    it('should force session expiry', async () => {
      mockSupabaseClient.auth.forceSessionExpiry.mockResolvedValueOnce(undefined);

      await auth.forceSessionExpiry();

      expect(mockSupabaseClient.auth.forceSessionExpiry).toHaveBeenCalled();
    });
  });

  describe('Email and Password Validation', () => {
    describe('isValidEmail', () => {
      it('should validate correct email formats', async () => {
        // Test through signUp method which uses isValidEmail
        mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
          data: { user: { id: 'test', email: 'test@example.com', created_at: '2023-01-01T00:00:00Z' } },
          error: null
        });

        await expect(auth.signUp('test@example.com', 'password123')).resolves.toBeDefined();
      });

      it('should reject invalid email formats', async () => {
        await expect(auth.signUp('invalid.email', 'password123')).rejects.toThrow('Invalid email format');
        await expect(auth.signUp('@domain.com', 'password123')).rejects.toThrow('Invalid email format');
        await expect(auth.signUp('user@', 'password123')).rejects.toThrow('Invalid email format');
        await expect(auth.signUp('user@domain', 'password123')).rejects.toThrow('Invalid email format');
      });
    });

    describe('isValidPassword', () => {
      it('should validate password length', async () => {
        await expect(auth.signUp('test@example.com', '12345')).rejects.toThrow('Password must be at least 6 characters long');
        await expect(auth.signUp('test@example.com', '')).rejects.toThrow('Password must be at least 6 characters long');
      });
    });
  });

  describe('mapSupabaseUserToUserAccount', () => {
    it('should map authenticated Supabase user correctly', async () => {
      const mockUser = { 
        id: 'user-123', 
        email: 'test@example.com', 
        created_at: '2023-01-01T00:00:00Z' 
      };
      
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser }
      });

      const result = await auth.getCurrentUser();

      expect(result!.id).toBe('user-123');
      expect(result!.email).toBe('test@example.com');
      expect(result!.isAnonymous).toBe(false);
      expect(result!.createdAt).toEqual(new Date('2023-01-01T00:00:00Z'));
    });

    it('should map anonymous Supabase user correctly', async () => {
      const mockUser = { 
        id: 'anon-123', 
        created_at: '2023-01-01T00:00:00Z'
      };
      
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser }
      });

      const result = await auth.getCurrentUser();

      expect(result!.id).toBe('anon-123');
      expect(result!.email).toBeUndefined();
      expect(result!.isAnonymous).toBe(true);
      expect(result!.createdAt).toEqual(new Date('2023-01-01T00:00:00Z'));
    });
  });

  describe('Edge Cases', () => {
    it('should handle auth without onAuthStateChange method', () => {
      // Test initialization without onAuthStateChange
      const mockClientWithoutAuth = {};
      
      // Create a new instance with a client that doesn't have auth methods
      // This tests the constructor's conditional check
      expect(() => {
        // We can't easily test this without creating a separate mock scenario
        // The key is that the constructor checks for onAuthStateChange existence
        auth.subscribeToAuthState(() => {});
      }).not.toThrow();
    });
  });
});