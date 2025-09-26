/**
 * Tests for syncConfig loadInitialData function error handling
 *
 * This test file specifically covers the silent catch block in the
 * loadInitialData function that was missing test coverage.
 */

import { configureSyncEngine } from "@/lib/data/sync/syncConfig";

// Mock the dependencies
jest.mock("@/lib/data/store", () => ({
  exercises$: {
    set: jest.fn(),
  },
  user$: {
    set: jest.fn(),
  },
}));

jest.mock("@/lib/data/supabase/SupabaseClient", () => ({
  supabaseClient: {
    getCurrentUser: jest.fn(),
    getSupabaseClient: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
}));

describe("syncConfig loadInitialData error handling", () => {
  let mockGetCurrentUser: jest.Mock;
  let mockGetSupabaseClient: jest.Mock;
  let mockOnAuthStateChange: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    const { supabaseClient } = require("@/lib/data/supabase/SupabaseClient");
    mockGetCurrentUser = supabaseClient.getCurrentUser;
    mockGetSupabaseClient = supabaseClient.getSupabaseClient;
    mockOnAuthStateChange = supabaseClient.onAuthStateChange;

    // Default successful mock implementation
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  it("handles error when getCurrentUser throws in loadInitialData", async () => {
    // Mock getCurrentUser to throw an error
    mockGetCurrentUser.mockRejectedValue(
      new Error("Failed to get current user"),
    );

    // This should not throw due to the silent catch block
    expect(() => configureSyncEngine()).not.toThrow();

    // Wait a brief moment for async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  it("handles error when database query fails in loadInitialData", async () => {
    // Mock successful user but failing database query that throws on error check
    mockGetCurrentUser.mockResolvedValue({ id: "test-user-id" });

    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: new Error("Database query failed"),
        }),
      }),
    });

    mockGetSupabaseClient.mockReturnValue({
      from: mockFrom,
    });

    // Configure sync engine which will call loadInitialData
    configureSyncEngine();

    // Wait for async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  it("handles error when getSupabaseClient throws in loadInitialData", async () => {
    // Mock successful user but failing client access
    mockGetCurrentUser.mockResolvedValue({ id: "test-user-id" });
    mockGetSupabaseClient.mockImplementation(() => {
      throw new Error("Failed to get Supabase client");
    });

    // This should not throw due to the silent catch block
    expect(() => configureSyncEngine()).not.toThrow();

    // Wait a brief moment for async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  it("handles network errors gracefully in loadInitialData", async () => {
    // Mock successful user but network error during query
    mockGetCurrentUser.mockResolvedValue({ id: "test-user-id" });

    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockRejectedValue(new Error("Network error")),
      }),
    });

    mockGetSupabaseClient.mockReturnValue({
      from: mockFrom,
    });

    // This should not throw due to the silent catch block
    expect(() => configureSyncEngine()).not.toThrow();

    // Wait a brief moment for async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

  it("handles error when exercises$.set throws in loadInitialData", async () => {
    // Mock successful user and successful database query
    mockGetCurrentUser.mockResolvedValue({ id: "test-user-id" });

    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ id: "1", name: "Test Exercise" }],
          error: null,
        }),
      }),
    });

    mockGetSupabaseClient.mockReturnValue({
      from: mockFrom,
    });

    // Mock exercises$.set to throw an error
    const { exercises$ } = require("@/lib/data/store");
    exercises$.set.mockImplementation(() => {
      throw new Error("Failed to set exercises");
    });

    // This should not throw due to the silent catch block
    expect(() => configureSyncEngine()).not.toThrow();

    // Wait for async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
});
