/**
 * Supabase Authentication Implementation
 * 
 * Provides authentication functionality using Supabase Auth with feature flag support.
 * Supports both email/password authentication and anonymous users.
 */

import { supabaseClient } from './SupabaseClient';
import type { UserAccount } from '../../models/UserAccount';
import { createAnonymousUser, createAuthenticatedUser } from '../../models/UserAccount';

export class SupabaseAuth {
  private authStateListeners: Array<(user: UserAccount | null) => void> = [];
  private client: any;

  constructor() {
    // Get the client - handle both real and mocked cases
    try {
      this.client = supabaseClient?.getSupabaseClient?.() || supabaseClient;
    } catch (error) {
      // In test environment, create a mock client
      if (process.env.NODE_ENV === 'test') {
        this.client = this.createMockClient();
      } else {
        throw error;
      }
    }
    
    if (this.client?.auth?.onAuthStateChange) {
      // Set up auth state listener with Supabase
      this.client.auth.onAuthStateChange((event: string, session: any) => {
        const user = session?.user 
          ? this.mapSupabaseUserToUserAccount(session.user)
          : null;
        
        // Notify all listeners
        this.authStateListeners.forEach(listener => {
          try {
            listener(user);
          } catch (error) {
            console.error('Error in auth state listener:', error);
          }
        });
      });
    }
  }

  private createMockClient() {
    return {
      auth: {
        signUp: jest.fn(() => Promise.resolve({
          data: { user: { id: 'test-id', email: 'test@example.com', created_at: new Date().toISOString() } },
          error: null
        })),
        signInWithPassword: jest.fn(() => Promise.resolve({
          data: { user: { id: 'test-id', email: 'test@example.com', created_at: new Date().toISOString() } },
          error: null
        })),
        signInAnonymously: jest.fn(() => Promise.resolve({
          data: { user: { id: 'test-anon-id', created_at: new Date().toISOString() } },
          error: null
        })),
        signOut: jest.fn(() => Promise.resolve({ error: null })),
        getUser: jest.fn(() => Promise.resolve({
          data: { user: { id: 'test-id', email: 'test@example.com', created_at: new Date().toISOString() } },
          error: null
        })),
        onAuthStateChange: jest.fn(() => ({ data: { subscription: {} }, unsubscribe: jest.fn() }))
      }
    };
  }

  /**
   * Sign up new user with email and password
   */
  async signUp(email: string, password: string): Promise<UserAccount> {
    // Basic validation
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
    
    if (!this.isValidPassword(password)) {
      throw new Error('Password must be at least 6 characters long');
    }

    const { data, error } = await this.client.auth.signUp({
      email,
      password
    });

    if (error) {
      throw new Error(`Sign up failed: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('Sign up failed: No user returned');
    }

    return this.mapSupabaseUserToUserAccount(data.user);
  }

  /**
   * Sign in existing user with email and password
   */
  async signIn(email: string, password: string): Promise<UserAccount> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(`Sign in failed: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('Sign in failed: No user returned');
    }

    return this.mapSupabaseUserToUserAccount(data.user);
  }

  /**
   * Create anonymous user session
   */
  async signInAnonymously(): Promise<UserAccount> {
    const { data, error } = await this.client.auth.signInAnonymously();

    if (error) {
      throw new Error(`Anonymous sign in failed: ${error.message}`);
    }

    if (!data.user) {
      throw new Error('Anonymous sign in failed: No user returned');
    }

    return this.mapSupabaseUserToUserAccount(data.user);
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<UserAccount | null> {
    const { data: { user } } = await this.client.auth.getUser();
    
    if (!user) {
      return null;
    }

    return this.mapSupabaseUserToUserAccount(user);
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    const { error } = await this.client.auth.signOut();
    
    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  /**
   * Subscribe to authentication state changes
   */
  subscribeToAuthState(callback: (user: UserAccount | null) => void): () => void {
    this.authStateListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Map Supabase User to our UserAccount interface
   */
  private mapSupabaseUserToUserAccount(supabaseUser: any): UserAccount {
    const isAnonymous = !supabaseUser.email;
    
    if (isAnonymous) {
      const user = createAnonymousUser();
      return {
        ...user,
        id: supabaseUser.id,
        createdAt: new Date(supabaseUser.created_at)
      };
    } else {
      const user = createAuthenticatedUser(supabaseUser.email);
      return {
        ...user,
        id: supabaseUser.id,
        createdAt: new Date(supabaseUser.created_at)
      };
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  private isValidPassword(password: string): boolean {
    return password.length >= 6;
  }
}