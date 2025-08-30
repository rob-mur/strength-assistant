-- Create exercises table with user isolation matching Firebase structure
-- Migration: 20250830160000_create_exercises_table.sql

-- Create the exercises table
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only access their own exercises
CREATE POLICY "Users can manage their own exercises" ON exercises
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create index for performance on user queries
CREATE INDEX exercises_user_id_idx ON exercises(user_id);

-- Create index for performance on created_at for ordering
CREATE INDEX exercises_created_at_idx ON exercises(created_at DESC);