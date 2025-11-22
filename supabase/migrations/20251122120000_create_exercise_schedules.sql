-- Create exercise_schedules table for Weekly Exercise Planner
-- This table stores many-to-many relationships between users, exercises, and days of the week

-- Create exercise_schedules table
CREATE TABLE exercise_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate exercise assignments to same day
  UNIQUE(user_id, exercise_id, day_of_week)
);

-- Enable RLS
ALTER TABLE exercise_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own schedules
CREATE POLICY "Users can manage their own exercise schedules" ON exercise_schedules
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- Performance indexes
CREATE INDEX exercise_schedules_user_day_idx ON exercise_schedules(user_id, day_of_week);
CREATE INDEX exercise_schedules_exercise_idx ON exercise_schedules(exercise_id);
CREATE INDEX exercise_schedules_user_idx ON exercise_schedules(user_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_exercise_schedules_updated_at 
  BEFORE UPDATE ON exercise_schedules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();