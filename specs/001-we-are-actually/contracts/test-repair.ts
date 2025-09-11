/**
 * Contract: Test Repair Interface
 * 
 * Defines interfaces for systematic test failure repair, tracking,
 * and prevention of test regressions for the 80 failing tests.
 */

import { InfrastructureValidationResult } from './test-infrastructure';

export interface TestRepairManager {
  /**
   * Catalogs all failing tests and creates repair tracking records
   * @returns Promise resolving to catalog results
   */
  catalogFailingTests(): Promise<TestCatalogResult>;
  
  /**
   * Triages failing tests by analyzing failure patterns and dependencies
   * @param testFailures Array of test failures to triage
   * @returns Promise resolving to triage results
   */
  triageTestFailures(testFailures: TestFailure[]): Promise<TestTriageResult>;
  
  /**
   * Creates a repair plan for systematic test fixing
   * @param triageResults Results from test triage
   * @returns Promise resolving to repair plan
   */
  createRepairPlan(triageResults: TestTriageResult): Promise<TestRepairPlan>;
  
  /**
   * Executes repair for a specific test
   * @param testId Unique identifier of the test to repair
   * @param repairStrategy Strategy to use for repair
   * @returns Promise resolving to repair execution results
   */
  executeTestRepair(testId: string, repairStrategy: TestRepairStrategy): Promise<RepairExecutionResult>;
  
  /**
   * Validates that a repaired test passes consistently
   * @param testId Unique identifier of the repaired test
   * @param validationConfig Configuration for validation
   * @returns Promise resolving to validation results
   */
  validateRepairedTest(testId: string, validationConfig: ValidationConfig): Promise<TestValidationResult>;
  
  /**
   * Tracks repair progress across all failing tests
   * @returns Promise resolving to progress tracking results
   */
  trackRepairProgress(): Promise<RepairProgressResult>;
  
  /**
   * Implements prevention mechanisms to avoid future test regressions
   * @param preventionConfig Configuration for prevention mechanisms
   * @returns Promise resolving to prevention implementation results
   */
  implementRegressionPrevention(preventionConfig: RegressionPreventionConfig): Promise<PreventionImplementationResult>;
}

export interface TestFailureAnalyzer {
  /**
   * Analyzes a test failure to determine root cause and repair strategy
   * @param testFailure Test failure to analyze
   * @returns Promise resolving to failure analysis
   */
  analyzeTestFailure(testFailure: TestFailure): Promise<TestFailureAnalysis>;
  
  /**
   * Identifies missing infrastructure components for a test
   * @param testFile Path to test file
   * @returns Promise resolving to infrastructure requirements
   */
  identifyMissingInfrastructure(testFile: string): Promise<InfrastructureRequirements>;
  
  /**
   * Analyzes test dependencies and blocking relationships
   * @param testFailures Array of test failures to analyze
   * @returns Promise resolving to dependency analysis
   */
  analyzeDependencies(testFailures: TestFailure[]): Promise<DependencyAnalysis>;
  
  /**
   * Estimates effort required to repair a test
   * @param testFailure Test failure to estimate
   * @param analysis Failure analysis results
   * @returns Promise resolving to effort estimation
   */
  estimateRepairEffort(testFailure: TestFailure, analysis: TestFailureAnalysis): Promise<EffortEstimation>;
  
  /**
   * Identifies similar failure patterns across tests
   * @param testFailures Array of test failures
   * @returns Promise resolving to pattern analysis
   */
  identifyFailurePatterns(testFailures: TestFailure[]): Promise<FailurePatternAnalysis>;
}

export interface TestRepairExecutor {
  /**
   * Implements missing test infrastructure components
   * @param requirements Infrastructure requirements
   * @returns Promise resolving to implementation results
   */
  implementMissingInfrastructure(requirements: InfrastructureRequirements): Promise<InfrastructureImplementationResult>;
  
  /**
   * Fixes Jest configuration issues
   * @param configIssues Configuration issues to fix
   * @returns Promise resolving to configuration fix results
   */
  fixJestConfiguration(configIssues: JestConfigurationIssue[]): Promise<ConfigurationFixResult>;
  
  /**
   * Creates or updates mock implementations
   * @param mockRequirements Mock requirements to implement
   * @returns Promise resolving to mock implementation results
   */
  implementMockServices(mockRequirements: MockRequirement[]): Promise<MockImplementationResult>;
  
  /**
   * Fixes TypeScript compilation errors in tests
   * @param typeScriptErrors TypeScript errors to fix
   * @returns Promise resolving to TypeScript fix results
   */
  fixTypeScriptErrors(typeScriptErrors: TypeScriptError[]): Promise<TypeScriptFixResult>;
  
  /**
   * Resolves module resolution issues
   * @param moduleIssues Module resolution issues to fix
   * @returns Promise resolving to module resolution fix results
   */
  fixModuleResolution(moduleIssues: ModuleResolutionIssue[]): Promise<ModuleResolutionFixResult>;
  
  /**
   * Updates test implementation to match expected behavior
   * @param testId Test to update
   * @param expectedBehavior Expected test behavior
   * @returns Promise resolving to test update results
   */
  updateTestImplementation(testId: string, expectedBehavior: TestBehaviorSpecification): Promise<TestUpdateResult>;
}

export interface RegressionPreventionManager {
  /**
   * Sets up pre-commit hooks to prevent test regressions
   * @param hookConfig Configuration for pre-commit hooks
   * @returns Promise resolving to hook setup results
   */
  setupPreCommitHooks(hookConfig: PreCommitHookConfig): Promise<HookSetupResult>;
  
  /**
   * Configures CI/CD pipeline to block failing tests
   * @param pipelineConfig Configuration for CI/CD integration
   * @returns Promise resolving to pipeline configuration results
   */
  configureCIPipeline(pipelineConfig: CIPipelineConfig): Promise<PipelineConfigurationResult>;
  
  /**
   * Implements test coverage monitoring and enforcement
   * @param coverageConfig Configuration for coverage monitoring
   * @returns Promise resolving to coverage monitoring setup results
   */
  setupCoverageMonitoring(coverageConfig: CoverageMonitoringConfig): Promise<CoverageMonitoringResult>;
  
  /**
   * Creates automated test regression detection
   * @param detectionConfig Configuration for regression detection
   * @returns Promise resolving to detection setup results
   */
  setupRegressionDetection(detectionConfig: RegressionDetectionConfig): Promise<RegressionDetectionResult>;
  
  /**
   * Implements constitutional test governance enforcement
   * @param governanceConfig Configuration for governance enforcement
   * @returns Promise resolving to governance setup results
   */
  enforceTestGovernance(governanceConfig: TestGovernanceConfig): Promise<GovernanceEnforcementResult>;
}

// Core Data Types

export interface TestCatalogResult {
  /** Total number of tests found */
  totalTests: number;
  
  /** Number of failing tests */
  failingTests: number;
  
  /** Number of passing tests */
  passingTests: number;
  
  /** Detailed test failure records */
  testFailures: TestFailure[];
  
  /** Catalog generation timestamp */
  catalogedAt: Date;
  
  /** Test execution environment details */
  environment: TestEnvironmentInfo;
}

export interface TestFailure {
  /** Unique identifier for this test failure */
  id: string;
  
  /** Test file path */
  testFile: string;
  
  /** Test name or description */
  testName: string;
  
  /** Jest test suite name */
  suiteName: string;
  
  /** Error message from test failure */
  errorMessage: string;
  
  /** Full error stack trace */
  stackTrace: string;
  
  /** Test execution duration before failure */
  executionTime: number;
  
  /** When the test was last run */
  lastRunAt: Date;
  
  /** Number of consecutive failures */
  consecutiveFailures: number;
  
  /** Test failure category */
  category: TestFailureCategory;
  
  /** Preliminary failure analysis */
  preliminaryAnalysis: PreliminaryAnalysis;
}

export interface PreliminaryAnalysis {
  /** Likely cause of failure */
  likelyCause: string;
  
  /** Missing dependencies identified */
  missingDependencies: string[];
  
  /** Configuration issues identified */
  configurationIssues: string[];
  
  /** TypeScript errors identified */
  typeScriptErrors: string[];
  
  /** Mock issues identified */
  mockIssues: string[];
}

export type TestFailureCategory = 
  | 'MISSING_INFRASTRUCTURE'
  | 'INCOMPLETE_IMPLEMENTATION'
  | 'MOCK_CONFIGURATION'
  | 'MODULE_RESOLUTION'
  | 'CONSTITUTIONAL_FRAMEWORK'
  | 'TYPE_SAFETY'
  | 'DEPENDENCY_CONFLICT'
  | 'TIMEOUT'
  | 'ASSERTION_FAILURE'
  | 'SETUP_TEARDOWN';

export interface TestTriageResult {
  /** Triaged test failures grouped by category */
  failuresByCategory: Record<TestFailureCategory, TestFailure[]>;
  
  /** Dependency graph showing test interdependencies */
  dependencyGraph: TestDependencyGraph;
  
  /** Prioritized repair order */
  repairOrder: TestRepairPriority[];
  
  /** Resource requirements for repairs */
  resourceRequirements: RepairResourceRequirements;
  
  /** Estimated timeline for complete repair */
  estimatedTimeline: RepairTimeline;
  
  /** Triage analysis timestamp */
  triagedAt: Date;
}

export interface TestDependencyGraph {
  /** Nodes representing individual tests */
  nodes: TestNode[];
  
  /** Edges representing dependencies between tests */
  edges: TestDependencyEdge[];
  
  /** Critical path for repair */
  criticalPath: string[];
  
  /** Parallel repair opportunities */
  parallelGroups: string[][];
}

export interface TestNode {
  /** Test ID */
  testId: string;
  
  /** Test failure details */
  failure: TestFailure;
  
  /** Dependencies this test has */
  dependencies: string[];
  
  /** Tests that depend on this test */
  dependents: string[];
  
  /** Whether this test blocks others */
  isBlocking: boolean;
  
  /** Repair priority level */
  priority: RepairPriority;
}

export interface TestDependencyEdge {
  /** Source test ID */
  from: string;
  
  /** Target test ID */
  to: string;
  
  /** Type of dependency */
  dependencyType: TestRepairDependencyType;
  
  /** Strength of dependency */
  strength: DependencyStrength;
}

export type TestRepairDependencyType = 
  | 'INFRASTRUCTURE'
  | 'MOCK_SERVICE'
  | 'TEST_UTILITY'
  | 'CONFIGURATION'
  | 'TYPE_DEFINITION';

export type DependencyStrength = 'weak' | 'medium' | 'strong' | 'critical';

export interface TestRepairPriority {
  /** Test ID */
  testId: string;
  
  /** Priority level */
  priority: RepairPriority;
  
  /** Justification for priority */
  justification: string;
  
  /** Estimated effort in hours */
  estimatedEffort: number;
  
  /** Prerequisites that must be completed first */
  prerequisites: string[];
  
  /** Tests that will be unblocked by fixing this test */
  unblocks: string[];
}

export type RepairPriority = 'critical' | 'high' | 'medium' | 'low';

export interface RepairResourceRequirements {
  /** Developer hours required */
  developerHours: number;
  
  /** Specialized skills required */
  requiredSkills: string[];
  
  /** External dependencies needed */
  externalDependencies: string[];
  
  /** Infrastructure components to implement */
  infrastructureComponents: string[];
  
  /** Documentation updates needed */
  documentationUpdates: string[];
}

export interface RepairTimeline {
  /** Estimated start date */
  estimatedStart: Date;
  
  /** Estimated completion date */
  estimatedCompletion: Date;
  
  /** Major milestones */
  milestones: RepairMilestone[];
  
  /** Risk factors that could affect timeline */
  riskFactors: string[];
  
  /** Confidence level in estimates */
  confidenceLevel: number;
}

export interface RepairMilestone {
  /** Milestone name */
  name: string;
  
  /** Milestone description */
  description: string;
  
  /** Target completion date */
  targetDate: Date;
  
  /** Tests to be completed by this milestone */
  testsIncluded: string[];
  
  /** Percentage of total repair effort */
  completionPercentage: number;
}

export interface TestRepairPlan {
  /** Overall repair strategy */
  strategy: TestRepairStrategy;
  
  /** Phases of the repair plan */
  phases: RepairPhase[];
  
  /** Resource allocation plan */
  resourceAllocation: ResourceAllocation;
  
  /** Risk mitigation strategies */
  riskMitigation: RiskMitigation[];
  
  /** Success criteria and metrics */
  successCriteria: SuccessCriteria;
  
  /** Plan creation timestamp */
  createdAt: Date;
}

export type TestRepairStrategy = 
  | 'INFRASTRUCTURE_FIRST'
  | 'PARALLEL_CATEGORIES'
  | 'CRITICAL_PATH'
  | 'INCREMENTAL_REPAIR'
  | 'BIG_BANG';

export interface RepairPhase {
  /** Phase number */
  phaseNumber: number;
  
  /** Phase name */
  name: string;
  
  /** Phase description */
  description: string;
  
  /** Tests to repair in this phase */
  testsInPhase: string[];
  
  /** Phase prerequisites */
  prerequisites: string[];
  
  /** Phase deliverables */
  deliverables: string[];
  
  /** Estimated duration */
  estimatedDuration: number;
  
  /** Success criteria for this phase */
  successCriteria: string[];
}

export interface ResourceAllocation {
  /** Developer assignments */
  developerAssignments: DeveloperAssignment[];
  
  /** Timeline allocation */
  timelineAllocation: TimeAllocation[];
  
  /** Infrastructure resource allocation */
  infrastructureAllocation: InfrastructureAllocation[];
}

export interface DeveloperAssignment {
  /** Developer identifier */
  developerId: string;
  
  /** Tests assigned to this developer */
  assignedTests: string[];
  
  /** Estimated hours for this developer */
  estimatedHours: number;
  
  /** Required skills for these assignments */
  requiredSkills: string[];
}

export interface TimeAllocation {
  /** Time period */
  period: string;
  
  /** Tests scheduled for this period */
  scheduledTests: string[];
  
  /** Available developer hours */
  availableHours: number;
  
  /** Allocated hours */
  allocatedHours: number;
}

export interface InfrastructureAllocation {
  /** Infrastructure component */
  component: string;
  
  /** When component is needed */
  neededBy: Date;
  
  /** Tests that depend on this component */
  dependentTests: string[];
  
  /** Implementation priority */
  priority: number;
}

export interface RiskMitigation {
  /** Risk description */
  risk: string;
  
  /** Risk probability (0-1) */
  probability: number;
  
  /** Risk impact severity */
  impact: RiskImpact;
  
  /** Mitigation strategies */
  mitigationStrategies: string[];
  
  /** Contingency plans */
  contingencyPlans: string[];
}

export type RiskImpact = 'low' | 'medium' | 'high' | 'critical';

export interface SuccessCriteria {
  /** Primary success metrics */
  primaryMetrics: SuccessMetric[];
  
  /** Secondary success metrics */
  secondaryMetrics: SuccessMetric[];
  
  /** Quality gates that must be met */
  qualityGates: QualityGate[];
  
  /** Acceptance criteria */
  acceptanceCriteria: string[];
}

export interface SuccessMetric {
  /** Metric name */
  name: string;
  
  /** Metric description */
  description: string;
  
  /** Target value */
  targetValue: number;
  
  /** Current value */
  currentValue: number;
  
  /** Measurement unit */
  unit: string;
  
  /** Whether higher is better */
  higherIsBetter: boolean;
}

export interface QualityGate {
  /** Gate name */
  name: string;
  
  /** Gate description */
  description: string;
  
  /** Criteria that must be met */
  criteria: string[];
  
  /** Whether gate is mandatory */
  mandatory: boolean;
}

export interface RepairExecutionResult {
  /** Whether repair was successful */
  success: boolean;
  
  /** Test ID that was repaired */
  testId: string;
  
  /** Repair strategy used */
  strategy: TestRepairStrategy;
  
  /** Actions taken during repair */
  actionsTaken: RepairAction[];
  
  /** Files modified during repair */
  filesModified: string[];
  
  /** Infrastructure components created */
  infrastructureCreated: string[];
  
  /** Test execution results after repair */
  testResults: TestExecutionResult;
  
  /** Repair execution timestamp */
  executedAt: Date;
  
  /** Time taken for repair */
  executionTime: number;
}

export interface RepairAction {
  /** Action type */
  type: RepairActionType;
  
  /** Action description */
  description: string;
  
  /** Target of the action */
  target: string;
  
  /** Action result */
  result: ActionResult;
  
  /** Any errors encountered */
  errors: string[];
}

export type RepairActionType = 
  | 'CREATE_INFRASTRUCTURE'
  | 'UPDATE_CONFIGURATION'
  | 'IMPLEMENT_MOCK'
  | 'FIX_TYPESCRIPT'
  | 'RESOLVE_DEPENDENCIES'
  | 'UPDATE_TEST';

export type ActionResult = 'success' | 'partial_success' | 'failed' | 'skipped';

export interface TestExecutionResult {
  /** Whether test passed */
  passed: boolean;
  
  /** Test execution time */
  executionTime: number;
  
  /** Test output */
  output: string;
  
  /** Error message (if failed) */
  errorMessage?: string;
  
  /** Number of assertions run */
  assertionCount: number;
  
  /** Number of passing assertions */
  passingAssertions: number;
  
  /** Coverage information */
  coverage?: CoverageInfo;
}

export interface CoverageInfo {
  /** Line coverage percentage */
  lines: number;
  
  /** Branch coverage percentage */
  branches: number;
  
  /** Function coverage percentage */
  functions: number;
  
  /** Statement coverage percentage */
  statements: number;
}

export interface TestValidationResult {
  /** Whether validation passed */
  valid: boolean;
  
  /** Test ID that was validated */
  testId: string;
  
  /** Number of validation runs */
  validationRuns: number;
  
  /** Number of successful runs */
  successfulRuns: number;
  
  /** Consistency percentage */
  consistencyPercentage: number;
  
  /** Validation execution results */
  executionResults: TestExecutionResult[];
  
  /** Performance metrics */
  performanceMetrics: PerformanceMetrics;
  
  /** Validation timestamp */
  validatedAt: Date;
}

export interface PerformanceMetrics {
  /** Average execution time */
  averageExecutionTime: number;
  
  /** Minimum execution time */
  minExecutionTime: number;
  
  /** Maximum execution time */
  maxExecutionTime: number;
  
  /** Execution time standard deviation */
  executionTimeStdDev: number;
  
  /** Memory usage statistics */
  memoryUsage: MemoryUsageStats;
}

export interface MemoryUsageStats {
  /** Average memory usage in MB */
  averageUsage: number;
  
  /** Peak memory usage in MB */
  peakUsage: number;
  
  /** Memory growth rate */
  growthRate: number;
}

export interface RepairProgressResult {
  /** Overall progress percentage */
  overallProgress: number;
  
  /** Progress by category */
  progressByCategory: Record<TestFailureCategory, CategoryProgress>;
  
  /** Progress by priority */
  progressByPriority: Record<RepairPriority, PriorityProgress>;
  
  /** Recent repair activities */
  recentActivities: RepairActivity[];
  
  /** Current blocking issues */
  blockingIssues: BlockingIssue[];
  
  /** Projected completion date */
  projectedCompletion: Date;
  
  /** Progress tracking timestamp */
  trackedAt: Date;
}

export interface CategoryProgress {
  /** Total tests in category */
  totalTests: number;
  
  /** Completed tests */
  completedTests: number;
  
  /** Tests in progress */
  inProgressTests: number;
  
  /** Tests not started */
  notStartedTests: number;
  
  /** Progress percentage */
  progressPercentage: number;
}

export interface PriorityProgress {
  /** Total tests at this priority */
  totalTests: number;
  
  /** Completed tests */
  completedTests: number;
  
  /** Tests in progress */
  inProgressTests: number;
  
  /** Progress percentage */
  progressPercentage: number;
}

export interface RepairActivity {
  /** Activity type */
  type: RepairActivityType;
  
  /** Test ID involved */
  testId: string;
  
  /** Activity description */
  description: string;
  
  /** Who performed the activity */
  performedBy: string;
  
  /** Activity timestamp */
  performedAt: Date;
  
  /** Activity result */
  result: string;
}

export type RepairActivityType = 
  | 'REPAIR_STARTED'
  | 'REPAIR_COMPLETED'
  | 'REPAIR_FAILED'
  | 'VALIDATION_PASSED'
  | 'VALIDATION_FAILED'
  | 'BLOCKED'
  | 'UNBLOCKED';

export interface BlockingIssue {
  /** Issue description */
  issue: string;
  
  /** Tests affected by this issue */
  affectedTests: string[];
  
  /** Issue severity */
  severity: IssueSeverity;
  
  /** When issue was identified */
  identifiedAt: Date;
  
  /** Possible resolutions */
  possibleResolutions: string[];
  
  /** Who is responsible for resolution */
  assignedTo?: string;
}

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ValidationConfig {
  /** Number of validation runs */
  validationRuns: number;
  
  /** Timeout for each run */
  timeoutMs: number;
  
  /** Whether to run in isolated environment */
  isolatedEnvironment: boolean;
  
  /** Performance thresholds */
  performanceThresholds: PerformanceThresholds;
  
  /** Coverage requirements */
  coverageRequirements: CoverageRequirements;
}

export interface PerformanceThresholds {
  /** Maximum acceptable execution time */
  maxExecutionTime: number;
  
  /** Maximum acceptable memory usage */
  maxMemoryUsage: number;
  
  /** Maximum acceptable execution time variance */
  maxExecutionTimeVariance: number;
}

export interface CoverageRequirements {
  /** Minimum line coverage */
  minLineCoverage: number;
  
  /** Minimum branch coverage */
  minBranchCoverage: number;
  
  /** Minimum function coverage */
  minFunctionCoverage: number;
  
  /** Minimum statement coverage */
  minStatementCoverage: number;
}

export interface RegressionPreventionConfig {
  /** Pre-commit hook configuration */
  preCommitHooks: PreCommitHookConfig;
  
  /** CI/CD pipeline configuration */
  ciPipeline: CIPipelineConfig;
  
  /** Coverage monitoring configuration */
  coverageMonitoring: CoverageMonitoringConfig;
  
  /** Regression detection configuration */
  regressionDetection: RegressionDetectionConfig;
  
  /** Test governance configuration */
  testGovernance: TestGovernanceConfig;
}

export interface PreCommitHookConfig {
  /** Whether to enable pre-commit hooks */
  enabled: boolean;
  
  /** Tests to run before commit */
  testsToRun: string[];
  
  /** Whether to block commit on test failure */
  blockOnFailure: boolean;
  
  /** Timeout for pre-commit tests */
  timeoutMs: number;
}

export interface CIPipelineConfig {
  /** CI platform (github, gitlab, etc.) */
  platform: string;
  
  /** Whether to run full test suite */
  runFullSuite: boolean;
  
  /** Whether to block deployment on test failure */
  blockDeployment: boolean;
  
  /** Notification configuration */
  notifications: NotificationConfig;
}

export interface NotificationConfig {
  /** Notification channels */
  channels: string[];
  
  /** Who to notify on failure */
  notifyOnFailure: string[];
  
  /** Who to notify on success */
  notifyOnSuccess: string[];
}

export interface CoverageMonitoringConfig {
  /** Whether to monitor coverage */
  enabled: boolean;
  
  /** Coverage thresholds */
  thresholds: CoverageRequirements;
  
  /** Whether to trend coverage over time */
  trackTrends: boolean;
  
  /** Reporting frequency */
  reportingFrequency: string;
}

export interface RegressionDetectionConfig {
  /** Whether to detect regressions automatically */
  enabled: boolean;
  
  /** Sensitivity for regression detection */
  sensitivity: number;
  
  /** Baseline for comparison */
  baseline: string;
  
  /** Actions to take on regression detection */
  onRegressionDetected: string[];
}

export interface TestGovernanceConfig {
  /** Constitutional requirements to enforce */
  constitutionalRequirements: string[];
  
  /** Governance policies */
  policies: GovernancePolicy[];
  
  /** Enforcement mechanisms */
  enforcementMechanisms: string[];
  
  /** Exemption process */
  exemptionProcess: ExemptionProcess;
}

export interface GovernancePolicy {
  /** Policy name */
  name: string;
  
  /** Policy description */
  description: string;
  
  /** Policy rules */
  rules: string[];
  
  /** Enforcement level */
  enforcementLevel: EnforcementLevel;
}

export type EnforcementLevel = 'advisory' | 'warning' | 'blocking';

export interface ExemptionProcess {
  /** Whether exemptions are allowed */
  exemptionsAllowed: boolean;
  
  /** Who can grant exemptions */
  exemptionAuthority: string[];
  
  /** Required justification for exemptions */
  justificationRequired: boolean;
  
  /** Maximum exemption duration */
  maxExemptionDuration: number;
}

export interface TestEnvironmentInfo {
  /** Node.js version */
  nodeVersion: string;
  
  /** Jest version */
  jestVersion: string;
  
  /** Operating system */
  operatingSystem: string;
  
  /** Available memory */
  availableMemory: number;
  
  /** Environment variables */
  environmentVariables: Record<string, string>;
}

// Missing type definitions from error report

export interface PreventionImplementationResult {
  /** Whether prevention was successfully implemented */
  implemented: boolean;
  
  /** Components that were successfully set up */
  successfulComponents: string[];
  
  /** Components that failed to set up */
  failedComponents: string[];
  
  /** Error details for failed components */
  errors: Record<string, string>;
  
  /** Implementation timestamp */
  implementedAt: Date;
}

export interface TestFailureAnalysis {
  /** Test failure details */
  failure: TestFailure;
  
  /** Root cause analysis */
  rootCause: string;
  
  /** Impact assessment */
  impact: ImpactAssessment;
  
  /** Suggested repair strategy */
  repairStrategy: RepairStrategy; // This is the detailed strategy interface, not the enum
  
  /** Analysis timestamp */
  analyzedAt: Date;
}

export interface ImpactAssessment {
  /** Severity of the failure impact */
  severity: IssueSeverity;
  
  /** Number of tests affected */
  testsAffected: number;
  
  /** Features affected */
  featuresAffected: string[];
  
  /** Business impact */
  businessImpact: string;
}

export interface RepairStrategy {
  /** Strategy type */
  type: RepairStrategyType;
  
  /** Estimated effort in hours */
  estimatedEffort: number;
  
  /** Required skills */
  requiredSkills: string[];
  
  /** Dependencies to resolve first */
  dependencies: string[];
  
  /** Step-by-step repair plan */
  steps: RepairStep[];
}

export type RepairStrategyType = 
  | 'INFRASTRUCTURE_SETUP'
  | 'MOCK_IMPLEMENTATION'
  | 'CONFIGURATION_FIX'
  | 'CODE_REFACTOR'
  | 'DEPENDENCY_UPDATE';

export interface RepairStep {
  /** Step number */
  step: number;
  
  /** Step description */
  description: string;
  
  /** Expected outcome */
  expectedOutcome: string;
  
  /** Validation method */
  validationMethod: string;
}

export interface InfrastructureRequirements {
  /** Required infrastructure components */
  components: InfrastructureComponent[];
  
  /** Configuration requirements */
  configuration: Record<string, any>;
  
  /** Dependencies between components */
  dependencies: ComponentDependency[];
  
  /** Performance requirements */
  performance: PerformanceRequirement[];
}

export interface InfrastructureComponent {
  /** Component name */
  name: string;
  
  /** Component type */
  type: ComponentType;
  
  /** Whether component is required */
  required: boolean;
  
  /** Component configuration */
  configuration: Record<string, any>;
}

export type ComponentType = 
  | 'MOCK_SERVICE'
  | 'TEST_DATABASE'
  | 'TEST_RUNNER'
  | 'COVERAGE_TOOL'
  | 'CI_INTEGRATION';

export interface ComponentDependency {
  /** Source component */
  from: string;
  
  /** Target component */
  to: string;
  
  /** Dependency type */
  type: ComponentDependencyType;
}

export type ComponentDependencyType = 'REQUIRES' | 'OPTIONALLY_USES' | 'CONFLICTS_WITH';

export interface PerformanceRequirement {
  /** Component name */
  component: string;
  
  /** Metric name */
  metric: string;
  
  /** Required value */
  requirement: number;
  
  /** Unit of measurement */
  unit: string;
}

export interface DependencyAnalysis {
  /** Analyzed dependencies */
  dependencies: TestDependency[];
  
  /** Circular dependencies found */
  circularDependencies: CircularDependency[];
  
  /** Missing dependencies */
  missingDependencies: string[];
  
  /** Dependency resolution order */
  resolutionOrder: string[];
}

export interface TestDependency {
  /** Source test */
  from: string;
  
  /** Target dependency */
  to: string;
  
  /** Dependency type */
  type: TestDependencyType;
  
  /** Whether dependency is critical */
  critical: boolean;
}

export type TestDependencyType = 'SETUP_REQUIRED' | 'DATA_DEPENDENCY' | 'MOCK_DEPENDENCY';

export interface CircularDependency {
  /** Tests involved in circular dependency */
  cycle: string[];
  
  /** Suggested resolution */
  resolution: string;
}

export interface EffortEstimation {
  /** Total estimated effort in hours */
  totalEffort: number;
  
  /** Effort by category */
  effortByCategory: Record<TestFailureCategory, number>;
  
  /** Effort by priority */
  effortByPriority: Record<RepairPriority, number>;
  
  /** Confidence level of estimation */
  confidenceLevel: number;
  
  /** Estimation method used */
  estimationMethod: string;
}

export interface FailurePatternAnalysis {
  /** Common patterns found */
  patterns: FailurePattern[];
  
  /** Pattern frequency */
  patternFrequency: Record<string, number>;
  
  /** Recommended systematic fixes */
  systematicFixes: SystematicFix[];
}

export interface FailurePattern {
  /** Pattern name */
  name: string;
  
  /** Pattern description */
  description: string;
  
  /** Tests matching this pattern */
  matchingTests: string[];
  
  /** Common root cause */
  rootCause: string;
  
  /** Suggested fix */
  suggestedFix: string;
}

export interface SystematicFix {
  /** Fix name */
  name: string;
  
  /** Fix description */
  description: string;
  
  /** Tests that would be fixed */
  applicableTests: string[];
  
  /** Implementation steps */
  implementationSteps: string[];
  
  /** Expected impact */
  expectedImpact: string;
}

export interface InfrastructureImplementationResult {
  /** Whether implementation was successful */
  successful: boolean;
  
  /** Implemented infrastructure components */
  implementedComponents: InfrastructureComponent[];
  
  /** Failed implementations */
  failedComponents: InfrastructureComponent[];
  
  /** Implementation errors */
  errors: Record<string, string>;
  
  /** Implementation timestamp */
  implementedAt: Date;
  
  /** Validation results */
  validationResults: InfrastructureValidationResult;
}

export interface JestConfigurationIssue {
  /** Configuration file path */
  configPath: string;
  
  /** Issue type */
  issueType: ConfigurationIssueType;
  
  /** Issue description */
  description: string;
  
  /** Current configuration value */
  currentValue: any;
  
  /** Recommended configuration value */
  recommendedValue: any;
  
  /** Impact of the issue */
  impact: string;
}

export type ConfigurationIssueType = 
  | 'MISSING_CONFIGURATION'
  | 'INCORRECT_VALUE'
  | 'DEPRECATED_OPTION'
  | 'PERFORMANCE_ISSUE';

export interface ConfigurationFixResult {
  /** Whether fix was successful */
  successful: boolean;
  
  /** Fixed configuration issues */
  fixedIssues: JestConfigurationIssue[];
  
  /** Issues that couldn't be fixed */
  unfixedIssues: JestConfigurationIssue[];
  
  /** Configuration backup path */
  backupPath: string;
  
  /** Fix timestamp */
  fixedAt: Date;
}

export interface MockRequirement {
  /** Service or module to mock */
  target: string;
  
  /** Mock type required */
  mockType: MockType;
  
  /** Mock implementation details */
  implementation: MockImplementation;
  
  /** Whether mock is critical for test */
  critical: boolean;
}

export type MockType = 
  | 'FULL_MOCK'
  | 'PARTIAL_MOCK'
  | 'SPY'
  | 'STUB';

export interface MockImplementation {
  /** Mock strategy */
  strategy: string;
  
  /** Mock configuration */
  configuration: Record<string, any>;
  
  /** Return values */
  returnValues: Record<string, any>;
  
  /** Behavior definitions */
  behaviors: Record<string, any>;
}

export interface MockImplementationResult {
  /** Whether implementation was successful */
  successful: boolean;
  
  /** Implemented mocks */
  implementedMocks: MockRequirement[];
  
  /** Failed mock implementations */
  failedMocks: MockRequirement[];
  
  /** Implementation errors */
  errors: Record<string, string>;
  
  /** Implementation timestamp */
  implementedAt: Date;
}

export interface TypeScriptError {
  /** File path */
  filePath: string;
  
  /** Line number */
  line: number;
  
  /** Column number */
  column: number;
  
  /** Error code */
  code: number;
  
  /** Error message */
  message: string;
  
  /** Error category */
  category: TypeScriptErrorCategory;
}

export type TypeScriptErrorCategory = 
  | 'SYNTAX_ERROR'
  | 'TYPE_ERROR'
  | 'IMPORT_ERROR'
  | 'CONFIGURATION_ERROR';

export interface TypeScriptFixResult {
  /** Whether fix was successful */
  successful: boolean;
  
  /** Fixed errors */
  fixedErrors: TypeScriptError[];
  
  /** Unfixed errors */
  unfixedErrors: TypeScriptError[];
  
  /** Fix strategies applied */
  appliedStrategies: string[];
  
  /** Fix timestamp */
  fixedAt: Date;
}

export interface ModuleResolutionIssue {
  /** Module name that couldn't be resolved */
  moduleName: string;
  
  /** File trying to import the module */
  importingFile: string;
  
  /** Issue type */
  issueType: ModuleResolutionIssueType;
  
  /** Suggested resolution */
  suggestedResolution: string;
  
  /** Available alternatives */
  alternatives: string[];
}

export type ModuleResolutionIssueType = 
  | 'MODULE_NOT_FOUND'
  | 'INCORRECT_PATH'
  | 'MISSING_TYPE_DEFINITIONS'
  | 'VERSION_CONFLICT';

export interface ModuleResolutionFixResult {
  /** Whether fix was successful */
  successful: boolean;
  
  /** Fixed issues */
  fixedIssues: ModuleResolutionIssue[];
  
  /** Unfixed issues */
  unfixedIssues: ModuleResolutionIssue[];
  
  /** Fix strategies applied */
  appliedStrategies: string[];
  
  /** Fix timestamp */
  fixedAt: Date;
}

export interface TestBehaviorSpecification {
  /** Expected behavior description */
  description: string;
  
  /** Input conditions */
  inputs: Record<string, any>;
  
  /** Expected outputs */
  expectedOutputs: Record<string, any>;
  
  /** Side effects */
  sideEffects: string[];
  
  /** Performance expectations */
  performance: PerformanceExpectation;
}

export interface PerformanceExpectation {
  /** Maximum execution time in ms */
  maxExecutionTime: number;
  
  /** Maximum memory usage in MB */
  maxMemoryUsage: number;
  
  /** Expected complexity */
  complexity: string;
}

export interface TestUpdateResult {
  /** Whether update was successful */
  successful: boolean;
  
  /** Updated tests */
  updatedTests: string[];
  
  /** Update errors */
  errors: Record<string, string>;
  
  /** Update timestamp */
  updatedAt: Date;
  
  /** Validation results */
  validationResults: ValidationResult;
}

export interface ValidationResult {
  /** Whether validation passed */
  passed: boolean;
  
  /** Validation errors */
  errors: string[];
  
  /** Validation warnings */
  warnings: string[];
  
  /** Performance metrics */
  performanceMetrics: PerformanceMetrics;
}

export interface HookSetupResult {
  /** Whether setup was successful */
  successful: boolean;
  
  /** Installed hooks */
  installedHooks: string[];
  
  /** Failed hooks */
  failedHooks: string[];
  
  /** Setup errors */
  errors: Record<string, string>;
  
  /** Setup timestamp */
  setupAt: Date;
}

export interface PipelineConfigurationResult {
  /** Whether configuration was successful */
  successful: boolean;
  
  /** Configured pipeline components */
  configuredComponents: string[];
  
  /** Failed components */
  failedComponents: string[];
  
  /** Configuration errors */
  errors: Record<string, string>;
  
  /** Configuration timestamp */
  configuredAt: Date;
}

export interface CoverageMonitoringResult {
  /** Whether monitoring was set up successfully */
  successful: boolean;
  
  /** Monitoring components */
  monitoringComponents: string[];
  
  /** Configuration details */
  configuration: CoverageMonitoringConfig;
  
  /** Setup errors */
  errors: Record<string, string>;
  
  /** Setup timestamp */
  setupAt: Date;
}

export interface RegressionDetectionResult {
  /** Whether detection was set up successfully */
  successful: boolean;
  
  /** Detection components */
  detectionComponents: string[];
  
  /** Configuration details */
  configuration: RegressionDetectionConfig;
  
  /** Setup errors */
  errors: Record<string, string>;
  
  /** Setup timestamp */
  setupAt: Date;
}

export interface GovernanceEnforcementResult {
  /** Whether enforcement was set up successfully */
  successful: boolean;
  
  /** Enforcement mechanisms */
  enforcementMechanisms: string[];
  
  /** Configuration details */
  configuration: TestGovernanceConfig;
  
  /** Setup errors */
  errors: Record<string, string>;
  
  /** Setup timestamp */
  setupAt: Date;
}