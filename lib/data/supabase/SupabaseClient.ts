import { SupabaseClient as BaseSupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../models/supabase";
import { getSupabaseClient } from "./supabase";

/**
 * Typed Supabase client utility
 * Provides a strongly typed interface to the Supabase database
 */
export class SupabaseClient {
  private client: BaseSupabaseClient<Database> | null = null;

  private getClient(): BaseSupabaseClient<Database> {
    if (!this.client) {
      const client = getSupabaseClient();
      if (!client || typeof client.from !== 'function') {
        throw new Error('Invalid Supabase client: missing required methods');
      }
      this.client = client as BaseSupabaseClient<Database>;
    }
    return this.client;
  }

  /**
   * Get the underlying Supabase client with full type safety
   */
  getSupabaseClient(): BaseSupabaseClient<Database> {
    return this.getClient();
  }

  /**
   * Get a reference to the exercises table with type safety
   */
  get exercises() {
    return this.getClient().from('exercises');
  }

  /**
   * Get the current authenticated user
   */
  async getCurrentUser() {
    const { data: { user }, error } = await this.getClient().auth.getUser();
    if (error) {
      throw error;
    }
    return user;
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.getClient().auth.onAuthStateChange(callback);
  }
}

// Export a singleton instance
export const supabaseClient = new SupabaseClient();