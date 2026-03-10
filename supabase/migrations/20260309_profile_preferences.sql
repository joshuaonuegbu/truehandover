ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_preferences JSONB DEFAULT '{"emailAlerts": true, "pushNotifs": false, "twoFactor": true, "biometric": true}'::jsonb;