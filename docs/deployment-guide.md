# Deployment Guide

This document outlines the process for deploying the application.

## Overview

The project appears to use Expo Application Services (EAS) for building and deploying the mobile application, as suggested by the presence of `eas.json` and EAS-related scripts in `package.json`.

No `Dockerfile`, `docker-compose.yml`, or CI/CD pipeline configurations (e.g., in `.github/workflows`) were found in the repository. This suggests that web deployments or other infrastructure setups are either handled manually, by a separate process, or through a platform-as-a-service that isn't explicitly configured here.

## Expo Application Services (EAS)

Builds and deployments for iOS and Android are likely managed through the EAS CLI.

-   **Configuration**: The `eas.json` file defines build profiles.
-   **Build Script**: The `eas-build-pre-install` script in `package.json` suggests custom environment setup during the EAS build process.

A typical build command would be:

```bash
eas build --profile [profile-name]
```

Refer to the official Expo EAS documentation for more details on the build and submission process.
