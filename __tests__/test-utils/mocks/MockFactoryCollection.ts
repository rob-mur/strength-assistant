/**
 * Mock Factory Collection Implementation
 *
 * Central collection of all mock factories for comprehensive test infrastructure.
 * Provides standardized mock creation for exercises, users, sync states, and services.
 */

import { v4 as uuidv4 } from "uuid";
import { Exercise } from "../../../lib/models/Exercise";
import {
  UserAccount,
  createAnonymousUser,
  createAuthenticatedUser,
} from "../../../lib/models/UserAccount";
import type {
  MockFactoryCollection,
  ExerciseMockFactory,
  UserMockFactory,
  SyncStateMockFactory,
  AuthMockFactory,
  ServiceMockFactory,
  SyncStatus,
  SyncOperation,
  SyncState,
  SyncOperationType,
  AuthCredentials,
  AuthSession,
  AuthErrorType,
  AuthError,
  FirebaseServiceMocks,
  SupabaseServiceMocks,
  ReactNativeModuleMocks,
} from "../../../specs/001-we-are-actually/contracts/test-infrastructure";

import type {
  FirebaseMockConfig,
  SupabaseMockConfig,
  ReactNativeMockConfig,
} from "../../../specs/001-we-are-actually/contracts/jest-validation";

// Type helpers for loose test mocks
type AnyObj = Record<string, unknown>;

// Helper functions to create Firestore mock components
function createDocumentMock(): AnyObj {
  return {
    get: jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ name: "Test Exercise" }),
    }),
    set: jest.fn().mockResolvedValue(void 0),
    update: jest.fn().mockResolvedValue(void 0),
    delete: jest.fn().mockResolvedValue(void 0),
    onSnapshot: jest.fn((callback: unknown) => {
      (callback as (doc: unknown) => void)({
        exists: true,
        data: () => ({ name: "Test Exercise" }),
      });
      return jest.fn();
    }),
  };
}

function createCollectionMock(): AnyObj {
  return {
    doc: jest.fn(() => createDocumentMock()),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({
      docs: [
        {
          id: "doc1",
          data: () => ({ name: "Test Exercise 1" }),
        },
      ],
    }),
    onSnapshot: jest.fn((callback: unknown) => {
      (callback as (snapshot: unknown) => void)({
        docs: [
          {
            id: "doc1",
            data: () => ({ name: "Test Exercise 1" }),
          },
        ],
      });
      return jest.fn();
    }),
  };
}

// Helper to create deeply nested Firestore mock
function createFirestoreMock(): AnyObj {
  return {
    collection: jest.fn(() => createCollectionMock()),
  };
}

/**
 * Exercise Mock Factory Implementation
 */
export class ExerciseMockFactoryImpl implements ExerciseMockFactory {
  createExercise(overrides?: Partial<Exercise>): Exercise {
    const defaultExercise: Exercise = {
      id: uuidv4(),
      name: `Test Exercise ${Math.floor(Math.random() * 1000)}`,
      user_id: "test-user-id",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted: false,
    };

    return { ...defaultExercise, ...overrides };
  }

  createExercises(count: number, namePrefix: string = "Exercise"): Exercise[] {
    return Array.from({ length: count }, (_, index) =>
      this.createExercise({
        name: `${namePrefix} ${index + 1}`,
      }),
    );
  }

  createExerciseWithSyncStatus(
    syncStatus: SyncStatus,
    overrides?: Partial<Exercise>,
  ): Exercise {
    const exercise = this.createExercise(overrides);
    // In a real implementation, sync status would be tracked separately
    // For testing, we can add it as metadata
    return {
      ...exercise,
      // Add sync status as non-enumerable property for testing
      ...Object.defineProperty({}, "syncStatus", {
        value: syncStatus,
        enumerable: false,
      }),
    };
  }

  createPerformanceTestExercises(count: number): Exercise[] {
    return Array.from({ length: count }, (_, index) => ({
      id: `perf-exercise-${index.toString().padStart(6, "0")}`,
      name: `Performance Test Exercise ${index + 1}`,
      user_id: "performance-test-user",
      created_at: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      updated_at: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      deleted: false,
    }));
  }
}

/**
 * User Mock Factory Implementation
 */
export class UserMockFactoryImpl implements UserMockFactory {
  createUser(overrides?: Partial<UserAccount>): UserAccount {
    const defaultUser = createAnonymousUser();
    return { ...defaultUser, ...overrides };
  }

  createAnonymousUser(): UserAccount {
    return createAnonymousUser();
  }

  createAuthenticatedUser(
    email: string,
    overrides?: Partial<UserAccount>,
  ): UserAccount {
    const user = createAuthenticatedUser(email);
    return { ...user, ...overrides };
  }

  createMultipleUsers(count: number): UserAccount[] {
    return Array.from({ length: count }, (_, index) => {
      const isAnonymous = Math.random() < 0.3; // 30% anonymous
      if (isAnonymous) {
        return this.createAnonymousUser();
      } else {
        return this.createAuthenticatedUser(`testuser${index + 1}@example.com`);
      }
    });
  }
}

/**
 * Sync State Mock Factory Implementation
 */
export class SyncStateMockFactoryImpl implements SyncStateMockFactory {
  createSyncState(
    operation: SyncOperationType,
    status: SyncStatus,
    overrides?: Partial<SyncState>,
  ): SyncState {
    const defaultSyncState: SyncState = {
      recordId: uuidv4(),
      recordType: "exercise",
      operation,
      status,
      attempts: 0,
      pendingSince: new Date(),
    };

    return { ...defaultSyncState, ...overrides };
  }

  createPendingSyncOperations(count: number): SyncOperation[] {
    return Array.from({ length: count }, (_, index) => ({
      id: uuidv4(),
      type: ["create", "update", "delete"][
        Math.floor(Math.random() * 3)
      ] as SyncOperationType,
      recordId: `record-${index}`,
      recordType: "exercise",
      data: { name: `Test Exercise ${index}` },
      status: "pending" as SyncStatus,
      retryCount: 0,
      createdAt: new Date(),
      lastAttemptAt: new Date(),
    }));
  }

  createFailedSyncOperations(count: number): SyncOperation[] {
    return Array.from({ length: count }, (_, index) => ({
      id: uuidv4(),
      type: ["create", "update", "delete"][
        Math.floor(Math.random() * 3)
      ] as SyncOperationType,
      recordId: `failed-record-${index}`,
      recordType: "exercise",
      data: { name: `Failed Exercise ${index}` },
      status: "error" as SyncStatus,
      retryCount: Math.floor(Math.random() * 3) + 1,
      lastError: "Network timeout",
      createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      lastAttemptAt: new Date(Date.now() - Math.random() * 60 * 60 * 1000),
    }));
  }
}

/**
 * Auth Mock Factory Implementation
 */
export class AuthMockFactoryImpl implements AuthMockFactory {
  createAuthCredentials(email: string, password: string): AuthCredentials {
    return { email, password };
  }

  createAuthSession(user: UserAccount): AuthSession {
    return {
      sessionId: uuidv4(),
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      accessToken: `access_${uuidv4()}`,
      refreshToken: `refresh_${uuidv4()}`,
    };
  }

  createAuthError(errorType: AuthErrorType): AuthError {
    const errorMessages: Record<AuthErrorType, string> = {
      INVALID_EMAIL: "The email address is not valid",
      WEAK_PASSWORD: "The password is too weak",
      USER_EXISTS: "A user with this email already exists",
      USER_NOT_FOUND: "No user found with this email",
      WRONG_PASSWORD: "The password is incorrect",
      SESSION_EXPIRED: "The user session has expired",
      NETWORK_ERROR: "A network error occurred",
    };

    return {
      type: errorType,
      message: errorMessages[errorType],
      code: errorType.toLowerCase().replace("_", "-"),
    };
  }
}

/**
 * Service Mock Factory Implementation
 */
export class ServiceMockFactoryImpl implements ServiceMockFactory {
  createFirebaseMocks(config: FirebaseMockConfig): FirebaseServiceMocks {
    const authMock = config.auth
      ? {
          currentUser: null,
          signInWithEmailAndPassword: jest.fn().mockResolvedValue({
            user: { uid: "test-uid", email: "test@example.com" },
          }),
          createUserWithEmailAndPassword: jest.fn().mockResolvedValue({
            user: { uid: "test-uid", email: "test@example.com" },
          }),
          signOut: jest.fn().mockResolvedValue(void 0),
          onAuthStateChanged: jest.fn((callback: (user: unknown) => void) => {
            callback(null);
            return jest.fn();
          }),
        }
      : undefined;

    const firestoreMock = config.firestore ? createFirestoreMock() : undefined;

    return {
      auth: authMock,
      firestore: firestoreMock,
      functions: undefined, // Not commonly used in tests
    };
  }

  createSupabaseMocks(config: SupabaseMockConfig): SupabaseServiceMocks {
    const authMock = config.auth
      ? {
          getSession: jest.fn().mockResolvedValue({
            data: { session: null },
            error: null,
          }),
          signUp: jest.fn().mockResolvedValue({
            data: {
              user: { id: "test-uid", email: "test@example.com" },
              session: null,
            },
            error: null,
          }),
          signInWithPassword: jest.fn().mockResolvedValue({
            data: {
              user: { id: "test-uid", email: "test@example.com" },
              session: { access_token: "test-token" },
            },
            error: null,
          }),
          signOut: jest.fn().mockResolvedValue({
            error: null,
          }),
          onAuthStateChange: jest.fn((callback) => {
            callback("SIGNED_OUT", null);
            return { data: { subscription: { unsubscribe: jest.fn() } } };
          }),
        }
      : undefined;

    const databaseMock = config.database
      ? {
          from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: "test-id", name: "Test Exercise" },
              error: null,
            }),
            then: jest.fn().mockResolvedValue({
              data: [{ id: "test-id", name: "Test Exercise" }],
              error: null,
            }),
          })),
          channel: jest.fn(() => ({
            on: jest.fn().mockReturnThis(),
            subscribe: jest.fn(),
          })),
        }
      : undefined;

    return {
      auth: authMock,
      database: databaseMock,
      storage: undefined, // Not commonly used in exercise tests
    };
  }

  createReactNativeMocks(
    config: ReactNativeMockConfig,
  ): ReactNativeModuleMocks {
    const asyncStorageMock = config.asyncStorage
      ? {
          getItem: jest.fn().mockResolvedValue(null),
          setItem: jest.fn().mockResolvedValue(void 0),
          removeItem: jest.fn().mockResolvedValue(void 0),
          clear: jest.fn().mockResolvedValue(void 0),
          getAllKeys: jest.fn().mockResolvedValue([]),
          multiGet: jest.fn().mockResolvedValue([]),
          multiSet: jest.fn().mockResolvedValue(void 0),
          multiRemove: jest.fn().mockResolvedValue(void 0),
        }
      : undefined;

    const navigationMock = config.navigation
      ? {
          navigate: jest.fn(),
          goBack: jest.fn(),
          push: jest.fn(),
          pop: jest.fn(),
          replace: jest.fn(),
          reset: jest.fn(),
          addListener: jest.fn(() => jest.fn()), // Return unsubscribe function
          removeListener: jest.fn(),
          isFocused: jest.fn().mockReturnValue(true),
          getState: jest.fn().mockReturnValue({
            routes: [{ name: "Home" }],
            index: 0,
          }),
        }
      : undefined;

    return {
      asyncStorage: asyncStorageMock,
      navigation: navigationMock,
      modules: {}, // Additional modules can be added as needed
    };
  }
}

/**
 * Main Mock Factory Collection Implementation
 */
export class MockFactoryCollectionImpl implements MockFactoryCollection {
  readonly exerciseFactory: ExerciseMockFactory;
  readonly userFactory: UserMockFactory;
  readonly syncStateFactory: SyncStateMockFactory;
  readonly authFactory: AuthMockFactory;
  readonly serviceFactory: ServiceMockFactory;

  constructor() {
    this.exerciseFactory = new ExerciseMockFactoryImpl();
    this.userFactory = new UserMockFactoryImpl();
    this.syncStateFactory = new SyncStateMockFactoryImpl();
    this.authFactory = new AuthMockFactoryImpl();
    this.serviceFactory = new ServiceMockFactoryImpl();
  }
}

// Export the implementation as default factory
export default MockFactoryCollectionImpl;
