# Data Model: Local First Storage with Backup

## 🚨 Critical Requirements

All data model changes must support:
- **Local-First Architecture**: All data operations immediate on device
- **Automatic Cloud Sync**: Background synchronization when online
- **Sequential Processing**: Memory-safe implementation within 32GB limit
- **Constitutional Compliance**: All tests must pass before any commit
- **Migration Safety**: Zero data loss during Firebase to Supabase migration

## ✅ Enhanced Test Infrastructure Requirements

All test entities and configurations must support:
- **TypeScript Strict Mode**: Full type safety in test infrastructure
- **Mock-First Development**: Complete mock implementations before real functionality
- **Incremental Repair**: Systematic approach to fixing test failures
- **Constitutional Governance**: Formal governance to prevent future test regressions

## Core Entities for Local-First Storage Migration

### Exercise Entity (Enhanced)
**Purpose**: Primary data model with local-first and sync capabilities
**Fields**:
- `id`: string (unique identifier, consistent across devices)
- `name`: string (exercise name, user-defined)
- `createdAt`: timestamp (local creation time)
- `updatedAt`: timestamp (last modification time)
- `syncedAt`: timestamp (last successful sync to cloud)
- `syncStatus`: SyncStatus (current sync state)
- `deviceOrigin`: string (device ID where created)
- `userId`: string | null (user ID if authenticated, null for anonymous)

**Validation Rules**:
- `id` must be globally unique (UUID v4)
- `name` cannot be empty
- `updatedAt` must be >= `createdAt`
- `syncedAt` should be <= `updatedAt`

**State Transitions**:
- Creation: syncStatus = 'pending'
- Successful sync: syncStatus = 'synced', syncedAt = current time
- Failed sync: syncStatus = 'error'
- Offline edit: syncStatus = 'pending', updatedAt = current time

### User Account Entity
**Purpose**: User authentication and cross-device synchronization
**Fields**:
- `id`: string (unique user identifier)
- `email`: string (authentication email)
- `isAnonymous`: boolean (anonymous vs authenticated user)
- `createdAt`: timestamp (account creation time)
- `devices`: DeviceInfo[] (registered devices)
- `syncPreferences`: SyncPreferences (user sync settings)

**Validation Rules**:
- `email` must be valid format for authenticated users
- `isAnonymous` users have limited cross-device sync
- At least one device must be registered

### Sync Operation Entity
**Purpose**: Track sync operations and conflict resolution
**Fields**:
- `id`: string (unique operation identifier)
- `entityType`: string ('exercise', 'user')
- `entityId`: string (ID of entity being synced)
- `operation`: SyncOperationType ('create', 'update', 'delete')
- `localData`: any (local version of data)
- `remoteData`: any (remote version of data, if conflict)
- `status`: SyncOperationStatus ('pending', 'success', 'error', 'conflict')
- `retryCount`: number (number of retry attempts)
- `lastAttempt`: timestamp (last sync attempt time)
- `resolvedAt`: timestamp (when conflict was resolved)
- `resolutionStrategy`: ConflictResolutionStrategy ('last-write-wins', 'manual')

**Validation Rules**:
- `retryCount` must be >= 0 and <= max retry limit
- `resolvedAt` must be set when status is 'success'
- `remoteData` required when status is 'conflict'

### Device Info Entity
**Purpose**: Track devices for multi-device sync
**Fields**:
- `deviceId`: string (unique device identifier)
- `deviceName`: string (user-friendly device name)
- `platform`: Platform ('ios', 'android', 'web')
- `lastSeen`: timestamp (last activity time)
- `isActive`: boolean (currently active device)
- `syncEnabled`: boolean (sync allowed on this device)

### Sync Status Enum
**Values**:
- `pending`: Local changes need to be synced
- `synced`: Data is synchronized with cloud
- `error`: Sync failed, retry needed
- `conflict`: Conflict detected, resolution needed

### Conflict Resolution Strategy Enum
**Values**:
- `last-write-wins`: Use most recent timestamp
- `manual`: Require user intervention

## Test Infrastructure Entities (Constitutional Requirement)

### Test Infrastructure Entity
**Purpose**: Missing test utilities that are causing 80 test failures
**Fields**:
- `testDeviceId`: string (unique identifier for test device simulation)
- `deviceName`: string (human-readable device name like "Device-A")
- `networkStatus`: boolean (online/offline simulation)
- `authState`: AuthenticationState (current authentication status)
- `exercises`: Exercise[] (local exercise data)
- `syncQueue`: SyncOperation[] (pending sync operations)
- `initialized`: boolean (whether device is ready for testing)

**Validation Rules**:
- `deviceName` must be unique within test session
- `networkStatus` controls whether sync operations succeed
- `authState` must be valid for authenticated operations

**State Transitions**:
- Creation: initialized = false, networkStatus = true
- Init: initialized = true, authState = anonymous
- SignUp/SignIn: authState = authenticated
- Cleanup: all state reset to initial values

### Test Data Builder Entity
**Purpose**: Factory pattern for creating test data and mocks
**Fields**:
- `exerciseFactory`: ExerciseDataFactory (creates test exercises)
- `userFactory`: UserDataFactory (creates test users)
- `syncStateFactory`: SyncStateDataFactory (creates sync state records)
- `mockConfig`: MockConfiguration (configuration for mock services)

**Validation Rules**:
- All factories must produce valid, type-safe test data
- Mock configurations must match real service interfaces
- Generated data must be deterministic for test reproducibility

### Test Failure Tracking Entity
**Purpose**: Systematic tracking of the 80 failing tests and their repair status
**Fields**:
- `testId`: string (unique identifier for each failing test)
- `testFile`: string (file path of the failing test)
- `testName`: string (test description/name)
- `failureCategory`: TestFailureCategory (classification of failure type)
- `failureReason`: string (specific error message or reason)
- `repairStatus`: RepairStatus (current status of repair effort)
- `requiredInfrastructure`: string[] (list of missing infrastructure needed)
- `repairPriority`: RepairPriority (urgency/importance of fixing this test)
- `blockedBy`: string[] (other test IDs that must be fixed first)
- `estimatedEffort`: number (estimated hours to repair)
- `assignedTo`: string (developer responsible for repair)
- `lastAttemptedAt`: timestamp (when repair was last attempted)
- `repairedAt`: timestamp (when test was successfully fixed)

**Validation Rules**:
- `testId` must be unique across all failing tests
- `repairStatus` must progress logically (failed → in_progress → testing → completed)
- `requiredInfrastructure` must reference valid infrastructure components
- `estimatedEffort` must be positive number

**State Transitions**:
- Discovery: repairStatus = "failed"
- Assignment: repairStatus = "assigned"
- Work begins: repairStatus = "in_progress"
- Fix implemented: repairStatus = "testing"
- Test passes: repairStatus = "completed"

### Test Failure Category Enum
**Purpose**: Classification system for the 80 failing tests
**Values**:
- `MISSING_INFRASTRUCTURE`: Test requires TestDevice or other missing utilities
- `INCOMPLETE_IMPLEMENTATION`: Test expects functionality not yet implemented
- `MOCK_CONFIGURATION`: Test fails due to inadequate mock setup
- `MODULE_RESOLUTION`: Test fails due to Jest configuration issues
- `CONSTITUTIONAL_FRAMEWORK`: Test fails due to constitutional testing requirements
- `TYPE_SAFETY`: Test fails due to TypeScript validation errors
- `DEPENDENCY_CONFLICT`: Test fails due to conflicting dependencies

### Repair Status Enum
**Purpose**: Tracking repair progress for each failing test
**Values**:
- `failed`: Test is failing, no repair work started
- `triaged`: Test has been analyzed and categorized
- `assigned`: Test has been assigned to a developer
- `in_progress`: Repair work is actively underway
- `testing`: Repair implemented, validating the fix
- `completed`: Test now passes consistently
- `blocked`: Cannot proceed due to dependencies

### Repair Priority Enum
**Purpose**: Prioritization system for test repairs
**Values**:
- `critical`: Blocks other tests or core functionality
- `high`: Important for feature completeness
- `medium`: Standard test that should be fixed
- `low`: Nice to have, can be deferred

## Constitutional Amendment Entities

### Constitutional Test Governance Entity
**Purpose**: Enhanced constitutional requirements specifically for test governance
**Fields**:
- `amendmentId`: string (unique identifier for this amendment)
- `section`: "Testing (NON-NEGOTIABLE)" (constitutional section being enhanced)
- `newRequirements`: string[] (enhanced test requirements)
- `enforcementMechanisms`: TestEnforcementMechanism[] (how requirements are enforced)
- `gracePeriodDays`: number (transition time before full enforcement)
- `exemptions`: TestExemption[] (temporary exemptions during repair)

**New Constitutional Requirements**:
- "All tests MUST pass before any commit to main branch"
- "Test failures MUST be tracked systematically with repair timelines"
- "Test infrastructure MUST be implemented before tests that depend on it"
- "Mock implementations MUST match real service interfaces with TypeScript validation"
- "Test regression prevention MUST be enforced through CI/CD pipeline"
- "Test failure root cause analysis MUST be documented for future prevention"

### Test Enforcement Mechanism Entity
**Purpose**: Specific enforcement mechanisms for test governance
**Fields**:
- `mechanismType`: TestEnforcementType (type of enforcement)
- `triggerCondition`: string (when this enforcement activates)
- `action`: EnforcementAction (what happens when triggered)
- `configuration`: EnforcementConfig (parameters for this mechanism)

**Enforcement Types**:
- `PRE_COMMIT_TEST_VALIDATION`: Run tests before allowing commits
- `CI_PIPELINE_BLOCKING`: Block CI pipeline on test failures
- `TEST_REGRESSION_DETECTION`: Detect and prevent new test failures
- `INFRASTRUCTURE_DEPENDENCY_CHECK`: Ensure test infrastructure exists before tests
- `MOCK_INTERFACE_VALIDATION`: Validate mocks match real interfaces

### Test Infrastructure Configuration Entity
**Purpose**: Configuration for Jest and test environment
**Fields**:
- `jestConfig`: JestConfiguration (Jest-specific settings)
- `mockStrategy`: MockStrategy (approach to mocking services)
- `testEnvironment`: TestEnvironmentConfig (environment setup)
- `coverageRequirements`: CoverageThresholds (constitutional coverage requirements)
- `infrastructurePaths`: InfrastructurePaths (paths to test utilities and mocks)

**Validation Rules**:
- Jest configuration must support React Native Expo environment
- Mock strategy must provide complete mock implementations
- Coverage requirements must align with constitutional mandates
- Infrastructure paths must exist and be accessible to all tests

## Configuration Entities

### Jest Enhanced Configuration Entity
**Purpose**: Enhanced Jest configuration to support test infrastructure and constitutional requirements
**Fields**:
- `preset`: "jest-expo" (React Native Expo preset)
- `transformIgnorePatterns`: string[] (modules to transform)
- `setupFilesAfterEnv`: string[] (setup files for test environment)
- `globalSetup`: string (global setup file for constitutional validation)
- `testEnvironment`: "jsdom" (test environment)
- `coverageThreshold`: CoverageThresholdConfig (constitutional coverage requirements)
- `testPathIgnorePatterns`: string[] (patterns to ignore)
- `moduleFileExtensions`: string[] (supported file extensions)
- `testMatch`: string[] (test file patterns)

**Constitutional Coverage Thresholds**:
- Global: 80% branches, functions, lines, statements
- Test Infrastructure: 95% branches, functions, lines, statements
- Constitutional Framework: 95% branches, functions, lines, statements

### Mock Factory Configuration Entity
**Purpose**: Configuration for systematic mock creation to fix failing tests
**Fields**:
- `firebaseMocks`: FirebaseMockConfig (Firebase service mocks)
- `supabaseMocks`: SupabaseMockConfig (Supabase service mocks)
- `reactNativeMocks`: ReactNativeMockConfig (React Native module mocks)
- `testUtilityMocks`: TestUtilityMockConfig (custom test utility mocks)
- `authMocks`: AuthenticationMockConfig (authentication service mocks)

**Validation Rules**:
- All mocks must implement complete interfaces with TypeScript validation
- Mock responses must be deterministic for test reproducibility
- Mock configurations must be easily switchable between test and real implementations

## Test Infrastructure Implementation Plan

### Missing Infrastructure Components (Priority 1)
**Required for fixing 80 failing tests**:

1. **TestDevice Class** (`/home/rob/Documents/Github/strength-assistant/lib/test-utils/TestDevice.ts`)
   - Device simulation with network status control
   - Authentication state management
   - Exercise CRUD operations
   - Sync status tracking and simulation
   - Real-time subscription management

2. **Mock Factories** (`/home/rob/Documents/Github/strength-assistant/lib/test-utils/mocks/`)
   - ExerciseMockFactory: Creates test exercise data
   - UserMockFactory: Creates test user accounts
   - SyncStateMockFactory: Creates sync state records
   - ServiceMockFactory: Creates service mocks (Firebase, Supabase)

3. **Test Data Builders** (`/home/rob/Documents/Github/strength-assistant/lib/test-utils/builders/`)
   - ExerciseBuilder: Fluent API for creating test exercises
   - UserBuilder: Fluent API for creating test users
   - ScenarioBuilder: Creates complex test scenarios

4. **Enhanced Jest Configuration**
   - Updated transformIgnorePatterns for all dependencies
   - Proper mock setup and teardown
   - Constitutional validation integration
   - Improved module resolution

### Constitutional Framework Integration (Priority 2)
**Enhanced governance to prevent future test regressions**:

1. **Test Constitution Amendment**
   - Formal amendment to project constitution
   - Mandatory test passing requirements
   - Enforcement mechanisms definition
   - Grace period for current failing tests

2. **Automated Enforcement**
   - Pre-commit hooks for test validation
   - CI/CD pipeline integration
   - Test regression detection
   - Automated reporting and alerting

## Relationships

```
TestFailureTracking (1) ←→ (many) RequiredInfrastructure
TestFailureTracking (many) ←→ (many) TestFailureTracking (blocking relationships)
ConstitutionalTestGovernance (1) ←→ (many) TestEnforcementMechanism
TestInfrastructureEntity (1) ←→ (many) TestDataBuilder
MockFactoryConfiguration (1) ←→ (many) TestInfrastructureEntity
JestEnhancedConfiguration (1) ←→ (1) ConstitutionalTestGovernance
```

## Success Metrics

### Immediate Success Metrics (Week 1)
- All 80 failing tests catalogued and triaged
- TestDevice infrastructure implemented
- Basic mock factories created
- At least 20 tests passing

### Short-term Success Metrics (Month 1)
- All 80 tests passing consistently
- Constitutional amendment enacted
- Full test infrastructure implemented
- Zero test regressions in CI/CD

### Long-term Success Metrics (Quarter 1)
- Test coverage above constitutional thresholds
- Automated test regression prevention
- Full constitutional compliance
- Test infrastructure used for new feature development

## Migration Strategy

### Phase 1: Emergency Repair (Week 1)
- Implement minimal TestDevice to unblock tests
- Create basic mock configurations
- Fix Jest configuration issues
- Target critical and high priority failures

### Phase 2: Infrastructure Completion (Week 2-3)
- Complete TestDevice implementation
- Build comprehensive mock factories
- Implement test data builders
- Fix all remaining test failures

### Phase 3: Constitutional Enhancement (Week 4)
- Draft and review constitutional amendment
- Implement automated enforcement mechanisms
- Enable full constitutional compliance
- Document test governance framework

### Phase 4: Prevention and Monitoring (Ongoing)
- Monitor for test regressions
- Continuous improvement of test infrastructure
- Regular constitutional compliance audits
- Test framework evolution and enhancement