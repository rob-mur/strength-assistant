/**
 * Contract Test: Legend State Configuration Interface
 * 
 * Validates that Legend State configuration and store implementations
 * conform to the local-first architecture contract for the strength assistant app.
 * 
 * This test ensures proper Legend State setup for offline-first functionality,
 * real-time sync, and feature flag controlled backend switching.
 */

import type {
  LegendStateConfig,
  ExerciseStore,
  ExerciseActions
} from '../../specs/001-we-are-actually/contracts/legend-state-config';

describe('Legend State Configuration Contract Compliance', () => {
  describe('LegendStateConfig Interface Compliance', () => {
    it('should define valid local persistence configuration', () => {
      const validLocalConfig: LegendStateConfig['local'] = {
        name: 'strengthassistant',
        indexedDB: {
          prefixID: 'strengthassistant_',
          version: 1
        },
        asyncStorage: {
          preload: true
        }
      };

      expect(validLocalConfig).toMatchObject({
        name: expect.any(String),
        indexedDB: expect.objectContaining({
          prefixID: expect.any(String),
          version: expect.any(Number)
        }),
        asyncStorage: expect.objectContaining({
          preload: expect.any(Boolean)
        })
      });

      expect(validLocalConfig.name).toBe('strengthassistant');
      expect(validLocalConfig.indexedDB!.version).toBeGreaterThan(0);
    });

    it('should define valid Supabase sync configuration', () => {
      const validSyncConfig: LegendStateConfig['sync'] = {
        enabled: true,
        supabase: {
          url: 'https://example.supabase.co',
          anonKey: 'anon-key-example',
          table: 'exercises',
          select: '*',
          actions: {
            create: 'exercises:create',
            update: 'exercises:update', 
            delete: 'exercises:delete'
          },
          realtime: {
            enabled: true,
            schema: 'public'
          }
        },
        retry: {
          infinite: false,
          delay: 1000,
          times: 3,
          backoff: 'exponential'
        },
        conflictResolution: 'lastWriteWins'
      };

      expect(validSyncConfig).toMatchObject({
        enabled: expect.any(Boolean),
        supabase: expect.objectContaining({
          url: expect.any(String),
          anonKey: expect.any(String),
          table: expect.any(String),
          realtime: expect.objectContaining({
            enabled: expect.any(Boolean)
          })
        }),
        retry: expect.objectContaining({
          infinite: expect.any(Boolean),
          delay: expect.any(Number),
          times: expect.any(Number),
          backoff: expect.stringMatching(/^(constant|exponential)$/)
        }),
        conflictResolution: expect.stringMatching(/^(lastWriteWins|firstWriteWins|manual)$/)
      });

      expect(validSyncConfig.enabled).toBe(true);
      expect(validSyncConfig.supabase!.url).toMatch(/^https:\/\//);
      expect(validSyncConfig.supabase!.realtime!.enabled).toBe(true);
    });

    it('should create complete Legend State configuration', () => {
      const fullConfig: LegendStateConfig = {
        local: {
          name: 'strengthassistant',
          indexedDB: {
            prefixID: 'sa_',
            version: 1
          },
          asyncStorage: {
            preload: true
          }
        },
        sync: {
          enabled: true,
          supabase: {
            url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
            anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'example-anon-key',
            table: 'exercises',
            select: 'id, name, created_at, updated_at, user_id',
            actions: {
              create: 'exercises:create',
              update: 'exercises:update',
              delete: 'exercises:delete'
            },
            realtime: {
              enabled: true,
              schema: 'public'
            }
          },
          retry: {
            infinite: false,
            delay: 2000,
            times: 5,
            backoff: 'exponential'
          },
          conflictResolution: 'lastWriteWins'
        }
      };

      expect(fullConfig).toMatchObject({
        local: expect.objectContaining({
          name: expect.any(String)
        }),
        sync: expect.objectContaining({
          enabled: expect.any(Boolean),
          supabase: expect.objectContaining({
            url: expect.any(String),
            anonKey: expect.any(String),
            table: expect.any(String)
          })
        })
      });

      // Validate required configuration properties
      expect(fullConfig.local.name.length).toBeGreaterThan(0);
      expect(fullConfig.sync!.enabled).toBe(true);
      expect(fullConfig.sync!.supabase!.table).toBe('exercises');
    });

    it('should support offline-only configuration', () => {
      const offlineConfig: LegendStateConfig = {
        local: {
          name: 'strengthassistant_offline',
          asyncStorage: {
            preload: true
          }
        },
        sync: {
          enabled: false
        }
      };

      expect(offlineConfig.sync!.enabled).toBe(false);
      expect(offlineConfig.local.name).toContain('offline');
      expect(offlineConfig.sync!.supabase).toBeUndefined();
    });
  });

  describe('ExerciseStore Interface Compliance', () => {
    it('should define valid exercise store structure', () => {
      const mockExerciseStore: ExerciseStore = {
        exercises: {
          'exercise-1': {
            id: 'exercise-1',
            name: 'Push-ups',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: 'user-123',
            syncStatus: 'synced'
          },
          'exercise-2': {
            id: 'exercise-2', 
            name: 'Pull-ups',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: 'pending'
          }
        },
        user: {
          id: 'user-123',
          email: 'test@example.com',
          isAnonymous: false,
          isAuthenticated: true
        },
        syncState: {
          isOnline: true,
          isSyncing: false,
          lastSyncAt: new Date().toISOString(),
          pendingChanges: 1,
          errors: []
        },
        featureFlags: {
          useSupabaseData: true
        }
      };

      // Validate exercise structure
      Object.values(mockExerciseStore.exercises).forEach(exercise => {
        expect(exercise).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          syncStatus: expect.stringMatching(/^(pending|synced|error)$/)
        });

        expect(new Date(exercise.createdAt)).toBeInstanceOf(Date);
        expect(new Date(exercise.updatedAt)).toBeInstanceOf(Date);
      });

      // Validate user structure
      expect(mockExerciseStore.user).toMatchObject({
        id: expect.any(String),
        email: expect.any(String),
        isAnonymous: expect.any(Boolean),
        isAuthenticated: expect.any(Boolean)
      });

      // Validate sync state
      expect(mockExerciseStore.syncState).toMatchObject({
        isOnline: expect.any(Boolean),
        isSyncing: expect.any(Boolean),
        pendingChanges: expect.any(Number),
        errors: expect.any(Array)
      });

      // Validate feature flags
      expect(mockExerciseStore.featureFlags).toMatchObject({
        useSupabaseData: expect.any(Boolean)
      });
    });

    it('should support anonymous user state', () => {
      const anonymousStore: Partial<ExerciseStore> = {
        user: {
          id: 'anonymous-user',
          isAnonymous: true,
          isAuthenticated: false
        },
        exercises: {
          'local-exercise-1': {
            id: 'local-exercise-1',
            name: 'Local Exercise',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: 'pending'
          }
        },
        syncState: {
          isOnline: false,
          isSyncing: false,
          pendingChanges: 1,
          errors: []
        }
      };

      expect(anonymousStore.user!.isAnonymous).toBe(true);
      expect(anonymousStore.user!.isAuthenticated).toBe(false);
      expect(anonymousStore.user!.email).toBeUndefined();
      expect(anonymousStore.syncState!.pendingChanges).toBeGreaterThan(0);
    });

    it('should track sync status correctly', () => {
      const syncStates: Array<ExerciseStore['syncState']> = [
        {
          isOnline: true,
          isSyncing: false,
          lastSyncAt: new Date().toISOString(),
          pendingChanges: 0,
          errors: []
        },
        {
          isOnline: false,
          isSyncing: false,
          pendingChanges: 3,
          errors: []
        },
        {
          isOnline: true,
          isSyncing: true,
          lastSyncAt: new Date().toISOString(),
          pendingChanges: 1,
          errors: []
        },
        {
          isOnline: true,
          isSyncing: false,
          lastSyncAt: new Date().toISOString(),
          pendingChanges: 0,
          errors: ['Sync failed: Network timeout']
        }
      ];

      syncStates.forEach(syncState => {
        expect(syncState).toMatchObject({
          isOnline: expect.any(Boolean),
          isSyncing: expect.any(Boolean),
          pendingChanges: expect.any(Number),
          errors: expect.any(Array)
        });

        expect(syncState.pendingChanges).toBeGreaterThanOrEqual(0);

        if (syncState.lastSyncAt) {
          expect(new Date(syncState.lastSyncAt)).toBeInstanceOf(Date);
        }
      });
    });

    it('should handle feature flag state', () => {
      const featureFlagConfigs = [
        { useSupabaseData: true }, // Supabase backend active
        { useSupabaseData: false }, // Firebase backend active
      ];

      featureFlagConfigs.forEach(flags => {
        expect(flags).toMatchObject({
          useSupabaseData: expect.any(Boolean)
        });
      });

      // Test environment variable integration
      const envBasedFlags = {
        useSupabaseData: process.env.USE_SUPABASE_DATA === 'true'
      };

      expect(typeof envBasedFlags.useSupabaseData).toBe('boolean');
    });
  });

  describe('ExerciseActions Interface Compliance', () => {
    it('should define valid exercise action signatures', () => {
      const mockActions: ExerciseActions = {
        addExercise: async (name: string) => {
          expect(typeof name).toBe('string');
          expect(name.length).toBeGreaterThan(0);
        },
        
        updateExercise: async (id: string, name: string) => {
          expect(typeof id).toBe('string');
          expect(typeof name).toBe('string');
          expect(id.length).toBeGreaterThan(0);
          expect(name.length).toBeGreaterThan(0);
        },
        
        deleteExercise: async (id: string) => {
          expect(typeof id).toBe('string');
          expect(id.length).toBeGreaterThan(0);
        },
        
        signIn: async (email: string, password: string) => {
          expect(typeof email).toBe('string');
          expect(typeof password).toBe('string');
          expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/); // Basic email validation
          expect(password.length).toBeGreaterThan(0);
        },
        
        signUp: async (email: string, password: string) => {
          expect(typeof email).toBe('string');
          expect(typeof password).toBe('string');
          expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
          expect(password.length).toBeGreaterThanOrEqual(6);
        },
        
        signInAnonymously: async () => {
          // No parameters expected
        },
        
        signOut: async () => {
          // No parameters expected
        },
        
        forcSync: async () => {
          // No parameters expected
        },
        
        clearSyncErrors: () => {
          // Synchronous operation, no return expected
        },
        
        validateConsistency: async () => {
          return {
            isConsistent: true,
            errors: []
          };
        },
        
        migrateToSupabase: async () => {
          // No parameters expected
        }
      };

      // Validate action function signatures
      expect(typeof mockActions.addExercise).toBe('function');
      expect(typeof mockActions.updateExercise).toBe('function');
      expect(typeof mockActions.deleteExercise).toBe('function');
      expect(typeof mockActions.signIn).toBe('function');
      expect(typeof mockActions.signUp).toBe('function');
      expect(typeof mockActions.signInAnonymously).toBe('function');
      expect(typeof mockActions.signOut).toBe('function');
      expect(typeof mockActions.forcSync).toBe('function');
      expect(typeof mockActions.clearSyncErrors).toBe('function');
      expect(typeof mockActions.validateConsistency).toBe('function');
      expect(typeof mockActions.migrateToSupabase).toBe('function');
    });

    it('should return promises for async actions', async () => {
      const mockActions: ExerciseActions = {
        addExercise: async (name: string) => {},
        updateExercise: async (id: string, name: string) => {},
        deleteExercise: async (id: string) => {},
        signIn: async (email: string, password: string) => {},
        signUp: async (email: string, password: string) => {},
        signInAnonymously: async () => {},
        signOut: async () => {},
        forcSync: async () => {},
        clearSyncErrors: () => {},
        validateConsistency: async () => ({ isConsistent: true, errors: [] }),
        migrateToSupabase: async () => {}
      };

      // Test that async actions return promises
      expect(mockActions.addExercise('test')).toBeInstanceOf(Promise);
      expect(mockActions.updateExercise('id', 'name')).toBeInstanceOf(Promise);
      expect(mockActions.deleteExercise('id')).toBeInstanceOf(Promise);
      expect(mockActions.signIn('test@example.com', 'password')).toBeInstanceOf(Promise);
      expect(mockActions.signUp('test@example.com', 'password123')).toBeInstanceOf(Promise);
      expect(mockActions.signInAnonymously()).toBeInstanceOf(Promise);
      expect(mockActions.signOut()).toBeInstanceOf(Promise);
      expect(mockActions.forcSync()).toBeInstanceOf(Promise);
      expect(mockActions.validateConsistency()).toBeInstanceOf(Promise);
      expect(mockActions.migrateToSupabase()).toBeInstanceOf(Promise);

      // Test validateConsistency return type
      const consistencyResult = await mockActions.validateConsistency();
      expect(consistencyResult).toMatchObject({
        isConsistent: expect.any(Boolean),
        errors: expect.any(Array)
      });
    });

    it('should handle migration and consistency operations', async () => {
      const mockActions: Partial<ExerciseActions> = {
        validateConsistency: async () => {
          return {
            isConsistent: true,
            errors: []
          };
        },
        
        migrateToSupabase: async () => {
          // Migration process simulation
          return;
        }
      };

      // Test consistency validation
      const consistencyResult = await mockActions.validateConsistency!();
      expect(consistencyResult).toMatchObject({
        isConsistent: expect.any(Boolean),
        errors: expect.any(Array)
      });

      if (!consistencyResult.isConsistent) {
        expect(consistencyResult.errors.length).toBeGreaterThan(0);
        consistencyResult.errors.forEach(error => {
          expect(typeof error).toBe('string');
        });
      }

      // Test migration
      await expect(mockActions.migrateToSupabase!()).resolves.not.toThrow();
    });
  });

  describe('Integration: Legend State with Local First Architecture', () => {
    it('should support offline-first data flow', () => {
      const offlineConfig: LegendStateConfig = {
        local: {
          name: 'strengthassistant_offline',
          asyncStorage: {
            preload: true
          }
        },
        sync: {
          enabled: false
        }
      };

      const offlineStore: Partial<ExerciseStore> = {
        exercises: {
          'offline-exercise': {
            id: 'offline-exercise',
            name: 'Offline Exercise',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: 'pending'
          }
        },
        syncState: {
          isOnline: false,
          isSyncing: false,
          pendingChanges: 1,
          errors: []
        },
        featureFlags: {
          useSupabaseData: false
        }
      };

      // Offline-first requirements
      expect(offlineConfig.sync!.enabled).toBe(false);
      expect(offlineStore.syncState!.isOnline).toBe(false);
      expect(offlineStore.syncState!.pendingChanges).toBeGreaterThan(0);
      expect(offlineStore.exercises!['offline-exercise'].syncStatus).toBe('pending');
    });

    it('should support real-time sync when online', () => {
      const onlineConfig: LegendStateConfig = {
        local: {
          name: 'strengthassistant',
          indexedDB: {
            prefixID: 'sa_',
            version: 1
          }
        },
        sync: {
          enabled: true,
          supabase: {
            url: 'https://example.supabase.co',
            anonKey: 'example-key',
            table: 'exercises',
            realtime: {
              enabled: true,
              schema: 'public'
            }
          },
          retry: {
            infinite: false,
            delay: 1000,
            times: 3,
            backoff: 'exponential'
          },
          conflictResolution: 'lastWriteWins'
        }
      };

      const onlineStore: Partial<ExerciseStore> = {
        syncState: {
          isOnline: true,
          isSyncing: false,
          lastSyncAt: new Date().toISOString(),
          pendingChanges: 0,
          errors: []
        },
        featureFlags: {
          useSupabaseData: true
        }
      };

      // Real-time sync requirements
      expect(onlineConfig.sync!.enabled).toBe(true);
      expect(onlineConfig.sync!.supabase!.realtime!.enabled).toBe(true);
      expect(onlineStore.syncState!.isOnline).toBe(true);
      expect(onlineStore.syncState!.pendingChanges).toBe(0);
      expect(onlineStore.featureFlags!.useSupabaseData).toBe(true);
    });

    it('should support feature flag controlled backend switching', () => {
      const configForSupabase: LegendStateConfig = {
        local: {
          name: 'strengthassistant_supabase'
        },
        sync: {
          enabled: true,
          supabase: {
            url: 'https://supabase.example.com',
            anonKey: 'supabase-key',
            table: 'exercises'
          }
        }
      };

      const configForFirebase: LegendStateConfig = {
        local: {
          name: 'strengthassistant_firebase'
        },
        sync: {
          enabled: true
          // Firebase configuration would be added here when implemented
        }
      };

      const storeWithSupabaseFlag: Partial<ExerciseStore> = {
        featureFlags: {
          useSupabaseData: true
        }
      };

      const storeWithFirebaseFlag: Partial<ExerciseStore> = {
        featureFlags: {
          useSupabaseData: false
        }
      };

      // Feature flag switching validation
      expect(storeWithSupabaseFlag.featureFlags!.useSupabaseData).toBe(true);
      expect(storeWithFirebaseFlag.featureFlags!.useSupabaseData).toBe(false);
      expect(configForSupabase.sync!.supabase).toBeDefined();
      expect(configForFirebase.sync!.enabled).toBe(true);
    });

    it('should maintain constitutional compliance with Legend State', () => {
      // Legend State should support constitutional requirements
      const constitutionalCompliantConfig: LegendStateConfig = {
        local: {
          name: 'strengthassistant_constitutional',
          asyncStorage: {
            preload: true // Fast startup for better test performance
          }
        },
        sync: {
          enabled: true,
          supabase: {
            url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
            anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'example-key',
            table: 'exercises',
            realtime: {
              enabled: true
            }
          },
          retry: {
            infinite: false,
            delay: 1000,
            times: 3,
            backoff: 'exponential'
          }
        }
      };

      // Constitutional requirements
      expect(constitutionalCompliantConfig.local.asyncStorage!.preload).toBe(true);
      expect(constitutionalCompliantConfig.sync!.enabled).toBe(true);
      expect(constitutionalCompliantConfig.sync!.retry!.infinite).toBe(false); // Prevent infinite retry loops
      expect(constitutionalCompliantConfig.sync!.retry!.times).toBeLessThanOrEqual(5); // Reasonable retry limit
    });
  });
});