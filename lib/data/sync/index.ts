import { configureSyncEngine } from './syncConfig';
import { initSupabase } from '../supabase/supabase';
import { initFirebase } from '../firebase';

/**
 * Initialize the offline-first data layer
 * Must be called before using any data operations
 */
export async function initializeDataLayer(): Promise<void> {
  try {
    // Initialize both Firebase and Supabase during transition period
    initFirebase();
    initSupabase();
    
    // Configure Legend State sync engine
    configureSyncEngine();
    
    console.log('✅ Offline-first data layer initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize data layer:', error);
    throw error;
  }
}

// Export sync utilities
export { syncHelpers } from './syncConfig';
export { exercises$, user$, isOnline$ } from '../store';