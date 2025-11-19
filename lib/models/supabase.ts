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
          updated_at: string;
          deleted: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
          deleted?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
          deleted?: boolean;
        };
      };
      workout_sets: {
        Row: {
          id: string;
          exercise_id: string;
          user_id: string;
          session_date: string;
          weight: number;
          repetitions: number;
          rpe: number;
          set_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          exercise_id: string;
          user_id: string;
          session_date: string;
          weight: number;
          repetitions: number;
          rpe: number;
          set_order: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          exercise_id?: string;
          user_id?: string;
          session_date?: string;
          weight?: number;
          repetitions?: number;
          rpe?: number;
          set_order?: number;
          created_at?: string;
          updated_at?: string;
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
export type ExerciseRow = Database["public"]["Tables"]["exercises"]["Row"];
export type ExerciseInsert =
  Database["public"]["Tables"]["exercises"]["Insert"];
export type ExerciseUpdate =
  Database["public"]["Tables"]["exercises"]["Update"];

export type WorkoutSetRow = Database["public"]["Tables"]["workout_sets"]["Row"];
export type WorkoutSetInsert = Database["public"]["Tables"]["workout_sets"]["Insert"];
export type WorkoutSetUpdate = Database["public"]["Tables"]["workout_sets"]["Update"];

// User type for store (from Supabase Auth)
export interface User {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  aud: string;
  created_at?: string;
}
