import { Platform } from "react-native";
import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

// Mock Firebase modules
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  connectFirestoreEmulator: jest.fn(),
  // Re-export other firestore functions that might be imported
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  onSnapshot: jest.fn(),
}));

// Mock React Native Platform
jest.mock("react-native", () => ({
  Platform: {
    OS: "web",
  },
}));

// Mock both Firebase config files
jest.mock("../../../firebase.web.config.json", () => {
  throw new Error("Config not found");
}, { virtual: true });

jest.mock("../../../firebase.web.config.demo.json", () => ({
  apiKey: "test-api-key",
  authDomain: "test-domain",
  projectId: "test-project",
}), { virtual: true });

const mockInitializeApp = jest.mocked(initializeApp);
const mockGetFirestore = jest.mocked(getFirestore);
const mockConnectFirestoreEmulator = jest.mocked(connectFirestoreEmulator);

describe("Firebase Web Configuration", () => {
  let originalDEV: any;
  let originalEAS_BUILD_PROFILE: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Store original values
    originalDEV = (global as any).__DEV__;
    originalEAS_BUILD_PROFILE = process.env.EAS_BUILD_PROFILE;
    
    // Reset Firebase initialization state
    delete require.cache[require.resolve("@/lib/data/firebase/firebase.web")];
  });

  afterEach(() => {
    // Restore original values
    (global as any).__DEV__ = originalDEV;
    process.env.EAS_BUILD_PROFILE = originalEAS_BUILD_PROFILE;
  });

  describe("initFirebase", () => {
    test("should initialize Firebase with config in production", async () => {
      const mockApp = { name: "test-app" };
      const mockDb = { type: "firestore" };

      (global as any).__DEV__ = false;
      delete process.env.EAS_BUILD_PROFILE;

      mockInitializeApp.mockReturnValue(mockApp as any);
      mockGetFirestore.mockReturnValue(mockDb as any);

      const { initFirebase } = await import("@/lib/data/firebase/firebase.web");
      
      initFirebase();

      expect(mockInitializeApp).toHaveBeenCalledWith({
        apiKey: "test-api-key",
        authDomain: "test-domain",
        projectId: "test-project",
      });
      expect(mockGetFirestore).toHaveBeenCalledWith(mockApp);
      expect(mockConnectFirestoreEmulator).not.toHaveBeenCalled();
    });

    test("should connect to emulator in development", async () => {
      const mockApp = { name: "test-app" };
      const mockDb = { type: "firestore" };

      (global as any).__DEV__ = true;
      mockInitializeApp.mockReturnValue(mockApp as any);
      mockGetFirestore.mockReturnValue(mockDb as any);

      const { initFirebase } = await import("@/lib/data/firebase/firebase.web");
      
      initFirebase();

      expect(mockInitializeApp).toHaveBeenCalled();
      expect(mockGetFirestore).toHaveBeenCalledWith(mockApp);
      expect(mockConnectFirestoreEmulator).toHaveBeenCalledWith(mockDb, "localhost", 8080);
    });

    test("should connect to emulator in preview build", async () => {
      const mockApp = { name: "test-app" };
      const mockDb = { type: "firestore" };

      (global as any).__DEV__ = false;
      process.env.EAS_BUILD_PROFILE = "preview";

      mockInitializeApp.mockReturnValue(mockApp as any);
      mockGetFirestore.mockReturnValue(mockDb as any);

      const { initFirebase } = await import("@/lib/data/firebase/firebase.web");
      
      initFirebase();

      expect(mockConnectFirestoreEmulator).toHaveBeenCalledWith(mockDb, "localhost", 8080);
    });

    test("should use Android emulator host when Platform.OS is android", async () => {
      const mockApp = { name: "test-app" };
      const mockDb = { type: "firestore" };

      (global as any).__DEV__ = true;
      
      // Temporarily mock Platform.OS as android by modifying the module mock
      jest.resetModules();
      jest.doMock("react-native", () => ({
        Platform: { OS: "android" },
      }));

      mockInitializeApp.mockReturnValue(mockApp as any);
      mockGetFirestore.mockReturnValue(mockDb as any);

      const { initFirebase } = await import("@/lib/data/firebase/firebase.web");
      
      initFirebase();

      expect(mockConnectFirestoreEmulator).toHaveBeenCalledWith(mockDb, "10.0.2.2", 8080);
    });

    test("should only initialize once", async () => {
      const mockApp = { name: "test-app" };
      const mockDb = { type: "firestore" };

      (global as any).__DEV__ = false;
      mockInitializeApp.mockReturnValue(mockApp as any);
      mockGetFirestore.mockReturnValue(mockDb as any);

      const { initFirebase } = await import("@/lib/data/firebase/firebase.web");
      
      initFirebase();
      initFirebase();
      initFirebase();

      expect(mockInitializeApp).toHaveBeenCalledTimes(1);
      expect(mockGetFirestore).toHaveBeenCalledTimes(1);
    });

    test("should handle Firebase initialization errors", async () => {
      const error = new Error("Firebase initialization failed");
      mockInitializeApp.mockImplementation(() => {
        throw error;
      });

      (global as any).__DEV__ = false;
      
      const { initFirebase } = await import("@/lib/data/firebase/firebase.web");

      expect(() => initFirebase()).toThrow("Firebase initialization failed");
    });
  });

  describe("getDb", () => {
    test("should return database after initialization", async () => {
      const mockApp = { name: "test-app" };
      const mockDb = { type: "firestore" };

      (global as any).__DEV__ = false;
      mockInitializeApp.mockReturnValue(mockApp as any);
      mockGetFirestore.mockReturnValue(mockDb as any);

      const { initFirebase, getDb } = await import("@/lib/data/firebase/firebase.web");
      
      initFirebase();
      const db = getDb();

      expect(db).toBe(mockDb);
    });

    test("should throw error when not initialized", async () => {
      const { getDb } = await import("@/lib/data/firebase/firebase.web");

      expect(() => getDb()).toThrow("Firebase not initialized. Call initFirebase() first.");
    });

    test("should throw error when db is not available", async () => {
      const mockApp = { name: "test-app" };

      (global as any).__DEV__ = false;
      mockInitializeApp.mockReturnValue(mockApp as any);
      mockGetFirestore.mockReturnValue(undefined as any);

      const { initFirebase, getDb } = await import("@/lib/data/firebase/firebase.web");
      
      initFirebase();

      expect(() => getDb()).toThrow("Firebase not initialized. Call initFirebase() first.");
    });
  });
});