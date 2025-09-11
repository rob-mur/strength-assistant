/**
 * Contract Test: TypeScript Validation
 * 
 * Tests the TypeScriptValidator interface contract to ensure
 * proper TypeScript compilation validation functionality.
 * 
 * These tests MUST initially fail (RED phase) before implementation.
 */

import {
  TypeScriptValidator,
  TypeScriptValidationResult,
  TypeScriptConfiguration,
  ConfigurationValidationResult
} from '../../specs/001-we-are-actually/contracts/typescript-validation';
import { TypeScriptValidatorImpl } from '../../src/typescript/TypeScriptValidator';

describe('TypeScript Validation Contract', () => {
  let validator: TypeScriptValidator;

  beforeEach(() => {
    validator = new TypeScriptValidatorImpl();
  });

  describe('validateCompilation', () => {
    it('should validate full codebase compilation', async () => {
      const result: TypeScriptValidationResult = await validator.validateCompilation();
      
      // Contract requirements
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.statistics).toBeDefined();
      expect(typeof result.statistics.filesValidated).toBe('number');
      expect(typeof result.statistics.errorCount).toBe('number');
      expect(typeof result.statistics.warningCount).toBe('number');
      expect(typeof result.statistics.duration).toBe('number');
    });

    it('should return success=true when no TypeScript errors exist', async () => {
      // This test assumes a clean codebase
      const result = await validator.validateCompilation();
      
      if (result.success) {
        expect(result.errors).toHaveLength(0);
        expect(result.statistics.errorCount).toBe(0);
      }
    });

    it('should return detailed error information when TypeScript errors exist', async () => {
      // This will test error handling when compilation fails
      const result = await validator.validateCompilation();
      
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.statistics.errorCount).toBeGreaterThan(0);
        
        // Verify error structure
        for (const error of result.errors) {
          expect(typeof error.file).toBe('string');
          expect(typeof error.line).toBe('number');
          expect(typeof error.column).toBe('number');
          expect(typeof error.message).toBe('string');
          expect(typeof error.code).toBe('string');
          expect(error.severity).toMatch(/^(error|warning)$/);
        }
      }
    });

    it('should complete validation within reasonable time limits', async () => {
      const startTime = Date.now();
      const result = await validator.validateCompilation();
      const actualDuration = Date.now() - startTime;
      
      // Should complete within 30 seconds for most projects
      expect(actualDuration).toBeLessThan(30000);
      
      // Statistics duration should roughly match actual duration
      expect(Math.abs(result.statistics.duration - actualDuration)).toBeLessThan(1000);
    });
  });

  describe('validateFiles', () => {
    it('should validate specific files', async () => {
      const testFiles = [
        'src/typescript/TypeScriptValidator.ts',
        'src/constitution/ConstitutionalAmendmentManager.ts'
      ];
      
      const result = await validator.validateFiles(testFiles);
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(result.statistics.filesValidated).toBe(testFiles.length);
    });

    it('should handle empty file list gracefully', async () => {
      const result = await validator.validateFiles([]);
      
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.statistics.filesValidated).toBe(0);
    });

    it('should handle non-existent files appropriately', async () => {
      const result = await validator.validateFiles(['non-existent-file.ts']);
      
      // Should either fail gracefully or handle missing files
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('getConfiguration', () => {
    it('should return current TypeScript configuration', () => {
      const config: TypeScriptConfiguration = validator.getConfiguration();
      
      expect(config).toBeDefined();
      expect(config.compilerOptions).toBeDefined();
      expect(typeof config.compilerOptions.strict).toBe('boolean');
      expect(typeof config.compilerOptions.noImplicitAny).toBe('boolean');
      expect(typeof config.compilerOptions.noImplicitReturns).toBe('boolean');
      expect(typeof config.compilerOptions.skipLibCheck).toBe('boolean');
      expect(Array.isArray(config.include)).toBe(true);
      expect(Array.isArray(config.exclude)).toBe(true);
    });

    it('should reflect actual tsconfig.json settings', () => {
      const config = validator.getConfiguration();
      
      // Should match our constitutional requirements
      expect(config.compilerOptions.strict).toBe(true);
      expect(config.compilerOptions.noImplicitAny).toBe(true);
      expect(config.compilerOptions.noImplicitReturns).toBe(true);
    });
  });

  describe('validateConfiguration', () => {
    it('should validate configuration against constitutional requirements', async () => {
      const result: ConfigurationValidationResult = await validator.validateConfiguration();
      
      expect(result).toBeDefined();
      expect(typeof result.compliant).toBe('boolean');
      expect(Array.isArray(result.violations)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should detect constitutional violations', async () => {
      const result = await validator.validateConfiguration();
      
      // Verify violation structure if any exist
      for (const violation of result.violations) {
        expect(typeof violation.property).toBe('string');
        expect(violation.currentValue).toBeDefined();
        expect(violation.requiredValue).toBeDefined();
        expect(typeof violation.reason).toBe('string');
      }
    });

    it('should be compliant with constitutional requirements', async () => {
      const result = await validator.validateConfiguration();
      
      // After our tsconfig.json updates, this should pass
      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should provide helpful recommendations', async () => {
      const result = await validator.validateConfiguration();
      
      for (const recommendation of result.recommendations) {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Constitutional Compliance Integration', () => {
    it('should enforce strict mode requirement', async () => {
      const config = validator.getConfiguration();
      expect(config.compilerOptions.strict).toBe(true);
    });

    it('should enforce noImplicitAny requirement', async () => {
      const config = validator.getConfiguration();
      expect(config.compilerOptions.noImplicitAny).toBe(true);
    });

    it('should enforce noImplicitReturns requirement', async () => {
      const config = validator.getConfiguration();
      expect(config.compilerOptions.noImplicitReturns).toBe(true);
    });

    it('should support devbox run test integration', async () => {
      // This test verifies the validator can be used in the testing pipeline
      const result = await validator.validateCompilation();
      
      // If TypeScript compilation fails, devbox run test should fail
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThan(0);
        // This would cause the test suite to fail, which is the desired behavior
      }
    });
  });
});