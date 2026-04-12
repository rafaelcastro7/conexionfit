
-- Group classes table
CREATE TABLE public.group_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  program TEXT NOT NULL,
  instructor TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  class_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_capacity INTEGER NOT NULL DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.group_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view group classes" ON public.group_classes FOR SELECT USING (true);
CREATE POLICY "Admins can insert group classes" ON public.group_classes FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update group classes" ON public.group_classes FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete group classes" ON public.group_classes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_group_classes_updated_at BEFORE UPDATE ON public.group_classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reservations table
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.group_classes(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_cedula TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reservations" ON public.reservations FOR SELECT USING (true);
CREATE POLICY "Anyone can create reservations" ON public.reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update reservations" ON public.reservations FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete reservations" ON public.reservations FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Waitlist table
CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.group_classes(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_cedula TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view waitlist" ON public.waitlist FOR SELECT USING (true);
CREATE POLICY "Anyone can join waitlist" ON public.waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update waitlist" ON public.waitlist FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete waitlist" ON public.waitlist FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
