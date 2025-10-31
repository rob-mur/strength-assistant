#!/bin/bash
# Test Script: Offline Sync Maestro Tests
# Purpose: Run all offline sync Maestro tests in proper sequence

set -e

echo "🧪 Starting Offline Sync Maestro Tests"
echo "======================================"

# Check if Maestro is installed
if ! command -v maestro &> /dev/null; then
    echo "❌ Maestro not found. Please install Maestro first:"
    echo "   curl -Ls 'https://get.maestro.mobile.dev' | bash"
    exit 1
fi

# Check if device/emulator is connected
if ! adb devices | grep -q "device$"; then
    echo "❌ No Android device/emulator found. Please connect a device or start an emulator."
    exit 1
fi

echo "✅ Maestro and Android device found"
echo ""

# Build and install the app first
echo "🏗️  Building and installing app..."
cd "$(dirname "$0")/.."
npm run build:android:test || {
    echo "❌ Failed to build test app"
    exit 1
}

echo "✅ App built successfully"
echo ""

# Test sequence - run tests in order of automation and importance
TESTS=(
    ".maestro/android/connectivity-test.yml"
    ".maestro/android/airplane-mode-sync.yml"
    ".maestro/android/sync-persistence.yml"
    ".maestro/android/real-airplane-mode.yml"
    ".maestro/android/wifi-disconnect.yml"
    ".maestro/android/network-simulation.yml"
    ".maestro/android/airplane-mode.yml"
)

PASSED=0
FAILED=0

for test in "${TESTS[@]}"; do
    echo "🧪 Running: $(basename "$test")"
    echo "   File: $test"
    
    if maestro test "$test"; then
        echo "✅ PASSED: $(basename "$test")"
        ((PASSED++))
    else
        echo "❌ FAILED: $(basename "$test")"
        ((FAILED++))
        
        # Continue with other tests even if one fails
        echo "   Continuing with remaining tests..."
    fi
    
    echo ""
done

# Summary
echo "📊 Test Results Summary"
echo "======================"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo "📋 Total:  $((PASSED + FAILED))"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo "🎉 All offline sync tests passed!"
    echo "   The offline sync functionality is working correctly."
    exit 0
else
    echo ""
    echo "⚠️  Some tests failed. Review the output above for details."
    echo "   This indicates the offline sync bug may still exist."
    exit 1
fi