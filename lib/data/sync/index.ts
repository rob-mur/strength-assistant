import { configureSyncEngine } from "./syncConfig";
import { initSupabase } from "../supabase/supabase";

/**
 * Initialize the offline-first data layer
 * Must be called before using any data operations
 */
export async function initializeDataLayer(): Promise<void> {
  try {
    // Initialize Supabase
    initSupabase();

    // Configure Legend State sync engine
    configureSyncEngine();
  } catch (error) {
    // For Chrome/web testing, we'll continue with degraded functionality
    // rather than completely blocking the app
    if (typeof window !== "undefined") {
      return;
    }
    throw error;
  }
}

// Export sync utilities
export { syncHelpers } from "./syncConfig";
export { exercises$, user$, isOnline$ } from "../store";
