#!/usr/bin/env bash

# Script to install Claude Code locally (not in CI)
# This script installs Claude Code using the official installer if not already present

set -e

# Skip in CI environments
if [[ -n "$CI" || -n "$GITHUB_ACTIONS" || -n "$JENKINS_URL" || -n "$TRAVIS" ]]; then
    echo "ℹ️  Skipping Claude Code installation in CI environment"
    exit 0
fi

# Check if claude is already available and up to date
if command -v claude &> /dev/null; then
    echo "✅ Claude Code is already installed"
    claude --version 2>/dev/null || echo "ℹ️  Claude Code found but version check failed"
    exit 0
fi

echo "🔧 Installing Claude Code locally..."

# Create a local bin directory if it doesn't exist
LOCAL_BIN="$HOME/.local/bin"
mkdir -p "$LOCAL_BIN"

# Add to PATH if not already there
if [[ ":$PATH:" != *":$LOCAL_BIN:"* ]]; then
    export PATH="$LOCAL_BIN:$PATH"
    echo "ℹ️  Added $LOCAL_BIN to PATH for this session"
    echo "📝 Consider adding 'export PATH=\"$LOCAL_BIN:\$PATH\"' to your shell profile"
fi

# Download and install Claude Code
INSTALL_SCRIPT_URL="https://claude.ai/download/install.sh"
TEMP_INSTALL_SCRIPT=$(mktemp)

echo "📥 Downloading Claude Code installer..."
if command -v curl &> /dev/null; then
    curl -fsSL "$INSTALL_SCRIPT_URL" > "$TEMP_INSTALL_SCRIPT"
elif command -v wget &> /dev/null; then
    wget -qO "$TEMP_INSTALL_SCRIPT" "$INSTALL_SCRIPT_URL"
else
    echo "❌ Neither curl nor wget is available. Cannot download Claude Code installer."
    exit 1
fi

# Run the installer with the local bin directory
echo "🚀 Running Claude Code installer..."
chmod +x "$TEMP_INSTALL_SCRIPT"
CLAUDE_INSTALL_DIR="$LOCAL_BIN" "$TEMP_INSTALL_SCRIPT"

# Clean up
rm -f "$TEMP_INSTALL_SCRIPT"

# Verify installation
if command -v claude &> /dev/null; then
    echo "✅ Claude Code installed successfully!"
    claude --version 2>/dev/null || echo "ℹ️  Claude Code installed but version check failed"
else
    echo "⚠️  Claude Code installation completed but 'claude' command not found in PATH"
    echo "    You may need to restart your shell or add $LOCAL_BIN to your PATH"
fi