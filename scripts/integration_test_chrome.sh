#!/usr/bin/env bash

set -e

echo "🌐 Starting Chrome Integration Tests"

# Function to perform targeted Chrome browser cleanup (not other services)
cleanup_chrome_browsers() {
    echo "🧹 Cleaning up Chrome browser processes..."
    
    # Kill only specific Chrome browser processes (not other services that might contain "chrome")
    for sig in TERM KILL; do
        # Target very specific Chrome browser patterns to avoid killing Firebase/Node services
        pkill -$sig -f "google-chrome.*--remote-debugging-port" 2>/dev/null || true
        pkill -$sig -f "chromium.*--remote-debugging-port" 2>/dev/null || true
        pkill -$sig -f "chrome.*--headless" 2>/dev/null || true
        pkill -$sig -f "chromedriver" 2>/dev/null || true
        pkill -$sig -f "ChromeDriver" 2>/dev/null || true
        
        # Wait between TERM and KILL
        if [ "$sig" = "TERM" ]; then
            sleep 1
        fi
    done
    
    # Clean up Chrome's state files and directories
    rm -rf /tmp/.org.chromium.Chromium.* 2>/dev/null || true
    rm -rf /tmp/.com.google.Chrome.* 2>/dev/null || true
    rm -rf /tmp/chrome_* 2>/dev/null || true
    rm -rf /tmp/scoped_dir* 2>/dev/null || true
    rm -rf /tmp/maestro-chrome-test-* 2>/dev/null || true
    
    # Kill processes using Chrome debugging ports (but not our Firebase/Expo ports)
    lsof -ti:9222 2>/dev/null | xargs -r kill -9 2>/dev/null || true
    lsof -ti:9223 2>/dev/null | xargs -r kill -9 2>/dev/null || true
    lsof -ti:9224 2>/dev/null | xargs -r kill -9 2>/dev/null || true
    
    # Clean up Chrome's shared memory
    find /dev/shm -name ".org.chromium.*" -exec rm -rf {} + 2>/dev/null || true
    find /dev/shm -name "chrome_*" -exec rm -rf {} + 2>/dev/null || true
    
    echo "✅ Chrome browser cleanup completed"
}

# Function to cleanup background processes
cleanup() {
    echo "🧹 Final cleanup of all processes..."
    if [ ! -z "$FIREBASE_PID" ]; then
        kill $FIREBASE_PID 2>/dev/null || true
    fi
    if [ ! -z "$EXPO_PID" ]; then
        kill $EXPO_PID 2>/dev/null || true
    fi
    # Kill any remaining processes on ports we use
    npx kill-port 8080 2>/dev/null || true  # Firebase emulator
    npx kill-port 8081 2>/dev/null || true  # Expo web server
    
    # Perform targeted Chrome browser cleanup
    cleanup_chrome_browsers
}

# Set up cleanup trap
trap cleanup EXIT ERR

echo "🔥 Starting Firebase emulators..."
firebase emulators:start &
FIREBASE_PID=$!

echo "⏳ Waiting for Firebase emulators to be ready..."
# Wait for Firebase emulator to be ready
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

echo "🚀 Starting Expo web server..."
npx expo start --web --port 8081 &
EXPO_PID=$!

echo "⏳ Waiting for Expo web server to be ready..."
# Wait for Expo web server to be ready
timeout=60
counter=0
while ! curl -s http://localhost:8081 > /dev/null; do
    sleep 1
    counter=$((counter + 1))
    if [ $counter -ge $timeout ]; then
        echo "❌ Expo web server failed to start within $timeout seconds"
        exit 1
    fi
done
echo "✅ Expo web server ready at http://localhost:8081"

# Create debug output directory
mkdir -p maestro-debug-output

echo "🧪 Starting Maestro Chrome tests with enhanced debugging..."
echo "Debug output will be saved to maestro-debug-output/"

# Set Chrome driver configuration for maestro
export MAESTRO_DRIVER_STARTUP_TIMEOUT=30000
export MAESTRO_DRIVER_IMPLICIT_TIMEOUT=10000


# Run actual Maestro web tests with Chrome isolation
echo "🧪 Running Maestro web tests with Chrome isolation..."

# Perform initial targeted cleanup before starting any tests  
echo "🧹 Initial Chrome browser cleanup before tests..."
cleanup_chrome_browsers

# Wait briefly for cleanup to complete
sleep 2

# Initialize test tracking variables
FIRST_FAILED_EXIT_CODE=""
FAILED_TESTS=""
TEST_COUNT=0
PASSED_COUNT=0

# Run each Maestro test file individually with Chrome isolation
for test_file in .maestro/web/*.yml; do
    if [ -f "$test_file" ]; then
        TEST_COUNT=$((TEST_COUNT + 1))
        echo ""
        echo "🧪 Running test: $(basename "$test_file")"
        
        # Create unique Chrome user data directory for this test
        CHROME_USER_DATA_DIR=$(mktemp -d -t maestro-chrome-test-XXXXXX)
        export MAESTRO_CHROME_USER_DATA_DIR="$CHROME_USER_DATA_DIR"
        echo "📁 Using Chrome user data directory: $CHROME_USER_DATA_DIR"
        
        # Run the test and capture output
        maestro test "$test_file" --debug-output maestro-debug-output 2>&1 | tee -a maestro-debug-output/maestro-console.log
        INDIVIDUAL_EXIT_CODE=${PIPESTATUS[0]}
        
        if [ $INDIVIDUAL_EXIT_CODE -eq 0 ]; then
            echo "✅ $(basename "$test_file") passed"
            PASSED_COUNT=$((PASSED_COUNT + 1))
        else
            echo "❌ $(basename "$test_file") failed with exit code $INDIVIDUAL_EXIT_CODE"
            # Store the first failure exit code
            FIRST_FAILED_EXIT_CODE=${FIRST_FAILED_EXIT_CODE:-$INDIVIDUAL_EXIT_CODE}
            FAILED_TESTS="$FAILED_TESTS $(basename "$test_file")"
        fi
        
        # Cleanup this test's Chrome user data directory
        rm -rf "$CHROME_USER_DATA_DIR" 2>/dev/null || true
        unset MAESTRO_CHROME_USER_DATA_DIR
        
        # Perform Chrome browser cleanup between tests
        cleanup_chrome_browsers
        
        # Brief wait between tests for complete cleanup
        sleep 2
    fi
done

# Check if we found any test files
if [ $TEST_COUNT -eq 0 ]; then
    echo "❌ No test files found in .maestro/web/"
    exit 1
fi

echo ""
echo "🏁 MAESTRO TEST SUMMARY:"
echo "Total tests: $TEST_COUNT"
echo "Passed: $PASSED_COUNT"
echo "Failed: $((TEST_COUNT - PASSED_COUNT))"

# Set final exit code
if [ ! -z "$FIRST_FAILED_EXIT_CODE" ]; then
    MAESTRO_EXIT_CODE=$FIRST_FAILED_EXIT_CODE
else
    MAESTRO_EXIT_CODE=0
fi

echo "Maestro tests completed with exit code: $MAESTRO_EXIT_CODE"
echo "Debug artifacts saved in maestro-debug-output/"

# List any screenshots or debug files created
if [ -d "maestro-debug-output" ]; then
    echo "Debug artifacts created:"
    ls -la maestro-debug-output/
fi

if ls *.png 1> /dev/null 2>&1; then
    echo "Screenshots created:"
    ls -la *.png
fi

# Explicitly fail if any tests failed
if [ $MAESTRO_EXIT_CODE -ne 0 ]; then
    echo "❌ Tests failed with exit code $MAESTRO_EXIT_CODE"
    if [ ! -z "$FAILED_TESTS" ]; then
        echo "Failed tests:$FAILED_TESTS"
    fi
    exit $MAESTRO_EXIT_CODE
else
    echo "✅ All Chrome integration tests passed ($TEST_COUNT tests)"
    exit 0
fi