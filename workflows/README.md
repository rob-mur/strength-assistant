# GitHub Workflows for PR Previews

This directory contains the workflow files needed to deploy ephemeral web previews for pull requests using Firebase Hosting.

## Setup Instructions

### 1. Copy Workflow Files

Copy these workflow files to your `.github/workflows/` directory:

```bash
mkdir -p .github/workflows
cp workflows/deploy-pr-preview.yml .github/workflows/
cp workflows/cleanup-pr-preview.yml .github/workflows/
```

### 2. Required GitHub Secrets

Add this secret to your GitHub repository settings:

- **`FIREBASE_SERVICE_ACCOUNT_STRENGTH_ASSISTANT_DEV`** - Firebase service account JSON for the `strength-assistant-dev` project

To create the service account:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your `strength-assistant-dev` project
3. Go to Project Settings → Service Accounts
4. Click "Generate new private key"
5. Copy the entire JSON content and add it as a GitHub secret

### 3. Firebase Project Configuration

The workflows are configured for:
- **Project ID**: `strength-assistant-dev`
- **Build output**: `dist/` directory (Expo web builds)
- **Channel naming**: `pr-{number}` (e.g., `pr-42`)
- **Auto-cleanup**: 30 days or when PR closes

### 4. How It Works

#### Deploy Preview (`deploy-pr-preview.yml`)
- **Triggers**: When PRs are opened, updated, or reopened
- **Process**: 
  1. Builds the web app using `npm run build`
  2. Deploys to Firebase Hosting channel `pr-{number}`
  3. Comments on PR with preview URL
- **Preview URL**: `https://pr-{number}--strength-assistant-dev.web.app`

#### Cleanup Preview (`cleanup-pr-preview.yml`)
- **Triggers**: When PRs are closed
- **Process**: 
  1. Deletes the Firebase Hosting channel
  2. Updates PR comment to show cleanup status

### 5. Firebase Configuration

The `firebase.json` has been updated to include hosting configuration:
- **Public directory**: `dist` (Expo web output)
- **SPA routing**: Rewrites all routes to `/index.html`
- **Local hosting emulator**: Port 5000

### 6. Build Requirements

The workflows expect:
- `npm run build` command to generate web build in `dist/` directory
- Node.js 18.x
- Existing Firebase configuration pointing to dev database

### 7. Security Notes

- Only PRs from the same repository can deploy previews
- Channels auto-expire after 30 days as a safety measure
- Service account has minimal required permissions for Firebase Hosting

### 8. Testing the Setup

1. Copy the workflow files to `.github/workflows/`
2. Add the required GitHub secret
3. Create a test PR with some changes
4. Check the Actions tab for deployment progress
5. Look for the preview URL comment on the PR