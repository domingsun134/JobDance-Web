-- Add cover_letter column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS cover_letter TEXT;
