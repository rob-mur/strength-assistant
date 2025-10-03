#!/bin/bash
set -e

# Production Test Setup Script
# Handles environment configuration for production validation testing
# Sets SKIP_DATA_CLEANUP=true to modify cleanup behavior for production tests

echo "🔧 Setting up production test environment..."

# Export environment variables for production testing
export SKIP_DATA_CLEANUP=true
export NODE_ENV=production
export EXPO_PUBLIC_USE_SUPABASE=true
export EXPO_PUBLIC_CHROME_TEST=false  # Disable Chrome test mode for production

# Validate required environment variables
if [ -z "$NODE_ENV" ]; then
  echo "❌ NODE_ENV not set"
  exit 1
fi

if [ -z "$EXPO_PUBLIC_USE_SUPABASE" ]; then
  echo "❌ EXPO_PUBLIC_USE_SUPABASE not set"
  exit 1
fi

echo "✅ Environment variables configured:"
echo "   SKIP_DATA_CLEANUP=$SKIP_DATA_CLEANUP"
echo "   NODE_ENV=$NODE_ENV"
echo "   EXPO_PUBLIC_USE_SUPABASE=$EXPO_PUBLIC_USE_SUPABASE"

# Create production test directories
mkdir -p maestro-results
mkdir -p production-artifacts

# Set permissions for test execution
chmod +x scripts/*.sh 2>/dev/null || true

# Validate Maestro test files exist
MAESTRO_DIR=".maestro"
if [ ! -d "$MAESTRO_DIR" ]; then
  echo "❌ Maestro test directory not found: $MAESTRO_DIR"
  exit 1
fi

# Check for required Maestro flows
REQUIRED_FLOWS=(
  ".maestro/web/add-exercise-and-see-it-in-list.yml"
  ".maestro/web/add-and-record-workout.yml"
)

for flow in "${REQUIRED_FLOWS[@]}"; do
  if [ ! -f "$flow" ]; then
    echo "❌ Required Maestro flow not found: $flow"
    exit 1
  fi
done

echo "✅ Maestro flows validated"

# Configure Android environment if available
if command -v adb &> /dev/null; then
  echo "📱 Configuring Android environment..."
  
  # Wait for emulator to be ready
  adb wait-for-device
  
  # Clear any existing app data if emulator is running
  # But respect SKIP_DATA_CLEANUP for anonymous user handling
  if [ "$SKIP_DATA_CLEANUP" != "true" ]; then
    adb shell pm clear com.jimmysolutions.strengthassistant.test 2>/dev/null || true
  fi
  
  echo "✅ Android environment ready"
else
  echo "ℹ️  Android tools not available - skipping emulator setup"
fi

# Log production test configuration
echo "🚀 Production test setup complete"
echo "   Test mode: Production validation against live infrastructure"
echo "   Anonymous users: Will be created fresh (no cleanup needed)"
echo "   Data cleanup: Skipped (SKIP_DATA_CLEANUP=true)"
echo "   Ready for Maestro execution"