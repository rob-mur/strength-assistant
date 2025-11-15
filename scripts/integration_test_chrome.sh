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

    # Kill Chrome/ChromeDriver processes
    pkill -f "chrome.*--headless" 2>/dev/null || true
    pkill -f "chromedriver" 2>/dev/null || true
    pkill -9 chromium 2>/dev/null || true
    pkill -9 chrome_crashpad_handler 2>/dev/null || true

    # Cleanup temp files and directories
    rm -f "$CHROME_WRAPPER_SCRIPT" 2>/dev/null || true
    rm -rf /tmp/chrome-maestro-* 2>/dev/null || true
    rm -rf /tmp/chrome-test-* 2>/dev/null || true
    rm -rf /tmp/chrome-custom-bin-* 2>/dev/null || true
    rm -rf /tmp/chrome-ci-* 2>/dev/null || true
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

# Create Chrome wrapper script that will replace the chromium binary
CHROME_WRAPPER_SCRIPT="/tmp/chrome-wrapper-$$"
ORIGINAL_CHROMIUM_PATH=$(command -v chromium)

cat > "$CHROME_WRAPPER_SCRIPT" << 'EOF'
#!/bin/bash
echo "🚀 Starting Chrome for Maestro testing..."
# Use timestamp and random number for unique user data directory
TIMESTAMP=$(date +%s)
RANDOM_NUM=$RANDOM
USER_DATA_DIR="/tmp/chrome-maestro-${TIMESTAMP}-${RANDOM_NUM}-$$"
echo "🗂️ Using unique user data directory: $USER_DATA_DIR"

# Use the original chromium binary path stored by the calling script
exec "$ORIGINAL_CHROMIUM_PATH" --no-sandbox --headless --disable-dev-shm-usage --disable-gpu --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --user-data-dir="$USER_DATA_DIR" --remote-debugging-port=0 "$@"
EOF

# Pass the original chromium path to the wrapper script
sed -i "s|\$ORIGINAL_CHROMIUM_PATH|$ORIGINAL_CHROMIUM_PATH|g" "$CHROME_WRAPPER_SCRIPT"
chmod +x "$CHROME_WRAPPER_SCRIPT"

# Create a custom PATH that puts our wrapper first
CUSTOM_BIN_DIR="/tmp/chrome-custom-bin-$$"
mkdir -p "$CUSTOM_BIN_DIR"
cp "$CHROME_WRAPPER_SCRIPT" "$CUSTOM_BIN_DIR/chromium"
chmod +x "$CUSTOM_BIN_DIR/chromium"

# Put our custom bin directory at the front of PATH
export PATH="$CUSTOM_BIN_DIR:$PATH"
export MAESTRO_CHROME_PATH="$CHROME_WRAPPER_SCRIPT"

# Debug: Show what's available in PATH
echo "🔍 Environment Debug Information:"
echo "PATH: $PATH"
echo "Available chrome/chromium binaries:"
command -v chromium >/dev/null 2>&1 && echo "  ✅ chromium: $(command -v chromium) ($(chromium --version 2>/dev/null || echo 'version unknown'))"
command -v google-chrome >/dev/null 2>&1 && echo "  📍 google-chrome: $(command -v google-chrome) ($(google-chrome --version 2>/dev/null || echo 'version unknown'))"
command -v chrome >/dev/null 2>&1 && echo "  📍 chrome: $(command -v chrome) ($(chrome --version 2>/dev/null || echo 'version unknown'))"

# Set ChromeDriver path to use devbox-provided version
if command -v chromedriver >/dev/null 2>&1; then
    CHROMEDRIVER_PATH=$(command -v chromedriver)
    export MAESTRO_CHROMEDRIVER_PATH="$CHROMEDRIVER_PATH"
    echo "🔧 Using ChromeDriver: $CHROMEDRIVER_PATH ($(chromedriver --version 2>/dev/null || echo 'version unknown'))"
else
    echo "⚠️ ChromeDriver not found in PATH"
fi

# Verify Maestro environment variables
echo "🎭 Maestro Configuration:"
echo "  MAESTRO_CHROME_PATH: ${MAESTRO_CHROME_PATH:-not set}"
echo "  MAESTRO_CHROMEDRIVER_PATH: ${MAESTRO_CHROMEDRIVER_PATH:-not set}"

# Also set Chrome binary path for Selenium WebDriver directly
echo "🔧 Setting Selenium Chrome options..."
export CHROME_EXECUTABLE="$CHROME_WRAPPER_SCRIPT"
export GOOGLE_CHROME_BIN="$CHROME_WRAPPER_SCRIPT"
export CHROME_BIN="$CHROME_WRAPPER_SCRIPT"

# CI-specific: Set additional Chrome options as environment variables
# that Selenium WebDriver can pick up directly
echo "🔧 Setting CI-specific Chrome options..."
TIMESTAMP=$(date +%s)
RANDOM_NUM=$RANDOM
UNIQUE_USER_DATA_DIR="/tmp/chrome-ci-${TIMESTAMP}-${RANDOM_NUM}-$$"

# Ensure the unique directory is created with proper permissions
mkdir -p "$UNIQUE_USER_DATA_DIR"
chmod 755 "$UNIQUE_USER_DATA_DIR"

export CHROME_USER_DATA_DIR="$UNIQUE_USER_DATA_DIR"
export CHROME_FLAGS="--no-sandbox --headless --disable-dev-shm-usage --disable-gpu --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --user-data-dir=$UNIQUE_USER_DATA_DIR --remote-debugging-port=0"

# CI-specific: Try to force Chrome options through Selenium WebDriver
export SELENIUM_CHROME_ARGS="--no-sandbox,--headless,--disable-dev-shm-usage,--disable-gpu,--user-data-dir=$UNIQUE_USER_DATA_DIR,--remote-debugging-port=0"
export WEBDRIVER_CHROME_ARGS="$CHROME_FLAGS"

echo "  CHROME_EXECUTABLE: ${CHROME_EXECUTABLE}"
echo "  GOOGLE_CHROME_BIN: ${GOOGLE_CHROME_BIN}"
echo "  CHROME_BIN: ${CHROME_BIN}"
echo "  CHROME_USER_DATA_DIR: ${CHROME_USER_DATA_DIR}"
echo "  CHROME_FLAGS: ${CHROME_FLAGS}"
echo "  SELENIUM_CHROME_ARGS: ${SELENIUM_CHROME_ARGS}"
echo "  WEBDRIVER_CHROME_ARGS: ${WEBDRIVER_CHROME_ARGS}"

# Clean up any existing Chrome processes and temp files BEFORE starting tests
echo "🧹 Pre-test cleanup: Aggressively killing all Chrome/Chromium processes..."
# Kill all possible Chrome-related processes in CI
pkill -9 chromium 2>/dev/null || true
pkill -9 chrome 2>/dev/null || true
pkill -9 google-chrome 2>/dev/null || true
pkill -9 chrome_crashpad_handler 2>/dev/null || true
pkill -9 chromedriver 2>/dev/null || true
pkill -f "chrome" 2>/dev/null || true
pkill -f "chromium" 2>/dev/null || true

# Wait for processes to fully terminate (reduced for CI performance)
echo "⏳ Waiting for Chrome processes to fully terminate..."
sleep 3

echo "🧹 Pre-test cleanup: Removing Chrome temp directories..."
rm -rf /tmp/.org.chromium.Chromium.* 2>/dev/null || true
rm -rf /tmp/chrome-* 2>/dev/null || true
rm -rf /tmp/maestro-chrome-* 2>/dev/null || true
rm -rf /tmp/.com.google.Chrome.* 2>/dev/null || true
# Remove any existing Chrome user data directories from previous runs
rm -rf /tmp/chrome-test-* 2>/dev/null || true
rm -rf /tmp/chrome-maestro-* 2>/dev/null || true
rm -rf /tmp/chrome-custom-bin-* 2>/dev/null || true
rm -rf /tmp/chrome-ci-* 2>/dev/null || true

echo "🧹 Pre-test cleanup: Removing Chromium lock files..."
rm -f /home/rob/.config/chromium/SingletonLock 2>/dev/null || true
rm -f /home/rob/.config/chromium/SingletonSocket 2>/dev/null || true
rm -f /home/rob/.config/chromium/SingletonCookie 2>/dev/null || true

# Clear Selenium Manager cache to force use of our Chromium
echo "🧹 Clearing Selenium Manager cache..."
rm -rf /home/rob/.cache/selenium/chrome 2>/dev/null || true

echo "⏳ Waiting for cleanup to complete..."
sleep 3

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

        # NUCLEAR OPTION: Kill ALL Chrome/Chromium processes (CI-enhanced)
        echo "🧹 Killing all Chrome/Chromium processes between tests..."
        pkill -9 chromium 2>/dev/null || true
        pkill -9 chrome 2>/dev/null || true
        pkill -9 google-chrome 2>/dev/null || true
        pkill -9 chrome_crashpad_handler 2>/dev/null || true
        pkill -9 chromedriver 2>/dev/null || true
        pkill -f "chrome" 2>/dev/null || true
        pkill -f "chromium" 2>/dev/null || true
        
        # Kill any processes using our user data directories
        if [ -n "$UNIQUE_USER_DATA_DIR" ]; then
            lsof +D "$UNIQUE_USER_DATA_DIR" 2>/dev/null | awk 'NR>1 {print $2}' | xargs -r kill -9 2>/dev/null || true
        fi

        # Remove ALL Chrome-related temp directories
        echo "🧹 Cleaning up Chrome temp directories..."
        rm -rf /tmp/.org.chromium.Chromium.* 2>/dev/null || true
        rm -rf /tmp/chrome-* 2>/dev/null || true
        rm -rf /tmp/maestro-chrome-* 2>/dev/null || true
        rm -rf /tmp/.com.google.Chrome.* 2>/dev/null || true
        # Remove any Chrome user data directories from previous test runs
        rm -rf /tmp/chrome-test-* 2>/dev/null || true
        rm -rf /tmp/chrome-maestro-* 2>/dev/null || true
        rm -rf /tmp/chrome-custom-bin-* 2>/dev/null || true
        rm -rf /tmp/chrome-ci-* 2>/dev/null || true

        # Clean Chromium config lock files
        echo "🧹 Cleaning Chromium lock files..."
        rm -f /home/rob/.config/chromium/SingletonLock 2>/dev/null || true
        rm -f /home/rob/.config/chromium/SingletonSocket 2>/dev/null || true
        rm -f /home/rob/.config/chromium/SingletonCookie 2>/dev/null || true

        # Wait for cleanup to complete and locks to release (optimized for CI)
        echo "⏳ Waiting for cleanup to complete..."
        sleep 3

        maestro test "$test_file" \
          --headless \
          --debug-output maestro-debug-output \
          --format junit || exit 1
    fi
done

echo "✅ All tests completed"
