# Data Model: Android Integration Test Bug Fix

## Core Entities

### Test Execution Result
**Purpose**: Represents the outcome of a test execution with proper exit code handling

**Attributes**:
- `testName`: string - Name of the Maestro test file
- `exitCode`: number - Raw exit code from test execution (0 = success, non-zero = failure)
- `success`: boolean - Properly converted success indicator (true if exitCode === 0)
- `startTime`: timestamp - When test execution began
- `endTime`: timestamp - When test execution completed
- `duration`: number - Test execution time in milliseconds
- `debugArtifacts`: DebugArtifact[] - Collection of debug outputs

**Validation Rules**:
- `exitCode` must be a number
- `success` must equal `(exitCode === 0)`
- `endTime` must be after `startTime`
- `testName` must correspond to existing `.maestro` file

**State Transitions**:
1. `PENDING` → `RUNNING` (test starts)
2. `RUNNING` → `COMPLETED` (test finishes with exit code)
3. `RUNNING` → `FAILED` (test execution error)

### Debug Artifact
**Purpose**: Captures debug information for test troubleshooting

**Attributes**:
- `type`: string - Type of artifact (screenshot, log, ui-dump, video)
- `filePath`: string - Path to artifact file
- `timestamp`: timestamp - When artifact was created
- `testStep`: string - Which test step generated this artifact
- `size`: number - File size in bytes

**Validation Rules**:
- `type` must be one of: screenshot, log, ui-dump, video
- `filePath` must exist and be readable
- `size` must be > 0

### Environment Configuration
**Purpose**: Defines environment variables and build configuration

**Attributes**:
- `profile`: string - Build profile (development, preview, production)
- `supabaseUrl`: string - Supabase instance URL
- `supabaseAnonKey`: string - Supabase anonymous access key
- `useEmulator`: boolean - Whether to use local Supabase emulator
- `emulatorHost`: string - Host for emulator connection (Android: 10.0.2.2)
- `emulatorPort`: number - Port for emulator connection
- `useSupabase`: boolean - Feature flag for Supabase usage

**Validation Rules**:
- `profile` must be one of: development, preview, production
- `supabaseUrl` must be valid URL format
- `supabaseAnonKey` must be valid JWT format
- `emulatorHost` must be valid IP or hostname
- `emulatorPort` must be valid port number (1-65535)

**Relationships**:
- Production profile: `useEmulator = false`, requires `supabaseUrl`
- Development/Preview: `useEmulator = true`, requires `emulatorHost` and `emulatorPort`

### Test Suite Execution
**Purpose**: Aggregates results from multiple test executions

**Attributes**:
- `suiteId`: string - Unique identifier for test suite run
- `buildProfile`: string - EAS build profile used
- `environment`: EnvironmentConfiguration - Environment config used
- `results`: TestExecutionResult[] - Individual test results
- `overallSuccess`: boolean - True if ALL tests succeeded
- `totalTests`: number - Number of tests executed
- `passedTests`: number - Number of tests that passed
- `failedTests`: number - Number of tests that failed
- `executionTime`: number - Total execution time

**Validation Rules**:
- `overallSuccess` must be true only if all `results` have `success = true`
- `totalTests` must equal `results.length`
- `passedTests + failedTests` must equal `totalTests`
- `executionTime` must be sum of individual test durations

**Business Rules**:
- If ANY test fails, entire suite is considered failed
- Debug artifacts are collected regardless of test outcome
- Suite execution stops on first failure (fail-fast)

## Relationships

```
TestSuiteExecution
├── environment: EnvironmentConfiguration
└── results: TestExecutionResult[]
    └── debugArtifacts: DebugArtifact[]
```

## Data Flow

1. **Suite Initialization**: Create TestSuiteExecution with EnvironmentConfiguration
2. **Test Execution**: For each Maestro test, create TestExecutionResult
3. **Exit Code Processing**: Convert raw exit codes to boolean success indicators
4. **Artifact Collection**: Gather DebugArtifacts for each test
5. **Suite Completion**: Calculate overall success based on individual results

## Critical Data Integrity Rules

### Exit Code Conversion
```typescript
// CORRECT: Convert exit code to boolean
const success = exitCode === 0;

// INCORRECT: Use exit code directly as boolean
const success = exitCode; // 0 is falsy, non-zero is truthy - WRONG!
```

### Environment Variable Precedence
1. **Production**: EAS environment variables only
2. **Development/Preview**: Devbox configuration only
3. **Testing**: Android emulator networking (10.0.2.2)

### Test Result Aggregation
- Suite success requires ALL individual tests to succeed
- Any single test failure marks entire suite as failed
- Exit codes must be properly converted before aggregation