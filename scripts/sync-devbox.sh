#!/usr/bin/env bash

# Sync all devbox configurations
# This script runs devbox install on all devbox configurations to ensure
# their lock files are up to date with their respective devbox.json files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🔄 Syncing all devbox configurations..."

CONFIGS=("minimal" "android-build" "android-testing" "dev")

for config in "${CONFIGS[@]}"; do
    config_dir="$PROJECT_ROOT/devbox/$config"
    
    if [ -d "$config_dir" ] && [ -f "$config_dir/devbox.json" ]; then
        echo "📦 Syncing $config..."
        
        cd "$config_dir"
        if devbox install --tidy-lockfile --quiet; then
            echo "✅ $config synced successfully"
        else
            echo "❌ Failed to sync $config"
            exit 1
        fi
        
        cd "$PROJECT_ROOT"
    else
        echo "⚠️  Skipping $config (not found or missing devbox.json)"
    fi
done

echo "🎉 All devbox configurations synced successfully!"