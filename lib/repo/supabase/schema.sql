-- Exercise Set Logging: Workout Sets Table Schema
-- 
-- Purpose: Core table for storing individual workout set data
-- Features: Weight, repetitions, RPE with proper constraints and validation
-- Dependencies: Requires existing exercises table and auth.users table

-- Create the workout_sets table with proper constraints
CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_date DATE NOT NULL,
  weight DECIMAL(6,2) NOT NULL CHECK (weight > 0 AND weight <= 2000),
  repetitions INTEGER NOT NULL CHECK (repetitions >= 1 AND repetitions <= 100),
  rpe DECIMAL(2,1) NOT NULL CHECK (rpe >= 1.0 AND rpe <= 10.0 AND rpe * 2 = FLOOR(rpe * 2)),
  set_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workout_sets_updated_at 
  BEFORE UPDATE ON workout_sets 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment documentation
COMMENT ON TABLE workout_sets IS 'Stores individual workout set data with weight, repetitions, and RPE ratings';
COMMENT ON COLUMN workout_sets.weight IS 'Weight used in kg or lbs (0.1-2000 range)';
COMMENT ON COLUMN workout_sets.repetitions IS 'Number of repetitions performed (1-100 range)';
COMMENT ON COLUMN workout_sets.rpe IS 'Rate of Perceived Exertion (1.0-10.0 in 0.5 increments)';
COMMENT ON COLUMN workout_sets.set_order IS 'Order of set within the workout session';
COMMENT ON COLUMN workout_sets.session_date IS 'Date of workout session (YYYY-MM-DD)';