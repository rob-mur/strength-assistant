# Quickstart: TypeScript Testing Infrastructure & Constitution Enhancement

## 🚨 CRITICAL OBJECTIVE
**Primary Goal**: Ensure `devbox run test` consistently passes with proper TypeScript validation, preventing the regression of compilation errors that block the entire test suite.

## Prerequisites
- Devbox installed (`curl -fsSL https://get.jetpack.io/devbox | bash`)
- Git hooks capability
- IDE with TypeScript support

## Setup Instructions

### 1. Validate Current Testing Pipeline Status
```bash
# First, check current status of the critical test command
devbox run test

# Expected: Should pass completely, or identify specific TypeScript errors
# If failing: This is the CRITICAL ISSUE we're solving
```

### 2. Initialize Enhanced Development Environment
```bash
# Enter reproducible development shell
devbox shell

# Verify TypeScript installation and configuration
npx tsc --version
cat tsconfig.json

# Check current TypeScript compilation status
npx tsc --noEmit --incremental false
```

### 3. Configure Constitutional Enforcement
Create pre-commit hook configuration:
```bash
# Install pre-commit hook that validates TypeScript
npm install --save-dev husky
npx husky install

# Add pre-commit TypeScript validation
npx husky add .husky/pre-commit "npx tsc --noEmit"
npx husky add .husky/pre-commit "devbox run test"
```

### 4. Verify TypeScript Strict Mode Configuration
Update `tsconfig.json` to enforce constitutional requirements:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "skipLibCheck": false,
    "noEmit": true
  },
  "include": [
    "app/**/*",
    "lib/**/*", 
    "__tests__/**/*"
  ],
  "exclude": [
    "node_modules",
    "coverage"
  ]
}
```

## Constitutional Validation Journey

### Scenario 1: TypeScript Compilation Enforcement
**Goal**: Verify TypeScript errors are caught before they reach the testing pipeline

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