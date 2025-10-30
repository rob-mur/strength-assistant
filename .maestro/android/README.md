# Android Maestro Tests

This directory contains Maestro tests specifically for Android devices and emulators.

## Test Structure

```
.maestro/android/
├── airplane-mode-sync.maestro           ⭐ MAIN OFFLINE SYNC TEST
├── workout-empty-state.maestro          Workout UI baseline test
├── add-and-record-workout.yml           Workout flow test
├── add-exercise-and-see-it-in-list.yml  Exercise management test
└── offline-sync/                        Comprehensive offline sync tests
    ├── README.md                        Detailed offline sync documentation
    ├── connectivity-test.maestro       Quick connectivity test
    ├── real-airplane-mode.maestro      Manual airplane mode test
    ├── wifi-disconnect.maestro         WiFi disconnect test
    ├── sync-persistence.maestro        Queue persistence test
    ├── network-simulation.maestro      App-simulated network test
    ├── dev-options-offline.maestro     Developer options test
    └── airplane-mode.maestro           Legacy airplane mode test
```

## Quick Start

### Most Important Test (Airplane Mode Sync)
```bash
maestro test .maestro/android/airplane-mode-sync.maestro
```

### Quick Test Suite
```bash
./scripts/test-maestro-quick.sh
```

### All Android Tests
```bash
./scripts/test-offline-sync-maestro.sh
```

## Platform-Specific Features

### Android-Only Features Tested
- **Airplane mode simulation** - Using `setAirplaneMode: enabled/disabled`
- **Real network disconnection** - Device actually goes offline
- **System-level network controls** - Developer options integration
- **Background app behavior** - App restart scenarios while offline

### Why Android-Specific
- iOS simulators don't support airplane mode
- Android provides more granular network control
- Real device testing requires Android hardware
- Background sync behavior differs between platforms

## Test Categories

### 🔥 Critical Tests (Must Pass)
1. `airplane-mode-sync.maestro` - Automated airplane mode with real network disconnection
2. `offline-sync/real-airplane-mode.maestro` - Manual airplane mode testing
3. `offline-sync/wifi-disconnect.maestro` - WiFi disconnection scenarios

### 📊 Baseline Tests (Should Pass)
1. `workout-empty-state.maestro` - Basic UI functionality
2. `offline-sync/connectivity-test.maestro` - Basic sync indicators

### 🧪 Simulation Tests (Nice to Have)
1. `offline-sync/sync-persistence.maestro` - Queue persistence simulation
2. `offline-sync/network-simulation.maestro` - App-controlled network simulation

## Usage Notes

- **Android devices/emulators only** - iOS not supported for airplane mode tests
- **Debug build required** - Some tests need debug features enabled
- **Real network required** - Tests verify actual connectivity changes
- **Device permissions** - May require system permission access for network controls

## Integration

These tests are designed to integrate with:
- **CI/CD pipelines** - Automated testing in build processes
- **Development workflow** - Quick validation during development
- **Release validation** - Pre-release testing on real devices
- **Bug reproduction** - Recreating reported offline sync issues

See `offline-sync/README.md` for comprehensive documentation.