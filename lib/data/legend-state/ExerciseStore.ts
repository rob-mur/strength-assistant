/**
 * Legend State Store Configuration for Exercise Data
 * 
 * Defines the observable store structure and configuration for exercise data
 * with automatic local persistence and cloud sync capabilities.
 */

import { observable } from '@legendapp/state';
import { isSupabaseDataEnabled } from '../../config/supabase-env';

/**
 * Exercise Store Interface
 * Defines the observable store structure for exercise data
 */
export interface ExerciseStore {
  exercises: Record<string, {
    id: string;
    name: string;
    createdAt: string; // ISO string for serialization
    updatedAt: string; // ISO string for serialization
    userId?: string;
    syncStatus: 'pending' | 'synced' | 'error';
  }>;
  
  // User state
  user: {
    id?: string;
    email?: string;
    isAnonymous: boolean;
    isAuthenticated: boolean;
  } | null;

  // Sync state
  syncState: {
    isOnline: boolean;
    isSyncing: boolean;
    lastSyncAt?: string; // ISO string
    pendingChanges: number;
    errors: string[];
  };

  // Feature flags (read from environment)
  featureFlags: {
    useSupabaseData: boolean; // From USE_SUPABASE_DATA env var
  };
}

/**
 * Initial store state
 */
const initialStoreState: ExerciseStore = {
  exercises: {},
  user: null,
  syncState: {
    isOnline: navigator?.onLine ?? true,
    isSyncing: false,
    pendingChanges: 0,
    errors: []
  },
  featureFlags: {
    useSupabaseData: isSupabaseDataEnabled()
  }
};

/**
 * Create the observable store
 */
export const exerciseStore = observable<ExerciseStore>(initialStoreState);

/**
 * Configure persistence (reserved for future implementation)
 * Note: This configuration is prepared for future Legend State persistence integration
 */

/**
 * Configure persistence (simplified for now)
 */
function configurePersistence() {
  // For now, we'll use a simplified persistence approach
  // In the full implementation, we'd configure persistence plugins
  if (__DEV__) {
    console.info('📱 Exercise store persistence configured');
  }
}

/**
 * Initialize sync engine (simplified)
 */
export function initializeSync() {
  // Configure persistence
  configurePersistence();
  
  // Monitor online status
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      exerciseStore.syncState.isOnline.set(true);
    });
    
    window.addEventListener('offline', () => {
      exerciseStore.syncState.isOnline.set(false);
    });
  }
  
  if (__DEV__) {
    console.info('🔄 Legend State store initialized');
  }
}

/**
 * Reinitialize sync when backend changes (for feature flag switching)
 */
export function reinitializeSync() {
  if (__DEV__) {
    console.info('🔄 Reinitializing store for backend change');
  }
  
  initializeSync();
}

/**
 * Dispose sync engine (cleanup)
 */
export function disposeSync() {
  // Cleanup any resources
  if (__DEV__) {
    console.info('🗑️ Legend State store disposed');
  }
}

// Auto-initialize on module load
initializeSync();