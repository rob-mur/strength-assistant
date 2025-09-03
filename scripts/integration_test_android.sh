#!/usr/bin/env bash

# Github actions has a conflicting environment variable
unset ANDROID_SDK_ROOT
unset ANDROID_NDK_HOME
unset ANDROID_AVD_HOME
unset XDG_CONFIG_HOME

# Force Supabase emulator mode for Android tests
export EXPO_PUBLIC_USE_SUPABASE_EMULATOR=true
export EXPO_PUBLIC_SUPABASE_EMULATOR_HOST=10.0.2.2
export EXPO_PUBLIC_SUPABASE_EMULATOR_PORT=54321

echo "no" | avdmanager create avd --force -n test -k "system-images;android-35;google_apis_playstore;x86_64" --device "pixel_xl"

adb start-server

# Clean up any existing processes
pkill -f "firebase emulators" || true
supabase stop || true
npx kill-port 9099 || true
npx kill-port 5000 || true  
npx kill-port 8080 || true
sleep 2

firebase emulators:start &
supabase start &
emulator -avd test -no-snapshot-load -no-window -accel on -gpu off &

echo "launched emulator in background"

EMULATOR_PID=$!

errorhandler () {
    kill $EMULATOR_PID
    supabase stop 2>/dev/null || true
    npx kill-port 8080
}
trap errorhandler ERR EXIT

echo "Waiting for device to boot"
adb wait-for-device

BOOT_COMPLETED=""
while [ "$BOOT_COMPLETED" != "1" ]; do
    sleep 5 
    BOOT_COMPLETED=$(adb shell getprop sys.boot_completed | tr -d '\r')
    echo "Boot status: $BOOT_COMPLETED (1 means ready)"
done

echo "Emulator is ready!"

# Wait for Firebase emulators
echo "⏳ Waiting for Firebase emulators to be ready..."
timeout=30
counter=0
while ! curl -s http://localhost:8080 > /dev/null; do
    sleep 1
    counter=$((counter + 1))
    if [ $counter -ge $timeout ]; then
        echo "❌ Firebase emulators failed to start within $timeout seconds"
        exit 1
    fi
done
echo "✅ Firebase emulators ready"

# Wait for Supabase emulators and apply migrations
echo "⏳ Waiting for Supabase emulators to be ready..."
timeout=120
counter=0
while ! curl -s http://localhost:54321/health > /dev/null; do
    sleep 1
    counter=$((counter + 1))
    if [ $counter -ge $timeout ]; then
        echo "❌ Supabase emulators failed to start within $timeout seconds"
        echo "Docker container status:"
        docker ps -a | grep supabase || echo "No supabase containers found"
        exit 1
    fi
done
echo "✅ Supabase emulators ready"

# Apply migrations (config.toml already has anonymous auth enabled)
echo "🔄 Applying Supabase migrations..."
supabase db reset --local
echo "✅ Migrations applied successfully"

adb install build_preview.apk

# Create debug output directory
mkdir -p maestro-debug-output

echo "=== PRE-TEST DIAGNOSTICS ==="
echo "Device status:"
adb devices -l
echo ""

echo "System properties:"
adb shell getprop ro.build.version.release
adb shell getprop ro.product.model
echo ""

echo "Available storage:"
adb shell df /data | head -2
echo ""

echo "Current focus window:"
adb shell dumpsys window windows | grep -i focus | head -5
echo ""

echo "Recent logcat entries:"
adb logcat -d | tail -20
echo ""

echo "Testing manual app launch..."
adb shell am start -n com.jimmy_solutions.strength_assistant.test/.MainActivity
sleep 3
echo "App launch result:"
adb shell dumpsys activity activities | grep -i strength || echo "No strength activity found"
echo ""

echo "Testing app connectivity..."
adb shell ping -c 2 10.0.2.2 2>/dev/null || echo "Cannot ping host machine"
echo "Testing host connectivity from emulator:"

# First verify Supabase is actually running on host
echo "Verifying Supabase is running on host..."
if curl -s http://localhost:54321/health >/dev/null 2>&1; then
    echo "✅ Supabase confirmed running on host"
else
    echo "❌ Supabase not reachable on host - this will cause Android tests to fail"
    echo "Host Supabase status check failed"
    exit 1
fi

# Test if Android emulator can reach the host Supabase port
echo "Testing Android emulator connectivity to Supabase..."
# Try a simple TCP connection test using /dev/tcp (bash built-in)
if adb shell "timeout 5 sh -c '</dev/tcp/10.0.2.2/54321'" 2>/dev/null; then
    echo "✅ Android emulator can connect to Supabase port"
elif adb shell "nc -z 10.0.2.2 54321" 2>/dev/null; then
    echo "✅ Android emulator can reach Supabase port (nc test)"
else
    # Since ping worked, assume network is OK and Supabase should be reachable
    echo "⚠️ Cannot directly test port connectivity from emulator"
    echo "   But host is reachable and Supabase is running - proceeding with tests"
    echo "   The app should be able to connect to Supabase at 10.0.2.2:54321"
fi
echo ""

echo "Environment variables for Supabase:"
echo "EXPO_PUBLIC_USE_SUPABASE_EMULATOR: $EXPO_PUBLIC_USE_SUPABASE_EMULATOR"  
echo "EXPO_PUBLIC_SUPABASE_EMULATOR_HOST: $EXPO_PUBLIC_SUPABASE_EMULATOR_HOST"
echo "EXPO_PUBLIC_SUPABASE_EMULATOR_PORT: $EXPO_PUBLIC_SUPABASE_EMULATOR_PORT"
echo ""

echo "Current running processes:"
adb shell ps | grep -i strength || echo "No strength process found"
echo ""

echo "=== PRE-MAESTRO APP STATE CHECK ==="
echo "Checking if app is responding and logs..."
sleep 2

echo "Recent app logs (ReactNativeJS):"
adb logcat -d | grep -E "ReactNativeJS|Supabase|Legend" | tail -20 || echo "No React Native logs found"
echo ""

echo "App activity state:"
adb shell dumpsys activity activities | grep -A 5 -B 5 strength || echo "No strength activity details"
echo ""

echo "=== STARTING MAESTRO TESTS ==="
echo "Starting Maestro tests with enhanced debugging..."
echo "Debug output will be saved to maestro-debug-output/"

# Clear old logcat and start capturing new logs during test
adb logcat -c
echo "Cleared logcat buffer, starting fresh capture during tests..."

# Run Maestro with debug output and capture console output
maestro test .maestro/android --debug-output maestro-debug-output 2>&1 | tee maestro-debug-output/maestro-console.log

# Capture final status (using PIPESTATUS to get maestro's exit code, not tee's)
MAESTRO_EXIT_CODE=${PIPESTATUS[0]}

echo "=== POST-TEST DIAGNOSTICS ==="
echo "Maestro tests completed with exit code: $MAESTRO_EXIT_CODE"

echo "App logs during test execution:"
adb logcat -d | grep -E "ReactNativeJS|Supabase|Legend|Error|Exception" | tail -30 || echo "No relevant logs found"
echo ""

echo "Final app state:"
adb shell dumpsys activity activities | grep -i strength || echo "No strength activity found"
echo ""

echo "Final logcat entries:"
adb logcat -d | tail -30
echo ""

echo "Debug artifacts saved in maestro-debug-output/"

# List any screenshots or debug files created
if [ -d "maestro-debug-output" ]; then
    echo "Debug artifacts created:"
    ls -la maestro-debug-output/
fi

if [ -f "*.png" ]; then
    echo "Screenshots created:"
    ls -la *.png
fi

# Explicitly fail if any tests failed
if [ $MAESTRO_EXIT_CODE -ne 0 ]; then
    echo "❌ Tests failed with exit code $MAESTRO_EXIT_CODE"
    exit $MAESTRO_EXIT_CODE
else
    echo "✅ All tests passed"
    exit 0
fi
