-- ============================================================================
-- 0006_zernio_publish_flow.sql
-- Creates tables for social account connections and published videos history,
-- enabling Row Level Security (RLS) policies scoped by workspace memberships.
-- ============================================================================

-- SOCIAL ACCOUNTS
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id             uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  platform            text NOT NULL CHECK (platform IN ('youtube', 'tiktok', 'instagram', 'linkedin', 'facebook', 'x')),
  zernio_account_id   text NOT NULL,
  channel_name        text,
  account_handle      text,
  is_default          boolean NOT NULL DEFAULT false,
  access_token        text, -- encrypted placeholder
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, platform, zernio_account_id)
);

-- PUBLISHED VIDEOS
CREATE TABLE IF NOT EXISTS public.published_videos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  project_id          uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  video_url           text, -- URL referencing R2 media or local uploads
  platform            text NOT NULL,
  social_account_id   uuid REFERENCES public.social_accounts(id) ON DELETE SET NULL,
  status              text NOT NULL DEFAULT 'Preparing video...',
  external_post_id    text,
  watch_url           text,
  title               text,
  description         text,
  tags                text[],
  scheduled_at        timestamptz,
  published_at        timestamptz,
  error               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_social_accounts_ws ON public.social_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_user ON public.social_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_published_videos_ws ON public.published_videos(workspace_id);
CREATE INDEX IF NOT EXISTS idx_published_videos_project ON public.published_videos(project_id);

-- Enable RLS
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS social_accounts_select ON public.social_accounts;
CREATE POLICY social_accounts_select ON public.social_accounts
  FOR SELECT USING (workspace_id IN (SELECT public.auth_workspace_ids()));

DROP POLICY IF EXISTS social_accounts_write ON public.social_accounts;
CREATE POLICY social_accounts_write ON public.social_accounts
  FOR ALL USING (workspace_id IN (SELECT public.auth_workspace_ids()))
  WITH CHECK (workspace_id IN (SELECT public.auth_workspace_ids()));

DROP POLICY IF EXISTS published_videos_select ON public.published_videos;
CREATE POLICY published_videos_select ON public.published_videos
  FOR SELECT USING (workspace_id IN (SELECT public.auth_workspace_ids()));

DROP POLICY IF EXISTS published_videos_write ON public.published_videos;
CREATE POLICY published_videos_write ON public.published_videos
  FOR ALL USING (workspace_id IN (SELECT public.auth_workspace_ids()))
  WITH CHECK (workspace_id IN (SELECT public.auth_workspace_ids()));

-- Trigger set_updated_at
DROP TRIGGER IF EXISTS trg_social_accounts_updated_at ON public.social_accounts;
CREATE TRIGGER trg_social_accounts_updated_at BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_published_videos_updated_at ON public.published_videos;
CREATE TRIGGER trg_published_videos_updated_at BEFORE UPDATE ON public.published_videos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
