import { useAppInit } from "@/lib/hooks/useAppInit";
import { renderHook, waitFor } from "@testing-library/react-native";

// Mock dependencies
jest.mock("@expo-google-fonts/jetbrains-mono", () => ({
  JetBrainsMono_400Regular: "JetBrainsMono_400Regular",
}));

jest.mock("@expo-google-fonts/noto-sans", () => ({
  NotoSans_400Regular: "NotoSans_400Regular",
}));

jest.mock("@expo/vector-icons", () => ({
  MaterialCommunityIcons: {
    font: { "MaterialCommunityIcons": "MockedFont" },
  },
}));

jest.mock("expo-font", () => ({
  useFonts: jest.fn(),
}));

jest.mock("expo-router", () => ({
  SplashScreen: {
    hideAsync: jest.fn(),
  },
}));

jest.mock("@/lib/data/firebase", () => ({
  initFirebase: jest.fn(),
}));

jest.mock("@/lib/data/firebase/logger", () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/lib/data/supabase", () => ({
  initSupabase: jest.fn(),
}));

import { useFonts } from "expo-font";
import { SplashScreen } from "expo-router";
import { initFirebase } from "@/lib/data/firebase";
import { logger } from "@/lib/data/firebase/logger";
import { initSupabase } from "@/lib/data/supabase";

const mockUseFonts = useFonts as jest.MockedFunction<typeof useFonts>;
const mockInitFirebase = initFirebase as jest.MockedFunction<typeof initFirebase>;
const mockInitSupabase = initSupabase as jest.MockedFunction<typeof initSupabase>;

describe("useAppInit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFonts.mockReturnValue([false, null]);
  });

  test("returns false when fonts are not loaded", () => {
    mockUseFonts.mockReturnValue([false, null]);
    
    const { result } = renderHook(() => useAppInit());
    
    expect(result.current).toBe(false);
  });

  test("throws error when font loading fails", () => {
    const fontError = new Error("Font loading failed");
    mockUseFonts.mockReturnValue([false, fontError]);
    
    expect(() => renderHook(() => useAppInit())).toThrow("Font loading failed");
    expect(logger.error).toHaveBeenCalledWith("Font loading error", expect.any(Object));
  });

  test("initializes Firebase and Supabase successfully", async () => {
    mockUseFonts.mockReturnValue([true, null]);
    mockInitFirebase.mockImplementation(() => {});
    mockInitSupabase.mockImplementation(() => {});
    
    const { result } = renderHook(() => useAppInit());
    
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
    
    expect(mockInitFirebase).toHaveBeenCalled();
    expect(mockInitSupabase).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith("Starting app initialization", expect.any(Object));
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
  });

  test("handles Firebase initialization error gracefully", async () => {
    mockUseFonts.mockReturnValue([true, null]);
    mockInitFirebase.mockImplementation(() => {
      throw new Error("Firebase init failed");
    });
    mockInitSupabase.mockImplementation(() => {});
    
    const { result } = renderHook(() => useAppInit());
    
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
    
    expect(logger.error).toHaveBeenCalledWith("Firebase initialization failed", expect.any(Object));
    expect(logger.warn).toHaveBeenCalledWith("Continuing without Firebase", expect.any(Object));
    expect(mockInitSupabase).toHaveBeenCalled();
  });

  test("handles Supabase initialization error gracefully", async () => {
    mockUseFonts.mockReturnValue([true, null]);
    mockInitFirebase.mockImplementation(() => {});
    mockInitSupabase.mockImplementation(() => {
      throw new Error("Supabase init failed");
    });
    
    const { result } = renderHook(() => useAppInit());
    
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
    
    expect(logger.error).toHaveBeenCalledWith("Supabase initialization failed", expect.any(Object));
    expect(logger.warn).toHaveBeenCalledWith("Continuing without Supabase", expect.any(Object));
  });

  test("handles general initialization error", async () => {
    mockUseFonts.mockReturnValue([true, null]);
    mockInitFirebase.mockImplementation(() => {
      throw new Error("General init error");
    });
    
    const { result } = renderHook(() => useAppInit());
    
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
    
    expect(logger.error).toHaveBeenCalledWith("App initialization error", expect.any(Object));
    expect(logger.warn).toHaveBeenCalledWith("App will continue with limited functionality", expect.any(Object));
  });
});