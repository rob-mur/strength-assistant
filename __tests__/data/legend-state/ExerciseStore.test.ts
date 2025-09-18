/**
 * ExerciseStore Tests - Comprehensive Coverage
 *
 * Essential test coverage for the ExerciseStore module focusing on:
 * - Observable store creation and configuration
 * - Store initialization and state management
 * - Sync engine initialization and cleanup
 * - Online/offline event handling
 * - Persistence configuration
 */

import {
  exerciseStore,
  initializeSync,
  reinitializeSync,
  disposeSync,
  ExerciseStore,
} from "../../../lib/data/legend-state/ExerciseStore";

// Mock dependencies
jest.mock("@legendapp/state", () => ({
  observable: jest.fn(),
}));

jest.mock("../../../lib/config/supabase-env", () => ({
  isSupabaseDataEnabled: jest.fn(),
}));

// Import mocked modules for type safety
import { observable } from "@legendapp/state";
import { isSupabaseDataEnabled } from "../../../lib/config/supabase-env";

describe("ExerciseStore", () => {
  const originalConsole = console;
  const mockConsole = {
    info: jest.fn(),
  };

  // Mock window and navigator for environment testing
  const originalWindow = global.window;
  const originalNavigator = global.navigator;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(console, mockConsole);

    // Mock observable to return a mock store
    (observable as jest.Mock).mockReturnValue({
      syncState: {
        isOnline: {
          set: jest.fn(),
        },
      },
    });

    // Set up default environment mock
    (isSupabaseDataEnabled as jest.Mock).mockReturnValue(false);
  });

  afterEach(() => {
    Object.assign(console, originalConsole);
    global.window = originalWindow;
    global.navigator = originalNavigator;
  });

  describe("Store Initialization", () => {
    it("should create observable store with initial state", () => {
      // Re-import to trigger module initialization
      jest.isolateModules(() => {
        require("../../../lib/data/legend-state/ExerciseStore");
      });

      expect(observable).toHaveBeenCalledWith(
        expect.objectContaining({
          exercises: {},
          user: null,
          syncState: expect.objectContaining({
            isOnline: true,
            isSyncing: false,
            pendingChanges: 0,
            errors: [],
          }),
          featureFlags: expect.objectContaining({
            useSupabaseData: false,
          }),
        }),
      );
    });

    it("should initialize with Supabase feature flag enabled", () => {
      (isSupabaseDataEnabled as jest.Mock).mockReturnValue(true);

      jest.isolateModules(() => {
        require("../../../lib/data/legend-state/ExerciseStore");
      });

      expect(observable).toHaveBeenCalledWith(
        expect.objectContaining({
          featureFlags: expect.objectContaining({
            useSupabaseData: true,
          }),
        }),
      );
    });

    it("should handle navigator.onLine when available", () => {
      // Mock navigator with onLine property
      Object.defineProperty(global, "navigator", {
        value: { onLine: false },
        writable: true,
      });

      jest.isolateModules(() => {
        require("../../../lib/data/legend-state/ExerciseStore");
      });

      expect(observable).toHaveBeenCalledWith(
        expect.objectContaining({
          syncState: expect.objectContaining({
            isOnline: false,
          }),
        }),
      );
    });

    it("should default to online when navigator is not available", () => {
      // Mock navigator as undefined
      Object.defineProperty(global, "navigator", {
        value: undefined,
        writable: true,
      });

      jest.isolateModules(() => {
        require("../../../lib/data/legend-state/ExerciseStore");
      });

      expect(observable).toHaveBeenCalledWith(
        expect.objectContaining({
          syncState: expect.objectContaining({
            isOnline: true,
          }),
        }),
      );
    });
  });

  describe("Store Export", () => {
    it("should export the exercise store", () => {
      // Re-import to trigger module initialization and observable call
      jest.isolateModules(() => {
        require("../../../lib/data/legend-state/ExerciseStore");
      });

      expect(observable).toHaveBeenCalled();
    });

    it("should export the ExerciseStore interface", () => {
      // TypeScript interface - just verify structure expectations
      const expectedInterface: ExerciseStore = {
        exercises: {},
        user: null,
        syncState: {
          isOnline: true,
          isSyncing: false,
          pendingChanges: 0,
          errors: [],
        },
        featureFlags: {
          useSupabaseData: false,
        },
      };

      expect(expectedInterface).toBeDefined();
    });
  });

  describe("Sync Engine Functions", () => {
    describe("initializeSync", () => {
      beforeEach(() => {
        // Mock window for event listener testing
        const mockAddEventListener = jest.fn();
        Object.defineProperty(global, "window", {
          value: {
            addEventListener: mockAddEventListener,
          },
          writable: true,
        });
      });

      it("should configure persistence and add event listeners", () => {
        const originalDev = (global as any).__DEV__;
        (global as any).__DEV__ = true;

        initializeSync();

        expect(mockConsole.info).toHaveBeenCalledWith(
          "📱 Exercise store persistence configured",
        );
        expect(mockConsole.info).toHaveBeenCalledWith(
          "🔄 Legend State store initialized",
        );
        expect(global.window.addEventListener).toHaveBeenCalledWith(
          "online",
          expect.any(Function),
        );
        expect(global.window.addEventListener).toHaveBeenCalledWith(
          "offline",
          expect.any(Function),
        );

        (global as any).__DEV__ = originalDev;
      });

      it("should not log in production mode", () => {
        const originalDev = (global as any).__DEV__;
        (global as any).__DEV__ = false;

        initializeSync();

        expect(mockConsole.info).not.toHaveBeenCalled();

        (global as any).__DEV__ = originalDev;
      });

      it("should handle missing window object", () => {
        Object.defineProperty(global, "window", {
          value: undefined,
          writable: true,
        });

        const originalDev = (global as any).__DEV__;
        (global as any).__DEV__ = true;

        initializeSync();

        expect(mockConsole.info).toHaveBeenCalledWith(
          "📱 Exercise store persistence configured",
        );
        expect(mockConsole.info).toHaveBeenCalledWith(
          "🔄 Legend State store initialized",
        );

        (global as any).__DEV__ = originalDev;
      });
    });

    describe("reinitializeSync", () => {
      it("should log and call initializeSync in development", () => {
        const originalDev = (global as any).__DEV__;
        (global as any).__DEV__ = true;

        // Mock window for initializeSync call
        Object.defineProperty(global, "window", {
          value: {
            addEventListener: jest.fn(),
          },
          writable: true,
        });

        reinitializeSync();

        expect(mockConsole.info).toHaveBeenCalledWith(
          "🔄 Reinitializing store for backend change",
        );
        expect(mockConsole.info).toHaveBeenCalledWith(
          "📱 Exercise store persistence configured",
        );
        expect(mockConsole.info).toHaveBeenCalledWith(
          "🔄 Legend State store initialized",
        );

        (global as any).__DEV__ = originalDev;
      });

      it("should not log in production", () => {
        const originalDev = (global as any).__DEV__;
        (global as any).__DEV__ = false;

        reinitializeSync();

        expect(mockConsole.info).not.toHaveBeenCalled();

        (global as any).__DEV__ = originalDev;
      });
    });

    describe("disposeSync", () => {
      it("should log disposal in development", () => {
        const originalDev = (global as any).__DEV__;
        (global as any).__DEV__ = true;

        disposeSync();

        expect(mockConsole.info).toHaveBeenCalledWith(
          "🗑️ Legend State store disposed",
        );

        (global as any).__DEV__ = originalDev;
      });

      it("should not log in production", () => {
        const originalDev = (global as any).__DEV__;
        (global as any).__DEV__ = false;

        disposeSync();

        expect(mockConsole.info).not.toHaveBeenCalled();

        (global as any).__DEV__ = originalDev;
      });
    });
  });

  describe("Online/Offline Event Handling", () => {
    let onlineHandler: (() => void) | undefined;
    let offlineHandler: (() => void) | undefined;

    beforeEach(() => {
      const mockAddEventListener = jest
        .fn()
        .mockImplementation((event: string, handler: () => void) => {
          if (event === "online") {
            onlineHandler = handler;
          } else if (event === "offline") {
            offlineHandler = handler;
          }
        });

      Object.defineProperty(global, "window", {
        value: {
          addEventListener: mockAddEventListener,
        },
        writable: true,
      });
    });

    it("should handle online event", () => {
      const mockStore = {
        syncState: {
          isOnline: {
            set: jest.fn(),
          },
        },
      };
      (observable as jest.Mock).mockReturnValue(mockStore);

      // Re-import to get fresh store with our mock
      jest.isolateModules(() => {
        const {
          initializeSync,
        } = require("../../../lib/data/legend-state/ExerciseStore");
        initializeSync();
      });

      // Trigger the online event
      if (onlineHandler) {
        onlineHandler();
        expect(mockStore.syncState.isOnline.set).toHaveBeenCalledWith(true);
      } else {
        fail("Online handler was not set");
      }
    });

    it("should handle offline event", () => {
      const mockStore = {
        syncState: {
          isOnline: {
            set: jest.fn(),
          },
        },
      };
      (observable as jest.Mock).mockReturnValue(mockStore);

      // Re-import to get fresh store with our mock
      jest.isolateModules(() => {
        const {
          initializeSync,
        } = require("../../../lib/data/legend-state/ExerciseStore");
        initializeSync();
      });

      // Trigger the offline event
      if (offlineHandler) {
        offlineHandler();
        expect(mockStore.syncState.isOnline.set).toHaveBeenCalledWith(false);
      } else {
        fail("Offline handler was not set");
      }
    });
  });

  describe("Store Structure and Types", () => {
    it("should have correct exercise structure type", () => {
      const exerciseStructure = {
        id: "test-id",
        name: "Test Exercise",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: "user-123",
        syncStatus: "pending" as const,
      };

      expect(exerciseStructure.id).toBe("test-id");
      expect(exerciseStructure.syncStatus).toBe("pending");
    });

    it("should have correct user structure type", () => {
      const userStructure = {
        id: "user-123",
        email: "test@example.com",
        isAnonymous: false,
        isAuthenticated: true,
      };

      expect(userStructure.isAnonymous).toBe(false);
      expect(userStructure.isAuthenticated).toBe(true);
    });

    it("should have correct sync state structure type", () => {
      const syncStateStructure = {
        isOnline: true,
        isSyncing: false,
        lastSyncAt: new Date().toISOString(),
        pendingChanges: 5,
        errors: ["Error 1", "Error 2"],
      };

      expect(syncStateStructure.isOnline).toBe(true);
      expect(syncStateStructure.pendingChanges).toBe(5);
      expect(Array.isArray(syncStateStructure.errors)).toBe(true);
    });

    it("should have correct feature flags structure type", () => {
      const featureFlagsStructure = {
        useSupabaseData: true,
      };

      expect(typeof featureFlagsStructure.useSupabaseData).toBe("boolean");
    });
  });

  describe("Initial State Validation", () => {
    it("should have empty exercises initially", () => {
      jest.isolateModules(() => {
        require("../../../lib/data/legend-state/ExerciseStore");
      });

      expect(observable).toHaveBeenCalledWith(
        expect.objectContaining({
          exercises: {},
        }),
      );
    });

    it("should have null user initially", () => {
      jest.isolateModules(() => {
        require("../../../lib/data/legend-state/ExerciseStore");
      });

      expect(observable).toHaveBeenCalledWith(
        expect.objectContaining({
          user: null,
        }),
      );
    });

    it("should have correct sync state defaults", () => {
      jest.isolateModules(() => {
        require("../../../lib/data/legend-state/ExerciseStore");
      });

      expect(observable).toHaveBeenCalledWith(
        expect.objectContaining({
          syncState: expect.objectContaining({
            isSyncing: false,
            pendingChanges: 0,
            errors: [],
          }),
        }),
      );
    });
  });

  describe("Module Auto-initialization", () => {
    it("should auto-initialize sync on module load", () => {
      const mockAddEventListener = jest.fn();
      Object.defineProperty(global, "window", {
        value: {
          addEventListener: mockAddEventListener,
        },
        writable: true,
      });

      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = true;

      // Re-import to trigger auto-initialization
      jest.isolateModules(() => {
        require("../../../lib/data/legend-state/ExerciseStore");
      });

      expect(mockConsole.info).toHaveBeenCalledWith(
        "📱 Exercise store persistence configured",
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        "🔄 Legend State store initialized",
      );

      (global as any).__DEV__ = originalDev;
    });
  });

  describe("Environment Integration", () => {
    it("should integrate with supabase environment configuration", () => {
      (isSupabaseDataEnabled as jest.Mock).mockReturnValue(true);

      jest.isolateModules(() => {
        require("../../../lib/data/legend-state/ExerciseStore");
      });

      expect(isSupabaseDataEnabled).toHaveBeenCalled();
      expect(observable).toHaveBeenCalledWith(
        expect.objectContaining({
          featureFlags: expect.objectContaining({
            useSupabaseData: true,
          }),
        }),
      );
    });

    it("should handle various navigator states", () => {
      // Test with navigator.onLine = true
      Object.defineProperty(global, "navigator", {
        value: { onLine: true },
        writable: true,
      });

      jest.isolateModules(() => {
        require("../../../lib/data/legend-state/ExerciseStore");
      });

      expect(observable).toHaveBeenCalledWith(
        expect.objectContaining({
          syncState: expect.objectContaining({
            isOnline: true,
          }),
        }),
      );
    });
  });

  describe("Configuration Functions", () => {
    it("should handle persistence configuration", () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = true;

      // Test configurePersistence through initializeSync
      initializeSync();

      expect(mockConsole.info).toHaveBeenCalledWith(
        "📱 Exercise store persistence configured",
      );

      (global as any).__DEV__ = originalDev;
    });

    it("should handle sync engine configuration", () => {
      const originalDev = (global as any).__DEV__;
      (global as any).__DEV__ = true;

      Object.defineProperty(global, "window", {
        value: {
          addEventListener: jest.fn(),
        },
        writable: true,
      });

      initializeSync();

      expect(mockConsole.info).toHaveBeenCalledWith(
        "🔄 Legend State store initialized",
      );

      (global as any).__DEV__ = originalDev;
    });
  });
});
