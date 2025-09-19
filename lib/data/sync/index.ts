import { configureSyncEngine } from "./syncConfig";
import { initSupabase } from "../supabase/supabase";
import { initFirebase } from "../firebase";

/**
 * Initialize the offline-first data layer
 * Must be called before using any data operations
 */
export async function initializeDataLayer(): Promise<void> {
  try {
    // Initialize both Firebase and Supabase during transition period
    console.log("🔥 Initializing Firebase...");
    initFirebase();

    console.log("📊 Initializing Supabase...");
    initSupabase();

    // Configure Legend State sync engine
    console.log("🔄 Configuring sync engine...");
    configureSyncEngine();

    console.log("✅ Offline-first data layer initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize data layer:", error);
    // For Chrome/web testing, we'll continue with degraded functionality
    // rather than completely blocking the app
    if (typeof window !== "undefined") {
      console.warn(
        "⚠️ Continuing with degraded functionality for web environment",
      );
      return;
    }
    throw error;
  }
}

// Export sync utilities
export { syncHelpers } from "./syncConfig";
export { exercises$, user$, isOnline$ } from "../store";
