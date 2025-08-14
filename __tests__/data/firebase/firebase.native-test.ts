import { getFirestore, FirebaseFirestoreTypes } from "@react-native-firebase/firestore";

// Mock the React Native Firebase module
jest.mock("@react-native-firebase/firestore", () => ({
  getFirestore: jest.fn(),
  FirebaseFirestoreTypes: {},
}));

const mockGetFirestore = jest.mocked(getFirestore);
const mockUseEmulator = jest.fn();

describe("Firebase Native Configuration", () => {
  let originalDEV: any;
  let originalEXPO_PUBLIC_USE_EMULATOR: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Store original values
    originalDEV = (global as any).__DEV__;
    originalEXPO_PUBLIC_USE_EMULATOR = process.env.EXPO_PUBLIC_USE_EMULATOR;
    
    // Reset Firebase initialization state
    delete require.cache[require.resolve("@/lib/data/firebase/firebase.native")];

    // Setup default mock
    const mockDb = {
      useEmulator: mockUseEmulator,
      type: "firestore-native"
    } as any;
    mockGetFirestore.mockReturnValue(mockDb);
  });

  afterEach(() => {
    // Restore original values
    (global as any).__DEV__ = originalDEV;
    process.env.EXPO_PUBLIC_USE_EMULATOR = originalEXPO_PUBLIC_USE_EMULATOR;
  });

  describe("initFirebase", () => {
    test("should initialize Firebase in production", async () => {
      (global as any).__DEV__ = false;
      delete process.env.EXPO_PUBLIC_USE_EMULATOR;

      const { initFirebase } = await import("@/lib/data/firebase/firebase.native");
      
      initFirebase();

      expect(mockGetFirestore).toHaveBeenCalledTimes(1);
      expect(mockUseEmulator).not.toHaveBeenCalled();
    });

    test("should connect to emulator in development", async () => {
      (global as any).__DEV__ = true;

      const { initFirebase } = await import("@/lib/data/firebase/firebase.native");
      
      initFirebase();

      expect(mockGetFirestore).toHaveBeenCalledTimes(1);
      expect(mockUseEmulator).toHaveBeenCalledWith("10.0.2.2", 8080);
    });

    test("should connect to emulator when EXPO_PUBLIC_USE_EMULATOR is set", async () => {
      (global as any).__DEV__ = false;
      process.env.EXPO_PUBLIC_USE_EMULATOR = "true";

      const { initFirebase } = await import("@/lib/data/firebase/firebase.native");
      
      initFirebase();

      expect(mockGetFirestore).toHaveBeenCalledTimes(1);
      expect(mockUseEmulator).toHaveBeenCalledWith("10.0.2.2", 8080);
    });

    test("should not connect to emulator when EXPO_PUBLIC_USE_EMULATOR is false", async () => {
      (global as any).__DEV__ = false;
      process.env.EXPO_PUBLIC_USE_EMULATOR = "false";

      const { initFirebase } = await import("@/lib/data/firebase/firebase.native");
      
      initFirebase();

      expect(mockGetFirestore).toHaveBeenCalledTimes(1);
      expect(mockUseEmulator).not.toHaveBeenCalled();
    });

    test("should only initialize once", async () => {
      (global as any).__DEV__ = false;

      const { initFirebase } = await import("@/lib/data/firebase/firebase.native");
      
      initFirebase();
      initFirebase();
      initFirebase();

      expect(mockGetFirestore).toHaveBeenCalledTimes(1);
    });

    test("should handle Firebase initialization errors", async () => {
      const error = new Error("Firebase native initialization failed");
      mockGetFirestore.mockImplementation(() => {
        throw error;
      });

      (global as any).__DEV__ = false;
      
      const { initFirebase } = await import("@/lib/data/firebase/firebase.native");

      expect(() => initFirebase()).toThrow("Firebase native initialization failed");
    });

    test("should handle emulator connection errors", async () => {
      const error = new Error("Emulator connection failed");
      mockUseEmulator.mockImplementation(() => {
        throw error;
      });

      (global as any).__DEV__ = true;
      
      const { initFirebase } = await import("@/lib/data/firebase/firebase.native");

      expect(() => initFirebase()).toThrow("Emulator connection failed");
    });
  });

  describe("getDb", () => {
    test("should return database after initialization", async () => {
      const mockDb = {
        useEmulator: mockUseEmulator,
        type: "firestore-native"
      } as any;

      (global as any).__DEV__ = false;
      mockGetFirestore.mockReturnValue(mockDb);

      const { initFirebase, getDb } = await import("@/lib/data/firebase/firebase.native");
      
      initFirebase();
      const db = getDb();

      expect(db).toBe(mockDb);
    });

    test("should throw error when not initialized", async () => {
      const { getDb } = await import("@/lib/data/firebase/firebase.native");

      expect(() => getDb()).toThrow("Firebase not initialized. Call initFirebase() first.");
    });

    test("should throw error when db is not available", async () => {
      (global as any).__DEV__ = false;
      mockGetFirestore.mockReturnValue(undefined as any);

      const { initFirebase, getDb } = await import("@/lib/data/firebase/firebase.native");
      
      initFirebase();

      expect(() => getDb()).toThrow("Firebase not initialized. Call initFirebase() first.");
    });
  });

  describe("Type Safety", () => {
    test("should return correct Firestore module type", async () => {
      const mockDb = {
        useEmulator: mockUseEmulator,
        type: "firestore-native",
        collection: jest.fn(),
        doc: jest.fn(),
      } as FirebaseFirestoreTypes.Module;

      (global as any).__DEV__ = false;
      mockGetFirestore.mockReturnValue(mockDb);

      const { initFirebase, getDb } = await import("@/lib/data/firebase/firebase.native");
      
      initFirebase();
      const db = getDb();

      expect(db).toBe(mockDb);
      expect(typeof db.collection).toBe("function");
      expect(typeof db.doc).toBe("function");
    });
  });
});