/**
 * Contract: Error Migration Service
 * Defines the interface for systematically replacing empty catch blocks
 */

export interface EmptyCatchBlock {
  filePath: string;
  lineNumber: number;
  functionName?: string;
  contextOperation: string;
  errorType: 'Network' | 'Database' | 'Logic' | 'UI' | 'Authentication' | 'Storage';
  isTransient: boolean;
  currentHandling: 'empty' | 'comment-only' | 'minimal';
  suggestedAction: 'log-only' | 'log-and-retry' | 'log-and-fail' | 'log-and-fallback';
}

export interface MigrationPlan {
  totalEmptyCatchBlocks: number;
  blocksByFile: Map<string, EmptyCatchBlock[]>;
  blocksByErrorType: Map<string, EmptyCatchBlock[]>;
  priorityOrder: EmptyCatchBlock[];
}

export interface MigrationResult {
  blockId: string;
  filePath: string;
  lineNumber: number;
  migrationStatus: 'success' | 'failed' | 'skipped';
  errorMessage?: string;
  newCodeSnippet?: string;
}

export interface ErrorMigrationService {
  /**
   * Scan codebase for empty catch blocks
   * @param rootPath The root path to scan
   * @param filePatterns Array of file patterns to include (e.g., ['**\/*.ts', '**\/*.tsx'])
   * @param excludePatterns Array of patterns to exclude (e.g., ['node_modules/**'])
   * @returns Promise resolving to array of found empty catch blocks
   */
  scanForEmptyCatchBlocks(
    rootPath: string,
    filePatterns: string[],
    excludePatterns?: string[]
  ): Promise<EmptyCatchBlock[]>;

  /**
   * Analyze empty catch blocks and create migration plan
   * @param emptyCatchBlocks Array of found empty catch blocks
   * @returns Migration plan with prioritized order
   */
  createMigrationPlan(emptyCatchBlocks: EmptyCatchBlock[]): MigrationPlan;

  /**
   * Migrate a single empty catch block to proper error handling
   * @param block The empty catch block to migrate
   * @param loggingService Reference to logging service for generating appropriate code
   * @returns Promise resolving to migration result
   */
  migrateCatchBlock(
    block: EmptyCatchBlock,
    loggingService: any // Type reference to avoid circular dependency
  ): Promise<MigrationResult>;

  /**
   * Migrate all empty catch blocks according to the migration plan
   * @param plan The migration plan to execute
   * @param loggingService Reference to logging service
   * @returns Promise resolving to array of migration results
   */
  migrateAllCatchBlocks(
    plan: MigrationPlan,
    loggingService: any
  ): Promise<MigrationResult[]>;

  /**
   * Generate code snippet for replacing empty catch block
   * @param block The empty catch block to replace
   * @param operation The operation context for logging
   * @returns Generated TypeScript code snippet
   */
  generateReplacementCode(
    block: EmptyCatchBlock,
    operation: string
  ): string;

  /**
   * Validate that migration didn't break existing functionality
   * @param filePath Path to the file that was modified
   * @returns Promise resolving to validation result
   */
  validateMigration(filePath: string): Promise<{
    isValid: boolean;
    compilationErrors?: string[];
    testFailures?: string[];
  }>;
}

export interface CodeAnalysisService {
  /**
   * Extract context information from code around catch block
   * @param filePath Path to the file containing the catch block
   * @param lineNumber Line number of the catch block
   * @returns Context information for better error classification
   */
  extractCatchBlockContext(
    filePath: string,
    lineNumber: number
  ): Promise<{
    functionName?: string;
    operation: string;
    tryBlockCode: string;
    surroundingCode: string;
    imports: string[];
    errorType: 'Network' | 'Database' | 'Logic' | 'UI' | 'Authentication' | 'Storage';
    isTransient: boolean;
  }>;

  /**
   * Analyze try block to determine appropriate error handling strategy
   * @param tryBlockCode The code inside the try block
   * @param imports The imports in the file
   * @returns Recommended error handling strategy
   */
  analyzeTryBlock(
    tryBlockCode: string,
    imports: string[]
  ): {
    errorType: 'Network' | 'Database' | 'Logic' | 'UI' | 'Authentication' | 'Storage';
    isTransient: boolean;
    suggestedAction: 'log-only' | 'log-and-retry' | 'log-and-fail' | 'log-and-fallback';
    confidence: number; // 0-1 confidence score
  };

  /**
   * Generate appropriate recovery action for error type
   * @param errorType The type of error detected
   * @param operation The operation context
   * @returns Recommended recovery action configuration
   */
  generateRecoveryAction(
    errorType: 'Network' | 'Database' | 'Logic' | 'UI' | 'Authentication' | 'Storage',
    operation: string
  ): {
    actionType: 'Retry' | 'Fallback' | 'UserPrompt' | 'FailGracefully';
    retryCount?: number;
    retryDelay?: number;
    maxRetries?: number;
    userMessage?: string;
  };
}

/**
 * Migration priority levels for systematic replacement
 */
export enum MigrationPriority {
  Critical = 1,    // Storage operations, data persistence
  High = 2,        // Database operations, authentication
  Medium = 3,      // Network operations, UI interactions
  Low = 4,         // Debug operations, non-critical features
  Deferred = 5     // Test code, development utilities
}

/**
 * Template for generating replacement code
 */
export interface ReplacementTemplate {
  errorType: string;
  template: string;
  requiredImports: string[];
  contextVariables: string[];
}

/**
 * Configuration for migration process
 */
export interface MigrationConfig {
  dryRun: boolean;
  backupOriginalFiles: boolean;
  validateAfterMigration: boolean;
  priorityThreshold: MigrationPriority;
  excludeTestFiles: boolean;
  maxFilesPerBatch: number;
}