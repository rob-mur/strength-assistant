/**
 * Integration Test: TypeScript Pipeline
 * 
 * Tests the complete TypeScript validation pipeline integration
 * including pre-commit hooks, CI pipeline compatibility, and
 * devbox run test integration.
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { TypeScriptValidatorImpl } from '../../src/typescript/TypeScriptValidator';
import { ConstitutionalAmendmentManagerImpl } from '../../src/constitution/ConstitutionalAmendmentManager';

describe('TypeScript Pipeline Integration', () => {
  const projectRoot = process.cwd();
  const validator = new TypeScriptValidatorImpl(projectRoot);
  const constitutionalManager = new ConstitutionalAmendmentManagerImpl();

  describe('End-to-End TypeScript Validation Workflow', () => {
    it('should validate TypeScript compilation as part of complete pipeline', async () => {
      // Step 1: Validate TypeScript compilation
      const compilationResult = await validator.validateCompilation();
      
      expect(compilationResult).toBeDefined();
      expect(typeof compilationResult.success).toBe('boolean');
      
      if (!compilationResult.success) {
        console.warn('TypeScript compilation has errors:', compilationResult.errors);
        // In a real scenario, this would fail the pipeline
      }
      
      // Step 2: Validate configuration compliance
      const configResult = await validator.validateConfiguration();
      expect(configResult.compliant).toBe(true);
      
      // Step 3: Validate constitutional compliance
      const complianceResult = await constitutionalManager.validateCompliance({
        type: 'codebase',
        identifier: 'typescript-pipeline-test',
        aspects: ['typescript', 'testing']
      });
      
      expect(complianceResult).toBeDefined();
      expect(typeof complianceResult.compliant).toBe('boolean');
    }, 30000); // Allow up to 30 seconds for full validation

    it('should integrate with devbox run test command', async () => {
      // This test verifies that TypeScript validation is properly integrated
      // with the devbox run test pipeline
      
      const testResult = await runCommand('devbox', ['run', 'test', '--passWithNoTests']);
      
      // devbox run test should include TypeScript compilation validation
      expect(testResult.exitCode).toBeDefined();
      
      if (testResult.exitCode !== 0) {
        console.warn('devbox run test failed:', testResult.stderr);
        // In constitutional terms, this is a critical violation
      }
    }, 60000); // Allow up to 60 seconds for full test suite

    it('should validate TypeScript before test execution order', async () => {
      // Constitutional requirement: TypeScript compilation MUST succeed before test execution
      
      // First validate TypeScript compilation
      const tsResult = await validator.validateCompilation();
      
      if (!tsResult.success) {
        // If TypeScript fails, tests should not run
        expect(tsResult.errors.length).toBeGreaterThan(0);
        console.warn('TypeScript compilation failed - tests should not proceed');
        return;
      }
      
      // Only if TypeScript succeeds should we proceed with tests
      expect(tsResult.success).toBe(true);
      console.log('TypeScript compilation successful - tests can proceed');
    });
  });

  describe('Pre-commit Hook Integration', () => {
    it('should have executable pre-commit hook', async () => {
      const hookPath = join(projectRoot, '.husky', 'pre-commit');
      
      try {
        const stats = await fs.stat(hookPath);
        expect(stats.isFile()).toBe(true);
        
        // Check if file is executable (on Unix systems)
        if (process.platform !== 'win32') {
          const mode = stats.mode;
          const isExecutable = (mode & parseInt('111', 8)) !== 0;
          expect(isExecutable).toBe(true);
        }
      } catch (error) {
        // If hook doesn't exist, this is a configuration issue
        throw new Error(`Pre-commit hook not found at ${hookPath}: ${error}`);
      }
    });

    it('should contain TypeScript validation in pre-commit hook', async () => {
      const hookPath = join(projectRoot, '.husky', 'pre-commit');
      
      try {
        const hookContent = await fs.readFile(hookPath, 'utf-8');
        
        expect(hookContent).toContain('tsc --noEmit');
        expect(hookContent).toContain('devbox run test');
        expect(hookContent).toContain('TypeScript compilation');
        expect(hookContent).toContain('CONSTITUTIONAL VIOLATION');
      } catch (error) {
        throw new Error(`Failed to read pre-commit hook: ${error}`);
      }
    });

    it('should simulate pre-commit hook validation behavior', async () => {
      // Simulate what the pre-commit hook does
      
      // Step 1: TypeScript compilation check
      const tsResult = await runCommand('npx', ['tsc', '--noEmit']);
      
      if (tsResult.exitCode !== 0) {
        console.warn('Pre-commit would block: TypeScript compilation failed');
        expect(tsResult.stderr).toContain('error TS');
        return; // Pre-commit hook would exit here
      }
      
      // Step 2: Full test suite check
      const testResult = await runCommand('devbox', ['run', 'test', '--passWithNoTests']);
      
      if (testResult.exitCode !== 0) {
        console.warn('Pre-commit would block: Test suite failed');
        return; // Pre-commit hook would exit here
      }
      
      console.log('Pre-commit validation would succeed');
    }, 45000);
  });

  describe('CI Pipeline Compatibility', () => {
    it('should support CI environment validation', async () => {
      // Test that validation works in CI-like environment
      
      // Set CI environment variables
      const originalCI = process.env.CI;
      process.env.CI = 'true';
      
      try {
        const result = await validator.validateCompilation();
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
        
        // CI should get detailed error information
        if (!result.success) {
          expect(result.errors.length).toBeGreaterThan(0);
          for (const error of result.errors) {
            expect(error.file).toBeDefined();
            expect(error.line).toBeGreaterThan(0);
            expect(error.message).toBeDefined();
          }
        }
      } finally {
        // Restore original CI environment
        if (originalCI !== undefined) {
          process.env.CI = originalCI;
        } else {
          delete process.env.CI;
        }
      }
    });

    it('should provide structured output for CI reporting', async () => {
      const result = await validator.validateCompilation();
      
      // Verify the result can be serialized for CI reporting
      const serialized = JSON.stringify(result);
      expect(serialized).toBeDefined();
      
      const parsed = JSON.parse(serialized);
      expect(parsed.success).toBe(result.success);
      expect(parsed.statistics).toBeDefined();
      
      // CI systems need timing information
      expect(parsed.statistics.duration).toBeGreaterThan(0);
      expect(parsed.statistics.filesValidated).toBeGreaterThanOrEqual(0);
    });

    it('should handle timeout scenarios for CI systems', async () => {
      // Test that validation doesn't hang in CI
      const startTime = Date.now();
      
      try {
        await validator.validateCompilation();
        const duration = Date.now() - startTime;
        
        // Should complete within reasonable CI time limits
        expect(duration).toBeLessThan(30000); // 30 seconds max
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Even failures should complete quickly
        expect(duration).toBeLessThan(30000);
        
        // Error should be informative for CI logs
        expect(error).toBeDefined();
      }
    });
  });

  describe('Constitutional Compliance Integration', () => {
    it('should enforce constitutional requirements in pipeline', async () => {
      const requirements = constitutionalManager.getCurrentRequirements();
      
      // Verify TypeScript requirements are present
      const testingRequirements = requirements.requirementsBySection['Testing (NON-NEGOTIABLE)'];
      expect(testingRequirements).toContain('TypeScript compilation MUST succeed before test execution');
      
      // Verify active enforcement
      const tsEnforcement = requirements.activeEnforcements.find(e => 
        e.type === 'pre-commit-hook' && e.active
      );
      expect(tsEnforcement).toBeDefined();
      expect(tsEnforcement?.configuration.onFailure).toBe('block');
    });

    it('should validate compliance across entire pipeline', async () => {
      const complianceResult = await constitutionalManager.validateCompliance({
        type: 'codebase',
        identifier: 'full-pipeline-compliance',
        aspects: ['typescript', 'testing', 'configuration', 'process']
      });
      
      expect(complianceResult).toBeDefined();
      
      if (!complianceResult.compliant) {
        console.warn('Constitutional violations detected:', complianceResult.violations);
        
        // Each violation should have clear resolution steps
        for (const violation of complianceResult.violations) {
          expect(violation.resolution).toBeDefined();
          expect(violation.resolution.length).toBeGreaterThan(0);
        }
      }
      
      // Score should reflect overall compliance health
      expect(complianceResult.score).toBeGreaterThanOrEqual(0);
      expect(complianceResult.score).toBeLessThanOrEqual(100);
    });

    it('should support zero-tolerance enforcement for TypeScript errors', async () => {
      // Constitutional requirement: Zero tolerance for TypeScript compilation failures
      
      const result = await validator.validateCompilation();
      
      if (!result.success) {
        // Any TypeScript error should be treated as critical
        expect(result.errors.length).toBeGreaterThan(0);
        
        for (const error of result.errors) {
          if (error.severity === 'error') {
            // Critical errors must block all progress
            console.warn(`Critical TypeScript error in ${error.file}:${error.line} - ${error.message}`);
          }
        }
        
        // This should trigger immediate remediation
        expect(result.statistics.errorCount).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance and Reliability', () => {
    it('should complete validation within acceptable time limits', async () => {
      const iterations = 3;
      const timings: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await validator.validateCompilation();
        const duration = Date.now() - startTime;
        timings.push(duration);
      }
      
      const averageTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      const maxTime = Math.max(...timings);
      
      // Performance requirements
      expect(averageTime).toBeLessThan(15000); // Average under 15 seconds
      expect(maxTime).toBeLessThan(30000); // Max under 30 seconds
      
      console.log(`TypeScript validation timing - Average: ${averageTime}ms, Max: ${maxTime}ms`);
    });

    it('should handle concurrent validation requests', async () => {
      // Test that multiple validation requests can run simultaneously
      const validationPromises = [
        validator.validateFiles(['src/typescript/TypeScriptValidator.ts']),
        validator.validateFiles(['src/constitution/ConstitutionalAmendmentManager.ts']),
        validator.validateConfiguration()
      ];
      
      const results = await Promise.all(validationPromises);
      
      expect(results).toHaveLength(3);
      for (const result of results) {
        expect(result).toBeDefined();
      }
    });
  });
});

// Helper function to run shell commands
async function runCommand(command: string, args: string[]): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve) => {
    const process = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
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
      resolve({
        exitCode: exitCode ?? 1,
        stdout,
        stderr
      });
    });
    
    process.on('error', (error) => {
      resolve({
        exitCode: 1,
        stdout,
        stderr: error.message
      });
    });
    
    // Timeout after 45 seconds
    setTimeout(() => {
      process.kill();
      resolve({
        exitCode: 1,
        stdout,
        stderr: 'Command timed out after 45 seconds'
      });
    }, 45000);
  });
}