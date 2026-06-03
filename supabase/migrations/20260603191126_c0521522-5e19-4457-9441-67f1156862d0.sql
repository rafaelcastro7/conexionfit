
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND cedula IS NULL);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.protect_profile_cedula()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.cedula := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.cedula := OLD.cedula;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_cedula_trg ON public.profiles;
CREATE TRIGGER protect_profile_cedula_trg
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_cedula();
