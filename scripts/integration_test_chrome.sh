#!/usr/bin/env bash

set -e

echo "🌐 Starting Chrome Integration Tests"

# Change to project root directory (relative to scripts folder)
cd "$(dirname "$0")/.."

# Set environment variables for testing
export USE_SUPABASE_DATA=false
export EXPO_PUBLIC_USE_SUPABASE_DATA=false
export NODE_ENV=test
export CHROME_TEST=true
export CI=true

# Load test environment if available
if [ -f ".env.test" ]; then
    echo "📋 Loading test environment configuration..."
    set -a
    source .env.test
    set +a
fi

# Cleanup function
cleanup() {
    echo "🧹 Cleaning up processes..."
    if [ ! -z "$FIREBASE_PID" ]; then
        kill $FIREBASE_PID 2>/dev/null || true
    fi

    supabase stop 2>/dev/null || true

    if [ ! -z "$EXPO_PID" ]; then
        kill $EXPO_PID 2>/dev/null || true
    fi
    
    # Kill console capture process
    if [ ! -z "$CONSOLE_CAPTURE_PID" ]; then
        kill $CONSOLE_CAPTURE_PID 2>/dev/null || true
    fi
    
    # Kill Chrome processes
    pkill -f "chrome.*--headless" 2>/dev/null || true
    pkill -f "chromedriver" 2>/dev/null || true
    
    # Cleanup temp files
    rm -f "$CHROME_WRAPPER_SCRIPT" 2>/dev/null || true
    rm -rf /tmp/maestro-chrome-test-* 2>/dev/null || true
}

trap cleanup EXIT ERR

# Start Firebase emulators
echo "🔥 Starting Firebase emulators..."
firebase emulators:start &
FIREBASE_PID=$!

# Start Supabase emulators
echo "🔥 Starting Supabase emulators..."
supabase start

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

# Apply migrations
echo "🔄 Applying Supabase migrations..."
supabase db reset --local
echo "✅ Migrations applied"

# Patch expo-router context to use static app root
echo "🔧 Patching expo-router context for static resolution..."
node scripts/fix-expo-router-context.js

# Start Expo web server
echo "🚀 Starting Expo web server..."
npx expo start --web --port 8081 &
EXPO_PID=$!

# Wait for Expo web server
echo "⏳ Waiting for Expo web server to be ready..."
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
echo "✅ Expo web server ready"

# Create Chrome wrapper script with remote debugging enabled
CHROME_WRAPPER_SCRIPT="/tmp/chrome-wrapper-$$"
CONSOLE_LOG_FILE="/tmp/chrome-console-$$.log"

cat > "$CHROME_WRAPPER_SCRIPT" << 'EOF'
#!/bin/bash
echo "🚀 Starting Chrome with DevTools on port 9222..."
if command -v chromium >/dev/null 2>&1; then
    echo "📱 Using Chromium browser"
    exec chromium --no-sandbox --headless --disable-dev-shm-usage --disable-gpu --remote-debugging-port=9222 --remote-allow-origins=* --enable-logging --log-level=0 --user-data-dir=/tmp/chrome-test-$$ "$@"
elif command -v google-chrome >/dev/null 2>&1; then
    echo "📱 Using Google Chrome browser"
    exec google-chrome --no-sandbox --headless --disable-dev-shm-usage --disable-gpu --remote-debugging-port=9222 --remote-allow-origins=* --enable-logging --log-level=0 --user-data-dir=/tmp/chrome-test-$$ "$@"
else
    echo "❌ No Chrome binary found"
    exit 1
fi
EOF
chmod +x "$CHROME_WRAPPER_SCRIPT"
export MAESTRO_CHROME_PATH="$CHROME_WRAPPER_SCRIPT"

# Start Chrome console capture using DevTools Protocol
echo "🔍 Starting Chrome console capture..."
echo "📄 Console log file: $CONSOLE_LOG_FILE"
echo "🔌 Chrome DevTools port: 9222"

# Ensure console capture script exists
if [ ! -f "scripts/chrome-console-capture.js" ]; then
    echo "❌ Chrome console capture script not found!"
    exit 1
fi

# Start console capture with enhanced error handling and Chrome startup delay
echo "⏳ Waiting for Chrome to be available for DevTools connection..."
sleep 5  # Give Chrome more time to start and enable DevTools

node scripts/chrome-console-capture.js "$CONSOLE_LOG_FILE" 9222 &
CONSOLE_CAPTURE_PID=$!
echo "🔄 Console capture process started with PID: $CONSOLE_CAPTURE_PID"

# Wait for console capture to initialize and verify it's running
sleep 3
if ! kill -0 $CONSOLE_CAPTURE_PID 2>/dev/null; then
    echo "⚠️ Console capture process may have failed to start"
else
    echo "✅ Console capture process is running"
fi

# Run Maestro tests
echo "🧪 Running Maestro Chrome tests..."
mkdir -p maestro-debug-output

FIRST_FAILED_EXIT_CODE=""
TEST_COUNT=0
PASSED_COUNT=0

for test_file in .maestro/web/*.yml; do
    if [ -f "$test_file" ]; then
        TEST_COUNT=$((TEST_COUNT + 1))
        echo "🧪 Running test: $(basename "$test_file")"
        
        # Create unique Chrome user data directory
        CHROME_USER_DATA_DIR=$(mktemp -d -t maestro-chrome-test-XXXXXX)
        export MAESTRO_CHROME_USER_DATA_DIR="$CHROME_USER_DATA_DIR"
        
        # Clear console log for this test
        echo "=== Starting test: $(basename "$test_file") at $(date) ===" >> "$CONSOLE_LOG_FILE"
        
        # Run test with debug output and console capture
        echo "🔍 Running test with Maestro debug output..."
        set +e  # Don't exit on command failure, we need to capture exit code
        
        # Set enhanced logging environment
        export MAESTRO_CLI_LOG_LEVEL=DEBUG
        
        # Run maestro with valid CLI options and full logging
        maestro test "$test_file" \
          --headless \
          --debug-output maestro-debug-output \
          --format junit \
          --env MAESTRO_CLI_LOG_LEVEL=DEBUG \
          2>&1 | tee "maestro-debug-output/maestro-console-$(basename "$test_file" .yml).log"
        INDIVIDUAL_EXIT_CODE=${PIPESTATUS[0]}  # Get maestro's exit code, not tee's
        
        set -e  # Re-enable exit on error
        
# Add comprehensive debug artifacts collection
        TEST_NAME=$(basename "$test_file" .yml)
        
        # Copy browser console output
        if [ -f "$CONSOLE_LOG_FILE" ]; then
            echo "📋 Copying browser console output to debug artifacts..."
            cp "$CONSOLE_LOG_FILE" "maestro-debug-output/browser-console-${TEST_NAME}.log"
        else
            echo "⚠️ No console log file found at $CONSOLE_LOG_FILE"
        fi
        
        # Generate Chrome debug info
        if [ -f "maestro-debug-output/maestro-console-${TEST_NAME}.log" ]; then
            echo "📋 Maestro console output captured successfully"
            echo "📊 Maestro log size: $(wc -l < "maestro-debug-output/maestro-console-${TEST_NAME}.log") lines"
        fi
        
        # Create test summary
        cat > "maestro-debug-output/test-summary-${TEST_NAME}.txt" << EOF
Test: $TEST_NAME
Status: $([ $INDIVIDUAL_EXIT_CODE -eq 0 ] && echo "PASSED" || echo "FAILED")
Exit Code: $INDIVIDUAL_EXIT_CODE
Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Chrome User Data: $CHROME_USER_DATA_DIR
Console Log: $([ -f "$CONSOLE_LOG_FILE" ] && echo "Available" || echo "Not Found")
Maestro Output: $([ -f "maestro-debug-output/maestro-console-${TEST_NAME}.log" ] && echo "Available" || echo "Not Found")
JUnit Report: $([ -f "maestro-debug-output/report.xml" ] && echo "Available" || echo "Not Found")
EOF
        
        if [ $INDIVIDUAL_EXIT_CODE -eq 0 ]; then
            echo "✅ $(basename "$test_file") passed"
            PASSED_COUNT=$((PASSED_COUNT + 1))
        else
            echo "❌ $(basename "$test_file") failed with exit code $INDIVIDUAL_EXIT_CODE"
            FIRST_FAILED_EXIT_CODE=${FIRST_FAILED_EXIT_CODE:-$INDIVIDUAL_EXIT_CODE}
            
            # Show recent console output for failed tests
            echo "📋 Debug information for failed test:"
            if [ -f "$CONSOLE_LOG_FILE" ]; then
                echo "🌐 Recent browser console output (last 20 lines):"
                tail -20 "$CONSOLE_LOG_FILE" 2>/dev/null || echo "No console output available"
            else
                echo "⚠️ No console log file available at $CONSOLE_LOG_FILE"
            fi
            
            # Show Maestro debug output
            if [ -f "maestro-debug-output/maestro-console-${TEST_NAME}.log" ]; then
                echo "🤖 Recent Maestro output (last 15 lines):"
                tail -15 "maestro-debug-output/maestro-console-${TEST_NAME}.log" 2>/dev/null || echo "No Maestro output available"
            else
                echo "⚠️ No Maestro console log available"
            fi
            
            # List all available debug files
            echo "📂 Available debug artifacts:"
            ls -la maestro-debug-output/ 2>/dev/null || echo "No debug artifacts found"
        fi
        
        # Cleanup
        rm -rf "$CHROME_USER_DATA_DIR" 2>/dev/null || true
        unset MAESTRO_CHROME_USER_DATA_DIR
        
        # Brief wait between tests
        sleep 1
    fi
done

# Check results
if [ $TEST_COUNT -eq 0 ]; then
    echo "❌ No test files found in .maestro/web/"
    exit 1
fi

echo "🏁 Test Summary: $PASSED_COUNT/$TEST_COUNT tests passed"

if [ ! -z "$FIRST_FAILED_EXIT_CODE" ]; then
    echo "❌ Tests failed"
    exit $FIRST_FAILED_EXIT_CODE
else
    echo "✅ All tests passed"
    exit 0
fi
