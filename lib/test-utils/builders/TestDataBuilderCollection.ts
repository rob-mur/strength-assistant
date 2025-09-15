/**
 * Test Data Builder Collection Implementation
 * 
 * Comprehensive test data builders for creating complex test scenarios
 * using the builder pattern with fluent API for maximum flexibility.
 */

import { v4 as uuidv4 } from 'uuid';
import { Exercise } from '../../models/Exercise';
import { UserAccount, createAnonymousUser, createAuthenticatedUser } from '../../models/UserAccount';
import type {
  TestDataBuilderCollection,
  ScenarioBuilder,
  ExerciseBuilder,
  UserBuilder,
  SyncDataBuilder,
  TestScenario,
  TestDeviceConfig,
  SyncStatus,
  SyncState,
  SyncOperationType
} from '../../../specs/001-we-are-actually/contracts/test-infrastructure';

/**
 * Exercise Builder Implementation - Fluent API for exercise creation
 */
export class ExerciseBuilderImpl implements ExerciseBuilder {
  private exercise: Partial<Exercise> = {};

  withName(name: string): ExerciseBuilder {
    this.exercise.name = name;
    return this;
  }

  withId(id: string): ExerciseBuilder {
    this.exercise.id = id;
    return this;
  }

  withSyncStatus(status: SyncStatus): ExerciseBuilder {
    // Store sync status as metadata for testing
    (this.exercise as Exercise & { syncStatus: SyncStatus }).syncStatus = status;
    return this;
  }

  withTimestamps(createdAt: Date, updatedAt?: Date): ExerciseBuilder {
    this.exercise.created_at = createdAt.toISOString();
    // Exercise model has updated_at field for sync tracking
    this.exercise.updated_at = updatedAt ? updatedAt.toISOString() : createdAt.toISOString();
    return this;
  }

  withUserId(userId: string): ExerciseBuilder {
    this.exercise.user_id = userId;
    return this;
  }

  build(): Exercise {
    // Provide defaults for required fields with proper sync field consistency
    const now = new Date().toISOString();
    const defaultExercise: Exercise = {
      id: this.exercise.id || uuidv4(),
      name: this.exercise.name || 'Default Exercise',
      user_id: this.exercise.user_id || 'default-user',
      created_at: this.exercise.created_at || now,
      updated_at: this.exercise.updated_at || now,
      deleted: this.exercise.deleted || false
    };

    return { ...defaultExercise, ...this.exercise } as Exercise;
  }
}

/**
 * User Builder Implementation - Fluent API for user creation
 */
export class UserBuilderImpl implements UserBuilder {
  private user: Partial<UserAccount> = {};

  withEmail(email: string): UserBuilder {
    this.user.email = email;
    this.user.isAnonymous = false;
    return this;
  }

  asAnonymous(): UserBuilder {
    this.user.isAnonymous = true;
    this.user.email = undefined;
    return this;
  }

  withId(id: string): UserBuilder {
    this.user.id = id;
    return this;
  }

  withTimestamps(createdAt: Date, lastSyncAt?: Date): UserBuilder {
    this.user.createdAt = createdAt;
    this.user.lastSyncAt = lastSyncAt;
    return this;
  }

  build(): UserAccount {
    // Create base user based on whether it's anonymous or authenticated
    let baseUser: UserAccount;
    
    if (this.user.isAnonymous === false && this.user.email) {
      baseUser = createAuthenticatedUser(this.user.email);
    } else {
      baseUser = createAnonymousUser();
    }

    // Apply all overrides
    return { ...baseUser, ...this.user } as UserAccount;
  }
}

/**
 * Sync Data Builder Implementation - Fluent API for sync state creation
 */
export class SyncDataBuilderImpl implements SyncDataBuilder {
  private syncState: Partial<SyncState> = {};

  forExercise(exercise: Exercise): SyncDataBuilder {
    this.syncState.recordId = exercise.id;
    this.syncState.recordType = 'exercise';
    return this;
  }

  withOperation(operation: SyncOperationType): SyncDataBuilder {
    this.syncState.operation = operation;
    return this;
  }

  withStatus(status: SyncStatus): SyncDataBuilder {
    this.syncState.status = status;
    return this;
  }

  withRetryAttempts(attempts: number): SyncDataBuilder {
    this.syncState.attempts = attempts;
    return this;
  }

  withError(error: string): SyncDataBuilder {
    this.syncState.lastError = error;
    return this;
  }

  build(): SyncState {
    // Provide defaults for required fields
    const defaultSyncState: SyncState = {
      recordId: this.syncState.recordId || uuidv4(),
      recordType: this.syncState.recordType || 'exercise',
      operation: this.syncState.operation || 'create',
      status: this.syncState.status || 'pending',
      attempts: this.syncState.attempts || 0,
      pendingSince: new Date()
    };

    return { ...defaultSyncState, ...this.syncState };
  }
}

/**
 * Scenario Builder Implementation - Creates complex test scenarios
 */
export class ScenarioBuilderImpl implements ScenarioBuilder {
  anonymousUserScenario(): TestScenario {
    const anonymousUser = new UserBuilderImpl().asAnonymous().build();
    const exercises = [
      new ExerciseBuilderImpl()
        .withName('Push-ups')
        .withUserId(anonymousUser.id)
        .build(),
      new ExerciseBuilderImpl()
        .withName('Squats')
        .withUserId(anonymousUser.id)
        .build()
    ];

    return {
      name: 'Anonymous User Scenario',
      description: 'Test scenario with anonymous user performing local-only operations',
      devices: [{
        defaultNetworkStatus: true,
        defaultAuthState: {
          authenticated: false,
          currentUser: anonymousUser
        },
        mockServices: {
          firebase: { auth: true, firestore: false, config: {} },
          supabase: { auth: false, database: false, config: {} },
          reactNative: { asyncStorage: true, navigation: true, config: {} }
        },
        testDataConfig: {
          deterministic: true,
          prePopulatedData: {
            exercises,
            users: [anonymousUser]
          }
        }
      }],
      initialData: {
        exercises,
        users: [anonymousUser]
      },
      steps: [
        {
          name: 'Initialize Device',
          description: 'Set up anonymous device with local storage',
          deviceName: 'Device-1',
          action: { type: 'addExercise', parameters: { name: 'Burpees' } },
          expectedResult: { exerciseCount: 3, syncStatus: 'local-only' }
        }
      ]
    };
  }

  authenticatedUserScenario(email: string): TestScenario {
    const authenticatedUser = new UserBuilderImpl()
      .withEmail(email)
      .withTimestamps(new Date(Date.now() - 24 * 60 * 60 * 1000))
      .build();

    const exercises = [
      new ExerciseBuilderImpl()
        .withName('Bench Press')
        .withUserId(authenticatedUser.id)
        .withSyncStatus('synced')
        .build(),
      new ExerciseBuilderImpl()
        .withName('Deadlift')
        .withUserId(authenticatedUser.id)
        .withSyncStatus('pending')
        .build()
    ];

    return {
      name: 'Authenticated User Scenario',
      description: 'Test scenario with authenticated user and cloud sync capabilities',
      devices: [{
        defaultNetworkStatus: true,
        defaultAuthState: {
          authenticated: true,
          currentUser: authenticatedUser
        },
        mockServices: {
          firebase: { auth: true, firestore: true, config: {} },
          supabase: { auth: true, database: true, config: {} },
          reactNative: { asyncStorage: true, navigation: true, config: {} }
        },
        testDataConfig: {
          deterministic: true,
          prePopulatedData: {
            exercises,
            users: [authenticatedUser]
          }
        }
      }],
      initialData: {
        exercises,
        users: [authenticatedUser]
      },
      steps: [
        {
          name: 'Sign In',
          description: 'Authenticate user and verify session',
          deviceName: 'Device-1',
          action: { type: 'signIn', parameters: { email, password: 'testpass123' } },
          expectedResult: { authenticated: true, user: authenticatedUser }
        },
        {
          name: 'Add Exercise',
          description: 'Create new exercise and verify sync',
          deviceName: 'Device-1',
          action: { type: 'addExercise', parameters: { name: 'Overhead Press' } },
          expectedResult: { exerciseCount: 3, syncStatus: 'synced' }
        }
      ]
    };
  }

  multiDeviceSyncScenario(deviceCount: number, userEmail: string): TestScenario {
    const user = new UserBuilderImpl()
      .withEmail(userEmail)
      .withTimestamps(new Date(Date.now() - 48 * 60 * 60 * 1000))
      .build();

    const devices: TestDeviceConfig[] = Array.from({ length: deviceCount }, () => ({
      defaultNetworkStatus: true,
      defaultAuthState: {
        authenticated: true,
        currentUser: user
      },
      mockServices: {
        firebase: { auth: true, firestore: true, config: {} },
        supabase: { auth: true, database: true, config: {} },
        reactNative: { asyncStorage: true, navigation: true, config: {} }
      },
      testDataConfig: {
        deterministic: true,
        randomSeed: 12345,
        prePopulatedData: {
          exercises: [],
          users: [user]
        }
      }
    }));

    return {
      name: 'Multi-Device Sync Scenario',
      description: `Test cross-device synchronization with ${deviceCount} devices`,
      devices,
      initialData: {
        exercises: [],
        users: [user]
      },
      steps: [
        {
          name: 'Sign In All Devices',
          description: 'Authenticate the same user on all devices',
          deviceName: 'Device-A',
          action: { type: 'signIn', parameters: { email: userEmail, password: 'testpass123' } },
          expectedResult: { authenticated: true, deviceCount }
        },
        {
          name: 'Create Exercise on Device A',
          description: 'Add exercise and verify sync to other devices',
          deviceName: 'Device-A',
          action: { type: 'addExercise', parameters: { name: 'Pull-ups' } },
          expectedResult: { exerciseCount: 1, syncedToAllDevices: true }
        },
        {
          name: 'Modify Exercise on Device B',
          description: 'Edit exercise and verify sync back to Device A',
          deviceName: 'Device-B',
          action: { 
            type: 'updateExercise', 
            parameters: { name: 'Assisted Pull-ups' } 
          },
          expectedResult: { exerciseUpdated: true, syncedToAllDevices: true }
        }
      ]
    };
  }

  offlineToOnlineScenario(offlineActionsCount: number): TestScenario {
    const user = new UserBuilderImpl()
      .withEmail('offline.user@example.com')
      .build();

    // Note: Offline exercises are generated on-demand during test execution for better memory management

    return {
      name: 'Offline to Online Scenario',
      description: 'Test offline operation queue and sync when coming back online',
      devices: [{
        defaultNetworkStatus: false, // Start offline
        defaultAuthState: {
          authenticated: true,
          currentUser: user
        },
        mockServices: {
          firebase: { auth: true, firestore: true, config: {} },
          supabase: { auth: true, database: true, config: {} },
          reactNative: { asyncStorage: true, navigation: true, config: {} }
        },
        testDataConfig: {
          deterministic: true,
          prePopulatedData: {
            exercises: [],
            users: [user]
          }
        }
      }],
      initialData: {
        exercises: [],
        users: [user]
      },
      steps: [
        {
          name: 'Perform Offline Actions',
          description: `Create ${offlineActionsCount} exercises while offline`,
          deviceName: 'OfflineDevice',
          action: { type: 'addExercise', parameters: { name: 'Offline Exercise' } },
          expectedResult: { 
            exerciseCount: offlineActionsCount, 
            syncStatus: 'queued',
            networkStatus: false 
          }
        },
        {
          name: 'Go Online',
          description: 'Enable network and trigger sync of queued operations',
          deviceName: 'OfflineDevice',
          action: { type: 'setNetworkStatus', parameters: { online: true } },
          expectedResult: { 
            networkStatus: true, 
            pendingSyncOperations: offlineActionsCount 
          }
        },
        {
          name: 'Wait for Sync',
          description: 'Wait for all queued operations to sync',
          deviceName: 'OfflineDevice',
          action: { type: 'waitForSync', parameters: {} },
          expectedResult: { 
            allSynced: true, 
            pendingSyncOperations: 0 
          }
        }
      ]
    };
  }

  performanceTestScenario(exerciseCount: number, deviceCount: number): TestScenario {
    const user = new UserBuilderImpl()
      .withEmail('performance.user@example.com')
      .build();

    // Create large dataset for performance testing
    const exercises = Array.from({ length: exerciseCount }, (_, i) =>
      new ExerciseBuilderImpl()
        .withName(`Performance Exercise ${i + 1}`)
        .withUserId(user.id)
        .withTimestamps(
          new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        )
        .build()
    );

    const devices: TestDeviceConfig[] = Array.from({ length: deviceCount }, (_, i) => ({
      defaultNetworkStatus: true,
      defaultAuthState: {
        authenticated: true,
        currentUser: user
      },
      mockServices: {
        firebase: { auth: true, firestore: true, config: { enablePersistence: true } },
        supabase: { auth: true, database: true, config: { enableRealtime: true } },
        reactNative: { asyncStorage: true, navigation: true, config: {} }
      },
      testDataConfig: {
        deterministic: false, // Use random data for performance testing
        prePopulatedData: {
          exercises: i === 0 ? exercises : [], // Only populate first device
          users: [user]
        }
      }
    }));

    return {
      name: 'Performance Test Scenario',
      description: `Performance test with ${exerciseCount} exercises across ${deviceCount} devices`,
      devices,
      initialData: {
        exercises,
        users: [user]
      },
      steps: [
        {
          name: 'Load Large Dataset',
          description: `Load ${exerciseCount} exercises and measure performance`,
          deviceName: 'PerfDevice-1',
          action: { type: 'addExercise', parameters: { name: 'Performance Test Exercise' } },
          expectedResult: { 
            exerciseCount, 
            loadTimeMs: '<100',
            memoryUsageMB: '<50'
          }
        },
        {
          name: 'Sync to All Devices',
          description: 'Measure sync performance across multiple devices',
          deviceName: 'PerfDevice-1',
          action: { type: 'waitForSync', parameters: {} },
          expectedResult: { 
            allDevicesSynced: true,
            syncTimeMs: '<5000',
            consistencyCheck: 'passed'
          }
        }
      ]
    };
  }
}

/**
 * Main Test Data Builder Collection Implementation
 */
export class TestDataBuilderCollectionImpl implements TestDataBuilderCollection {
  readonly scenarioBuilder: ScenarioBuilder;
  readonly exerciseBuilder: ExerciseBuilder;
  readonly userBuilder: UserBuilder;
  readonly syncBuilder: SyncDataBuilder;

  constructor() {
    this.scenarioBuilder = new ScenarioBuilderImpl();
    this.exerciseBuilder = new ExerciseBuilderImpl();
    this.userBuilder = new UserBuilderImpl();
    this.syncBuilder = new SyncDataBuilderImpl();
  }

  // Factory methods for creating fresh builders
  createExerciseBuilder(): ExerciseBuilder {
    return new ExerciseBuilderImpl();
  }

  createUserBuilder(): UserBuilder {
    return new UserBuilderImpl();
  }

  createSyncBuilder(): SyncDataBuilder {
    return new SyncDataBuilderImpl();
  }

  createScenarioBuilder(): ScenarioBuilder {
    return new ScenarioBuilderImpl();
  }
}

// Export the implementation as default
export default TestDataBuilderCollectionImpl;