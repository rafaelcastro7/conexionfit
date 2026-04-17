ALTER TABLE public.group_classes
  ADD COLUMN IF NOT EXISTS recurrence_group_id uuid,
  ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_group_classes_recurrence_group_id
  ON public.group_classes(recurrence_group_id);