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
    
    # Kill console capture server
    if [ ! -z "$CONSOLE_SERVER_PID" ]; then
        kill $CONSOLE_SERVER_PID 2>/dev/null || true
    fi
    
    # Kill Chrome processes
    pkill -f "chrome.*--headless" 2>/dev/null || true
    pkill -f "chromedriver" 2>/dev/null || true
    
    # Cleanup temp files
    rm -f "$CHROME_WRAPPER_SCRIPT" 2>/dev/null || true
    rm -f "/tmp/console-server-$$" 2>/dev/null || true
    rm -f "/tmp/console-capture-$$" 2>/dev/null || true
    rm -f "$CONSOLE_LOG_FILE" 2>/dev/null || true
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

# Create Chrome wrapper script with required flags and console logging
CHROME_WRAPPER_SCRIPT="/tmp/chrome-wrapper-$$"
CONSOLE_LOG_FILE="/tmp/chrome-console-$$.log"
cat > "$CHROME_WRAPPER_SCRIPT" << 'EOF'
#!/bin/bash
# Create a temporary script to capture console output
CONSOLE_CAPTURE_SCRIPT="/tmp/console-capture-$$"
cat > "$CONSOLE_CAPTURE_SCRIPT" << 'CONSOLE_EOF'
// Console capture script - injected into page
(function() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    
    const logToFile = (level, ...args) => {
        const timestamp = new Date().toISOString();
        const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        
        // Send to parent window for capture
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({
                type: 'console-log',
                level: level,
                timestamp: timestamp,
                message: message
            }, '*');
        }
        
        // Also log to browser DevTools as usual
        switch(level) {
            case 'error': originalError(...args); break;
            case 'warn': originalWarn(...args); break;
            case 'info': originalInfo(...args); break;
            default: originalLog(...args);
        }
    };
    
    console.log = (...args) => logToFile('log', ...args);
    console.error = (...args) => logToFile('error', ...args);
    console.warn = (...args) => logToFile('warn', ...args);
    console.info = (...args) => logToFile('info', ...args);
    
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
        logToFile('error', 'Unhandled error:', event.error?.message || event.message, event.error?.stack || '');
    });
    
    window.addEventListener('unhandledrejection', (event) => {
        logToFile('error', 'Unhandled promise rejection:', event.reason);
    });
    
    console.log('🔍 Console capture initialized for Chrome integration test');
})();
CONSOLE_EOF

if command -v chromium >/dev/null 2>&1; then
    exec chromium --no-sandbox --headless --disable-dev-shm-usage --disable-gpu --remote-debugging-port=9222 --enable-logging --log-level=0 --user-data-dir=/tmp/chrome-test-$$ "$@"
elif command -v google-chrome >/dev/null 2>&1; then
    exec google-chrome --no-sandbox --headless --disable-dev-shm-usage --disable-gpu --remote-debugging-port=9222 --enable-logging --log-level=0 --user-data-dir=/tmp/chrome-test-$$ "$@"
else
    echo "No Chrome binary found"
    exit 1
fi
EOF
chmod +x "$CHROME_WRAPPER_SCRIPT"
export MAESTRO_CHROME_PATH="$CHROME_WRAPPER_SCRIPT"

# Create console capture service
CONSOLE_CAPTURE_PORT=9223
CONSOLE_LOG_FILE="/tmp/chrome-console-capture-$$.log"

echo "🔍 Starting console capture service on port $CONSOLE_CAPTURE_PORT..."
cat > "/tmp/console-server-$$" << 'EOF'
#!/bin/bash
exec node -e "
const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/log') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const logData = JSON.parse(body);
                const timestamp = new Date().toISOString();
                const logLine = \`[\${timestamp}] [\${logData.level.toUpperCase()}] \${logData.message}\n\`;
                fs.appendFileSync(process.env.CONSOLE_LOG_FILE, logLine);
                console.log('📝', logLine.trim());
            } catch (e) {
                console.error('Failed to parse log data:', e);
            }
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('ok');
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(process.env.CONSOLE_CAPTURE_PORT, '127.0.0.1', () => {
    console.log(\`Console capture server listening on port \${process.env.CONSOLE_CAPTURE_PORT}\`);
});
" &
EOF
chmod +x "/tmp/console-server-$$"
CONSOLE_LOG_FILE="$CONSOLE_LOG_FILE" CONSOLE_CAPTURE_PORT="$CONSOLE_CAPTURE_PORT" "/tmp/console-server-$$" &
CONSOLE_SERVER_PID=$!

# Wait for console server to start
sleep 2

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
        
        # Run test
        maestro test "$test_file" --headless --debug-output maestro-debug-output
        INDIVIDUAL_EXIT_CODE=$?
        
        # Add browser console output to debug artifacts  
        if [ -f "$CONSOLE_LOG_FILE" ]; then
            echo "📋 Copying browser console output to debug artifacts..."
            cp "$CONSOLE_LOG_FILE" "maestro-debug-output/browser-console-$(basename "$test_file" .yml).log"
        fi
        
        if [ $INDIVIDUAL_EXIT_CODE -eq 0 ]; then
            echo "✅ $(basename "$test_file") passed"
            PASSED_COUNT=$((PASSED_COUNT + 1))
        else
            echo "❌ $(basename "$test_file") failed with exit code $INDIVIDUAL_EXIT_CODE"
            FIRST_FAILED_EXIT_CODE=${FIRST_FAILED_EXIT_CODE:-$INDIVIDUAL_EXIT_CODE}
            
            # Show recent console output for failed tests
            if [ -f "$CONSOLE_LOG_FILE" ]; then
                echo "📋 Recent browser console output:"
                tail -20 "$CONSOLE_LOG_FILE" 2>/dev/null || echo "No console output available"
            fi
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
