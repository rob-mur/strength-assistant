# Data Layer Migration Feature Flag

This document explains how to use the `USE_SUPABASE_DATA` feature flag for gradual migration from Firebase to Supabase.

## Overview

The feature flag allows you to switch the data layer between Firebase and Supabase without changing any application code. This enables:

- **Gradual migration**: Test Supabase integration without breaking existing functionality
- **A/B testing**: Compare performance between Firebase and Supabase
- **Zero downtime**: Switch between backends instantly
- **Risk mitigation**: Quick rollback if issues arise

## Usage

### Environment Variable

Set the `USE_SUPABASE_DATA` environment variable:

```bash
# Use Supabase (new backend)
USE_SUPABASE_DATA=true

# Use Firebase (current backend) - this is the default
USE_SUPABASE_DATA=false
```

### Development Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Set your preferred data layer in `.env`:
   ```bash
   # For development with Firebase
   USE_SUPABASE_DATA=false
   
   # For development with Supabase
   USE_SUPABASE_DATA=true
   ```

3. Restart your development server:
   ```bash
   npm start
   ```

### Production Deployment

For production builds, set the environment variable in your deployment configuration:

- **Expo EAS Build**: Set in your build profile or environment variables
- **Web builds**: Set `USE_SUPABASE_DATA` in your hosting environment
- **Native apps**: The variable is baked into the build via `app.config.js`

## Architecture

### Repository Pattern

The implementation uses the Repository pattern with a factory:

```typescript
// Factory selects implementation based on feature flag
ExerciseRepoFactory.getInstance() // Returns Firebase or Supabase repo

// Main repository delegates to selected implementation
ExerciseRepo.getInstance() // Always works, internally uses factory
```

### Implementation Classes

- **`ExerciseRepo`**: Main interface (delegates to factory)
- **`ExerciseRepoFactory`**: Factory that chooses implementation
- **`FirebaseExerciseRepo`**: Firebase Firestore implementation
- **`SupabaseExerciseRepo`**: Supabase implementation

### Zero Breaking Changes

All existing hooks and components continue to work unchanged:

```typescript
// This code works identically with both backends
const { exercises } = useExercises(userId);
const repo = ExerciseRepo.getInstance();
```

## Testing

### Manual Testing

1. **Test Firebase**:
   ```bash
   # Set in .env
   USE_SUPABASE_DATA=false
   npm start
   # Test CRUD operations in the app
   ```

2. **Test Supabase**:
   ```bash
   # Set in .env  
   USE_SUPABASE_DATA=true
   npm start
   # Test the same CRUD operations
   ```

3. **Verify identical behavior**: Both backends should provide the same user experience.

### Performance Benchmarking

You can benchmark both implementations:

```typescript
// Check current backend
const dataSource = ExerciseRepo.getInstance().getCurrentDataSource();
console.log(`Using: ${dataSource}`);

// Time operations
const start = Date.now();
await repo.addExercise(userId, exercise);
const duration = Date.now() - start;
console.log(`Add operation took: ${duration}ms`);
```

## Migration Checklist

- [ ] Environment variable `USE_SUPABASE_DATA=true/false` controls data layer ✅
- [ ] Repository factory pattern implemented returning Firebase or Supabase repo ✅
- [ ] `useExercises` hook works identically with both backends ✅
- [ ] Zero breaking changes to existing component APIs ✅
- [ ] Manual testing confirms exercises CRUD works with both flags
- [ ] Performance benchmark shows <500ms difference between backends
- [ ] Documentation updated explaining feature flag usage ✅

## Rollback Plan

If issues arise with Supabase:

1. **Immediate rollback**:
   ```bash
   USE_SUPABASE_DATA=false
   ```

2. **Redeploy/restart** your application

3. **All data remains intact** - both Firebase and Supabase maintain their own data stores

## Troubleshooting

### Environment Variable Not Working

- Ensure you restart the dev server after changing `.env`
- Check `app.config.js` is properly reading the variable
- Verify the variable is set in your deployment environment

### Different Behavior Between Backends

- Check user authentication - Firebase and Supabase use different user IDs
- Verify data exists in the backend you're testing
- Check console logs for backend-specific errors

### Factory Not Switching

```typescript
// Debug current data source
console.log(ExerciseRepoFactory.getCurrentDataSource());

// Reset factory cache (useful in tests)
ExerciseRepoFactory.resetInstances();
```

## Next Steps

1. **Complete manual testing** with both backends
2. **Run performance benchmarks** comparing Firebase vs Supabase
3. **Gradually migrate users** by enabling the flag for subsets
4. **Monitor metrics** during migration
5. **Remove Firebase code** once migration is complete