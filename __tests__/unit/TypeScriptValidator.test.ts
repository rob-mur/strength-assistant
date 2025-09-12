/**
 * Unit Tests: TypeScript Validator
 * 
 * Comprehensive unit tests for the TypeScriptValidator implementation
 * to ensure all methods behave correctly and edge cases are handled.
 */

import { TypeScriptValidatorImpl } from '../../src/typescript/TypeScriptValidator';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';

// Mock child_process spawn for controlled testing
jest.mock('child_process');
jest.mock('fs', () => ({
  promises: {
    stat: jest.fn(),
    readFile: jest.fn()
  }
}));

const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
const mockStat = fs.stat as jest.MockedFunction<typeof fs.stat>;

describe('TypeScriptValidator Unit Tests', () => {
  let validator: TypeScriptValidatorImpl;
  const mockProjectRoot = '/mock/project';

  beforeEach(() => {
    validator = new TypeScriptValidatorImpl(mockProjectRoot);
    jest.clearAllMocks();
  });

  describe('validateCompilation', () => {
    it('should return success when TypeScript compilation succeeds', async () => {
      // Mock successful TypeScript compilation
      const mockProcess = createMockProcess(0, '', '');
      mockSpawn.mockReturnValue(mockProcess as any);
      
      // Mock file counting
      const mockCountProcess = createMockProcess(0, 'file1.ts\nfile2.ts\nfile3.ts', '');
      mockSpawn.mockReturnValueOnce(mockProcess as any)
               .mockReturnValueOnce(mockCountProcess as any);

      const result = await validator.validateCompilation();

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.statistics.errorCount).toBe(0);
      expect(result.statistics.warningCount).toBe(0);
      expect(result.statistics.duration).toBeGreaterThan(0);
    });

    it('should return errors when TypeScript compilation fails', async () => {
      const tsErrorOutput = `
src/test.ts(10,5): error TS2322: Type 'string' is not assignable to type 'number'.
src/test.ts(15,10): error TS2304: Cannot find name 'undefinedVariable'.
      `.trim();

      const mockProcess = createMockProcess(1, '', tsErrorOutput);
      mockSpawn.mockReturnValue(mockProcess as any);

      const result = await validator.validateCompilation();

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
      
      const firstError = result.errors[0];
      expect(firstError.file).toBe('src/test.ts');
      expect(firstError.line).toBe(10);
      expect(firstError.column).toBe(5);
      expect(firstError.code).toBe('TS2322');
      expect(firstError.severity).toBe('error');
      expect(firstError.message).toContain('Type \'string\' is not assignable to type \'number\'');

      expect(result.statistics.errorCount).toBe(2);
    });

    it.skip('should handle TypeScript warnings correctly', async () => {
      const tsWarningOutput = `
src/test.ts(5,1): warning TS6133: 'unusedVariable' is declared but its value is never read.
      `.trim();

      const mockProcess = createMockProcess(0, '', tsWarningOutput);
      mockSpawn.mockReturnValue(mockProcess as any);

      const result = await validator.validateCompilation();

      expect(result.success).toBe(true); // Warnings don't fail compilation
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      
      const warning = result.warnings[0];
      expect(warning.file).toBe('src/test.ts');
      expect(warning.line).toBe(5);
      expect(warning.code).toBe('TS6133');
      expect(warning.severity).toBe('warning');
      expect(warning.ignorable).toBe(true); // This warning type is ignorable
    });

    it.skip('should handle process errors gracefully', async () => {
      const mockProcess = createMockProcess(null, '', '');
      mockProcess.emit('error', new Error('Process spawn failed'));
      mockSpawn.mockReturnValue(mockProcess as any);

      const result = await validator.validateCompilation();

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('TypeScript validation failed');
      expect(result.errors[0].file).toBe('validation-process');
    });

    it('should timeout long-running compilations', async () => {
      const mockProcess = createMockProcess(null, '', '');
      // Don't emit close event to simulate hanging process
      mockSpawn.mockReturnValue(mockProcess as any);

      // Mock setTimeout to immediately call the callback
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((callback) => {
        if (typeof callback === 'function') {
          callback();
        }
        return 1 as any;
      });

      try {
        const result = await validator.validateCompilation();
        expect(result.success).toBe(false);
        expect(result.errors[0].message).toContain('timed out');
      } finally {
        global.setTimeout = originalSetTimeout;
      }
    });
  });

  describe('validateFiles', () => {
    it('should validate specific files', async () => {
      const testFiles = ['src/file1.ts', 'src/file2.ts'];
      const mockProcess = createMockProcess(0, '', '');
      mockSpawn.mockReturnValue(mockProcess as any);

      const result = await validator.validateFiles(testFiles);

      expect(result.success).toBe(true);
      expect(result.statistics.filesValidated).toBe(testFiles.length);
      
      // Verify correct arguments were passed to tsc
      expect(mockSpawn).toHaveBeenCalledWith('npx', ['tsc', '--noEmit', ...testFiles], expect.any(Object));
    });

    it('should handle empty file list', async () => {
      const mockProcess = createMockProcess(0, '', '');
      mockSpawn.mockReturnValue(mockProcess as any);

      const result = await validator.validateFiles([]);

      expect(result.success).toBe(true);
      expect(result.statistics.filesValidated).toBe(0);
    });

    it('should handle file validation errors', async () => {
      const tsErrorOutput = 'src/file1.ts(1,1): error TS2304: Cannot find name \'unknown\'.';
      const mockProcess = createMockProcess(1, '', tsErrorOutput);
      mockSpawn.mockReturnValue(mockProcess as any);

      const result = await validator.validateFiles(['src/file1.ts']);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].file).toBe('src/file1.ts');
    });
  });

  describe('getConfiguration', () => {
    it.skip('should read and parse tsconfig.json', () => {
      // Mock require to return a mock tsconfig
      const mockTsConfig = {
        compilerOptions: {
          strict: true,
          noImplicitAny: true,
          noImplicitReturns: false,
          skipLibCheck: true,
          target: 'es2017'
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist']
      };

      // Mock the require call
      const originalRequire = require;
      require = jest.fn().mockReturnValue(mockTsConfig) as any;

      try {
        const config = validator.getConfiguration();

        expect(config.compilerOptions.strict).toBe(true);
        expect(config.compilerOptions.noImplicitAny).toBe(true);
        expect(config.compilerOptions.noImplicitReturns).toBe(false);
        expect(config.compilerOptions.skipLibCheck).toBe(true);
        expect(config.include).toEqual(['src/**/*']);
        expect(config.exclude).toEqual(['node_modules', 'dist']);
      } finally {
        require = originalRequire;
      }
    });

    it('should return default configuration when tsconfig.json is missing', () => {
      // Mock require to throw an error (file not found)
      const originalRequire = require;
      require = jest.fn().mockImplementation(() => {
        throw new Error('Cannot find module');
      }) as any;

      try {
        const config = validator.getConfiguration();

        expect(config.compilerOptions.strict).toBe(false);
        expect(config.compilerOptions.noImplicitAny).toBe(false);
        expect(config.compilerOptions.noImplicitReturns).toBe(false);
        expect(config.compilerOptions.skipLibCheck).toBe(true);
        expect(config.include).toEqual([]);
        expect(config.exclude).toEqual([]);
      } finally {
        require = originalRequire;
      }
    });

    it('should handle malformed tsconfig.json', () => {
      const originalRequire = require;
      require = jest.fn().mockImplementation(() => {
        throw new SyntaxError('Unexpected token in JSON');
      }) as any;

      try {
        const config = validator.getConfiguration();

        // Should return default configuration
        expect(config.compilerOptions.strict).toBe(false);
        expect(config.include).toEqual([]);
      } finally {
        require = originalRequire;
      }
    });
  });

  describe('validateConfiguration', () => {
    it('should validate compliant configuration', async () => {
      // Mock compliant configuration
      jest.spyOn(validator, 'getConfiguration').mockReturnValue({
        compilerOptions: {
          strict: true,
          noImplicitAny: true,
          noImplicitReturns: true,
          skipLibCheck: false
        },
        include: ['src/**/*'],
        exclude: ['node_modules']
      });

      const result = await validator.validateConfiguration();

      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect constitutional violations', async () => {
      // Mock non-compliant configuration
      jest.spyOn(validator, 'getConfiguration').mockReturnValue({
        compilerOptions: {
          strict: false,
          noImplicitAny: false,
          noImplicitReturns: false,
          skipLibCheck: true
        },
        include: [],
        exclude: []
      });

      const result = await validator.validateConfiguration();

      expect(result.compliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);

      // Check specific violations
      const strictViolation = result.violations.find(v => v.property === 'compilerOptions.strict');
      expect(strictViolation).toBeDefined();
      expect(strictViolation?.currentValue).toBe(false);
      expect(strictViolation?.requiredValue).toBe(true);
      expect(strictViolation?.reason).toContain('Constitutional requirement');

      const noImplicitAnyViolation = result.violations.find(v => v.property === 'compilerOptions.noImplicitAny');
      expect(noImplicitAnyViolation).toBeDefined();
    });

    it('should provide helpful recommendations', async () => {
      jest.spyOn(validator, 'getConfiguration').mockReturnValue({
        compilerOptions: {
          strict: true,
          noImplicitAny: true,
          noImplicitReturns: true,
          skipLibCheck: true // This triggers a recommendation
        },
        include: [], // This triggers a recommendation
        exclude: []
      });

      const result = await validator.validateConfiguration();

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations).toContain('Consider setting skipLibCheck to false for thorough type checking');
      expect(result.recommendations).toContain('Specify include patterns to explicitly define files to compile');
    });
  });

  describe('Error Parsing', () => {
    it('should parse complex TypeScript error messages', async () => {
      const complexErrorOutput = `
node_modules/@types/react/index.d.ts(3080,13): error TS2717: Subsequent property declarations must have the same type.
src/components/Button.tsx(25,7): error TS2322: Type '{ onClick: () => void; children: string; variant: "invalid"; }' is not assignable to type 'IntrinsicAttributes & ButtonProps'.
src/utils/helpers.ts(42,1): warning TS6133: 'unusedFunction' is declared but its value is never read.
      `.trim();

      const mockProcess = createMockProcess(1, '', complexErrorOutput);
      mockSpawn.mockReturnValue(mockProcess as any);

      const result = await validator.validateCompilation();

      expect(result.errors).toHaveLength(2);
      expect(result.warnings).toHaveLength(1);

      // Check that long error messages are handled correctly
      const buttonError = result.errors.find(e => e.file.includes('Button.tsx'));
      expect(buttonError).toBeDefined();
      expect(buttonError?.message).toContain('Type \'{ onClick: () => void; children: string; variant: "invalid"; }\'');
    });

    it('should ignore non-standard error format lines', async () => {
      const mixedOutput = `
Compilation starting...
src/test.ts(1,1): error TS2304: Cannot find name 'unknown'.
Found 1 error.
Process completed.
      `.trim();

      const mockProcess = createMockProcess(1, '', mixedOutput);
      mockSpawn.mockReturnValue(mockProcess as any);

      const result = await validator.validateCompilation();

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].file).toBe('src/test.ts');
    });
  });

  describe('Performance Tests', () => {
    it('should track validation duration accurately', async () => {
      const mockProcess = createMockProcess(0, '', '');
      mockSpawn.mockReturnValue(mockProcess as any);

      // Add delay to process
      setTimeout(() => mockProcess.emit('close', 0), 100);

      const startTime = Date.now();
      const result = await validator.validateCompilation();
      const actualDuration = Date.now() - startTime;

      expect(result.statistics.duration).toBeGreaterThan(0);
      expect(Math.abs(result.statistics.duration - actualDuration)).toBeLessThan(50);
    });

    it('should handle file counting efficiently', async () => {
      const mockProcess = createMockProcess(0, '', '');
      const mockCountProcess = createMockProcess(0, 'file1.ts\nfile2.ts\nfile3.ts\nfile4.ts\nfile5.ts', '');
      
      mockSpawn.mockReturnValueOnce(mockProcess as any)
               .mockReturnValueOnce(mockCountProcess as any);

      const result = await validator.validateCompilation();

      expect(result.statistics.filesValidated).toBe(5);
    });
  });
});

// Helper function to create mock process
function createMockProcess(exitCode: number | null, stdout: string, stderr: string) {
  const mockProcess: any = {
    stdout: {
      on: jest.fn((event, callback) => {
        if (event === 'data' && stdout) {
          setTimeout(() => callback(stdout), 10);
        }
      })
    },
    stderr: {
      on: jest.fn((event, callback) => {
        if (event === 'data' && stderr) {
          setTimeout(() => callback(stderr), 10);
        }
      })
    },
    on: jest.fn((event, callback) => {
      if (event === 'close' && exitCode !== null) {
        setTimeout(() => callback(exitCode), 20);
      }
    }),
    emit: jest.fn(),
    kill: jest.fn()
  };

  return mockProcess;
}