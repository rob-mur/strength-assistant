/**
 * Jest Global Setup: Constitutional TypeScript Validation
 * 
 * This setup runs before all tests to ensure TypeScript compilation
 * succeeds, implementing our constitutional requirement that
 * "TypeScript compilation MUST succeed before test execution."
 */

const { spawn } = require('child_process');

module.exports = async () => {
  console.log('🔍 Constitutional Requirement: Validating TypeScript compilation before test execution...');
  
  try {
    // Run TypeScript compilation check
    const result = await runTypeScriptValidation();
    
    if (result.exitCode !== 0) {
      console.error('❌ CONSTITUTIONAL VIOLATION: TypeScript compilation failed');
      console.error('🚫 Tests cannot proceed - fix TypeScript errors first');
      console.error('\nTypeScript errors:');
      console.error(result.stderr);
      console.error('\nRequired actions:');
      console.error('1. Run "npx tsc --noEmit" to see all errors');
      console.error('2. Fix all TypeScript compilation errors');
      console.error('3. Ensure all files pass strict type checking');
      console.error('4. Run tests again');
      
      // Exit the test process - constitutional violation
      process.exit(1);
    }
    
    console.log('✅ TypeScript compilation successful');
    console.log('✅ Constitutional requirements met - proceeding with test execution');
    
  } catch (error) {
    console.error('❌ TypeScript validation process failed:', error.message);
    console.error('🚫 Cannot proceed with tests due to validation failure');
    process.exit(1);
  }
};

/**
 * Run TypeScript compilation validation
 * @returns {Promise<{exitCode: number, stdout: string, stderr: string}>}
 */
function runTypeScriptValidation() {
  return new Promise((resolve) => {
    console.log('   Running: npx tsc --noEmit');
    
    const process = spawn('npx', ['tsc', '--noEmit'], {
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
        stderr: `TypeScript validation process error: ${error.message}`
      });
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      process.kill();
      resolve({
        exitCode: 1,
        stdout,
        stderr: 'TypeScript validation timed out after 30 seconds'
      });
    }, 30000);
  });
}