#!/usr/bin/env bash

set -e

echo "🌐 Starting Chrome Integration Tests"

# Function to cleanup background processes
cleanup() {
    echo "🧹 Cleaning up background processes..."
    if [ ! -z "$FIREBASE_PID" ]; then
        kill $FIREBASE_PID 2>/dev/null || true
    fi
    if [ ! -z "$EXPO_PID" ]; then
        kill $EXPO_PID 2>/dev/null || true
    fi
    # Kill any remaining processes on ports we use
    npx kill-port 8080 2>/dev/null || true  # Firebase emulator
    npx kill-port 8081 2>/dev/null || true  # Expo web server
    
    # Kill any lingering Chrome processes
    pkill -f "chromium.*headless" 2>/dev/null || true
    pkill -f "chromedriver" 2>/dev/null || true
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

# Run Maestro with debug output and capture console output
maestro test .maestro/web --debug-output maestro-debug-output 2>&1 | tee maestro-debug-output/maestro-console.log

# Capture final status (using PIPESTATUS to get maestro's exit code, not tee's)
MAESTRO_EXIT_CODE=${PIPESTATUS[0]}

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
    exit $MAESTRO_EXIT_CODE
else
    echo "✅ All Chrome integration tests passed"
    exit 0
fi