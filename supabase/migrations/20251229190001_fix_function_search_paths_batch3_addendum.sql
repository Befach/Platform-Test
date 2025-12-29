-- ============================================================================
-- Migration: Fix Function Search Path Vulnerabilities (Batch 3 Addendum)
-- Date: 2025-12-29
-- Purpose: Apply fixes that were added to batch3 file AFTER it was deployed
-- ============================================================================
--
-- CONTEXT: The batch3 migration was applied to the database, then issues were
-- discovered and the batch3 FILE was updated. However, Supabase won't re-run
-- already-applied migrations, so this addendum applies the corrections.
--
-- The batch3 file was updated to include:
--   1. Correct vector(1536) signature for search_documents
--   2. Both get_next_version(TEXT) and get_next_version(TEXT, TEXT)
--
-- This addendum ensures the database receives those fixes.
-- ============================================================================

-- search_documents with correct vector(1536) signature
DO $$ BEGIN
  ALTER FUNCTION public.search_documents(TEXT, extensions.vector(1536), TEXT, TEXT, INTEGER, FLOAT) SET search_path = '';
EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- get_next_version(TEXT) - single parameter version
DO $$ BEGIN
  ALTER FUNCTION public.get_next_version(TEXT) SET search_path = '';
EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify all functions are now secured:
--
-- SELECT
--   p.proname as function_name,
--   pg_get_function_identity_arguments(p.oid) as signature,
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
-- ORDER BY function_name, signature;
-- Expected: All functions show 'SECURE'
