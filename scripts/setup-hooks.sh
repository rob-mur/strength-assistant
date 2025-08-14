#!/usr/bin/env bash

# Script to install git hooks

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOOKS_DIR="$SCRIPT_DIR/hooks"
GIT_HOOKS_DIR=".git/hooks"

echo "Setting up git hooks..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Install pre-commit hook
if [ -f "$HOOKS_DIR/pre-commit" ]; then
    cp "$HOOKS_DIR/pre-commit" "$GIT_HOOKS_DIR/pre-commit"
    chmod +x "$GIT_HOOKS_DIR/pre-commit"
    echo "✅ Installed pre-commit hook"
else
    echo "❌ Pre-commit hook not found at $HOOKS_DIR/pre-commit"
    exit 1
fi

echo "✅ Git hooks setup complete!"
echo ""
echo "The pre-commit hook will now:"
echo "  - Validate package-lock.json sync"
echo "  - Run any additional hooks in scripts/hooks/pre-commit.d/"
echo ""
echo "To disable temporarily: git commit --no-verify"