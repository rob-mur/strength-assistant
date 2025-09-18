/**
 * Legend State Configuration Contract
 * Defines the configuration interface for Legend State sync engine
 */

export interface LegendStateConfig {
  // Local persistence configuration
  local: {
    name: string; // Database name
    indexedDB?: {
      prefixID?: string;
      version?: number;
    };
    asyncStorage?: {
      preload?: boolean;
    };
  };

  // Sync configuration
  sync?: {
    enabled: boolean;
    supabase?: {
      url: string;
      anonKey: string;
      table: string;
      select?: string;
      actions?: {
        create?: string;
        update?: string;
        delete?: string;
      };
      realtime?: {
        enabled: boolean;
        schema?: string;
      };
    };
    // Retry configuration
    retry?: {
      infinite?: boolean;
      delay?: number;
      times?: number;
      backoff?: "constant" | "exponential";
    };
    // Conflict resolution
    conflictResolution?: "lastWriteWins" | "firstWriteWins" | "manual";
  };
}

/**
 * Legend State Store Interface
 * Defines the observable store structure for exercise data
 */
export interface ExerciseStore {
  exercises: Record<
    string,
    {
      id: string;
      name: string;
      createdAt: string; // ISO string for serialization
      updatedAt: string; // ISO string for serialization
      userId?: string;
      syncStatus: "pending" | "synced" | "error";
    }
  >;

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
 * Legend State Actions Interface
 * Defines the actions that can be performed on the store
 */
export interface ExerciseActions {
  // Exercise operations
  addExercise: (name: string) => Promise<void>;
  updateExercise: (id: string, name: string) => Promise<void>;
  deleteExercise: (id: string) => Promise<void>;

  // Authentication operations
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;

  // Sync operations
  forcSync: () => Promise<void>;
  clearSyncErrors: () => void;

  // Migration operations
  validateConsistency: () => Promise<{
    isConsistent: boolean;
    errors: string[];
  }>;
  migrateToSupabase: () => Promise<void>;
}
