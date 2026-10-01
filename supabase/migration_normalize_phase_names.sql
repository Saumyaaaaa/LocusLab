-- One-time migration to normalize phase names to 'immediateTest', '24h', and '7d'
-- across both public.responses and public.sessions tables.

-- 1. Normalize public.responses phase column
UPDATE public.responses 
SET phase = 'immediateTest' 
WHERE phase IN ('immediate', 'immediatetest');

UPDATE public.responses 
SET phase = '24h' 
WHERE phase IN ('test24h', '24hours');

UPDATE public.responses 
SET phase = '7d' 
WHERE phase IN ('test7d', '7days');

-- 2. Normalize public.sessions phase column
UPDATE public.sessions 
SET phase = 'immediateTest' 
WHERE phase IN ('immediate', 'immediatetest');

UPDATE public.sessions 
SET phase = '24h' 
WHERE phase IN ('test24h', '24hours');

UPDATE public.sessions 
SET phase = '7d' 
WHERE phase IN ('test7d', '7days');

-- 3. Ensure authoritative composite unique index exists for idempotent upserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_responses_upsert_key 
  ON public.responses(participant_id, phase, list_id, item_index, intrusion_seq);
