-- Migration: Add Strategy Customization Fields
-- Description: Add user_stories, case_studies, user_examples to product_strategies
-- These fields are primarily used at the pillar level to provide context

-- Add new columns to product_strategies
ALTER TABLE product_strategies
ADD COLUMN IF NOT EXISTS user_stories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS user_examples TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS case_studies TEXT[] DEFAULT '{}';

-- Add comments for documentation
COMMENT ON COLUMN product_strategies.user_stories IS 'User story examples demonstrating value (primarily for pillars)';
COMMENT ON COLUMN product_strategies.user_examples IS 'Real user examples and use cases';
COMMENT ON COLUMN product_strategies.case_studies IS 'Reference case studies for context and inspiration';

-- Note: alignment_strength already exists on work_item_strategies table
-- (Added in migration 20251201130000_create_product_strategies.sql)
