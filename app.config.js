import appJson from "./app.json";

export default (_) => {
  const isProduction = process.env.EAS_BUILD_PROFILE === "production";

  // Start with the base config from app.json
  const baseConfig = appJson.expo;

  // Filter out existing expo-build-properties plugin
  const filteredPlugins = baseConfig.plugins.filter(
    (plugin) => !Array.isArray(plugin) || plugin[0] !== "expo-build-properties",
  );

  return {
    ...baseConfig,
    extra: {
      ...baseConfig.extra,
      // Feature flag for data layer migration
      useSupabaseData: process.env.USE_SUPABASE_DATA === "true",
    },
    plugins: [
      ...filteredPlugins,
      [
        "expo-build-properties",
        {
          android: {
            architectures: ["arm64-v8a"],
            // Only allow cleartext traffic in development and preview builds
            usesCleartextTraffic: !isProduction,
          },
        },
      ],
    ],
  };
};
