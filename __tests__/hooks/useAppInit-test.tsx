import { useAppInit } from "@/lib/hooks/useAppInit";
import { renderHook, waitFor } from "@testing-library/react-native";

// Mock external dependencies
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

// Mock the actual modules these depend on
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

describe("useAppInit", () => {
  const mockUseFonts = useFonts as jest.MockedFunction<typeof useFonts>;
  const mockInitFirebase = initFirebase as jest.MockedFunction<typeof initFirebase>;
  const mockInitSupabase = initSupabase as jest.MockedFunction<typeof initSupabase>;
  const mockHideAsync = SplashScreen.hideAsync as jest.MockedFunction<typeof SplashScreen.hideAsync>;

  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(logger.error).toHaveBeenCalledWith("Font loading error", expect.objectContaining({
      service: "App Init",
      platform: "React Native",
      operation: "font_loading"
    }));
  });

  test("initializes services and hides splash screen when ready", async () => {
    mockUseFonts.mockReturnValue([true, null]);
    mockInitFirebase.mockImplementation(() => {});
    mockInitSupabase.mockImplementation(() => {});
    
    const { result } = renderHook(() => useAppInit());
    
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
    
    expect(mockInitFirebase).toHaveBeenCalled();
    expect(mockInitSupabase).toHaveBeenCalled();
    expect(mockHideAsync).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith("Starting app initialization", expect.any(Object));
    expect(logger.info).toHaveBeenCalledWith("App initialization complete", expect.any(Object));
  });

  test("handles Firebase error but continues with Supabase", async () => {
    mockUseFonts.mockReturnValue([true, null]);
    mockInitFirebase.mockImplementation(() => {
      throw new Error("Firebase failed");
    });
    mockInitSupabase.mockImplementation(() => {});
    
    const { result } = renderHook(() => useAppInit());
    
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
    
    expect(logger.error).toHaveBeenCalledWith("Firebase initialization failed", expect.objectContaining({
      operation: "firebase_init"
    }));
    expect(logger.warn).toHaveBeenCalledWith("Continuing without Firebase", expect.any(Object));
    expect(mockInitSupabase).toHaveBeenCalled();
  });

  test("handles Supabase error gracefully", async () => {
    mockUseFonts.mockReturnValue([true, null]);
    mockInitFirebase.mockImplementation(() => {});
    mockInitSupabase.mockImplementation(() => {
      throw new Error("Supabase failed");
    });
    
    const { result } = renderHook(() => useAppInit());
    
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
    
    expect(logger.error).toHaveBeenCalledWith("Supabase initialization failed", expect.objectContaining({
      operation: "supabase_init"
    }));
    expect(logger.warn).toHaveBeenCalledWith("Continuing without Supabase", expect.any(Object));
  });

  test("logs debug messages during Supabase initialization", async () => {
    mockUseFonts.mockReturnValue([true, null]);
    mockInitFirebase.mockImplementation(() => {});
    mockInitSupabase.mockImplementation(() => {});
    
    renderHook(() => useAppInit());
    
    await waitFor(() => {
      expect(logger.debug).toHaveBeenCalledWith("SUPABASE DEBUG: About to call initSupabase", expect.objectContaining({
        service: "App Init",
        platform: "React Native",
        operation: "supabase_init"
      }));
    });
    
    await waitFor(() => {
      expect(logger.debug).toHaveBeenCalledWith("SUPABASE DEBUG: Supabase initialization completed successfully", expect.objectContaining({
        service: "App Init", 
        platform: "React Native",
        operation: "supabase_init"
      }));
    });
  });
});