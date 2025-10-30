#!/bin/bash
# Quick Maestro Test Runner
# Purpose: Run the most important Maestro tests quickly

set -e

echo "🧪 Quick Maestro Test Suite"
echo "============================"

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

cd "$(dirname "$0")/.."

# Run the most critical tests only
echo "🧪 Running: Automated Airplane Mode Test (CRITICAL)"
if maestro test .maestro/android/airplane-mode-sync.maestro; then
    echo "✅ PASSED: Automated Airplane Mode Test"
    AIRPLANE_RESULT="✅ PASSED"
else
    echo "❌ FAILED: Automated Airplane Mode Test"
    AIRPLANE_RESULT="❌ FAILED"
fi

echo ""
echo "🧪 Running: Workout Empty State Test (Baseline)"
if maestro test .maestro/android/workout-empty-state.maestro; then
    echo "✅ PASSED: Workout Empty State Test"
    WORKOUT_RESULT="✅ PASSED"
else
    echo "❌ FAILED: Workout Empty State Test"
    WORKOUT_RESULT="❌ FAILED"
fi

echo ""
echo "📊 Quick Test Results"
echo "===================="
echo "Airplane Mode Test: $AIRPLANE_RESULT"
echo "Workout Empty State: $WORKOUT_RESULT"
echo ""

if [[ "$AIRPLANE_RESULT" == *"PASSED"* ]]; then
    echo "🎉 Critical offline sync test PASSED!"
    echo "   The offline sync bug appears to be fixed."
    exit 0
else
    echo "⚠️  Critical offline sync test FAILED."
    echo "   The offline sync bug still exists."
    echo "   Run full test suite: ./scripts/test-offline-sync-maestro.sh"
    exit 1
fi