# Tasks: Local First Storage with Backup Migration

**Branch**: `001-we-are-actually` | **Generated**: 2025-09-12 | **Source**: [plan.md](./plan.md)
**Input**: Design documents from `/home/rob/Documents/Github/strength-assistant/specs/001-we-are-actually/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

## Tech Stack Summary
- **Language**: TypeScript with React Native Expo
- **Storage**: Supabase (PostgreSQL) + Legend State (local-first sync)
- **Testing**: Jest with React Native Testing Library
- **Architecture**: Mobile app with dual Firebase/Supabase backend support
- **Critical**: Memory optimization required for `devbox run test` execution

## 🚨 PHASE 0: CRITICAL MEMORY OPTIMIZATION (Priority 0)
**MUST COMPLETE FIRST** - These tasks address the memory crash in `devbox run test`

### Memory Analysis & Optimization
- [ ] **T001** [P] Analyze AuthAwareLayout test memory usage in `__tests__/components/AuthAwareLayout.test.ts`
- [ ] **T002** [P] Profile TypeScript integration pipeline memory in Jest configuration
- [ ] **T003** [P] Optimize Jest configuration for single-threaded execution in `jest.config.js`
- [ ] **T004** [P] Implement test cleanup protocols in `jest.setup.js`

### Test Infrastructure Foundation
- [ ] **T005** [P] Create TestDevice class in `lib/test-utils/TestDevice.ts`
- [ ] **T006** [P] Create TestApp class in `lib/test-utils/TestApp.ts`  
- [ ] **T007** [P] Create test utilities directory structure `lib/test-utils/`
- [ ] **T008** [P] Implement memory-optimized TestDevicePool in `lib/test-utils/TestDevicePool.ts`

## Critical Objective
**Primary Goal**: Migrate from Firebase to Supabase with local-first storage architecture while maintaining constitutional test compliance and preventing memory exhaustion through sequential processing.

## 🚨 MEMORY MANAGEMENT REQUIREMENTS
- **SEQUENTIAL EXECUTION ONLY**: Tasks must NEVER run in parallel to prevent memory exhaustion
- **Memory Budget**: Maximum 8GB per task, 32GB total system usage
- **Task Isolation**: Complete one task before starting the next
- **Garbage Collection**: Force GC between memory-intensive tasks
- **Monitoring**: Log memory usage and warn at 6GB threshold

## Execution Strategy
- **Constitutional Compliance First**: Ensure all tests pass before feature work
- **Sequential Processing**: Execute tasks one by one, never in parallel
- **Local-First Foundation**: Implement offline-first architecture with Legend State
- **Gradual Migration**: Feature flag approach for safe Firebase to Supabase transition
- **Memory Safe**: Monitor and manage memory usage throughout implementation

## Task List (Sequential Execution Required)

**⚠️ CRITICAL**: Execute tasks ONE AT A TIME. Never run tasks in parallel to prevent memory exhaustion.

## Phase 1: Constitutional Compliance (Memory: ~6GB total)

### T001 - Fix Test Infrastructure - TestDevice Implementation
**Status**: pending  
**Estimated Duration**: 2 hours  
**Memory Estimate**: ~3GB
**Priority**: Critical (blocking 80 failing tests)  
**Description**: Implement missing TestDevice class to unblock constitutional test failures
**Path**: `lib/test-utils/TestDevice.ts`
**Dependencies**: None
**Contract**: Based on `contracts/test-infrastructure.ts`
**Acceptance Criteria**:
- Create `lib/test-utils/` directory if not exists
- Implement complete TestDevice class with device simulation
- Support network status control and authentication state management
- Include exercise CRUD operations and sync status tracking
- Add proper cleanup and initialization methods
- Ensure TypeScript strict mode compliance

### T002 - Fix Test Infrastructure - TestApp Implementation  
**Status**: pending  
**Estimated Duration**: 1.5 hours
**Memory Estimate**: ~2GB
**Priority**: Critical (blocking 80 failing tests)
**Description**: Implement missing TestApp class for app context mocking
**Path**: `lib/test-utils/TestApp.ts`
**Dependencies**: T001
**Contract**: Based on `contracts/test-infrastructure.ts`
**Acceptance Criteria**:
- Implement TestApp class with app context simulation
- Support mock navigation and theme providers
- Include authentication context mocking
- Add proper setup and teardown methods
- Ensure compatibility with existing test files

### T003 - Validate Constitutional Compliance
**Status**: pending  
**Estimated Duration**: 30 minutes
**Memory Estimate**: ~6GB (test execution)
**Priority**: Critical (constitutional gate)
**Description**: Ensure all tests pass before proceeding with feature implementation
**Command**: `devbox run test`
**Dependencies**: T001, T002
**Acceptance Criteria**:
- All 80 tests must pass without failures
- TypeScript compilation must succeed (`npx tsc --noEmit`)
- No test timeouts or infrastructure errors
- Constitutional requirement satisfied before feature work

## Phase 2: Local-First Storage Foundation (Memory: ~12GB total)

### T004 - Install and Configure Legend State
**Status**: pending  
**Estimated Duration**: 45 minutes
**Memory Estimate**: ~2GB
**Priority**: High (local-first foundation)
**Description**: Install Legend State and configure for local-first data persistence
**Path**: `package.json`, `lib/data/legend-state/config.ts`
**Dependencies**: T003 (constitutional gate passed)
**Contract**: Based on `contracts/legend-state-config.ts`
**Acceptance Criteria**:
- Install @legendapp/state and related dependencies
- Configure Legend State for React Native with persistence
- Set up basic store configuration with sync capabilities
- Configure TypeScript types for Legend State
- Ensure compatibility with existing Firebase data layer

### T005 - Implement Enhanced Exercise Model
**Status**: pending  
**Estimated Duration**: 1 hour
**Memory Estimate**: ~2GB
**Priority**: High (core data model)
**Description**: Enhance existing Exercise model with local-first and sync capabilities
**Path**: `lib/models/Exercise.ts`
**Dependencies**: T004
**Contract**: Based on `data-model.md` Exercise Entity specification
**Acceptance Criteria**:
- Add syncStatus, syncedAt, deviceOrigin, userId fields to Exercise interface
- Implement validation rules for new fields
- Add state transition logic for sync states
- Ensure backward compatibility with existing Exercise usage
- Update TypeScript types throughout codebase

### T006 - Implement Sync Operation Tracking
**Status**: pending  
**Estimated Duration**: 1.5 hours
**Memory Estimate**: ~3GB
**Priority**: High (sync management)
**Description**: Create sync operation tracking system for conflict resolution
**Path**: `lib/models/SyncOperation.ts`, `lib/services/SyncManager.ts`
**Dependencies**: T005
**Contract**: Based on `data-model.md` Sync Operation Entity specification
**Acceptance Criteria**:
- Implement SyncOperation interface with all fields and validation
- Create SyncManager service for tracking and resolving conflicts
- Implement last-write-wins conflict resolution strategy
- Add retry logic with exponential backoff
- Include sync queue management with persistence

### T007 - Implement Local-First Exercise Operations
**Status**: pending  
**Estimated Duration**: 2 hours
**Memory Estimate**: ~4GB
**Priority**: High (core functionality)
**Description**: Implement offline-first exercise CRUD operations with immediate UI feedback
**Path**: `lib/services/ExerciseService.ts`, `lib/hooks/useExercises.ts`
**Dependencies**: T006
**Acceptance Criteria**:
- Modify ExerciseService to prioritize local operations
- Implement immediate local persistence with Legend State
- Queue sync operations for background processing
- Update useExercises hook to use local-first data
- Ensure <50ms response time for local operations
- Maintain compatibility with existing UI components

## Phase 3: Supabase Backend Integration (Memory: ~10GB total)

### T008 - Setup Supabase Client Configuration
**Status**: pending  
**Estimated Duration**: 1 hour
**Memory Estimate**: ~2GB
**Priority**: High (cloud backend)
**Description**: Configure Supabase client for React Native with proper authentication
**Path**: `lib/data/supabase/client.ts`, `lib/data/supabase/config.ts`
**Dependencies**: T007
**Acceptance Criteria**:
- Install @supabase/supabase-js for React Native
- Configure Supabase client with environment variables
- Set up authentication with email/password and anonymous modes
- Configure real-time subscriptions for exercise data
- Implement proper error handling and retry logic

### T009 - Implement Supabase Storage Backend
**Status**: pending  
**Estimated Duration**: 2.5 hours
**Memory Estimate**: ~4GB
**Priority**: High (backend implementation)
**Description**: Implement complete Supabase backend following storage interface contract
**Path**: `lib/data/supabase/SupabaseStorage.ts`
**Dependencies**: T008
**Contract**: Based on `contracts/storage-interface.ts`
**Acceptance Criteria**:
- Implement all StorageBackend interface methods for Supabase
- Support exercise CRUD operations with proper error handling
- Implement user authentication methods (email, anonymous)
- Add real-time subscription support for exercises
- Include sync state management and conflict resolution
- Ensure TypeScript strict compliance

### T010 - Implement Feature Flag System
**Status**: pending  
**Estimated Duration**: 1.5 hours
**Memory Estimate**: ~2GB
**Priority**: High (migration safety)
**Description**: Implement feature flag system for safely switching between Firebase and Supabase
**Path**: `lib/services/FeatureFlagService.ts`, `lib/data/StorageManager.ts`
**Dependencies**: T009
**Contract**: Based on `contracts/storage-interface.ts` FeatureFlags interface
**Acceptance Criteria**:
- Implement feature flag service with USE_SUPABASE_DATA environment variable
- Create StorageManager that delegates to active backend
- Ensure seamless switching between Firebase and Supabase
- Add data consistency validation methods
- Implement runtime backend switching without app restart

### T011 - Implement Data Migration Utilities
**Status**: pending  
**Estimated Duration**: 2 hours
**Memory Estimate**: ~5GB
**Priority**: Medium (migration support)
**Description**: Create utilities for migrating user data from Firebase to Supabase
**Path**: `lib/services/MigrationService.ts`
**Dependencies**: T010
**Acceptance Criteria**:
- Implement user data export from Firebase
- Create Supabase data import with validation
- Add data consistency checking between backends
- Implement incremental migration for large datasets
- Include rollback capabilities for failed migrations
- Add progress tracking and error reporting

## Phase 4: Sync Status and Polish (Memory: ~8GB total)

### T012 - Implement Sync Status Indicator
**Status**: pending  
**Estimated Duration**: 1 hour
**Memory Estimate**: ~2GB
**Priority**: Medium (user experience)
**Description**: Add visual sync status indicator to show sync progress to users
**Path**: `lib/components/SyncStatusIcon.tsx`, `app/(tabs)/exercises/index.tsx`
**Dependencies**: T011
**Acceptance Criteria**:
- Create SyncStatusIcon component with pending/synced/error states
- Integrate sync status into exercise list UI
- Show real-time sync progress without blocking UI
- Add accessibility support for sync status
- Ensure consistent design with app theme

### T013 - Performance Optimization and Testing
**Status**: pending  
**Estimated Duration**: 2 hours
**Memory Estimate**: ~4GB
**Priority**: Medium (performance goals)
**Description**: Optimize performance and validate response time requirements
**Path**: Various performance-critical files
**Dependencies**: T012
**Acceptance Criteria**:
- Validate <50ms response time for local operations
- Optimize Legend State configuration for performance
- Implement efficient sync queue processing
- Add performance monitoring and metrics
- Validate memory usage stays within constitutional limits

### T014 - Integration Testing and Validation
**Status**: pending  
**Estimated Duration**: 1.5 hours
**Memory Estimate**: ~6GB
**Priority**: Medium (quality assurance)
**Description**: Run comprehensive integration tests and validate quickstart scenarios
**Command**: `devbox run test`, validate quickstart scenarios from `quickstart.md`
**Dependencies**: T013
**Acceptance Criteria**:
- All constitutional tests must pass (`devbox run test`)
- Execute all quickstart scenarios successfully
- Validate offline/online functionality
- Test multi-device sync scenarios
- Verify feature flag switching works correctly
- Confirm data migration utilities function properly

## Memory Management Guidelines

**Before Starting Each Task**:
1. Check available memory: `free -h`
2. Close unnecessary applications
3. Ensure previous task completed and GC ran

**During Task Execution**:
1. Monitor memory usage: `top` or `htop`
2. Stop task if memory usage exceeds 8GB
3. Force garbage collection if available

**After Completing Each Task**:
1. Run garbage collection if applicable
2. Verify task completion criteria met
3. Update task status before proceeding

**Emergency Memory Protocol**:
If memory usage approaches 32GB:
1. Stop current task immediately
2. Save progress and close development tools
3. Restart development environment
4. Resume from last completed task

---

## Task Execution Summary

**Total Tasks**: 14 tasks across 4 phases
**Estimated Duration**: ~20 hours total
**Memory Budget**: Maximum 8GB per task, 32GB system limit
**Critical Path**: T001 → T002 → T003 (constitutional compliance) → T004-T014 (sequential feature implementation)

**Success Criteria**:
- All 80 tests pass before feature work begins
- Local-first storage with <50ms response times
- Seamless Firebase to Supabase migration
- Memory usage stays within constitutional limits
- Sequential execution prevents memory exhaustion
