import type {
  Database,
  ExerciseRow,
  ExerciseInsert,
  ExerciseUpdate,
  User,
} from "@/lib/models/supabase";

describe("Supabase types", () => {
  it("should export Database interface", () => {
    // Create a mock object that conforms to the Database interface
    const mockDatabase: Database = {
      public: {
        Tables: {
          exercises: {
            Row: {} as ExerciseRow,
            Insert: {} as ExerciseInsert,
            Update: {} as ExerciseUpdate,
          },
        },
        Views: {},
        Functions: {},
        Enums: {},
        CompositeTypes: {},
      },
    };

    expect(mockDatabase).toBeDefined();
    expect(mockDatabase.public).toBeDefined();
  });

  it("should export User interface", () => {
    const mockUser: User = {
      id: "test-id",
      aud: "authenticated",
    };

    expect(mockUser).toBeDefined();
    expect(mockUser.id).toBe("test-id");
  });
});