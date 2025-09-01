import { SupabaseClient, supabaseClient } from "@/lib/data/supabase/SupabaseClient";
import { getSupabaseClient } from "@/lib/data/supabase/supabase";

// Mock the supabase module
jest.mock("@/lib/data/supabase/supabase", () => ({
  getSupabaseClient: jest.fn(),
}));

describe("SupabaseClient", () => {
  const mockSupabaseClient = {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getSupabaseClient as jest.Mock).mockReturnValue(mockSupabaseClient);
  });

  describe("constructor and client initialization", () => {
    test("creates instance without immediately calling getSupabaseClient", () => {
      const client = new SupabaseClient();
      expect(getSupabaseClient).not.toHaveBeenCalled();
      expect(client).toBeInstanceOf(SupabaseClient);
    });

    test("lazy loads client on first access", () => {
      const client = new SupabaseClient();
      
      // Access exercises to trigger client initialization
      client.exercises;
      
      expect(getSupabaseClient).toHaveBeenCalledTimes(1);
    });

    test("reuses client on subsequent accesses", () => {
      const client = new SupabaseClient();
      
      // Access multiple times
      client.exercises;
      client.exercises;
      client.getSupabaseClient();
      
      expect(getSupabaseClient).toHaveBeenCalledTimes(1);
    });
  });

  describe("getSupabaseClient", () => {
    test("returns the underlying Supabase client", () => {
      const client = new SupabaseClient();
      const result = client.getSupabaseClient();
      
      expect(result).toBe(mockSupabaseClient);
      expect(getSupabaseClient).toHaveBeenCalledTimes(1);
    });

    test("throws error when getSupabaseClient returns null", () => {
      (getSupabaseClient as jest.Mock).mockReturnValue(null);
      
      const client = new SupabaseClient();
      
      expect(() => client.getSupabaseClient()).toThrow(
        "Invalid Supabase client: missing required methods"
      );
    });

    test("throws error when getSupabaseClient returns invalid client", () => {
      (getSupabaseClient as jest.Mock).mockReturnValue({ invalid: true });
      
      const client = new SupabaseClient();
      
      expect(() => client.getSupabaseClient()).toThrow(
        "Invalid Supabase client: missing required methods"
      );
    });
  });

  describe("exercises table access", () => {
    test("returns typed reference to exercises table", () => {
      const mockTableRef = { select: jest.fn(), insert: jest.fn() };
      mockSupabaseClient.from.mockReturnValue(mockTableRef);
      
      const client = new SupabaseClient();
      const result = client.exercises;
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('exercises');
      expect(result).toBe(mockTableRef);
    });
  });

  describe("getCurrentUser", () => {
    test("returns user when authenticated", async () => {
      const mockUser = { id: "user-123", email: "test@example.com" };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      const client = new SupabaseClient();
      const result = await client.getCurrentUser();
      
      expect(result).toBe(mockUser);
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(1);
    });

    test("throws error when getUser fails", async () => {
      const mockError = new Error("Auth error");
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: mockError,
      });
      
      const client = new SupabaseClient();
      
      await expect(client.getCurrentUser()).rejects.toThrow("Auth error");
    });
  });

  describe("onAuthStateChange", () => {
    test("sets up auth state change listener", () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      mockSupabaseClient.auth.onAuthStateChange.mockReturnValue(mockUnsubscribe);
      
      const client = new SupabaseClient();
      const result = client.onAuthStateChange(mockCallback);
      
      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalledWith(mockCallback);
      expect(result).toBe(mockUnsubscribe);
    });
  });

  describe("singleton instance", () => {
    test("exports working singleton instance", () => {
      expect(supabaseClient).toBeInstanceOf(SupabaseClient);
    });

    test("singleton instance works correctly", () => {
      const mockTableRef = { select: jest.fn() };
      mockSupabaseClient.from.mockReturnValue(mockTableRef);
      
      const result = supabaseClient.exercises;
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('exercises');
      expect(result).toBe(mockTableRef);
    });
  });
});