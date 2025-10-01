import { SupabaseClientCore } from "../../../lib/data/supabase/SupabaseClientCore";
import { User, AuthError } from "@supabase/supabase-js";

describe("SupabaseClientCore", () => {
  describe("processAuthResponse", () => {
    it("should return user when authentication is successful", async () => {
      const mockUser: User = {
        id: "test-user-123",
        email: "test@example.com",
        aud: "authenticated",
        app_metadata: {},
        user_metadata: {},
        created_at: "2023-01-01T00:00:00Z",
      };

      const authCall = Promise.resolve({
        data: { user: mockUser },
        error: null,
      });

      const result = await SupabaseClientCore.processAuthResponse(authCall);

      expect(result).toEqual(mockUser);
    });

    it("should return null when no user is authenticated", async () => {
      const authCall = Promise.resolve({
        data: { user: null },
        error: null,
      });

      const result = await SupabaseClientCore.processAuthResponse(authCall);

      expect(result).toBeNull();
    });

    it("should return null when AuthSessionMissingError occurs", async () => {
      const authError: AuthError = {
        name: "AuthSessionMissingError",
        message: "Auth session missing",
      };

      const authCall = Promise.resolve({
        data: { user: null },
        error: authError,
      });

      const result = await SupabaseClientCore.processAuthResponse(authCall);

      expect(result).toBeNull();
    });

    it("should return null when Auth session missing error occurs", async () => {
      const authError: AuthError = {
        name: "AuthError",
        message: "Auth session missing - user needs to sign in",
      };

      const authCall = Promise.resolve({
        data: { user: null },
        error: authError,
      });

      const result = await SupabaseClientCore.processAuthResponse(authCall);

      expect(result).toBeNull();
    });

    it("should throw error when other auth errors occur", async () => {
      const authError: AuthError = {
        name: "AuthError",
        message: "Invalid JWT token",
      };

      const authCall = Promise.resolve({
        data: { user: null },
        error: authError,
      });

      await expect(
        SupabaseClientCore.processAuthResponse(authCall),
      ).rejects.toEqual(authError);
    });

    it("should handle timeout with custom timeout value", async () => {
      // Mock a slow auth call that exceeds timeout
      const authCall = new Promise(
        (resolve) =>
          setTimeout(
            () =>
              resolve({
                data: { user: null },
                error: null,
              }),
            200,
          ), // 200ms
      );

      await expect(
        SupabaseClientCore.processAuthResponse(authCall, 100),
      ).rejects.toThrow("getCurrentUser timeout after 0.1 seconds");
    });

    it("should handle invalid auth response", async () => {
      const authCall = Promise.resolve("invalid response" as any);

      await expect(
        SupabaseClientCore.processAuthResponse(authCall),
      ).rejects.toThrow("Invalid auth response");
    });

    it("should handle auth call that throws Auth session missing error", async () => {
      const error = new Error("Auth session missing");
      const authCall = Promise.reject(error);

      const result = await SupabaseClientCore.processAuthResponse(authCall);

      expect(result).toBeNull();
    });

    it("should handle auth call that throws AuthSessionMissingError by name", async () => {
      const error = new Error("Something went wrong");
      error.name = "AuthSessionMissingError";
      const authCall = Promise.reject(error);

      const result = await SupabaseClientCore.processAuthResponse(authCall);

      expect(result).toBeNull();
    });

    it("should throw other errors that are not auth session related", async () => {
      const error = new Error("Network error");
      const authCall = Promise.reject(error);

      await expect(
        SupabaseClientCore.processAuthResponse(authCall),
      ).rejects.toThrow("Network error");
    });
  });

  describe("handleAuthError", () => {
    it("should return null for session missing error", () => {
      const error: AuthError = {
        name: "AuthError",
        message: "Auth session missing",
      };

      const result = SupabaseClientCore.handleAuthError(error);

      expect(result).toBeNull();
    });

    it("should return null for AuthSessionMissingError", () => {
      const error: AuthError = {
        name: "AuthSessionMissingError",
        message: "Session expired",
      };

      const result = SupabaseClientCore.handleAuthError(error);

      expect(result).toBeNull();
    });

    it("should throw non-session errors", () => {
      const error: AuthError = {
        name: "AuthError",
        message: "Invalid JWT token",
      };

      expect(() => SupabaseClientCore.handleAuthError(error)).toThrow(
        "Invalid JWT token",
      );
    });
  });

  describe("handleAuthException", () => {
    it("should return null for session missing exception", () => {
      const error = new Error("Auth session missing");

      const result = SupabaseClientCore.handleAuthException(error);

      expect(result).toBeNull();
    });

    it("should return null for AuthSessionMissingError exception", () => {
      const error = new Error("Something went wrong");
      error.name = "AuthSessionMissingError";

      const result = SupabaseClientCore.handleAuthException(error);

      expect(result).toBeNull();
    });

    it("should throw non-session exceptions", () => {
      const error = new Error("Network error");

      expect(() => SupabaseClientCore.handleAuthException(error)).toThrow(
        "Network error",
      );
    });

    it("should throw non-Error exceptions", () => {
      const error = "String error";

      expect(() => SupabaseClientCore.handleAuthException(error)).toThrow(
        "String error",
      );
    });
  });

  describe("isSessionMissingError", () => {
    it("should return true for Auth session missing message", () => {
      const error: AuthError = {
        name: "AuthError",
        message: "Auth session missing",
      };

      expect(SupabaseClientCore.isSessionMissingError(error)).toBe(true);
    });

    it("should return true for AuthSessionMissingError message", () => {
      const error: AuthError = {
        name: "AuthError",
        message: "AuthSessionMissingError occurred",
      };

      expect(SupabaseClientCore.isSessionMissingError(error)).toBe(true);
    });

    it("should return true for AuthSessionMissingError name", () => {
      const error: AuthError = {
        name: "AuthSessionMissingError",
        message: "Session expired",
      };

      expect(SupabaseClientCore.isSessionMissingError(error)).toBe(true);
    });

    it("should return false for other errors", () => {
      const error: AuthError = {
        name: "AuthError",
        message: "Invalid JWT token",
      };

      expect(SupabaseClientCore.isSessionMissingError(error)).toBe(false);
    });
  });

  describe("isSessionMissingException", () => {
    it("should return true for Auth session missing exception", () => {
      const error = new Error("Auth session missing");

      expect(SupabaseClientCore.isSessionMissingException(error)).toBe(true);
    });

    it("should return true for AuthSessionMissingError exception", () => {
      const error = new Error("Something went wrong");
      error.name = "AuthSessionMissingError";

      expect(SupabaseClientCore.isSessionMissingException(error)).toBe(true);
    });

    it("should return false for other exceptions", () => {
      const error = new Error("Network error");

      expect(SupabaseClientCore.isSessionMissingException(error)).toBe(false);
    });

    it("should return false for non-Error exceptions", () => {
      const error = "String error";

      expect(SupabaseClientCore.isSessionMissingException(error)).toBe(false);
    });
  });

  describe("validateClient", () => {
    it("should pass validation for valid client", () => {
      const validClient = {
        from: jest.fn(),
        auth: {},
      };

      expect(() =>
        SupabaseClientCore.validateClient(validClient as any),
      ).not.toThrow();
    });

    it("should throw error for null client", () => {
      expect(() => SupabaseClientCore.validateClient(null as any)).toThrow(
        "Invalid Supabase client: missing required methods",
      );
    });

    it("should throw error for undefined client", () => {
      expect(() => SupabaseClientCore.validateClient(undefined as any)).toThrow(
        "Invalid Supabase client: missing required methods",
      );
    });

    it("should throw error for client without from method", () => {
      const invalidClient = {
        auth: {},
      };

      expect(() =>
        SupabaseClientCore.validateClient(invalidClient as any),
      ).toThrow("Invalid Supabase client: missing required methods");
    });

    it("should throw error for client with non-function from property", () => {
      const invalidClient = {
        from: "not a function",
        auth: {},
      };

      expect(() =>
        SupabaseClientCore.validateClient(invalidClient as any),
      ).toThrow("Invalid Supabase client: missing required methods");
    });
  });
});
