/**
 * Supabase Environment Configuration Validation
 * Validates and provides typed access to Supabase environment variables
 */

export interface SupabaseEnvConfig {
  url: string;
  anonKey: string;
  useEmulator: boolean;
  emulatorHost: string;
  emulatorPort: string;
}

/**
 * Validates and returns Supabase environment configuration
 * @throws Error if required environment variables are missing
 */
export function getSupabaseEnvConfig(): SupabaseEnvConfig {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL environment variable is required');
  }

  if (!anonKey) {
    throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable is required');
  }

  const useEmulator = process.env.EXPO_PUBLIC_USE_SUPABASE_EMULATOR === 'true';
  const emulatorHost = process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_HOST || '127.0.0.1';
  const emulatorPort = process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_PORT || '54321';

  return {
    url,
    anonKey,
    useEmulator,
    emulatorHost,
    emulatorPort
  };
}

/**
 * Returns the effective Supabase URL (emulator or production)
 */
export function getSupabaseUrl(): string {
  const config = getSupabaseEnvConfig();
  
  if (config.useEmulator) {
    return `http://${config.emulatorHost}:${config.emulatorPort}`;
  }
  
  return config.url;
}

/**
 * Checks if Supabase data layer is enabled via feature flag
 */
export function isSupabaseDataEnabled(): boolean {
  return process.env.USE_SUPABASE_DATA === 'true';
}

/**
 * Validates all required environment variables for Supabase integration
 * Should be called during app initialization
 */
export function validateSupabaseEnvironment(): void {
  try {
    getSupabaseEnvConfig();
    
    // Additional validation for development environment
    if (__DEV__) {
      const useEmulator = process.env.EXPO_PUBLIC_USE_EMULATOR === 'true';
      const useSupabaseEmulator = process.env.EXPO_PUBLIC_USE_SUPABASE_EMULATOR === 'true';
      
      if (useEmulator && !useSupabaseEmulator) {
        console.warn('⚠️  EXPO_PUBLIC_USE_EMULATOR is true but EXPO_PUBLIC_USE_SUPABASE_EMULATOR is false. Consider enabling Supabase emulator for development.');
      }
      
      if (isSupabaseDataEnabled()) {
        console.info('✅ Supabase data layer is enabled (USE_SUPABASE_DATA=true)');
      } else {
        console.info('ℹ️  Firebase data layer is active (USE_SUPABASE_DATA=false)');
      }
    }
  } catch (error) {
    console.error('❌ Supabase environment validation failed:', error);
    throw error;
  }
}