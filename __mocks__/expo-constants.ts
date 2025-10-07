export default {
  expoConfig: {
    extra: {
      eas: {
        projectId: "test-project-id",
      },
    },
  },
  manifest: {
    extra: {
      eas: {
        projectId: "test-project-id",
      },
    },
  },
  platform: {
    ios: {
      buildNumber: "1",
    },
    android: {
      versionCode: 1,
    },
  },
  nativeAppVersion: "1.0.0",
  nativeBuildVersion: "1",
  EXDevLauncher: {},
};
