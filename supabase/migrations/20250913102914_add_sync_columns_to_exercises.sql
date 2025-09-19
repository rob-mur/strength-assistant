-- Add updated_at and deleted columns to exercises table for legend-state sync
-- Migration: 20250913102914_add_sync_columns_to_exercises.sql

ALTER TABLE exercises
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN deleted BOOLEAN DEFAULT false;
