# CI Maestro Test Summary

## Tests CI Will Discover and Run

The CI runner looks for `*.yml` files in `.maestro/android/` directory (line 407 of `scripts/integration_test_android.sh`).

### Current Tests (13 total):

#### ✅ Existing Tests (Working)
1. `add-and-record-workout.yml` - Workout flow test
2. `add-exercise-and-see-it-in-list.yml` - Exercise management test  
3. `workout-empty-state.yml` - Baseline UI test

#### 🧪 New Offline Sync Tests (Will Expose Bug)
4. `airplane-mode-validation.yml` ⭐ **VALIDATION** - Tests if airplane mode actually works
5. `airplane-mode-sync.yml` ⭐ **MAIN TEST** - Automated airplane mode sync test
6. `offline-sync-ci-safe.yml` ⭐ **CI FALLBACK** - App simulation if airplane mode broken
7. `connectivity-test.yml` - Quick connectivity smoke test
8. `sync-persistence.yml` - Queue persistence through restart
9. `real-airplane-mode.yml` - Manual airplane mode test
10. `wifi-disconnect.yml` - WiFi disconnect test
11. `airplane-mode.yml` - Legacy airplane mode test
12. `network-simulation.yml` - App-controlled simulation
13. `dev-options-offline.yml` - Developer options control

## Expected CI Behavior

### Before Bug Fix (Should Fail)
- `airplane-mode-validation.yml` will **FAIL** (CI emulator airplane mode broken)
- `offline-sync-ci-safe.yml` will **FAIL** (no queue persistence implemented)
- `sync-persistence.yml` will **FAIL** (exercises lost on restart)
- Total failures: ~3-8 tests depending on implementation state

### After Bug Fix (Should Pass)  
- `airplane-mode-validation.yml` will **FAIL** (expected - CI limitation)
- `offline-sync-ci-safe.yml` will **PASS** (queue persistence works)
- `sync-persistence.yml` will **PASS** (exercises survive restart)
- Total failures: ~1-2 tests (only CI environment limitations)

## Test Execution Order

CI runs tests in alphabetical order:
1. `add-and-record-workout.yml`
2. `add-exercise-and-see-it-in-list.yml`
3. `airplane-mode-sync.yml` ⭐
4. `airplane-mode-validation.yml` ⭐
5. `airplane-mode.yml`
6. `connectivity-test.yml` ⭐
7. `dev-options-offline.yml`
8. `network-simulation.yml`
9. `offline-sync-ci-safe.yml` ⭐
10. `real-airplane-mode.yml`
11. `sync-persistence.yml` ⭐
12. `wifi-disconnect.yml`
13. `workout-empty-state.yml`

## Key Insights

### Why Previous CI Run Passed
- Only existing tests ran (workout-empty-state.yml etc.)
- New offline sync tests were in wrong location/extension
- No actual offline sync testing occurred

### Why Next CI Run Should Fail
- 10 new tests that expose the offline sync bug
- Tests require queue persistence through app restart
- Tests require real network state detection
- Bug will be exposed by multiple test scenarios

## CI Integration Details

- **Discovery**: `scripts/integration_test_android.sh` line 407: `for test_file in .maestro/android/*.yml`
- **Execution**: Each test runs individually with full debugging
- **Artifacts**: Screenshots, logs, UI dumps saved for each test
- **Failure Detection**: Both exit codes and output parsing
- **Environment**: Android emulator with Supabase integration