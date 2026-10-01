-- Non-destructive migration for user-chosen study duration, distractor logging, and free-walk tracking.

-- 1. Participants columns
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS study_seconds int DEFAULT 240;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS tutorial_skipped bool DEFAULT false;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS palace_used_freewalk bool DEFAULT false;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS distractor_attempted int DEFAULT 0;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS distractor_correct int DEFAULT 0;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS distractor_accuracy numeric;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS distractor_median_ms int;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS distractor_valid bool;
ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS label_toggled_off bool DEFAULT false;

-- 2. Distractor items table (fine-grained arithmetic response logging)
CREATE TABLE IF NOT EXISTS public.distractor_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  item_index int NOT NULL,
  problem text NOT NULL,
  answer int NOT NULL,
  correct bool NOT NULL,
  response_ms int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for participant querying and deletion cascade
CREATE INDEX IF NOT EXISTS idx_distractor_items_participant ON public.distractor_items(participant_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.distractor_items TO authenticated;

-- 3. Strict Row Level Security (RLS) on distractor_items (TO authenticated)
ALTER TABLE public.distractor_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own distractor items" ON public.distractor_items;
CREATE POLICY "Users can insert own distractor items"
  ON public.distractor_items
  FOR INSERT
  TO authenticated
  WITH CHECK (participant_id = auth.uid());

DROP POLICY IF EXISTS "Users can read own distractor items" ON public.distractor_items;
CREATE POLICY "Users can read own distractor items"
  ON public.distractor_items
  FOR SELECT
  TO authenticated
  USING (participant_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own distractor items" ON public.distractor_items;
CREATE POLICY "Users can update own distractor items"
  ON public.distractor_items
  FOR UPDATE
  TO authenticated
  USING (participant_id = auth.uid())
  WITH CHECK (participant_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own distractor items" ON public.distractor_items;
CREATE POLICY "Users can delete own distractor items"
  ON public.distractor_items
  FOR DELETE
  TO authenticated
  USING (participant_id = auth.uid());

-- 4. Update immutability trigger to protect study_seconds once set
CREATE OR REPLACE FUNCTION public.check_participants_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'Cannot modify immutable column id';
  END IF;
  IF NEW.code <> OLD.code THEN
    RAISE EXCEPTION 'Cannot modify immutable column code';
  END IF;
  IF NEW.created_at <> OLD.created_at THEN
    RAISE EXCEPTION 'Cannot modify immutable column created_at';
  END IF;
  IF (OLD.condition_order IS NOT NULL AND NEW.condition_order IS DISTINCT FROM OLD.condition_order) THEN
    RAISE EXCEPTION 'Cannot modify immutable column condition_order';
  END IF;
  IF (OLD.palace_list IS NOT NULL AND NEW.palace_list IS DISTINCT FROM OLD.palace_list) THEN
    RAISE EXCEPTION 'Cannot modify immutable column palace_list';
  END IF;
  IF (OLD.immediate_test_order IS NOT NULL AND NEW.immediate_test_order IS DISTINCT FROM OLD.immediate_test_order) THEN
    RAISE EXCEPTION 'Cannot modify immutable column immediate_test_order';
  END IF;
  IF (OLD.word_order IS NOT NULL AND NEW.word_order::text IS DISTINCT FROM OLD.word_order::text) THEN
    RAISE EXCEPTION 'Cannot modify immutable column word_order';
  END IF;
  IF (OLD.cohort IS NOT NULL AND NEW.cohort IS DISTINCT FROM OLD.cohort) THEN
    RAISE EXCEPTION 'Cannot modify immutable column cohort';
  END IF;
  IF (OLD.study_seconds IS NOT NULL AND NEW.study_seconds IS DISTINCT FROM OLD.study_seconds) THEN
    RAISE EXCEPTION 'Cannot modify immutable column study_seconds';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Notify PostgREST schema cache to reload
NOTIFY pgrst, 'reload schema';
