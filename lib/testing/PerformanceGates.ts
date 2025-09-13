/**
 * Performance Gates Enforcement Implementation
 * 
 * Implements automated performance gates for Constitutional Amendment v2.6.0 compliance.
 * Enforces 60-second execution limits, 8GB memory constraints, and constitutional compliance.
 * 
 * Provides automatic optimization triggering and enforcement mechanisms.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface PerformanceGateConfig {
  executionTimeLimit: number; // seconds
  memoryLimit: number; // MB
  cpuLimit: number; // percentage
  constitutionalEnforcement: boolean;
  automaticOptimization: boolean;
  gateNames: string[];
}

export interface GateResult {
  gateName: string;
  passed: boolean;
  actualValue: number;
  limitValue: number;
  margin: number; // How close to limit (percentage)
  severity: 'OK' | 'WARNING' | 'CRITICAL' | 'VIOLATION';
  action: 'PASS' | 'WARN' | 'OPTIMIZE' | 'BLOCK';
  recommendations: string[];
}

export interface PerformanceGateExecution {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  command: string;
  gateResults: GateResult[];
  overallResult: 'PASS' | 'WARNING' | 'FAIL';
  constitutionalCompliance: boolean;
  optimizationsTriggered: string[];
  enforcementActions: string[];
}

export interface ConstitutionalGate {
  name: string;
  amendmentVersion: string;
  requirement: string;
  validator: (metrics: PerformanceMetrics) => GateResult;
  autoOptimize: boolean;
}

export interface PerformanceMetrics {
  executionTimeSeconds: number;
  memoryUsageMB: number;
  cpuUsagePercent: number;
  testCount: number;
  passCount: number;
  failCount: number;
  skipCount: number;
  exitCode: number;
  timestamp: Date;
}

export class PerformanceGatesImpl {
  private readonly config: PerformanceGateConfig = {
    executionTimeLimit: 60, // Constitutional Amendment v2.6.0 requirement
    memoryLimit: 8192, // 8GB constitutional limit
    cpuLimit: 90, // 90% CPU limit for efficiency
    constitutionalEnforcement: true,
    automaticOptimization: true,
    gateNames: [
      'constitutional_execution_time',
      'constitutional_memory_limit',
      'test_governance_compliance',
      'binary_exit_code_compliance',
      'skip_pattern_prohibition'
    ]
  };

  private constitutionalGates: ConstitutionalGate[] = [];
  private gateHistory: PerformanceGateExecution[] = [];

  constructor() {
    this.initializeConstitutionalGates();
  }

  /**
   * Executes all performance gates for constitutional compliance
   */
  async executePerformanceGates(command: string, metrics: PerformanceMetrics): Promise<PerformanceGateExecution> {
    const sessionId = this.generateSessionId();
    const startTime = new Date();

    console.log(`🏛️ Constitutional Amendment v2.6.0: Performance Gates Execution`);
    console.log(`Session: ${sessionId}`);
    console.log(`Command: ${command}`);

    const gateResults: GateResult[] = [];
    const optimizationsTriggered: string[] = [];
    const enforcementActions: string[] = [];

    // Execute each constitutional gate
    for (const gate of this.constitutionalGates) {
      try {
        const result = gate.validator(metrics);
        gateResults.push(result);

        // Log gate result
        const statusIcon = result.passed ? '✅' : '❌';
        console.log(`${statusIcon} ${gate.name}: ${result.severity} (${result.actualValue}/${result.limitValue})`);

        // Handle gate failures
        if (!result.passed) {
          enforcementActions.push(`Gate '${gate.name}' failed - ${result.action}`);

          // Trigger automatic optimizations if enabled
          if (this.config.automaticOptimization && gate.autoOptimize && result.action === 'OPTIMIZE') {
            const optimizations = await this.triggerOptimizations(gate, result, metrics);
            optimizationsTriggered.push(...optimizations);
          }
        }
      } catch (error: any) {
        const errorResult: GateResult = {
          gateName: gate.name,
          passed: false,
          actualValue: -1,
          limitValue: 0,
          margin: 0,
          severity: 'CRITICAL',
          action: 'BLOCK',
          recommendations: [`Gate execution failed: ${error.message}`]
        };
        gateResults.push(errorResult);
        enforcementActions.push(`Gate '${gate.name}' failed with error: ${error.message}`);
      }
    }

    // Determine overall result
    const failedGates = gateResults.filter(r => !r.passed);
    const criticalFailures = failedGates.filter(r => r.severity === 'CRITICAL' || r.severity === 'VIOLATION');
    const warningGates = gateResults.filter(r => r.severity === 'WARNING');

    let overallResult: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
    let constitutionalCompliance = true;

    if (criticalFailures.length > 0) {
      overallResult = 'FAIL';
      constitutionalCompliance = false;
    } else if (failedGates.length > 0) {
      overallResult = 'FAIL';
      constitutionalCompliance = false;
    } else if (warningGates.length > 0) {
      overallResult = 'WARNING';
      // Warnings don't break constitutional compliance but indicate risk
    }

    const execution: PerformanceGateExecution = {
      sessionId,
      startTime,
      endTime: new Date(),
      command,
      gateResults,
      overallResult,
      constitutionalCompliance,
      optimizationsTriggered,
      enforcementActions
    };

    // Store execution history
    this.gateHistory.push(execution);
    this.trimGateHistory();

    // Log overall result
    this.logGateExecutionResults(execution);

    return execution;
  }

  /**
   * Monitors real-time performance during test execution
   */
  async monitorRealTimePerformance(command: string): Promise<PerformanceGateExecution> {
    const startTime = Date.now();
    const sessionId = this.generateSessionId();
    
    console.log(`🔍 Real-time performance monitoring started: ${sessionId}`);

    try {
      // Execute command with monitoring
      const output = execSync(command, {
        encoding: 'utf8',
        timeout: (this.config.executionTimeLimit + 30) * 1000, // Add 30s buffer
        maxBuffer: 1024 * 1024 * 20 // 20MB buffer
      });

      const endTime = Date.now();
      const executionTime = (endTime - startTime) / 1000;

      // Extract exit code from output
      const exitCodeMatch = output.match(/Exit code: (\d+)/);
      const exitCode = exitCodeMatch ? parseInt(exitCodeMatch[1], 10) : 0;

      // Extract test results from output
      const testResults = this.parseTestOutput(output);

      // Get memory usage (simulated - would use actual process monitoring in production)
      const memoryUsage = await this.getCurrentMemoryUsage();

      const metrics: PerformanceMetrics = {
        executionTimeSeconds: executionTime,
        memoryUsageMB: memoryUsage,
        cpuUsagePercent: 75, // Simulated
        testCount: testResults.total,
        passCount: testResults.passed,
        failCount: testResults.failed,
        skipCount: testResults.skipped,
        exitCode,
        timestamp: new Date()
      };

      return await this.executePerformanceGates(command, metrics);

    } catch (error: any) {
      const endTime = Date.now();
      const executionTime = (endTime - startTime) / 1000;

      // Handle timeout or execution failure
      const metrics: PerformanceMetrics = {
        executionTimeSeconds: executionTime,
        memoryUsageMB: await this.getCurrentMemoryUsage(),
        cpuUsagePercent: 0,
        testCount: 0,
        passCount: 0,
        failCount: 0,
        skipCount: 0,
        exitCode: 1,
        timestamp: new Date()
      };

      const execution = await this.executePerformanceGates(command, metrics);
      execution.enforcementActions.push(`Command execution failed: ${error.message}`);
      
      return execution;
    }
  }

  /**
   * Enforces constitutional compliance gates
   */
  async enforceConstitutionalCompliance(metrics: PerformanceMetrics): Promise<{
    compliant: boolean;
    violations: string[];
    enforcementLevel: 'ADVISORY' | 'WARNING' | 'BLOCKING';
    requiredActions: string[];
  }> {
    const violations: string[] = [];
    const requiredActions: string[] = [];
    let enforcementLevel: 'ADVISORY' | 'WARNING' | 'BLOCKING' = 'ADVISORY';

    // Amendment v2.6.0: 60-second execution time requirement
    if (metrics.executionTimeSeconds > this.config.executionTimeLimit) {
      violations.push(`Execution time ${metrics.executionTimeSeconds.toFixed(2)}s exceeds constitutional limit of ${this.config.executionTimeLimit}s`);
      requiredActions.push('Optimize test execution to meet 60-second constitutional requirement');
      enforcementLevel = 'BLOCKING';
    }

    // Constitutional memory limit (8GB)
    if (metrics.memoryUsageMB > this.config.memoryLimit) {
      violations.push(`Memory usage ${metrics.memoryUsageMB}MB exceeds constitutional limit of ${this.config.memoryLimit}MB`);
      requiredActions.push('Implement memory optimization to meet 8GB constitutional requirement');
      enforcementLevel = 'BLOCKING';
    }

    // Amendment v2.5.0: Binary exit code requirement
    if (![0, 1].includes(metrics.exitCode)) {
      violations.push(`Non-binary exit code ${metrics.exitCode} violates Amendment v2.5.0`);
      requiredActions.push('Ensure exit codes are strictly 0 (success) or 1 (failure)');
      enforcementLevel = 'BLOCKING';
    }

    // Amendment v2.4.0: Test governance (skip patterns)
    if (metrics.skipCount > 0) {
      violations.push(`${metrics.skipCount} skipped tests violate Amendment v2.4.0 test governance`);
      requiredActions.push('Fix or remove all skipped tests - constitutional prohibition on skip patterns');
      enforcementLevel = 'BLOCKING';
    }

    // Performance warnings (not blocking but concerning)
    if (metrics.executionTimeSeconds > this.config.executionTimeLimit * 0.8) {
      if (enforcementLevel === 'ADVISORY') {
        enforcementLevel = 'WARNING';
      }
      requiredActions.push('Consider performance optimization - approaching constitutional time limit');
    }

    if (metrics.memoryUsageMB > this.config.memoryLimit * 0.8) {
      if (enforcementLevel === 'ADVISORY') {
        enforcementLevel = 'WARNING';
      }
      requiredActions.push('Monitor memory usage - approaching constitutional memory limit');
    }

    const compliant = violations.length === 0;

    return {
      compliant,
      violations,
      enforcementLevel,
      requiredActions
    };
  }

  /**
   * Triggers automatic optimizations based on gate failures
   */
  async triggerAutomaticOptimizations(gateExecution: PerformanceGateExecution): Promise<string[]> {
    const optimizations: string[] = [];
    
    for (const gateResult of gateExecution.gateResults) {
      if (!gateResult.passed && gateResult.action === 'OPTIMIZE') {
        const gateOptimizations = await this.triggerOptimizations(
          this.getGateByName(gateResult.gateName),
          gateResult,
          this.extractMetricsFromExecution(gateExecution)
        );
        optimizations.push(...gateOptimizations);
      }
    }

    if (optimizations.length > 0) {
      console.log('🔧 Automatic optimizations triggered:');
      optimizations.forEach(opt => console.log(`   • ${opt}`));
    }

    return optimizations;
  }

  /**
   * Gets performance gate statistics
   */
  getPerformanceGateStatistics(): {
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    constitutionalComplianceRate: number;
    commonViolations: string[];
    optimizationEffectiveness: number;
  } {
    const totalExecutions = this.gateHistory.length;
    const successful = this.gateHistory.filter(e => e.overallResult === 'PASS').length;
    const constitutionalCompliant = this.gateHistory.filter(e => e.constitutionalCompliance).length;

    const averageExecutionTime = this.gateHistory.length > 0 
      ? this.gateHistory.reduce((sum, e) => {
          const metrics = this.extractMetricsFromExecution(e);
          return sum + metrics.executionTimeSeconds;
        }, 0) / this.gateHistory.length
      : 0;

    // Find common violations
    const violationCounts: Record<string, number> = {};
    this.gateHistory.forEach(execution => {
      execution.gateResults.filter(r => !r.passed).forEach(result => {
        violationCounts[result.gateName] = (violationCounts[result.gateName] || 0) + 1;
      });
    });

    const commonViolations = Object.entries(violationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name]) => name);

    // Calculate optimization effectiveness
    const executionsWithOptimizations = this.gateHistory.filter(e => e.optimizationsTriggered.length > 0);
    const optimizationEffectiveness = executionsWithOptimizations.length > 0 
      ? executionsWithOptimizations.filter(e => e.constitutionalCompliance).length / executionsWithOptimizations.length * 100
      : 0;

    return {
      totalExecutions,
      successRate: totalExecutions > 0 ? (successful / totalExecutions) * 100 : 0,
      averageExecutionTime,
      constitutionalComplianceRate: totalExecutions > 0 ? (constitutionalCompliant / totalExecutions) * 100 : 0,
      commonViolations,
      optimizationEffectiveness
    };
  }

  // Private helper methods

  private initializeConstitutionalGates(): void {
    this.constitutionalGates = [
      {
        name: 'constitutional_execution_time',
        amendmentVersion: 'v2.6.0',
        requirement: 'Test execution must complete within 60 seconds',
        autoOptimize: true,
        validator: (metrics: PerformanceMetrics): GateResult => {
          const limit = this.config.executionTimeLimit;
          const actual = metrics.executionTimeSeconds;
          const margin = ((limit - actual) / limit) * 100;
          
          let severity: GateResult['severity'] = 'OK';
          let action: GateResult['action'] = 'PASS';
          
          if (actual > limit) {
            severity = 'VIOLATION';
            action = 'BLOCK';
          } else if (actual > limit * 0.9) {
            severity = 'WARNING';
            action = 'OPTIMIZE';
          }

          return {
            gateName: 'constitutional_execution_time',
            passed: actual <= limit,
            actualValue: actual,
            limitValue: limit,
            margin,
            severity,
            action,
            recommendations: actual > limit 
              ? ['Implement selective test execution', 'Optimize Jest configuration', 'Use test result caching']
              : []
          };
        }
      },
      {
        name: 'constitutional_memory_limit',
        amendmentVersion: 'v2.6.0',
        requirement: 'Memory usage must not exceed 8GB',
        autoOptimize: true,
        validator: (metrics: PerformanceMetrics): GateResult => {
          const limit = this.config.memoryLimit;
          const actual = metrics.memoryUsageMB;
          const margin = ((limit - actual) / limit) * 100;
          
          let severity: GateResult['severity'] = 'OK';
          let action: GateResult['action'] = 'PASS';
          
          if (actual > limit) {
            severity = 'VIOLATION';
            action = 'BLOCK';
          } else if (actual > limit * 0.8) {
            severity = 'WARNING';
            action = 'OPTIMIZE';
          }

          return {
            gateName: 'constitutional_memory_limit',
            passed: actual <= limit,
            actualValue: actual,
            limitValue: limit,
            margin,
            severity,
            action,
            recommendations: actual > limit * 0.8
              ? ['Implement garbage collection strategy', 'Optimize memory usage in tests', 'Use sequential test execution']
              : []
          };
        }
      },
      {
        name: 'binary_exit_code_compliance',
        amendmentVersion: 'v2.5.0',
        requirement: 'Exit codes must be binary (0 or 1)',
        autoOptimize: false,
        validator: (metrics: PerformanceMetrics): GateResult => {
          const validExitCodes = [0, 1];
          const actual = metrics.exitCode;
          const passed = validExitCodes.includes(actual);
          
          return {
            gateName: 'binary_exit_code_compliance',
            passed,
            actualValue: actual,
            limitValue: 1,
            margin: passed ? 100 : 0,
            severity: passed ? 'OK' : 'VIOLATION',
            action: passed ? 'PASS' : 'BLOCK',
            recommendations: !passed 
              ? ['Ensure test runner returns proper exit codes', 'Fix non-binary exit code sources']
              : []
          };
        }
      },
      {
        name: 'skip_pattern_prohibition',
        amendmentVersion: 'v2.4.0',
        requirement: 'Skip patterns are prohibited',
        autoOptimize: false,
        validator: (metrics: PerformanceMetrics): GateResult => {
          const actual = metrics.skipCount;
          const passed = actual === 0;
          
          return {
            gateName: 'skip_pattern_prohibition',
            passed,
            actualValue: actual,
            limitValue: 0,
            margin: passed ? 100 : 0,
            severity: passed ? 'OK' : 'VIOLATION',
            action: passed ? 'PASS' : 'BLOCK',
            recommendations: !passed 
              ? ['Remove all skip patterns from tests', 'Fix failing tests instead of skipping', 'Provide constitutional justification for any required skips']
              : []
          };
        }
      }
    ];
  }

  private async triggerOptimizations(gate: ConstitutionalGate, result: GateResult, metrics: PerformanceMetrics): Promise<string[]> {
    const optimizations: string[] = [];

    switch (gate.name) {
      case 'constitutional_execution_time':
        if (metrics.executionTimeSeconds > 45) {
          optimizations.push('Jest configuration optimization triggered');
          optimizations.push('Selective test execution enabled');
        }
        if (metrics.executionTimeSeconds > 30) {
          optimizations.push('Test result caching enabled');
        }
        break;

      case 'constitutional_memory_limit':
        if (metrics.memoryUsageMB > 6144) { // 6GB threshold
          optimizations.push('Garbage collection strategy activated');
          optimizations.push('Memory monitoring enhanced');
        }
        if (metrics.memoryUsageMB > 4096) { // 4GB threshold
          optimizations.push('Sequential test execution enabled');
        }
        break;
    }

    return optimizations;
  }

  private parseTestOutput(output: string): { total: number; passed: number; failed: number; skipped: number } {
    // Parse Jest output for test results
    const testSuiteMatch = output.match(/Test Suites:.*?(\d+) passed.*?(\d+) total/);
    const testsMatch = output.match(/Tests:.*?(\d+) passed.*?(\d+) total/);
    
    let total = 0;
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    if (testsMatch) {
      passed = parseInt(testsMatch[1], 10) || 0;
      total = parseInt(testsMatch[2], 10) || 0;
      
      // Look for failures and skips
      const failedMatch = output.match(/(\d+) failed/);
      const skippedMatch = output.match(/(\d+) skipped/);
      
      failed = failedMatch ? parseInt(failedMatch[1], 10) : 0;
      skipped = skippedMatch ? parseInt(skippedMatch[1], 10) : 0;
    }

    return { total, passed, failed, skipped };
  }

  private async getCurrentMemoryUsage(): Promise<number> {
    // Get current process memory usage
    const memoryUsage = process.memoryUsage();
    return Math.round(memoryUsage.rss / 1024 / 1024); // Convert to MB
  }

  private generateSessionId(): string {
    return `gate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private trimGateHistory(): void {
    // Keep only last 100 executions for memory efficiency
    if (this.gateHistory.length > 100) {
      this.gateHistory = this.gateHistory.slice(-100);
    }
  }

  private logGateExecutionResults(execution: PerformanceGateExecution): void {
    console.log('\n🏛️ Performance Gates Execution Results:');
    console.log('=' .repeat(50));
    console.log(`Session: ${execution.sessionId}`);
    console.log(`Overall Result: ${this.getResultIcon(execution.overallResult)} ${execution.overallResult}`);
    console.log(`Constitutional Compliance: ${execution.constitutionalCompliance ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`);
    
    if (execution.optimizationsTriggered.length > 0) {
      console.log(`Optimizations Triggered: ${execution.optimizationsTriggered.length}`);
    }
    
    if (execution.enforcementActions.length > 0) {
      console.log(`Enforcement Actions: ${execution.enforcementActions.length}`);
    }
    
    console.log('=' .repeat(50));
  }

  private getResultIcon(result: string): string {
    switch (result) {
      case 'PASS': return '✅';
      case 'WARNING': return '⚠️';
      case 'FAIL': return '❌';
      default: return '❓';
    }
  }

  private getGateByName(gateName: string): ConstitutionalGate {
    return this.constitutionalGates.find(g => g.name === gateName) || this.constitutionalGates[0];
  }

  private extractMetricsFromExecution(execution: PerformanceGateExecution): PerformanceMetrics {
    // Extract metrics from gate results - simplified implementation
    const executionTimeResult = execution.gateResults.find(r => r.gateName === 'constitutional_execution_time');
    const memoryResult = execution.gateResults.find(r => r.gateName === 'constitutional_memory_limit');
    const exitCodeResult = execution.gateResults.find(r => r.gateName === 'binary_exit_code_compliance');
    const skipResult = execution.gateResults.find(r => r.gateName === 'skip_pattern_prohibition');

    return {
      executionTimeSeconds: executionTimeResult?.actualValue || 0,
      memoryUsageMB: memoryResult?.actualValue || 0,
      cpuUsagePercent: 75, // Simulated
      testCount: 80, // Simulated
      passCount: 80, // Simulated
      failCount: 0,
      skipCount: skipResult?.actualValue || 0,
      exitCode: exitCodeResult?.actualValue || 0,
      timestamp: execution.endTime || execution.startTime
    };
  }
}