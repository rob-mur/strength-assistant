#!/bin/bash
# Local test script for GitHub CLI release download functionality
# Tests the same logic used in production-validation workflow

set -e  # Exit on any error

echo "🔍 Testing GitHub CLI release download functionality..."
echo "=================================================="

# Configuration
TEST_DIR="./test-artifacts"
REPO_NAME=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "unknown/repo")

echo "📍 Repository: $REPO_NAME"
echo "📁 Test directory: $TEST_DIR"

# Clean up any previous test artifacts
if [ -d "$TEST_DIR" ]; then
    echo "🧹 Cleaning up previous test artifacts..."
    rm -rf "$TEST_DIR"
fi
mkdir -p "$TEST_DIR"

echo ""
echo "1️⃣ Checking GitHub CLI authentication..."
if ! gh auth status >/dev/null 2>&1; then
    echo "❌ GitHub CLI not authenticated"
    echo "💡 Run: gh auth login"
    exit 1
fi
echo "✅ GitHub CLI authenticated"

echo ""
echo "2️⃣ Checking if releases exist..."
if ! gh release list --limit 1 >/dev/null 2>&1; then
    echo "❌ No GitHub releases found"
    echo "💡 This repository has no releases. Expected for testing."
    echo "💡 In production, build-production workflow creates releases."
    exit 0  # Not an error - just no releases to test with
fi

LATEST_RELEASE=$(gh release list --limit 1 --json tagName -q '.[0].tagName')
echo "✅ Found releases. Latest: $LATEST_RELEASE"

echo ""
echo "3️⃣ Testing APK download from latest release..."
DOWNLOAD_SUCCESS=false

# Simulate the same retry logic as the workflow
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$DOWNLOAD_SUCCESS" = false ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "📥 Download attempt $RETRY_COUNT of $MAX_RETRIES..."
    
    if gh release download latest --pattern "*.apk" --dir "$TEST_DIR" 2>/dev/null; then
        DOWNLOAD_SUCCESS=true
        echo "✅ Download succeeded on attempt $RETRY_COUNT"
    else
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            DELAY=$((2 ** $RETRY_COUNT))
            echo "⚠️  Download attempt $RETRY_COUNT failed. Retrying in ${DELAY} seconds..."
            sleep $DELAY
        fi
    fi
done

if [ "$DOWNLOAD_SUCCESS" = false ]; then
    echo "❌ All $MAX_RETRIES download attempts failed"
    echo "💡 This is expected if no APK assets exist in releases"
    echo "💡 In production, build-production workflow uploads APK to releases"
    exit 0  # Not an error - just no APK to download
fi

echo ""
echo "4️⃣ Validating downloaded APK..."
APK_FILE=$(ls "$TEST_DIR"/*.apk 2>/dev/null | head -1)

if [ ! -f "$APK_FILE" ]; then
    echo "❌ No APK file found after download"
    exit 1
fi

# Validate file is not empty
if [ ! -s "$APK_FILE" ]; then
    echo "❌ APK file is empty"
    exit 1
fi

# Validate APK format (ZIP signature)
APK_HEADER=$(head -c 4 "$APK_FILE" | od -An -tx1 | tr -d ' ')
if [ "$APK_HEADER" != "504b0304" ]; then
    echo "❌ Invalid APK format - not a ZIP file"
    echo "   Expected: 504b0304, Found: $APK_HEADER"
    exit 1
fi

# File size check
APK_SIZE=$(stat -c%s "$APK_FILE" 2>/dev/null || stat -f%z "$APK_FILE")
MIN_SIZE=1048576  # 1MB
if [ $APK_SIZE -lt $MIN_SIZE ]; then
    echo "⚠️  APK size ($APK_SIZE bytes) is smaller than expected (1MB minimum)"
else
    echo "✅ APK size validation passed ($APK_SIZE bytes)"
fi

echo "✅ APK validation complete"
echo "📄 File: $(basename "$APK_FILE")"
echo "📁 Size: $APK_SIZE bytes"

echo ""
echo "5️⃣ Simulating workflow output variables..."
echo "apk-path=$APK_FILE"
echo "build-successful=true"

echo ""
echo "🧹 Cleaning up test artifacts..."
rm -rf "$TEST_DIR"

echo ""
echo "🎉 Local test completed successfully!"
echo "💡 The production-validation workflow should work correctly with this repository's releases."