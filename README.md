# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Production Validation

This project includes parameterized GitHub Actions for production validation:

### Parameterized Actions

- **Android Build Action** (`.github/actions/android-build/`): Builds APKs for both preview and production environments using devbox configurations
  - Supports `build-type: preview` for integration testing
  - Supports `build-type: production` for production validation
  - Uses devbox for reproducible builds across local and CI environments

- **Maestro Test Action** (`.github/actions/maestro-test/`): Runs Maestro integration tests against built APKs
  - Supports `test-environment: integration` for PR validation
  - Supports `test-environment: production` for production validation
  - Handles `skip-data-cleanup` flag for production testing

### Production Deployment Workflow

The unified production deployment workflow (`.github/workflows/production-deployment.yml`) consolidates APK building, infrastructure deployment, and validation into a single automated pipeline:

**Jobs:**

1. **Build Production APK**: Creates `build_production.apk` and uploads to GitHub releases
2. **Terraform Deploy**: Deploys infrastructure changes with proper dependency on APK build
3. **Production Validation**: Downloads APK and validates against deployed infrastructure using anonymous users

**Key Features:**

- **Concurrency Control**: Cancels running deployments on new pushes to main
- **Job Dependencies**: Ensures proper sequencing (build → deploy → validate)
- **APK Consistency**: Uses the same production APK for validation that was built
- **No Timeouts**: Allows operations to run until completion
- **Anonymous Testing**: Clean test isolation without persistent test data

**Monitoring**: Use `scripts/monitor-deployment.sh` to track deployment status

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
