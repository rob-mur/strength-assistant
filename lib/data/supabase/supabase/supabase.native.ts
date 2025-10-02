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
