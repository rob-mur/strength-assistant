#!/usr/bin/env bash

echo "Starting Chrome integration tests..."

# Start Firebase emulator in background
firebase emulators:start &
FIREBASE_PID=$!

# Start Expo web server in background  
npm run web &
WEB_PID=$!

echo "Started Firebase emulator and Expo web server in background"

errorhandler () {
    echo "Cleaning up processes..."
    kill $FIREBASE_PID 2>/dev/null
    kill $WEB_PID 2>/dev/null
    npx kill-port 8080 2>/dev/null
    npx kill-port 8081 2>/dev/null
    pkill -f "expo start --web" 2>/dev/null
    # Clean up Chrome user data directories
    rm -rf /tmp/maestro-chrome-* 2>/dev/null || true
    pkill -f "chrome.*--user-data-dir" 2>/dev/null || true
}
trap errorhandler ERR EXIT

echo "Waiting for web server to be ready..."

# Wait for web server to be ready
for i in {1..30}; do
    if curl -s http://localhost:8081 > /dev/null; then
        echo "Web server is ready!"
        break
    fi
    echo "Waiting for web server... ($i/30)"
    sleep 2
    if [ $i -eq 30 ]; then
        echo "Timeout waiting for web server"
        exit 1
    fi
done

# Wait a bit more for Firebase emulator
echo "Waiting for Firebase emulator to be ready..."
sleep 5

# Clean up any existing Chrome processes and user data directories before starting tests
echo "Cleaning up existing Chrome sessions..."
rm -rf /tmp/maestro-chrome-* 2>/dev/null || true
pkill -f "chrome.*--user-data-dir" 2>/dev/null || true
sleep 2

# Run Maestro web tests
echo "Running Maestro web tests..."

# Find all .yml files in .maestro/web directory
TEST_FILES=$(find .maestro/web -name "*.yml" -type f)

if [ -z "$TEST_FILES" ]; then
    echo "ERROR: No test files found in .maestro/web directory"
    exit 1
fi

echo "Found test files:"
echo "$TEST_FILES"

# Run each test file individually
TEST_COUNT=0
FAILED_TESTS=0

for test_file in $TEST_FILES; do
    echo "Running test: $test_file"
    TEST_COUNT=$((TEST_COUNT + 1))
    
    if ! maestro test "$test_file"; then
        echo "FAILED: $test_file"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    else
        echo "PASSED: $test_file"
    fi
done

echo "Test summary: $TEST_COUNT total tests, $FAILED_TESTS failed"

if [ $FAILED_TESTS -gt 0 ]; then
    echo "ERROR: $FAILED_TESTS test(s) failed"
    exit 1
fi

echo "Chrome integration tests completed successfully!"