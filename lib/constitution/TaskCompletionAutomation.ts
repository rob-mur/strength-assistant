/**
 * Task Completion Automation Implementation
 * 
 * Implements automated task completion validation for Constitutional Amendment v2.6.0.
 * Provides automatic format validation, test expectation enforcement, and performance integration.
 * 
 * Automates the constitutional requirement that all task completions include proper validation.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface TaskCompletionTemplate {
  taskId: string;
  taskDescription: string;
  completionDate: string;
  testExpectationDeclaration: {
    expectedOutcome: 'PASS' | 'FAIL';
    reasoning: string;
    implementationChanges: string[];
    affectedTests: string[];
    performanceImplications: string[];
  };
  validationExecution: {
    command: string;
    preExecutionChecklist: {
      filesSaved: boolean;
      typescriptCompiled: boolean;
      noSyntaxErrors: boolean;
      memoryConstraintsRespected: boolean;
    };
    executionResults?: {
      exitCode: 0 | 1;
      executionTime: number;
      output: string;
      timestamp: Date;
    };
  };
  constitutionalCompliance: {
    amendmentVersion: string;
    binaryExitCodeValidation: boolean;
    testGovernanceCompliance: boolean;
    skipPatternViolations: string[];
    performanceCompliance: boolean;
  };
}

export interface ValidationResult {
  valid: boolean;
  templateCompliant: boolean;
  expectationValid: boolean;
  executionValid: boolean;
  constitutionalCompliant: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface AutomationConfig {
  enforceValidation: boolean;
  requireTestExecution: boolean;
  performanceThreshold: number; // seconds
  memoryLimit: number; // MB
  constitutionalChecks: {
    validateExpectations: boolean;
    enforceReasoningQuality: boolean;
    requirePerformanceAnalysis: boolean;
  };
}

export class TaskCompletionAutomationImpl {
  private readonly config: AutomationConfig = {
    enforceValidation: true,
    requireTestExecution: true,
    performanceThreshold: 60, // 60 seconds constitutional limit
    memoryLimit: 8192, // 8GB constitutional limit
    constitutionalChecks: {
      validateExpectations: true,
      enforceReasoningQuality: true,
      requirePerformanceAnalysis: true
    }
  };

  /**
   * Validates task completion template automatically
   */
  async validateTaskCompletion(template: TaskCompletionTemplate): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Template structure validation
    const templateValid = this.validateTemplateStructure(template, errors, warnings);
    
    // Test expectation validation
    const expectationValid = this.validateTestExpectation(template.testExpectationDeclaration, errors, warnings, suggestions);
    
    // Validation execution validation
    const executionValid = this.validateExecutionFormat(template.validationExecution, errors, warnings);
    
    // Constitutional compliance validation
    const constitutionalValid = this.validateConstitutionalCompliance(template.constitutionalCompliance, errors, warnings);

    const valid = templateValid && expectationValid && executionValid && constitutionalValid;

    return {
      valid,
      templateCompliant: templateValid,
      expectationValid,
      executionValid,
      constitutionalCompliant: constitutionalValid,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Automatically executes task completion validation
   */
  async executeAutomatedValidation(template: TaskCompletionTemplate): Promise<TaskCompletionTemplate> {
    // Pre-execution validation
    const preValidation = await this.validateTaskCompletion(template);
    
    if (!preValidation.valid) {
      throw new Error(`Constitutional violation: Task completion template invalid. Errors: ${preValidation.errors.join(', ')}`);
    }

    // Execute validation command automatically
    const executionStart = Date.now();
    let executionResults;

    try {
      console.log('🏛️ Constitutional Amendment v2.6.0: Executing automated validation...');
      console.log(`Command: ${template.validationExecution.command}`);

      const output = execSync(template.validationExecution.command, {
        encoding: 'utf8',
        timeout: this.config.performanceThreshold * 1000,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      const executionEnd = Date.now();
      const executionTime = (executionEnd - executionStart) / 1000;

      // Extract exit code from output
      const exitCodeMatch = output.match(/Exit code: (\d+)/);
      const exitCode = exitCodeMatch ? parseInt(exitCodeMatch[1], 10) as (0 | 1) : 0;

      executionResults = {
        exitCode,
        executionTime,
        output,
        timestamp: new Date()
      };

      console.log(`✅ Validation completed in ${executionTime.toFixed(2)}s with exit code ${exitCode}`);

    } catch (error: any) {
      const executionEnd = Date.now();
      const executionTime = (executionEnd - executionStart) / 1000;

      executionResults = {
        exitCode: 1 as const,
        executionTime,
        output: error.message || 'Execution failed',
        timestamp: new Date()
      };

      console.log(`❌ Validation failed after ${executionTime.toFixed(2)}s: ${error.message}`);
    }

    // Update template with execution results
    const updatedTemplate: TaskCompletionTemplate = {
      ...template,
      validationExecution: {
        ...template.validationExecution,
        executionResults
      }
    };

    // Post-execution validation
    await this.validateExecutionResults(updatedTemplate);

    return updatedTemplate;
  }

  /**
   * Generates automated task completion template
   */
  generateTaskCompletionTemplate(taskId: string, taskDescription: string, expectedOutcome: 'PASS' | 'FAIL', reasoning: string): TaskCompletionTemplate {
    const template: TaskCompletionTemplate = {
      taskId,
      taskDescription,
      completionDate: new Date().toISOString().split('T')[0],
      testExpectationDeclaration: {
        expectedOutcome,
        reasoning,
        implementationChanges: [],
        affectedTests: [],
        performanceImplications: []
      },
      validationExecution: {
        command: 'devbox run test; echo "Exit code: $?"',
        preExecutionChecklist: {
          filesSaved: true,
          typescriptCompiled: true,
          noSyntaxErrors: true,
          memoryConstraintsRespected: true
        }
      },
      constitutionalCompliance: {
        amendmentVersion: '2.6.0',
        binaryExitCodeValidation: true,
        testGovernanceCompliance: true,
        skipPatternViolations: [],
        performanceCompliance: true
      }
    };

    return template;
  }

  /**
   * Automatically enforces task completion format
   */
  async enforceTaskCompletionFormat(commitMessage?: string): Promise<{
    enforced: boolean;
    action: 'VALIDATE' | 'GENERATE' | 'BLOCK';
    template?: TaskCompletionTemplate;
    reason: string;
  }> {
    // Check if commit message contains task completion format
    if (commitMessage && this.containsTaskCompletionFormat(commitMessage)) {
      // Extract and validate existing format
      try {
        const template = this.extractTemplateFromCommit(commitMessage);
        const validation = await this.validateTaskCompletion(template);

        if (validation.valid) {
          return {
            enforced: true,
            action: 'VALIDATE',
            template,
            reason: 'Valid task completion format detected and validated'
          };
        } else {
          return {
            enforced: false,
            action: 'BLOCK',
            reason: `Invalid task completion format: ${validation.errors.join(', ')}`
          };
        }
      } catch (error: any) {
        return {
          enforced: false,
          action: 'BLOCK',
          reason: `Task completion format parsing failed: ${error.message}`
        };
      }
    }

    // Check if this appears to be a task completion (based on commit message patterns)
    if (commitMessage && this.appearsToBeTaskCompletion(commitMessage)) {
      return {
        enforced: false,
        action: 'GENERATE',
        reason: 'Task completion detected but missing proper format - generation required'
      };
    }

    return {
      enforced: true,
      action: 'VALIDATE',
      reason: 'Non-task-completion commit - no enforcement required'
    };
  }

  /**
   * Processes validation execution results automatically
   */
  async processExecutionResults(template: TaskCompletionTemplate): Promise<{
    predictionAccuracy: 'CORRECT' | 'INCORRECT';
    performanceCompliance: boolean;
    constitutionalViolations: string[];
    learningInsights: string[];
    nextActions: string[];
  }> {
    if (!template.validationExecution.executionResults) {
      throw new Error('No execution results available for processing');
    }

    const results = template.validationExecution.executionResults;
    const expectedOutcome = template.testExpectationDeclaration.expectedOutcome;
    
    // Determine actual outcome from exit code
    const actualOutcome: 'PASS' | 'FAIL' = results.exitCode === 0 ? 'PASS' : 'FAIL';
    
    // Check prediction accuracy
    const predictionAccuracy: 'CORRECT' | 'INCORRECT' = expectedOutcome === actualOutcome ? 'CORRECT' : 'INCORRECT';
    
    // Check performance compliance
    const performanceCompliance = results.executionTime <= this.config.performanceThreshold;
    
    // Identify constitutional violations
    const constitutionalViolations: string[] = [];
    
    if (results.exitCode !== 0 && results.exitCode !== 1) {
      constitutionalViolations.push('Non-binary exit code detected');
    }
    
    if (!performanceCompliance) {
      constitutionalViolations.push(`Execution time ${results.executionTime.toFixed(2)}s exceeds ${this.config.performanceThreshold}s limit`);
    }
    
    if (results.output.toLowerCase().includes('skip') && !template.constitutionalCompliance.skipPatternViolations.length) {
      constitutionalViolations.push('Skip patterns detected in test output');
    }

    // Generate learning insights
    const learningInsights: string[] = [];
    
    if (predictionAccuracy === 'INCORRECT') {
      if (expectedOutcome === 'PASS' && actualOutcome === 'FAIL') {
        learningInsights.push('Prediction was too optimistic - consider test complexity more thoroughly');
        learningInsights.push('Review implementation changes for potential breaking effects');
      } else {
        learningInsights.push('Prediction was too pessimistic - tests were more resilient than expected');
        learningInsights.push('Consider whether changes had less impact than anticipated');
      }
    } else {
      learningInsights.push('Prediction accuracy maintained - continue current prediction methodology');
    }

    // Generate next actions
    const nextActions: string[] = [];
    
    if (constitutionalViolations.length > 0) {
      nextActions.push('Fix constitutional violations before proceeding');
      nextActions.push('Review constitutional compliance requirements');
    }
    
    if (!performanceCompliance) {
      nextActions.push('Optimize test execution for constitutional performance requirements');
      nextActions.push('Consider implementing selective test execution');
    }
    
    if (predictionAccuracy === 'INCORRECT') {
      nextActions.push('Analyze prediction methodology for improvements');
      nextActions.push('Document lessons learned for future predictions');
    }

    return {
      predictionAccuracy,
      performanceCompliance,
      constitutionalViolations,
      learningInsights,
      nextActions
    };
  }

  /**
   * Integrates with performance metrics automatically
   */
  async integratePerformanceMetrics(template: TaskCompletionTemplate): Promise<{
    performanceScore: number;
    optimization: string[];
    constitutionalRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  }> {
    const results = template.validationExecution.executionResults;
    
    if (!results) {
      return {
        performanceScore: 0,
        optimization: ['Execute validation to collect performance metrics'],
        constitutionalRisk: 'HIGH'
      };
    }

    // Calculate performance score (0-100)
    let performanceScore = 100;
    
    if (results.executionTime > 60) {
      performanceScore -= Math.min(50, (results.executionTime - 60) * 2);
    }
    
    if (results.executionTime > 90) {
      performanceScore -= 30; // Severe penalty for CI timeout risk
    }

    // Generate optimization recommendations
    const optimization: string[] = [];
    
    if (results.executionTime > 45) {
      optimization.push('Consider implementing selective test execution');
      optimization.push('Optimize Jest configuration for faster execution');
    }
    
    if (results.executionTime > 60) {
      optimization.push('URGENT: Implement performance optimizations for constitutional compliance');
      optimization.push('Review test suite for performance bottlenecks');
    }
    
    if (results.output.includes('TIMEOUT') || results.output.includes('timeout')) {
      optimization.push('Investigate timeout issues in test execution');
    }

    // Assess constitutional risk
    let constitutionalRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    
    if (results.executionTime > 60) {
      constitutionalRisk = 'HIGH';
    } else if (results.executionTime > 45) {
      constitutionalRisk = 'MEDIUM';
    }

    return {
      performanceScore,
      optimization,
      constitutionalRisk
    };
  }

  // Private helper methods

  private validateTemplateStructure(template: TaskCompletionTemplate, errors: string[], warnings: string[]): boolean {
    let valid = true;

    if (!template.taskId || !template.taskId.match(/^T\d{3}$/)) {
      errors.push('Task ID must follow format T###');
      valid = false;
    }

    if (!template.taskDescription || template.taskDescription.length < 10) {
      errors.push('Task description must be at least 10 characters');
      valid = false;
    }

    if (!template.completionDate || !this.isValidDate(template.completionDate)) {
      errors.push('Completion date must be valid YYYY-MM-DD format');
      valid = false;
    }

    return valid;
  }

  private validateTestExpectation(expectation: TaskCompletionTemplate['testExpectationDeclaration'], errors: string[], warnings: string[], suggestions: string[]): boolean {
    let valid = true;

    if (!expectation.expectedOutcome || !['PASS', 'FAIL'].includes(expectation.expectedOutcome)) {
      errors.push('Test expectation must be PASS or FAIL');
      valid = false;
    }

    if (!expectation.reasoning || expectation.reasoning.length < 20) {
      errors.push('Test expectation reasoning must be at least 20 characters');
      valid = false;
    }

    // Quality checks for reasoning
    if (expectation.reasoning && this.config.constitutionalChecks.enforceReasoningQuality) {
      const qualityIndicators = [
        'implementation',
        'test',
        'performance',
        'breaking',
        'constitutional',
        'dependency',
        'integration'
      ];

      const indicatorCount = qualityIndicators.filter(indicator => 
        expectation.reasoning.toLowerCase().includes(indicator)
      ).length;

      if (indicatorCount < 2) {
        warnings.push('Reasoning quality could be improved - consider mentioning implementation impact, test dependencies, or performance implications');
      }

      if (expectation.reasoning.length < 50) {
        suggestions.push('Consider expanding reasoning with more detailed analysis');
      }
    }

    return valid;
  }

  private validateExecutionFormat(execution: TaskCompletionTemplate['validationExecution'], errors: string[], warnings: string[]): boolean {
    let valid = true;

    if (execution.command !== 'devbox run test; echo "Exit code: $?"') {
      errors.push('Validation command must be: devbox run test; echo "Exit code: $?"');
      valid = false;
    }

    const checklist = execution.preExecutionChecklist;
    const requiredChecks = ['filesSaved', 'typescriptCompiled', 'noSyntaxErrors', 'memoryConstraintsRespected'];
    
    for (const check of requiredChecks) {
      if (!checklist[check as keyof typeof checklist]) {
        warnings.push(`Pre-execution checklist item '${check}' should be verified`);
      }
    }

    return valid;
  }

  private validateConstitutionalCompliance(compliance: TaskCompletionTemplate['constitutionalCompliance'], errors: string[], warnings: string[]): boolean {
    let valid = true;

    if (compliance.amendmentVersion !== '2.6.0') {
      errors.push('Amendment version must be 2.6.0');
      valid = false;
    }

    if (compliance.skipPatternViolations.length > 0) {
      errors.push(`Skip pattern violations detected: ${compliance.skipPatternViolations.join(', ')}`);
      valid = false;
    }

    return valid;
  }

  private async validateExecutionResults(template: TaskCompletionTemplate): Promise<void> {
    const results = template.validationExecution.executionResults;
    
    if (!results) {
      throw new Error('No execution results to validate');
    }

    // Performance validation
    if (results.executionTime > this.config.performanceThreshold) {
      console.warn(`⚠️ Constitutional performance warning: ${results.executionTime.toFixed(2)}s exceeds ${this.config.performanceThreshold}s limit`);
    }

    // Exit code validation
    if (![0, 1].includes(results.exitCode)) {
      throw new Error(`Constitutional violation: Invalid exit code ${results.exitCode}. Must be 0 or 1.`);
    }
  }

  private containsTaskCompletionFormat(commitMessage: string): boolean {
    return commitMessage.includes('## Task Completion Validation (Amendment v2.6.0)');
  }

  private appearsToBeTaskCompletion(commitMessage: string): boolean {
    const taskPatterns = [
      /implement[s]?\s+T\d{3}/i,
      /complete[s]?\s+T\d{3}/i,
      /task\s+T\d{3}/i,
      /T\d{3}[:\s]/
    ];

    return taskPatterns.some(pattern => pattern.test(commitMessage));
  }

  private extractTemplateFromCommit(commitMessage: string): TaskCompletionTemplate {
    // This is a simplified extraction - in reality, would need robust parsing
    const taskIdMatch = commitMessage.match(/T(\d{3})/);
    const taskId = taskIdMatch ? `T${taskIdMatch[1]}` : 'T000';
    
    const expectedOutcomeMatch = commitMessage.match(/\*\*Expected Test Outcome\*\*:\s*(PASS|FAIL)/);
    const expectedOutcome = expectedOutcomeMatch ? expectedOutcomeMatch[1] as 'PASS' | 'FAIL' : 'PASS';
    
    const reasoningMatch = commitMessage.match(/\*\*Reasoning\*\*:\s*([^\n]+)/);
    const reasoning = reasoningMatch ? reasoningMatch[1] : 'Auto-extracted reasoning';

    return this.generateTaskCompletionTemplate(taskId, 'Auto-extracted task', expectedOutcome, reasoning);
  }

  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date.toISOString().startsWith(dateString);
  }
}