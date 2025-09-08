import { renderHook, act } from "@testing-library/react-native";

// Simple mock that only provides what we need for the test environment behavior
const mockWebAuthFunctions = {
  signInAnonymouslyWeb: jest.fn(),
};

jest.mock("@/lib/data/firebase/auth.web", () => ({
  ...mockWebAuthFunctions,
  __esModule: true
}));
jest.mock("@/lib/data/firebase/auth.native", () => ({
  __esModule: true
}));

// Import after mocks are set up
import { useAuth } from "@/lib/hooks/useAuth";

describe("useAuth", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset process.env to avoid test environment detection
    process.env = { ...originalEnv };
    delete (process.env as any).CHROME_TEST;
    delete (process.env as any).CI;
    delete (process.env as any).NODE_ENV;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test("initializes with loading state", () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  test("clearError function is available", () => {
    const { result } = renderHook(() => useAuth());
    
    expect(typeof result.current.clearError).toBe("function");
  });

  test("signInAnonymously creates mock user in test environment", async () => {
    // Set test environment
    (process.env as any).NODE_ENV = 'test';
    
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signInAnonymously();
    });
    
    expect(result.current.user).toEqual({
      uid: "test-user-chrome",
      email: null,
      isAnonymous: true,
    });
    expect(result.current.loading).toBe(false);
    expect(mockWebAuthFunctions.signInAnonymouslyWeb).not.toHaveBeenCalled();
  });
});