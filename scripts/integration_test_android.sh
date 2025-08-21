#!/usr/bin/env bash

# Github actions has a conflicting environment variable
unset ANDROID_SDK_ROOT
unset ANDROID_NDK_HOME
unset ANDROID_AVD_HOME
unset XDG_CONFIG_HOME

echo "no" | avdmanager create avd --force -n test -k "system-images;android-35;google_apis_playstore;x86_64" --device "pixel_xl"

adb start-server

firebase emulators:start &
emulator -avd test -no-snapshot-load -no-window -accel on -gpu off &

echo "launched emulator in background"

EMULATOR_PID=$!

errorhandler () {
    kill $EMULATOR_PID
    npx kill-port 8080
}
trap errorhandler ERR EXIT

echo "Waiting for device to boot"
adb wait-for-device

BOOT_COMPLETED=""
while [ "$BOOT_COMPLETED" != "1" ]; do
    sleep 5 
    BOOT_COMPLETED=$(adb shell getprop sys.boot_completed | tr -d '\r')
    echo "Boot status: $BOOT_COMPLETED (1 means ready)"
done

echo "Emulator is ready!"

adb install build_preview.apk

# Create debug output directory
mkdir -p maestro-debug-output

echo "Starting Maestro tests with enhanced debugging..."
echo "Debug output will be saved to maestro-debug-output/"

# Run Maestro with debug output and capture console output
maestro test .maestro/android --debug-output maestro-debug-output 2>&1 | tee maestro-debug-output/maestro-console.log

# Capture final status (using PIPESTATUS to get maestro's exit code, not tee's)
MAESTRO_EXIT_CODE=${PIPESTATUS[0]}

echo "Maestro tests completed with exit code: $MAESTRO_EXIT_CODE"
echo "Debug artifacts saved in maestro-debug-output/"

# List any screenshots or debug files created
if [ -d "maestro-debug-output" ]; then
    echo "Debug artifacts created:"
    ls -la maestro-debug-output/
fi

if [ -f "*.png" ]; then
    echo "Screenshots created:"
    ls -la *.png
fi

# Explicitly fail if any tests failed
if [ $MAESTRO_EXIT_CODE -ne 0 ]; then
    echo "❌ Tests failed with exit code $MAESTRO_EXIT_CODE"
    exit $MAESTRO_EXIT_CODE
else
    echo "✅ All tests passed"
    exit 0
fi
