# Data Model: Simple Error Blocking System

**Date**: 2025-10-20  
**Feature**: 012-production-bug-android  

## Entities

### ErrorBlockerState
**Purpose**: Tracks uncaught errors and controls app blocking overlay
**Fields**:
- `hasUncaughtError: boolean` - Whether any uncaught error has occurred
- `errorCount: number` - Total number of uncaught errors detected
- `lastError: string` - Message from the most recent error
- `lastErrorTimestamp: string` - ISO timestamp of last error
- `isBlocking: boolean` - Whether the overlay is currently blocking the app

**Validation Rules**:
- errorCount must be >= 0
- hasUncaughtError must be true if errorCount > 0
- lastError must not be empty if hasUncaughtError is true
- isBlocking should equal hasUncaughtError

**State Transitions**:
- `NORMAL` → `BLOCKED` when first uncaught error occurs
- `BLOCKED` → `BLOCKED` when additional errors occur (increment count)
- No transition back to NORMAL (requires app restart)

### SimpleErrorLog
**Purpose**: Basic error logging without complex handling
**Fields**:
- `message: string` - Error message
- `context: string` - Operation context where error occurred
- `timestamp: string` - ISO timestamp when logged
- `stack?: string` - Optional stack trace

**Validation Rules**:
- message must not be empty
- context must not be empty
- timestamp must be valid ISO string

**Relationships**:
- Created by SimpleErrorLogger.logError()
- No persistence or complex processing

### MaestroErrorIndicator
**Purpose**: UI elements that Maestro tests can detect
**Fields**:
- `testID: string` - React Native testID for Maestro detection
- `isVisible: boolean` - Whether the error indicator is currently visible
- `errorCount: number` - Number of errors for display in test
- `errorMessage: string` - Current error message for debugging

**Validation Rules**:
- testID must be one of: "maestro-error-blocker", "maestro-error-count", "maestro-error-message"
- isVisible should be true only when errors exist
- errorCount must match ErrorBlockerState.errorCount

## Data Relationships

```
ErrorBlockerState
    ↓ controls
MaestroErrorIndicator (UI)
    ↓ detectable by
Maestro Tests
    ↓ fail when
Uncaught Errors occur

SimpleErrorLog
    ↓ created by
SimpleErrorLogger
    ↓ triggers
ErrorBlockerState update
```

## Storage Requirements

### In-Memory Storage
- ErrorBlockerState: Single global state, React useState
- SimpleErrorLog: Console output only, no persistence
- MaestroErrorIndicator: React component state

### No Persistent Storage
- No AsyncStorage requirements
- No complex error event persistence
- Console logs sufficient for debugging

## Performance Considerations

### Memory Usage
- ErrorBlockerState: ~50 bytes total
- SimpleErrorLog: ~20 bytes per log entry (console only)
- MaestroErrorIndicator: ~30 bytes per component
- Total system overhead: <1KB

### CPU Overhead
- Error state update: <0.01ms per error
- Simple logging: <0.001ms per call
- React component render: <1ms when error occurs
- Target total overhead: <0.01ms per operation (100x improvement)

## Integration Points

### React Native Integration
- Uses React Native ErrorUtils for global error capture
- Integrates with app/_layout.tsx as root wrapper
- Compatible with existing Expo/React Native patterns
- Works with production APK builds

### Maestro Integration
- testID attributes for reliable test element detection
- Error blocker prevents test progression when errors occur
- Compatible with existing .maestro/android/*.yml flows

## Migration Strategy

### Phase 1: Remove Complex System (Breaking but Safe)
- Delete DefaultErrorHandler.ts (750+ lines)
- Remove LoggingServiceFactory complexity
- Replace with SimpleErrorLogger (~20 lines)

### Phase 2: Add Error Blocker (Non-Breaking)
- Create ErrorBlocker React component
- Wrap app in _layout.tsx
- Add testID attributes for Maestro

### Phase 3: Update Maestro Tests (Enhancement)
- Add error blocker checks to existing flows
- Ensure tests fail when uncaught errors occur

### Phase 4: Production Validation (Verification)
- Test on real Android devices
- Verify Maestro catches previously hidden errors
- Confirm no performance regression