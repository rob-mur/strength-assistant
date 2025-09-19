import {
  initSupabase,
  getSupabaseClient,
  TypedSupabaseClient,
  supabaseClient,
} from "@/lib/data/supabase/index";

describe("Supabase index exports", () => {
  it("should export initSupabase function", () => {
    expect(typeof initSupabase).toBe("function");
  });

  it("should export getSupabaseClient function", () => {
    expect(typeof getSupabaseClient).toBe("function");
  });

  it("should export TypedSupabaseClient", () => {
    expect(TypedSupabaseClient).toBeDefined();
  });

  it("should export supabaseClient", () => {
    expect(supabaseClient).toBeDefined();
  });
});