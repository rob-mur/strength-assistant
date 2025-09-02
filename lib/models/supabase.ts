/**
 * Supabase Database Schema Types
 * Generated based on the database migration: 20250830160000_create_exercises_table.sql
 */

export interface Database {
  public: {
    Tables: {
      exercises: {
        Row: {
          id: string;
          name: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          user_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Export table types for convenience
export type ExerciseRow = Database['public']['Tables']['exercises']['Row'];
export type ExerciseInsert = Database['public']['Tables']['exercises']['Insert'];
export type ExerciseUpdate = Database['public']['Tables']['exercises']['Update'];

// User type for store (from Supabase Auth)
export interface User {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
  aud: string;
  created_at?: string;
}