import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../models/supabase";
import { SupabaseService } from "./supabase-core";

class SupabaseNativeService extends SupabaseService {
  constructor() {
    super("Supabase");
  }

  protected getInitMessage(): string {
    return "Initializing Supabase client for React Native...";
  }

  protected getEmulatorHost(): string {
    // Android emulator needs 10.0.2.2 to access host machine
    // iOS simulator can use localhost/127.0.0.1
    return process.env.EXPO_PUBLIC_SUPABASE_EMULATOR_HOST || "10.0.2.2";
  }

  protected getClientConfig(): { detectSessionInUrl: boolean } {
    return { detectSessionInUrl: false };
  }
}

const supabaseService = new SupabaseNativeService();

export function initSupabase(): void {
  supabaseService.init();
}

export function getSupabaseClient(): SupabaseClient<Database> {
  return supabaseService.getSupabaseClient();
}

// Test utility to reset service state
export function resetSupabaseService(): void {
  (
    supabaseService as unknown as { initialized: boolean; client: unknown }
  ).initialized = false;
  (
    supabaseService as unknown as { initialized: boolean; client: unknown }
  ).client = undefined;
}

export { SupabaseClient } from "@supabase/supabase-js";
