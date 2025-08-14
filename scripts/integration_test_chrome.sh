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

# Run Maestro web tests
echo "Running Maestro web tests..."
maestro test .maestro/web

echo "Chrome integration tests completed successfully!"