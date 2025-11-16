/**
 * Legend State Global Configuration
 *
 * This file must be imported early in the app initialization process,
 * before any Legend State observables are created, to ensure proper
 * AsyncStorage configuration for offline-first functionality.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Configure Legend State with AsyncStorage for persistence
 * This fixes the "Missing asyncStorage configuration" error
 *
 * Note: While Legend State v3 has an official configureSynced API,
 * the current beta version (3.0.0-beta.41) has import issues with
 * observablePersistAsyncStorage in Jest environments.
 * Using globalThis assignment as a temporary workaround until
 * the beta stabilizes.
 */
export function configureLegendState(): void {
  console.log("🔧 Configuring Legend State with AsyncStorage...");

  try {
    // Set AsyncStorage globally for Legend State to use
    // This is a temporary approach for the beta version
    (globalThis as Record<string, unknown>).AsyncStorage = AsyncStorage;

    console.log("✅ Legend State AsyncStorage configuration completed");
  } catch (error) {
    console.error("❌ Failed to configure Legend State AsyncStorage:", error);
    throw error;
  }
}

// Auto-configure when this module is imported
configureLegendState();
