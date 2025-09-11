import AsyncStorageWeb from "@/lib/utils/asyncStorage.web";

// Mock console methods to avoid noise in tests
const originalConsoleWarn = console.warn;
beforeAll(() => {
  console.warn = jest.fn();
});

afterAll(() => {
  console.warn = originalConsoleWarn;
});

describe("AsyncStorageWeb", () => {
  let mockLocalStorage: Storage;

  beforeEach(() => {
    // Create a mock localStorage implementation
    const store: Record<string, string> = {};
    mockLocalStorage = {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      length: 0,
      key: jest.fn(),
    };

    // Reset console.warn mock
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any window modifications
    if (typeof window !== 'undefined') {
      (window as any).localStorage = undefined;
    }
  });

  describe("getItem", () => {
    test("returns item from localStorage when window and localStorage are available", async () => {
      // Setup mock window with localStorage
      (global as any).window = { localStorage: mockLocalStorage };
      mockLocalStorage.getItem = jest.fn().mockReturnValue("test-value");

      const result = await AsyncStorageWeb.getItem("test-key");

      expect(result).toBe("test-value");
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("test-key");
    });

    test("returns null when window is undefined", async () => {
      // Ensure window is undefined
      (global as any).window = undefined;

      const result = await AsyncStorageWeb.getItem("test-key");

      expect(result).toBeNull();
    });

    test("returns null when localStorage is not available", async () => {
      // Setup window without localStorage
      (global as any).window = {};

      const result = await AsyncStorageWeb.getItem("test-key");

      expect(result).toBeNull();
    });

    test("returns null and logs warning when localStorage throws error", async () => {
      // Setup localStorage that throws an error
      const errorLocalStorage = {
        getItem: jest.fn().mockImplementation(() => {
          throw new Error("localStorage error");
        }),
      };
      (global as any).window = { localStorage: errorLocalStorage };

      const result = await AsyncStorageWeb.getItem("test-key");

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        "AsyncStorage.getItem failed:", 
        expect.any(Error)
      );
    });

    test("returns null when item doesn't exist in localStorage", async () => {
      (global as any).window = { localStorage: mockLocalStorage };
      mockLocalStorage.getItem = jest.fn().mockReturnValue(null);

      const result = await AsyncStorageWeb.getItem("non-existent-key");

      expect(result).toBeNull();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("non-existent-key");
    });

    test("handles empty string values correctly", async () => {
      (global as any).window = { localStorage: mockLocalStorage };
      mockLocalStorage.getItem = jest.fn().mockReturnValue("");

      const result = await AsyncStorageWeb.getItem("empty-key");

      expect(result).toBe("");
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("empty-key");
    });
  });

  describe("setItem", () => {
    test("sets item in localStorage when window and localStorage are available", async () => {
      (global as any).window = { localStorage: mockLocalStorage };

      await AsyncStorageWeb.setItem("test-key", "test-value");

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("test-key", "test-value");
    });

    test("does nothing when window is undefined", async () => {
      (global as any).window = undefined;
      const setItemSpy = jest.fn();

      await AsyncStorageWeb.setItem("test-key", "test-value");

      expect(setItemSpy).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    test("does nothing when localStorage is not available", async () => {
      (global as any).window = {};

      await AsyncStorageWeb.setItem("test-key", "test-value");

      expect(console.warn).not.toHaveBeenCalled();
    });

    test("logs warning when localStorage throws error", async () => {
      const errorLocalStorage = {
        setItem: jest.fn().mockImplementation(() => {
          throw new Error("localStorage quota exceeded");
        }),
      };
      (global as any).window = { localStorage: errorLocalStorage };

      await AsyncStorageWeb.setItem("test-key", "test-value");

      expect(console.warn).toHaveBeenCalledWith(
        "AsyncStorage.setItem failed:", 
        expect.any(Error)
      );
    });

    test("handles empty string values", async () => {
      (global as any).window = { localStorage: mockLocalStorage };

      await AsyncStorageWeb.setItem("empty-key", "");

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("empty-key", "");
    });

    test("handles special characters in keys and values", async () => {
      (global as any).window = { localStorage: mockLocalStorage };
      const specialKey = "key-with-special-chars!@#$%";
      const specialValue = "value with spaces and unicode: 🚀";

      await AsyncStorageWeb.setItem(specialKey, specialValue);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(specialKey, specialValue);
    });
  });

  describe("removeItem", () => {
    test("removes item from localStorage when window and localStorage are available", async () => {
      (global as any).window = { localStorage: mockLocalStorage };

      await AsyncStorageWeb.removeItem("test-key");

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("test-key");
    });

    test("does nothing when window is undefined", async () => {
      (global as any).window = undefined;
      const removeItemSpy = jest.fn();

      await AsyncStorageWeb.removeItem("test-key");

      expect(removeItemSpy).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    test("does nothing when localStorage is not available", async () => {
      (global as any).window = {};

      await AsyncStorageWeb.removeItem("test-key");

      expect(console.warn).not.toHaveBeenCalled();
    });

    test("logs warning when localStorage throws error", async () => {
      const errorLocalStorage = {
        removeItem: jest.fn().mockImplementation(() => {
          throw new Error("localStorage error");
        }),
      };
      (global as any).window = { localStorage: errorLocalStorage };

      await AsyncStorageWeb.removeItem("test-key");

      expect(console.warn).toHaveBeenCalledWith(
        "AsyncStorage.removeItem failed:", 
        expect.any(Error)
      );
    });

    test("handles removing non-existent keys gracefully", async () => {
      (global as any).window = { localStorage: mockLocalStorage };

      await AsyncStorageWeb.removeItem("non-existent-key");

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("non-existent-key");
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe("clear", () => {
    test("clears localStorage when window and localStorage are available", async () => {
      (global as any).window = { localStorage: mockLocalStorage };

      await AsyncStorageWeb.clear();

      expect(mockLocalStorage.clear).toHaveBeenCalled();
    });

    test("does nothing when window is undefined", async () => {
      (global as any).window = undefined;
      const clearSpy = jest.fn();

      await AsyncStorageWeb.clear();

      expect(clearSpy).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    });

    test("does nothing when localStorage is not available", async () => {
      (global as any).window = {};

      await AsyncStorageWeb.clear();

      expect(console.warn).not.toHaveBeenCalled();
    });

    test("logs warning when localStorage throws error", async () => {
      const errorLocalStorage = {
        clear: jest.fn().mockImplementation(() => {
          throw new Error("localStorage error");
        }),
      };
      (global as any).window = { localStorage: errorLocalStorage };

      await AsyncStorageWeb.clear();

      expect(console.warn).toHaveBeenCalledWith(
        "AsyncStorage.clear failed:", 
        expect.any(Error)
      );
    });
  });

  describe("Integration scenarios", () => {
    test("can perform full CRUD operations when localStorage is available", async () => {
      (global as any).window = { localStorage: mockLocalStorage };

      // Create
      await AsyncStorageWeb.setItem("user-id", "12345");
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("user-id", "12345");

      // Read
      mockLocalStorage.getItem = jest.fn().mockReturnValue("12345");
      const value = await AsyncStorageWeb.getItem("user-id");
      expect(value).toBe("12345");

      // Update (same as create in this API)
      await AsyncStorageWeb.setItem("user-id", "54321");
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("user-id", "54321");

      // Delete
      await AsyncStorageWeb.removeItem("user-id");
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("user-id");
    });

    test("handles mixed availability scenarios gracefully", async () => {
      // Start with localStorage available
      (global as any).window = { localStorage: mockLocalStorage };
      await AsyncStorageWeb.setItem("test-key", "test-value");
      expect(mockLocalStorage.setItem).toHaveBeenCalled();

      // localStorage becomes unavailable
      (global as any).window = {};
      const result = await AsyncStorageWeb.getItem("test-key");
      expect(result).toBeNull();

      // No errors or warnings should be thrown
      expect(console.warn).not.toHaveBeenCalled();
    });

    test("works correctly with JSON data", async () => {
      (global as any).window = { localStorage: mockLocalStorage };
      const testObject = { name: "John", age: 30, active: true };
      const jsonString = JSON.stringify(testObject);

      // Store JSON string
      await AsyncStorageWeb.setItem("user-data", jsonString);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith("user-data", jsonString);

      // Retrieve and parse JSON string
      mockLocalStorage.getItem = jest.fn().mockReturnValue(jsonString);
      const retrievedJson = await AsyncStorageWeb.getItem("user-data");
      expect(retrievedJson).toBe(jsonString);
      
      // Verify it can be parsed back to object
      const parsedObject = JSON.parse(retrievedJson!);
      expect(parsedObject).toEqual(testObject);
    });
  });

  describe("Async behavior", () => {
    test("all methods return promises", async () => {
      (global as any).window = { localStorage: mockLocalStorage };

      const getItemPromise = AsyncStorageWeb.getItem("test-key");
      const setItemPromise = AsyncStorageWeb.setItem("test-key", "value");
      const removeItemPromise = AsyncStorageWeb.removeItem("test-key");
      const clearPromise = AsyncStorageWeb.clear();

      expect(getItemPromise).toBeInstanceOf(Promise);
      expect(setItemPromise).toBeInstanceOf(Promise);
      expect(removeItemPromise).toBeInstanceOf(Promise);
      expect(clearPromise).toBeInstanceOf(Promise);

      // Resolve all promises
      await Promise.all([getItemPromise, setItemPromise, removeItemPromise, clearPromise]);
    });

    test("methods can be awaited in sequence", async () => {
      (global as any).window = { localStorage: mockLocalStorage };

      await AsyncStorageWeb.setItem("key1", "value1");
      await AsyncStorageWeb.setItem("key2", "value2");
      
      mockLocalStorage.getItem = jest.fn()
        .mockReturnValueOnce("value1")
        .mockReturnValueOnce("value2");

      const value1 = await AsyncStorageWeb.getItem("key1");
      const value2 = await AsyncStorageWeb.getItem("key2");

      expect(value1).toBe("value1");
      expect(value2).toBe("value2");

      await AsyncStorageWeb.removeItem("key1");
      await AsyncStorageWeb.clear();

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);
      expect(mockLocalStorage.getItem).toHaveBeenCalledTimes(2);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(1);
      expect(mockLocalStorage.clear).toHaveBeenCalledTimes(1);
    });

    test("methods can be executed concurrently", async () => {
      (global as any).window = { localStorage: mockLocalStorage };
      mockLocalStorage.getItem = jest.fn().mockReturnValue("concurrent-value");

      const promises = [
        AsyncStorageWeb.setItem("key1", "value1"),
        AsyncStorageWeb.setItem("key2", "value2"),
        AsyncStorageWeb.getItem("key3"),
        AsyncStorageWeb.removeItem("key4"),
      ];

      const results = await Promise.all(promises);

      // setItem and removeItem return void, getItem returns string | null
      expect(results[0]).toBeUndefined(); // setItem result
      expect(results[1]).toBeUndefined(); // setItem result
      expect(results[2]).toBe("concurrent-value"); // getItem result
      expect(results[3]).toBeUndefined(); // removeItem result
    });
  });

  describe("Edge cases", () => {
    test("handles extremely large keys and values", async () => {
      (global as any).window = { localStorage: mockLocalStorage };
      
      const largeKey = "x".repeat(1000);
      const largeValue = "y".repeat(10000);

      await AsyncStorageWeb.setItem(largeKey, largeValue);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(largeKey, largeValue);
    });

    test("handles localStorage quota exceeded gracefully", async () => {
      const quotaExceededLocalStorage = {
        setItem: jest.fn().mockImplementation(() => {
          const error = new Error("QuotaExceededError");
          error.name = "QuotaExceededError";
          throw error;
        }),
      };
      (global as any).window = { localStorage: quotaExceededLocalStorage };

      await AsyncStorageWeb.setItem("key", "value");

      expect(console.warn).toHaveBeenCalledWith(
        "AsyncStorage.setItem failed:",
        expect.objectContaining({
          name: "QuotaExceededError"
        })
      );
    });

    test("handles null and undefined window.localStorage gracefully", async () => {
      // Test null localStorage
      (global as any).window = { localStorage: null };
      let result = await AsyncStorageWeb.getItem("test");
      expect(result).toBeNull();

      // Test undefined localStorage
      (global as any).window = { localStorage: undefined };
      result = await AsyncStorageWeb.getItem("test");
      expect(result).toBeNull();

      expect(console.warn).not.toHaveBeenCalled();
    });
  });
});