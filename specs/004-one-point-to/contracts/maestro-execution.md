# Maestro Execution Contract

**Contract**: Production validation reuses existing Maestro integration test flows
**Purpose**: Define how existing .maestro/*.yml flows are executed in production context

## Input Contract

### Required Environment Variables
```bash
SKIP_DATA_CLEANUP=true           # Modifies cleanup behavior for production
NODE_ENV=production              # Ensures production configuration
```

### Required Files
- Production APK built with actual production endpoints
- Existing .maestro/ directory with test flows:
  - `add-exercise-and-see-it-in-list.yml`
  - `add-and-record-workout.yml` 
  - Any other integration test flows

### Execution Context
- Production APK installed on test device/emulator
- Network connectivity to actual production servers
- Anonymous user creation handled by app (no external service calls needed)

## Execution Contract

### Flow Execution
```bash
maestro test .maestro/web/add-exercise-and-see-it-in-list.yml
maestro test .maestro/web/add-and-record-workout.yml
# Execute all flows in .maestro/ directory
```

### Expected Behavior with SKIP_DATA_CLEANUP=true
- Anonymous users created through standard app flows
- Test execution proceeds normally
- Cleanup operations skipped (data cleanup not performed)
- Anonymous users remain in production database (self-expire)

### Anonymous User Lifecycle
1. Test flow starts
2. App creates anonymous user (existing functionality)
3. Test executes against production services
4. Test completes
5. Anonymous user remains in database (no cleanup due to SKIP_DATA_CLEANUP=true)
6. User naturally expires based on app's standard expiration logic

## Output Contract

### Success Criteria
- All Maestro flows exit with code 0
- No test assertion failures
- Anonymous users successfully authenticate with production
- App functionality works against production infrastructure

### Failure Scenarios
- Maestro flow exits with non-zero code
- Test assertions fail
- Network connectivity issues to production
- Anonymous user creation/authentication failures

### Artifacts Generated
- Maestro execution logs (stdout/stderr)
- Screenshots for failed assertions
- Debug output in specified directory
- GitHub Actions logs for execution context

## Integration Points

### With GitHub Actions
- Exit codes determine job success/failure
- Artifacts automatically uploaded to GitHub Actions
- Logs streamed to GitHub Actions console

### With Production Infrastructure  
- APK connects to actual production endpoints
- Anonymous users interact with production database
- Real network conditions and server responses tested

### With Alerting System
- Failed flows trigger GitHub Actions job failure
- Job failure triggers alert notifications
- Manual intervention required for rollback decisions

## Validation Contract

### Pre-execution Validation
- Production APK exists and is valid
- All required .maestro/ flows exist
- Environment variables correctly set
- Test device/emulator available

### Post-execution Validation
- All flows executed (none skipped due to errors)
- Results collected and artifacts preserved
- Success/failure status clearly determined
- Appropriate notifications sent

**Contract Status**: COMPLETE - Defines Maestro flow reuse in production context