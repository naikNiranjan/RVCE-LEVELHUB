-- Seed file to create an admin user
-- Run this after applying the migration

-- Note: Replace 'admin@example.com' with your desired admin email
-- and 'secure_password' with a strong password

-- First, sign up the admin user through your app or use Supabase Auth
-- Then manually update the role to admin:

-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'admin@example.com';

-- Or if you want to create the admin user directly (less secure):
-- INSERT INTO auth.users (
--   id,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   created_at,
--   updated_at
-- ) VALUES (
--   gen_random_uuid(),
--   'admin@example.com',
--   crypt('secure_password', gen_salt('bf')),
--   NOW(),
--   NOW(),
--   NOW()
-- );