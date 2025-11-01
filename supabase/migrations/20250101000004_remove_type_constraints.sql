-- Remove restrictive CHECK constraints to allow flexible types
-- The app uses custom types like "User-Facing" which aren't in the original constraint

-- Remove type check constraint from features table
ALTER TABLE features DROP CONSTRAINT IF EXISTS features_type_check;

-- Remove timeline check constraint (if too restrictive)
ALTER TABLE timeline_items DROP CONSTRAINT IF EXISTS timeline_items_timeline_check;

-- Remove difficulty check constraint (if too restrictive)
ALTER TABLE timeline_items DROP CONSTRAINT IF EXISTS timeline_items_difficulty_check;

-- Remove relationship_type check constraint (if too restrictive)
ALTER TABLE linked_items DROP CONSTRAINT IF EXISTS linked_items_relationship_type_check;

-- Remove direction check constraint (if too restrictive)
ALTER TABLE linked_items DROP CONSTRAINT IF EXISTS linked_items_direction_check;

-- Now type, timeline, difficulty, etc. can be ANY text value
-- This gives your app full flexibility
