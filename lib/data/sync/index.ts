// CRITICAL: Configure Legend State AsyncStorage FIRST, before any observables are created
import "../../config/legend-state-config";
import { initSupabase } from "../supabase/supabase";
import { storageManager } from "../StorageManager";
import { initializeExercisesStore } from "../store";
import { configureSyncEngine } from "./syncConfig";

/**
 * Initialize the offline-first data layer
 * Now uses syncedSupabase batteries-included approach
 * Must be called before using any data operations
 */
export async function initializeDataLayer(): Promise<void> {
  console.log(
    "🔄 initializeDataLayer - Starting data layer initialization with syncedSupabase",
  );
  try {
    // Initialize Supabase client first
    console.log("🔗 initializeDataLayer - Initializing Supabase client");
    initSupabase();

    // Initialize StorageManager (includes SupabaseStorage session initialization)
    console.log("💾 initializeDataLayer - Initializing StorageManager");
    await storageManager.init();

    // Now that Supabase is initialized, set up the syncedSupabase stores
    console.log("🗄️ initializeDataLayer - Initializing syncedSupabase stores");
    initializeExercisesStore();

    // Configure sync engine to set up auth state synchronization and real-time updates
    console.log(
      "🔄 initializeDataLayer - Configuring sync engine for auth state and real-time sync",
    );
    configureSyncEngine();

    // syncedSupabase handles sync automatically from now on!
    console.log(
      "⚙️ initializeDataLayer - syncedSupabase configured and active",
    );
    console.log("✅ initializeDataLayer - Data layer initialization complete");
  } catch (error) {
    console.error(
      "❌ initializeDataLayer - Error during initialization:",
      error,
    );

    // For Chrome/web testing, we'll continue with degraded functionality
    // rather than completely blocking the app, but we should still log the error
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      console.warn(
        "🌐 initializeDataLayer - Web environment detected, continuing with degraded functionality",
      );
      console.error(
        "🌐 initializeDataLayer - Original error that was suppressed:",
        error,
      );

      // Create visible error indicator for debugging
      const errorDiv = document.createElement("div");
      errorDiv.id = "supabase-init-error";
      errorDiv.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
        background: #ff4444; color: white; padding: 10px;
        font-family: monospace; font-size: 12px; max-height: 200px; overflow-y: auto;
      `;
      errorDiv.innerHTML = `🚨 SUPABASE INIT ERROR: ${error instanceof Error ? error.message : String(error)}<br>Stack: ${error instanceof Error ? error.stack : "No stack"}`;
      document.body?.appendChild(errorDiv);

      return;
    }
    throw error;
  }
}

// Export state observables (syncedSupabase handles sync automatically)
export { exercises$, user$, isOnline$, exerciseUtils } from "../store";
