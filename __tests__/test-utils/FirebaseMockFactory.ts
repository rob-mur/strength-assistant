/**
 * Firebase Mock Factory
 *
 * Provides standardized Firebase service mocking with parallel behavior to Supabase mocks.
 * Ensures consistent authentication state management and error handling across backends.
 */

interface FirebaseUser {
  uid: string;
  email?: string;
  isAnonymous: boolean;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

interface FirebaseAuthResponse {
  user: FirebaseUser | null;
  credential?: unknown;
}

export class FirebaseMockFactory {
  private static currentUser: FirebaseUser | null = null;
  private static userCounter = 0;
  private static authStateListeners: ((user: FirebaseUser | null) => void)[] =
    [];

  static reset(): void {
    this.currentUser = null;
    this.userCounter = 0;
    this.authStateListeners = [];
  }

  static createMockUser(email?: string, isAnonymous = false): FirebaseUser {
    const now = new Date().toISOString();
    // Use consistent IDs with other test systems for cross-backend compatibility
    return {
      uid: isAnonymous ? "test-anon-uid" : "test-uid",
      email: isAnonymous ? undefined : email || "test@example.com",
      isAnonymous,
      metadata: {
        creationTime: now,
        lastSignInTime: now,
      },
    };
  }

  static notifyAuthStateChange(user: FirebaseUser | null): void {
    this.authStateListeners.forEach((listener) => {
      try {
        listener(user);
      } catch (error) {
        console.error("Firebase Auth State Listener Error:", error);
      }
    });
  }

  /**
   * Create Firebase Auth mock with dynamic behavior matching Supabase mock
   */
  static createAuthMock() {
    return {
      onAuthStateChanged: jest.fn(
        (callback: (user: FirebaseUser | null) => void) => {
          this.authStateListeners.push(callback);
          // Immediately call with current user
          callback(this.currentUser);
          // Return unsubscribe function
          return jest.fn(() => {
            const index = this.authStateListeners.indexOf(callback);
            if (index > -1) {
              this.authStateListeners.splice(index, 1);
            }
          });
        },
      ),

      signInAnonymously: jest.fn((): Promise<FirebaseAuthResponse> => {
        const user = this.createMockUser(undefined, true);
        this.currentUser = user;
        this.notifyAuthStateChange(user);
        return Promise.resolve({ user });
      }),

      createUserWithEmailAndPassword: jest.fn(
        (email: string, password: string): Promise<FirebaseAuthResponse> => {
          // Validate password strength
          if (password.length < 6) {
            return Promise.reject(
              new Error("Password should be at least 6 characters"),
            );
          }

          const user = this.createMockUser(email, false);
          this.currentUser = user;
          this.notifyAuthStateChange(user);
          return Promise.resolve({ user });
        },
      ),

      signInWithEmailAndPassword: jest.fn(
        (email: string, password: string): Promise<FirebaseAuthResponse> => {
          // Simulate failed auth for wrong credentials
          if (email === "wrong@example.com" || password === "wrongpassword") {
            return Promise.reject(new Error("Invalid login credentials"));
          }

          const user = this.createMockUser(email, false);
          this.currentUser = user;
          this.notifyAuthStateChange(user);
          return Promise.resolve({ user });
        },
      ),

      signOut: jest.fn((): Promise<void> => {
        this.currentUser = null;
        this.notifyAuthStateChange(null);
        return Promise.resolve();
      }),

      get currentUser(): FirebaseUser | null {
        return this.currentUser;
      },

      useEmulator: jest.fn(),
    };
  }

  /**
   * Create Firestore mock with basic CRUD operations
   */
  static createFirestoreMock(): unknown {
    const mockDoc = {
      get: jest.fn(() =>
        Promise.resolve({
          exists: true,
          data: jest.fn(() => ({ name: "Test Exercise" })),
          id: `doc-${this.userCounter}`,
        }),
      ),
      set: jest.fn(() => Promise.resolve()),
      update: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve()),
      onSnapshot: jest.fn((callback) => {
        // Execute callback immediately without any async delay
        callback({
          exists: true,
          data: () => ({ name: "Test Exercise" }),
          id: `doc-${this.userCounter}`,
        });
        return jest.fn(); // Return unsubscribe function
      }),
    };

    const mockCollection: Record<string, unknown> = {
      add: jest.fn(() => Promise.resolve({ id: `doc-${++this.userCounter}` })),
      doc: jest.fn(() => mockDoc),
      where: jest.fn(() => mockCollection),
      orderBy: jest.fn(() => mockCollection),
      limit: jest.fn(() => mockCollection),
      get: jest.fn(() =>
        Promise.resolve({
          docs: [],
          forEach: jest.fn(),
          size: 0,
        }),
      ),
      onSnapshot: jest.fn((callback) => {
        // Execute callback immediately without any async delay
        callback({
          docs: [],
          forEach: jest.fn(),
          size: 0,
          docChanges: jest.fn(() => []),
        });
        return jest.fn(); // Return unsubscribe function
      }),
    };

    return {
      collection: jest.fn((): Record<string, unknown> => mockCollection),
      enableNetwork: jest.fn(() => Promise.resolve()),
      disableNetwork: jest.fn(() => Promise.resolve()),
      clearPersistence: jest.fn(() => Promise.resolve()),
      useEmulator: jest.fn(),
    };
  }

  /**
   * Create complete Firebase app mock
   */
  static createAppMock() {
    return {
      name: "test-firebase-app",
      options: {
        apiKey: "test-api-key",
        projectId: "test-project",
      },
      auth: this.createAuthMock,
      firestore: this.createFirestoreMock,
    };
  }

  /**
   * Get React Native Firebase mock structure
   */
  static getReactNativeFirebaseMock() {
    const authMock = this.createAuthMock();

    // React Native Firebase structure is slightly different
    return {
      __esModule: true,
      default: () => authMock,
      FirebaseAuthTypes: {
        AuthErrorCode: {
          INVALID_EMAIL: "auth/invalid-email",
          USER_NOT_FOUND: "auth/user-not-found",
          WRONG_PASSWORD: "auth/wrong-password",
          WEAK_PASSWORD: "auth/weak-password",
        },
      },
    };
  }

  /**
   * Create Firebase web SDK mock structure
   */
  static getWebFirebaseMock() {
    return {
      initializeApp: jest.fn(() => this.createAppMock()),
      getAuth: jest.fn(() => this.createAuthMock()),
      getFirestore: jest.fn(() => this.createFirestoreMock()),
      connectAuthEmulator: jest.fn(),
      connectFirestoreEmulator: jest.fn(),
    };
  }

  /**
   * Ensure consistent cleanup between tests
   */
  static cleanup(): void {
    this.reset();
  }

  /**
   * Get current user state for testing
   */
  static getCurrentUser(): FirebaseUser | null {
    return this.currentUser;
  }

  /**
   * Set user state directly (for testing edge cases)
   */
  static setCurrentUser(user: FirebaseUser | null): void {
    this.currentUser = user;
    this.notifyAuthStateChange(user);
  }
}

// Export for use in jest.setup.js
export default FirebaseMockFactory;
