-- Migration v4: Add profile fields for lead qualification
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS position text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS geography text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS biggest_bottleneck text;
