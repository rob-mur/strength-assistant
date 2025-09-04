#!/usr/bin/env bash

# Change to project root directory (relative to scripts folder)
cd "$(dirname "$0")/.."

# Build script that accepts a profile argument
# Usage: ./scripts/build.sh <profile> [output_name]
# Example: ./scripts/build.sh preview build_preview.apk
# Example: ./scripts/build.sh production build_production.apk

PROFILE=$1
OUTPUT=${2:-build_${PROFILE}.apk}

# Github actions has a conflicting environment variable
unset ANDROID_SDK_ROOT
unset ANDROID_NDK_HOME

npx eas-cli build --platform android --profile ${PROFILE} --local --output ${OUTPUT}
