-- Locus Lab: Database schema with Row Level Security (RLS) and cascading foreign keys
-- Run this script once in your Supabase SQL Editor.

-- 1. Create tables
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

-- 2. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for participants table
-- Users can only insert, select, update, and delete their own participant row
CREATE POLICY "Users can insert own participant row"
  ON public.participants
  FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can read own participant row"
  ON public.participants
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own participant row"
  ON public.participants
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can delete own participant row"
  ON public.participants
  FOR DELETE
  USING (id = auth.uid());

-- 4. RLS Policies for sessions table
CREATE POLICY "Users can insert own sessions"
  ON public.sessions
  FOR INSERT
  WITH CHECK (participant_id = auth.uid());

CREATE POLICY "Users can read own sessions"
  ON public.sessions
  FOR SELECT
  USING (participant_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON public.sessions
  FOR UPDATE
  USING (participant_id = auth.uid())
  WITH CHECK (participant_id = auth.uid());

CREATE POLICY "Users can delete own sessions"
  ON public.sessions
  FOR DELETE
  USING (participant_id = auth.uid());

-- 5. RLS Policies for responses table
CREATE POLICY "Users can insert own responses"
  ON public.responses
  FOR INSERT
  WITH CHECK (participant_id = auth.uid());

CREATE POLICY "Users can read own responses"
  ON public.responses
  FOR SELECT
  USING (participant_id = auth.uid());

CREATE POLICY "Users can update own responses"
  ON public.responses
  FOR UPDATE
  USING (participant_id = auth.uid())
  WITH CHECK (participant_id = auth.uid());

CREATE POLICY "Users can delete own responses"
  ON public.responses
  FOR DELETE
  USING (participant_id = auth.uid());

-- 6. Indexes for performant lookup by participant and code
CREATE INDEX IF NOT EXISTS idx_participants_code ON public.participants(code);
CREATE INDEX IF NOT EXISTS idx_sessions_participant ON public.sessions(participant_id);
CREATE INDEX IF NOT EXISTS idx_responses_participant ON public.responses(participant_id);
