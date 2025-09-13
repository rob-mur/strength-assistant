/**
 * Selective Test Execution Implementation
 * 
 * Implements intelligent test selection for Constitutional Amendment v2.6.0 compliance.
 * Executes only affected tests based on dependency analysis and change detection.
 * 
 * Optimizes test execution to meet 60-second constitutional requirement while maintaining
 * comprehensive test coverage and constitutional compliance.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export interface TestSelectionCriteria {
  changedFiles: string[];
  testPatterns: string[];
  maxExecutionTime: number;
  priorityTests: string[];
  constitutionalRequirements: string[];
}

export interface TestDependency {
  testFile: string;
  dependencies: string[];
  imports: string[];
  components: string[];
  hooks: string[];
  utilities: string[];
  lastAnalyzed: Date;
}

export interface TestSelectionResult {
  selectedTests: string[];
  skippedTests: string[];
  totalTests: number;
  estimatedExecutionTime: number;
  selectionRationale: string[];
  constitutionalCompliance: boolean;
}

export interface TestExecutionPlan {
  phase1: string[]; // Critical/constitutional tests
  phase2: string[]; // Changed file tests
  phase3: string[]; // Related tests
  phase4: string[]; // Regression tests
  estimatedTime: {
    phase1: number;
    phase2: number;
    phase3: number;
    phase4: number;
    total: number;
  };
}

export class SelectiveTestExecutionImpl {
  private readonly testDir = '__tests__';
  private readonly sourceDir = 'lib';
  private readonly appDir = 'app';
  private readonly maxConstitutionalTime = 60; // seconds
  private testDependencies: Map<string, TestDependency> = new Map();

  /**
   * Selects tests to execute based on changed files and constitutional requirements
   */
  async selectTests(criteria: TestSelectionCriteria): Promise<TestSelectionResult> {
    // Always include constitutional tests
    const constitutionalTests = await this.getConstitutionalTests();
    
    // Analyze dependencies for all test files
    await this.analyzeTestDependencies();
    
    // Find affected tests based on changed files
    const affectedTests = await this.findAffectedTests(criteria.changedFiles);
    
    // Get priority tests
    const priorityTests = await this.resolvePriorityTests(criteria.priorityTests);
    
    // Combine and deduplicate
    const selectedTestsSet = new Set([
      ...constitutionalTests,
      ...affectedTests,
      ...priorityTests
    ]);

    const selectedTests = Array.from(selectedTestsSet);
    
    // Get all tests for comparison
    const allTests = await this.getAllTests();
    const skippedTests = allTests.filter(test => !selectedTestsSet.has(test));
    
    // Estimate execution time
    const estimatedExecutionTime = await this.estimateExecutionTime(selectedTests);
    
    // Generate selection rationale
    const selectionRationale = this.generateSelectionRationale(
      constitutionalTests,
      affectedTests,
      priorityTests,
      criteria.changedFiles
    );
    
    // Check constitutional compliance
    const constitutionalCompliance = this.validateConstitutionalCompliance(
      selectedTests,
      constitutionalTests,
      estimatedExecutionTime
    );

    return {
      selectedTests,
      skippedTests,
      totalTests: allTests.length,
      estimatedExecutionTime,
      selectionRationale,
      constitutionalCompliance
    };
  }

  /**
   * Creates an optimized test execution plan
   */
  async createExecutionPlan(selectedTests: string[]): Promise<TestExecutionPlan> {
    const constitutionalTests = await this.getConstitutionalTests();
    const contractTests = selectedTests.filter(test => test.includes('/contracts/'));
    const unitTests = selectedTests.filter(test => 
      !test.includes('/contracts/') && 
      !test.includes('/integration/') &&
      !constitutionalTests.includes(test)
    );
    const integrationTests = selectedTests.filter(test => test.includes('/integration/'));

    // Phase 1: Constitutional and contract tests (must pass)
    const phase1 = [...constitutionalTests, ...contractTests].filter(test => 
      selectedTests.includes(test)
    );

    // Phase 2: Unit tests for changed files
    const phase2 = unitTests;

    // Phase 3: Integration tests
    const phase3 = integrationTests;

    // Phase 4: Any remaining tests
    const phase4 = selectedTests.filter(test => 
      !phase1.includes(test) && 
      !phase2.includes(test) && 
      !phase3.includes(test)
    );

    // Estimate execution times
    const estimatedTime = {
      phase1: await this.estimateExecutionTime(phase1),
      phase2: await this.estimateExecutionTime(phase2),
      phase3: await this.estimateExecutionTime(phase3),
      phase4: await this.estimateExecutionTime(phase4),
      total: 0
    };

    estimatedTime.total = estimatedTime.phase1 + estimatedTime.phase2 + 
                         estimatedTime.phase3 + estimatedTime.phase4;

    return {
      phase1,
      phase2,
      phase3,
      phase4,
      estimatedTime
    };
  }

  /**
   * Analyzes dependencies for all test files
   */
  async analyzeTestDependencies(): Promise<void> {
    const testFiles = await this.getAllTests();
    
    for (const testFile of testFiles) {
      const dependency = await this.analyzeTestFile(testFile);
      this.testDependencies.set(testFile, dependency);
    }
  }

  /**
   * Analyzes a single test file for dependencies
   */
  async analyzeTestFile(testFile: string): Promise<TestDependency> {
    const fullPath = path.resolve(testFile);
    
    if (!fs.existsSync(fullPath)) {
      return {
        testFile,
        dependencies: [],
        imports: [],
        components: [],
        hooks: [],
        utilities: [],
        lastAnalyzed: new Date()
      };
    }

    const content = await fs.promises.readFile(fullPath, 'utf8');
    
    // Extract imports
    const imports = this.extractImports(content);
    
    // Categorize imports
    const components = imports.filter(imp => 
      imp.includes('/components/') || imp.match(/^[A-Z]/)
    );
    
    const hooks = imports.filter(imp => 
      imp.includes('/hooks/') || imp.startsWith('use')
    );
    
    const utilities = imports.filter(imp => 
      imp.includes('/utils/') || imp.includes('/lib/')
    );

    // Resolve file paths
    const dependencies = await this.resolveDependencyPaths([
      ...imports,
      ...components,
      ...hooks,
      ...utilities
    ]);

    return {
      testFile,
      dependencies,
      imports,
      components,
      hooks,
      utilities,
      lastAnalyzed: new Date()
    };
  }

  /**
   * Finds tests affected by changed files
   */
  async findAffectedTests(changedFiles: string[]): Promise<string[]> {
    const affectedTests = new Set<string>();

    for (const [testFile, dependency] of this.testDependencies) {
      // Check if test file directly imports any changed files
      const hasDirectDependency = dependency.dependencies.some(dep => 
        changedFiles.some(changed => 
          dep.includes(changed) || changed.includes(dep)
        )
      );

      if (hasDirectDependency) {
        affectedTests.add(testFile);
      }

      // Check for indirect dependencies (components, hooks, utilities)
      const hasIndirectDependency = [
        ...dependency.components,
        ...dependency.hooks,
        ...dependency.utilities
      ].some(dep => 
        changedFiles.some(changed => 
          this.isRelatedFile(dep, changed)
        )
      );

      if (hasIndirectDependency) {
        affectedTests.add(testFile);
      }
    }

    return Array.from(affectedTests);
  }

  /**
   * Gets all constitutional tests that must always run
   */
  async getConstitutionalTests(): Promise<string[]> {
    const constitutionalPatterns = [
      '**/*constitutional*',
      '**/*amendment*',
      '**/*compliance*',
      '**/contracts/**',
      '**/*typescript*validation*'
    ];

    const constitutionalTests: string[] = [];
    const allTests = await this.getAllTests();

    for (const test of allTests) {
      for (const pattern of constitutionalPatterns) {
        const regex = new RegExp(
          pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'),
          'i'
        );
        
        if (regex.test(test)) {
          constitutionalTests.push(test);
          break;
        }
      }
    }

    return constitutionalTests;
  }

  /**
   * Gets all test files in the project
   */
  async getAllTests(): Promise<string[]> {
    const testFiles: string[] = [];
    
    await this.collectTestFiles(this.testDir, testFiles);
    
    return testFiles.sort();
  }

  /**
   * Estimates execution time for selected tests
   */
  async estimateExecutionTime(tests: string[]): Promise<number> {
    if (tests.length === 0) return 0;

    // Base estimates per test type (in seconds)
    const estimates = {
      unit: 0.5,          // Simple unit tests
      component: 2.0,     // Component rendering tests
      integration: 5.0,   // Integration tests
      contract: 1.0,      // Contract tests
      constitutional: 3.0 // Constitutional compliance tests
    };

    let totalTime = 0;

    for (const test of tests) {
      if (test.includes('/integration/')) {
        totalTime += estimates.integration;
      } else if (test.includes('/contracts/')) {
        totalTime += estimates.contract;
      } else if (test.includes('constitutional') || test.includes('amendment')) {
        totalTime += estimates.constitutional;
      } else if (test.includes('/components/')) {
        totalTime += estimates.component;
      } else {
        totalTime += estimates.unit;
      }
    }

    // Add setup/teardown overhead
    const setupOverhead = Math.min(10, tests.length * 0.1);
    
    return totalTime + setupOverhead;
  }

  /**
   * Validates constitutional compliance of test selection
   */
  private validateConstitutionalCompliance(
    selectedTests: string[],
    constitutionalTests: string[],
    estimatedTime: number
  ): boolean {
    // Must include all constitutional tests
    const includesAllConstitutional = constitutionalTests.every(test => 
      selectedTests.includes(test)
    );

    // Must be within time limit
    const withinTimeLimit = estimatedTime <= this.maxConstitutionalTime;

    // Must include TypeScript validation
    const includesTypeScriptValidation = selectedTests.some(test => 
      test.includes('typescript') && test.includes('validation')
    );

    return includesAllConstitutional && withinTimeLimit && includesTypeScriptValidation;
  }

  /**
   * Generates selection rationale for transparency
   */
  private generateSelectionRationale(
    constitutionalTests: string[],
    affectedTests: string[],
    priorityTests: string[],
    changedFiles: string[]
  ): string[] {
    const rationale: string[] = [];

    rationale.push(`Constitutional Amendment v2.6.0 compliance: ${constitutionalTests.length} tests`);
    
    if (changedFiles.length > 0) {
      rationale.push(`Changed files impact: ${affectedTests.length} affected tests`);
      rationale.push(`Changed files: ${changedFiles.slice(0, 3).join(', ')}${changedFiles.length > 3 ? '...' : ''}`);
    }
    
    if (priorityTests.length > 0) {
      rationale.push(`Priority tests included: ${priorityTests.length} tests`);
    }

    rationale.push('Selection optimized for 60-second constitutional requirement');

    return rationale;
  }

  // Private helper methods

  private async collectTestFiles(dir: string, files: string[]): Promise<void> {
    if (!fs.existsSync(dir)) return;

    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.collectTestFiles(fullPath, files);
      } else if (this.isTestFile(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  private isTestFile(filename: string): boolean {
    return filename.match(/\.(test|spec)\.(ts|tsx|js|jsx)$/) !== null;
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    
    // Match import statements
    const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)?\s*from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // Match require statements
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  private async resolveDependencyPaths(imports: string[]): Promise<string[]> {
    const resolved: string[] = [];

    for (const imp of imports) {
      // Skip node_modules and relative paths that don't resolve to project files
      if (imp.startsWith('.') || !imp.startsWith('@/') && !imp.startsWith('/')) {
        continue;
      }

      // Resolve @/ alias
      let resolvedPath = imp.startsWith('@/') 
        ? imp.replace('@/', '') 
        : imp;

      // Check common extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
      let found = false;

      for (const ext of extensions) {
        const fullPath = `${resolvedPath}${ext}`;
        if (fs.existsSync(fullPath)) {
          resolved.push(fullPath);
          found = true;
          break;
        }
      }

      // Check for index files
      if (!found) {
        for (const ext of extensions) {
          const indexPath = path.join(resolvedPath, `index${ext}`);
          if (fs.existsSync(indexPath)) {
            resolved.push(indexPath);
            found = true;
            break;
          }
        }
      }

      if (!found && fs.existsSync(resolvedPath)) {
        resolved.push(resolvedPath);
      }
    }

    return resolved;
  }

  private isRelatedFile(dependency: string, changedFile: string): boolean {
    // Remove extensions for comparison
    const depBase = dependency.replace(/\.[^.]*$/, '');
    const changedBase = changedFile.replace(/\.[^.]*$/, '');

    // Direct match
    if (depBase === changedBase) return true;

    // Directory match (e.g., hooks/useAuth affects all useAuth files)
    const depParts = depBase.split('/');
    const changedParts = changedBase.split('/');

    // Check if they share common directory and base name
    if (depParts.length > 1 && changedParts.length > 1) {
      const depName = depParts[depParts.length - 1];
      const changedName = changedParts[changedParts.length - 1];
      
      if (depName === changedName) {
        return true;
      }
    }

    return false;
  }

  private async resolvePriorityTests(priorityPatterns: string[]): Promise<string[]> {
    if (priorityPatterns.length === 0) return [];

    const allTests = await this.getAllTests();
    const priorityTests: string[] = [];

    for (const pattern of priorityPatterns) {
      const regex = new RegExp(
        pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'),
        'i'
      );

      for (const test of allTests) {
        if (regex.test(test) && !priorityTests.includes(test)) {
          priorityTests.push(test);
        }
      }
    }

    return priorityTests;
  }
}