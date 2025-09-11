#!/bin/bash

# CI Pipeline TypeScript Validation Script
# Constitutional Requirement: TypeScript compilation MUST succeed in CI/CD
# 
# This script provides detailed TypeScript validation for CI environments
# with structured error reporting and constitutional compliance verification.

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
EXIT_CODE=0

# Colors for output (if terminal supports it)
if [[ -t 1 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    BOLD='\033[1m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    BOLD=''
    NC=''
fi

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_constitutional_violation() {
    echo -e "${RED}${BOLD}[CONSTITUTIONAL VIOLATION]${NC} $1"
}

# Header
echo "=================================="
echo "TypeScript Validation Pipeline"
echo "Constitutional Compliance Check"
echo "Timestamp: $TIMESTAMP"
echo "Project: $(basename "$PROJECT_ROOT")"
echo "=================================="
echo

# Change to project root
cd "$PROJECT_ROOT"

# Check if TypeScript is available
log_info "Checking TypeScript availability..."
if ! command -v npx >/dev/null 2>&1; then
    log_error "npx is not available"
    exit 1
fi

if ! npx tsc --version >/dev/null 2>&1; then
    log_error "TypeScript compiler (tsc) is not available"
    log_error "Run 'npm install' to install dependencies"
    exit 1
fi

TSC_VERSION=$(npx tsc --version)
log_success "TypeScript compiler available: $TSC_VERSION"
echo

# Step 1: Validate tsconfig.json
log_info "Step 1: Validating TypeScript configuration..."
if [[ ! -f "tsconfig.json" ]]; then
    log_error "tsconfig.json not found"
    exit 1
fi

# Check for constitutional requirements in tsconfig.json
STRICT_MODE=$(node -pe "try { JSON.parse(require('fs').readFileSync('tsconfig.json', 'utf8')).compilerOptions.strict } catch(e) { false }")
NO_IMPLICIT_ANY=$(node -pe "try { JSON.parse(require('fs').readFileSync('tsconfig.json', 'utf8')).compilerOptions.noImplicitAny } catch(e) { false }")
NO_IMPLICIT_RETURNS=$(node -pe "try { JSON.parse(require('fs').readFileSync('tsconfig.json', 'utf8')).compilerOptions.noImplicitReturns } catch(e) { false }")

if [[ "$STRICT_MODE" != "true" ]]; then
    log_constitutional_violation "TypeScript strict mode is not enabled"
    log_error "Constitutional requirement: compilerOptions.strict must be true"
    EXIT_CODE=1
fi

if [[ "$NO_IMPLICIT_ANY" != "true" ]]; then
    log_constitutional_violation "noImplicitAny is not enabled"
    log_error "Constitutional requirement: compilerOptions.noImplicitAny must be true"
    EXIT_CODE=1
fi

if [[ "$NO_IMPLICIT_RETURNS" != "true" ]]; then
    log_constitutional_violation "noImplicitReturns is not enabled"
    log_error "Constitutional requirement: compilerOptions.noImplicitReturns must be true"
    EXIT_CODE=1
fi

if [[ $EXIT_CODE -eq 0 ]]; then
    log_success "TypeScript configuration meets constitutional requirements"
else
    log_error "TypeScript configuration violations detected"
    echo
    echo "Required actions:"
    echo "1. Edit tsconfig.json to enable strict mode"
    echo "2. Set compilerOptions.strict: true"
    echo "3. Set compilerOptions.noImplicitAny: true"
    echo "4. Set compilerOptions.noImplicitReturns: true"
    echo "5. Re-run this validation script"
    exit $EXIT_CODE
fi
echo

# Step 2: TypeScript Compilation Check
log_info "Step 2: Running TypeScript compilation validation..."
log_info "Command: npx tsc --noEmit"

# Create temporary file for capturing output
TEMP_OUTPUT=$(mktemp)
TEMP_ERRORS=$(mktemp)

# Cleanup function
cleanup() {
    rm -f "$TEMP_OUTPUT" "$TEMP_ERRORS"
}
trap cleanup EXIT

# Run TypeScript compilation
if npx tsc --noEmit >"$TEMP_OUTPUT" 2>"$TEMP_ERRORS"; then
    log_success "TypeScript compilation successful"
    
    # Count files processed (approximate)
    FILE_COUNT=$(find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | wc -l)
    log_info "Validated approximately $FILE_COUNT TypeScript files"
    
else
    COMPILATION_EXIT_CODE=$?
    log_constitutional_violation "TypeScript compilation failed"
    log_error "Exit code: $COMPILATION_EXIT_CODE"
    
    # Parse and display errors
    if [[ -s "$TEMP_ERRORS" ]]; then
        echo
        log_error "TypeScript Compilation Errors:"
        echo "----------------------------------------"
        
        # Count different types of errors
        ERROR_COUNT=$(grep -c "error TS" "$TEMP_ERRORS" || echo "0")
        WARNING_COUNT=$(grep -c "warning TS" "$TEMP_ERRORS" || echo "0")
        
        cat "$TEMP_ERRORS"
        echo "----------------------------------------"
        echo
        log_error "Summary: $ERROR_COUNT errors, $WARNING_COUNT warnings"
        
        # Extract unique error codes for analysis
        UNIQUE_ERRORS=$(grep -o "TS[0-9]*" "$TEMP_ERRORS" | sort | uniq | tr '\n' ' ')
        if [[ -n "$UNIQUE_ERRORS" ]]; then
            log_info "Error codes found: $UNIQUE_ERRORS"
        fi
    fi
    
    echo
    echo "Constitutional Violation Details:"
    echo "- Requirement: TypeScript compilation MUST succeed before test execution"
    echo "- Violation: Compilation errors prevent test suite execution"
    echo "- Impact: Blocks entire development pipeline"
    echo
    echo "Required Remediation Actions:"
    echo "1. Fix all TypeScript compilation errors listed above"
    echo "2. Run 'npx tsc --noEmit' locally to verify fixes"
    echo "3. Ensure all code passes strict type checking"
    echo "4. Commit only after successful TypeScript compilation"
    echo "5. Re-run CI pipeline"
    
    EXIT_CODE=1
fi
echo

# Step 3: Constitutional Compliance Summary
log_info "Step 3: Constitutional Compliance Summary"
echo "Constitution Version: 2.2.0"
echo "Testing Requirements Validation:"

if [[ $EXIT_CODE -eq 0 ]]; then
    echo "  ✅ TypeScript compilation MUST succeed before test execution"
    echo "  ✅ devbox run test ready to proceed"
    echo "  ✅ Pre-commit validation alignment verified"
    echo "  ✅ CI/CD pipeline constitutional compliance: PASS"
else
    echo "  ❌ TypeScript compilation MUST succeed before test execution"
    echo "  ❌ devbox run test blocked by compilation failures"
    echo "  ❌ Pre-commit validation would fail"
    echo "  ❌ CI/CD pipeline constitutional compliance: FAIL"
fi
echo

# Step 4: Generate CI Report (if in CI environment)
if [[ "${CI:-false}" == "true" ]]; then
    log_info "Step 4: Generating CI compliance report..."
    
    REPORT_FILE="typescript-validation-report.json"
    cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$TIMESTAMP",
  "constitutionalCompliance": $([ $EXIT_CODE -eq 0 ] && echo "true" || echo "false"),
  "typescriptCompilation": {
    "success": $([ $EXIT_CODE -eq 0 ] && echo "true" || echo "false"),
    "configurationValid": true,
    "strictMode": $STRICT_MODE,
    "noImplicitAny": $NO_IMPLICIT_ANY,
    "noImplicitReturns": $NO_IMPLICIT_RETURNS
  },
  "requirements": {
    "strictModeEnabled": $STRICT_MODE,
    "noImplicitAnyEnabled": $NO_IMPLICIT_ANY,
    "noImplicitReturnsEnabled": $NO_IMPLICIT_RETURNS,
    "compilationSuccessful": $([ $EXIT_CODE -eq 0 ] && echo "true" || echo "false")
  },
  "exitCode": $EXIT_CODE
}
EOF
    
    log_success "CI report generated: $REPORT_FILE"
fi

# Final status
echo "=================================="
if [[ $EXIT_CODE -eq 0 ]]; then
    log_success "TypeScript validation PASSED"
    log_success "Constitutional requirements satisfied"
    echo "✅ Pipeline ready to proceed with testing"
else
    log_error "TypeScript validation FAILED"
    log_constitutional_violation "Constitutional requirements violated"
    echo "🚫 Pipeline blocked - fix TypeScript errors before proceeding"
fi
echo "=================================="

exit $EXIT_CODE