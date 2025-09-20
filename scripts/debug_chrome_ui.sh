#!/usr/bin/env bash

set -e

echo "🔍 Debug Chrome UI - Understanding what's displayed in CI"

# Change to project root directory (relative to scripts folder)
cd "$(dirname "$0")/.."

# Cleanup function
cleanup() {
    echo "🧹 Cleaning up processes..."
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

# Start Supabase (simplified for debug)
echo "🔥 Starting Supabase emulators..."
supabase start
supabase db reset --local
echo "✅ Supabase ready"

# Debug: Log environment variables
echo "🔍 Environment Variables:"
echo "EXPO_PUBLIC_SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL:-[NOT SET]}"
echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=${EXPO_PUBLIC_SUPABASE_ANON_KEY:-[NOT SET]}"
echo "EXPO_PUBLIC_USE_SUPABASE=${EXPO_PUBLIC_USE_SUPABASE:-[NOT SET]}"
echo "USE_SUPABASE_DATA=${USE_SUPABASE_DATA:-[NOT SET]}"

# Set critical environment variables
export CHROME_TEST=true
export EXPO_PUBLIC_CHROME_TEST=true

# Fallback for Supabase variables if not set by devbox
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
    export EXPO_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
fi

if [ -z "$EXPO_PUBLIC_SUPABASE_ANON_KEY" ]; then
    export EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
fi

if [ -z "$EXPO_PUBLIC_USE_SUPABASE" ]; then
    export EXPO_PUBLIC_USE_SUPABASE="true"
fi

if [ -z "$USE_SUPABASE_DATA" ]; then
    export USE_SUPABASE_DATA="true"
fi

echo "✅ Environment variables configured"

# Start Expo web server with enhanced logging
echo "🚀 Starting Expo web server..."
npx expo start --web --port 8081 > expo-server.log 2>&1 &
EXPO_PID=$!

# Wait for Expo web server
echo "⏳ Waiting for Expo web server..."
timeout=60
counter=0
while ! curl -s http://localhost:8081 > /dev/null; do
    sleep 1
    counter=$((counter + 1))
    if [ $counter -ge $timeout ]; then
        echo "❌ Expo web server failed to start"
        echo "📋 Expo server logs:"
        cat expo-server.log
        exit 1
    fi
done
echo "✅ Expo web server ready"

# Show any startup errors from Expo
echo "📋 Checking for Expo startup errors:"
if grep -q "ERROR\|Error\|CRITICAL\|🚨" expo-server.log 2>/dev/null; then
    echo "⚠️ Found potential errors in Expo logs:"
    grep -E "ERROR|Error|CRITICAL|🚨" expo-server.log | head -5
else
    echo "✅ No obvious errors in Expo startup logs"
fi

# Create Chrome wrapper script
CHROME_WRAPPER_SCRIPT="/tmp/chrome-wrapper-$$"
cat > "$CHROME_WRAPPER_SCRIPT" << 'EOF'
#!/bin/bash
if command -v chromium >/dev/null 2>&1; then
    exec chromium \
        --no-sandbox \
        --headless \
        --disable-dev-shm-usage \
        --disable-gpu \
        --disable-background-timer-throttling \
        --disable-backgrounding-occluded-windows \
        --disable-renderer-backgrounding \
        --no-first-run \
        --no-default-browser-check \
        --user-data-dir=/tmp/chrome-test-$$ \
        "$@"
else
    echo "❌ Chromium not found"
    exit 1
fi
EOF
chmod +x "$CHROME_WRAPPER_SCRIPT"
export MAESTRO_CHROME_PATH="$CHROME_WRAPPER_SCRIPT"

# Set ChromeDriver path
if command -v chromedriver >/dev/null 2>&1; then
    export MAESTRO_CHROMEDRIVER_PATH="$(command -v chromedriver)"
    echo "🔧 Using ChromeDriver: $(chromedriver --version 2>/dev/null || echo 'version unknown')"
fi

# Create debug output directory
mkdir -p maestro-debug-output

# Run ONLY the debug test to understand UI state
echo "🧪 Running UI Debug Test..."
export MAESTRO_CLI_LOG_LEVEL=DEBUG

echo "🔍 Running debug test to understand current UI state..."
set +e  # Don't exit on command failure

# Run the debug test with maximum verbosity
maestro test .maestro/web/debug-ui-state.yml \
  --headless \
  --debug-output maestro-debug-output \
  --format junit \
  --env MAESTRO_CLI_LOG_LEVEL=DEBUG \
  2>&1 | tee maestro-debug-output/debug-console.log

DEBUG_EXIT_CODE=${PIPESTATUS[0]}
set -e

echo ""
echo "🏁 Debug Test Results:"
echo "Exit Code: $DEBUG_EXIT_CODE"

# Show comprehensive results
echo ""
echo "📋 Debug Console Output (last 50 lines):"
if [ -f "maestro-debug-output/debug-console.log" ]; then
    tail -50 maestro-debug-output/debug-console.log
else
    echo "⚠️ No debug console log found"
fi

echo ""
echo "📋 Expo Server Logs (recent errors/warnings):"
if [ -f "expo-server.log" ]; then
    echo "Recent Expo logs (last 20 lines):"
    tail -20 expo-server.log
    echo ""
    echo "All errors in Expo logs:"
    grep -i "error\|critical\|failed\|exception" expo-server.log || echo "No errors found in Expo logs"
else
    echo "⚠️ No Expo server log found"
fi

echo ""
echo "📸 Screenshots captured:"
if [ -d "maestro-debug-output" ]; then
    find maestro-debug-output -name "*.png" | while read screenshot; do
        if [ -f "$screenshot" ]; then
            SIZE=$(stat -c%s "$screenshot" 2>/dev/null || echo "unknown")
            echo "  📷 $(basename "$screenshot") ($SIZE bytes)"
        fi
    done
else
    echo "⚠️ No debug output directory found"
fi

echo ""
echo "📊 All Debug Files:"
if [ -d "maestro-debug-output" ]; then
    ls -la maestro-debug-output/
else
    echo "⚠️ No debug artifacts found"
fi

echo ""
echo "✅ Debug script completed with exit code: $DEBUG_EXIT_CODE"

# Exit with the same code as the debug test
exit $DEBUG_EXIT_CODE