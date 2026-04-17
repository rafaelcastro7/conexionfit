ALTER TABLE public.group_classes
  ADD COLUMN IF NOT EXISTS checkin_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_classes_checkin_token
  ON public.group_classes(checkin_token);