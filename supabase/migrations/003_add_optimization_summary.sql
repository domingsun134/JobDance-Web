-- Add optimization_summary column to resume_optimizations table if it doesn't exist
ALTER TABLE public.resume_optimizations 
ADD COLUMN IF NOT EXISTS optimization_summary TEXT;
