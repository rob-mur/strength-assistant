-- Add sync columns required for legend-state synchronization to exercises table
-- These columns are needed for local-first storage with proper conflict resolution

-- Check if columns don't already exist before adding them
DO $$ 
BEGIN 
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='exercises' AND column_name='created_at') THEN
        ALTER TABLE exercises ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='exercises' AND column_name='updated_at') THEN
        ALTER TABLE exercises ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Add deleted column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='exercises' AND column_name='deleted') THEN
        ALTER TABLE exercises ADD COLUMN deleted BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create or replace trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_exercises_updated_at ON exercises;
CREATE TRIGGER update_exercises_updated_at
    BEFORE UPDATE ON exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Set initial timestamps for existing records if they have NULL values
UPDATE exercises 
SET created_at = NOW(), updated_at = NOW() 
WHERE created_at IS NULL OR updated_at IS NULL;