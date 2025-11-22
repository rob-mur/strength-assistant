-- Test script for exercise_schedules table
-- This script validates the database schema with sample data

-- Test data insertion (replace with actual user/exercise IDs)
-- Note: This assumes you have at least one exercise and are authenticated
INSERT INTO exercise_schedules (user_id, exercise_id, day_of_week, order_index) 
VALUES 
  (auth.uid(), (SELECT id FROM exercises LIMIT 1), 1, 0),  -- Monday
  (auth.uid(), (SELECT id FROM exercises LIMIT 1 OFFSET 1), 1, 1),  -- Monday (second exercise)
  (auth.uid(), (SELECT id FROM exercises LIMIT 1), 3, 0);  -- Wednesday

-- Verify data retrieval
SELECT es.*, e.name as exercise_name 
FROM exercise_schedules es 
JOIN exercises e ON es.exercise_id = e.id 
WHERE es.user_id = auth.uid()
ORDER BY es.day_of_week, es.order_index;

-- Test unique constraint (this should fail)
-- INSERT INTO exercise_schedules (user_id, exercise_id, day_of_week) 
-- VALUES (auth.uid(), (SELECT id FROM exercises LIMIT 1), 1);

-- Test day_of_week constraint (this should fail)
-- INSERT INTO exercise_schedules (user_id, exercise_id, day_of_week) 
-- VALUES (auth.uid(), (SELECT id FROM exercises LIMIT 1), 7);

-- Test RLS policy (verify you can only see your own data)
SELECT COUNT(*) as my_schedules FROM exercise_schedules;

-- Test updated_at trigger
UPDATE exercise_schedules 
SET order_index = 2 
WHERE user_id = auth.uid() AND day_of_week = 1 
AND order_index = 1;

-- Verify updated_at was changed
SELECT id, created_at, updated_at, 
       updated_at > created_at as was_updated
FROM exercise_schedules 
WHERE user_id = auth.uid() AND day_of_week = 1;

-- Clean up test data
DELETE FROM exercise_schedules WHERE user_id = auth.uid();