#!/usr/bin/env bash

echo "no" | avdmanager create avd --force -n test -k "system-images;android-35;google_apis_playstore;x86_64" --device "pixel_xl"

emulator -avd test -no-snapshot-load -no-window &

EMULATOR_PID=$!

errorhandler () {
    kill $EMULATOR_PID
}
trap errorhandler ERR EXIT

adb wait-for-device

BOOT_COMPLETED=""
while [ "$BOOT_COMPLETED" != "1" ]; do
    sleep 5 
    BOOT_COMPLETED=$(adb shell getprop sys.boot_completed | tr -d '\r')
    echo "Boot status: $BOOT_COMPLETED (1 means ready)"
done

echo "Emulator is ready!"

adb install build_preview.apk

maestro test .maestro/android
