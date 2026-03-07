-- Migration: Add nudge tracking to projects + audit log action types
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Add last_nudge_sent_at to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS last_nudge_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.projects.last_nudge_sent_at IS
  'Tracks when the most recent payment nudge email was sent to the client. 
   Used to enforce a 3-day minimum cooldown between reminders.';

CREATE INDEX IF NOT EXISTS idx_projects_nudge_status
  ON public.projects (status, last_nudge_sent_at)
  WHERE status = 'awaiting_payment';

-- 2. Ensure activity_logs.action is not constrained to a fixed set
--    (it's TEXT so no enum migration needed, but we document expected values here)
COMMENT ON COLUMN public.activity_logs.action IS
  'Action type. Known values: payment_received, PAYMENT_SESSION_INIT,
   MANUAL_PAYMENT_VERIFIED, file_uploaded, project_completed,
   audit_trail_generated, nudge_sent, client_viewed';
