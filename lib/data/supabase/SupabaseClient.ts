import { SupabaseClient as BaseSupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../models/supabase";
import { getSupabaseClient } from "./supabase";

/**
 * Typed Supabase client utility
 * Provides a strongly typed interface to the Supabase database
 */
export class SupabaseClient {
  private client: BaseSupabaseClient<Database>;

  constructor() {
    this.client = getSupabaseClient() as BaseSupabaseClient<Database>;
  }

  /**
   * Get the underlying Supabase client with full type safety
   */
  getClient(): BaseSupabaseClient<Database> {
    return this.client;
  }

  /**
   * Get a reference to the exercises table with type safety
   */
  get exercises() {
    return this.client.from('exercises');
  }

  /**
   * Get the current authenticated user
   */
  async getCurrentUser() {
    const { data: { user }, error } = await this.client.auth.getUser();
    if (error) {
      throw error;
    }
    return user;
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.client.auth.onAuthStateChange(callback);
  }
}

// Export a singleton instance
export const supabaseClient = new SupabaseClient();