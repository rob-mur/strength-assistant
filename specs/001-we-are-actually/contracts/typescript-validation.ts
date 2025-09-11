/**
 * Contract: TypeScript Validation Interface
 * 
 * Defines the interface for TypeScript compilation validation
 * that ensures code quality and prevents compilation errors
 * from reaching the testing pipeline.
 */

export interface TypeScriptValidator {
  /**
   * Validates TypeScript compilation for all source files
   * @returns Promise resolving to validation results
   */
  validateCompilation(): Promise<TypeScriptValidationResult>;
  
  /**
   * Validates TypeScript compilation for specific files
   * @param filePaths Array of file paths to validate
   * @returns Promise resolving to validation results
   */
  validateFiles(filePaths: string[]): Promise<TypeScriptValidationResult>;
  
  /**
   * Gets current TypeScript configuration
   * @returns Current TypeScript configuration object
   */
  getConfiguration(): TypeScriptConfiguration;
  
  /**
   * Validates that configuration meets constitutional requirements
   * @returns Promise resolving to configuration validation results
   */
  validateConfiguration(): Promise<ConfigurationValidationResult>;
}

export interface TypeScriptValidationResult {
  /** Whether validation passed without errors */
  success: boolean;
  
  /** Array of compilation errors found */
  errors: TypeScriptError[];
  
  /** Array of warnings (non-blocking) */
  warnings: TypeScriptWarning[];
  
  /** Statistics about validation */
  statistics: ValidationStatistics;
}

export interface TypeScriptError {
  /** File path where error occurred */
  file: string;
  
  /** Line number of error */
  line: number;
  
  /** Column number of error */
  column: number;
  
  /** Error message */
  message: string;
  
  /** TypeScript error code */
  code: string;
  
  /** Severity level */
  severity: 'error' | 'warning';
}

export interface TypeScriptWarning extends TypeScriptError {
  /** Whether warning can be ignored */
  ignorable: boolean;
}

export interface ValidationStatistics {
  /** Number of files validated */
  filesValidated: number;
  
  /** Number of errors found */
  errorCount: number;
  
  /** Number of warnings found */
  warningCount: number;
  
  /** Validation duration in milliseconds */
  duration: number;
}

export interface TypeScriptConfiguration {
  /** Compiler options */
  compilerOptions: {
    strict: boolean;
    noImplicitAny: boolean;
    noImplicitReturns: boolean;
    skipLibCheck: boolean;
    [key: string]: any;
  };
  
  /** Files/patterns to include */
  include: string[];
  
  /** Files/patterns to exclude */
  exclude: string[];
}

export interface ConfigurationValidationResult {
  /** Whether configuration meets constitutional requirements */
  compliant: boolean;
  
  /** Required settings that are missing or incorrect */
  violations: ConfigurationViolation[];
  
  /** Recommended improvements */
  recommendations: string[];
}

export interface ConfigurationViolation {
  /** Configuration property that violates requirements */
  property: string;
  
  /** Current value */
  currentValue: any;
  
  /** Required value */
  requiredValue: any;
  
  /** Explanation of why this is required */
  reason: string;
}