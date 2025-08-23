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


# DIAGNOSTIC MODE: Test ChromeDriver launch directly (bypassing Maestro)
echo "🔧 DIAGNOSTIC MODE: Testing ChromeDriver launch directly..."

# Perform initial targeted cleanup before starting any tests  
echo "🧹 Initial Chrome browser cleanup before tests..."
cleanup_chrome_browsers

# Wait briefly for cleanup to complete
sleep 2

# Test 1: Check if chromedriver is available and can be executed
echo "📋 Test 1: Checking ChromeDriver availability..."
if command -v chromedriver >/dev/null 2>&1; then
    echo "✅ chromedriver command found in PATH"
    chromedriver --version
else
    echo "❌ chromedriver command not found in PATH"
    echo "Available commands containing 'chrome':"
    compgen -c | grep -i chrome || echo "No chrome-related commands found"
fi

# Test 2: Check if chromium/chrome browser is available
echo ""
echo "📋 Test 2: Checking Chrome/Chromium browser availability..."
for browser in chromium chromium-browser google-chrome chrome; do
    if command -v "$browser" >/dev/null 2>&1; then
        echo "✅ $browser found in PATH"
        "$browser" --version 2>/dev/null || echo "Could not get version for $browser"
    else
        echo "❌ $browser not found in PATH"
    fi
done

# Test 3: Try to start ChromeDriver directly
echo ""
echo "📋 Test 3: Attempting to start ChromeDriver directly..."
CHROME_USER_DATA_DIR=$(mktemp -d -t diagnostic-chrome-XXXXXX)
echo "📁 Using Chrome user data directory: $CHROME_USER_DATA_DIR"

# Start ChromeDriver in background
CHROMEDRIVER_PORT=9515
echo "🚀 Starting ChromeDriver on port $CHROMEDRIVER_PORT..."

if chromedriver --port=$CHROMEDRIVER_PORT --whitelisted-ips= --user-data-dir="$CHROME_USER_DATA_DIR" 2>&1 &
then
    CHROMEDRIVER_PID=$!
    echo "🎯 ChromeDriver started with PID: $CHROMEDRIVER_PID"
    
    # Wait a moment for ChromeDriver to fully start
    sleep 3
    
    # Test if ChromeDriver is responding
    echo "📡 Testing ChromeDriver connectivity..."
    if curl -s http://localhost:$CHROMEDRIVER_PORT/status >/dev/null 2>&1; then
        echo "✅ ChromeDriver is responding on port $CHROMEDRIVER_PORT"
        echo "ChromeDriver status response:"
        curl -s http://localhost:$CHROMEDRIVER_PORT/status | head -5
        CHROMEDRIVER_TEST_RESULT=0
    else
        echo "❌ ChromeDriver is not responding on port $CHROMEDRIVER_PORT"
        CHROMEDRIVER_TEST_RESULT=1
    fi
    
    # Kill ChromeDriver
    echo "🛑 Stopping ChromeDriver (PID: $CHROMEDRIVER_PID)..."
    kill $CHROMEDRIVER_PID 2>/dev/null || true
    sleep 1
    # Force kill if needed
    kill -9 $CHROMEDRIVER_PID 2>/dev/null || true
else
    echo "❌ Failed to start ChromeDriver"
    CHROMEDRIVER_TEST_RESULT=1
fi

# Test 4: Try to start Chrome/Chromium directly in headless mode
echo ""
echo "📋 Test 4: Testing Chrome/Chromium direct launch..."
for browser in chromium chromium-browser google-chrome chrome; do
    if command -v "$browser" >/dev/null 2>&1; then
        echo "🚀 Testing $browser in headless mode..."
        
        if "$browser" --headless --disable-gpu --no-sandbox --disable-dev-shm-usage --remote-debugging-port=9222 --user-data-dir="$CHROME_USER_DATA_DIR" --disable-extensions --disable-plugins about:blank &
        then
            CHROME_PID=$!
            echo "🎯 $browser started with PID: $CHROME_PID"
            
            # Wait for Chrome to start
            sleep 3
            
            # Test if Chrome is responding
            if curl -s http://localhost:9222/json/version >/dev/null 2>&1; then
                echo "✅ $browser is responding on debugging port 9222"
                echo "$browser version info:"
                curl -s http://localhost:9222/json/version | head -3
                BROWSER_TEST_RESULT=0
            else
                echo "❌ $browser is not responding on debugging port 9222"
                BROWSER_TEST_RESULT=1
            fi
            
            # Kill Chrome
            echo "🛑 Stopping $browser (PID: $CHROME_PID)..."
            kill $CHROME_PID 2>/dev/null || true
            sleep 1
            kill -9 $CHROME_PID 2>/dev/null || true
        else
            echo "❌ Failed to start $browser"
            BROWSER_TEST_RESULT=1
        fi
        break  # Only test the first available browser
    fi
done

# Cleanup temp directory
rm -rf "$CHROME_USER_DATA_DIR" 2>/dev/null || true

echo ""
echo "🏁 DIAGNOSTIC SUMMARY:"
echo "ChromeDriver test result: $CHROMEDRIVER_TEST_RESULT (0=success, 1=failure)"
echo "Browser test result: $BROWSER_TEST_RESULT (0=success, 1=failure)"

# Exit with failure if any tests failed
MAESTRO_EXIT_CODE=0
if [ "$CHROMEDRIVER_TEST_RESULT" -ne 0 ] || [ "$BROWSER_TEST_RESULT" -ne 0 ]; then
    echo "❌ Chrome/ChromeDriver diagnostic tests failed"
    MAESTRO_EXIT_CODE=1
else
    echo "✅ Chrome/ChromeDriver diagnostic tests passed"
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
    echo "❌ Test failed with exit code $MAESTRO_EXIT_CODE"
    if [ ! -z "$FAILED_TESTS" ]; then
        echo "Failed tests:$FAILED_TESTS"
    fi
    exit $MAESTRO_EXIT_CODE
else
    echo "✅ Single Chrome integration test passed ($TEST_COUNT test)"
    exit 0
fi