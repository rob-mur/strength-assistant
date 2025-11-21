-- Exercise Set Logging: Database Indexes for Performance
--
-- Purpose: Optimize query performance for common access patterns
-- Target Performance: <200ms for session queries, <500ms for exercise history

-- Index for session-based queries (most common pattern)
-- Supports: SELECT * FROM workout_sets WHERE user_id = ? AND session_date = ?
CREATE INDEX idx_workout_sets_session 
ON workout_sets(user_id, session_date);

-- Index for exercise history queries
-- Supports: SELECT * FROM workout_sets WHERE exercise_id = ?
CREATE INDEX idx_workout_sets_exercise 
ON workout_sets(exercise_id);

-- Index for chronological ordering within sessions
-- Supports: ORDER BY created_at queries and set_order sorting
CREATE INDEX idx_workout_sets_created_at 
ON workout_sets(created_at);

-- Composite index for exercise + user queries (common for progression tracking)
-- Supports: SELECT * FROM workout_sets WHERE user_id = ? AND exercise_id = ?
CREATE INDEX idx_workout_sets_user_exercise 
ON workout_sets(user_id, exercise_id, created_at DESC);

-- Index for set ordering within sessions
-- Supports: ORDER BY set_order within session date queries
CREATE INDEX idx_workout_sets_session_order 
ON workout_sets(user_id, session_date, set_order);

-- Add comments for index documentation
COMMENT ON INDEX idx_workout_sets_session IS 'Optimizes session-based queries for daily workout views';
COMMENT ON INDEX idx_workout_sets_exercise IS 'Optimizes exercise history and progression queries';
COMMENT ON INDEX idx_workout_sets_created_at IS 'Supports chronological ordering of sets';
COMMENT ON INDEX idx_workout_sets_user_exercise IS 'Optimizes user progression tracking by exercise';
COMMENT ON INDEX idx_workout_sets_session_order IS 'Ensures fast ordering within workout sessions';