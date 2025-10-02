/**
 * Supabase Environment Configuration Validation
 * Validates and provides typed access to Supabase environment variables
 */

export interface SupabaseEnvConfig {
  url: string;
  anonKey: string;
}

/**
 * Validates and returns Supabase environment configuration
 * @throws Error if required environment variables are missing
 */
export function getSupabaseEnvConfig(): SupabaseEnvConfig {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      "EXPO_PUBLIC_SUPABASE_URL environment variable is required",
    );
  }

  if (!anonKey) {
    throw new Error(
      "EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable is required",
    );
  }

  return {
    url,
    anonKey,
  };
}

/**
 * Returns the Supabase URL from environment configuration
 */
export function getSupabaseUrl(): string {
  const config = getSupabaseEnvConfig();
  return config.url;
}

/**
 * Checks if Supabase data layer is enabled via feature flag
 */
export function isSupabaseDataEnabled(): boolean {
  return process.env.USE_SUPABASE_DATA === "true";
}

/**
 * Validates all required environment variables for Supabase integration
 * Should be called during app initialization
 */
export function validateSupabaseEnvironment(): void {
  getSupabaseEnvConfig();

  // Additional validation for development environment
  if (__DEV__) {
    // Environment variable validation (no-op for now)
  }
}
