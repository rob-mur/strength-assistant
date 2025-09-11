/**
 * Storage Interface Contract
 * Defines the interface that both Firebase and Supabase implementations must support
 */

export interface ExerciseRecord {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  syncStatus: 'pending' | 'synced' | 'error';
}

export interface UserAccount {
  id: string;
  email?: string;
  isAnonymous: boolean;
  createdAt: Date;
  lastSyncAt?: Date;
}

export interface SyncStateRecord {
  recordId: string;
  recordType: string;
  operation: 'create' | 'update' | 'delete';
  pendingSince: Date;
  attempts: number;
  lastError?: string;
}

/**
 * Storage Backend Interface
 * Must be implemented by both Firebase and Supabase adapters
 */
export interface StorageBackend {
  // Exercise CRUD operations
  createExercise(exercise: Omit<ExerciseRecord, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<ExerciseRecord>;
  getExercises(userId?: string): Promise<ExerciseRecord[]>;
  updateExercise(id: string, updates: Partial<Pick<ExerciseRecord, 'name'>>): Promise<ExerciseRecord>;
  deleteExercise(id: string): Promise<void>;

  // User management
  getCurrentUser(): Promise<UserAccount | null>;
  signInWithEmail(email: string, password: string): Promise<UserAccount>;
  signUpWithEmail(email: string, password: string): Promise<UserAccount>;
  signInAnonymously(): Promise<UserAccount>;
  signOut(): Promise<void>;

  // Sync management
  getPendingSyncRecords(): Promise<SyncStateRecord[]>;
  markSyncComplete(recordId: string): Promise<void>;
  markSyncError(recordId: string, error: string): Promise<void>;
  
  // Real-time subscriptions
  subscribeToExercises(userId: string, callback: (exercises: ExerciseRecord[]) => void): () => void;
  subscribeToAuthState(callback: (user: UserAccount | null) => void): () => void;
}

/**
 * Feature Flag Interface
 * Controls which backend implementation to use
 */
export interface FeatureFlags {
  useSupabaseData: boolean; // Controlled by USE_SUPABASE_DATA environment variable
}

/**
 * Storage Manager Interface
 * Manages feature-flag controlled switching between backends
 */
export interface StorageManager {
  // Delegates to active backend based on feature flags
  getActiveStorageBackend(): StorageBackend;
  getAuthBackend(): StorageBackend;
  
  // Migration utilities
  validateDataConsistency(): Promise<{isConsistent: boolean; errors: string[]}>;
  migrateUserData(fromBackend: StorageBackend, toBackend: StorageBackend): Promise<void>;
}