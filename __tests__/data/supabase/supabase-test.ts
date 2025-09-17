import { Platform } from "react-native";
import { initSupabase, getSupabaseClient } from "@/lib/data/supabase/supabase";

// Mock Platform
jest.mock("react-native", () => ({
  Platform: {
    OS: "native"
  }
}));

// Mock the platform-specific modules
jest.mock("@/lib/data/supabase/supabase/supabase.web", () => ({
  initSupabase: jest.fn(),
  getSupabaseClient: jest.fn()
}));

jest.mock("@/lib/data/supabase/supabase/supabase.native", () => ({
  initSupabase: jest.fn(),
  getSupabaseClient: jest.fn()
}));

describe("supabase platform selector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("web platform", () => {
    beforeAll(() => {
      (Platform as any).OS = "web";
    });

    test("initSupabase calls web module", () => {
      const webModule = require("@/lib/data/supabase/supabase/supabase.web");
      
      initSupabase();
      
      expect(webModule.initSupabase).toHaveBeenCalledTimes(1);
    });

    test("getSupabaseClient calls web module", () => {
      const webModule = require("@/lib/data/supabase/supabase/supabase.web");
      const mockClient = { from: jest.fn() };
      webModule.getSupabaseClient.mockReturnValue(mockClient);
      
      const result = getSupabaseClient();
      
      expect(webModule.getSupabaseClient).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockClient);
    });
  });

  describe("native platform", () => {
    beforeAll(() => {
      (Platform as any).OS = "native";
    });

    test("initSupabase calls native module", () => {
      const nativeModule = require("@/lib/data/supabase/supabase/supabase.native");
      
      initSupabase();
      
      expect(nativeModule.initSupabase).toHaveBeenCalledTimes(1);
    });

    test("getSupabaseClient calls native module", () => {
      const nativeModule = require("@/lib/data/supabase/supabase/supabase.native");
      const mockClient = { from: jest.fn() };
      nativeModule.getSupabaseClient.mockReturnValue(mockClient);
      
      const result = getSupabaseClient();
      
      expect(nativeModule.getSupabaseClient).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockClient);
    });
  });

  describe("other platforms (default to native)", () => {
    beforeAll(() => {
      (Platform as any).OS = "android";
    });

    test("initSupabase defaults to native module for android", () => {
      const nativeModule = require("@/lib/data/supabase/supabase/supabase.native");
      
      initSupabase();
      
      expect(nativeModule.initSupabase).toHaveBeenCalledTimes(1);
    });

    test("getSupabaseClient defaults to native module for ios", () => {
      (Platform as any).OS = "ios";
      const nativeModule = require("@/lib/data/supabase/supabase/supabase.native");
      const mockClient = { from: jest.fn() };
      nativeModule.getSupabaseClient.mockReturnValue(mockClient);
      
      const result = getSupabaseClient();
      
      expect(nativeModule.getSupabaseClient).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockClient);
    });
  });
});