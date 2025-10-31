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

# First validate if airplane mode actually works in this environment
echo "🔍 Running: Airplane Mode Validation Test"
if maestro test .maestro/android/airplane-mode-validation.yml; then
    echo "✅ PASSED: Airplane mode validation - airplane mode works in this environment"
    VALIDATION_RESULT="✅ AIRPLANE_MODE_WORKS"
    
    echo ""
    echo "🧪 Running: Automated Airplane Mode Test (CRITICAL)"
    if maestro test .maestro/android/airplane-mode-sync.yml; then
        echo "✅ PASSED: Automated Airplane Mode Test"
        AIRPLANE_RESULT="✅ PASSED"
    else
        echo "❌ FAILED: Automated Airplane Mode Test"
        AIRPLANE_RESULT="❌ FAILED"
    fi
else
    echo "⚠️  FAILED: Airplane mode validation - using CI-safe alternative"
    VALIDATION_RESULT="❌ AIRPLANE_MODE_BROKEN"
    
    echo ""
    echo "🧪 Running: CI-Safe Offline Sync Test (CRITICAL)"
    if maestro test .maestro/android/offline-sync-ci-safe.yml; then
        echo "✅ PASSED: CI-Safe Offline Sync Test"
        AIRPLANE_RESULT="✅ PASSED"
    else
        echo "❌ FAILED: CI-Safe Offline Sync Test"
        AIRPLANE_RESULT="❌ FAILED"
    fi
fi

echo ""
echo "🧪 Running: Workout Empty State Test (Baseline)"
if maestro test .maestro/android/workout-empty-state.yml; then
    echo "✅ PASSED: Workout Empty State Test"
    WORKOUT_RESULT="✅ PASSED"
else
    echo "❌ FAILED: Workout Empty State Test"
    WORKOUT_RESULT="❌ FAILED"
fi

echo ""
echo "📊 Quick Test Results"
echo "===================="
echo "Environment Check: $VALIDATION_RESULT"
echo "Offline Sync Test: $AIRPLANE_RESULT"
echo "Workout Empty State: $WORKOUT_RESULT"
echo ""

if [[ "$AIRPLANE_RESULT" == *"PASSED"* ]]; then
    if [[ "$VALIDATION_RESULT" == *"AIRPLANE_MODE_WORKS"* ]]; then
        echo "🎉 Critical offline sync test PASSED with REAL airplane mode!"
        echo "   The offline sync bug appears to be fixed."
    else
        echo "🎉 Critical offline sync test PASSED with app simulation!"
        echo "   The offline sync bug appears to be fixed."
        echo "   Note: CI environment has broken airplane mode (expected)"
    fi
    exit 0
else
    echo "⚠️  Critical offline sync test FAILED."
    echo "   The offline sync bug still exists."
    if [[ "$VALIDATION_RESULT" == *"AIRPLANE_MODE_BROKEN"* ]]; then
        echo "   Environment: CI emulator with broken airplane mode"
    fi
    echo "   Run full test suite: ./scripts/test-offline-sync-maestro.sh"
    exit 1
fi