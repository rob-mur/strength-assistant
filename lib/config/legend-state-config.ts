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
 * The actual configuration happens by setting the AsyncStorage globally
 * which Legend State will pick up automatically.
 */
export function configureLegendState(): void {
  console.log("🔧 Configuring Legend State with AsyncStorage...");

  try {
    // Set AsyncStorage globally for Legend State to use
    // This is the correct way to configure AsyncStorage for Legend State
    (global as any).AsyncStorage = AsyncStorage;

    console.log("✅ Legend State AsyncStorage configuration completed");
  } catch (error) {
    console.error("❌ Failed to configure Legend State AsyncStorage:", error);
    throw error;
  }
}

// Auto-configure when this module is imported
configureLegendState();
