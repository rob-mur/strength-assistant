/**
 * TypeScript Validator Implementation
 * 
 * Implements the TypeScriptValidator interface for comprehensive
 * TypeScript compilation validation and constitutional compliance.
 */

import { spawn, SpawnOptions } from 'child_process';
import { join, resolve } from 'path';
import {
  TypeScriptValidator,
  TypeScriptValidationResult,
  TypeScriptError,
  TypeScriptWarning,
  ValidationStatistics,
  TypeScriptConfiguration,
  ConfigurationValidationResult,
  ConfigurationViolation
} from '../../specs/001-we-are-actually/contracts/typescript-validation';

export class TypeScriptValidatorImpl implements TypeScriptValidator {
  private projectRoot: string;
  private configPath: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = resolve(projectRoot);
    this.configPath = join(this.projectRoot, 'tsconfig.json');
  }

  async validateCompilation(): Promise<TypeScriptValidationResult> {
    const startTime = Date.now();
    const errors: TypeScriptError[] = [];
    const warnings: TypeScriptWarning[] = [];

    try {
      // Run TypeScript compiler in check mode
      const result = await this.runTypeScriptCompiler(['--noEmit']);
      
      if (result.exitCode !== 0 && result.stderr) {
        // Parse TypeScript compiler output
        const parsedErrors = this.parseTypeScriptOutput(result.stderr);
        errors.push(...parsedErrors.filter(e => e.severity === 'error') as TypeScriptError[]);
        warnings.push(...parsedErrors.filter(e => e.severity === 'warning') as TypeScriptWarning[]);
      }

      // Get file count for statistics
      const filesValidated = await this.countTypeScriptFiles();

      const statistics: ValidationStatistics = {
        filesValidated,
        errorCount: errors.length,
        warningCount: warnings.length,
        duration: Date.now() - startTime
      };

      return {
        success: errors.length === 0,
        errors,
        warnings,
        statistics
      };
    } catch (error) {
      // Handle validation process errors
      const validationError: TypeScriptError = {
        file: 'validation-process',
        line: 0,
        column: 0,
        message: `TypeScript validation failed: ${error}`,
        code: 'TS0000',
        severity: 'error'
      };

      return {
        success: false,
        errors: [validationError],
        warnings: [],
        statistics: {
          filesValidated: 0,
          errorCount: 1,
          warningCount: 0,
          duration: Date.now() - startTime
        }
      };
    }
  }

  async validateFiles(filePaths: string[]): Promise<TypeScriptValidationResult> {
    const startTime = Date.now();
    const errors: TypeScriptError[] = [];
    const warnings: TypeScriptWarning[] = [];

    try {
      // Run TypeScript compiler with specific files
      const args = ['--noEmit', ...filePaths];
      const result = await this.runTypeScriptCompiler(args);
      
      if (result.exitCode !== 0 && result.stderr) {
        const parsedErrors = this.parseTypeScriptOutput(result.stderr);
        errors.push(...parsedErrors.filter(e => e.severity === 'error') as TypeScriptError[]);
        warnings.push(...parsedErrors.filter(e => e.severity === 'warning') as TypeScriptWarning[]);
      }

      const statistics: ValidationStatistics = {
        filesValidated: filePaths.length,
        errorCount: errors.length,
        warningCount: warnings.length,
        duration: Date.now() - startTime
      };

      return {
        success: errors.length === 0,
        errors,
        warnings,
        statistics
      };
    } catch (error) {
      const validationError: TypeScriptError = {
        file: 'file-validation-process',
        line: 0,
        column: 0,
        message: `File validation failed: ${error}`,
        code: 'TS0000',
        severity: 'error'
      };

      return {
        success: false,
        errors: [validationError],
        warnings: [],
        statistics: {
          filesValidated: filePaths.length,
          errorCount: 1,
          warningCount: 0,
          duration: Date.now() - startTime
        }
      };
    }
  }

  getConfiguration(): TypeScriptConfiguration {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const configContent = require(this.configPath);
      return this.buildConfiguration(configContent);
    } catch {
      return this.getDefaultConfiguration();
    }
  }

  private buildConfiguration(configContent: Record<string, unknown>): TypeScriptConfiguration {
    const compilerOptions = configContent.compilerOptions as Record<string, unknown> || {};
    return {
      compilerOptions: {
        strict: compilerOptions.strict as boolean ?? false,
        noImplicitAny: compilerOptions.noImplicitAny as boolean ?? false,
        noImplicitReturns: compilerOptions.noImplicitReturns as boolean ?? false,
        skipLibCheck: compilerOptions.skipLibCheck as boolean ?? true,
        ...compilerOptions
      },
      include: configContent.include as string[] ?? [],
      exclude: configContent.exclude as string[] ?? []
    };
  }

  private getDefaultConfiguration(): TypeScriptConfiguration {
    return {
      compilerOptions: {
        strict: false,
        noImplicitAny: false,
        noImplicitReturns: false,
        skipLibCheck: true
      },
      include: [],
      exclude: []
    };
  }

  async validateConfiguration(): Promise<ConfigurationValidationResult> {
    const config = this.getConfiguration();
    const violations: ConfigurationViolation[] = [];
    const recommendations: string[] = [];

    // Check constitutional requirements
    if (!config.compilerOptions.strict) {
      violations.push({
        property: 'compilerOptions.strict',
        currentValue: config.compilerOptions.strict,
        requiredValue: true,
        reason: 'Constitutional requirement: TypeScript strict mode must be enabled'
      });
    }

    if (!config.compilerOptions.noImplicitAny) {
      violations.push({
        property: 'compilerOptions.noImplicitAny',
        currentValue: config.compilerOptions.noImplicitAny,
        requiredValue: true,
        reason: 'Constitutional requirement: No implicit any types allowed'
      });
    }

    if (!config.compilerOptions.noImplicitReturns) {
      violations.push({
        property: 'compilerOptions.noImplicitReturns',
        currentValue: config.compilerOptions.noImplicitReturns,
        requiredValue: true,
        reason: 'Constitutional requirement: All code paths must return values'
      });
    }

    // Check for recommendations
    if (config.compilerOptions.skipLibCheck) {
      recommendations.push('Consider setting skipLibCheck to false for thorough type checking');
    }

    if (!config.include.length) {
      recommendations.push('Specify include patterns to explicitly define files to compile');
    }

    return {
      compliant: violations.length === 0,
      violations,
      recommendations
    };
  }

  private async runTypeScriptCompiler(args: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const options: SpawnOptions = {
        cwd: this.projectRoot,
        stdio: ['pipe', 'pipe', 'pipe']
      };

      // Try to use local TypeScript first, fall back to global
      const tscCommand = 'npx';
      const tscArgs = ['tsc', ...args];

      const process = spawn(tscCommand, tscArgs, options);
      
      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (exitCode) => {
        resolve({
          exitCode: exitCode ?? 1,
          stdout,
          stderr
        });
      });

      process.on('error', (error) => {
        reject(new Error(`Failed to run TypeScript compiler: ${error.message}`));
      });

      // Set timeout for long-running compilations
      setTimeout(() => {
        process.kill();
        reject(new Error('TypeScript compilation timed out after 30 seconds'));
      }, 30000);
    });
  }

  private parseTypeScriptOutput(output: string): (TypeScriptError | TypeScriptWarning)[] {
    const errors: (TypeScriptError | TypeScriptWarning)[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      // Parse TypeScript error format: file(line,column): error TS#### message
      const match = line.match(/^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)$/);
      
      if (match) {
        const [, file, lineStr, columnStr, severity, code, message] = match;
        
        const error: TypeScriptError = {
          file: file.trim(),
          line: parseInt(lineStr, 10),
          column: parseInt(columnStr, 10),
          message: message.trim(),
          code: `TS${code}`,
          severity: severity as 'error' | 'warning'
        };

        if (severity === 'warning') {
          (error as TypeScriptWarning).ignorable = this.isIgnorableWarning(code);
        }

        errors.push(error);
      }
    }

    return errors;
  }

  private isIgnorableWarning(code: string): boolean {
    // Define which warning codes can be ignored
    const ignorableWarnings = ['7028', '6133']; // unused vars, etc.
    return ignorableWarnings.includes(code);
  }

  private async countTypeScriptFiles(): Promise<number> {
    try {
      // This is a simplified count - in practice, you'd use glob patterns
      // to match the include/exclude patterns from tsconfig
      const result = await this.runCommand('find', ['.', '-name', '*.ts', '-o', '-name', '*.tsx']);
      return result.stdout.split('\n').filter(line => line.trim()).length;
    } catch {
      return 0;
    }
  }

  private async runCommand(command: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { 
        cwd: this.projectRoot,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (exitCode) => {
        if (exitCode === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Command failed with exit code ${exitCode}: ${stderr}`));
        }
      });

      process.on('error', reject);
    });
  }
}

// Export singleton instance
export const typeScriptValidator = new TypeScriptValidatorImpl();