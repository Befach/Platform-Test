-- Make linked_items.id auto-generate so the app doesn't need to provide it
-- The app tracks relationships but doesn't maintain IDs for them

-- Create a function to generate text-based IDs like the app does (timestamp + random)
CREATE OR REPLACE FUNCTION generate_text_id()
RETURNS TEXT AS $$
BEGIN
  RETURN FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000)::TEXT || FLOOR(RANDOM() * 1000000)::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Set default for linked_items.id (for INSERTs without explicit ID)
ALTER TABLE linked_items ALTER COLUMN id SET DEFAULT generate_text_id();

-- Also set defaults for features and timeline_items to be safe
ALTER TABLE features ALTER COLUMN id SET DEFAULT generate_text_id();
ALTER TABLE timeline_items ALTER COLUMN id SET DEFAULT generate_text_id();
