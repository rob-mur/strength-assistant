# Research: Android Production Stack Overflow Analysis

**Date**: 2025-10-20  
**Feature**: 012-production-bug-android  
**Focus**: Identify potential causes of "maximum call stack size reached" in production Android builds

## Problem Analysis

### Environment Difference Investigation

The bug appears only on real Android devices, not in CI validation, suggesting:
- Different JavaScript engines (V8 in CI vs JSC/Hermes on Android)
- Different memory constraints on real devices
- Different execution contexts or timing
- Production-specific configurations not present in CI

### Codebase Analysis Results

#### 1. Complex Error Logging System Discovery

The codebase has an extensive error logging system with multiple layers:
- `DefaultLoggingService`: Core logging with configurable buffer (500-2000 entries)
- `DefaultErrorHandler`: Global error handling with retry mechanisms
- `LoggingServiceFactory`: Singleton factory with complex initialization
- Multiple error recovery systems and global error handlers

**Key Finding**: The logging system uses **nested catch blocks** that could create recursive error logging scenarios.

#### 2. Potential Recursive Patterns Identified

**Theory A: Error Handler Recursion**
- `DefaultErrorHandler.setupGlobalErrorHandlers()` sets up multiple global handlers
- If an error occurs within the error handler itself, it could trigger the global handler again
- Evidence: Lines 434-443 in DefaultErrorHandler.ts show error handling within error handlers

**Theory B: Logging Service Circular References**
- LoggingServiceFactory uses singleton pattern with complex initialization
- If initialization fails and gets retried, could create circular dependency
- Evidence: Factory getInstance() method could be called during error logging initialization

**Theory C: Recovery Action Loops**  
- Error recovery system attempts automatic retries with exponential backoff
- If recovery action itself throws errors, could create infinite retry loops
- Evidence: `executeWithRetry()` method has while(true) loop with error handling

**Theory D: Global Handler Collision**
- Multiple error handling systems registering global handlers
- React Native ErrorUtils + Process handlers + Window handlers
- Evidence: setupReactNativeErrorHandlers(), setupNodeErrorHandlers(), setupBrowserErrorHandlers()

#### 3. Production-Specific Conditions

**Memory Pressure Theory**:
- Production buffers are smaller (500 vs 2000 in dev)
- Real device memory constraints trigger different code paths
- JSON.stringify operations on large error contexts

**Timing Theory**:
- Production environment has different async timing
- Error handlers might be called during initialization phases
- React Native bridge timing differences

## Research Findings

### Decision: Replace Complex System with Simple Error Blocking

**Rationale**: The 750-line DefaultErrorHandler is causing more problems than it solves. Instead of fixing recursion, eliminate it entirely with a simple error blocking system that ensures Maestro tests catch uncaught errors.

**Alternatives Considered**:
1. Stack overflow detection system - adds complexity without solving root cause
2. Recursion prevention guards - still maintains complex error handling
3. Circuit breakers - unnecessary complexity for the actual problem

### Core Problems Identified

1. **Complex Error Handling System** (`DefaultErrorHandler.ts` - 750+ lines)
   - Multiple global handlers (browser, Node, React Native)
   - Nested error handling within error handlers
   - Complex retry mechanisms with while(true) loops
   - Recovery systems that can fail and trigger more errors

2. **Hidden Test Failures**
   - React Native ErrorUtils may swallow errors
   - Maestro tests pass even when uncaught errors occur
   - Production validation doesn't catch real device issues

3. **Recursion Sources**
   - Error logging during error handler initialization
   - Factory singleton initialization during error states
   - Recovery actions throwing errors during retry loops

### Solution: Simple Error Blocking System

**Core Components**:
1. **ErrorBlocker React Component**: Overlays entire app when uncaught errors occur
2. **Simple Error Logger**: Replace 750-line handler with basic console logging
3. **Maestro Error Detection**: Test IDs that Maestro can check for uncaught errors
4. **App State Blocking**: Prevent any user interaction when errors occur

**Key Advantages**:
- Eliminates all recursion potential
- Makes uncaught errors visible to Maestro tests
- Works with production APKs (no NODE_ENV dependency)
- Minimal code complexity (~100 lines vs 750+)
- Non-breaking changes to existing functionality

## Implementation Strategy

### Phase 1: Remove Complex Error Handling
1. Delete 750-line DefaultErrorHandler.ts
2. Remove complex LoggingServiceFactory singleton
3. Replace with simple console.error logging

### Phase 2: Add Error Blocking Component
1. Create ErrorBlocker React component with app overlay
2. Integrate with React Native ErrorUtils
3. Add testID attributes for Maestro detection

### Phase 3: Update Maestro Tests
1. Add error blocker checks to existing flows
2. Ensure tests fail when uncaught errors occur
3. Test production APK error detection

### Phase 4: Production Validation
1. Test on real Android devices
2. Verify error blocking works under memory pressure
3. Confirm Maestro tests catch previously hidden failures

## Technical Debt Removed

- 750+ lines of complex error handling code
- Multiple global error handler registrations
- Nested error handling within error handlers
- Complex retry and recovery mechanisms
- Singleton factory initialization complexity