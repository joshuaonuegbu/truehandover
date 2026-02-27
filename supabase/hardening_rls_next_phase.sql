-- Next-phase RLS hardening patch
-- Run this in Supabase SQL Editor for EXISTING environments already initialized from schema.sql.

BEGIN;

DROP POLICY IF EXISTS "Clients can view project by client_link" ON public.projects;
DROP POLICY IF EXISTS "Clients can view files of projects" ON public.files;
DROP POLICY IF EXISTS "Clients can view milestones" ON public.milestones;
DROP POLICY IF EXISTS "Clients can view credentials" ON public.credentials;

COMMIT;
