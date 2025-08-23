#!/usr/bin/env bash

set -e

echo "🌐 Starting Chrome Integration Tests"

# Function to perform deep Chrome cleanup
deep_chrome_cleanup() {
    echo "🧹 Performing deep Chrome cleanup..."
    
    # Kill only Chrome and chromedriver processes, avoiding firebase/expo/node
    for sig in TERM KILL; do
        # Be more specific with Chrome process patterns to avoid killing other processes
        pkill -$sig -f "google-chrome.*--remote-debugging" 2>/dev/null || true
        pkill -$sig -f "chromium.*--remote-debugging" 2>/dev/null || true  
        pkill -$sig -f "chrome.*--headless" 2>/dev/null || true
        pkill -$sig -f "chromedriver" 2>/dev/null || true
        pkill -$sig -f "ChromeDriver" 2>/dev/null || true
        
        # Wait between signals
        if [ "$sig" = "TERM" ]; then
            sleep 2
        fi
    done
    
    # Clean up Chrome sockets and locks
    rm -rf /tmp/.org.chromium.Chromium.* 2>/dev/null || true
    rm -rf /tmp/.com.google.Chrome.* 2>/dev/null || true
    rm -rf /tmp/chrome_* 2>/dev/null || true
    rm -rf /tmp/scoped_dir* 2>/dev/null || true
    
    # Clean up any Chrome debugging ports
    ss -tulpn | grep ':909[0-9]' | awk '{print $7}' | cut -d'/' -f1 | xargs -I {} kill -9 {} 2>/dev/null || true
    
    # Clean up all maestro Chrome temp directories
    find /tmp -maxdepth 1 -name "maestro-chrome-test-*" -type d -exec rm -rf {} + 2>/dev/null || true
    find /tmp -maxdepth 1 -name ".org.chromium.Chromium.*" -type d -exec rm -rf {} + 2>/dev/null || true
    
    echo "✅ Deep Chrome cleanup completed"
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
    
    # Perform comprehensive Chrome cleanup
    deep_chrome_cleanup
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

# Function to cleanup Chrome processes and user data directory
cleanup_chrome_test() {
    local user_data_dir=$1
    echo "🧹 Cleaning up Chrome for current test: $user_data_dir"
    
    # Stop environment variable first to prevent new sessions
    unset MAESTRO_CHROME_USER_DATA_DIR 2>/dev/null || true
    
    # Perform deep cleanup
    deep_chrome_cleanup
    
    # Clean up specific user data directory
    if [ ! -z "$user_data_dir" ] && [ -d "$user_data_dir" ]; then
        rm -rf "$user_data_dir" 2>/dev/null || true
        echo "🗑️ Cleaned up user data directory: $user_data_dir"
    fi
    
    # Additional wait to ensure complete cleanup
    sleep 3
}

# Run each Maestro test file individually (required for web tests)
MAESTRO_EXIT_CODE=0
TEST_COUNT=0
FAILED_TESTS=""

# Perform initial deep cleanup before starting any tests
echo "🧹 Initial Chrome cleanup before tests..."
deep_chrome_cleanup

for test_file in .maestro/web/*.yml; do
    if [ -f "$test_file" ]; then
        TEST_COUNT=$((TEST_COUNT + 1))
        test_name=$(basename "$test_file")
        echo "🧪 Running test: $test_name"
        
        # Ensure clean state before each test
        deep_chrome_cleanup
        
        # Create unique user data directory for this specific test with more entropy
        CHROME_USER_DATA_DIR=$(mktemp -d -t maestro-chrome-test-$(date +%s%N)-XXXXXX)
        export MAESTRO_CHROME_USER_DATA_DIR="$CHROME_USER_DATA_DIR"
        
        # Set additional Chrome options to prevent session conflicts
        export MAESTRO_CHROME_OPTIONS="--user-data-dir=$CHROME_USER_DATA_DIR --no-first-run --disable-default-apps --disable-popup-blocking --disable-translate --disable-background-timer-throttling --disable-renderer-backgrounding --disable-backgrounding-occluded-windows --disable-features=TranslateUI --disable-ipc-flooding-protection --remote-debugging-port=0 --disable-dev-shm-usage --no-sandbox"
        
        echo "📁 Using Chrome user data directory: $CHROME_USER_DATA_DIR"
        echo "🔧 Chrome options: $MAESTRO_CHROME_OPTIONS"
        
        # Run individual test with debug output and capture exit code properly
        maestro test "$test_file" --debug-output maestro-debug-output 2>&1 | tee -a maestro-debug-output/maestro-console.log
        INDIVIDUAL_EXIT_CODE=${PIPESTATUS[0]}
        
        if [ $INDIVIDUAL_EXIT_CODE -eq 0 ]; then
            echo "✅ $test_name passed"
        else
            echo "❌ $test_name failed with exit code $INDIVIDUAL_EXIT_CODE"
            MAESTRO_EXIT_CODE=$INDIVIDUAL_EXIT_CODE
            FAILED_TESTS="$FAILED_TESTS $test_name"
        fi
        
        # Clean up Chrome processes and user data directory immediately after each test
        cleanup_chrome_test "$CHROME_USER_DATA_DIR"
        unset MAESTRO_CHROME_USER_DATA_DIR
        unset MAESTRO_CHROME_OPTIONS
        
        echo "---"
    fi
done

if [ $TEST_COUNT -eq 0 ]; then
    echo "⚠️ No test files found in .maestro/web/"
    MAESTRO_EXIT_CODE=1
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
    echo "❌ Some tests failed with exit code $MAESTRO_EXIT_CODE"
    if [ ! -z "$FAILED_TESTS" ]; then
        echo "Failed tests:$FAILED_TESTS"
    fi
    exit $MAESTRO_EXIT_CODE
else
    echo "✅ All Chrome integration tests passed ($TEST_COUNT tests)"
    exit 0
fi