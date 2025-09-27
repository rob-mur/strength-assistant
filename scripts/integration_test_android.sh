#!/usr/bin/env bash

# Change to project root directory (relative to scripts folder)
cd "$(dirname "$0")/.."

# Github actions has a conflicting environment variable
unset ANDROID_SDK_ROOT
unset ANDROID_NDK_HOME
unset ANDROID_AVD_HOME
unset XDG_CONFIG_HOME


echo "🔄 Creating Android AVD using devbox-managed system image..."
# Use the default system image that's provided by the optimized flake
echo -e "no\nno\nno" | avdmanager create avd --force -n test -k "system-images;android-35;default;x86_64" --device "Nexus 5X"

# Verify AVD was created successfully
AVD_CONFIG_FILE="$HOME/.android/avd/test.avd/config.ini"
if [ ! -f "$AVD_CONFIG_FILE" ]; then
    echo "❌ Failed to create Android AVD"
    echo "Available AVDs:"
    avdmanager list avd
    echo "Available system images:"  
    avdmanager list targets
    exit 1
fi

# Optimize AVD for disk space savings
echo "🔧 Optimizing AVD for reduced disk usage..."
# Reduce userdata partition from default 7GB to 2GB
echo "disk.dataPartition.size=2GB" >> "$AVD_CONFIG_FILE"
# Use minimal RAM (2GB instead of default 4GB)
echo "hw.ramSize=2048" >> "$AVD_CONFIG_FILE"
# Disable GPU acceleration to save space/resources
echo "hw.gpu.enabled=no" >> "$AVD_CONFIG_FILE"
# Disable audio to save resources
echo "hw.audioOutput=no" >> "$AVD_CONFIG_FILE"
echo "hw.audioInput=no" >> "$AVD_CONFIG_FILE"
# Reduce internal storage size
echo "disk.dataPartition.initPath=" >> "$AVD_CONFIG_FILE"

echo "✅ Android AVD created and optimized successfully"

adb start-server

# Clean up any existing processes and Docker resources to save disk space
supabase stop || true

# Clean up Docker resources to free disk space
echo "🧹 Cleaning up Docker resources to save disk space..."
docker system prune -f || true
sleep 2

# Start Supabase
echo "🔄 Starting Supabase at $(date)..."
supabase start
echo "✅ Supabase started successfully at $(date)"

echo "🔄 Starting Android emulator..."
emulator -avd test -no-snapshot-load -no-window -accel on -gpu off &
EMULATOR_PID=$!
echo "launched emulator in background"

errorhandler () {
    kill $EMULATOR_PID 2>/dev/null || true
    supabase stop 2>/dev/null || true
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

# Verify Supabase is responding
echo "⏳ Verifying Supabase is ready..."
if ! curl -s http://localhost:54321 > /dev/null; then
    echo "❌ Supabase health check failed"
    echo "Docker container status:"
    docker ps -a | grep supabase || echo "No supabase containers found"
    exit 1
fi
echo "✅ Supabase verified ready"

# Apply migrations (config.toml already has anonymous auth enabled)
echo "🔄 Applying Supabase migrations..."
supabase db reset --local
echo "✅ Migrations applied successfully"

# Ensure no existing emulators are running
echo "🧹 Checking for existing emulators..."
adb devices | grep emulator && {
    echo "⚠️ Found existing emulators, killing them..."
    adb devices | grep emulator | cut -f1 | while read device; do
        adb -s "$device" emu kill
    done
    sleep 3
}

# Start Android emulator in headless mode
echo "🚀 Starting Android emulator in headless mode..."
emulator -avd test -no-snapshot-load -no-window -no-audio -no-boot-anim -gpu off &
EMULATOR_PID=$!

# Wait for device to be ready
echo "⏳ Waiting for Android emulator to be ready..."
adb wait-for-device

# Wait a bit more for the emulator to fully boot
echo "⏳ Waiting for emulator boot to complete..."
BOOT_COMPLETED=""
BOOT_ATTEMPTS=0
while [ "$BOOT_COMPLETED" != "1" ] && [ $BOOT_ATTEMPTS -lt 60 ]; do
    sleep 2
    BOOT_COMPLETED=$(adb shell getprop sys.boot_completed 2>/dev/null || echo "0")
    echo "   Boot status: $BOOT_COMPLETED (attempt $BOOT_ATTEMPTS/60)"
    BOOT_ATTEMPTS=$((BOOT_ATTEMPTS + 1))
done

if [ "$BOOT_COMPLETED" != "1" ]; then
    echo "❌ Emulator failed to boot after 60 attempts"
    exit 1
fi

echo "✅ Android emulator is ready"

# Install the APK
echo "📱 Installing APK to emulator..."
adb install build_production.apk

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
if curl -s http://localhost:54321 >/dev/null 2>&1; then
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

# CRITICAL FIX: Clear Chrome-specific environment variables for Android
# Android emulator needs to use 10.0.2.2, not 127.0.0.1
# Don't set EXPO_PUBLIC_SUPABASE_URL - let emulator logic construct the URL
unset EXPO_PUBLIC_SUPABASE_URL
export EXPO_PUBLIC_USE_SUPABASE_EMULATOR=true
# Don't set EXPO_PUBLIC_SUPABASE_EMULATOR_HOST - use hardcoded 10.0.2.2 fallback in native config

echo "Environment variables for Supabase (Android-specific):"
echo "EXPO_PUBLIC_USE_SUPABASE: $EXPO_PUBLIC_USE_SUPABASE"  
echo "EXPO_PUBLIC_SUPABASE_URL: $EXPO_PUBLIC_SUPABASE_URL"
echo "EXPO_PUBLIC_USE_SUPABASE_EMULATOR: $EXPO_PUBLIC_USE_SUPABASE_EMULATOR"
echo "EXPO_PUBLIC_SUPABASE_EMULATOR_HOST: $EXPO_PUBLIC_SUPABASE_EMULATOR_HOST"
echo "EXPO_PUBLIC_SUPABASE_ANON_KEY: $EXPO_PUBLIC_SUPABASE_ANON_KEY"
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

# Take screenshot before starting tests
echo "📸 Taking screenshot before starting tests..."
adb shell screencap -p /sdcard/pre-test-screenshot.png
adb pull /sdcard/pre-test-screenshot.png maestro-debug-output/pre-test-screenshot.png || echo "Failed to capture pre-test screenshot"

# Take screenshot of current screen and save UI dump
echo "📸 Capturing UI state before tests..."
adb shell uiautomator dump /sdcard/ui-dump-pre-test.xml
adb pull /sdcard/ui-dump-pre-test.xml maestro-debug-output/ui-dump-pre-test.xml || echo "Failed to capture UI dump"

# Run individual Maestro tests with enhanced debugging
echo "🧪 Running Maestro tests individually with debug screenshots..."
MAESTRO_EXIT_CODE=0
TEST_COUNT=0
PASSED_COUNT=0

# Create test results summary
echo "=== ANDROID INTEGRATION TEST RESULTS ===" > maestro-debug-output/test-summary.txt
echo "Start time: $(date)" >> maestro-debug-output/test-summary.txt
echo "" >> maestro-debug-output/test-summary.txt

for test_file in .maestro/android/*.yml; do
    if [ -f "$test_file" ]; then
        TEST_COUNT=$((TEST_COUNT + 1))
        TEST_NAME=$(basename "$test_file" .yml)
        echo ""
        echo "🧪 Running test: $TEST_NAME"
        echo "Test: $TEST_NAME" >> maestro-debug-output/test-summary.txt
        
        # Clear any existing Supabase data using the clear script
        echo "Clearing Supabase database for $TEST_NAME..."
        node scripts/clear_emulator.js
        
        # Note: Not clearing app data since Maestro tests handle app launching themselves
        # and pm clear would remove the installed app process
        echo "Skipping app data clear to preserve installed app..."
        
        # Clear logcat buffer and start continuous logging
        echo "🔍 Starting React Native log capture for test: $TEST_NAME"
        adb logcat -c  # Clear existing logs
        
        # Start background logcat capture for React Native logs
        adb logcat -s ReactNativeJS:* -s System.err:* -s AndroidRuntime:* -s Supabase:* > "maestro-debug-output/reactnative-${TEST_NAME}.log" 2>&1 &
        LOGCAT_PID=$!
        
        # Also capture all logs with specific filters in a separate file
        adb logcat -v time | grep -E "(ReactNativeJS|Supabase|Legend|Error|Exception|Fatal|Crash)" > "maestro-debug-output/filtered-${TEST_NAME}.log" 2>&1 &
        FILTERED_LOGCAT_PID=$!
        
        # Give logcat a moment to start
        sleep 2
        
        # Take screenshot before test
        echo "📸 Taking screenshot before test: $TEST_NAME"
        adb shell screencap -p /sdcard/before-${TEST_NAME}.png
        adb pull /sdcard/before-${TEST_NAME}.png maestro-debug-output/before-${TEST_NAME}.png || echo "Failed to capture before screenshot"
        
        # Run individual test with timeout and capture output
        set +e  # Don't exit on command failure
        echo "Starting test execution at $(date)..."
        
        # Run maestro test directly and capture its exit code
        maestro test "$test_file" \
          --debug-output maestro-debug-output \
          --format junit \
          2>&1 | tee "maestro-debug-output/maestro-${TEST_NAME}.log"
        
        INDIVIDUAL_EXIT_CODE=$?
        set -e  # Re-enable exit on error
        
        # Stop logcat capture processes
        echo "🔍 Stopping log capture for test: $TEST_NAME"
        kill $LOGCAT_PID 2>/dev/null || true
        kill $FILTERED_LOGCAT_PID 2>/dev/null || true
        
        # Wait a moment for final logs to be written
        sleep 1
        
        # Capture final logcat state for immediate analysis
        echo "📝 Capturing final device logs..."
        adb logcat -d -v time | grep -E "(ReactNativeJS|Supabase|Legend|Error|Exception|Fatal|Crash)" | tail -50 > "maestro-debug-output/final-logs-${TEST_NAME}.log" 2>/dev/null || echo "No final logs captured"
        
        # Take screenshot after test (regardless of success/failure)
        echo "📸 Taking screenshot after test: $TEST_NAME"
        adb shell screencap -p /sdcard/after-${TEST_NAME}.png
        adb pull /sdcard/after-${TEST_NAME}.png maestro-debug-output/after-${TEST_NAME}.png || echo "Failed to capture after screenshot"
        
        # Capture UI state after test
        adb shell uiautomator dump /sdcard/ui-dump-after-${TEST_NAME}.xml
        adb pull /sdcard/ui-dump-after-${TEST_NAME}.xml maestro-debug-output/ui-dump-after-${TEST_NAME}.xml || echo "Failed to capture UI dump"
        
        # Log test result
        if [ $INDIVIDUAL_EXIT_CODE -eq 0 ]; then
            echo "✅ Test $TEST_NAME passed"
            echo "Status: PASSED" >> maestro-debug-output/test-summary.txt
            PASSED_COUNT=$((PASSED_COUNT + 1))
        else
            echo "❌ Test $TEST_NAME failed with exit code $INDIVIDUAL_EXIT_CODE"
            echo "Status: FAILED (exit code $INDIVIDUAL_EXIT_CODE)" >> maestro-debug-output/test-summary.txt
            MAESTRO_EXIT_CODE=$INDIVIDUAL_EXIT_CODE
            
            # Enhanced debugging for failed tests
            echo "🔍 Capturing enhanced debug info for failed test..."
            
            # Show React Native logs immediately for quick debugging
            echo ""
            echo "🔍 React Native Logs for Failed Test $TEST_NAME:"
            echo "================================================"
            if [ -f "maestro-debug-output/reactnative-${TEST_NAME}.log" ]; then
                echo "📱 React Native Console Output:"
                tail -20 "maestro-debug-output/reactnative-${TEST_NAME}.log" || echo "No React Native logs captured"
            fi
            
            if [ -f "maestro-debug-output/filtered-${TEST_NAME}.log" ]; then
                echo ""
                echo "🚨 Filtered Error/Debug Logs:"
                tail -15 "maestro-debug-output/filtered-${TEST_NAME}.log" || echo "No filtered logs captured"
            fi
            
            if [ -f "maestro-debug-output/final-logs-${TEST_NAME}.log" ]; then
                echo ""
                echo "📝 Final Device State Logs:"
                cat "maestro-debug-output/final-logs-${TEST_NAME}.log" || echo "No final logs captured"
            fi
            echo "================================================"
            echo ""
            
            # Capture detailed app logs for summary file
            echo "App logs during test failure:" >> maestro-debug-output/test-summary.txt
            adb logcat -d | grep -E "ReactNativeJS|Supabase|Legend|Error|Exception" | tail -20 >> maestro-debug-output/test-summary.txt || echo "No relevant logs" >> maestro-debug-output/test-summary.txt
            
            # Capture app state
            echo "App processes:" >> maestro-debug-output/test-summary.txt
            adb shell ps | grep -i strength >> maestro-debug-output/test-summary.txt || echo "No strength process found" >> maestro-debug-output/test-summary.txt
            
            # Take additional failure screenshot
            adb shell screencap -p /sdcard/failure-${TEST_NAME}.png
            adb pull /sdcard/failure-${TEST_NAME}.png maestro-debug-output/failure-${TEST_NAME}.png || echo "Failed to capture failure screenshot"
        fi
        
        echo "End time: $(date)" >> maestro-debug-output/test-summary.txt
        echo "Duration: $(date)" >> maestro-debug-output/test-summary.txt
        echo "---" >> maestro-debug-output/test-summary.txt
        
        # Brief wait between tests
        sleep 2
    fi
done

# Final summary
echo "" >> maestro-debug-output/test-summary.txt
echo "=== FINAL SUMMARY ===" >> maestro-debug-output/test-summary.txt
echo "Tests passed: $PASSED_COUNT/$TEST_COUNT" >> maestro-debug-output/test-summary.txt
echo "Overall result: $([ $MAESTRO_EXIT_CODE -eq 0 ] && echo "SUCCESS" || echo "FAILURE")" >> maestro-debug-output/test-summary.txt
echo "Final exit code: $MAESTRO_EXIT_CODE" >> maestro-debug-output/test-summary.txt

echo "=== POST-TEST DIAGNOSTICS ==="
echo "Maestro tests completed with exit code: $MAESTRO_EXIT_CODE"
echo "Tests passed: $PASSED_COUNT/$TEST_COUNT"

echo ""
echo "📊 Test Summary from file:"
if [ -f "maestro-debug-output/test-summary.txt" ]; then
    cat maestro-debug-output/test-summary.txt
else
    echo "⚠️ Test summary file not found"
fi

echo ""
echo "App logs during test execution:"
adb logcat -d | grep -E "ReactNativeJS|Supabase|Legend|Error|Exception" | tail -30 || echo "No relevant logs found"
echo ""

echo "Final app state:"
adb shell dumpsys activity activities | grep -i strength || echo "No strength activity found"
echo ""

echo "Final logcat entries:"
adb logcat -d | tail -30
echo ""

# Take final screenshot
echo "📸 Taking final screenshot for debugging..."
adb shell screencap -p /sdcard/final-screenshot.png
adb pull /sdcard/final-screenshot.png maestro-debug-output/final-screenshot.png || echo "Failed to capture final screenshot"

echo "Debug artifacts saved in maestro-debug-output/"

# List all screenshots and debug files created
if [ -d "maestro-debug-output" ]; then
    echo ""
    echo "📂 All debug artifacts created:"
    ls -la maestro-debug-output/
    
    echo ""
    echo "📸 Screenshots captured:"
    find maestro-debug-output -name "*.png" -exec basename {} \; | sort | while read screenshot; do
        if [ -n "$screenshot" ]; then
            SIZE=$(stat -c%s "maestro-debug-output/$screenshot" 2>/dev/null || echo "unknown")
            echo "  📷 $screenshot ($SIZE bytes)"
        fi
    done
    
    echo ""
    echo "📋 Log files captured:"
    find maestro-debug-output -name "*.log" -exec basename {} \; | sort | while read logfile; do
        if [ -n "$logfile" ]; then
            LINES=$(wc -l < "maestro-debug-output/$logfile" 2>/dev/null || echo "unknown")
            echo "  📝 $logfile ($LINES lines)"
        fi
    done
    
    echo ""
    echo "🔧 UI dumps captured:"
    find maestro-debug-output -name "*.xml" -exec basename {} \; | sort | while read xmlfile; do
        if [ -n "$xmlfile" ]; then
            SIZE=$(stat -c%s "maestro-debug-output/$xmlfile" 2>/dev/null || echo "unknown")
            echo "  📄 $xmlfile ($SIZE bytes)"
        fi
    done
    
    echo ""
    echo "📊 Debug artifact summary:"
    SCREENSHOT_COUNT=$(find maestro-debug-output -name "*.png" | wc -l)
    LOG_COUNT=$(find maestro-debug-output -name "*.log" | wc -l)
    XML_COUNT=$(find maestro-debug-output -name "*.xml" | wc -l)
    echo "  Screenshots: $SCREENSHOT_COUNT"
    echo "  Log files: $LOG_COUNT"
    echo "  UI dumps: $XML_COUNT"
    echo "  Total files: $(ls maestro-debug-output/ | wc -l)"
    
    # Quick analysis of React Native logs for debugging
    echo ""
    echo "🔍 React Native Log Analysis:"
    for test_file in maestro-debug-output/reactnative-*.log; do
        if [ -f "$test_file" ]; then
            test_name=$(basename "$test_file" .log | sed 's/reactnative-//')
            echo "  📱 $test_name:"
            
            # Count different types of messages
            error_count=$(grep -c -i "error\|exception\|fail" "$test_file" 2>/dev/null || echo "0")
            warn_count=$(grep -c -i "warn" "$test_file" 2>/dev/null || echo "0")
            supabase_count=$(grep -c -i "supabase" "$test_file" 2>/dev/null || echo "0")
            
            echo "    Errors: $error_count, Warnings: $warn_count, Supabase: $supabase_count"
            
            # Show first few error lines if any
            if [ "$error_count" -gt 0 ]; then
                echo "    First errors:"
                grep -i "error\|exception\|fail" "$test_file" | head -3 | sed 's/^/      /' 2>/dev/null || true
            fi
        fi
    done
else
    echo "⚠️ maestro-debug-output directory not found"
fi

# Cleanup temporary files on device
echo ""
echo "🧹 Cleaning up temporary files on device..."
adb shell rm -f /sdcard/*.png /sdcard/*.xml 2>/dev/null || true

# Stop the Android emulator
echo "🛑 Stopping Android emulator..."
if [ ! -z "$EMULATOR_PID" ]; then
    kill $EMULATOR_PID 2>/dev/null || true
    # Wait a bit for graceful shutdown
    sleep 5
    # Force kill if still running
    kill -9 $EMULATOR_PID 2>/dev/null || true
fi

# Explicitly fail if any tests failed
if [ $MAESTRO_EXIT_CODE -ne 0 ]; then
    echo "❌ Tests failed with exit code $MAESTRO_EXIT_CODE"
    exit $MAESTRO_EXIT_CODE
else
    echo "✅ All tests passed"
    exit 0
fi
