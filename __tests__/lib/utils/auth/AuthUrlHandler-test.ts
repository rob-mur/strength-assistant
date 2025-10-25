import {
  extractTokensFromUrl,
  isAuthCallbackUrl,
  processAuthTokens,
  type SupabaseClient,
} from "@/lib/utils/auth/AuthUrlHandler";

describe("AuthUrlHandler", () => {
  describe("extractTokensFromUrl", () => {
    it("should extract tokens from URL fragment", () => {
      const url =
        "strengthassistant://auth-callback#access_token=test_access&refresh_token=test_refresh";
      const result = extractTokensFromUrl(url);

      expect(result).toEqual({
        accessToken: "test_access",
        refreshToken: "test_refresh",
      });
    });

    it("should extract tokens from query parameters", () => {
      const url =
        "strengthassistant://auth-callback?access_token=test_access&refresh_token=test_refresh";
      const result = extractTokensFromUrl(url);

      expect(result).toEqual({
        accessToken: "test_access",
        refreshToken: "test_refresh",
      });
    });

    it("should prioritize fragment over query parameters", () => {
      const url =
        "strengthassistant://auth-callback?access_token=query_access&refresh_token=query_refresh#access_token=fragment_access&refresh_token=fragment_refresh";
      const result = extractTokensFromUrl(url);

      expect(result).toEqual({
        accessToken: "fragment_access",
        refreshToken: "fragment_refresh",
      });
    });

    it("should return null tokens when none found", () => {
      const url = "strengthassistant://auth-callback";
      const result = extractTokensFromUrl(url);

      expect(result).toEqual({
        accessToken: null,
        refreshToken: null,
      });
    });

    it("should handle URL with only access token", () => {
      const url = "strengthassistant://auth-callback#access_token=test_access";
      const result = extractTokensFromUrl(url);

      expect(result).toEqual({
        accessToken: "test_access",
        refreshToken: null,
      });
    });

    it("should handle URL with only refresh token", () => {
      const url =
        "strengthassistant://auth-callback#refresh_token=test_refresh";
      const result = extractTokensFromUrl(url);

      expect(result).toEqual({
        accessToken: null,
        refreshToken: "test_refresh",
      });
    });

    it("should handle malformed URLs gracefully", () => {
      const url = "not-a-valid-url";
      const result = extractTokensFromUrl(url);

      expect(result).toEqual({
        accessToken: null,
        refreshToken: null,
      });
    });
  });

  describe("isAuthCallbackUrl", () => {
    it("should return true for auth-callback URLs", () => {
      const url = "strengthassistant://auth-callback";
      expect(isAuthCallbackUrl(url)).toBe(true);
    });

    it("should return true for strengthassistant URLs with access_token", () => {
      const url = "strengthassistant://some-path?access_token=test";
      expect(isAuthCallbackUrl(url)).toBe(true);
    });

    it("should return true for strengthassistant URLs with refresh_token", () => {
      const url = "strengthassistant://some-path?refresh_token=test";
      expect(isAuthCallbackUrl(url)).toBe(true);
    });

    it("should return false for non-strengthassistant URLs", () => {
      const url = "https://example.com/auth-callback";
      expect(isAuthCallbackUrl(url)).toBe(false);
    });

    it("should return false for strengthassistant URLs without tokens", () => {
      const url = "strengthassistant://other-page";
      expect(isAuthCallbackUrl(url)).toBe(false);
    });

    it("should return false for empty URLs", () => {
      expect(isAuthCallbackUrl("")).toBe(false);
    });
  });

  describe("processAuthTokens", () => {
    let mockSupabase: SupabaseClient;
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      mockSupabase = {
        auth: {
          setSession: jest.fn(),
          getSession: jest.fn(),
        },
      };
      consoleSpy = jest.spyOn(console, "log").mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it("should successfully set session with tokens", async () => {
      (mockSupabase.auth.setSession as jest.Mock).mockResolvedValue({
        error: null,
      });

      await processAuthTokens(mockSupabase, "test_access", "test_refresh");

      expect(mockSupabase.auth.setSession).toHaveBeenCalledWith({
        access_token: "test_access",
        refresh_token: "test_refresh",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "🔗 Found auth tokens in URL, setting session",
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "🔗 Auth callback processed successfully - user should be signed in",
      );
    });

    it("should handle setSession error", async () => {
      const testError = new Error("Session error");
      (mockSupabase.auth.setSession as jest.Mock).mockResolvedValue({
        error: testError,
      });

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await processAuthTokens(mockSupabase, "test_access", "test_refresh");

      expect(mockSupabase.auth.setSession).toHaveBeenCalledWith({
        access_token: "test_access",
        refresh_token: "test_refresh",
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "🔗 Error setting session from auth callback:",
        testError,
      );

      consoleErrorSpy.mockRestore();
    });

    it("should handle setSession rejection", async () => {
      const testError = new Error("Network error");
      (mockSupabase.auth.setSession as jest.Mock).mockRejectedValue(testError);

      await expect(
        processAuthTokens(mockSupabase, "test_access", "test_refresh"),
      ).rejects.toThrow("Network error");

      expect(mockSupabase.auth.setSession).toHaveBeenCalledWith({
        access_token: "test_access",
        refresh_token: "test_refresh",
      });
    });
  });
});
