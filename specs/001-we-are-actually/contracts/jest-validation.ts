/**
 * Contract: Jest Test Validation and Constitutional Compliance
 *
 * Defines interfaces for Jest test validation, test failure tracking,
 * and constitutional compliance for test governance.
 */

import { Exercise } from "../../../lib/models/Exercise";
import { UserAccount } from "../../../lib/models/UserAccount";

export interface JestTestValidator {
  /**
   * Validates that all tests pass constitutional requirements
   * @returns Promise resolving to validation results
   */
  validateTestSuite(): Promise<TestSuiteValidationResult>;

  /**
   * Validates individual test configuration and setup
   * @param testConfig Test configuration to validate
   * @returns Promise resolving to test configuration validation
   */
  validateTestConfiguration(
    testConfig: TestConfiguration,
  ): Promise<TestConfigValidationResult>;

  /**
   * Validates that test infrastructure dependencies exist
   * @param testFile Path to test file to validate
   * @returns Promise resolving to infrastructure validation result
   */
  validateTestInfrastructure(
    testFile: string,
  ): Promise<InfrastructureValidationResult>;

  /**
   * Validates constitutional compliance for test governance
   * @returns Promise resolving to constitutional compliance status
   */
  validateConstitutionalCompliance(): Promise<ConstitutionalComplianceResult>;
}

export interface TestFailureTracker {
  /**
   * Tracks a failing test and categorizes the failure
   * @param testFailure Details about the failing test
   * @returns Promise resolving to tracking information
   */
  trackFailure(testFailure: TestFailureDetails): Promise<TestFailureTracking>;

  /**
   * Updates the repair status of a tracked test failure
   * @param testId Unique identifier of the failing test
   * @param status New repair status
   * @param notes Optional notes about the status change
   * @returns Promise resolving to updated tracking information
   */
  updateRepairStatus(
    testId: string,
    status: RepairStatus,
    notes?: string,
  ): Promise<TestFailureTracking>;

  /**
   * Gets all test failures with optional filtering
   * @param filter Optional filter criteria
   * @returns Promise resolving to array of test failure tracking records
   */
  getTestFailures(filter?: TestFailureFilter): Promise<TestFailureTracking[]>;

  /**
   * Gets test failure statistics and metrics
   * @returns Promise resolving to failure statistics
   */
  getFailureStatistics(): Promise<TestFailureStatistics>;

  /**
   * Marks a test as repaired and validates the fix
   * @param testId Unique identifier of the failing test
   * @param validationResults Results from running the repaired test
   * @returns Promise resolving to repair completion status
   */
  markTestRepaired(
    testId: string,
    validationResults: TestValidationResults,
  ): Promise<RepairCompletionStatus>;
}

export interface TestInfrastructureProvider {
  /**
   * Provides test device simulation infrastructure
   * @param deviceConfig Configuration for the test device
   * @returns Promise resolving to test device instance
   */
  createTestDevice(deviceConfig: TestDeviceConfig): Promise<TestDevice>;

  /**
   * Provides mock factories for test data generation
   * @param mockConfig Configuration for mock factories
   * @returns Promise resolving to mock factory collection
   */
  createMockFactories(
    mockConfig: MockFactoryConfig,
  ): Promise<MockFactoryCollection>;

  /**
   * Provides test data builders for complex scenarios
   * @param builderConfig Configuration for test data builders
   * @returns Promise resolving to test data builder collection
   */
  createTestDataBuilders(
    builderConfig: TestDataBuilderConfig,
  ): Promise<TestDataBuilderCollection>;

  /**
   * Validates that all required test infrastructure is available
   * @param requirements List of required infrastructure components
   * @returns Promise resolving to infrastructure availability status
   */
  validateInfrastructureAvailability(
    requirements: string[],
  ): Promise<InfrastructureAvailabilityResult>;
}

export interface ConstitutionalTestGovernance {
  /**
   * Enforces constitutional test requirements
   * @param enforcementContext Context for enforcement (pre-commit, CI, etc.)
   * @returns Promise resolving to enforcement results
   */
  enforceTestRequirements(
    enforcementContext: EnforcementContext,
  ): Promise<EnforcementResult>;

  /**
   * Validates compliance with constitutional test governance
   * @param complianceScope Scope of compliance validation
   * @returns Promise resolving to compliance status
   */
  validateTestGovernanceCompliance(
    complianceScope: ComplianceScope,
  ): Promise<GovernanceComplianceResult>;

  /**
   * Reports test governance violations
   * @param violations Array of governance violations
   * @returns Promise resolving to violation reporting status
   */
  reportGovernanceViolations(
    violations: GovernanceViolation[],
  ): Promise<ViolationReportingResult>;

  /**
   * Gets current constitutional test requirements
   * @returns Current constitutional test requirements
   */
  getCurrentTestRequirements(): ConstitutionalTestRequirements;
}

// Core Data Types

export interface TestSuiteValidationResult {
  /** Overall validation status */
  valid: boolean;

  /** Total number of tests found */
  totalTests: number;

  /** Number of passing tests */
  passingTests: number;

  /** Number of failing tests */
  failingTests: number;

  /** Detailed validation issues */
  validationIssues: TestValidationIssue[];

  /** Constitutional compliance status */
  constitutionalCompliance: boolean;

  /** Validation timestamp */
  validatedAt: Date;

  /** Time taken for validation */
  validationDurationMs: number;
}

export interface TestValidationIssue {
  /** Type of validation issue */
  type: ValidationIssueType;

  /** Severity of the issue */
  severity: ValidationSeverity;

  /** Description of the issue */
  description: string;

  /** File path where issue was found */
  filePath: string;

  /** Line number (if applicable) */
  lineNumber?: number;

  /** Suggested resolution */
  suggestedResolution: string;
}

export type ValidationIssueType =
  | "MISSING_INFRASTRUCTURE"
  | "INCOMPLETE_MOCK"
  | "TYPE_ERROR"
  | "CONFIGURATION_ERROR"
  | "CONSTITUTIONAL_VIOLATION"
  | "DEPENDENCY_MISSING";

export type ValidationSeverity = "critical" | "major" | "minor" | "warning";

export interface TestConfiguration {
  /** Test file path */
  testFile: string;

  /** Required infrastructure components */
  requiredInfrastructure: string[];

  /** Mock configuration requirements */
  mockRequirements: MockRequirement[];

  /** Test environment configuration */
  environmentConfig: TestEnvironmentConfig;

  /** Constitutional compliance requirements */
  constitutionalRequirements: string[];
}

export interface TestConfigValidationResult {
  /** Whether configuration is valid */
  valid: boolean;

  /** Configuration validation issues */
  issues: TestValidationIssue[];

  /** Validated configuration */
  validatedConfig?: TestConfiguration;
}

export interface InfrastructureValidationResult {
  /** Whether all required infrastructure is available */
  available: boolean;

  /** Missing infrastructure components */
  missingComponents: string[];

  /** Available infrastructure components */
  availableComponents: string[];

  /** Infrastructure setup recommendations */
  recommendations: string[];
}

export interface ConstitutionalComplianceResult {
  /** Whether constitutional requirements are met */
  compliant: boolean;

  /** Constitutional violations found */
  violations: GovernanceViolation[];

  /** Compliance score (0-100) */
  score: number;

  /** Recommendations for compliance */
  recommendations: string[];
}

export interface TestValidationResults {
  /** Test execution status */
  passed: boolean;

  /** Test results summary */
  summary: TestSuiteValidationResult;

  /** Individual test results */
  testResults: TestResult[];
}

export interface TestResult {
  /** Test name */
  name: string;

  /** Test status */
  status: "passed" | "failed" | "skipped";

  /** Error message if failed */
  error?: string;

  /** Execution time in ms */
  duration: number;
}

export interface RepairCompletionStatus {
  /** Whether repair was successful */
  successful: boolean;

  /** Repair completion timestamp */
  completedAt: Date;

  /** Final test status */
  finalStatus: RepairAttemptResult;

  /** Validation results after repair */
  validationResults: TestValidationResults;
}

export interface MockFactoryConfig {
  /** Target service or module to mock */
  target: string;

  /** Mock factory type */
  type: "jest" | "sinon" | "custom";

  /** Configuration options */
  options: Record<string, any>;
}

export interface MockFactoryCollection {
  /** Available mock factories */
  factories: Record<string, MockFactory>;

  /** Factory configuration */
  config: MockFactoryConfig[];
}

export interface MockFactory {
  /** Create a mock instance */
  create(config?: any): any;

  /** Reset all mocks */
  reset(): void;

  /** Clear all mocks */
  clear(): void;
}

export interface TestDataBuilderConfig {
  /** Builder type */
  type: string;

  /** Builder configuration */
  config: Record<string, any>;

  /** Default values */
  defaults?: Record<string, any>;
}

export interface TestDataBuilderCollection {
  /** Available test data builders */
  builders: Record<string, TestDataBuilder>;

  /** Builder configuration */
  config: TestDataBuilderConfig[];
}

export interface TestDataBuilder {
  /** Build test data */
  build(overrides?: any): any;

  /** Build multiple instances */
  buildMany(count: number, overrides?: any): any[];
}

export interface InfrastructureAvailabilityResult {
  /** Whether all infrastructure is available */
  available: boolean;

  /** Available infrastructure components */
  availableComponents: string[];

  /** Missing infrastructure components */
  missingComponents: string[];

  /** Setup instructions for missing components */
  setupInstructions: Record<string, string>;
}

export interface ViolationReportingResult {
  /** Whether violations were reported successfully */
  reported: boolean;

  /** Number of violations reported */
  violationCount: number;

  /** Reporting timestamp */
  reportedAt: Date;

  /** Report reference ID */
  reportId: string;
}

export interface TestEnvironmentConfig {
  /** Environment variables */
  env: Record<string, string>;

  /** Setup scripts to run before tests */
  setupScripts: string[];

  /** Teardown scripts to run after tests */
  teardownScripts: string[];

  /** Timeout configuration */
  timeouts: {
    test: number;
    setup: number;
    teardown: number;
  };
}

export interface MockConfiguration {
  /** Mock implementation strategy */
  strategy: "stub" | "spy" | "mock";

  /** Mock behavior configuration */
  behavior: Record<string, any>;

  /** Return values for mock methods */
  returnValues: Record<string, any>;
}

export interface FirebaseMockConfig {
  /** Mock authentication service */
  auth: boolean;

  /** Mock Firestore service */
  firestore: boolean;

  /** Mock configuration */
  config: Record<string, any>;
}

export interface SupabaseMockConfig {
  /** Mock authentication service */
  auth: boolean;

  /** Mock database service */
  database: boolean;

  /** Mock configuration */
  config: Record<string, any>;
}

export interface ReactNativeMockConfig {
  /** Mock AsyncStorage */
  asyncStorage: boolean;

  /** Mock navigation */
  navigation: boolean;

  /** Mock configuration */
  config: Record<string, any>;
}

export interface MockRequirement {
  /** Service or module to mock */
  target: string;

  /** Type of mock required */
  mockType: MockType;

  /** Configuration for the mock */
  configuration: MockConfiguration;

  /** Whether mock is required for test to run */
  required: boolean;
}

export type MockType =
  | "COMPLETE_IMPLEMENTATION"
  | "PARTIAL_IMPLEMENTATION"
  | "BEHAVIOR_STUB"
  | "DATA_STUB";

export interface TestFailureDetails {
  /** Test file path */
  testFile: string;

  /** Test name or description */
  testName: string;

  /** Category of failure */
  failureCategory: TestFailureCategory;

  /** Specific error message */
  errorMessage: string;

  /** Stack trace (if available) */
  stackTrace?: string;

  /** Required infrastructure to fix */
  requiredInfrastructure: string[];

  /** Estimated effort to repair (hours) */
  estimatedEffort: number;

  /** Priority for repair */
  repairPriority: RepairPriority;
}

export interface TestFailureTracking {
  /** Unique identifier for this test failure */
  testId: string;

  /** Original failure details */
  failureDetails: TestFailureDetails;

  /** Current repair status */
  repairStatus: RepairStatus;

  /** Who is assigned to repair this test */
  assignedTo?: string;

  /** When the failure was first tracked */
  trackedAt: Date;

  /** When repair was last attempted */
  lastAttemptedAt?: Date;

  /** When the test was successfully repaired */
  repairedAt?: Date;

  /** Tests that are blocking this repair */
  blockedBy: string[];

  /** Tests that this test is blocking */
  blocking: string[];

  /** Repair attempt history */
  repairAttempts: RepairAttempt[];

  /** Notes and comments */
  notes: string[];
}

export interface RepairAttempt {
  /** When the repair was attempted */
  attemptedAt: Date;

  /** Who attempted the repair */
  attemptedBy: string;

  /** What was done in this attempt */
  description: string;

  /** Result of the repair attempt */
  result: RepairAttemptResult;

  /** Error details if attempt failed */
  errorDetails?: string;
}

export type RepairAttemptResult =
  | "SUCCESS"
  | "PARTIAL_SUCCESS"
  | "FAILED"
  | "BLOCKED";

export type TestFailureCategory =
  | "MISSING_INFRASTRUCTURE"
  | "INCOMPLETE_IMPLEMENTATION"
  | "MOCK_CONFIGURATION"
  | "MODULE_RESOLUTION"
  | "CONSTITUTIONAL_FRAMEWORK"
  | "TYPE_SAFETY"
  | "DEPENDENCY_CONFLICT";

export type RepairStatus =
  | "failed"
  | "triaged"
  | "assigned"
  | "in_progress"
  | "testing"
  | "completed"
  | "blocked";

export type RepairPriority = "critical" | "high" | "medium" | "low";

export interface TestFailureFilter {
  /** Filter by failure category */
  category?: TestFailureCategory;

  /** Filter by repair status */
  status?: RepairStatus;

  /** Filter by repair priority */
  priority?: RepairPriority;

  /** Filter by assigned developer */
  assignedTo?: string;

  /** Filter by test file pattern */
  testFilePattern?: string;
}

export interface TestFailureStatistics {
  /** Total number of failing tests */
  totalFailures: number;

  /** Failures by category */
  failuresByCategory: Record<TestFailureCategory, number>;

  /** Failures by status */
  failuresByStatus: Record<RepairStatus, number>;

  /** Failures by priority */
  failuresByPriority: Record<RepairPriority, number>;

  /** Average estimated effort for repairs */
  averageEstimatedEffort: number;

  /** Total estimated effort remaining */
  totalEstimatedEffort: number;

  /** Repair completion rate */
  completionRate: number;

  /** Statistics generation timestamp */
  generatedAt: Date;
}

export interface TestDevice {
  /** Unique identifier for this test device */
  deviceId: string;

  /** Human-readable device name */
  deviceName: string;

  /** Initialize the test device */
  init(): Promise<void>;

  /** Clean up the test device */
  cleanup(): Promise<void>;

  /** Set network connectivity status */
  setNetworkStatus(online: boolean): Promise<void>;

  /** Sign up a new user account */
  signUp(email: string, password: string): Promise<UserAccount>;

  /** Sign in with existing credentials */
  signIn(email: string, password: string): Promise<UserAccount>;

  /** Sign out all users */
  signOutAll(): Promise<void>;

  /** Add an exercise */
  addExercise(name: string): Promise<Exercise>;

  /** Update an exercise */
  updateExercise(id: string, name: string): Promise<Exercise>;

  /** Get all exercises */
  getExercises(): Promise<Exercise[]>;

  /** Get sync status for an exercise */
  getSyncStatus(exerciseId: string): Promise<string>;

  /** Wait for sync operations to complete */
  waitForSyncComplete(): Promise<void>;

  /** Subscribe to exercise changes */
  subscribeToExerciseChanges(
    callback: (exercises: Exercise[]) => void,
  ): () => void;

  /** Simulate network issues */
  simulateNetworkIssues(enabled: boolean): Promise<void>;

  /** Retry failed sync operations */
  retryFailedSyncs(): Promise<void>;

  /** Wait for a specified duration */
  waitFor(ms: number): Promise<void>;
}

export interface TestDeviceConfig {
  /** Name for the test device */
  deviceName: string;

  /** Initial network status */
  initialNetworkStatus: boolean;

  /** Mock service configuration */
  mockServices: MockServiceConfig;

  /** Test data configuration */
  testDataConfig: TestDataConfig;
}

export interface MockServiceConfig {
  /** Firebase mock configuration */
  firebase: FirebaseMockConfig;

  /** Supabase mock configuration */
  supabase: SupabaseMockConfig;

  /** React Native mock configuration */
  reactNative: ReactNativeMockConfig;
}

export interface TestDataConfig {
  /** Whether to use deterministic test data */
  deterministic: boolean;

  /** Seed for random data generation */
  randomSeed?: number;

  /** Pre-populated test data */
  prePopulatedData?: {
    exercises: Exercise[];
    users: UserAccount[];
  };
}

export interface ConstitutionalTestRequirements {
  /** All tests must pass before commits */
  allTestsMustPass: boolean;

  /** Minimum test coverage requirements */
  minimumCoverage: CoverageRequirements;

  /** Required test infrastructure */
  requiredInfrastructure: string[];

  /** Prohibited test practices */
  prohibitedPractices: string[];

  /** Enforcement mechanisms */
  enforcementMechanisms: string[];
}

export interface CoverageRequirements {
  /** Global coverage thresholds */
  global: CoverageThreshold;

  /** Per-module coverage requirements */
  perModule: Record<string, CoverageThreshold>;
}

export interface CoverageThreshold {
  /** Branch coverage percentage */
  branches: number;

  /** Function coverage percentage */
  functions: number;

  /** Line coverage percentage */
  lines: number;

  /** Statement coverage percentage */
  statements: number;
}

export interface EnforcementContext {
  /** Type of enforcement trigger */
  trigger: EnforcementTrigger;

  /** Scope of enforcement */
  scope: string[];

  /** Additional context data */
  contextData: Record<string, any>;
}

export type EnforcementTrigger =
  | "PRE_COMMIT"
  | "CI_PIPELINE"
  | "MANUAL_VALIDATION"
  | "SCHEDULED_CHECK";

export interface EnforcementResult {
  /** Whether enforcement passed */
  passed: boolean;

  /** Violations found during enforcement */
  violations: GovernanceViolation[];

  /** Actions taken by enforcement */
  actionsTaken: string[];

  /** Enforcement timestamp */
  enforcedAt: Date;
}

export interface GovernanceViolation {
  /** Type of governance violation */
  type: GovernanceViolationType;

  /** Severity of the violation */
  severity: ViolationSeverity;

  /** Description of the violation */
  description: string;

  /** Context where violation was found */
  context: string;

  /** Constitutional requirement that was violated */
  violatedRequirement: string;

  /** Suggested resolution */
  suggestedResolution: string;
}

export type GovernanceViolationType =
  | "FAILING_TESTS"
  | "INSUFFICIENT_COVERAGE"
  | "MISSING_INFRASTRUCTURE"
  | "PROHIBITED_PRACTICE"
  | "CONFIGURATION_VIOLATION";

export type ViolationSeverity = "critical" | "major" | "minor";

export interface ComplianceScope {
  /** Files or directories to check */
  targets: string[];

  /** Specific requirements to validate */
  requirements: string[];

  /** Whether to include dependency validation */
  includeDependencies: boolean;
}

export interface GovernanceComplianceResult {
  /** Overall compliance status */
  compliant: boolean;

  /** Compliance score (0-100) */
  score: number;

  /** Detailed compliance results */
  results: ComplianceCheckResult[];

  /** Recommendations for improvement */
  recommendations: string[];

  /** Compliance check timestamp */
  checkedAt: Date;
}

export interface ComplianceCheckResult {
  /** Requirement that was checked */
  requirement: string;

  /** Whether this requirement is met */
  compliant: boolean;

  /** Details about compliance status */
  details: string;

  /** Evidence supporting compliance status */
  evidence: string[];
}
