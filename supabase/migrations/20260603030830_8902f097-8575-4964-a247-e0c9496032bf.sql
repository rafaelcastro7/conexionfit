ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS medical_notes TEXT;
ALTER TABLE public.client_prospects ADD COLUMN IF NOT EXISTS medical_notes TEXT;