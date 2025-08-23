#!/usr/bin/env bash

set -e

echo "🌐 Starting Chrome Integration Tests"

# Function to perform comprehensive Chrome cleanup
deep_chrome_cleanup() {
    echo "🧹 Performing comprehensive Chrome cleanup..."
    
    # Kill Chrome and related processes more comprehensively
    for sig in TERM KILL; do
        # Kill Chrome processes with different patterns
        pkill -$sig -f "google-chrome" 2>/dev/null || true
        pkill -$sig -f "chromium" 2>/dev/null || true  
        pkill -$sig -f "chrome" 2>/dev/null || true
        pkill -$sig -f "chromedriver" 2>/dev/null || true
        pkill -$sig -f "ChromeDriver" 2>/dev/null || true
        
        # Wait between TERM and KILL
        if [ "$sig" = "TERM" ]; then
            sleep 3
        fi
    done
    
    # Clean up Chrome's state files and directories
    rm -rf /tmp/.org.chromium.Chromium.* 2>/dev/null || true
    rm -rf /tmp/.com.google.Chrome.* 2>/dev/null || true
    rm -rf /tmp/chrome_* 2>/dev/null || true
    rm -rf /tmp/scoped_dir* 2>/dev/null || true
    rm -rf /tmp/maestro-chrome-test-* 2>/dev/null || true
    
    # Kill processes using Chrome debugging ports
    lsof -ti:9222 2>/dev/null | xargs -r kill -9 2>/dev/null || true
    lsof -ti:9223 2>/dev/null | xargs -r kill -9 2>/dev/null || true
    lsof -ti:9224 2>/dev/null | xargs -r kill -9 2>/dev/null || true
    
    # Clean up any orphaned Chrome processes using more patterns
    ps aux | grep -i chrome | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null || true
    
    # Clean up Chrome's shared memory
    find /dev/shm -name ".org.chromium.*" -exec rm -rf {} + 2>/dev/null || true
    find /dev/shm -name "*chrome*" -exec rm -rf {} + 2>/dev/null || true
    
    echo "✅ Comprehensive Chrome cleanup completed"
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


# Run each Maestro test file individually with complete isolation
MAESTRO_EXIT_CODE=0
TEST_COUNT=0
FAILED_TESTS=""

# Perform initial comprehensive cleanup before starting any tests
echo "🧹 Initial comprehensive Chrome cleanup before tests..."
deep_chrome_cleanup

# Wait for system to stabilize after cleanup
sleep 5

for test_file in .maestro/web/*.yml; do
    if [ -f "$test_file" ]; then
        TEST_COUNT=$((TEST_COUNT + 1))
        test_name=$(basename "$test_file")
        echo "🧪 Running test: $test_name"
        
        # Complete Chrome cleanup and system reset before each test
        echo "🧹 Pre-test cleanup for $test_name..."
        deep_chrome_cleanup
        
        # Wait for complete system cleanup
        sleep 5
        
        # Create completely isolated test workspace
        TEST_WORKSPACE=$(mktemp -d -t maestro-test-workspace-XXXXXX)
        CHROME_USER_DATA_DIR="$TEST_WORKSPACE/chrome-data"
        mkdir -p "$CHROME_USER_DATA_DIR"
        
        echo "📁 Test workspace: $TEST_WORKSPACE"
        echo "📁 Chrome user data directory: $CHROME_USER_DATA_DIR"
        
        # Create a wrapper script that runs in complete isolation
        WRAPPER_SCRIPT="$TEST_WORKSPACE/run-test.sh"
        cat > "$WRAPPER_SCRIPT" << 'EOF'
#!/bin/bash
set -e

# Set Chrome to use our isolated directory
export CHROME_USER_DATA_DIR="$1"
export MAESTRO_DRIVER_STARTUP_TIMEOUT=60000
export MAESTRO_DRIVER_IMPLICIT_TIMEOUT=30000

# Force Chrome isolation with system environment
export DISPLAY=${DISPLAY:-:0}
export XDG_CONFIG_HOME="$CHROME_USER_DATA_DIR/.config"
export XDG_CACHE_HOME="$CHROME_USER_DATA_DIR/.cache"
export XDG_DATA_HOME="$CHROME_USER_DATA_DIR/.local/share"
mkdir -p "$XDG_CONFIG_HOME" "$XDG_CACHE_HOME" "$XDG_DATA_HOME"

# Run the actual test
maestro test "$2" --debug-output "$3"
EOF
        chmod +x "$WRAPPER_SCRIPT"
        
        # Run test in complete isolation
        echo "▶️ Executing isolated test: $test_name"
        if "$WRAPPER_SCRIPT" "$CHROME_USER_DATA_DIR" "$test_file" "maestro-debug-output" 2>&1 | tee -a maestro-debug-output/maestro-console.log; then
            INDIVIDUAL_EXIT_CODE=0
        else
            INDIVIDUAL_EXIT_CODE=$?
        fi
        
        if [ $INDIVIDUAL_EXIT_CODE -eq 0 ]; then
            echo "✅ $test_name passed"
        else
            echo "❌ $test_name failed with exit code $INDIVIDUAL_EXIT_CODE"
            MAESTRO_EXIT_CODE=$INDIVIDUAL_EXIT_CODE
            FAILED_TESTS="$FAILED_TESTS $test_name"
        fi
        
        # Immediate cleanup of test workspace
        echo "🧹 Cleaning up test workspace: $TEST_WORKSPACE"
        rm -rf "$TEST_WORKSPACE" 2>/dev/null || true
        
        # Full Chrome cleanup after each test
        deep_chrome_cleanup
        
        # Wait for complete cleanup before next test
        sleep 3
        
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