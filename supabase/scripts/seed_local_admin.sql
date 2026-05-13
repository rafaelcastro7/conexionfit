-- Plantilla: NO ejecutar tal cual.
-- 1) Abre Studio local http://127.0.0.1:54323 → Authentication → Users → Add user
--    (ej. email admin@local.test y contraseña).
-- 2) Copia el UUID del usuario.
-- 3) Pega y ejecuta en SQL Editor:
--
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('PON_AQUI_EL_UUID'::uuid, 'admin'::public.app_role);
--
-- El trigger de signup ya crea `profiles`; si hiciera falta cédula en perfil, actualízala en la tabla profiles.

SELECT 1;
