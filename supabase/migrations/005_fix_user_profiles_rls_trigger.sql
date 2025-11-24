-- Fix RLS policy issue for user_profiles insert
-- The problem: When email confirmation is required, users aren't authenticated yet
-- when the trigger runs, so auth.uid() is null and RLS blocks the insert
-- Also, manual profile creation after registration fails due to RLS

-- Solution: Create a helper function to check if user exists in auth.users
-- This function needs SECURITY DEFINER to access auth.users table
CREATE OR REPLACE FUNCTION public.user_exists_in_auth(user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE auth.users.id = user_id
  );
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.user_exists_in_auth(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_exists_in_auth(UUID) TO anon;

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

-- Create a permissive policy that allows inserts when:
-- 1. User is authenticated and inserting their own profile, OR
-- 2. The id exists in auth.users (covers trigger inserts and post-confirmation manual inserts)
CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (
    -- Case 1: Authenticated user inserting their own profile
    (auth.uid() IS NOT NULL AND auth.uid() = id)
    OR
    -- Case 2: Allow if the id exists in auth.users (using helper function)
    -- This covers:
    -- - Trigger-based inserts (trigger runs AFTER user creation in auth.users)
    -- - Manual inserts after email confirmation (user exists in auth.users)
    -- In WITH CHECK, 'id' refers to the column value being inserted (the NEW row)
    public.user_exists_in_auth(id)
  );

-- Also ensure the trigger function is properly set up
-- SECURITY DEFINER allows it to run with elevated privileges
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, onboarding_completed)
  VALUES (NEW.id, NEW.email, false)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;
