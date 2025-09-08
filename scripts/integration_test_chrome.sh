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
    
    # Console capture process removed
    
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
NODE_OPTIONS=--openssl-legacy-provider npx expo start --web --port 8081 &
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

# Create Chrome wrapper script
CHROME_WRAPPER_SCRIPT="/tmp/chrome-wrapper-$$"

cat > "$CHROME_WRAPPER_SCRIPT" << 'EOF'
#!/bin/bash
echo "🚀 Starting Chrome for Maestro testing..."
if command -v chromium >/dev/null 2>&1; then
    echo "📱 Using Chromium browser"
    exec chromium --no-sandbox --headless --disable-dev-shm-usage --disable-gpu --user-data-dir=/tmp/chrome-test-$$ "$@"
elif command -v google-chrome >/dev/null 2>&1; then
    echo "📱 Using Google Chrome browser"
    exec google-chrome --no-sandbox --headless --disable-dev-shm-usage --disable-gpu --user-data-dir=/tmp/chrome-test-$$ "$@"
else
    echo "❌ No Chrome binary found"
    exit 1
fi
EOF
chmod +x "$CHROME_WRAPPER_SCRIPT"
export MAESTRO_CHROME_PATH="$CHROME_WRAPPER_SCRIPT"

# Note: Chrome DevTools connection removed as it's not compatible with Maestro test execution
echo "📄 Console output will be captured through Expo web server logs"

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
        
        # Clear log marker for this test
        echo "=== Starting test: $(basename "$test_file") at $(date) ==="
        
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
        
        # Browser console output handled through Expo logs
        echo "📋 Browser console output available through Expo web server logs"
        
        # Generate Chrome debug info
        if [ -f "maestro-debug-output/maestro-console-${TEST_NAME}.log" ]; then
            echo "📋 Maestro console output captured successfully"
            echo "📊 Maestro log size: $(wc -l < "maestro-debug-output/maestro-console-${TEST_NAME}.log") lines"
        fi
        
        # Check for screenshots
        SCREENSHOT_COUNT=0
        SCREENSHOT_LIST=""
        if [ -d "maestro-debug-output" ]; then
            SCREENSHOT_COUNT=$(find maestro-debug-output -name "*.png" | wc -l)
            if [ $SCREENSHOT_COUNT -gt 0 ]; then
                echo "📸 Found $SCREENSHOT_COUNT screenshots:"
                SCREENSHOT_LIST=$(find maestro-debug-output -name "*.png" -exec basename {} \; | sort | head -10)
                echo "$SCREENSHOT_LIST" | while read -r screenshot; do
                    if [ -n "$screenshot" ]; then
                        echo "  📷 $screenshot"
                    fi
                done
                if [ $SCREENSHOT_COUNT -gt 10 ]; then
                    echo "  📷 ... and $((SCREENSHOT_COUNT - 10)) more screenshots"
                fi
            else
                echo "⚠️ No screenshots found in debug output"
            fi
        fi

        # Create test summary
        cat > "maestro-debug-output/test-summary-${TEST_NAME}.txt" << EOF
Test: $TEST_NAME
Status: $([ $INDIVIDUAL_EXIT_CODE -eq 0 ] && echo "PASSED" || echo "FAILED")
Exit Code: $INDIVIDUAL_EXIT_CODE
Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Chrome User Data: $CHROME_USER_DATA_DIR
Maestro Output: $([ -f "maestro-debug-output/maestro-console-${TEST_NAME}.log" ] && echo "Available" || echo "Not Found")
JUnit Report: $([ -f "maestro-debug-output/report.xml" ] && echo "Available" || echo "Not Found")
Screenshots: $SCREENSHOT_COUNT captured
Screenshot Files: 
$SCREENSHOT_LIST
EOF
        
        if [ $INDIVIDUAL_EXIT_CODE -eq 0 ]; then
            echo "✅ $(basename "$test_file") passed"
            PASSED_COUNT=$((PASSED_COUNT + 1))
        else
            echo "❌ $(basename "$test_file") failed with exit code $INDIVIDUAL_EXIT_CODE"
            FIRST_FAILED_EXIT_CODE=${FIRST_FAILED_EXIT_CODE:-$INDIVIDUAL_EXIT_CODE}
            
            # Show debug information for failed tests
            echo "📋 Debug information for failed test:"
            echo "🌐 Browser console output available through Expo web server logs"
            
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

# Final debug artifacts summary
echo ""
echo "📋 Final Debug Artifacts Summary:"
if [ -d "maestro-debug-output" ]; then
    echo "🗂️ Debug output directory contents:"
    ls -la maestro-debug-output/ | head -20
    
    echo ""
    echo "📸 Screenshot Summary:"
    TOTAL_SCREENSHOTS=$(find maestro-debug-output -name "*.png" | wc -l)
    echo "   Total screenshots captured: $TOTAL_SCREENSHOTS"
    if [ $TOTAL_SCREENSHOTS -gt 0 ]; then
        echo "   Screenshot files:"
        find maestro-debug-output -name "*.png" | sort | head -10 | while read -r screenshot; do
            SIZE=$(stat -f%z "$screenshot" 2>/dev/null || stat -c%s "$screenshot" 2>/dev/null || echo "unknown")
            echo "   📷 $(basename "$screenshot") ($SIZE bytes)"
        done
        if [ $TOTAL_SCREENSHOTS -gt 10 ]; then
            echo "   📷 ... and $((TOTAL_SCREENSHOTS - 10)) more screenshots"
        fi
    fi
    
    echo ""
    echo "📊 Log File Summary:"
    for log_file in maestro-debug-output/*.log; do
        if [ -f "$log_file" ]; then
            SIZE=$(stat -f%z "$log_file" 2>/dev/null || stat -c%s "$log_file" 2>/dev/null || echo "unknown")
            LINES=$(wc -l < "$log_file" 2>/dev/null || echo "unknown")
            echo "   📝 $(basename "$log_file"): $LINES lines, $SIZE bytes"
        fi
    done
else
    echo "⚠️ No debug artifacts directory found"
fi

if [ ! -z "$FIRST_FAILED_EXIT_CODE" ]; then
    echo "❌ Tests failed"
    exit $FIRST_FAILED_EXIT_CODE
else
    echo "✅ All tests passed"
    exit 0
fi
