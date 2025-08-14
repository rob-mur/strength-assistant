#!/usr/bin/env bash

echo "no" | avdmanager create avd --force -n test -k "system-images;android-35;google_apis_playstore;x86_64" --device "pixel_xl"

adb start-server

emulator -avd test -no-snapshot-load -accel on 

