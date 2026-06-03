
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_codigo_single_cedula() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_client_codigo() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_cedula() FROM PUBLIC, anon, authenticated;

-- Helpers RLS: solo authenticated los necesita (para evaluación de policies). Revocar de anon.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_cedula(uuid) FROM anon;

-- RPCs de portal/admin: solo authenticated. Revocar de anon explícitamente.
REVOKE EXECUTE ON FUNCTION public.get_reservations_by_cedula(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_waitlist_by_cedula(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_attendance_by_cedula(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_client_by_cedula(text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_class_counts(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_public_classes(date) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_public_class(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_reservation(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.join_waitlist(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.checkin_via_qr(uuid, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_staging_batch(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.apply_staging_batch(uuid) FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_cedula(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_reservations_by_cedula(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_waitlist_by_cedula(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_attendance_by_cedula(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_by_cedula(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_class_counts(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_classes(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_class(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_reservation(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_waitlist(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.checkin_via_qr(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_staging_batch(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_staging_batch(uuid) TO authenticated;
