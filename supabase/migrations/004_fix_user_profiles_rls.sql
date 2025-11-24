-- Fix RLS policy for user_profiles to allow trigger-based inserts
-- The issue is that SECURITY DEFINER functions still need to pass RLS policies
-- The best solution is to make the policy allow the trigger to insert

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

-- Create a policy that allows inserts when:
-- 1. User is inserting their own profile (normal case)
-- 2. The id matches a user in auth.users (for trigger-based inserts)
-- The trigger function handle_new_user() is SECURITY DEFINER, which means it runs
-- with elevated privileges, but RLS policies still apply. However, during the trigger
-- execution, the NEW.id will exist in auth.users, so we can check for that.
CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (
    -- Normal case: user inserting their own profile
    auth.uid() = id 
    OR 
    -- Trigger case: allow if the id exists in auth.users (the trigger runs AFTER user creation)
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = user_profiles.id)
  );

