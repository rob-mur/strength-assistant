import appJson from './app.json';

export default ({ config }) => {
  const isProduction = process.env.EAS_BUILD_PROFILE === 'production';
  
  // Force set EXPO_ROUTER_APP_ROOT for all builds, especially web/test builds
  process.env.EXPO_ROUTER_APP_ROOT = process.env.EXPO_ROUTER_APP_ROOT || './app';
  
  // Also set it as a build constant for metro
  if (global) {
    global.EXPO_ROUTER_APP_ROOT = process.env.EXPO_ROUTER_APP_ROOT;
  }
  
  // Start with the base config from app.json
  const baseConfig = appJson.expo;
  
  // Filter out existing expo-build-properties plugin
  const filteredPlugins = baseConfig.plugins.filter(plugin => 
    !Array.isArray(plugin) || plugin[0] !== 'expo-build-properties'
  );
  
  return {
    ...baseConfig,
    extra: {
      ...baseConfig.extra,
      // Feature flag for data layer migration
      useSupabaseData: process.env.USE_SUPABASE_DATA === 'true'
    },
    plugins: [
      ...filteredPlugins,
      [
        "expo-build-properties",
        {
          android: {
            architectures: ["arm64-v8a"],
            // Only allow cleartext traffic in development and preview builds
            usesCleartextTraffic: !isProduction
          }
        }
      ]
    ]
  };
};