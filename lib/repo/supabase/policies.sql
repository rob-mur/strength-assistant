-- Exercise Set Logging: Row Level Security Policies
--
-- Purpose: Ensure users can only access their own workout data
-- Security: Prevents cross-user data leaks and unauthorized access

-- Enable Row Level Security on workout_sets table
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own workout sets
CREATE POLICY "Users can view their own workout sets"
ON workout_sets FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own workout sets
CREATE POLICY "Users can insert their own workout sets"
ON workout_sets FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own workout sets
CREATE POLICY "Users can update their own workout sets"
ON workout_sets FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own workout sets
CREATE POLICY "Users can delete their own workout sets"
ON workout_sets FOR DELETE
USING (auth.uid() = user_id);

-- Additional safety policy: Prevent modification of user_id after creation
-- This ensures users cannot reassign sets to other users
CREATE POLICY "Prevent user_id modification"
ON workout_sets FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  auth.uid() = OLD.user_id AND 
  user_id = OLD.user_id
);

-- Add comments for policy documentation
COMMENT ON POLICY "Users can view their own workout sets" ON workout_sets IS 'Allows users to view only their own workout set data';
COMMENT ON POLICY "Users can insert their own workout sets" ON workout_sets IS 'Allows users to create new workout sets for themselves only';
COMMENT ON POLICY "Users can update their own workout sets" ON workout_sets IS 'Allows users to modify their own workout sets';
COMMENT ON POLICY "Users can delete their own workout sets" ON workout_sets IS 'Allows users to delete their own workout sets';
COMMENT ON POLICY "Prevent user_id modification" ON workout_sets IS 'Security policy preventing assignment of sets to other users';