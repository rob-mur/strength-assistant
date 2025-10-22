/**
 * @jest-environment node
 */

import {
  getSupabaseEnvConfig,
  getSupabaseUrl,
  isSupabaseDataEnabled,
  validateSupabaseEnvironment,
} from "@/lib/config/supabase-env";

describe("supabase-env", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      EXPO_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      EXPO_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("gets supabase config", () => {
    const config = getSupabaseEnvConfig();
    expect(config).toBeDefined();
    expect(typeof config).toBe("object");
  });

  it("contains required configuration fields", () => {
    const config = getSupabaseEnvConfig();
    expect(config).toHaveProperty("url");
    expect(config).toHaveProperty("anonKey");
  });

  it("has string values for url and anonKey", () => {
    const config = getSupabaseEnvConfig();
    expect(typeof config.url).toBe("string");
    expect(typeof config.anonKey).toBe("string");
  });

  it("gets supabase URL", () => {
    const url = getSupabaseUrl();
    expect(url).toBe("https://test.supabase.co");
  });

  it("checks if supabase data is enabled", () => {
    const isEnabled = isSupabaseDataEnabled();
    expect(typeof isEnabled).toBe("boolean");
  });

  it("validates supabase environment", () => {
    expect(() => validateSupabaseEnvironment()).not.toThrow();
  });
});
