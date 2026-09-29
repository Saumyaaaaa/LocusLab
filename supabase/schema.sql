-- Locus Lab: Database schema with Row Level Security (RLS) and cascading foreign keys
-- Copy and paste this complete script into your Supabase SQL Editor and click RUN.

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
  typed_answer text NOT NULL,
  correct boolean NOT NULL,
  response_ms int,
  created_at timestamptz DEFAULT now()
);

-- 2. Explicit schema and table grants for anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.participants TO anon, authenticated;
GRANT ALL ON TABLE public.sessions TO anon, authenticated;
GRANT ALL ON TABLE public.responses TO anon, authenticated;

-- 3. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for participants table
-- INSERT: Anyone with an anonymous session can create their participant row
DROP POLICY IF EXISTS "Users can insert own participant row" ON public.participants;
DROP POLICY IF EXISTS "Allow participant insert" ON public.participants;
CREATE POLICY "Allow participant insert"
  ON public.participants
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- SELECT: Users can only read their own participant data
DROP POLICY IF EXISTS "Users can read own participant row" ON public.participants;
CREATE POLICY "Users can read own participant row"
  ON public.participants
  FOR SELECT
  TO authenticated, anon
  USING (id = auth.uid());

-- UPDATE: Users can only update their own participant row (e.g. imagery score)
DROP POLICY IF EXISTS "Users can update own participant row" ON public.participants;
CREATE POLICY "Users can update own participant row"
  ON public.participants
  FOR UPDATE
  TO authenticated, anon
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- DELETE: Users can only delete their own participant row
DROP POLICY IF EXISTS "Users can delete own participant row" ON public.participants;
CREATE POLICY "Users can delete own participant row"
  ON public.participants
  FOR DELETE
  TO authenticated, anon
  USING (id = auth.uid());

-- 5. RLS Policies for sessions table
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow sessions insert" ON public.sessions;
CREATE POLICY "Allow sessions insert"
  ON public.sessions
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (participant_id = auth.uid() OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can read own sessions" ON public.sessions;
CREATE POLICY "Users can read own sessions"
  ON public.sessions
  FOR SELECT
  TO authenticated, anon
  USING (participant_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
CREATE POLICY "Users can update own sessions"
  ON public.sessions
  FOR UPDATE
  TO authenticated, anon
  USING (participant_id = auth.uid())
  WITH CHECK (participant_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;
CREATE POLICY "Users can delete own sessions"
  ON public.sessions
  FOR DELETE
  TO authenticated, anon
  USING (participant_id = auth.uid());

-- 6. RLS Policies for responses table
DROP POLICY IF EXISTS "Users can insert own responses" ON public.responses;
DROP POLICY IF EXISTS "Allow responses insert" ON public.responses;
CREATE POLICY "Allow responses insert"
  ON public.responses
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (participant_id = auth.uid() OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can read own responses" ON public.responses;
CREATE POLICY "Users can read own responses"
  ON public.responses
  FOR SELECT
  TO authenticated, anon
  USING (participant_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own responses" ON public.responses;
CREATE POLICY "Users can update own responses"
  ON public.responses
  FOR UPDATE
  TO authenticated, anon
  USING (participant_id = auth.uid())
  WITH CHECK (participant_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own responses" ON public.responses;
CREATE POLICY "Users can delete own responses"
  ON public.responses
  FOR DELETE
  TO authenticated, anon
  USING (participant_id = auth.uid());

-- 7. Indexes for performant lookup
CREATE INDEX IF NOT EXISTS idx_participants_code ON public.participants(code);
CREATE INDEX IF NOT EXISTS idx_sessions_participant ON public.sessions(participant_id);
CREATE INDEX IF NOT EXISTS idx_responses_participant ON public.responses(participant_id);
