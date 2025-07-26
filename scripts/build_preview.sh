#!/usr/bin/env bash


# Github actions has a conflicting environment variable
unset ANDROID_SDK_ROOT

npx eas-cli build --platform android --profile preview --local --output build_preview.apk
