-- Create resume_optimizations table
CREATE TABLE IF NOT EXISTS public.resume_optimizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  job_description TEXT NOT NULL,
  optimized_profile_data JSONB NOT NULL,
  optimization_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_resume_optimizations_user_id ON public.resume_optimizations(user_id);

-- Enable RLS
ALTER TABLE public.resume_optimizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own optimizations"
  ON public.resume_optimizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own optimizations"
  ON public.resume_optimizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own optimizations"
  ON public.resume_optimizations FOR DELETE
  USING (auth.uid() = user_id);
