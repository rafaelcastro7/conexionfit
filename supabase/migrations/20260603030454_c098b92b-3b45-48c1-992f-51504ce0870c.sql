CREATE TABLE public.client_prospects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL,
  phone text,
  birth_date date,
  age integer,
  cedula text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_prospects TO authenticated;
GRANT ALL ON public.client_prospects TO service_role;

ALTER TABLE public.client_prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view prospects" ON public.client_prospects
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role) OR public.has_role(auth.uid(),'instructor'::app_role));

CREATE POLICY "Admins can insert prospects" ON public.client_prospects
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Admins can update prospects" ON public.client_prospects
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "Admins can delete prospects" ON public.client_prospects
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER update_client_prospects_updated_at
BEFORE UPDATE ON public.client_prospects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();