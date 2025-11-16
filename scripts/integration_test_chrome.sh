#!/usr/bin/env bash

set -e

echo "🌐 Starting Chrome Integration Tests"

# Initial cleanup to ensure no leftover Chromium processes  
echo "🧹 Initial cleanup of any existing Chromium processes..."
# Only kill Chromium browsers, not chromium-related processes like chromedriver
pgrep -f "chromium" | xargs kill 2>/dev/null || true
rm -rf /tmp/chrome-* /tmp/chromium-* 2>/dev/null || true
sleep 1

# Change to project root directory (relative to scripts folder)
cd "$(dirname "$0")/.."

# Cleanup function - runs at script exit
cleanup() {
    echo "🧹 Cleaning up processes..."
    
    # Force kill any Chromium browser processes that might be lingering
    pgrep -f "chromium" | xargs kill 2>/dev/null || true
    sleep 1
    
    supabase stop 2>/dev/null || true

    if [ ! -z "$EXPO_PID" ]; then
        kill $EXPO_PID 2>/dev/null || true
    fi

    # Clean up Chromium temp directories and wrapper scripts
    echo "🧹 Cleaning up Chromium temp directories..."
    rm -rf /tmp/chrome-* /tmp/chromium-* 2>/dev/null || true
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

# NEW APPROACH: Replace Maestro's downloaded Chromium with our Devbox version
echo "🔧 Setting up Chromium replacement for Maestro..."

# Find our Devbox Chromium binary
if [ -d ".devbox/nix/profile/default/bin" ]; then
    DEVBOX_CHROMIUM=".devbox/nix/profile/default/bin/chromium"
    if [ ! -f "$DEVBOX_CHROMIUM" ]; then
        DEVBOX_CHROMIUM=$(command -v chromium)
    fi
else
    DEVBOX_CHROMIUM=$(command -v chromium)
fi

if [ -z "$DEVBOX_CHROMIUM" ] || [ ! -f "$DEVBOX_CHROMIUM" ]; then
    echo "❌ Devbox Chromium binary not found"
    exit 1
fi

echo "📍 Found Devbox Chromium at: $DEVBOX_CHROMIUM"

# Trigger Maestro to download its Chromium binary
echo "🔽 Triggering Maestro to download its Chromium..."
maestro --version > /dev/null 2>&1 || true

# Find Maestro's Chromium cache directory
# Maestro typically downloads to ~/.maestro/chromium or similar
MAESTRO_CHROMIUM_PATHS=(
    "$HOME/.maestro/chromium"
    "$HOME/.cache/maestro/chromium" 
    "$HOME/.local/share/maestro/chromium"
    "/tmp/maestro/chromium"
)

MAESTRO_CHROMIUM_DIR=""
for path in "${MAESTRO_CHROMIUM_PATHS[@]}"; do
    if [ -d "$path" ]; then
        MAESTRO_CHROMIUM_DIR="$path"
        echo "📂 Found Maestro Chromium cache at: $MAESTRO_CHROMIUM_DIR"
        break
    fi
done

# If we found Maestro's Chromium cache, replace the binary
if [ -n "$MAESTRO_CHROMIUM_DIR" ]; then
    # Find the actual Chromium executable in Maestro's cache
    MAESTRO_CHROMIUM_BIN=$(find "$MAESTRO_CHROMIUM_DIR" -name "chrome" -o -name "chromium" -o -name "chromium-browser" 2>/dev/null | head -1)
    
    if [ -n "$MAESTRO_CHROMIUM_BIN" ] && [ -f "$MAESTRO_CHROMIUM_BIN" ]; then
        echo "🔄 Replacing Maestro's Chromium ($MAESTRO_CHROMIUM_BIN) with Devbox version"
        # Backup original and replace with our Devbox Chromium
        cp "$MAESTRO_CHROMIUM_BIN" "$MAESTRO_CHROMIUM_BIN.backup"
        cp "$DEVBOX_CHROMIUM" "$MAESTRO_CHROMIUM_BIN"
        chmod +x "$MAESTRO_CHROMIUM_BIN"
        echo "✅ Maestro Chromium binary replaced with Devbox version"
    else
        echo "⚠️ Could not find Chromium binary in Maestro cache - will rely on PATH"
    fi
else
    echo "⚠️ Could not find Maestro Chromium cache - will rely on PATH"
fi

# Also create wrapper in PATH as fallback
CHROMIUM_WRAPPER_DIR="/tmp/chromium-wrapper-$$"
mkdir -p "$CHROMIUM_WRAPPER_DIR"

cat > "$CHROMIUM_WRAPPER_DIR/chromium" << EOF
#!/bin/bash
exec "$DEVBOX_CHROMIUM" --no-sandbox "\$@"
EOF

cat > "$CHROMIUM_WRAPPER_DIR/chrome" << EOF
#!/bin/bash  
exec "$DEVBOX_CHROMIUM" --no-sandbox "\$@"
EOF

chmod +x "$CHROMIUM_WRAPPER_DIR"/*
export PATH="$CHROMIUM_WRAPPER_DIR:$PATH"

echo "✅ Chromium replacement setup completed"
echo "  Devbox Chromium: $DEVBOX_CHROMIUM"
echo "  which chromium: $(which chromium 2>/dev/null || echo 'not found')"

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

# First, list all tests that will be run
echo "📋 Found web test files:"
for test_file in .maestro/web/*.yml; do
    if [ -f "$test_file" ]; then
        echo "  - $(basename "$test_file")"
    fi
done

# Run each test individually
test_count=0
for test_file in .maestro/web/*.yml; do
    if [ -f "$test_file" ]; then
        test_count=$((test_count + 1))
        echo "🧪 Running test $test_count: $(basename "$test_file")..."

        # Maestro handles Chrome lifecycle, no manual cleanup needed

        maestro test "$test_file" \
          --headless \
          --debug-output maestro-debug-output \
          --format junit || exit 1
          
        echo "✅ Test $test_count completed: $(basename "$test_file")"
    fi
done

echo "🎯 Total tests run: $test_count"

echo "✅ All tests completed"
