/**
 * Contract: Test Infrastructure Interface
 *
 * Defines interfaces for missing test infrastructure components that are
 * causing the 80 test failures, including TestDevice, mock factories,
 * and test data builders.
 */

import { Exercise } from "../../../lib/models/Exercise";
import { UserAccount } from "../../../lib/models/UserAccount";
import {
  MockFactoryConfig,
  TestDataBuilderConfig,
  FirebaseMockConfig,
  SupabaseMockConfig,
  ReactNativeMockConfig,
  TestDataConfig,
  MockFactoryCollection as JestMockFactoryCollection,
  TestDataBuilderCollection as JestTestDataBuilderCollection,
} from "./jest-validation";

export interface TestInfrastructureManager {
  /**
   * Initializes the complete test infrastructure
   * @param config Configuration for test infrastructure
   * @returns Promise resolving to initialization status
   */
  initializeInfrastructure(
    config: TestInfrastructureConfig,
  ): Promise<InfrastructureInitializationResult>;

  /**
   * Creates a new test device instance
   * @param deviceName Name for the test device
   * @param config Optional device-specific configuration
   * @returns Promise resolving to test device instance
   */
  createTestDevice(
    deviceName: string,
    config?: TestDeviceConfig,
  ): Promise<TestDevice>;

  /**
   * Gets or creates mock factories for testing
   * @param factoryConfig Configuration for mock factories
   * @returns Promise resolving to mock factory collection
   */
  getMockFactories(
    factoryConfig: MockFactoryConfig,
  ): Promise<JestMockFactoryCollection>;

  /**
   * Gets or creates test data builders
   * @param builderConfig Configuration for test data builders
   * @returns Promise resolving to test data builder collection
   */
  getTestDataBuilders(
    builderConfig: TestDataBuilderConfig,
  ): Promise<JestTestDataBuilderCollection>;

  /**
   * Cleans up all test infrastructure
   * @returns Promise resolving when cleanup is complete
   */
  cleanupInfrastructure(): Promise<void>;

  /**
   * Validates that all required infrastructure is available
   * @param requirements List of required infrastructure components
   * @returns Promise resolving to validation results
   */
  validateInfrastructureRequirements(
    requirements: string[],
  ): Promise<InfrastructureValidationResult>;
}

export interface TestDevice {
  /** Unique identifier for this test device */
  readonly deviceId: string;

  /** Human-readable device name */
  readonly deviceName: string;

  /** Current initialization status */
  readonly initialized: boolean;

  /** Current network connectivity status */
  readonly networkStatus: boolean;

  /** Current authentication state */
  readonly authState: TestAuthenticationState;

  /**
   * Initialize the test device with clean state
   * @returns Promise resolving when device is ready
   */
  init(): Promise<void>;

  /**
   * Clean up and reset device state
   * @returns Promise resolving when cleanup is complete
   */
  cleanup(): Promise<void>;

  /**
   * Control network connectivity simulation
   * @param online Whether device should be online
   * @returns Promise resolving when network status is updated
   */
  setNetworkStatus(online: boolean): Promise<void>;

  /**
   * Simulate network issues like latency or intermittent failures
   * @param enabled Whether to enable network simulation
   * @param config Optional configuration for network issues
   * @returns Promise resolving when simulation is configured
   */
  simulateNetworkIssues(
    enabled: boolean,
    config?: NetworkSimulationConfig,
  ): Promise<void>;

  /**
   * Sign up a new user account
   * @param email User email address
   * @param password User password
   * @returns Promise resolving to created user account
   */
  signUp(email: string, password: string): Promise<UserAccount>;

  /**
   * Sign in with existing user credentials
   * @param email User email address
   * @param password User password
   * @returns Promise resolving to authenticated user account
   */
  signIn(email: string, password: string): Promise<UserAccount>;

  /**
   * Sign out current user
   * @returns Promise resolving when sign out is complete
   */
  signOut(): Promise<void>;

  /**
   * Sign out all users (for test cleanup)
   * @returns Promise resolving when all users are signed out
   */
  signOutAll(): Promise<void>;

  /**
   * Add a new exercise
   * @param name Exercise name
   * @returns Promise resolving to created exercise
   */
  addExercise(name: string): Promise<Exercise>;

  /**
   * Update an existing exercise
   * @param id Exercise ID
   * @param name New exercise name
   * @returns Promise resolving to updated exercise
   */
  updateExercise(id: string, name: string): Promise<Exercise>;

  /**
   * Delete an exercise
   * @param id Exercise ID
   * @returns Promise resolving when exercise is deleted
   */
  deleteExercise(id: string): Promise<void>;

  /**
   * Get all exercises for current user
   * @returns Promise resolving to array of exercises
   */
  getExercises(): Promise<Exercise[]>;

  /**
   * Get an exercise by ID
   * @param id Exercise ID
   * @returns Promise resolving to exercise or null if not found
   */
  getExercise(id: string): Promise<Exercise | null>;

  /**
   * Get sync status for a specific exercise
   * @param exerciseId Exercise ID
   * @returns Promise resolving to sync status
   */
  getSyncStatus(exerciseId: string): Promise<SyncStatus>;

  /**
   * Wait for all sync operations to complete
   * @param timeoutMs Optional timeout in milliseconds
   * @returns Promise resolving when sync is complete
   */
  waitForSyncComplete(timeoutMs?: number): Promise<void>;

  /**
   * Subscribe to real-time exercise changes
   * @param callback Function to call when exercises change
   * @returns Unsubscribe function
   */
  subscribeToExerciseChanges(
    callback: (exercises: Exercise[]) => void,
  ): () => void;

  /**
   * Retry failed sync operations
   * @returns Promise resolving when retry attempts are complete
   */
  retryFailedSyncs(): Promise<void>;

  /**
   * Get pending sync operations
   * @returns Promise resolving to array of pending sync operations
   */
  getPendingSyncOperations(): Promise<SyncOperation[]>;

  /**
   * Wait for a specified duration (test utility)
   * @param ms Milliseconds to wait
   * @returns Promise resolving after specified time
   */
  waitFor(ms: number): Promise<void>;

  /**
   * Get device state for debugging
   * @returns Current device state snapshot
   */
  getDeviceState(): TestDeviceState;
}

export interface MockFactoryCollection {
  /** Factory for creating exercise test data */
  exerciseFactory: ExerciseMockFactory;

  /** Factory for creating user test data */
  userFactory: UserMockFactory;

  /** Factory for creating sync state test data */
  syncStateFactory: SyncStateMockFactory;

  /** Factory for creating authentication test data */
  authFactory: AuthMockFactory;

  /** Factory for creating service mocks */
  serviceFactory: ServiceMockFactory;
}

export interface ExerciseMockFactory {
  /**
   * Create a basic exercise with default values
   * @param overrides Optional field overrides
   * @returns Exercise object
   */
  createExercise(overrides?: Partial<Exercise>): Exercise;

  /**
   * Create multiple exercises with unique names
   * @param count Number of exercises to create
   * @param namePrefix Prefix for exercise names
   * @returns Array of exercise objects
   */
  createExercises(count: number, namePrefix?: string): Exercise[];

  /**
   * Create an exercise with specific sync status
   * @param syncStatus Desired sync status
   * @param overrides Optional field overrides
   * @returns Exercise object with sync status
   */
  createExerciseWithSyncStatus(
    syncStatus: SyncStatus,
    overrides?: Partial<Exercise>,
  ): Exercise;

  /**
   * Create exercises for performance testing scenarios
   * @param count Number of exercises to create
   * @returns Array of exercises suitable for performance testing
   */
  createPerformanceTestExercises(count: number): Exercise[];
}

export interface UserMockFactory {
  /**
   * Create a basic user account
   * @param overrides Optional field overrides
   * @returns User account object
   */
  createUser(overrides?: Partial<UserAccount>): UserAccount;

  /**
   * Create an anonymous user account
   * @returns Anonymous user account
   */
  createAnonymousUser(): UserAccount;

  /**
   * Create an authenticated user account
   * @param email User email
   * @param overrides Optional field overrides
   * @returns Authenticated user account
   */
  createAuthenticatedUser(
    email: string,
    overrides?: Partial<UserAccount>,
  ): UserAccount;

  /**
   * Create multiple user accounts for multi-device testing
   * @param count Number of users to create
   * @returns Array of user accounts
   */
  createMultipleUsers(count: number): UserAccount[];
}

export interface SyncStateMockFactory {
  /**
   * Create a sync state record
   * @param operation Sync operation type
   * @param status Current sync status
   * @param overrides Optional field overrides
   * @returns Sync state record
   */
  createSyncState(
    operation: SyncOperationType,
    status: SyncStatus,
    overrides?: Partial<SyncState>,
  ): SyncState;

  /**
   * Create pending sync operations
   * @param count Number of operations to create
   * @returns Array of pending sync operations
   */
  createPendingSyncOperations(count: number): SyncOperation[];

  /**
   * Create failed sync operations for error testing
   * @param count Number of failed operations to create
   * @returns Array of failed sync operations
   */
  createFailedSyncOperations(count: number): SyncOperation[];
}

export interface AuthMockFactory {
  /**
   * Create mock authentication credentials
   * @param email User email
   * @param password User password
   * @returns Authentication credentials
   */
  createAuthCredentials(email: string, password: string): AuthCredentials;

  /**
   * Create mock authentication session
   * @param user User account
   * @returns Authentication session
   */
  createAuthSession(user: UserAccount): AuthSession;

  /**
   * Create mock authentication errors for testing
   * @param errorType Type of authentication error
   * @returns Authentication error
   */
  createAuthError(errorType: AuthErrorType): AuthError;
}

export interface ServiceMockFactory {
  /**
   * Create Firebase service mocks
   * @param config Configuration for Firebase mocks
   * @returns Firebase service mock collection
   */
  createFirebaseMocks(config: FirebaseMockConfig): FirebaseServiceMocks;

  /**
   * Create Supabase service mocks
   * @param config Configuration for Supabase mocks
   * @returns Supabase service mock collection
   */
  createSupabaseMocks(config: SupabaseMockConfig): SupabaseServiceMocks;

  /**
   * Create React Native module mocks
   * @param config Configuration for React Native mocks
   * @returns React Native module mock collection
   */
  createReactNativeMocks(config: ReactNativeMockConfig): ReactNativeModuleMocks;
}

export interface TestDataBuilderCollection {
  /** Builder for creating test scenarios */
  scenarioBuilder: ScenarioBuilder;

  /** Builder for creating exercise test data */
  exerciseBuilder: ExerciseBuilder;

  /** Builder for creating user test data */
  userBuilder: UserBuilder;

  /** Builder for creating sync test data */
  syncBuilder: SyncDataBuilder;
}

export interface ScenarioBuilder {
  /**
   * Create a basic anonymous user scenario
   * @returns Scenario configuration
   */
  anonymousUserScenario(): TestScenario;

  /**
   * Create an authenticated user scenario
   * @param email User email
   * @returns Scenario configuration
   */
  authenticatedUserScenario(email: string): TestScenario;

  /**
   * Create a multi-device sync scenario
   * @param deviceCount Number of devices
   * @param userEmail User email for sync
   * @returns Scenario configuration
   */
  multiDeviceSyncScenario(deviceCount: number, userEmail: string): TestScenario;

  /**
   * Create an offline-to-online sync scenario
   * @param offlineActionsCount Number of actions while offline
   * @returns Scenario configuration
   */
  offlineToOnlineScenario(offlineActionsCount: number): TestScenario;

  /**
   * Create a performance testing scenario
   * @param exerciseCount Number of exercises to create
   * @param deviceCount Number of devices to simulate
   * @returns Scenario configuration
   */
  performanceTestScenario(
    exerciseCount: number,
    deviceCount: number,
  ): TestScenario;
}

export interface ExerciseBuilder {
  /**
   * Set exercise name
   * @param name Exercise name
   * @returns Builder instance for chaining
   */
  withName(name: string): ExerciseBuilder;

  /**
   * Set exercise ID
   * @param id Exercise ID
   * @returns Builder instance for chaining
   */
  withId(id: string): ExerciseBuilder;

  /**
   * Set exercise sync status
   * @param status Sync status
   * @returns Builder instance for chaining
   */
  withSyncStatus(status: SyncStatus): ExerciseBuilder;

  /**
   * Set exercise timestamps
   * @param createdAt Creation timestamp
   * @param updatedAt Update timestamp
   * @returns Builder instance for chaining
   */
  withTimestamps(createdAt: Date, updatedAt: Date): ExerciseBuilder;

  /**
   * Set exercise user ID
   * @param userId User ID
   * @returns Builder instance for chaining
   */
  withUserId(userId: string): ExerciseBuilder;

  /**
   * Build the exercise object
   * @returns Exercise object
   */
  build(): Exercise;
}

export interface UserBuilder {
  /**
   * Set user email
   * @param email User email
   * @returns Builder instance for chaining
   */
  withEmail(email: string): UserBuilder;

  /**
   * Set user as anonymous
   * @returns Builder instance for chaining
   */
  asAnonymous(): UserBuilder;

  /**
   * Set user ID
   * @param id User ID
   * @returns Builder instance for chaining
   */
  withId(id: string): UserBuilder;

  /**
   * Set user timestamps
   * @param createdAt Creation timestamp
   * @param lastSyncAt Last sync timestamp
   * @returns Builder instance for chaining
   */
  withTimestamps(createdAt: Date, lastSyncAt?: Date): UserBuilder;

  /**
   * Build the user account object
   * @returns User account object
   */
  build(): UserAccount;
}

export interface SyncDataBuilder {
  /**
   * Create sync data for an exercise
   * @param exercise Exercise to create sync data for
   * @returns Builder instance for chaining
   */
  forExercise(exercise: Exercise): SyncDataBuilder;

  /**
   * Set sync operation type
   * @param operation Operation type
   * @returns Builder instance for chaining
   */
  withOperation(operation: SyncOperationType): SyncDataBuilder;

  /**
   * Set sync status
   * @param status Sync status
   * @returns Builder instance for chaining
   */
  withStatus(status: SyncStatus): SyncDataBuilder;

  /**
   * Set retry count
   * @param attempts Number of retry attempts
   * @returns Builder instance for chaining
   */
  withRetryAttempts(attempts: number): SyncDataBuilder;

  /**
   * Add sync error
   * @param error Error message
   * @returns Builder instance for chaining
   */
  withError(error: string): SyncDataBuilder;

  /**
   * Build the sync state object
   * @returns Sync state object
   */
  build(): SyncState;
}

// Supporting Data Types

export interface TestInfrastructureConfig {
  /** Configuration for test devices */
  deviceConfig: TestDeviceConfig;

  /** Configuration for mock factories */
  mockConfig: MockFactoryConfig;

  /** Configuration for test data builders */
  builderConfig: TestDataBuilderConfig;

  /** Global test configuration */
  globalConfig: GlobalTestConfig;
}

export interface TestDeviceConfig {
  /** Default network status for new devices */
  defaultNetworkStatus: boolean;

  /** Default authentication state */
  defaultAuthState: TestAuthenticationState;

  /** Mock service configuration */
  mockServices: MockServiceConfig;

  /** Test data configuration */
  testDataConfig: TestDataConfig;
}

export interface TestAuthenticationState {
  /** Whether user is authenticated */
  authenticated: boolean;

  /** Current user account (if authenticated) */
  currentUser?: UserAccount;

  /** Authentication session information */
  session?: AuthSession;
}

export interface NetworkSimulationConfig {
  /** Simulated network latency in milliseconds */
  latencyMs: number;

  /** Probability of network failure (0-1) */
  failureRate: number;

  /** Whether to simulate intermittent connectivity */
  intermittentConnectivity: boolean;
}

export type SyncStatus = "pending" | "synced" | "error" | "retrying";

export type SyncOperationType = "create" | "update" | "delete";

export interface SyncOperation {
  /** Unique identifier for the operation */
  id: string;

  /** Type of operation */
  type: SyncOperationType;

  /** Target record ID */
  recordId: string;

  /** Record type */
  recordType: string;

  /** Operation data */
  data: any;

  /** Current status */
  status: SyncStatus;

  /** Number of retry attempts */
  retryCount: number;

  /** Last error (if any) */
  lastError?: string;

  /** When operation was created */
  createdAt: Date;

  /** When operation was last attempted */
  lastAttemptAt?: Date;
}

export interface SyncState {
  /** Record ID being synced */
  recordId: string;

  /** Type of record */
  recordType: string;

  /** Sync operation */
  operation: SyncOperationType;

  /** Current status */
  status: SyncStatus;

  /** Retry attempts */
  attempts: number;

  /** Last error message */
  lastError?: string;

  /** When sync was queued */
  pendingSince: Date;
}

export interface TestScenario {
  /** Scenario name */
  name: string;

  /** Description of the scenario */
  description: string;

  /** Devices required for scenario */
  devices: TestDeviceConfig[];

  /** Initial data setup */
  initialData: {
    exercises: Exercise[];
    users: UserAccount[];
  };

  /** Scenario steps */
  steps: ScenarioStep[];
}

export interface ScenarioStep {
  /** Step name */
  name: string;

  /** Description of the step */
  description: string;

  /** Device to perform step on */
  deviceName: string;

  /** Action to perform */
  action: ScenarioAction;

  /** Expected result */
  expectedResult: any;
}

export interface ScenarioAction {
  /** Type of action */
  type: ActionType;

  /** Action parameters */
  parameters: Record<string, any>;
}

export type ActionType =
  | "signUp"
  | "signIn"
  | "signOut"
  | "addExercise"
  | "updateExercise"
  | "deleteExercise"
  | "setNetworkStatus"
  | "waitForSync"
  | "waitFor";

export interface TestDeviceState {
  /** Device information */
  device: {
    id: string;
    name: string;
    initialized: boolean;
  };

  /** Network state */
  network: {
    online: boolean;
    simulatingIssues: boolean;
  };

  /** Authentication state */
  auth: TestAuthenticationState;

  /** Local data state */
  data: {
    exercises: Exercise[];
    pendingSyncOperations: SyncOperation[];
  };

  /** Sync state */
  sync: {
    inProgress: boolean;
    lastSyncAt?: Date;
    failedOperations: number;
  };
}

export interface AuthCredentials {
  /** User email */
  email: string;

  /** User password */
  password: string;
}

export interface AuthSession {
  /** Session ID */
  sessionId: string;

  /** User ID */
  userId: string;

  /** Session expiration */
  expiresAt: Date;

  /** Access token */
  accessToken: string;

  /** Refresh token */
  refreshToken?: string;
}

export type AuthErrorType =
  | "INVALID_EMAIL"
  | "WEAK_PASSWORD"
  | "USER_EXISTS"
  | "USER_NOT_FOUND"
  | "WRONG_PASSWORD"
  | "SESSION_EXPIRED"
  | "NETWORK_ERROR";

export interface AuthError {
  /** Error type */
  type: AuthErrorType;

  /** Error message */
  message: string;

  /** Error code */
  code: string;
}

export interface InfrastructureInitializationResult {
  /** Whether initialization was successful */
  success: boolean;

  /** Initialized components */
  initializedComponents: string[];

  /** Failed components */
  failedComponents: string[];

  /** Error messages for failed components */
  errors: Record<string, string>;

  /** Initialization timestamp */
  initializedAt: Date;
}

export interface InfrastructureValidationResult {
  /** Whether all requirements are met */
  valid: boolean;

  /** Available components */
  availableComponents: string[];

  /** Missing components */
  missingComponents: string[];

  /** Invalid components */
  invalidComponents: string[];

  /** Validation details */
  validationDetails: Record<string, ValidationDetail>;
}

export interface ValidationDetail {
  /** Component name */
  component: string;

  /** Whether component is valid */
  valid: boolean;

  /** Validation message */
  message: string;

  /** Additional details */
  details?: Record<string, any>;
}

// Missing type definitions

export interface FirebaseServiceMocks {
  /** Mock Firebase Auth */
  auth: any;

  /** Mock Firebase Firestore */
  firestore: any;

  /** Mock Firebase Functions */
  functions: any;
}

export interface SupabaseServiceMocks {
  /** Mock Supabase Auth */
  auth: any;

  /** Mock Supabase Database */
  database: any;

  /** Mock Supabase Storage */
  storage: any;
}

export interface ReactNativeModuleMocks {
  /** Mock AsyncStorage */
  asyncStorage: any;

  /** Mock navigation */
  navigation: any;

  /** Mock other modules */
  modules: Record<string, any>;
}

export interface GlobalTestConfig {
  /** Global timeout settings */
  timeouts: {
    default: number;
    async: number;
    setup: number;
    teardown: number;
  };

  /** Global test environment settings */
  environment: Record<string, string>;

  /** Global mock settings */
  mocks: {
    enabled: boolean;
    clearBetweenTests: boolean;
    resetBetweenTests: boolean;
  };
}

export interface MockServiceConfig {
  /** Firebase service mocking configuration */
  firebase: FirebaseMockConfig;

  /** Supabase service mocking configuration */
  supabase: SupabaseMockConfig;

  /** React Native module mocking configuration */
  reactNative: ReactNativeMockConfig;
}
