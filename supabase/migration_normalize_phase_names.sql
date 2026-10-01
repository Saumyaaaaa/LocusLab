-- ============================================================================
-- MIGRATION: Safe & Idempotent Phase Name Normalization
-- ============================================================================
-- Normalizes phase names to 'immediateTest', '24h', and '7d' across responses and sessions.
--
-- NOTE FOR TEST DATABASES:
-- If your database contains only pilot or pre-launch test data and you want to
-- avoid resolving potential key collisions manually, the simplest and cleanest
-- option is to purge test data before running this migration:
--
--     DELETE FROM public.participants;  -- (Cascades to sessions, responses, distractor_items)
--
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: Diagnostic Queries (Run these to inspect potential collisions)
-- ----------------------------------------------------------------------------
-- If any rows are returned below, renaming would cause duplicate key errors
-- on the composite unique indexes. Inspect and resolve colliding test rows.

-- 1A. Check for colliding response rows:
WITH potential_response_renames AS (
  SELECT 
    id,
    participant_id,
    CASE 
      WHEN phase IN ('immediate', 'immediatetest') THEN 'immediateTest'
      WHEN phase IN ('test24h', '24hours') THEN '24h'
      WHEN phase IN ('test7d', '7days') THEN '7d'
      ELSE phase
    END AS target_phase,
    list_id,
    item_index,
    COALESCE(intrusion_seq, 0) AS intrusion_seq
  FROM public.responses
)
SELECT 
  participant_id, 
  target_phase, 
  list_id, 
  item_index, 
  intrusion_seq, 
  COUNT(*) AS collision_count
FROM potential_response_renames
GROUP BY participant_id, target_phase, list_id, item_index, intrusion_seq
HAVING COUNT(*) > 1;

-- 1B. Check for colliding session rows:
WITH potential_session_renames AS (
  SELECT 
    id,
    participant_id,
    CASE 
      WHEN phase IN ('immediate', 'immediatetest') THEN 'immediateTest'
      WHEN phase IN ('test24h', '24hours') THEN '24h'
      WHEN phase IN ('test7d', '7days') THEN '7d'
      ELSE phase
    END AS target_phase
  FROM public.sessions
)
SELECT 
  participant_id, 
  target_phase, 
  COUNT(*) AS collision_count
FROM potential_session_renames
GROUP BY participant_id, target_phase
HAVING COUNT(*) > 1;


-- ----------------------------------------------------------------------------
-- STEP 2: Atomic Renames inside a Transaction
-- ----------------------------------------------------------------------------
BEGIN;

-- Temporarily disable the sessions immutability trigger if it exists,
-- so phase column renames are permitted during migration.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_check_sessions_immutability'
  ) THEN
    ALTER TABLE public.sessions DISABLE TRIGGER trigger_check_sessions_immutability;
  END IF;
END $$;

-- 2A. Normalize public.responses phase column
UPDATE public.responses 
SET phase = 'immediateTest' 
WHERE phase IN ('immediate', 'immediatetest');

UPDATE public.responses 
SET phase = '24h' 
WHERE phase IN ('test24h', '24hours');

UPDATE public.responses 
SET phase = '7d' 
WHERE phase IN ('test7d', '7days');

-- 2B. Normalize public.sessions phase column
UPDATE public.sessions 
SET phase = 'immediateTest' 
WHERE phase IN ('immediate', 'immediatetest');

UPDATE public.sessions 
SET phase = '24h' 
WHERE phase IN ('test24h', '24hours');

UPDATE public.sessions 
SET phase = '7d' 
WHERE phase IN ('test7d', '7days');

-- Re-enable the sessions immutability trigger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_check_sessions_immutability'
  ) THEN
    ALTER TABLE public.sessions ENABLE TRIGGER trigger_check_sessions_immutability;
  END IF;
END $$;

COMMIT;


-- ----------------------------------------------------------------------------
-- STEP 3: Idempotent Unique Index Creation
-- ----------------------------------------------------------------------------
-- Authoritative composite key for idempotent upserts on responses:
CREATE UNIQUE INDEX IF NOT EXISTS idx_responses_upsert_key 
  ON public.responses(participant_id, phase, list_id, item_index, intrusion_seq);

-- One session per phase per participant:
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_participant_phase
  ON public.sessions(participant_id, phase);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
