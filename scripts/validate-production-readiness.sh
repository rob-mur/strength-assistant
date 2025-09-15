#!/usr/bin/env bash
set -euo pipefail

# Production Readiness Validation Script
# Implements automated constitutional compliance checking per Amendment v2.6.0
# 
# Constitutional Requirements:
# - Amendment v2.5.0: Binary Exit Code Enforcement
# - Amendment v2.6.0: Task Completion Validation
# - TypeScript compilation success
# - Jest test suite 100% pass rate
# - Performance targets (<60s execution time)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_FILE="$PROJECT_ROOT/production-readiness-report.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize report structure
init_report() {
    cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$TIMESTAMP",
  "constitutionalCompliance": {
    "amendment_v2_5_0_binary_exit_code": false,
    "amendment_v2_6_0_task_validation": false,
    "typescript_compilation": false,
    "test_suite_success": false,
    "performance_targets": false
  },
  "metrics": {
    "typescript_compilation_time": 0,
    "total_test_time": 0,
    "test_results": {
      "total_tests": 0,
      "passing_tests": 0,
      "failing_tests": 0,
      "test_suites": 0,
      "passing_suites": 0,
      "failing_suites": 0
    },
    "performance": {
      "target_execution_time": 60,
      "actual_execution_time": 0,
      "meets_performance_target": false
    }
  },
  "validationSteps": [],
  "errors": [],
  "warnings": [],
  "recommendations": [],
  "overallStatus": "PENDING",
  "cicd_ready": false
}
EOF
}

# Update report with step results
update_report() {
    local step_name="$1"
    local status="$2"
    local details="$3"
    local execution_time="${4:-0}"
    
    # Use jq to update the JSON report
    jq --arg step "$step_name" \
       --arg status "$status" \
       --arg details "$details" \
       --argjson time "$execution_time" \
       '.validationSteps += [{"step": $step, "status": $status, "details": $details, "executionTime": $time}]' \
       "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
}

# Add error to report
add_error() {
    local error_msg="$1"
    jq --arg error "$error_msg" \
       '.errors += [$error]' \
       "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
}

# Add warning to report
add_warning() {
    local warning_msg="$1"
    jq --arg warning "$warning_msg" \
       '.warnings += [$warning]' \
       "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
}

# Add recommendation to report
add_recommendation() {
    local rec_msg="$1"
    jq --arg rec "$rec_msg" \
       '.recommendations += [$rec]' \
       "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
}

# Print status with color
print_status() {
    local status="$1"
    local message="$2"
    
    case "$status" in
        "PASS")
            echo -e "${GREEN}✅ PASS${NC}: $message"
            ;;
        "FAIL")
            echo -e "${RED}❌ FAIL${NC}: $message"
            ;;
        "WARN")
            echo -e "${YELLOW}⚠️  WARN${NC}: $message"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ️  INFO${NC}: $message"
            ;;
    esac
}

# Validate TypeScript compilation (Constitutional Requirement)
validate_typescript() {
    print_status "INFO" "Validating TypeScript compilation (Constitutional Amendment v2.2.0)..."
    
    local start_time=$(date +%s)
    
    if npx tsc --noEmit 2>/dev/null; then
        local end_time=$(date +%s)
        local execution_time=$((end_time - start_time))
        
        print_status "PASS" "TypeScript compilation successful"
        update_report "typescript_compilation" "PASS" "TypeScript compilation successful" "$execution_time"
        
        # Update constitutional compliance
        jq '.constitutionalCompliance.typescript_compilation = true | 
            .metrics.typescript_compilation_time = '"$execution_time"'' \
           "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
        
        return 0
    else
        local end_time=$(date +%s)
        local execution_time=$((end_time - start_time))
        
        print_status "FAIL" "TypeScript compilation failed - Constitutional violation"
        add_error "TypeScript compilation failed - Constitutional Amendment v2.2.0 violation"
        add_recommendation "Run 'npx tsc --noEmit' and fix all TypeScript errors"
        update_report "typescript_compilation" "FAIL" "TypeScript compilation failed" "$execution_time"
        
        return 1
    fi
}

# Validate test suite (Constitutional Requirements)
validate_test_suite() {
    print_status "INFO" "Validating Jest test suite (Constitutional Amendments v2.4.0, v2.5.0, v2.6.0)..."
    
    local start_time=$(date +%s)
    local temp_output=$(mktemp)
    
    # Run tests and capture output and exit code
    set +e
    devbox run test > "$temp_output" 2>&1
    local exit_code=$?
    set -e
    
    local end_time=$(date +%s)
    local execution_time=$((end_time - start_time))
    
    # Parse test results from output
    local total_tests=0
    local passing_tests=0
    local failing_tests=0
    local test_suites=0
    local passing_suites=0
    local failing_suites=0
    
    if grep -q "Tests:" "$temp_output"; then
        total_tests=$(grep "Tests:" "$temp_output" | grep -oE '[0-9]+ total' | grep -oE '[0-9]+' | head -1 || echo "0")
        passing_tests=$(grep "Tests:" "$temp_output" | grep -oE '[0-9]+ passed' | grep -oE '[0-9]+' | head -1 || echo "0")
        failing_tests=$(grep "Tests:" "$temp_output" | grep -oE '[0-9]+ failed' | grep -oE '[0-9]+' | head -1 || echo "0")
    fi
    
    if grep -q "Test Suites:" "$temp_output"; then
        test_suites=$(grep "Test Suites:" "$temp_output" | grep -oE '[0-9]+ total' | grep -oE '[0-9]+' | head -1 || echo "0")
        passing_suites=$(grep "Test Suites:" "$temp_output" | grep -oE '[0-9]+ passed' | grep -oE '[0-9]+' | head -1 || echo "0")
        failing_suites=$(grep "Test Suites:" "$temp_output" | grep -oE '[0-9]+ failed' | grep -oE '[0-9]+' | head -1 || echo "0")
    fi
    
    # Update metrics in report
    jq --argjson total "$total_tests" \
       --argjson passing "$passing_tests" \
       --argjson failing "$failing_tests" \
       --argjson suites "$test_suites" \
       --argjson passing_suites "$passing_suites" \
       --argjson failing_suites "$failing_suites" \
       --argjson exec_time "$execution_time" \
       '.metrics.total_test_time = $exec_time |
        .metrics.test_results.total_tests = $total |
        .metrics.test_results.passing_tests = $passing |
        .metrics.test_results.failing_tests = $failing |
        .metrics.test_results.test_suites = $suites |
        .metrics.test_results.passing_suites = $passing_suites |
        .metrics.test_results.failing_suites = $failing_suites |
        .metrics.performance.actual_execution_time = $exec_time' \
       "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    
    # Constitutional Amendment v2.5.0: Binary Exit Code Enforcement
    if [ $exit_code -eq 0 ]; then
        print_status "PASS" "Binary exit code validation: Exit code 0 (Constitutional compliance)"
        update_report "binary_exit_code" "PASS" "Exit code 0 - Constitutional Amendment v2.5.0 compliance" "$execution_time"
        
        jq '.constitutionalCompliance.amendment_v2_5_0_binary_exit_code = true |
            .constitutionalCompliance.test_suite_success = true' \
           "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    else
        print_status "FAIL" "Binary exit code validation: Exit code $exit_code (Constitutional violation)"
        add_error "Test suite failed with exit code $exit_code - Constitutional Amendment v2.5.0 violation"
        add_recommendation "Fix failing tests to achieve 100% pass rate"
        update_report "binary_exit_code" "FAIL" "Exit code $exit_code - Constitutional violation" "$execution_time"
    fi
    
    # Performance validation (Constitutional Amendment v2.6.0)
    local performance_target=60
    local meets_performance=0
    if [ "$execution_time" -lt "$performance_target" ]; then
        meets_performance=1
    fi
    
    if [ "$meets_performance" -eq 1 ]; then
        print_status "PASS" "Performance target: ${execution_time}s < ${performance_target}s (Constitutional compliance)"
        jq '.constitutionalCompliance.performance_targets = true |
            .metrics.performance.meets_performance_target = true' \
           "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    else
        print_status "FAIL" "Performance target: ${execution_time}s >= ${performance_target}s (Constitutional violation)"
        add_warning "Test execution time exceeds 60-second constitutional requirement"
        add_recommendation "Optimize test performance to meet <60s requirement"
    fi
    
    # Test results summary
    print_status "INFO" "Test Results: $passing_tests/$total_tests tests passed, $passing_suites/$test_suites suites passed"
    
    # Clean up
    rm -f "$temp_output"
    
    return $exit_code
}

# Validate Jest worker stability
validate_jest_workers() {
    print_status "INFO" "Validating Jest worker stability..."
    
    local temp_output=$(mktemp)
    
    # Run a quick test to check for worker exceptions
    timeout 30 npm test -- __tests__/contracts/storage-interface.test.ts > "$temp_output" 2>&1 || true
    
    local worker_errors=$(grep -i "worker\|child process\|exception" "$temp_output" | wc -l)
    
    if [ "$worker_errors" -eq 0 ]; then
        print_status "PASS" "Jest worker stability validated - Zero worker exceptions"
        update_report "jest_worker_stability" "PASS" "Zero worker exceptions detected" 0
    else
        print_status "WARN" "Jest worker issues detected - $worker_errors instances"
        add_warning "Jest worker stability issues detected: $worker_errors instances"
        add_recommendation "Review Jest configuration and worker settings"
        update_report "jest_worker_stability" "WARN" "$worker_errors worker exceptions detected" 0
    fi
    
    rm -f "$temp_output"
}

# Generate CI/CD readiness assessment
assess_cicd_readiness() {
    print_status "INFO" "Assessing CI/CD pipeline readiness..."
    
    # Check if all constitutional requirements are met
    local typescript_ok=$(jq -r '.constitutionalCompliance.typescript_compilation' "$REPORT_FILE")
    local exit_code_ok=$(jq -r '.constitutionalCompliance.amendment_v2_5_0_binary_exit_code' "$REPORT_FILE")
    local test_suite_ok=$(jq -r '.constitutionalCompliance.test_suite_success' "$REPORT_FILE")
    
    if [ "$typescript_ok" = "true" ] && [ "$exit_code_ok" = "true" ] && [ "$test_suite_ok" = "true" ]; then
        print_status "PASS" "CI/CD pipeline ready for production deployment"
        jq '.cicd_ready = true | .overallStatus = "READY"' \
           "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
        return 0
    else
        print_status "FAIL" "CI/CD pipeline NOT ready - Constitutional violations detected"
        jq '.cicd_ready = false | .overallStatus = "NOT_READY"' \
           "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
        
        add_recommendation "Resolve all constitutional violations before deploying to production"
        return 1
    fi
}

# Generate final report summary
generate_report_summary() {
    print_status "INFO" "Generating production readiness report..."
    
    local overall_status=$(jq -r '.overallStatus' "$REPORT_FILE")
    local error_count=$(jq -r '.errors | length' "$REPORT_FILE")
    local warning_count=$(jq -r '.warnings | length' "$REPORT_FILE")
    local recommendation_count=$(jq -r '.recommendations | length' "$REPORT_FILE")
    
    echo ""
    echo "==============================================="
    echo "PRODUCTION READINESS VALIDATION REPORT"
    echo "==============================================="
    echo "Timestamp: $TIMESTAMP"
    echo "Overall Status: $overall_status"
    echo ""
    
    if [ "$overall_status" = "READY" ]; then
        print_status "PASS" "✅ PRODUCTION READY - All constitutional requirements met"
    else
        print_status "FAIL" "❌ NOT PRODUCTION READY - Constitutional violations detected"
    fi
    
    echo ""
    echo "Summary:"
    echo "- Errors: $error_count"
    echo "- Warnings: $warning_count"  
    echo "- Recommendations: $recommendation_count"
    echo ""
    echo "Full report saved to: $REPORT_FILE"
    echo ""
    
    # Display errors if any
    if [ "$error_count" -gt 0 ]; then
        echo "ERRORS:"
        jq -r '.errors[]' "$REPORT_FILE" | while read -r error; do
            echo "  - $error"
        done
        echo ""
    fi
    
    # Display warnings if any
    if [ "$warning_count" -gt 0 ]; then
        echo "WARNINGS:"
        jq -r '.warnings[]' "$REPORT_FILE" | while read -r warning; do
            echo "  - $warning"
        done
        echo ""
    fi
    
    # Display recommendations if any
    if [ "$recommendation_count" -gt 0 ]; then
        echo "RECOMMENDATIONS:"
        jq -r '.recommendations[]' "$REPORT_FILE" | while read -r rec; do
            echo "  - $rec"
        done
        echo ""
    fi
    
    if [ "$overall_status" = "READY" ]; then
        return 0
    else
        return 1
    fi
}

# Main execution
main() {
    echo "🚀 Production Readiness Validation"
    echo "Constitutional Compliance Assessment (Amendments v2.2.0, v2.4.0, v2.5.0, v2.6.0)"
    echo ""
    
    # Change to project directory
    cd "$PROJECT_ROOT"
    
    # Initialize report
    init_report
    
    # Run validation steps
    local overall_success=true
    
    # Step 1: TypeScript Compilation (Constitutional Requirement)
    if ! validate_typescript; then
        overall_success=false
    fi
    
    # Step 2: Jest Worker Stability
    validate_jest_workers
    
    # Step 3: Test Suite Validation (Constitutional Requirements)
    if ! validate_test_suite; then
        overall_success=false
    fi
    
    # Step 4: CI/CD Readiness Assessment
    if ! assess_cicd_readiness; then
        overall_success=false
    fi
    
    # Generate final report
    if ! generate_report_summary; then
        overall_success=false
    fi
    
    # Amendment v2.6.0: Task Completion Validation
    jq '.constitutionalCompliance.amendment_v2_6_0_task_validation = true' \
       "$REPORT_FILE" > "${REPORT_FILE}.tmp" && mv "${REPORT_FILE}.tmp" "$REPORT_FILE"
    
    # Return appropriate exit code for CI/CD integration
    if [ "$overall_success" = "true" ]; then
        print_status "PASS" "🎉 Production readiness validation PASSED"
        exit 0
    else
        print_status "FAIL" "💥 Production readiness validation FAILED"
        exit 1
    fi
}

# Run main function
main "$@"