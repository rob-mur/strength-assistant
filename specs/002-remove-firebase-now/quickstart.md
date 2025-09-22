# Firebase Removal Quickstart Guide

**Date**: 2025-09-19  
**Estimated Time**: 2-3 hours  
**Difficulty**: Medium  
**Prerequisites**: Supabase implementation working and tested

## Overview

This quickstart guide walks through the complete removal of Firebase from the React Native/Expo strength training application, ensuring all functionality continues working through Supabase.

## Prerequisites Check

Before starting, verify these requirements:

```bash
# 1. Ensure Supabase is working
export USE_SUPABASE_DATA=true
npm test

# 2. Run integration tests
devbox run test

# 3. Run Maestro tests
devbox run maestro-test

# All tests should pass before proceeding
```

## Quick Start Steps

### Step 1: Pre-Removal Validation (5 minutes)

```bash
# Verify current state
git status
git log --oneline -5

# Test Supabase functionality
npm test -- --testNamePattern="Supabase"
devbox run test
```

**Expected**: All Supabase tests pass, application works normally

### Step 2: Remove Package Dependencies (10 minutes)

```bash
# Remove Firebase packages
npm uninstall @react-native-firebase/app
npm uninstall @react-native-firebase/auth
npm uninstall @react-native-firebase/firestore
npm uninstall firebase

# Verify package.json is clean
grep -i firebase package.json
# Should return no results

# Test build without Firebase packages
npm run lint
npm run typecheck
```

**Expected**: No Firebase packages in package.json, build succeeds

### Step 3: Remove Source Code (15 minutes)

```bash
# Remove Firebase source directory
rm -rf lib/data/firebase/

# Remove Firebase repository
rm lib/repo/FirebaseExerciseRepo.ts

# Verify removal
find . -name "*firebase*" -type f | grep -v node_modules
# Should show only configuration files to be removed later
```

**Expected**: Firebase source code removed, no import errors yet

### Step 4: Update Import References (20 minutes)

```bash
# Find and fix import references
grep -r "firebase" lib/ app/ --include="*.ts" --include="*.tsx"

# Key files to update:
# - lib/repo/ExerciseRepoFactory.ts (remove Firebase option)
# - lib/data/index.ts (remove Firebase exports)
# - lib/data/StorageManager.ts (remove Firebase storage)
# - lib/hooks/*.ts (remove Firebase imports)
# - app/error.ts (switch to Supabase logger)
```

**Expected**: All import references updated to use Supabase only

### Step 5: Remove Test Infrastructure (15 minutes)

```bash
# Remove Firebase mocks
rm -rf __mocks__/@react-native-firebase/
rm __tests__/test-utils/FirebaseMockFactory.ts

# Remove Firebase-specific tests
rm __tests__/repo/FirebaseExerciseRepo-new-methods.test.ts

# Update Jest setup
# Edit jest.setup.js to remove Firebase mock lines 4-32
```

**Expected**: Firebase test infrastructure removed, remaining tests still pass

### Step 6: Update Factory Pattern (10 minutes)

```bash
# Edit lib/repo/ExerciseRepoFactory.ts
# Remove USE_SUPABASE_DATA logic
# Always return SupabaseExerciseRepo

# Test factory simplification
npm test -- --testNamePattern="ExerciseRepoFactory"
```

**Expected**: Factory always returns Supabase, tests pass

### Step 7: Remove Configuration Files (10 minutes)

```bash
# Remove Firebase configuration
rm firebase.json
rm -f google-services.json
rm -f android/app/google-services.json

# Update TypeScript config
# Edit tsconfig.json to remove Firebase path mapping

# Update devbox configurations
# Edit devbox.json files to remove firebase-tools
```

**Expected**: No Firebase configuration files remain

### Step 8: Clean Environment Variables (10 minutes)

```bash
# Remove Firebase environment variables from:
# - .env files
# - GitHub Actions workflows
# - DevBox configurations
# - app.config.js

# Update build scripts
# Edit scripts/ to remove Firebase emulator startup
```

**Expected**: No Firebase environment variables or build scripts

### Step 9: Full Test Validation (30 minutes)

```bash
# Run complete test suite
npm test

# Run devbox tests
devbox run test

# Run Maestro integration tests
devbox run maestro-test

# Test all platforms
npm run build
npm run lint
npm run typecheck
```

**Expected**: All tests pass, all builds succeed

### Step 10: Final Verification (10 minutes)

```bash
# Search for any remaining Firebase references
grep -r -i firebase . --exclude-dir=node_modules --exclude-dir=.git

# Verify Supabase-only operation
export USE_SUPABASE_DATA=false  # Should be ignored now
npm test

# Check application startup
npm start
```

**Expected**: Zero Firebase references, application works perfectly

## Validation Checklist

After completion, verify:

- [ ] No Firebase packages in package.json
- [ ] No Firebase source files exist
- [ ] No Firebase imports in source code
- [ ] No Firebase configuration files
- [ ] No Firebase environment variables
- [ ] All unit tests pass (`npm test`)
- [ ] All devbox tests pass (`devbox run test`)
- [ ] All Maestro tests pass (`devbox run maestro-test`)
- [ ] Application builds successfully
- [ ] Authentication works on all platforms
- [ ] Real-time data updates work
- [ ] Performance is maintained

## Troubleshooting

### Common Issues

**Build fails with Firebase import errors**

```bash
# Find remaining imports
grep -r "firebase" . --include="*.ts" --include="*.tsx" | grep -v node_modules
# Fix each import to use Supabase equivalent
```

**Tests fail after factory update**

```bash
# Ensure factory always returns Supabase
cat lib/repo/ExerciseRepoFactory.ts
# Should not contain USE_SUPABASE_DATA logic
```

**Authentication not working**

```bash
# Check auth hooks are using Supabase
grep -r "auth" lib/hooks/ | grep -v firebase
# Should only show Supabase auth usage
```

**Real-time updates broken**

```bash
# Verify Supabase subscriptions are active
npm test -- --testNamePattern="real-time"
# Should pass without Firebase dependencies
```

## Rollback Plan

If issues arise:

```bash
# Rollback to previous commit
git log --oneline -10
git reset --hard <previous-commit>

# Or rollback specific changes
git checkout HEAD~1 -- package.json
git checkout HEAD~1 -- lib/data/firebase/
```

## Success Criteria

✅ **Complete**: Zero Firebase dependencies or references  
✅ **Functional**: All features work through Supabase only  
✅ **Tested**: Full test suite passes  
✅ **Performance**: No degradation in app performance  
✅ **Clean**: Codebase is simplified and maintainable

## Next Steps

After successful removal:

1. Update documentation to reflect Supabase-only architecture
2. Update CI/CD to remove Firebase secrets and configurations
3. Consider removing factory pattern entirely if no future backend planned
4. Update developer onboarding docs

**Estimated Total Time**: 2-3 hours  
**Risk Level**: Medium (well-tested Supabase fallback available)
