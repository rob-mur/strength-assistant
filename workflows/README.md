# Refactored GitHub Actions Workflows

This directory contains refactored workflows that use a centralized composite action for setting up the development environment.

## Changes Made

### Composite Action: `.github/actions/setup-dev-env`
- Centralizes common setup steps across all workflows
- Handles repository checkout, config population, devbox installation, npm caching, and dependency installation
- Uses consistent cache key pattern: `v1-${{ runner.os }}-npm-${{ hashFiles('**/package.json') }}`
- Supports optional inputs for Firebase and Google service configurations

### Benefits
- **Reduced Duplication**: Common setup steps are now in one place
- **Consistent Cache Keys**: No risk of typos in cache key patterns
- **Easier Maintenance**: Changes to setup logic only need to be made in one file
- **Better Reusability**: Other workflows can easily use the same setup

### Workflow Simplifications
Each workflow now uses the composite action instead of repeating setup steps:
- Unit Tests: Reduced from 44 lines to 18 lines
- Integration Tests Chrome: Reduced from 60 lines to 29 lines  
- Build Production: Reduced from 66 lines to 35 lines
- SonarQube: Reduced from 53 lines to 29 lines

### Usage
To use these refactored workflows, simply replace the contents of the corresponding files in `.github/workflows/` with the versions in this directory.

The composite action supports the following inputs:
- `firebase-config`: Firebase web configuration JSON (optional)
- `google-config`: Google services configuration JSON (optional)  
- `devbox-version`: Version of devbox to install (default: 0.14.2)
- `cache-version`: Cache version for cache busting (default: v1)