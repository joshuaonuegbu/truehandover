-- Grinlight V1 Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-------------------------------------------------------
-- 1. PROFILES (Extension of auth.users)
-------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar TEXT,
    role TEXT DEFAULT 'creator',
    subdomain TEXT UNIQUE,
    stripe_connect JSONB DEFAULT '{}'::jsonb,
    payment_methods JSONB DEFAULT '{}'::jsonb,
    agency_settings JSONB DEFAULT '{}'::jsonb,
    storage_settings JSONB DEFAULT '{}'::jsonb,
    profile_preferences JSONB DEFAULT '{"emailAlerts": true, "pushNotifs": false, "twoFactor": true, "biometric": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can only read/update their own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create a profile automatically when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-------------------------------------------------------
-- 2. PROJECTS (Vaults)
-------------------------------------------------------
CREATE TABLE public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    client JSONB NOT NULL DEFAULT '{}'::jsonb,
    amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'draft',
    client_link TEXT UNIQUE NOT NULL,
    due_date TIMESTAMPTZ,
    type TEXT,
    theme JSONB DEFAULT '{}'::jsonb,
    requires_signature BOOLEAN DEFAULT false,
    enable_tips BOOLEAN DEFAULT false,
    payment_methods JSONB DEFAULT '{}'::jsonb,
    use_milestones BOOLEAN DEFAULT false,
    message TEXT,
    enable_client_library BOOLEAN DEFAULT false,
    access_config JSONB DEFAULT '{}'::jsonb,
    client_viewed_at TIMESTAMPTZ,
    show_watermark BOOLEAN DEFAULT true,
    show_protected_label BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Creators own their projects. (Client access will be handled via an Edge Function later, or an open read-policy via the client_link)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage their own projects" ON public.projects
    USING (auth.uid() = user_id);

-- Policy to allow anonymous/client viewing if they have the exact client_link
-- REMOVED: open anonymous select policy.
-- Client project access should be mediated by Edge Functions that validate signed access links/tokens.


-------------------------------------------------------
-- 3. FILES (Assets)
-------------------------------------------------------
CREATE TABLE public.files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    size TEXT,
    type TEXT NOT NULL,
    locked BOOLEAN DEFAULT true,
    preview_url TEXT,
    external_url TEXT,
    storage_provider TEXT DEFAULT 'native',
    version INT DEFAULT 1,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    tag TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    milestone_id TEXT,
    include_in_library BOOLEAN DEFAULT false,
    import_source_url TEXT,
    folder_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage their files" ON public.files
    USING (auth.uid() = user_id);
-- Client read policy (Simplified: read if project is read)
-- REMOVED: open anonymous select policy.
-- File access should be returned only through backend-validated, time-limited signed URLs.


-------------------------------------------------------
-- 4. MILESTONES
-------------------------------------------------------
CREATE TABLE public.milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending',
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage milestones" ON public.milestones
    USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = milestones.project_id AND projects.user_id = auth.uid()));
-- REMOVED: open anonymous select policy.


-------------------------------------------------------
-- 5. CREDENTIALS
-------------------------------------------------------
CREATE TABLE public.credentials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    service_name TEXT NOT NULL,
    username TEXT,
    password TEXT, -- Encrypted at rest
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can manage credentials" ON public.credentials
    USING (EXISTS (SELECT 1 FROM public.projects WHERE projects.id = credentials.project_id AND projects.user_id = auth.uid()));
-- REMOVED: open anonymous select policy.


-------------------------------------------------------
-- 6. ACTIVITY LOGS
-------------------------------------------------------
CREATE TABLE public.activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can view their activity" ON public.activity_logs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Creators can insert activity" ON public.activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);


-------------------------------------------------------
-- 7. STRIPE WEBHOOK RECEIPTS (Idempotency)
-------------------------------------------------------
-- Stores processed webhook event IDs so our webhook handler is idempotent.
CREATE TABLE IF NOT EXISTS public.stripe_webhook_receipts (
    event_id TEXT PRIMARY KEY,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    event_type TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);
