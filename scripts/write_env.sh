#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "$FIREBASE_WEB_CONFIG" > "firebase.web.config.json"
echo "$GOOGLE_SERVICES" > "google-services.json"
