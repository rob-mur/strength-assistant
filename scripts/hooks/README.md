# Git Hooks System

This directory contains an extensible git hooks system for the project.

## Setup

Run the setup script to install the hooks:

```bash
./scripts/setup-hooks.sh
```

## Current Hooks

### pre-commit

The pre-commit hook runs before each commit and includes:

1. **Package Lock Validation**: Ensures `package-lock.json` is in sync with `package.json`
2. **Extensible Hook System**: Runs any executable `.sh` files in `pre-commit.d/`

## Adding Custom Hooks

To add additional pre-commit checks:

1. Create an executable shell script in `scripts/hooks/pre-commit.d/`
2. Name it with a descriptive name ending in `.sh`
3. Make sure it exits with code 0 on success, non-zero on failure

Example:

```bash
# Create a new hook
echo '#!/bin/bash
echo "Running my custom check..."
# Your validation logic here
exit 0' > scripts/hooks/pre-commit.d/my-check.sh

chmod +x scripts/hooks/pre-commit.d/my-check.sh
```

## Bypassing Hooks

To bypass hooks for a single commit (use sparingly):

```bash
git commit --no-verify
```

## Troubleshooting

If hooks aren't running:

1. Ensure they're executable: `chmod +x scripts/hooks/pre-commit`
2. Re-run setup: `./scripts/setup-hooks.sh`
3. Check git hooks are installed: `ls -la .git/hooks/pre-commit`
