# Offline Sync Maestro Tests (Android)

This directory contains Maestro tests that verify the offline sync functionality on Android devices. These tests are designed to catch the critical bug where exercises created offline are lost after app restart.

## Test Files

### 🌐 REAL Network Disconnection Tests (Most Important)

### 1. `airplane-mode-sync.maestro` ⭐ **CRITICAL & AUTOMATED**

**Location:** `.maestro/android/airplane-mode-sync.maestro`  
**Duration:** ~4 minutes  
**Purpose:** Uses Maestro's built-in `setAirplaneMode` command for REAL airplane mode  
**Requirements:** Android device/emulator (iOS not supported)  
**Network:** **REAL airplane mode** - device actually loses internet **AUTOMATICALLY**

Tests:
- Automated real airplane mode on/off using `setAirplaneMode: enabled/disabled`
- Exercise creation while truly offline
- App restart with actual network unavailable
- Recovery when real network is restored
- Rapid airplane mode toggling edge cases

### 2. `real-airplane-mode.maestro` ⭐ **CRITICAL (Manual)**

**Location:** `.maestro/android/offline-sync/real-airplane-mode.maestro`  
**Duration:** ~6 minutes  
**Purpose:** Tests ACTUAL device airplane mode with manual control  
**Requirements:** Manual airplane mode toggling by user  
**Network:** **REAL airplane mode** - device actually loses internet

Tests:
- Real network disconnection detection
- Exercise creation while truly offline
- App restart with actual network unavailable
- Recovery when real network is restored

### 3. `wifi-disconnect.maestro` ⭐ **CRITICAL**

**Location:** `.maestro/android/offline-sync/wifi-disconnect.maestro`  
**Duration:** ~4 minutes  
**Purpose:** Tests ACTUAL WiFi disconnection  
**Requirements:** Manual WiFi disable/enable in device settings  
**Network:** **REAL WiFi disconnection** - device actually loses internet

Tests:
- WiFi off/on scenarios
- Exercise persistence through real network loss
- Sync recovery when WiFi reconnects

### 📱 App Simulation Tests (Less Realistic)

### 4. `connectivity-test.maestro`

**Location:** `.maestro/android/offline-sync/connectivity-test.maestro`  
**Duration:** ~30 seconds  
**Purpose:** Quick smoke test for basic sync functionality  
**Requirements:** Android device/emulator with app installed  
**Network:** App remains online throughout

Tests:
- Sync status indicator presence
- Basic exercise creation and sync
- Error detection

### 5. `sync-persistence.maestro`

**Location:** `.maestro/android/offline-sync/sync-persistence.maestro`  
**Duration:** ~2 minutes  
**Purpose:** Core bug test using forced sync failures  
**Requirements:** Android device/emulator, app with debug features enabled  
**Network:** **Simulated server failures** (not real network loss)

Tests:
- Sync queue persistence through app restart
- Recovery from sync failures
- Queue restoration after app termination

### 6. `network-simulation.maestro`

**Location:** `.maestro/android/offline-sync/network-simulation.maestro`  
**Duration:** ~3 minutes  
**Purpose:** Automated network state testing using app controls  
**Requirements:** App with network simulation debug features  
**Network:** **App-controlled simulation** (not real network loss)

Tests:
- Simulated offline exercise creation
- Simulated auto-sync when connectivity "restored"
- Queue management during simulated network transitions

### 7. `dev-options-offline.maestro` (Experimental)

**Location:** `.maestro/android/offline-sync/dev-options-offline.maestro`  
**Duration:** ~3 minutes  
**Purpose:** Use Android Developer Options to disable network  
**Requirements:** Developer Options enabled, varies by device  
**Network:** **System-level network disable** (more real than app simulation)

Tests:
- Developer options network control
- Exercise creation with system network disabled
- Recovery when network re-enabled

## Running the Tests

### Quick Critical Tests Only

```bash
./scripts/test-maestro-quick.sh
```

### Best Test (Automated Airplane Mode) ⭐

```bash
maestro test .maestro/android/airplane-mode-sync.maestro
```

### Core Bug Test (Sync Persistence)

```bash
maestro test .maestro/android/offline-sync/sync-persistence.maestro
```

### All Tests (Comprehensive)

```bash
./scripts/test-offline-sync-maestro.sh
```

### Individual Test

```bash
maestro test .maestro/android/offline-sync/[test-name].maestro
# OR for the main airplane mode test:
maestro test .maestro/android/airplane-mode-sync.maestro
```

## Prerequisites

### 1. Install Maestro

```bash
curl -Ls 'https://get.maestro.mobile.dev' | bash
```

### 2. Prepare Android Device/Emulator

```bash
# Check device connection
adb devices

# Should show something like:
# List of devices attached
# emulator-5554    device
```

### 3. Build and Install Test App

```bash
npm run build:android:test
```

### 4. Enable Debug Features (for some tests)

The app needs debug/developer options enabled for network simulation tests. This should include:
- Network simulation controls
- Sync debugging mode
- Sync queue status display
- Error state indicators

## Test IDs Required in App

The tests expect these UI elements to have testID attributes:

### Exercise Management
- `add-exercise-button` - Button to create new exercise
- `exercise-name-input` - Text input for exercise name
- `save-exercise-button` - Button to save exercise
- `delete-exercise-button` - Button to delete exercise

### Sync Status
- `sync-status-indicator` - Shows current sync state
- `sync-status-offline` - Offline state indicator
- `sync-status-pending` - Pending sync state
- `sync-status-synced` - Successfully synced state

### Debug Controls (Developer Options)
- `enable-network-simulation` - Toggle network simulation
- `simulate-offline-mode` - Force offline state
- `simulate-online-mode` - Force online state
- `enable-sync-debugging` - Enable sync debug mode
- `force-sync-failures` - Force sync operations to fail
- `disable-sync-failures` - Restore normal sync behavior
- `force-sync-now` - Manually trigger sync

### Error Detection
- `maestro-error-blocker` - Error overlay that blocks app (from error blocking system)
- `maestro-error-count` - Display of error count
- `maestro-error-message` - Current error message

## ⚠️ Critical Difference: Real vs Simulated Network Tests

### 🌐 REAL Network Tests (Critical for Bug Detection)
- **`airplane-mode-sync.maestro`** and **`wifi-disconnect.maestro`**
- Device **actually loses internet connection**
- Tests the app's ability to detect **real network state changes**
- These tests will catch bugs that app simulation tests miss
- **Most important for validating the actual user experience**

### 📱 App Simulation Tests (Limited Scope)
- **`network-simulation.maestro`** and **`sync-persistence.maestro`**
- App **simulates offline state internally**
- Device **never actually loses internet**
- Only tests if app responds to its own simulation
- **May miss real-world network detection issues**

### 🎯 Why This Matters
The original bug occurs when:
1. Device **actually** has no internet (real airplane mode)
2. App must **detect real network state** and queue operations
3. App must **persist queue through restart** when network is unavailable
4. App must **detect real network restoration** and sync

App simulation tests can't validate steps 2 and 4 properly!

## Expected Behavior

### Before Bug Fix (Tests Should Fail)
- **`airplane-mode-sync.maestro`** should FAIL at exercise persistence after restart
- **`wifi-disconnect.maestro`** should FAIL at exercise persistence after restart
- `sync-persistence.maestro` should FAIL at queue restoration step
- Queue count should show 0 after app restart even with pending operations

### After Bug Fix (Tests Should Pass)
- **ALL REAL network tests must pass** (most critical)
- App simulation tests should also pass
- Sync queue persists through app restart
- Exercises created offline are never lost
- Auto-sync works when connectivity is restored

## Troubleshooting

### Test Fails with "Element not found"
- Ensure testID attributes are correctly implemented in the app
- Check that the app is built with test configuration
- Verify UI elements are visible when expected

### "No device found" Error
```bash
# Check ADB connection
adb devices

# Restart ADB if needed
adb kill-server
adb start-server
```

### App Crashes During Test
- Check error blocking system is properly implemented
- Review app logs: `adb logcat | grep StrengthAssistant`
- Ensure all required components are implemented

### Network Simulation Not Working
- Verify debug features are enabled in test build
- Check that NetworkMocks integration is working
- Ensure ConnectivityMonitor responds to simulated state changes

## Integration with CI/CD

These tests can be integrated into CI/CD pipelines:

```bash
# Run in headless mode (CI)
./scripts/test-offline-sync-maestro.sh

# Exit code 0 = all tests passed
# Exit code 1 = one or more tests failed
```

For CI environments, use the `airplane-mode-sync.maestro` test as it's the most reliable and uses automated airplane mode control.

## Platform Notes

- **Android Only**: All airplane mode tests require Android devices/emulators
- **iOS Limitation**: iOS simulators don't support airplane mode simulation
- **Device vs Emulator**: Both work, but real devices provide more realistic network behavior
- **Network Quality**: Tests work best with stable WiFi connections for the online phases