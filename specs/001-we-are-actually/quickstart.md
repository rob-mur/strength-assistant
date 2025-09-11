# Quickstart: Local First Storage with Backup

## Prerequisites
- Devbox installed (`curl -fsSL https://get.jetpack.io/devbox | bash`)
- Supabase project configured
- Firebase project configured (for migration period)

## Setup Instructions

### 1. Initialize Development Environment
```bash
# Enter reproducible development shell
devbox shell

# Install dependencies (handled by devbox.json)
# This ensures identical versions across all environments
devbox run install
```

### 2. Environment Configuration
Create or update `.env` file:
```
# Supabase configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_USE_SUPABASE_EMULATOR=false
EXPO_PUBLIC_SUPABASE_EMULATOR_HOST=127.0.0.1
EXPO_PUBLIC_SUPABASE_EMULATOR_PORT=54321

# Feature flag for data layer migration
USE_SUPABASE_DATA=false

# Development flags
EXPO_PUBLIC_USE_EMULATOR=false
```

### 3. Initialize Legend State Store
```typescript
import { observable } from "@legendapp/state"
import { configureObservableSync } from "@legendapp/state/sync"

// Initialize the exercise store
export const exerciseStore = observable({
  exercises: {},
  user: null,
  syncState: {
    isOnline: true,
    isSyncing: false,
    pendingChanges: 0,
    errors: []
  }
})

// Feature flag reads from environment
const useSupabaseData = process.env.USE_SUPABASE_DATA === 'true'
```

## User Journey Validation

### Scenario 1: Anonymous User Local-First Experience
**Goal**: Verify immediate data operations without cloud dependency

1. **Start app without internet connection**
   ```bash
   # Simulate offline mode
   npm run ios -- --offline
   ```

2. **Create exercise records**
   - Open app, navigate to exercise creation
   - Add exercise "Push-ups"
   - Verify immediate UI update (no loading states)
   - Add exercise "Squats" 
   - Verify both exercises visible in list

3. **Restart app offline**
   - Kill and restart app
   - Verify both exercises still present
   - Confirms local persistence working

4. **Go online and verify sync status**
   - Enable internet connection
   - Verify sync status icon appears
   - For anonymous users: exercises remain local only

**Expected Results**:
- ✅ Immediate UI feedback for all operations
- ✅ Data persists across app restarts
- ✅ No network dependency for core functionality
- ✅ Clear sync status indication

### Scenario 2: Authenticated User Cross-Device Sync
**Goal**: Verify cloud backup and multi-device consistency

1. **Create account and exercises on Device A**
   ```typescript
   // Sign up with email
   await exerciseActions.signUp("user@example.com", "password123")
   
   // Add exercises
   await exerciseActions.addExercise("Bench Press")
   await exerciseActions.addExercise("Deadlift")
   ```

2. **Verify cloud sync**
   - Check sync status icon shows "synced"
   - Verify exercises visible in Supabase dashboard (when using Supabase)

3. **Sign in on Device B**
   ```typescript
   await exerciseActions.signIn("user@example.com", "password123")
   ```

4. **Verify data consistency**
   - Confirm both exercises appear on Device B
   - Modify "Bench Press" to "Incline Bench Press" on Device B
   - Verify change syncs to Device A
   - Confirm last-write-wins conflict resolution

**Expected Results**:
- ✅ Account creation and authentication works
- ✅ Exercises sync across devices
- ✅ Real-time updates on both devices
- ✅ Conflict resolution works correctly

### Scenario 3: Feature Flag Migration Testing
**Goal**: Verify seamless switching between Firebase and Supabase

1. **Start with Firebase backend**
   ```bash
   # Set environment variable to use Firebase
   export USE_SUPABASE_DATA=false
   devbox run start
   ```

2. **Create test data**
   - Sign up and create 5 exercises
   - Verify data in Firebase console

3. **Switch to Supabase backend**
   ```bash
   # Set environment variable to use Supabase
   export USE_SUPABASE_DATA=true
   devbox run start
   ```

4. **Validate data migration** (if migration logic implemented)
   ```typescript
   const result = await exerciseActions.validateConsistency()
   console.log('Consistency check:', result)
   ```

5. **Verify functionality unchanged**
   - Create new exercise
   - Verify CRUD operations work identically
   - Verify authentication flow unchanged
   - Check data appears in Supabase dashboard

**Expected Results**:
- ✅ App behavior identical with both Firebase and Supabase backends
- ✅ Data consistency maintained during migration
- ✅ No user-facing disruption during backend changes
- ✅ All functionality works with both USE_SUPABASE_DATA=true and USE_SUPABASE_DATA=false

## Testing Commands

### 🚨 MANDATORY SUCCESS CRITERIA

**BEFORE DECLARING IMPLEMENTATION COMPLETE:**
```bash
# This command MUST pass successfully
devbox run test
```

This comprehensive test suite includes:
- ✅ Package lock validation
- ✅ TypeScript compilation  
- ✅ ESLint code quality
- ✅ Prettier formatting
- ✅ Jest unit tests

### Additional Test Commands

```bash
# All commands run within devbox for consistency
devbox shell

# Integration tests (can be run in CI due to speed)
devbox run test:integration

# E2E tests (can be run in CI due to speed)
devbox run test:e2e

# Feature flag specific tests
devbox run test -- --testNamePattern="feature.flag"

# Migration tests
devbox run test -- --testNamePattern="migration"

# CI simulation (exact same environment as CI)
devbox run ci
```

### Test Success Validation

After each implementation phase:
1. Run `devbox run test`
2. Fix any failures immediately
3. Do not proceed to next phase until all tests pass
4. Integration tests can be slower and run in CI, but unit tests must pass locally

## Performance Validation

### Response Time Benchmarks
- Exercise creation: < 50ms (local-first)
- Exercise list load: < 100ms (from local cache)
- Sync operation: < 2s (background, non-blocking)

### Memory Usage
- Local storage: < 1MB for typical usage (100 exercises)
- Runtime memory: < 10MB additional overhead from Legend State

## Troubleshooting

### Common Issues
1. **Sync not working**: Check network connectivity and Supabase credentials
2. **Data inconsistency**: Run `validateConsistency()` and check migration phase
3. **Performance issues**: Verify operations are hitting local storage first
4. **Feature flag not switching**: Clear app cache and restart

### Debug Commands
```bash
# View Legend State debug info
npx expo start --dev-client --clear

# View sync queue status
# Available in dev tools console: exerciseStore.syncState.get()

# Reset local storage (testing only)
# Available in dev tools: await AsyncStorage.clear()
```