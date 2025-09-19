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
    font: { MaterialCommunityIcons: "MockedFont" },
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

// Firebase removed - no longer needed

jest.mock("@/lib/data/supabase", () => ({
  initSupabase: jest.fn(),
}));

jest.mock("@/lib/data/sync", () => ({
  initializeDataLayer: jest.fn(),
}));

import { useFonts } from "expo-font";
import { SplashScreen } from "expo-router";
// Firebase imports removed
import { initSupabase } from "@/lib/data/supabase";
import { initializeDataLayer } from "@/lib/data/sync";

describe("useAppInit", () => {
  const mockUseFonts = useFonts as jest.MockedFunction<typeof useFonts>;
  // Firebase removed
  const mockInitSupabase = initSupabase as jest.MockedFunction<
    typeof initSupabase
  >;
  const mockInitializeDataLayer = initializeDataLayer as jest.MockedFunction<
    typeof initializeDataLayer
  >;
  const mockHideAsync = SplashScreen.hideAsync as jest.MockedFunction<
    typeof SplashScreen.hideAsync
  >;

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
    // Logger expectation removed - Firebase no longer used
  });

  test("initializes services and hides splash screen when ready", async () => {
    mockUseFonts.mockReturnValue([true, null]);
    mockInitializeDataLayer.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAppInit());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    expect(mockInitializeDataLayer).toHaveBeenCalled();
    expect(mockHideAsync).toHaveBeenCalled();
    // Logger expectations removed - Firebase no longer used
  });

  test("handles data layer error gracefully", async () => {
    mockUseFonts.mockReturnValue([true, null]);
    mockInitializeDataLayer.mockRejectedValue(new Error("Data layer failed"));

    // Mock window to be undefined to test native path
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    const { result } = renderHook(() => useAppInit());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    // Logger expectations removed - Firebase no longer used

    // Restore window
    global.window = originalWindow;
  });

  test("logs initialization steps correctly", async () => {
    mockUseFonts.mockReturnValue([true, null]);
    mockInitializeDataLayer.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAppInit());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    // Logger expectations removed - Firebase no longer used
  });

  test("logs debug messages during data layer initialization", async () => {
    mockUseFonts.mockReturnValue([true, null]);
    mockInitializeDataLayer.mockResolvedValue(undefined);

    renderHook(() => useAppInit());

    // Logger expectations removed - Firebase no longer used
  });
});
