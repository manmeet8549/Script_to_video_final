// Hand-authored database types matching supabase/migrations/0001_core_schema.sql.
// Shape is compatible with the supabase-js `Database` generic.

export type WorkspaceRole = "owner" | "admin" | "user" | "editor" | "support" | "viewer";
export type MemberStatus = "active" | "pending" | "suspended";
export type WorkspaceStatus = "active" | "suspended" | "archived";
export type ProjectStatus =
  | "idea"
  | "scripting"
  | "voice_gen"
  | "video_gen"
  | "editing"
  | "review"
  | "published"
  | "archived";
export type ProjectPriority = "low" | "medium" | "high" | "urgent";
export type StageName = "idea" | "script" | "voice" | "video" | "editing" | "review" | "publish";
export type StageStatus = "pending" | "in_progress" | "completed" | "failed" | "skipped";
export type GenerationStatus = "pending" | "generating" | "completed" | "failed";
export type EditType = "ai" | "manual";
export type EditStatus =
  | "pending"
  | "in_progress"
  | "review"
  | "under_review"
  | "revision_requested"
  | "approved"
  | "completed"
  | "rejected";
export type PublishStatus = "draft" | "scheduled" | "publishing" | "published" | "failed";
export type Visibility = "public" | "unlisted" | "private";
export type ProviderKind = "script" | "voice" | "video" | "editing" | "publishing";
export type CreditKind = "script" | "voice" | "video" | "publish";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "changes_requested";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  is_platform_owner: boolean;
  password_plain?: string | null;
  created_at: string;
  updated_at: string;
}

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  description: string | null;
  logo_url: string | null;
  status: WorkspaceStatus;
  subscription_tier: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type WorkspaceMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  status: MemberStatus;
  invited_by: string | null;
  password_changed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type WorkspaceApi = {
  id: string;
  workspace_id: string;
  provider: ProviderKind;
  api_name: string;
  provider_key: string;
  api_key_encrypted: string;
  api_secret_encrypted: string | null;
  endpoint_url: string | null;
  is_active: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type Project = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  created_by: string | null;
  assigned_to: string | null;
  deadline: string | null;
  progress_percent: number;
  thumbnail_url: string | null;
  video_url: string | null;
  published_urls: Array<{ platform: string; url: string; published_at?: string }>;
  created_at: string;
  updated_at: string;
}

export type ProjectStage = {
  id: string;
  project_id: string;
  stage_name: StageName;
  status: StageStatus;
  started_at: string | null;
  completed_at: string | null;
  assigned_to: string | null;
  notes: string | null;
  output_data: Record<string, unknown>;
  created_at: string;
}

export type Script = {
  id: string;
  project_id: string;
  content: string;
  tone: string;
  language: string;
  word_count: number | null;
  estimated_duration: number | null;
  ai_generated: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type VoiceGeneration = {
  id: string;
  project_id: string;
  script_id: string | null;
  voice_provider: string;
  voice_id: string;
  audio_url: string | null;
  duration: number | null;
  status: GenerationStatus;
  provider_job_id: string | null;
  settings: Record<string, unknown>;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export type VideoGeneration = {
  id: string;
  project_id: string;
  voice_generation_id: string | null;
  video_provider: string;
  video_url: string | null;
  status: GenerationStatus;
  provider_job_id: string | null;
  settings: Record<string, unknown>;
  error: string | null;
  thumbnail_url: string | null;
  r2_key: string | null;
  thumbnail_r2_key: string | null;
  file_size_bytes: number | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export type EditingTask = {
  id: string;
  project_id: string;
  editor_id: string | null;
  requested_by: string | null;
  edit_type: EditType;
  edit_provider: string | null;
  status: EditStatus;
  instructions: string | null;
  source_video_url: string | null;
  edited_video_url: string | null;
  provider_job_id: string | null;
  feedback: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export type PublishingTask = {
  id: string;
  project_id: string;
  platform: string;
  publish_provider: string | null;
  status: PublishStatus;
  scheduled_at: string | null;
  published_at: string | null;
  platform_video_id: string | null;
  provider_job_id: string | null;
  title: string | null;
  description: string | null;
  tags: string[] | null;
  thumbnail_url: string | null;
  custom_thumbnail_url: string | null;
  visibility: Visibility;
  settings: Record<string, unknown>;
  error: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type SocialAccount = {
  id: string;
  workspace_id: string;
  user_id: string | null;
  platform: "youtube" | "tiktok" | "instagram" | "linkedin" | "facebook" | "x";
  zernio_account_id: string;
  channel_name: string | null;
  account_handle: string | null;
  is_default: boolean;
  access_token: string | null;
  created_at: string;
  updated_at: string;
}

export type PublishedVideo = {
  id: string;
  workspace_id: string;
  project_id: string | null;
  video_url: string | null;
  platform: string;
  social_account_id: string | null;
  status: string;
  external_post_id: string | null;
  watch_url: string | null;
  title: string | null;
  description: string | null;
  tags: string[] | null;
  scheduled_at: string | null;
  published_at: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}


export type CreditWallet = {
  id: string;
  workspace_id: string;
  script_credits: number;
  voice_credits: number;
  video_credits: number;
  publish_credits: number;
  storage_limit_gb: number;
  storage_used_bytes: number;
  created_at: string;
  updated_at: string;
}

export type CreditTransaction = {
  id: string;
  workspace_id: string;
  project_id: string | null;
  kind: CreditKind;
  amount: number;
  balance_after: number | null;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

export type EditedVideo = {
  id: string;
  editing_task_id: string;
  version: number;
  video_url: string | null;
  r2_key: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export type ApprovalItem = {
  id: string;
  workspace_id: string;
  project_id: string | null;
  publishing_task_id: string | null;
  status: ApprovalStatus;
  requested_by: string | null;
  decided_by: string | null;
  feedback: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

export type Notification = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  type: "deadline" | "deadline_reminder" | "edit_request" | "edit_complete" | "edit_rejected" | "publish_complete" | "publish_failed" | "stage_complete" | "mention" | "invite" | "system";
  title: string;
  message: string | null;
  related_project_id: string | null;
  related_task_id: string | null;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

// Insert shape: the keys in R are required; everything else (DB defaults,
// generated columns) is optional.
type Insertable<T, R extends keyof T = never> = Partial<Omit<T, R>> & Pick<T, R>;

type TableDef<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
}

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<Profile, Insertable<Profile, "id" | "email">, Partial<Profile>>;
      workspaces: TableDef<Workspace, Insertable<Workspace, "name" | "slug" | "owner_id">, Partial<Workspace>>;
      workspace_members: TableDef<
        WorkspaceMember,
        Insertable<WorkspaceMember, "workspace_id" | "user_id" | "role">,
        Partial<WorkspaceMember>
      >;
      workspace_apis: TableDef<
        WorkspaceApi,
        Insertable<WorkspaceApi, "workspace_id" | "provider" | "api_name" | "provider_key" | "api_key_encrypted">,
        Partial<WorkspaceApi>
      >;
      projects: TableDef<Project, Insertable<Project, "workspace_id" | "title">, Partial<Project>>;
      project_stages: TableDef<
        ProjectStage,
        Insertable<ProjectStage, "project_id" | "stage_name">,
        Partial<ProjectStage>
      >;
      scripts: TableDef<Script, Insertable<Script, "project_id" | "content">, Partial<Script>>;
      voice_generations: TableDef<
        VoiceGeneration,
        Insertable<VoiceGeneration, "project_id" | "voice_provider" | "voice_id">,
        Partial<VoiceGeneration>
      >;
      video_generations: TableDef<
        VideoGeneration,
        Insertable<VideoGeneration, "project_id" | "video_provider">,
        Partial<VideoGeneration>
      >;
      editing_tasks: TableDef<
        EditingTask,
        Insertable<EditingTask, "project_id" | "edit_type">,
        Partial<EditingTask>
      >;
      publishing_tasks: TableDef<
        PublishingTask,
        Insertable<PublishingTask, "project_id" | "platform">,
        Partial<PublishingTask>
      >;
      social_accounts: TableDef<
        SocialAccount,
        Insertable<SocialAccount, "workspace_id" | "platform" | "zernio_account_id">,
        Partial<SocialAccount>
      >;
      published_videos: TableDef<
        PublishedVideo,
        Insertable<PublishedVideo, "workspace_id" | "platform">,
        Partial<PublishedVideo>
      >;
      credit_wallets: TableDef<
        CreditWallet,
        Insertable<CreditWallet, "workspace_id">,
        Partial<CreditWallet>
      >;
      credit_transactions: TableDef<
        CreditTransaction,
        Insertable<CreditTransaction, "workspace_id" | "kind" | "amount">,
        Partial<CreditTransaction>
      >;
      edited_videos: TableDef<
        EditedVideo,
        Insertable<EditedVideo, "editing_task_id">,
        Partial<EditedVideo>
      >;
      approval_items: TableDef<
        ApprovalItem,
        Insertable<ApprovalItem, "workspace_id">,
        Partial<ApprovalItem>
      >;
      notifications: TableDef<
        Notification,
        Insertable<Notification, "user_id" | "type" | "title">,
        Partial<Notification>
      >;
    };
    // NOTE: must be an empty object type WITHOUT a string index signature.
    // Supabase resolves table lookups as `Tables & Views`; a `[string]: never`
    // index signature here would collapse every table to `never`.
    Views: Record<never, never>;
    Functions: {
      auth_workspace_ids: { Args: Record<string, never>; Returns: string[] };
      has_workspace_role: { Args: { p_workspace_id: string; p_roles: string[] }; Returns: boolean };
      is_platform_owner: { Args: Record<string, never>; Returns: boolean };
      bootstrap_owner: {
        Args: { p_email: string; p_workspace_name?: string; p_workspace_slug?: string };
        Returns: string;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
