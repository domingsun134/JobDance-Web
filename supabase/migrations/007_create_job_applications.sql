-- Create job_applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  position_title TEXT NOT NULL,
  job_url TEXT,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'interviewing', 'offer', 'rejected', 'archived')),
  salary_range TEXT,
  notes TEXT,
  applied_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own job applications"
  ON public.job_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own job applications"
  ON public.job_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job applications"
  ON public.job_applications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job applications"
  ON public.job_applications FOR DELETE
  USING (auth.uid() = user_id);

-- Create simple index
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON public.job_applications(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
