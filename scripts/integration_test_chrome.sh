#!/usr/bin/env bash

set -e

echo "🌐 Starting Chrome Integration Tests"

# Change to project root directory (relative to scripts folder)
cd "$(dirname "$0")/.."

# Cleanup function - runs at script exit
cleanup() {
    echo "🧹 Cleaning up processes..."
    supabase stop 2>/dev/null || true

    if [ ! -z "$EXPO_PID" ]; then
        kill $EXPO_PID 2>/dev/null || true
    fi

    # Clean up wrapper directories and temp files
    echo "🧹 Cleaning up Chrome wrapper and temp directories..."
    rm -rf /tmp/chrome-simple-* 2>/dev/null || true
    rm -rf /tmp/chrome-maestro-* 2>/dev/null || true
    rm -rf /tmp/chrome-ci-* 2>/dev/null || true
    rm -rf /tmp/chrome-wrapper-* 2>/dev/null || true
}

trap cleanup EXIT ERR

# Start Supabase emulators
echo "🔥 Starting Supabase emulators..."
supabase start

# Apply migrations
echo "🔄 Applying Supabase migrations..."
supabase db reset --local
echo "✅ Migrations applied"

# Set environment variables for Chrome testing
echo "🔧 Setting Chrome test environment variables..."
# CRITICAL FIX: Explicitly set CI=false to avoid conflicts with Chrome test environment
export CI=false
export CHROME_TEST=true
export EXPO_PUBLIC_CHROME_TEST=true
export EXPO_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMAs_-ApJY"
export EXPO_PUBLIC_USE_SUPABASE=true
export USE_SUPABASE_DATA=true
export NODE_ENV=development

echo "🔍 Environment Variables Debug:"
echo "CI=${CI:-unset}"
echo "CHROME_TEST=${CHROME_TEST}"
echo "EXPO_PUBLIC_CHROME_TEST=${EXPO_PUBLIC_CHROME_TEST}"
echo "EXPO_PUBLIC_SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL}"
echo "EXPO_PUBLIC_USE_SUPABASE=${EXPO_PUBLIC_USE_SUPABASE}"
echo "USE_SUPABASE_DATA=${USE_SUPABASE_DATA}"
echo "NODE_ENV=${NODE_ENV}"

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
echo "✅ Expo web server responding"

# Give Expo additional time to fully initialize for Maestro
echo "⏳ Waiting for Expo to fully initialize..."
sleep 5
echo "✅ Expo web server ready"

# Implement Chrome wrapper approach adapted for Nix store (read-only)
echo "🔧 Setting up Chrome wrapper for CI compatibility..."

# Find the original chromium binary
ORIGINAL_CHROMIUM_PATH=$(command -v chromium)
if [ -z "$ORIGINAL_CHROMIUM_PATH" ]; then
    echo "❌ Chromium binary not found"
    exit 1
fi

echo "📍 Found original Chromium at: $ORIGINAL_CHROMIUM_PATH"

# Create unique user data directory for this test run
TIMESTAMP=$(date +%s)
RANDOM_NUM=$RANDOM
UNIQUE_USER_DATA_DIR="/tmp/chrome-wrapper-${TIMESTAMP}-${RANDOM_NUM}-$$"
mkdir -p "$UNIQUE_USER_DATA_DIR"
chmod 755 "$UNIQUE_USER_DATA_DIR"

echo "🗂️ Using unique user data directory: $UNIQUE_USER_DATA_DIR"

# Create wrapper directory and script in writable location
WRAPPER_DIR="/tmp/chrome-wrapper-bin-$$"
mkdir -p "$WRAPPER_DIR"

# Create chromium wrapper script
echo "🔧 Creating Chrome wrapper with CI-compatible flags..."
cat > "$WRAPPER_DIR/chromium" << EOF
#!/bin/sh
exec "$ORIGINAL_CHROMIUM_PATH" "\${@}" --no-sandbox --disable-dev-shm-usage --disable-gpu --user-data-dir="$UNIQUE_USER_DATA_DIR" --remote-debugging-port=0
EOF

chmod 0755 "$WRAPPER_DIR/chromium"

# Put wrapper directory at the front of PATH so it's found first
export PATH="$WRAPPER_DIR:$PATH"

echo "✅ Chrome wrapper configured successfully at: $WRAPPER_DIR/chromium"
echo "🔧 PATH updated to use wrapper: $PATH" | head -c 100

# Clear Supabase database once before running tests
echo "🧹 Clearing Supabase database..."
node scripts/clear_emulator.js
echo "✅ Supabase data cleared"

# Run Maestro tests
echo "🧪 Running Maestro Chrome tests..."
echo "📄 Console output will be captured through Expo web server logs"
mkdir -p maestro-debug-output

# Use Maestro's built-in sequential execution - it will handle session management
echo "🎯 Running all tests sequentially via Maestro..."
# Note: We need to run each test file individually since Maestro folder mode
# doesn't work well with web browser detection in non-interactive mode
for test_file in .maestro/web/*.yml; do
    if [ -f "$test_file" ]; then
        echo "🧪 Running $(basename "$test_file")..."

        # Maestro handles Chrome lifecycle, no manual cleanup needed

        maestro test "$test_file" \
          --headless \
          --debug-output maestro-debug-output \
          --format junit || exit 1
    fi
done

echo "✅ All tests completed"
