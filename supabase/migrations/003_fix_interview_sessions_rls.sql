-- Fix RLS policy for interview_sessions to allow INSERT operations
-- The original policy only had USING clause which doesn't work for INSERT
-- This migration adds WITH CHECK clause to properly handle INSERT operations

DROP POLICY IF EXISTS "Users can manage their own interview sessions" ON public.interview_sessions;

CREATE POLICY "Users can manage their own interview sessions"
  ON public.interview_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

