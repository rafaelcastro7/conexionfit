UPDATE auth.users
SET encrypted_password = crypt('Admin123!', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email = 'admin@conexionfit.com';

UPDATE auth.users
SET encrypted_password = crypt('Instructor123!', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email = 'instructor@conexionfit.com';

UPDATE auth.users
SET encrypted_password = crypt('Cliente123!', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email = 'cliente@conexionfit.com';