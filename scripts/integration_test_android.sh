#!/usr/bin/env bash

# Integration test script that accepts APK filename as argument
# Usage: ./scripts/integration_test_android.sh <apk_filename>
# Example: ./scripts/integration_test_android.sh build_preview.apk
# Example: ./scripts/integration_test_android.sh build_production.apk

# Function to validate standardized error message format
validate_error_message() {
    local test_name="$1"
    local exit_code="$2"
    local error_log="$3"

    # Check if error message follows the standardized format
    if ! grep -q "ERROR: Test '$test_name' failed with exit code $exit_code" "$error_log" 2>/dev/null; then
        echo "WARNING: Standardized error format not found for test $test_name"
    fi

    if ! grep -q "Debug artifacts available at:" "$error_log" 2>/dev/null; then
        echo "WARNING: Debug artifacts location not reported for test $test_name"
    fi

    if ! grep -q "Failure details:" "$error_log" 2>/dev/null; then
        echo "WARNING: Failure details not provided for test $test_name"
    fi
}

APK_NAME=${1:-build_preview.apk}

if [ ! -f "$APK_NAME" ]; then
    echo "❌ APK file not found: $APK_NAME"
    echo "Usage: $0 <apk_filename>"
    echo "Example: $0 build_preview.apk"
    exit 1
fi

# Convert APK path to absolute path before changing directories
APK_NAME=$(realpath "$APK_NAME")

echo "🔄 Running integration tests with APK: $APK_NAME"

# Change to project root directory (relative to scripts folder)
cd "$(dirname "$0")/.."

# Github actions has a conflicting environment variable
unset ANDROID_SDK_ROOT
unset ANDROID_NDK_HOME
unset ANDROID_AVD_HOME
unset XDG_CONFIG_HOME


echo "🧹 Cleaning up old AVD files and temporary data to free disk space..."
# Remove any existing AVD files
rm -rf "$HOME/.android/avd/test.avd" 2>/dev/null || true
rm -f "$HOME/.android/avd/test.ini" 2>/dev/null || true

# Clean up Android SDK temporary files
rm -rf "$ANDROID_SDK_ROOT/system-images/*/*/x86_64/userdata.img" 2>/dev/null || true
rm -rf "$HOME/.android/cache" 2>/dev/null || true

# Clear Docker build cache to free additional space
echo "🧹 Clearing Docker cache to maximize available space..."
docker system prune -f --volumes 2>/dev/null || true

echo "📊 Available disk space before AVD creation:"
df -h "$HOME/.android" 2>/dev/null || df -h "$HOME"

echo "🔄 Creating Android AVD using devbox-managed system image..."
# Use the default system image with minimal SD card size
echo -e "no\nno\nno" | avdmanager create avd --force -n test -k "system-images;android-35;default;x86_64" --device "Nexus 5X" -c 128MB

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

# Optimize AVD for minimal disk space usage (CRITICAL for CI disk space constraints)
echo "🔧 Aggressively optimizing AVD for minimal disk usage..."

# CRITICAL: Reduce userdata partition to absolute minimum (256MB instead of default 7GB+)
sed -i 's/disk\.dataPartition\.size=.*/disk.dataPartition.size=256M/' "$AVD_CONFIG_FILE"
# Force minimal RAM (1GB instead of default 4GB+)
sed -i 's/hw\.ramSize=.*/hw.ramSize=1024/' "$AVD_CONFIG_FILE" || echo "hw.ramSize=1024" >> "$AVD_CONFIG_FILE"
# Disable all unnecessary features to save space
sed -i 's/hw\.gpu\.enabled=.*/hw.gpu.enabled=no/' "$AVD_CONFIG_FILE" || echo "hw.gpu.enabled=no" >> "$AVD_CONFIG_FILE"
sed -i 's/hw\.audioOutput=.*/hw.audioOutput=no/' "$AVD_CONFIG_FILE" || echo "hw.audioOutput=no" >> "$AVD_CONFIG_FILE"
sed -i 's/hw\.audioInput=.*/hw.audioInput=no/' "$AVD_CONFIG_FILE" || echo "hw.audioInput=no" >> "$AVD_CONFIG_FILE"
# Disable hardware features that consume space
sed -i 's/hw\.camera\.back=.*/hw.camera.back=none/' "$AVD_CONFIG_FILE" || echo "hw.camera.back=none" >> "$AVD_CONFIG_FILE"
sed -i 's/hw\.camera\.front=.*/hw.camera.front=none/' "$AVD_CONFIG_FILE" || echo "hw.camera.front=none" >> "$AVD_CONFIG_FILE"
# Minimize cache and other storage
sed -i 's/disk\.cachePartition\.size=.*/disk.cachePartition.size=32MB/' "$AVD_CONFIG_FILE"
sed -i 's/sdcard\.size=.*/sdcard.size=128 MB/' "$AVD_CONFIG_FILE"
# Clear any existing data partition path to force recreation with new size
sed -i 's/disk\.dataPartition\.initPath=.*/disk.dataPartition.initPath=/' "$AVD_CONFIG_FILE"

echo "📊 Verifying AVD configuration:"
grep -E "(disk\.dataPartition\.size|hw\.ramSize|sdcard\.size)" "$AVD_CONFIG_FILE" | head -5

echo "✅ Android AVD created and optimized successfully"

# CRITICAL: Create custom userdata image to bypass 7.37GB default allocation
echo "🔧 Creating custom 2GB userdata image (balanced for boot success + disk savings)..."
CUSTOM_USERDATA_IMG="$(dirname "$AVD_CONFIG_FILE")/userdata-custom-2gb.img"
if [ ! -f "$CUSTOM_USERDATA_IMG" ]; then
    # Create 2GB userdata image (minimum viable size for Android boot)
    dd if=/dev/zero of="$CUSTOM_USERDATA_IMG" bs=1M count=2048 2>/dev/null
    # Format as ext4 filesystem
    mkfs.ext4 -F "$CUSTOM_USERDATA_IMG" >/dev/null 2>&1
    echo "✅ Created and formatted custom 2GB userdata image"
else
    echo "✅ Using existing custom userdata image"
fi

adb start-server

# Set up error handler early to cleanup any processes
EMULATOR_PID=""

errorhandler () {
    echo "🧹 Cleaning up processes on exit..."

    # Restore original .env if we backed it up
    if [ -f ".env.integration_backup" ]; then
        echo "📄 Restoring original .env file..."
        mv .env.integration_backup .env
        echo "✅ Original .env restored"
    fi

    # Kill the specific emulator process if we have the PID
    if [ ! -z "$EMULATOR_PID" ]; then
        echo "🔄 Stopping emulator process $EMULATOR_PID..."
        kill $EMULATOR_PID 2>/dev/null || true
        # Wait a bit for graceful shutdown
        sleep 2
    fi

    # Kill any remaining emulator processes
    pkill -f "emulator.*test" 2>/dev/null || true

    # Stop Supabase
    supabase stop 2>/dev/null || true
}
trap errorhandler ERR EXIT

# Clean up any existing processes and Docker resources to save disk space
supabase stop || true

# Clean up Docker resources to free disk space
echo "🧹 Cleaning up Docker resources to save disk space..."
docker system prune -f || true
sleep 2

# Set up integration test environment
echo "⚙️ Setting up integration test environment..."

# Backup current .env to allow devbox environment variables to take precedence
if [ -f ".env" ]; then
    echo "📄 Backing up .env file (devbox env vars will be used instead)..."
    mv .env .env.integration_backup
    echo "✅ .env backed up - devbox integration environment now active"
    echo "   Supabase URL: http://10.0.2.2:54321 (emulator -> host, from devbox.json)"
else
    echo "📄 No .env file found - devbox environment variables will be used"
    echo "   Supabase URL: http://10.0.2.2:54321 (emulator -> host, from devbox.json)"
fi

# Use the existing APK if it exists, or note that a new build may be needed
if [ -f "$APK_NAME" ]; then
    echo "📱 Using existing APK: $APK_NAME"
    echo "⚠️  Note: APK may have been built with different environment variables"
    echo "   If tests fail due to network issues, rebuild APK with current environment"
else
    echo "📱 APK not found: $APK_NAME"
    echo "   Integration tests require a pre-built APK with correct environment"
    echo "   Please build APK first: npx expo run:android --variant release"
    exit 1
fi

# Start Supabase
echo "🔄 Starting Supabase at $(date)..."
supabase start
echo "✅ Supabase started successfully at $(date)"

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

# Start Android emulator with custom userdata image to bypass 7.37GB default
echo "🚀 Starting Android emulator with custom 2GB userdata image..."
# CRITICAL: Use -data parameter to specify custom userdata image
# This saves ~5.4GB compared to default 7.37GB userdata allocation
# -data: Use our custom 2GB userdata image (minimum viable for Android boot)
# -memory 768: Conservative RAM limit for better stability  
# -no-cache: Disable cache to save disk space
# -no-snapshot-save/load: Avoid snapshot overhead
emulator -avd test -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect \
  -data "$CUSTOM_USERDATA_IMG" -memory 768 -no-cache -no-snapshot-save -no-snapshot-load &
EMULATOR_PID=$!
echo "📱 Emulator started with PID: $EMULATOR_PID"

# Wait for device to be ready with health checks
echo "⏳ Waiting for Android emulator to be ready..."

# First check if emulator process is still running
if ! kill -0 $EMULATOR_PID 2>/dev/null; then
    echo "❌ Emulator process died during startup"
    exit 1
fi

adb wait-for-device

# Wait a bit more for the emulator to fully boot
echo "⏳ Waiting for emulator boot to complete..."
BOOT_COMPLETED=""
BOOT_ATTEMPTS=0
while [ "$BOOT_COMPLETED" != "1" ] && [ $BOOT_ATTEMPTS -lt 60 ]; do
    # Check if emulator process is still alive
    if ! kill -0 $EMULATOR_PID 2>/dev/null; then
        echo "❌ Emulator process died during boot (attempt $BOOT_ATTEMPTS)"
        exit 1
    fi

    sleep 3
    BOOT_COMPLETED=$(adb shell getprop sys.boot_completed 2>/dev/null || echo "0")
    echo "   Boot status: $BOOT_COMPLETED (attempt $BOOT_ATTEMPTS/60)"
    BOOT_ATTEMPTS=$((BOOT_ATTEMPTS + 1))

    # Also check if device is still connected
    if ! adb devices | grep -q emulator; then
        echo "❌ Emulator disconnected during boot"
        exit 1
    fi
done

if [ "$BOOT_COMPLETED" != "1" ]; then
    echo "❌ Emulator failed to boot after 60 attempts"
    echo "🔍 Emulator process status:"
    if kill -0 $EMULATOR_PID 2>/dev/null; then
        echo "   Emulator process is still running"
    else
        echo "   Emulator process has died"
    fi
    exit 1
fi

echo "✅ Android emulator is ready and fully booted"

# Install the APK
echo "📱 Installing APK to emulator: $APK_NAME"
adb install "$APK_NAME"

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

echo "=== PACKAGE DIAGNOSTICS ==="
echo "Checking what packages are installed:"
adb shell pm list packages | grep strength || echo "No strength packages found"
echo ""

echo "Checking APK package info:"
aapt dump badging ${1:-build_production.apk} | grep package || echo "Could not read APK package info"
echo ""

echo "Checking installed package details:"
adb shell dumpsys package com.jimmysolutions.strengthassistant.test | grep -E "(Package|Activity|versionName)" | head -10 || echo "Package not found on device"
echo ""

echo "Attempting to launch app..."
adb shell am start -n com.jimmysolutions.strengthassistant.test/.MainActivity
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

echo "Environment variables for Supabase (Android-specific):"
echo "EXPO_PUBLIC_USE_SUPABASE: $EXPO_PUBLIC_USE_SUPABASE"  
echo "EXPO_PUBLIC_SUPABASE_URL: $EXPO_PUBLIC_SUPABASE_URL"
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

        # IMPORTANT: Maestro doesn't return proper exit codes for test failures
        # Check the output for failure indicators instead
        if grep -q "Flow Failed\|Failed]" "maestro-debug-output/maestro-${TEST_NAME}.log"; then
            echo "🔍 Detected test failure in maestro output (maestro doesn't use proper exit codes)"
            INDIVIDUAL_EXIT_CODE=1
        elif grep -q "Flow path does not exist" "maestro-debug-output/maestro-${TEST_NAME}.log"; then
            echo "🔍 Detected missing test file in maestro output"
            INDIVIDUAL_EXIT_CODE=1
        fi

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
            echo "ERROR: Test '$TEST_NAME' failed with exit code $INDIVIDUAL_EXIT_CODE"
            echo "Debug artifacts available at: maestro-debug-output/"
            echo "Failure details: Maestro test execution failed - check debug logs for specifics"
            echo "❌ Test $TEST_NAME failed with exit code $INDIVIDUAL_EXIT_CODE"
            echo "Status: FAILED (exit code $INDIVIDUAL_EXIT_CODE)" >> maestro-debug-output/test-summary.txt
            # Only set MAESTRO_EXIT_CODE if it's currently 0 (preserve first failure)
            if [ $MAESTRO_EXIT_CODE -eq 0 ]; then
                MAESTRO_EXIT_CODE=$INDIVIDUAL_EXIT_CODE
            fi
            
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
echo "🔍 Final Test Results Summary:"
echo "   Tests run: $TEST_COUNT"
echo "   Tests passed: $PASSED_COUNT"
echo "   Tests failed: $((TEST_COUNT - PASSED_COUNT))"
echo "   Final exit code: $MAESTRO_EXIT_CODE"
echo "   Overall result: $([ $MAESTRO_EXIT_CODE -eq 0 ] && echo "✅ SUCCESS" || echo "❌ FAILURE")"

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
    echo "ERROR: Integration test suite failed with exit code $MAESTRO_EXIT_CODE"
    echo "Debug artifacts available at: maestro-debug-output/"
    echo "Failure details: One or more Maestro tests failed - see individual test logs"
    echo "❌ Tests failed with exit code $MAESTRO_EXIT_CODE"
    exit $MAESTRO_EXIT_CODE
else
    echo "✅ All tests passed"
    exit 0
fi
