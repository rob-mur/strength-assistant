import { configureSyncEngine } from "./syncConfig";
import { initSupabase } from "../supabase/supabase";
import { storageManager } from "../StorageManager";
import { syncManager } from "./SyncManager";

/**
 * Initialize the offline-first data layer
 * Must be called before using any data operations
 */
export async function initializeDataLayer(): Promise<void> {
  console.log("🔄 initializeDataLayer - Starting data layer initialization");
  try {
    // Initialize Supabase client
    console.log("🔗 initializeDataLayer - Initializing Supabase client");
    initSupabase();

    // Initialize StorageManager (includes SupabaseStorage session initialization)
    console.log("💾 initializeDataLayer - Initializing StorageManager");
    await storageManager.init();

    // Configure Legend State sync engine
    console.log("⚙️ initializeDataLayer - Configuring sync engine");
    configureSyncEngine();
    
    // Initialize sync manager for offline queue processing
    console.log("🔄 initializeDataLayer - Initializing sync manager");
    // Sync manager automatically starts network monitoring when constructed
    console.log("✅ Sync manager initialized and monitoring network state");
    
    console.log("✅ initializeDataLayer - Data layer initialization complete");
  } catch (error) {
    console.error(
      "❌ initializeDataLayer - Error during initialization:",
      error,
    );

    // For Chrome/web testing, we'll continue with degraded functionality
    // rather than completely blocking the app, but we should still log the error
    if (typeof window !== "undefined") {
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

// Export sync utilities
export { syncHelpers } from "./syncConfig";
export { exercises$, user$, isOnline$ } from "../store";
export { syncManager } from "./SyncManager";
export { syncQueuePersistence, queueSyncOperation } from "./SyncQueuePersistence";
