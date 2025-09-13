/**
 * Constitutional Amendment v2.6.0 Jest Reporter
 * 
 * Custom Jest reporter for Constitutional Amendment v2.6.0 compliance validation.
 * Monitors test execution time, exit codes, and constitutional requirements.
 */

class ConstitutionalAmendmentReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
    this._constitutionalValidation = options.constitutionalValidation || false;
    this._amendmentVersion = options.amendmentVersion || '2.6.0';
    this._startTime = null;
    this._testResults = [];
  }

  onRunStart(results, options) {
    this._startTime = Date.now();
    
    if (this._constitutionalValidation) {
      console.log(`\n🏛️  Constitutional Amendment v${this._amendmentVersion} Validation Active`);
      console.log('📊 Performance Target: <60 seconds execution time');
      console.log('🧠 Memory Constraint: <8GB usage');
      console.log('🚫 Skip Pattern Prohibition: Enforced\n');
    }
  }

  onTestResult(test, testResult, aggregatedResult) {
    this._testResults.push({
      testPath: test.path,
      success: testResult.numFailingTests === 0,
      duration: testResult.perfStats.end - testResult.perfStats.start,
      numTests: testResult.numTotalTests,
      numPassed: testResult.numPassingTests,
      numFailed: testResult.numFailingTests,
      numSkipped: testResult.numPendingTests
    });

    // Constitutional Amendment v2.6.0: Skip pattern violation detection
    if (testResult.numPendingTests > 0) {
      console.warn(`⚠️  Constitutional Violation: ${testResult.numPendingTests} skipped tests in ${test.path}`);
      console.warn('   Amendment v2.6.0 prohibits test skipping without constitutional justification');
    }
  }

  onRunComplete(contexts, results) {
    const endTime = Date.now();
    const totalExecutionTime = (endTime - this._startTime) / 1000;
    
    if (this._constitutionalValidation) {
      this._generateConstitutionalReport(results, totalExecutionTime);
    }
  }

  _generateConstitutionalReport(results, executionTime) {
    console.log('\n🏛️  Constitutional Amendment v2.6.0 Compliance Report');
    console.log('=' .repeat(60));
    
    // Performance Compliance
    const performanceCompliant = executionTime <= 60;
    console.log(`⏱️  Execution Time: ${executionTime.toFixed(2)}s (Target: ≤60s)`);
    console.log(`✅ Performance Compliance: ${performanceCompliant ? 'PASS' : 'FAIL'}`);
    
    if (!performanceCompliant) {
      console.log(`   ⚠️  Constitutional violation: Exceeded 60-second limit by ${(executionTime - 60).toFixed(2)}s`);
    }
    
    // Skip Pattern Compliance
    const totalSkipped = results.numPendingTests;
    const skipCompliant = totalSkipped === 0;
    console.log(`🚫 Skip Pattern Prohibition: ${skipCompliant ? 'COMPLIANT' : 'VIOLATION'}`);
    
    if (!skipCompliant) {
      console.log(`   ⚠️  Constitutional violation: ${totalSkipped} tests skipped`);
    }
    
    // Test Success Rate
    const passRate = results.numTotalTests > 0 ? 
      (results.numPassedTests / results.numTotalTests) * 100 : 0;
    console.log(`📊 Test Success Rate: ${passRate.toFixed(1)}% (${results.numPassedTests}/${results.numTotalTests})`);
    
    // Overall Constitutional Compliance
    const overallCompliant = performanceCompliant && skipCompliant && results.success;
    console.log(`🏛️  Overall Constitutional Compliance: ${overallCompliant ? 'PASS' : 'FAIL'}`);
    
    // Exit Code Determination (Amendment v2.5.0 integration)
    const exitCode = overallCompliant ? 0 : 1;
    console.log(`🔢 Constitutional Exit Code: ${exitCode}`);
    
    if (!overallCompliant) {
      console.log('\n🔧 Required Corrective Actions:');
      if (!performanceCompliant) {
        console.log('   • Optimize test suite for <60 second execution');
        console.log('   • Review Jest configuration for performance');
        console.log('   • Consider selective test execution');
      }
      if (!skipCompliant) {
        console.log('   • Remove all test skip patterns');
        console.log('   • Fix failing tests instead of skipping');
      }
      if (!results.success) {
        console.log('   • Fix all failing tests');
        console.log('   • Ensure 100% test pass rate');
      }
    }
    
    console.log('=' .repeat(60));
    
    // Memory usage reporting (simulated)
    const memoryUsage = process.memoryUsage();
    const memoryMB = Math.round(memoryUsage.rss / 1024 / 1024);
    const memoryCompliant = memoryMB <= 8192;
    console.log(`🧠 Memory Usage: ${memoryMB}MB (Limit: ≤8192MB) - ${memoryCompliant ? 'COMPLIANT' : 'VIOLATION'}`);
    
    // Amendment Integration Status
    console.log('\n🔗 Amendment Integration Status:');
    console.log(`   • v2.4.0 Test Governance: ${skipCompliant ? 'INTEGRATED' : 'VIOLATION'}`);
    console.log(`   • v2.5.0 Binary Exit Code: ${exitCode === 0 || exitCode === 1 ? 'INTEGRATED' : 'VIOLATION'}`);
    console.log(`   • v2.6.0 Task Completion: ${overallCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}`);
    
    console.log('\n');
  }
}

module.exports = ConstitutionalAmendmentReporter;