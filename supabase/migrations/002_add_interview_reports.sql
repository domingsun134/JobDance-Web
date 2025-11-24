-- Add report field to interview_sessions table
ALTER TABLE public.interview_sessions 
ADD COLUMN IF NOT EXISTS report JSONB,
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Create index for faster report queries
CREATE INDEX IF NOT EXISTS idx_interview_sessions_created_at ON public.interview_sessions(created_at DESC);

-- Fix RLS policy for interview_sessions to allow INSERT operations
-- The original policy only had USING clause which doesn't work for INSERT
DROP POLICY IF EXISTS "Users can manage their own interview sessions" ON public.interview_sessions;

CREATE POLICY "Users can manage their own interview sessions"
  ON public.interview_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

