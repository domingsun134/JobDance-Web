-- Add optimized_cover_letter column to resume_optimizations table
ALTER TABLE public.resume_optimizations 
ADD COLUMN IF NOT EXISTS optimized_cover_letter TEXT;
