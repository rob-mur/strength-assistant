#!/usr/bin/env bash

set -e

echo "🌐 Starting Chrome Integration Tests"

# Change to project root directory (relative to scripts folder)
cd "$(dirname "$0")/.."

# Set environment variables for testing
export USE_SUPABASE_DATA=false
export EXPO_PUBLIC_USE_SUPABASE_DATA=false
export NODE_ENV=test
export EXPO_ROUTER_APP_ROOT=./app

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

# Start Expo web server
echo "🚀 Starting Expo web server..."
# Ensure environment variables are available for Metro bundling
export EXPO_ROUTER_APP_ROOT=./app
# Use environment variable in command to ensure it's available during bundling
EXPO_ROUTER_APP_ROOT=./app npx expo start --web --port 8081 &
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

# Create Chrome wrapper script with required flags
CHROME_WRAPPER_SCRIPT="/tmp/chrome-wrapper-$$"
cat > "$CHROME_WRAPPER_SCRIPT" << 'EOF'
#!/bin/bash
if command -v chromium >/dev/null 2>&1; then
    exec chromium --no-sandbox --headless --disable-dev-shm-usage --disable-gpu --remote-debugging-port=0 "$@"
elif command -v google-chrome >/dev/null 2>&1; then
    exec google-chrome --no-sandbox --headless --disable-dev-shm-usage --disable-gpu --remote-debugging-port=0 "$@"
else
    echo "No Chrome binary found"
    exit 1
fi
EOF
chmod +x "$CHROME_WRAPPER_SCRIPT"
export MAESTRO_CHROME_PATH="$CHROME_WRAPPER_SCRIPT"

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
        
        # Run test
        maestro test "$test_file" --headless --debug-output maestro-debug-output
        INDIVIDUAL_EXIT_CODE=$?
        
        if [ $INDIVIDUAL_EXIT_CODE -eq 0 ]; then
            echo "✅ $(basename "$test_file") passed"
            PASSED_COUNT=$((PASSED_COUNT + 1))
        else
            echo "❌ $(basename "$test_file") failed with exit code $INDIVIDUAL_EXIT_CODE"
            FIRST_FAILED_EXIT_CODE=${FIRST_FAILED_EXIT_CODE:-$INDIVIDUAL_EXIT_CODE}
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
