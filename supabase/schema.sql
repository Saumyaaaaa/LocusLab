-- Locus Lab: Database schema with strict Row Level Security (RLS) and cascading foreign keys.
-- Run this script in the Supabase SQL Editor. It is idempotent and non-destructive.

-- 1. Create tables with proper constraints
CREATE TABLE IF NOT EXISTS public.participants (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  code text UNIQUE NOT NULL,
  imagery_score numeric,
  condition_order text,
  palace_list text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  phase text NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  phase text NOT NULL,
  list_id text NOT NULL,
  item_index int NOT NULL,
  typed_answer text, -- Nullable for missed words
  correct boolean NOT NULL,
  response_ms int,
  created_at timestamptz DEFAULT now()
);

-- 2. Non-destructive migrations (ALTER TABLE for Prompt 5 & Prompt 6 analysis columns)
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS palace_mode text;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS tutorial_ms int;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS webgl_fallback bool DEFAULT false;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS flashcard_tab_hidden bool DEFAULT false;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS palace_tab_hidden bool DEFAULT false;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS word_order jsonb;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS study_completed_at timestamptz;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS session_interrupted bool DEFAULT false;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS immediate_test_order text;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS session_completed_at timestamptz;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS cohort text DEFAULT 'main';
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS withdrew_early bool DEFAULT false;

ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS late bool DEFAULT false;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS start_hour int;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS session_interrupted bool DEFAULT false;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS lists_completed int DEFAULT 0;
ALTER TABLE public.sessions ALTER COLUMN started_at SET DEFAULT now();

ALTER TABLE public.responses ADD COLUMN IF NOT EXISTS condition text;
ALTER TABLE public.responses ADD COLUMN IF NOT EXISTS tab_hidden bool DEFAULT false;
ALTER TABLE public.responses ADD COLUMN IF NOT EXISTS intrusion_seq int DEFAULT 0;
ALTER TABLE public.responses ALTER COLUMN typed_answer DROP NOT NULL;

-- 3. Grants strictly limited to authenticated role (no anon data table grants)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.responses TO authenticated;

-- 4. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- 5. Strict RLS Policies for participants table
-- Only authenticated users can insert, and ONLY under their own auth.uid()
DROP POLICY IF EXISTS "Users can insert own participant row" ON public.participants;
DROP POLICY IF EXISTS "Allow participant insert" ON public.participants;
CREATE POLICY "Users can insert own participant row"
  ON public.participants
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can read own participant row" ON public.participants;
CREATE POLICY "Users can read own participant row"
  ON public.participants
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own participant row" ON public.participants;
CREATE POLICY "Users can update own participant row"
  ON public.participants
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own participant row" ON public.participants;
CREATE POLICY "Users can delete own participant row"
  ON public.participants
  FOR DELETE
  TO authenticated
  USING (id = auth.uid());

-- 6. Strict RLS Policies for sessions table
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow sessions insert" ON public.sessions;
CREATE POLICY "Users can insert own sessions"
  ON public.sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (participant_id = auth.uid());

DROP POLICY IF EXISTS "Users can read own sessions" ON public.sessions;
CREATE POLICY "Users can read own sessions"
  ON public.sessions
  FOR SELECT
  TO authenticated
  USING (participant_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
CREATE POLICY "Users can update own sessions"
  ON public.sessions
  FOR UPDATE
  TO authenticated
  USING (participant_id = auth.uid())
  WITH CHECK (participant_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;
CREATE POLICY "Users can delete own sessions"
  ON public.sessions
  FOR DELETE
  TO authenticated
  USING (participant_id = auth.uid());

-- 7. Strict RLS Policies for responses table
DROP POLICY IF EXISTS "Users can insert own responses" ON public.responses;
DROP POLICY IF EXISTS "Allow responses insert" ON public.responses;
CREATE POLICY "Users can insert own responses"
  ON public.responses
  FOR INSERT
  TO authenticated
  WITH CHECK (participant_id = auth.uid());

DROP POLICY IF EXISTS "Users can read own responses" ON public.responses;
CREATE POLICY "Users can read own responses"
  ON public.responses
  FOR SELECT
  TO authenticated
  USING (participant_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own responses" ON public.responses;
CREATE POLICY "Users can update own responses"
  ON public.responses
  FOR UPDATE
  TO authenticated
  USING (participant_id = auth.uid())
  WITH CHECK (participant_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own responses" ON public.responses;
CREATE POLICY "Users can delete own responses"
  ON public.responses
  FOR DELETE
  TO authenticated
  USING (participant_id = auth.uid());

-- 8. Indexes for performant lookup & idempotent upserts
CREATE INDEX IF NOT EXISTS idx_participants_code ON public.participants(code);
CREATE INDEX IF NOT EXISTS idx_sessions_participant ON public.sessions(participant_id);
CREATE INDEX IF NOT EXISTS idx_responses_participant ON public.responses(participant_id);

-- Prompt 6 unique indexes for idempotent response saving without duplicate rows on retry
CREATE UNIQUE INDEX IF NOT EXISTS idx_responses_target_unique 
  ON public.responses(participant_id, phase, list_id, item_index) 
  WHERE item_index >= 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_responses_intrusion_unique 
  ON public.responses(participant_id, phase, list_id, intrusion_seq) 
  WHERE item_index = -1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_responses_upsert_key 
  ON public.responses(participant_id, phase, list_id, item_index, intrusion_seq);

-- One attempt per phase: unique index on (participant_id, phase) for sessions
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_participant_phase
  ON public.sessions(participant_id, phase);

-- 9. Server-authoritative session_completed_at trigger
-- Sets session_completed_at = now() on first update, preserves it permanently against alteration
CREATE OR REPLACE FUNCTION public.set_session_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.session_completed_at IS NULL AND NEW.session_completed_at IS NOT NULL THEN
    NEW.session_completed_at := now();
  ELSIF OLD.session_completed_at IS NOT NULL THEN
    NEW.session_completed_at := OLD.session_completed_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_session_completed_at ON public.participants;
CREATE TRIGGER trigger_set_session_completed_at
  BEFORE UPDATE ON public.participants
  FOR EACH ROW
  EXECUTE FUNCTION public.set_session_completed_at();

-- 10. Force instant PostgREST schema cache reload so new columns are immediately queryable
NOTIFY pgrst, 'reload schema';
