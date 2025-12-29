-- ============================================================================
-- Migration: Fix Function Search Path Vulnerabilities (Batch 3)
-- Date: 2025-12-29
-- Purpose: Set search_path = '' on 7 remaining database functions for security
-- Description: Functions without immutable search_path are vulnerable to
--              search path injection attacks. This migration fixes all
--              remaining vulnerable functions identified by Supabase linter.
-- ============================================================================

-- ============================================================================
-- SECURITY CONTEXT
-- ============================================================================
-- Setting search_path = '' prevents malicious users from creating tables/functions
-- in other schemas to intercept function calls and gain elevated privileges.
-- This is a recommended PostgreSQL security best practice.
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- Uses DO blocks to handle non-existent functions gracefully (no IF EXISTS for ALTER FUNCTION)

-- ============================================================================
-- SECTION 1: KNOWLEDGE BASE FUNCTIONS (from 20251203120000_create_knowledge_base.sql)
-- ============================================================================

-- get_knowledge_base_stats - Returns document statistics for a team
DO $$ BEGIN
  ALTER FUNCTION public.get_knowledge_base_stats(TEXT) SET search_path = '';
EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- search_documents - Vector similarity search for documents
DO $$ BEGIN
  ALTER FUNCTION public.search_documents(TEXT, extensions.vector, TEXT, TEXT, INTEGER, FLOAT) SET search_path = '';
EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- update_knowledge_updated_at - Trigger function for updated_at timestamps
DO $$ BEGIN
  ALTER FUNCTION public.update_knowledge_updated_at() SET search_path = '';
EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- ============================================================================
-- SECTION 2: INTEGRATION FUNCTIONS (from 20251203100000_create_mcp_gateway_integrations.sql)
-- ============================================================================

-- get_team_integration_summary - Returns integration status summary for a team
DO $$ BEGIN
  ALTER FUNCTION public.get_team_integration_summary(TEXT) SET search_path = '';
EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- update_integration_updated_at - Trigger function for updated_at timestamps
DO $$ BEGIN
  ALTER FUNCTION public.update_integration_updated_at() SET search_path = '';
EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- ============================================================================
-- SECTION 3: STRATEGY FUNCTION (from 20251202162950_add_strategy_reorder_function.sql)
-- ============================================================================

-- reorder_strategy_siblings - Atomic reordering for strategy tree drag-drop
DO $$ BEGIN
  ALTER FUNCTION public.reorder_strategy_siblings(TEXT, TEXT, INTEGER) SET search_path = '';
EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- ============================================================================
-- SECTION 4: VERSION FUNCTION (from 20251222120000_add_missing_phase_columns.sql)
-- ============================================================================

-- get_next_version - Returns next version number for enhancement chains
DO $$ BEGIN
  ALTER FUNCTION public.get_next_version(TEXT, TEXT) SET search_path = '';
EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- - Fixed 7 functions with search_path = '' for security
-- - Uses DO blocks with exception handling for safe execution
-- - Addresses all function_search_path_mutable warnings from Supabase linter
--
-- Functions fixed:
--   1. get_knowledge_base_stats(TEXT)
--   2. search_documents(TEXT, vector, TEXT, TEXT, INTEGER, FLOAT)
--   3. update_knowledge_updated_at()
--   4. get_team_integration_summary(TEXT)
--   5. update_integration_updated_at()
--   6. reorder_strategy_siblings(TEXT, TEXT, INTEGER)
--   7. get_next_version(TEXT, TEXT)
-- ============================================================================

-- ============================================================================
-- VERIFICATION QUERY (run after migration to confirm)
-- ============================================================================
-- SELECT
--   p.proname as function_name,
--   CASE
--     WHEN proconfig IS NULL THEN 'VULNERABLE'
--     WHEN array_to_string(proconfig, ',') LIKE '%search_path=%' THEN 'SECURE'
--     ELSE 'VULNERABLE'
--   END as status
-- FROM pg_proc p
-- INNER JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
--   AND p.proname IN (
--     'get_knowledge_base_stats', 'search_documents', 'update_knowledge_updated_at',
--     'get_team_integration_summary', 'update_integration_updated_at',
--     'reorder_strategy_siblings', 'get_next_version'
--   )
-- ORDER BY function_name;
-- Expected: All functions show 'SECURE'
