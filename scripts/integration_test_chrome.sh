#!/usr/bin/env bash

set -e

echo "🌐 Starting Chrome Integration Tests"

# Initial cleanup to ensure no leftover Chrome processes
echo "🧹 Initial cleanup of any existing Chrome processes..."
pgrep -f "chrome" | xargs kill -9 2>/dev/null || true
pgrep -f "chromium" | xargs kill -9 2>/dev/null || true
rm -rf /tmp/chrome-* 2>/dev/null || true
sleep 1

# Change to project root directory (relative to scripts folder)
cd "$(dirname "$0")/.."

# Cleanup function - runs at script exit
cleanup() {
    echo "🧹 Cleaning up processes..."
    
    # Force kill any Chrome processes that might be lingering
    pkill -f "chrome" 2>/dev/null || true
    pkill -f "chromium" 2>/dev/null || true
    sleep 2
    
    supabase stop 2>/dev/null || true

    if [ ! -z "$EXPO_PID" ]; then
        kill $EXPO_PID 2>/dev/null || true
    fi

    # Clean up Chrome temp directories and wrapper scripts
    echo "🧹 Cleaning up Chrome temp directories..."
    rm -rf /tmp/chrome-* 2>/dev/null || true
    
    # Restore any overridden system binaries
    if [ -d "/tmp/chrome-backup-$$" ]; then
        echo "🔄 Restoring system Chrome binaries..."
        for backup_file in "/tmp/chrome-backup-$$"/*.backup; do
            if [ -f "$backup_file" ]; then
                binary_name="$(basename "$backup_file" .backup)"
                system_path="/usr/bin/$binary_name"
                sudo mv "$backup_file" "$system_path" 2>/dev/null || mv "$backup_file" "$system_path" 2>/dev/null || true
            fi
        done
        rm -rf "/tmp/chrome-backup-$$" 2>/dev/null || true
    fi
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

# Using google-chrome-stable approach from Maestro issue #2576  
echo "🔧 Setting up Google Chrome with CI-compatible flags via environment..."

# Find the google-chrome-stable binary from Devbox, not system
# Check Devbox profile first to avoid picking up system Chrome
if [ -d ".devbox/nix/profile/default/bin" ]; then
    CHROME_PATH=".devbox/nix/profile/default/bin/google-chrome-stable"
    if [ ! -f "$CHROME_PATH" ]; then
        # Fallback to PATH search if not in Devbox bin
        CHROME_PATH=$(command -v google-chrome-stable)
    fi
else
    CHROME_PATH=$(command -v google-chrome-stable)
fi

if [ -z "$CHROME_PATH" ] || [ ! -f "$CHROME_PATH" ]; then
    echo "❌ Google Chrome Stable binary not found"
    exit 1
fi

echo "📍 Found Google Chrome at: $CHROME_PATH"

# Create unique user data directory for this test run
TIMESTAMP=$(date +%s)
RANDOM_NUM=$RANDOM
UNIQUE_USER_DATA_DIR="/tmp/chrome-${TIMESTAMP}-${RANDOM_NUM}-$$"
mkdir -p "$UNIQUE_USER_DATA_DIR"
chmod 755 "$UNIQUE_USER_DATA_DIR"

echo "🗂️ Using unique user data directory: $UNIQUE_USER_DATA_DIR"

# Set Chrome options via environment variables that Maestro/Selenium will use
export GOOGLE_CHROME_OPTS="--no-sandbox --disable-dev-shm-usage --disable-gpu --user-data-dir=$UNIQUE_USER_DATA_DIR --remote-debugging-port=0"
export CHROME_USER_DATA_DIR="$UNIQUE_USER_DATA_DIR"

# CRITICAL: Force Maestro/Selenium to use our Devbox Chrome binary instead of system chrome
export CHROME_BINARY="$CHROME_PATH"
export CHROMIUM_BINARY="$CHROME_PATH"  
export GOOGLE_CHROME_BINARY="$CHROME_PATH"

# Selenium WebDriver environment variables
export WEBDRIVER_CHROME_BINARY="$CHROME_PATH"
export SELENIUM_CHROME_BINARY="$CHROME_PATH"
# Note: webdriver.chrome.driver can't be exported as env var due to dots

# Disable Selenium's automatic WebDriver management and clear cache
export SELENIUM_MANAGER_DISABLED="true"
export WDM_LOCAL="$CHROME_PATH"
export CHROMEDRIVER_BINARY_PATH="$(command -v chromedriver)"

# Clear Selenium's WebDriverManager cache to prevent using downloaded Chrome
echo "🧹 Clearing Selenium WebDriverManager cache..."
rm -rf "$HOME/.cache/selenium" 2>/dev/null || true
rm -rf "$HOME/.wdm" 2>/dev/null || true

# Set Java system properties for Selenium WebDriver (these are often more reliable)
export JAVA_OPTS="-Dwebdriver.chrome.driver=$(command -v chromedriver) -Dchrome.binary=$CHROME_PATH"
export _JAVA_OPTIONS="-Dwebdriver.chrome.driver=$(command -v chromedriver) -Dchrome.binary=$CHROME_PATH"

# Create a chrome wrapper script that Maestro will find in PATH before system chrome
CHROME_WRAPPER_DIR="/tmp/chrome-wrapper-$$"
mkdir -p "$CHROME_WRAPPER_DIR"

# Create wrapper scripts that point to our Devbox Chrome
cat > "$CHROME_WRAPPER_DIR/chrome" << EOF
#!/bin/bash
exec "$CHROME_PATH" "\$@"
EOF

cat > "$CHROME_WRAPPER_DIR/chromium" << EOF
#!/bin/bash
exec "$CHROME_PATH" "\$@"
EOF

cat > "$CHROME_WRAPPER_DIR/chromium-browser" << EOF
#!/bin/bash
exec "$CHROME_PATH" "\$@"
EOF

cat > "$CHROME_WRAPPER_DIR/google-chrome" << EOF
#!/bin/bash
exec "$CHROME_PATH" "\$@"
EOF

cat > "$CHROME_WRAPPER_DIR/google-chrome-stable" << EOF
#!/bin/bash
exec "$CHROME_PATH" "\$@"
EOF

chmod +x "$CHROME_WRAPPER_DIR"/*

# Prepend wrapper directory to PATH so Maestro finds our Chrome instead of system Chrome
export PATH="$CHROME_WRAPPER_DIR:$PATH"

# AGGRESSIVE FIX: Temporarily override system Chrome binaries
# This ensures Selenium can't find any other Chrome binaries
BACKUP_DIR="/tmp/chrome-backup-$$"
mkdir -p "$BACKUP_DIR"

# Function to safely override a system binary
override_system_binary() {
    local binary_path="$1"
    local binary_name="$(basename "$binary_path")"
    
    if [ -f "$binary_path" ]; then
        echo "🔧 Backing up and overriding $binary_path"
        sudo cp "$binary_path" "$BACKUP_DIR/$binary_name.backup" 2>/dev/null || cp "$binary_path" "$BACKUP_DIR/$binary_name.backup" 2>/dev/null || true
        sudo ln -sf "$CHROME_PATH" "$binary_path" 2>/dev/null || ln -sf "$CHROME_PATH" "$binary_path" 2>/dev/null || true
    fi
}

# Override common Chrome binary locations
override_system_binary "/usr/bin/chromium-browser"
override_system_binary "/usr/bin/google-chrome"
override_system_binary "/usr/bin/google-chrome-stable"
override_system_binary "/usr/bin/chromium"
override_system_binary "/usr/bin/chrome"

echo "✅ Google Chrome configured with CI flags via environment variables"
echo "🔍 Chrome binary verification:"
echo "  CHROME_PATH: $CHROME_PATH"
echo "  which chrome: $(which chrome 2>/dev/null || echo 'not found')"
echo "  which chromium-browser: $(which chromium-browser 2>/dev/null || echo 'not found')"
echo "  which google-chrome-stable: $(which google-chrome-stable 2>/dev/null || echo 'not found')"

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
